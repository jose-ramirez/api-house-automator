import chaiHttp from 'chai-http';
import { use, should as _should, expect, request } from 'chai';
import { it, describe, beforeEach, afterEach } from 'mocha';
import { getToken } from '../src/services/token';

use(chaiHttp);

import app from '../src/app';

import { User } from '../src/db';
import { Device } from '../src/db';

const should = _should();

const dummyUser = {
    isActivated: true,
    email: 'some.valid@email.com',
    password: 'my_password!',
    apikey: 'my-api-key'
};

describe('POST /api/user/device', () => {

    beforeEach(async () => {
        await User.deleteMany({});
        await Device.deleteMany({});
        await User.create(dummyUser);
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Device.deleteMany({});
    });

    it('should create device', done => {
        request(app)
            .post('/api/user/device')
            .set('Authorization', `Bearer ${getToken(dummyUser)}`)
            .send({
                name: 'Switch',
                group: 'ITEAD',
                type: '01'
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                expect(res.body).to.haveOwnProperty('name');
                expect(res.body).to.haveOwnProperty('group');
                expect(res.body).to.haveOwnProperty('type');
                expect(res.body).to.haveOwnProperty('apikey');
                expect(res.body).to.haveOwnProperty('deviceid');
                done();
            });
    });
});

describe('GET /api/user/device', () => {

    beforeEach(async () => {
        await User.deleteMany({});
        await Device.deleteMany({});
        await User.create(dummyUser);
    });

    afterEach(async () => {
        await Device.deleteMany({});
        await User.deleteMany({});
    });

    it('should return device list', done => {
        request(app)
            .get('/api/user/device')
            .set('Authorization', `Bearer ${getToken(dummyUser)}`)
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                expect(res.body).to.be.a('array');
                done();
            });
    });
});
