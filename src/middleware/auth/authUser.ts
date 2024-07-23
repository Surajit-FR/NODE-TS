import { Request, Response, NextFunction } from 'express';
import JWT from 'jsonwebtoken';
import config from '../../helpers/secretkey';
import { CustomRequest } from '../../../types/types';

// VerifyToken
export const VerifyToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
    let token = req.body.token || req.query.token || req.headers["x-access-token"] || req.headers.authorization || req.body.headers?.Authorization;

    try {
        if (!token) {
            return res.status(401).json({ success: false, message: "Token required for authorization", key: "token" });
        }

        if (typeof token === 'string' && token.startsWith('Bearer ')) {
            token = token.slice(7);
        }

        if (!config.secret_key) {
            throw new Error("Secret key is not defined.");
        }

        const decoded_token = JWT.verify(token, config.secret_key);
        // Attach the decoded token to the request object
        req.decoded_token = decoded_token;

        next();

    } catch (exc: any) {
        return res.status(401).json({ success: false, message: "Session Expired. Please Login !!", error: exc.message });
    }
};
