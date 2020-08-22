var express = require('express');
var db = require('../db');
var http = require('./http');
var config = require('../config');
var user = require('./user');
var admin = require('./admin');
var debug = require('debug')('iotgo');
var userV2 = require('./v2/user');

/**
 * Connect to database first
 */
db.connect(config.db.uri, config.db.options);
db.connection.on('error', function (err) {
    debug('Connect to DB failed!');
    debug(err);
    process.exit(1);
});
db.connection.on('open', function () {
    debug('Connect to DB successful!');
});

var router = express.Router();

router.route('/http').post(http).all(function (req, res) {
    res.send(405).end();
});

router.use('/user', user);
router.use('/user/v2', userV2);
router.use('/admin', admin);

module.exports = router;
