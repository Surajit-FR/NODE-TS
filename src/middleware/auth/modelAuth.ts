import { Request, Response, NextFunction } from 'express';
import { ValidationResult } from 'joi'; // Adjust this if using a different validation library

// Define the type for the validator function
type ValidatorFunction = (data: any) => ValidationResult;

// Define the middleware function
const ModelAuth = (validator: ValidatorFunction) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = validator(req.body);
        // return console.log(value);
        // return console.log(error);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0]?.message,
                key: error.details[0]?.path[0]
            });
        }
        (req as any).validatedBody = value; // Type assertion to handle custom property
        next();
    };
};

export default ModelAuth;