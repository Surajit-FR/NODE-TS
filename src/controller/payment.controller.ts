import { Response } from 'express';
import moment from 'moment';
import { CustomRequest, DecodedToken, IUser, Product } from '../../types/types';
import UserModel from '../model/user.model';
import stripe from '../config/stripeConfig';
import SubscriptionPlanModel from '../model/subscriptionPlan.model';
import CreateToken from '../helpers/createToken';
import { createStripeSession } from '../services/stripe.service';
import Stripe from 'stripe';


// CreateCheckoutSession
export const CreateCheckoutSession = async (req: CustomRequest, res: Response): Promise<Response> => {
    const { product } = req.body as { product: Product };

    try {
        const decoded_token = req.decoded_token as DecodedToken;
        const userID = decoded_token._id;
        const planID = product.stripe_price_id;
        let customerID = "";

        // Check the existing user
        const existingUser: IUser | null = await UserModel.findById(userID);
        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found!' });
        }

        // Use existing customer ID or create a new one if necessary
        customerID = existingUser.subscription.customerId || "";
        if (!customerID) {
            const customer = await stripe.customers.create({
                email: existingUser.email,
                name: existingUser.name,
                metadata: {
                    userId: existingUser._id.toString(),
                }
            });
            customerID = customer.id;

            // Update the user's customerId in the database
            await UserModel.findByIdAndUpdate(
                { _id: userID },
                { 'subscription.customerId': customerID },
                { new: true }
            );
        };

        // Now create the Stripe checkout session
        const session = await createStripeSession(planID, userID, customerID);

        if (session.error) {
            return res.status(409).json({ success: false, message: session.error });
        };

        // Update the user with sessionID
        await UserModel.findByIdAndUpdate(
            { _id: userID },
            {
                subscription: {
                    sessionId: session.id,
                    customerId: customerID,
                }
            },
            { new: true }
        );

        return res.status(201).json({ id: session.id });
    } catch (exc: any) {
        console.log(exc.message);
        return res.status(500).json({ success: false, message: exc.message, error: "Internal Server Error" });
    }
};

// PaymentSuccess
export const PaymentSuccess = async (req: CustomRequest, res: Response): Promise<Response> => {
    try {
        const decoded_token = req.decoded_token as DecodedToken;
        const userID = decoded_token._id;
        const sessionID = req.body._sessionID;

        const session = await stripe.checkout.sessions.retrieve(sessionID);

        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const planId = subscription.items.data[0].price.id;

        // Check the existing user
        const existingUser: IUser | null = await UserModel.findById(userID);
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        if (session.payment_status === "paid") {
            const subscriptionPlan = await SubscriptionPlanModel.findOne({ stripe_price_id: planId });

            if (!subscriptionPlan) {
                return res.status(404).json({ success: false, message: "Subscription plan not found!" });
            }

            const customerId = subscription.customer as string;
            const planType = subscriptionPlan.type;
            const startDate = moment.unix(subscription.current_period_start).format('YYYY-MM-DD');
            const endDate = moment.unix(subscription.current_period_end).format('YYYY-MM-DD');
            const durationInSeconds = subscription.current_period_end - subscription.current_period_start;
            const durationInDays = moment.duration(durationInSeconds, 'seconds').asDays();

            // Update the user with subscription data
            const USER_DATA = await UserModel.findByIdAndUpdate(
                userID,
                {
                    subscription: {
                        subscriptionId: subscription.id,
                        customerId: customerId,
                        sessionId: "",
                        planId: planId,
                        planType: planType,
                        planStartDate: startDate,
                        planEndDate: endDate,
                        planDuration: durationInDays,
                    },
                    is_subscribed: true,
                },
                { new: true }
            );

            if (!USER_DATA) {
                return res.status(500).json({ success: false, message: "Failed to update user subscription data" });
            }

            const tokenData = CreateToken(USER_DATA as IUser);
            return res.status(201).json({ success: true, message: "Payment Successful!", data: USER_DATA, token: tokenData });
        } else if (session.payment_status === "unpaid") {
            const currentItemId = subscription.items.data[0].id;

            await stripe.subscriptions.update(subscriptionId, {
                items: [{
                    id: currentItemId,
                    price: planId,
                }],
                proration_behavior: 'none',
            });

            await UserModel.findByIdAndUpdate(
                userID,
                {
                    $set: {
                        "subscription.subscriptionId": existingUser.subscription.subscriptionId,
                        "subscription.customerId": existingUser.subscription.customerId,
                        "subscription.sessionId": existingUser.subscription.sessionId,
                        "subscription.planId": existingUser.subscription.planId,
                        "subscription.planType": existingUser.subscription.planType,
                        "subscription.planStartDate": existingUser.subscription.planStartDate,
                        "subscription.planEndDate": existingUser.subscription.planEndDate,
                        "subscription.planDuration": existingUser.subscription.planDuration,
                        "is_subscribed": existingUser.is_subscribed,
                    }
                }
            );

            return res.status(200).json({ success: true, message: "Subscription updated for unpaid session" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid payment status" });
        }
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
            return_url: `${process.env.FRONTEND_HOST}/profile`
        });

        return res.status(201).json({ success: true, message: "New billing portal session created!", data: portalSession });
    } catch (exc: any) {
        console.log(exc.message);
        return res.status(500).json({ success: false, message: exc.message, error: "Internal Server Error" });
    }
};

