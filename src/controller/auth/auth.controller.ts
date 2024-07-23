import { Request, Response } from 'express';
import UserModel from '../../model/user.model';
import SecurePassword from '../../helpers/securePassword';
import CreateToken from '../../helpers/createToken';
import { IUser } from '../../../types/types';

interface IRegisterRequestBody {
    name: string;
    email: string;
    phone: string;
    password: string;
}

// LoginRegular function
export const LoginRegular = async (req: any, res: Response): Promise<Response> => {
    try {
        // Accessing the user object attached by the middleware 
        const _user = req.user as IUser;

        const USER_DATA = await UserModel.findById(_user._id).exec();
        if (!USER_DATA) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        const tokenData = CreateToken(USER_DATA);
        return res.status(200).json({ success: true, message: "Login Successful!", data: USER_DATA, token: tokenData });
    } catch (exc: any) {
        return res.status(500).json({ success: false, message: exc.message, error: "Internal server error" });
    }
};

// RegisterRegular function
export const RegisterRegular = async (req: Request<{}, {}, IRegisterRequestBody>, res: Response): Promise<Response> => {
    const { name, email, phone, password } = req.body;

    try {
        const HashedPassword = await SecurePassword(password);

        const NewUser = new UserModel({
            name,
            email: email.toLowerCase(),
            phone: phone,
            password: HashedPassword,
        });

        const userData = await NewUser.save();
        // Type assertion to IUser
        const USER_DATA = userData.toObject() as IUser;
        const tokenData = CreateToken(USER_DATA);

        return res.status(201).json({ success: true, message: "Registered Successfully!", data: USER_DATA, token: tokenData });
    } catch (exc: any) {
        return res.status(500).json({ success: false, message: exc.message, error: "Internal server error" });
    }
};
