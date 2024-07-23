import { Request, Response } from 'express';
import UserModel from '../model/user.model';
import moment from 'moment';
import { scheduleReminder } from '../services/notification.service';
import { SendEmail } from '../helpers/sendEmail';
import stripe from '../config/stripeConfig';
import Stripe from 'stripe';

// Helper function to fetch customer email
const fetchCustomerEmail = async (customerId: string): Promise<string | null> => {
    try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && (customer as Stripe.Customer).email) {
            return (customer as Stripe.Customer).email as string;
        }
        return null;
    } catch (error) {
        console.error('Error fetching customer email:', error);
        return null;
    }
};

// Function to calculate duration in days
const calculateDurationInDays = (startDate: Date, endDate: Date): number => {
    const start = moment(startDate);
    const end = moment(endDate);
    return end.diff(start, 'days');
};

// Handle Stripe Webhook
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
    if (event.type === 'checkout.session.completed') {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userEmail = await fetchCustomerEmail(checkoutSession.customer as string);
        if (userEmail) {
            const user = await UserModel.findOne({ "subscription.sessionId": checkoutSession.id });
            if (user) {
                const existingSubscriptionId = user.subscription.subscriptionId;
                if (existingSubscriptionId) {
                    const existingSubscription = await stripe.subscriptions.retrieve(existingSubscriptionId);
                    if (existingSubscription && existingSubscription.status === 'active') {
                        await stripe.subscriptions.update(existingSubscriptionId, {
                            cancel_at_period_end: true,
                        });
                    }
                }
                SendEmail({
                    receiver: userEmail,
                    subject: 'Subscription Created',
                    htmlContent: 'Your subscription has been successfully created.'
                });
            }
        }
    } else if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const succeededEmail = await fetchCustomerEmail(paymentIntent.customer as string);
        if (succeededEmail) {
            SendEmail({
                receiver: succeededEmail,
                subject: 'Payment Succeeded',
                htmlContent: 'Your payment has been successfully processed.'
            });
        }
    } else if (event.type === 'payment_intent.payment_failed') {
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        const failedPaymentEmail = await fetchCustomerEmail(failedPaymentIntent.customer as string);
        if (failedPaymentEmail) {
            console.log('Payment Failed', 'Your payment has failed. Please try again or update your payment method.');
        }
    } else if (event.type === 'invoice.paid') {
        const invoice = event.data.object as Stripe.Invoice;
        const paidEmail = await fetchCustomerEmail(invoice.customer as string);
        if (paidEmail) {
            SendEmail({
                receiver: paidEmail,
                subject: 'Invoice Paid',
                htmlContent: 'Your invoice has been paid successfully.'
            });
        }
    } else if (event.type === 'invoice.payment_failed') {
        const failedInvoice = event.data.object as Stripe.Invoice;
        const failedEmail = await fetchCustomerEmail(failedInvoice.customer as string);
        if (failedEmail) {
            console.log('Invoice Payment Failed', 'Your invoice payment has failed. Please update your payment method.');
        }
    } else if (event.type === 'customer.subscription.updated') {
        const subscriptionUpdated = event.data.object as Stripe.Subscription;
        const updatedEmail = await fetchCustomerEmail(subscriptionUpdated.customer as string);
        if (updatedEmail) {
            const subscriptionStatus = subscriptionUpdated.status;
            let emailSubject = 'Subscription Updated';
            let emailMessage = 'Your subscription has been updated.';

            const subscriptionDataToUpdate: {
                'subscription.planId': string;
                'subscription.planType': string;
                'subscription.planStartDate': Date | null;
                'subscription.planEndDate': Date | null;
                'subscription.planDuration': string; // Ensure this is a string
                'is_subscribed': boolean;
            } = {
                'subscription.planId': subscriptionUpdated.items.data[0].plan.id || "",
                'subscription.planType': subscriptionUpdated.items.data[0].plan.interval || "",
                'subscription.planStartDate': subscriptionUpdated.start_date ? new Date(subscriptionUpdated.start_date * 1000) : null,
                'subscription.planEndDate': subscriptionUpdated.current_period_end ? new Date(subscriptionUpdated.current_period_end * 1000) : null,
                'subscription.planDuration': subscriptionUpdated.start_date && subscriptionUpdated.current_period_end ?
                    calculateDurationInDays(new Date(subscriptionUpdated.start_date * 1000), new Date(subscriptionUpdated.current_period_end * 1000)).toString() : // Convert number to string
                    "",
                'is_subscribed': subscriptionStatus === 'active'
            };

            if (subscriptionUpdated.cancellation_details?.reason === 'cancellation_requested') {
                subscriptionDataToUpdate['subscription.planStartDate'] = null;
                subscriptionDataToUpdate['subscription.planEndDate'] = null;
                subscriptionDataToUpdate['subscription.planDuration'] = ""; // This should be a string as per schema
                subscriptionDataToUpdate['is_subscribed'] = false;
                emailSubject = 'Subscription Canceled';
                emailMessage = 'Your subscription has been canceled.';
            }

            SendEmail({
                receiver: updatedEmail,
                subject: emailSubject,
                htmlContent: emailMessage
            });

            if (subscriptionStatus === 'active' && subscriptionUpdated.current_period_end) {
                const subscriptionEndDate = new Date(subscriptionUpdated.current_period_end * 1000);
                scheduleReminder(updatedEmail, subscriptionEndDate);
            }

            await UserModel.findOneAndUpdate(
                { email: updatedEmail },
                subscriptionDataToUpdate
            );
        }
    } else {
        console.warn(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
};
