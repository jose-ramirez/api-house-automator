

module.exports = {
    host: 'iotgo.iteadstudio.com',
    db: {
        uri: 'mongodb://localhost:27017/iotgo'
    },
    jwt: {
        secret: 'jwt_secret'
    },
    admin: {
        'iotgo@iteadstudio.com': 'passaword' // IoTgo platform's admin account
    },
    page: {
        limit: 50, // Default query page limit
        sort: -1 // Default query sort order
    },
    recaptcha: {
        secret: '6LfyZrQZAAAAAKY8wD6lqxy_dzjR7_n3fXg4Nm7G',
        url: 'https://www.google.com/recaptcha/api/siteverify'
    },
    pendingRequestTimeout: 3000,
    mailgun: {
        api_key: '5cfa58cbb2703b91e995f32df0a64c95-9525e19d-52d50218',
        domain: 'mg.josers.org',
        from: 'postmaster@josers.org'
    },
    upgradeUrl: 'http://v.itead.cc/api/upgrade'
};
