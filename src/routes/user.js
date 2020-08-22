/**
 * Dependencies
 */
var express = require('express');
var expressJwt = require('express-jwt');
var jsonWebToken = require('jsonwebtoken');
var unless = require('express-unless');
var config = require('../config');
var db = require('../db');
var User = db.User;
var Device = db.Device;
var FactoryDevice = db.FactoryDevice;
var email_util = require('../lib/email-util');
var jade = require('jade');
var uuid = require('uuid');
var path = require('path');
var debug = require('debug')('iotgo');

import { registerUser } from '../services/user';
import { verify } from '../services/recaptcha';

var activedAccountOnly = function (req, res, next) {
    var isActivated = req.user.isActivated;
    if (isActivated) {
        next();
    } else {
        var err = new Error('Actived Account only area!');
        err.status = 401;
        next(err);
    }
};

activedAccountOnly.unless = unless;
/**
 * Exports
 */
module.exports = exports = express.Router();

// Enable Json Web Token
exports.use(expressJwt(config.jwt).unless({
    path: [
        '/api/user/register',
        '/api/user/v2/register',
        '/api/user/login',
        '/api/user/validate']
}));

exports.use(activedAccountOnly.unless({
    path: [
        '/api/user/register',
        '/api/user/v2/register',
        '/api/user/login',
        '/api/user/activeAccount',
        '/api/user/validate']
}));

exports.route('/register').post(async (req, res, next) => {
    const host = req.get('Host');
    const { email, password, response } = req.body;
    try {
        if (process.env.NODE_ENV !== 'dev'){
            if (!await verify(response)){
                throw new Error(
                    'reCAPTCHA verification failed! Please try again later.');
            }
        }
        let userRegisterResponse = await registerUser(host, email, password);
        res.send(userRegisterResponse);
    } catch (err) {
        debug(err);
        next(err);
    }
});

exports.route('/activeAccount').get(function (req, res) {
    var email = req.user.email;
    var token = uuid.v4();
    User.resetToken(email, token, function (err, user, msg) {
        if (err) {
            res.send({error: err});
            return;
        }
        if (user) {
            var host = req.get('Host');
            var href = 'http://' + host;
            var logo = href + '/images/logo.png';
            href += '/api/user/validate?email=' + email + '&token=' + token;
            var html = jade.renderFile(
                path.join(__dirname, '../template/activeEmail.jade'),
                { user: { email, href, logo } }
            );
            var mailOption = {
                to: email,
                subject: 'IoTgo: Confirm Your Email Address',
                html: html
            };
            email_util.sendMail(mailOption, function (err, body) {
                if (err) {
                    res.send({error: err});
                    return;
                }
                res.send({message: msg});
            });
        }
    });
});

exports.route('/validate').get(function (req, res) {
    var email = req.query.email;
    var token = req.query.token;
    if (!email || !token) {
        res.send({
            error: 'Email address and token must not be empty!'
        });
        return;
    }
    console.log(req.query);
    User.active(email, token, function (err, user, msg) {
        if (err) {
            res.send({error: err});
            return;
        }
        if (user) {
            res.redirect('/login');
        } else {
            res.send(msg);
        }
    });
});

// Login
exports.route('/login').post(function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    if (!email || !password) {
        res.send({
            error: 'Email address and password must not be empty!'
        });
        return;
    }

    User.authenticate(email, password, function (err, user) {
        if (err || !user) {
            res.send({
                error: 'Email address or password is not correct!'
            });
            return;
        }

        res.send({
            jwt: jsonWebToken.sign(user, config.jwt.secret),
            user: user
        });
    });
});

// Password management
exports.route('/password').post(function (req, res) {
    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;

    if (typeof oldPassword !== 'string' || !oldPassword.trim() ||
    typeof newPassword !== 'string' || !newPassword.trim()) {
        res.send({
            error: 'Old password and new password must not be empty!'
        });
        return;
    }

    User.authenticate(req.user.email, oldPassword, function (err, user) {
        if (err) {
            res.send({
                error: 'Change password failed!'
            });
            return;
        }

        if (!user) {
            res.send({
                error: 'Old password is not correct!'
            });
            return;
        }

        User.setPassword(req.user.email, newPassword, function (err) {
            if (err) {
                res.send({
                    error: 'Change password failed!'
                });
                return;
            }

            res.send({});
        });
    });
});

