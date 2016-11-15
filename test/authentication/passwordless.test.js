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
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
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

    it('should check that phoneNumber is sent', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.start({ connection: 'bla', type: 'sms' }, function () {});
      }).to.throwException(function (e) {
        expect(e.message).to.be('phoneNumber option is required');
      });
    });
  });

  context('passwordless verify options', function () {
    before(function () {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
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

    it('should check that options.verificationCode is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify({ connection: 'bla', type: 'email' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('verificationCode option is required');
      });
    });

    it('should check that options.type is valid', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify({ connection: 'bla', type: 'blabla', verificationCode: 'asdfasd' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('type is not valid ([email,sms])');
      });
    });

    it('should check that cb is valid', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify({ connection: 'bla', type: 'email', verificationCode: 'asdfasd', email: 'me@example.com' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });

    it('should check that email is sent', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify({ connection: 'bla', type: 'email', verificationCode: 'asdfasd' }, function () {});
      }).to.throwException(function (e) {
        expect(e.message).to.be('email option is required');
      });
    });

    it('should check that phoneNumber is sent', function () {
      var _this = this;
      expect(function () {
        _this.auth0.passwordless.verify({ connection: 'bla', type: 'sms', verificationCode: 'asdfasd' }, function () {});
      }).to.throwException(function (e) {
        expect(e.message).to.be('phoneNumber option is required');
      });
    });
  });

  context('passwordless verify', function () {
    before(function () {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
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
        phoneNumber: '123456',
        type: 'sms',
        verificationCode: 'abc'
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
        verificationCode: 'abc'
      }, function (err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({

        });
        done();
      });
    });
  });
});
