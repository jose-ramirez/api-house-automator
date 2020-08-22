

import 'dotenv/config';

var express = require('express');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');

var routes = require('./routes');

var cors = require('cors');

var app = express();

// web app backend
// app.use('/admin', favicon(__dirname + '/public/backend/favicon.png'));
// app.use('/admin', express.static(__dirname + '/public/backend'));
// web app frontend
// app.use(favicon(__dirname + '/public/frontend/favicon.png'));
// app.use(express.static(__dirname + '/public/frontend'));

app.use(cors());

// for testing reCAPTCHA locally, for now
app.use('/recaptcha-test', express.static(__dirname + '/recaptcha-test'));

app.use(logger('dev', { skip: (req, res) => process.env.NODE_ENV === 'test' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api', routes);

// catch 404 and redirect to /
app.use(function (req, res, next) {
    res.redirect('/?path=' + req.path);
});

// error handlers

app.use(function (err, req, res, next) {
    res
        .status(err.code || 500)
        .send({error: err.message});
});

module.exports = app;
