import jwt from 'jsonwebtoken';
import config from '../config';

export const getToken = (user) => {
    return jwt.sign(user, config.jwt.secret);
};
