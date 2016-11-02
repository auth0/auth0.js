var expect = require('expect.js');
var stub = require('sinon').stub;

var RequestMock = require('../mock/request-mock');

var request = require('superagent');

var Authentication = require('../../src/authentication');

describe('auth0.authentication', function () {
  context('passwordless start options', function () {
    before(function () {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        client_id: '...',
        redirect_uri: 'http://page.com/callback',
        response_type: 'code',
        _sendTelemetry: false
      });
    });

    it('should check that options is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.start();
      }).to.throwException(function (e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should check that options.connection is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.start({});
      }).to.throwException(function (e) {
        expect(e.message).to.be('connection option is required');
      });
    });

    it('should check that options.type is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.start({ connection: 'bla' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('type option is required');
      });
    });

    it('should check that options.type is valid', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.start({ connection: 'bla', type: 'blabla' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('type is not valid ([email,sms])');
      });
    });

    it('should check that cb is valid', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.start({ connection: 'bla', type: 'email', email: 'me@example.com' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });

    it('should check that email is sent', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.start({ connection: 'bla', type: 'email' }, function () {});
      }).to.throwException(function (e) {
        expect(e.message).to.be('email option is required');
      });
    });

    it('should check that phone_number is sent', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.start({ connection: 'bla', type: 'sms' }, function () {});
      }).to.throwException(function (e) {
        expect(e.message).to.be('phone_number option is required');
      });
    });
  });

  context('passwordless start', function () {
    before(function () {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        client_id: '...',
        redirect_uri: 'http://page.com/callback',
        response_type: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function () {
      request.post.restore();
    });

    it('should call passwordless start sms with all the options', function (done) {
      stub(request, 'post', function (url) {
        expect(url).to.be('https://me.auth0.com/passwordless/start');
        return new RequestMock({
          body: {
            client_id: '...',
            connection: 'the_connection',
            phone_number: '123456'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function (cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      this.auth0.passwordless.start({
        connection: 'the_connection',
        phone_number: '123456',
        type: 'sms'
      }, function (err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({});
        done();
      });
    });

    it('should call passwordless start email with all the options', function (done) {
      stub(request, 'post', function (url) {
        expect(url).to.be('https://me.auth0.com/passwordless/start');
        return new RequestMock({
          body: {
            client_id: '...',
            connection: 'the_connection',
            email: 'me@example.com'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function (cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      this.auth0.passwordless.start({
        connection: 'the_connection',
        email: 'me@example.com',
        type: 'email'
      }, function (err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({});
        done();
      });
    });
  });

  context('passwordless verify options', function () {
    before(function () {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        client_id: '...',
        redirect_uri: 'http://page.com/callback',
        response_type: 'code',
        _sendTelemetry: false
      });
    });

    it('should check that options is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify();
      }).to.throwException(function (e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should check that options.connection is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify({});
      }).to.throwException(function (e) {
        expect(e.message).to.be('connection option is required');
      });
    });

    it('should check that options.type is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify({ connection: 'bla' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('type option is required');
      });
    });

    it('should check that options.verification_code is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify({ connection: 'bla', type: 'email' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('verification_code option is required');
      });
    });

    it('should check that options.type is valid', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify({ connection: 'bla', type: 'blabla', verification_code: 'asdfasd' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('type is not valid ([email,sms])');
      });
    });

    it('should check that cb is valid', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify({ connection: 'bla', type: 'email', verification_code: 'asdfasd', email: 'me@example.com' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });

    it('should check that email is sent', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify({ connection: 'bla', type: 'email', verification_code: 'asdfasd' }, function () {});
      }).to.throwException(function (e) {
        expect(e.message).to.be('email option is required');
      });
    });

    it('should check that phone_number is sent', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify({ connection: 'bla', type: 'sms', verification_code: 'asdfasd' }, function () {});
      }).to.throwException(function (e) {
        expect(e.message).to.be('phone_number option is required');
      });
    });
  });

  context('passwordless verify', function () {
    before(function () {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        client_id: '...',
        redirect_uri: 'http://page.com/callback',
        response_type: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function () {
      request.post.restore();
    });

    it('should call passwordless verify sms with all the options', function (done) {
      stub(request, 'post', function (url) {
        expect(url).to.be('https://me.auth0.com/passwordless/verify');
        return new RequestMock({
          body: {
            connection: 'the_connection',
            phone_number: '123456',
            verification_code: 'abc'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function (cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      this.auth0.passwordless.verify({
        connection: 'the_connection',
        phone_number: '123456',
        type: 'sms',
        verification_code: 'abc'
      }, function (err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({

        });
        done();
      });
    });

    it('should call passwordless verify email with all the options', function (done) {
      stub(request, 'post', function (url) {
        expect(url).to.be('https://me.auth0.com/passwordless/verify');
        return new RequestMock({
          body: {
            connection: 'the_connection',
            email: 'me@example.com',
            verification_code: 'abc'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function (cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      this.auth0.passwordless.verify({
        connection: 'the_connection',
        email: 'me@example.com',
        type: 'email',
        verification_code: 'abc'
      }, function (err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({

        });
        done();
      });
    });
  });
});
