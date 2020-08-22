var mixin = require('utils-merge');
var mailgunConf = require('../config').mailgun;
var mailgun = require('mailgun-js')(
    {apiKey: mailgunConf.api_key, domain: mailgunConf.domain});
var debug = require('debug')('email-util');
var uuid = require('uuid');
var jade = require('jade');
var path = require('path');

import { resetToken } from './user';

export const sendMail = (mailOptions) => {
    var from = {from: mailgunConf.from};
    mixin(mailOptions, from);
    debug('mailOptions:', mailOptions);
    mailgun.messages().send(mailOptions, function (error, body) {
        if (error) {
            debug('err:', error);
            return;
        }
        debug('Email Send success!');
    });
};

export const sendActivationEmail = async (host, email) => {
    const token = uuid.v4();
    await resetToken(email, token);
    let href = `http://${host}/api/user/validate?email=${email}&token=${token}`;
    var html = jade.renderFile(
        path.join(__dirname, '../template/activeEmail.jade'),
        {user: { email, href }});
    var mailOption = {
        to: email,
        subject: 'IoTgo: Confirm Your Email Address',
        html: html
    };
    sendMail(mailOption);
};
