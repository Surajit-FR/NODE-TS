import { IUser } from '../config/types';
import config from './secretkey';
import JWT from 'jsonwebtoken';

const CreateToken = (user: IUser): string => {
    const token = JWT.sign({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: user.password,
        is_delete: user.is_delete,
    }, config.secret_key!, { expiresIn: process.env.SESSION_TIME });

    return token;
};

export default CreateToken;
