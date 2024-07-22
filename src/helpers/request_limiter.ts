import { Request, Response, NextFunction } from 'express';
import rateLimit, { IncrementResponse, Options } from 'express-rate-limit';

// Define rate limit options
const rateLimitOptions: Options = {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 requests per window
    message: "Too many requests. Please try again after sometime :(",
    legacyHeaders: false, // Disable the X-RateLimit-* headers
    standardHeaders: true, // Enable the RateLimit-* headers
    keyGenerator: function (request: Request): string {
        // Ensure request.ip is a string or provide a default value
        return request.ip || 'default-key';
    },
    handler: function (request: Request, response: Response, next: NextFunction): void {
        response.status(429).json({
            status: 429,
            message: "Too many requests. Please try again later."
        });
    },
    skip: function (request: Request): boolean {
        // Example: Skip rate limiting for specific routes
        return false;
    },
    limit: 0,
    statusCode: 0,
    requestPropertyName: '',
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    requestWasSuccessful: function (request: Request, response: Response): boolean | Promise<boolean> {
        throw new Error('Function not implemented.');
    },
    store: {
        init: undefined,
        get: undefined,
        increment: function (key: string): Promise<IncrementResponse> | IncrementResponse {
            throw new Error('Function not implemented.');
        },
        decrement: function (key: string): Promise<void> | void {
            throw new Error('Function not implemented.');
        },
        resetKey: function (key: string): Promise<void> | void {
            throw new Error('Function not implemented.');
        },
        resetAll: undefined,
        shutdown: undefined,
        localKeys: undefined,
        prefix: undefined
    },
    validate: false
};

// Create and export the rate limiter
const Limiter = rateLimit(rateLimitOptions);

export default Limiter;