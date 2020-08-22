import fetch from 'cross-fetch';
import config from '../config';

var debug = require('debug')('iotgo');

export const verify = async (response) => {
    if (!response) {
        throw new Error('reCAPTCHA verification is required!');
    }

    const {secret: recaptchaSecret, url: recaptchaUrl} = config.recaptcha;
    const url =
        `${recaptchaUrl}?secret=${recaptchaSecret}&response=${response}`;

    const recaptchaResponse = await fetch(url, {method: 'POST'});

    if (recaptchaResponse.status >= 400) {
        debug(recaptchaResponse);
        throw new Error('Bad response from reCAPTCHA server');
    }

    const data = await response.json();
    return data.success;
};
