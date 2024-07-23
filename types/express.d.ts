import { DecodedToken } from './types';

declare global {
    namespace Express {
        interface Request {
            decoded_token?: DecodedToken;
        }
    }
}
