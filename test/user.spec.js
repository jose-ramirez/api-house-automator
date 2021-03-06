import chaiHttp from 'chai-http';
import { use, should as _should, expect, request } from 'chai';
import { it, describe, beforeEach, afterEach } from 'mocha';

use(chaiHttp);

import app from '../src/app';

import { User } from '../src/db';

const should = _should();

describe('POST /api/user/login', () => {

    beforeEach(async () => {
        await User.deleteMany({});
        await User.create({
            email: 'some.valid@email.com',
            password: 'my_password!'
        });
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    it('should login user and return token', done => {
        request(app)
            .post('/api/user/login')
            .send({
                email: 'some.valid@email.com',
                password: 'my_password!'
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);

                expect(res.body).to.haveOwnProperty('jwt');
                expect(res.body).to.haveOwnProperty('user');

                should.exist(res.body.user);
                expect(res.body.user).to.haveOwnProperty('email');
                expect(res.body.user).to.haveOwnProperty('isActivated');
                expect(res.body.user).to.haveOwnProperty('apikey');
                done();
            });
    });

    it('should not return user if email is missing', done => {
        request(app)
            .post('/api/user/login')
            .send({
                password: 'my_password!'
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                expect(res.body).to.haveOwnProperty('error');
                done();
            });
    });

    it('should not return user if password is missing', done => {
        request(app)
            .post('/api/user/login')
            .send({
                email: 'some.valid@email.com'
            })
            .end((err, res) => {
                should.not.exist(err);
                res.should.have.status(200);
                expect(res.body).to.haveOwnProperty('error');
                done();
            });
    });
});
