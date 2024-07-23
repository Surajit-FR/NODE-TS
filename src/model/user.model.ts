import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from '../../types/types';

const SubscriptionSchema: Schema = new Schema({
    subscriptionId: { type: String, default: "" },
    customerId: { type: String, default: "" },
    sessionId: { type: String, default: "" },
    planId: { type: String, default: "" },
    planType: { type: String, default: "" },
    planStartDate: { type: Date, default: null },
    planEndDate: { type: Date, default: null },
    planDuration: { type: String, default: "" }
}, { _id: false });

const UserSchema: Schema<IUser> = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    subscription: { type: SubscriptionSchema, default: () => ({}) },
    is_subscribed: { type: Boolean, default: false },
}, { timestamps: true });

const UserModel: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default UserModel;