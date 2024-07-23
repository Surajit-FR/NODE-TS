import { Response } from 'express';
import moment from 'moment';
import { CustomRequest, DecodedToken, IUser, Product } from '../../types/types';
import UserModel from '../model/user.model';
import stripe from '../config/stripeConfig';
import SubscriptionPlanModel from '../model/subscriptionPlan.model';
import CreateToken from '../helpers/createToken';
import { createStripeSession } from '../services/stripe.service';


// CreateCheckoutSession
export const CreateCheckoutSession = async (req: CustomRequest, res: Response): Promise<Response> => {
    const { product }: { product: Product } = req.body;

    try {
        const decodedToken = req.decoded_token as DecodedToken;
        if (!decodedToken) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const userID = decodedToken._id;
        let customerID = decodedToken.subscription?.customerId;

        // Check the existing user
        const existingUser = await UserModel.findById(userID).exec();
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        // Create a new Stripe customer if customerId is not present
        if (!customerID) {
            const customer = await stripe.customers.create({
                email: existingUser.email,
                name: existingUser.name,
                metadata: { userId: userID }
            });
            customerID = customer.id;

            // Update user record with the new customerId
            await UserModel.findByIdAndUpdate(userID, {
                'subscription.customerId': customerID
            }, { new: true }).exec();
        }

        // Now create the Stripe checkout session
        const session = await createStripeSession(product.stripe_price_id, userID);

        if (session.error) {
            return res.status(409).json({ success: false, message: session.error });
        }

        // Update the user with sessionID
        await UserModel.findByIdAndUpdate(userID, {
            'subscription.sessionId': session.id,
            'subscription.subscriptionId': session.subscription,
        }, { new: true }).exec();

        return res.status(201).json({ id: session.id });
    } catch (exc: any) {
        console.log(exc.message);
        return res.status(500).json({ success: false, message: exc.message, error: "Internal Server Error" });
    }
};

// PaymentSuccess
export const PaymentSuccess = async (req: CustomRequest, res: Response): Promise<Response> => {
    try {
        const decodedToken = req.decoded_token as DecodedToken;
        const userID = decodedToken._id;
        const sessionID: string = req.body._sessionID;

        // Retrieve the Stripe session
        const session = await stripe.checkout.sessions.retrieve(sessionID);

        if (session.payment_status === "paid") {
            // Ensure subscriptionId is a string
            const subscriptionId = session.subscription as string;

            if (!subscriptionId) {
                return res.status(400).json({ success: false, message: "Subscription ID is missing!" });
            }

            // Retrieve the Stripe subscription
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            // Check the existing user
            const existingUser = await UserModel.findById(userID).exec();
            if (!existingUser) {
                return res.status(404).json({ success: false, message: "User not found!" });
            }

            const planId = subscription.items.data[0].price.id;
            const subscriptionPlan = await SubscriptionPlanModel.findOne({ stripe_price_id: planId }).exec();

            if (!subscriptionPlan) {
                return res.status(404).json({ success: false, message: "Subscription plan not found!" });
            }

            const customerId = subscription.customer as string;
            const planType = subscriptionPlan.type;
            const startDate = moment.unix(subscription.current_period_start).format('YYYY-MM-DD');
            const endDate = moment.unix(subscription.current_period_end).format('YYYY-MM-DD');
            const durationInSeconds = (subscription.current_period_end - subscription.current_period_start);
            const durationInDays = moment.duration(durationInSeconds, 'seconds').asDays();

            // Update the user with subscription data
            const userData = await UserModel.findByIdAndUpdate(userID, {
                'subscription.subscriptionId': subscription.id,
                'subscription.customerId': customerId,
                'subscription.sessionId': "",
                'subscription.planId': planId,
                'subscription.planType': planType,
                'subscription.planStartDate': startDate,
                'subscription.planEndDate': endDate,
                'subscription.planDuration': durationInDays,
                is_subscribed: true,
            }, { new: true }).exec();

            if (!userData) {
                return res.status(404).json({ success: false, message: "Failed to update user data!" });
            }

            const tokenData = CreateToken(userData as IUser);
            return res.status(201).json({ success: true, message: "Payment Successful!", data: userData, token: tokenData });
        }
        return res.status(400).json({ success: false, message: "Payment not successful!" });
    } catch (exc: any) {
        console.log(exc.message);
        return res.status(500).json({ success: false, message: exc.message, error: "Internal Server Error" });
    }
};

// BillingPortal
export const BillingPortal = async (req: CustomRequest, res: Response): Promise<Response> => {
    try {
        const decodedToken = req.decoded_token as DecodedToken;
        const customerId = decodedToken.subscription?.customerId;

        if (!customerId) {
            return res.status(400).json({ success: false, message: "You don't have any subscription to view. Please add one!" });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.HOST}:${process.env.FRONTEND_PORT}/profile`
        });

        return res.status(201).json({ success: true, message: "New billing portal session created!", data: portalSession });
    } catch (exc: any) {
        console.log(exc.message);
        return res.status(500).json({ success: false, message: exc.message, error: "Internal Server Error" });
    }
};

// UpdateSubscription
export const UpdateSubscription = async (req: CustomRequest, res: Response): Promise<Response> => {
    const { product }: { product: Product } = req.body;
    const newPlanID = product.stripe_price_id;

    try {
        const decodedToken = req.decoded_token as DecodedToken;
        const userID = decodedToken._id;

        // Check the existing user
        const existingUser = await UserModel.findById(userID).exec();
        if (!existingUser || !existingUser.subscription || !existingUser.subscription.subscriptionId) {
            return res.status(404).json({ success: false, message: "User or subscription not found!" });
        }

        const subscriptionID = existingUser.subscription.subscriptionId;

        // Retrieve the current subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionID);

        // Calculate proration for the upgrade
        const prorationDate = Math.min(moment().unix(), subscription.current_period_end);

        // Update the subscription with proration
        const updatedSubscription = await stripe.subscriptions.update(subscriptionID, {
            items: [{
                id: subscription.items.data[0].id,
                price: newPlanID,
            }],
            proration_behavior: 'create_prorations',
            proration_date: prorationDate,
            expand: ['latest_invoice.payment_intent'],
        });

        // Now create the Stripe checkout session
        const session = await createStripeSession(newPlanID, userID);

        if (session.error) {
            await stripe.subscriptions.update(subscriptionID, {
                items: [{
                    id: updatedSubscription.items.data[0].id,
                    price: subscription.items.data[0].price.id,
                }],
                proration_behavior: 'none',
            });
            return res.status(409).json({ success: false, message: session.error });
        }

        await UserModel.findByIdAndUpdate(userID, {
            'subscription.sessionId': session.id,
            'subscription.subscriptionId': updatedSubscription.id,
        }, { new: true }).exec();

        return res.status(200).json({ success: true, sessionId: session.id });
    } catch (exc: any) {
        console.log(exc.message);
        return res.status(500).json({ success: false, message: exc.message, error: "Internal Server Error" });
    }
};