// Device management
exports.route('/device').get(function (req, res) {
    Device.getDevicesByApikey(req.user.apikey, function (err, devices) {
        if (err || !devices.length) {
            res.send([]);
            return;
        }

        res.send(devices);
    });
}).post(function (req, res) {
    if (!req.body.name || !req.body.type) {
        res.send({
            error: 'Device name and type must be specified!'
        });
        return;
    }

    Device.getNextDeviceid(req.body.type, function (err, deviceid) {
        if (err) {
            res.send({
                error: err
            });
            return;
        }

        var device = {
            name: req.body.name,
            group: req.body.group,
            type: req.body.type,
            deviceid: deviceid,
            apikey: req.user.apikey
        };

        (new Device(device)).save(function (err, device) {
            if (err) {
                res.send({
                    error: 'Create device failed!'
                });
                return;
            }

            res.send(device);
        });
    });
});

exports.route('/device/add').post(function (req, res) {
    var name = req.body.name;
    var apikey = req.body.apikey;
    var deviceid = req.body.deviceid;
    if (typeof name !== 'string' || !name.trim() ||
    typeof apikey !== 'string' || !apikey.trim() ||
    typeof deviceid !== 'string' || !deviceid.trim()) {
        res.send({
            error: 'Device name, id and apikey must not be empty!'
        });
        return;
    }

    if (!/^[0-9a-f]{10}$/.test(deviceid)) {
        res.send({
            error: 'Invalid device id format!'
        });
        return;
    }

    FactoryDevice.exists(apikey, deviceid, function (err, device) {
        if (err) {
            res.send({
                error: 'Add device failed!'
            });
            return;
        }

        if (!device) {
            res.send({
                error: 'Device does not exist!'
            });
            return;
        }

        Device.where('deviceid', deviceid).findOne(function (err, device) {
            if (err) {
                res.send({
                    error: 'Add device failed!'
                });
                return;
            }

            if (device) {
                res.send({
                    error: (device.apikey === req.user.apikey)
                        ? 'Device has already been added!'
                        : 'Device belongs to other user!'
                });
                return;
            }

            device = new Device({
                name: name,
                group: req.body.group ? req.body.group : '',
                type: deviceid.substr(0, 2),
                deviceid: deviceid,
                apikey: req.user.apikey
            });
            device.save(function (err, device) {
                if (err) {
                    res.send({
                        error: 'Add device failed!'
                    });
                    return;
                }

                res.send(device);
            });
        });
    });
});

exports.route('/device/:deviceid').get(function (req, res) {
    Device.exists(req.user.apikey, req.params.deviceid, function (err, device) {
        if (err || !device) {
            res.send({
                error: 'Device does not exist!'
            });
            return;
        }

        res.send(device);
    });
}).post(function (req, res) {
    if (typeof req.body.name !== 'string' ||
    typeof req.body.group !== 'string') {
        res.send({
            error: 'Device name and group must not be empty!'
        });
        return;
    }

    Device.exists(req.user.apikey, req.params.deviceid, function (err, device) {
        if (err || !device) {
            res.send({
                error: 'Device does not exist!'
            });
            return;
        }

        device.name = req.body.name;
        device.group = req.body.group;
        device.save(function (err, device) {
            if (err) {
                res.send({
                    error: 'Save device failed!'
                });
                return;
            }

            res.send(device);
        });
    });
}).delete(function (req, res) {
    Device.exists(req.user.apikey, req.params.deviceid, function (err, device) {
        if (err || !device) {
            res.send({
                error: 'Device does not exist!'
            });
            return;
        }

        device.remove(function (err, device) {
            if (err) {
                res.send({
                    error: 'Delete device failed!'
                });
            }

            res.send(device);
        });
    });
});


