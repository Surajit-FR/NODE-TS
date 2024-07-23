import { IUser } from '../../types/types';
import config from './secretkey';
import JWT from 'jsonwebtoken';

const CreateToken = (user: IUser): string => {
    const token = JWT.sign({
        _id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        password: user.password,
        is_subscribed: user.is_subscribed,
    }, config.secret_key!, { expiresIn: process.env.SESSION_TIME });

    return token;
};

export default CreateToken;
