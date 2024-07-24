import express, { Router } from 'express';
import Limiter from '../helpers/requestLimiter';
import { VerifyToken } from '../middleware/auth/authUser';
import { cancelSubscription, getSubscriptionDetails, getUserDetails } from '../controller/user.controller';

const router: Router = express.Router();

// GetUserDetails
router.get('/get-user-details', [VerifyToken], getUserDetails);
// GetSubscriptionDetails
router.get('/get-subscription-details', [VerifyToken], getSubscriptionDetails);
// CancelSubscription
router.post('/cancel-subscription', [Limiter, VerifyToken], cancelSubscription);


export default router;