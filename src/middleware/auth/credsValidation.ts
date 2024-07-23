// HandleRegularLoginError.ts

import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { findUserByCredential } from '../../helpers/findUserByCredential';
import { ILoginCredentials, IUser } from '../../../types/types';

// Define the middleware function with proper typing
export const HandleRegularLoginError = async (req: any, res: Response, next: NextFunction) => {
    const { credential, password }: ILoginCredentials = req.body;

    try {
        if (!credential || !password) {
            return res.status(400).send({
                success: false,
                message: !credential ? 'Email is required!' : 'Password is required!',
                key: !credential ? 'credential' : 'password'
            });
        }

        const user: IUser | null = await findUserByCredential(credential);

        if (!user) {
            return res.status(404).send({
                success: false,
                message: "Account not found. Double-check your credential.",
                key: 'user'
            });
        }

        // Check if password matches
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).send({
                success: false,
                message: 'Incorrect password.',
                key: 'password'
            });
        };

        // Attach user object to the request
        req.user = user;
        next();

    } catch (exc: any) {
        return res.status(500).json({
            success: false,
            message: exc.message,
            error: "Something went wrong. Please try again."
        });
    }
};