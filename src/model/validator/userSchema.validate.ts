import Joi, { ObjectSchema } from 'joi';
import { IUser } from '../../config/types';

// Define the user schema
const UserSchema: ObjectSchema<IUser> = Joi.object({
    name: Joi.string().min(3).max(60).required().pattern(/^[a-zA-Z ]+$/).messages({
        "string.empty": "Full name is required!",
        "string.min": "Minimum length should be 3",
        "string.max": "Maximum length should be 60",
        "string.pattern.base": "Only alphabets and blank spaces are allowed",
    }),
    email: Joi.string().min(3).max(60).required().email({ minDomainSegments: 1, maxDomainSegments: 2, tlds: { allow: ['com', 'co', 'in'] } }).pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).messages({
        "string.empty": "Email ID is required !!",
        "string.min": "Email ID should be minimum 3 characters long !!",
        "string.max": "Email ID should be maximum 60 characters long !!",
        "string.email": "Invalid email format !!",
        "string.pattern.base": "Invalid email format !!",
    }),
    phone: Joi.string().length(10).pattern(/^[0-9]+$/).required().messages({
        "string.length": "Phone number must be exactly 10 digits long !!",
        "string.pattern.base": "Phone number must contain only digits !!",
        "string.empty": "Phone number is required !!",
    }),
    password: Joi.string().min(8).max(16).required().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])([a-zA-Z0-9@#\$%\^\&*\)\(+=._-]){8,}$/).messages({
        "string.empty": "Password is required !!",
        "string.min": "Password should be minimum 8 characters long !!",
        "string.max": "Password should be maximum 16 characters long !!",
        "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, one number & one special character !!",
    }),
    is_delete: Joi.boolean().default(false),
});

// Function to validate the user model
const ValidateUser = (userModel: IUser) => {
    return UserSchema.validate(userModel);
};

export default ValidateUser;