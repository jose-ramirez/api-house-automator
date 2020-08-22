var express = require('express');
var debug = require('debug')('iotgo');

import { registerUser } from '../../services/user';
import { verify } from '../../services/recaptcha';

/**
 * Exports
 */
module.exports = exports = express.Router();

exports.route('/register').post(async (req, res, next) => {
    const host = req.get('Host');
    const { email, password, response } = req.body;
    const errMsg = 'reCAPTCHA verification failed! Please try again later';
    try {
        if (process.env.NODE_ENV !== 'dev'){
            if (response) {
                if (!await verify(response)){
                    throw new Error(errMsg);
                }
            }
        }
        let userRegisterResponse = await registerUser(host, email, password);
        res.send(userRegisterResponse);
    } catch (err) {
        debug(err);
        next(err);
    }
});
