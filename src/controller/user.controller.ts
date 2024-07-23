import { Response } from 'express';
import UserModel from '../model/user.model';
import { CustomRequest, DecodedToken, IUser } from '../../types/types';
import stripe from '../config/stripeConfig';
import CreateToken from '../helpers/createToken';

// GetUserDetails
export const getUserDetails = async (req: CustomRequest, res: Response): Promise<Response> => {
    try {
        const decodedToken = req.decoded_token as DecodedToken;
        const userId = decodedToken._id;

        const existingUser = await UserModel.findOne({ _id: userId });
        if (!existingUser) {
            return res.status(400).json({ success: false, message: "User not found!" });
        }

        return res.status(200).json({ success: true, message: "User data fetched successfully!", data: existingUser });
    } catch (exc: any) {
        return res.status(500).json({ success: false, message: exc.message });
    }
};

// GetSubscriptionDetails
export const getSubscriptionDetails = async (req: CustomRequest, res: Response): Promise<Response> => {
    try {
        const decodedToken = req.decoded_token as DecodedToken;
        const customerId = decodedToken.subscription.customerId;
        // Retrieve subscriptions separately
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            limit: 1
        });

        const subscription = subscriptions.data[0];
        if (!subscription) {
            return res.status(404).json({ message: 'No subscription found for this customer.' });
        }

        // Retrieve plan details
        const priceId = subscription.items.data[0].price.id;
        const plan = await stripe.prices.retrieve(priceId);

        // Retrieve product details
        const product = await stripe.products.retrieve(plan.product as string);

        const data = {
            subscription,
            plan,
            product
        };

        return res.status(200).json({ success: true, message: "Data fetched successfully!", data: data });
    } catch (exc: any) {
        return res.status(500).json({ success: false, message: exc.message });
    }
};

// CancelSubscription
export const cancelSubscription = async (req: CustomRequest, res: Response): Promise<Response> => {
    try {
        const decodedToken = req.decoded_token as DecodedToken;
        const subscriptionId = decodedToken.subscription.subscriptionId;

        // Check if subscriptionId is valid before attempting to cancel
        if (!subscriptionId) {
            return res.status(400).json({ success: false, message: 'Subscription ID is missing or invalid.' });
        }

        // Cancel the subscription
        const canceledSub = await stripe.subscriptions.cancel(subscriptionId);

        if (!canceledSub || canceledSub.status !== 'canceled') {
            // If subscription was not canceled successfully
            return res.status(400).json({ success: false, message: 'Subscription is already canceled or cannot be canceled.' });
        }

        // Update the user with canceled subscription details
        const updatedUser = await UserModel.findByIdAndUpdate(
            { _id: decodedToken._id },
            {
                $set: {
                    is_subscribed: false,
                    "subscription.sessionId": "",
                    "subscription.planId": "",
                    "subscription.planType": "",
                    "subscription.planStartDate": null,
                    "subscription.planEndDate": null,
                    "subscription.planDuration": "",
                }
            },
            { new: true }
        );
        const tokenData = CreateToken(updatedUser as IUser);
        return res.status(200).json({ success: true, message: 'Subscription canceled successfully.', data: updatedUser, token: tokenData });
    } catch (exc: any) {
        return res.status(500).json({ success: false, message: exc.message });
    }
};
