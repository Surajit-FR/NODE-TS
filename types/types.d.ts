import { Request } from 'express';
import { Document } from 'mongoose';

export interface Config {
    secret_key: string | undefined;
};
export interface ISubscription {
    previous_price: string | undefined;
    previous_plan_id: any;
    previous_plan_type: any;
    subscriptionId: string;
    customerId: string;
    sessionId: string;
    planId: string;
    planType: string;
    planStartDate: Date | null;
    planEndDate: Date | null;
    planDuration: string;
};
export interface IUser extends Document {
    _id: ObjectId;
    name: string;
    email: string;
    password: string;
    subscription: ISubscription;
    is_subscribed: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};
export interface IRefund extends Document {
    user: ObjectId;
    refundId: string;
    amount: number;
    status: string;
    created: Date | null;
};
export interface ICheckUserBody {
    email: string;
};
export interface ILoginCredentials {
    credential?: string;
    password?: string;
};
export interface ISubscriptionPlan extends Document {
    name: string;
    stripe_price_id: string;
    trial_days: number;
    is_trial: boolean;
    amount: number;
    type: string;
    user_count: number;
    chat_inference: string;
    image_generation: number;
    youtube_video_summarization: string;
    financial_data_insight_for_stocks: boolean;
    news_aggregator_per_day: number;
    createdAt: Date;
    updatedAt: Date;
};
// Define a custom Request interface to include decoded_token
export interface CustomRequest extends Request {
    decoded_token?: string | object;
};
export interface DecodedToken {
    _id: string;
    subscription: {
        customerId?: string;
        subscriptionId?: string;
        sessionId?: string;
        planId?: string;
        planType?: string;
        planStartDate?: string;
        planEndDate?: string;
        planDuration?: number;
    };
};
export interface Product {
    _id: string;
    name: string;
    stripe_price_id: string;
    trial_days: number;
    is_trial: boolean;
    amount: number;
    type: string;
    user_count: number;
    chat_inference: string;
    image_generation: number;
    youtube_video_summarization: string;
    financial_data_insight_for_stocks: boolean;
    news_aggregator_per_day: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
};
export interface StripeSessionResponse {
    [x: string]: any;
    id?: string;
    success_url?: string;
    error?: string;
};
export interface ReminderJobData {
    userId: string;
    subscriptionEndDate: Date;
};
export interface SendEmailOptions {
    receiver: string;
    subject: string;
    htmlContent: string;
};
export interface SendEmailResponse {
    success: boolean;
    message: string;
};
export interface AddSubscriptionPlanRequestBody {
    name: string;
    trial_days: number;
    is_trial: boolean;
    amount: number;
    type: 'day' | 'week' | 'month' | 'year';
    user_count: number;
    chat_inference: boolean;
    image_generation: boolean;
    youtube_video_summarization: boolean;
    financial_data_insight_for_stocks: boolean;
    news_aggregator_per_day: boolean;
};