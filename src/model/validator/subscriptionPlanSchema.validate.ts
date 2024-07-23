import Joi from 'joi';
import { ISubscriptionPlan } from '../../../types/types';

export const validateSubscriptionPlan = (subscriptionPlan: ISubscriptionPlan) => {
    const SubscriptionPlanSchema = Joi.object({
        name: Joi.string().min(3).max(60).required().pattern(/^[a-zA-Z ]+$/).messages({
            "string.empty": "Name is required!",
            "string.min": "Minimum length should be 3",
            "string.max": "Maximum length should be 60",
            "string.pattern.base": "Only alphabets and blank spaces are allowed",
        }),
        trial_days: Joi.number().integer().min(0).required().messages({
            "number.base": "Trial days must be a number",
            "number.min": "Trial days cannot be negative",
            "any.required": "Trial days are required",
        }),
        is_trial: Joi.boolean().default(false),
        amount: Joi.number().positive().required().messages({
            "number.base": "Amount must be a number",
            "number.positive": "Amount must be positive",
            "any.required": "Amount is required",
        }),
        type: Joi.string().required().pattern(/^[a-zA-Z]+$/).messages({
            "string.empty": "Subscription type is required!",
            "string.pattern.base": "Only alphabets are allowed",
        }),
        user_count: Joi.number().required().messages({
            "any.required": "User count is required.",
            "number.base": "User count must be a number."
        }),
        chat_inference: Joi.string().required().messages({
            "any.required": "Chat inference is required.",
            "string.empty": "Chat inference cannot be empty."
        }),
        image_generation: Joi.number().required().messages({
            "any.required": "Image generation is required.",
            "number.base": "Image generation must be a number."
        }),
        youtube_video_summarization: Joi.string().required().messages({
            "any.required": "YouTube video summarization is required.",
            "string.empty": "YouTube video summarization cannot be empty."
        }),
        financial_data_insight_for_stocks: Joi.boolean().required().messages({
            "any.required": "Financial data insight for stocks is required.",
            "boolean.base": "Financial data insight for stocks must be a boolean."
        }),
        news_aggregator_per_day: Joi.number().required().messages({
            "any.required": "News aggregator per day is required.",
            "number.base": "News aggregator per day must be a number."
        }),
    });

    return SubscriptionPlanSchema.validate(subscriptionPlan);
};
