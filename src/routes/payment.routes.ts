import express, { Router } from 'express';
import Limiter from '../helpers/request_limiter';
import { BillingPortal, CreateCheckoutSession, PaymentSuccess, UpdateSubscription } from '../controller/payment.controller';
import { VerifyToken } from '../middleware/auth/authUser';

const router: Router = express.Router();

// Create checkout session
router.post('/create-checkout-session', [Limiter, VerifyToken], CreateCheckoutSession);
// Update subscription
router.post('/update-subscription', [Limiter, VerifyToken], UpdateSubscription);
// Payment Success
router.post('/payment-success', [Limiter, VerifyToken], PaymentSuccess);
// Billing portal
router.post('/billing-portal', [Limiter, VerifyToken], BillingPortal);

export default router;