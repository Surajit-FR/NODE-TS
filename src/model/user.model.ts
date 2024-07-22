import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../config/types';

const UserSchema: Schema<IUser> = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    is_delete: { type: Boolean, default: false },
}, { timestamps: true });


const UserModel = mongoose.model<IUser>('User', UserSchema);
export default UserModel;