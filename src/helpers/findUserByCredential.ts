import { IUser } from '../../types/types';
import UserModel from '../model/user.model';


// Define the findUserByCredential function
export const findUserByCredential = async (credential: string): Promise<IUser | null> => {
    let user: IUser | null = null;

    // Check if the credential is in email format
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(credential)) {
        user = await UserModel.findOne({ email: credential }).exec();
    }
    // Check if the credential is in phone format
    else if (/^[0-9]{10}$/.test(credential)) {
        user = await UserModel.findOne({ phone: credential }).exec();
    }

    return user;
};

// Define the findUserById function
export const findUserById = async (userId: string): Promise<IUser | null> => {
    let user: IUser | null = null;
    user = await UserModel.findOne({ _id: userId }).exec();
    return user;
};