// UpdateSubscription
export const UpdateSubscription = async (req: CustomRequest, res: Response): Promise<Response> => {
    const { product } = req.body as { product: Product };
    const newPlanID = product.stripe_price_id;

    try {
        const decodedToken = req.decoded_token as DecodedToken;
        const userID = decodedToken._id;

        const existingUser: IUser | null = await UserModel.findOne({ _id: userID });
        if (!existingUser || !existingUser.subscription || !existingUser.subscription.subscriptionId) {
            return res.status(404).json({ success: false, message: "User or subscription not found!" });
        }

        const subscriptionID = existingUser.subscription.subscriptionId;
        const subscription = await stripe.subscriptions.retrieve(subscriptionID);

        // Calculate the prorated amount
        const prorationDate = Math.min(moment().unix(), subscription.current_period_end);
        const updatedSubscription = await stripe.subscriptions.update(subscriptionID, {
            items: [{
                id: subscription.items.data[0].id,
                price: newPlanID,
            }],
            proration_behavior: 'create_prorations',
            proration_date: prorationDate,
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                userId: existingUser._id.toString(),
                userName: existingUser.name,
                userEmail: existingUser.email,
            }
        });

        const latestInvoice = updatedSubscription.latest_invoice as Stripe.Invoice;
        const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;
        const paymentIntentStatus = paymentIntent.status;

        if (paymentIntentStatus === 'succeeded') {
            // Update user subscription in database
            const subscriptionPlan = await SubscriptionPlanModel.findOne({ stripe_price_id: newPlanID });
            if (!subscriptionPlan) {
                return res.status(404).json({ success: false, message: "Subscription plan not found!" });
            }

            const planType = subscriptionPlan.type;
            const startDate = moment.unix(updatedSubscription.current_period_start).format('YYYY-MM-DD');
            const endDate = moment.unix(updatedSubscription.current_period_end).format('YYYY-MM-DD');
            const durationInSeconds = updatedSubscription.current_period_end - updatedSubscription.current_period_start;
            const durationInDays = moment.duration(durationInSeconds, 'seconds').asDays();

            const updatedUser: IUser | null = await UserModel.findByIdAndUpdate(
                userID,
                {
                    subscription: {
                        subscriptionId: updatedSubscription.id,
                        customerId: updatedSubscription.customer as string,
                        sessionId: paymentIntent.id,
                        planId: newPlanID,
                        planType: planType,
                        planStartDate: startDate,
                        planEndDate: endDate,
                        planDuration: durationInDays,
                    },
                    is_subscribed: true,
                },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(500).json({ success: false, message: "Failed to update user." });
            }

            const tokenData = CreateToken(updatedUser);
            return res.status(200).json({ success: true, message: "Your subscription has been updated!", data: updatedUser, token: tokenData });
        } else {
            return res.status(400).json({ success: false, message: 'Payment status is not succeeded.' });
        }
    } catch (exc: any) {
        console.error(exc.message);
        return res.status(500).json({ success: false, message: exc.message });
    }
};