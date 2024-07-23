import express, { Router } from 'express';
import Limiter from '../helpers/request_limiter';
import ModelAuth from '../middleware/auth/modelAuth';
import { validateSubscriptionPlan } from '../model/validator/subscriptionPlanSchema.validate';
import { VerifyToken } from '../middleware/auth/authUser';
import { addSubscriptionPlan, getSubscriptionPlans } from '../controller/subscription.controller';

const router: Router = express.Router();

// AddSubscriptionPlan
router.post('/add-subscription-plan', [Limiter, ModelAuth(validateSubscriptionPlan)], addSubscriptionPlan);
// GetSubscriptionPlans
router.get('/get-subscription-plans', [Limiter, VerifyToken], getSubscriptionPlans);

export default router;
