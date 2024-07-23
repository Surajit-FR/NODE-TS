import express from 'express';
import { handleStripeWebhook } from '../controller/webhook.controller';

// Create an instance of Express Router
const stripeApp = express.Router();
// Middleware to parse raw body for Stripe webhooks
stripeApp.use(express.raw({ type: "*/*" }));
// Define the route to handle Stripe webhook events
stripeApp.post('/', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default stripeApp;