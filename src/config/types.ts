// types.ts

import { Document } from 'mongoose';

export interface Config {
    secret_key: string | undefined;
};

export interface IUser extends Document {
    name: string;
    email: string;
    phone: string;
    password: string;
    is_delete: boolean;
};

export interface ICheckUserBody {
    email: string;
};

export interface ILoginCredentials {
    credential?: string;
    password?: string;
};