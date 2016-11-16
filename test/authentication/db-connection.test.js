var expect = require('expect.js');
var stub = require('sinon').stub;

var request = require('superagent');

var Authentication = require('../../src/authentication');

describe('auth0.authentication', function () {
  context('dbConnection signup options', function () {
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
        _this.auth0.dbConnection.signup();
      }).to.throwException(function (e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should check that options.connection is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.dbConnection.signup({});
      }).to.throwException(function (e) {
        expect(e.message).to.be('connection option is required');
      });
    });

    it('should check that options.email is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.dbConnection.signup({ connection: 'bla' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('email option is required');
      });
    });

    it('should check that options.password is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.dbConnection.signup({ connection: 'bla', email: 'blabla' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('password option is required');
      });
    });

    it('should check that cb is valid', function () {
      var _this = this;
      expect(function () {
        _this.auth0.dbConnection.signup({ connection: 'bla', email: 'blabla', password: '123456' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });
  });

  context('change password options', function () {
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
        _this.auth0.dbConnection.changePassword();
      }).to.throwException(function (e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should check that options.connection is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.dbConnection.changePassword({});
      }).to.throwException(function (e) {
        expect(e.message).to.be('connection option is required');
      });
    });

    it('should check that options.email is passed', function () {
      var _this = this;
      expect(function () {
        _this.auth0.dbConnection.changePassword({ connection: 'bla' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('email option is required');
      });
    });

    it('should check that cb is valid', function () {
      var _this = this;
      expect(function () {
        _this.auth0.dbConnection.changePassword({ connection: 'bla', email: 'blabla', password: '123456' });
      }).to.throwException(function (e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });
  });
});
