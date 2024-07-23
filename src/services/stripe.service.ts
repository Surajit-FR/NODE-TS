import stripe from "../config/stripeConfig";
import { StripeSessionResponse } from "../../types/types";

// createStripeSession function
export const createStripeSession = async (planID: string, userID: string): Promise<StripeSessionResponse> => {
    try {
        // Create a new Stripe session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: planID,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.HOST}:${process.env.FRONTEND_PORT}/success/{CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.HOST}:${process.env.FRONTEND_PORT}/cancel`,
            metadata: {
                userId: userID
            }
        });

        // Replace the placeholder with the actual session ID
        const successUrl = session.success_url?.replace('{CHECKOUT_SESSION_ID}', session.id || '');

        return {
            id: session.id,
            success_url: successUrl,
        };

    } catch (error) {
        return { error: (error as Error).message };
    };
};