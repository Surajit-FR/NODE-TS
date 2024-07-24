import { Request, Response } from 'express';
import Stripe from 'stripe';
import stripe from '../config/stripeConfig';
import {
    handleCheckoutSessionCompleted,
    handlePaymentIntentSucceeded,
    handlePaymentIntentFailed,
    handleInvoicePaid,
    handleInvoicePaymentFailed,
    handleSubscriptionUpdated,
    handleCheckoutSessionAsyncPaymentFailed
} from '../services/webhook.service';

// handleStripeWebhook
export const handleStripeWebhook = async (req: Request, res: Response): Promise<Response> => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook Error:', (err as Error).message);
        return res.status(400).json({ success: false, message: 'Webhook Error' });
    }

    // Handle the event based on its type
    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
            break;
        case 'checkout.session.async_payment_failed':
            await handleCheckoutSessionAsyncPaymentFailed(event.data.object as Stripe.Checkout.Session);
            break;
        case 'payment_intent.succeeded':
            await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
            break;
        case 'payment_intent.payment_failed':
            await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
            break;
        case 'invoice.paid':
            await handleInvoicePaid(event.data.object as Stripe.Invoice);
            break;
        case 'invoice.payment_failed':
            await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
            break;
        case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
            break;
        default:
            console.warn(`Unhandled event type: ${event.type}`);
            break;
    }

    return res.json({ received: true });
};