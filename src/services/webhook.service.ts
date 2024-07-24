import Stripe from 'stripe';
import UserModel from '../model/user.model';
import { SendEmail } from '../helpers/sendEmail';
import stripe from '../config/stripeConfig';
import { scheduleReminder } from '../services/notification.service';
import moment from 'moment';

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

// Handler for checkout.session.completed
export const handleCheckoutSessionCompleted = async (checkoutSession: Stripe.Checkout.Session) => {
    const userEmail = await fetchCustomerEmail(checkoutSession.customer as string);
    if (userEmail) {
        SendEmail({
            receiver: userEmail,
            subject: 'Subscription Created',
            htmlContent: 'Your subscription has been successfully created.'
        });
    }
};

// Handler for async_payment_failed
export const handleCheckoutSessionAsyncPaymentFailed = async (checkoutSession: Stripe.Checkout.Session) => {
    const userEmail = await fetchCustomerEmail(checkoutSession.customer as string);
    if (userEmail) {
        const user = await UserModel.findOne({ "subscription.sessionId": checkoutSession.id });
        if (user) {
            const subscriptionId = user.subscription.subscriptionId;
            if (subscriptionId) {
                await stripe.subscriptions.update(subscriptionId, {
                    items: [{
                        id: user.subscription.subscriptionId,
                        price: user.subscription.previous_price,
                    }],
                    proration_behavior: 'none',
                });

                await UserModel.findOneAndUpdate(
                    { "subscription.sessionId": checkoutSession.id },
                    {
                        $set: {
                            "subscription.planId": user.subscription.previous_plan_id,
                            "subscription.planType": user.subscription.previous_plan_type,
                            "subscription.planStartDate": null,
                            "subscription.planEndDate": null,
                            "subscription.planDuration": "",
                            "is_subscribed": false
                        }
                    }
                );
            }
            SendEmail({
                receiver: userEmail,
                subject: 'Payment Failed',
                htmlContent: 'Your subscription payment failed. Please try again.'
            });
        }
    }
};

// Handler for payment_intent.succeeded
export const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
    const succeededEmail = await fetchCustomerEmail(paymentIntent.customer as string);
    if (succeededEmail) {
        SendEmail({
            receiver: succeededEmail,
            subject: 'Payment Succeeded',
            htmlContent: 'Your payment has been successfully processed.'
        });
    }
};

// Handler for payment_intent.payment_failed
export const handlePaymentIntentFailed = async (failedPaymentIntent: Stripe.PaymentIntent) => {
    const failedPaymentEmail = await fetchCustomerEmail(failedPaymentIntent.customer as string);
    if (failedPaymentEmail) {
        console.log('Payment Failed', 'Your payment has failed. Please try again or update your payment method.');
    }
};

// Handler for invoice.paid
export const handleInvoicePaid = async (invoice: Stripe.Invoice) => {
    const paidEmail = await fetchCustomerEmail(invoice.customer as string);
    if (paidEmail) {
        SendEmail({
            receiver: paidEmail,
            subject: 'Invoice Paid',
            htmlContent: 'Your invoice has been paid successfully.'
        });
    }
};

// Handler for invoice.payment_failed
export const handleInvoicePaymentFailed = async (failedInvoice: Stripe.Invoice) => {
    const failedEmail = await fetchCustomerEmail(failedInvoice.customer as string);
    if (failedEmail) {
        console.log('Invoice Payment Failed', 'Your invoice payment has failed. Please update your payment method.');
    }
};

// Handler for customer.subscription.updated
export const handleSubscriptionUpdated = async (subscriptionUpdated: Stripe.Subscription) => {
    const updatedEmail = await fetchCustomerEmail(subscriptionUpdated.customer as string);
    if (updatedEmail) {
        const subscriptionStatus = subscriptionUpdated.status;
        let emailSubject = 'Subscription Updated';
        let emailMessage = 'Your subscription has been updated.';

        const subscriptionDataToUpdate: any = {
            'subscription.planId': subscriptionUpdated.items.data[0].plan.id || "",
            'subscription.planType': subscriptionUpdated.items.data[0].plan.interval || "",
            'subscription.planStartDate': subscriptionUpdated.start_date ? new Date(subscriptionUpdated.start_date * 1000) : null,
            'subscription.planEndDate': subscriptionUpdated.current_period_end ? new Date(subscriptionUpdated.current_period_end * 1000) : null,
            'subscription.planDuration': subscriptionUpdated.start_date && subscriptionUpdated.current_period_end ?
                calculateDurationInDays(new Date(subscriptionUpdated.start_date * 1000), new Date(subscriptionUpdated.current_period_end * 1000)).toString() :
                "",
            'is_subscribed': subscriptionStatus === 'active'
        };

        if (subscriptionUpdated.cancellation_details?.reason === 'cancellation_requested') {
            subscriptionDataToUpdate['subscription.subscriptionId'] = "";
            subscriptionDataToUpdate['subscription.customerId'] = "";
            subscriptionDataToUpdate['subscription.planStartDate'] = null;
            subscriptionDataToUpdate['subscription.planEndDate'] = null;
            subscriptionDataToUpdate['subscription.planDuration'] = "";
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
};
