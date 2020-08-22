var db = require('../db');
var User = db.User;

import { HttpError } from '../error';
import { getToken } from './token';
import { sendActivationEmail } from './email';

export const registerUser = async (host, email, password) => {
    if (!email || !password) {
        throw new HttpError(400,
            'Email address and password must not be empty!');
    }

    const registeredUser = await User.create({email, password});
    const user = registeredUser.toObject({ transform: function (doc, ret) {
        delete ret.password;
        delete ret.token;
        delete ret.__v;
        return ret;
    } });

    if (user) {
        await sendActivationEmail(host, email);
        return {
            jwt: getToken(user),
            user
        };
    }
};

export const resetToken = async (email, token) => {
    let user = await User.findOne({ email });
    if (!user) {
        throw new HttpError(404, 'The user does not exist');
    }

    // ... what to do here? throw an error, or just return the user?
    if (user.isActivated) {
        throw new HttpError(400, 'The user has already activated the account');
    }

    user.token = token;
    await User.updateOne({ email }, user);

    return user.toObject({ transform: function (doc, ret) {
        delete ret.password;
        delete ret.token;
        delete ret.__v;
        return ret;
    } });
};
