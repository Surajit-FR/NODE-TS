import express from 'express';
import { handleStripeWebhook } from '../controller/webhook.controller';

const stripeApp = express.Router();
stripeApp.use(express.raw({ type: "*/*" }));
stripeApp.post('/', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default stripeApp;