import { Request, Response, NextFunction } from 'express';
import UserModel from '../../model/user.model';
import { ICheckUserBody } from '../../config/types';


// DuplicateUserCheck middleware
export const DuplicateUserCheck = async (req: Request, res: Response, next: NextFunction) => {
    const { email }: ICheckUserBody = req.body;

    try {
        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            // If the user with the same email exists, send a 409 Conflict response
            return res.status(409).json({ success: false, message: "Email already exists!", key: "email" });
        }

        // If no duplicate user exists, proceed to the next middleware
        next();

    } catch (exc: any) {
        // Handle any errors that occur during the process
        return res.status(500).json({ success: false, message: exc.message, error: "Something went wrong. Please try again." });
    }
};
