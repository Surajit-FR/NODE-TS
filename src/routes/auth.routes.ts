import express, { Router } from 'express';
import Limiter from '../helpers/request_limiter';
import ModelAuth from '../middleware/auth/modelAuth';
import ValidateUser from '../model/validator/userSchema.validate';
import { HandleRegularLoginError } from '../middleware/auth/credsValidation';
import { DuplicateUserCheck } from '../middleware/auth/duplicateCheck';
import { LoginRegular, RegisterRegular } from '../controller/auth/auth.controller';

const router: Router = express.Router();

/**************************************************** ADMIN AUTH ROUTES ****************************************************/

// Sign-Up
router.post('/signup', [Limiter, ModelAuth(ValidateUser), DuplicateUserCheck], RegisterRegular);
// Login
router.post('/login', [Limiter, HandleRegularLoginError], LoginRegular);

export default router;
