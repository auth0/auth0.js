var expect = require('expect.js');
var stub = require('sinon').stub;

var RequestMock = require('../mock/request-mock');

var request = require('superagent');

var Authentication = require('../../src/authentication');

describe('auth0.authentication', function () {
  context('dbConnection signup options', function () {
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

  context('dbConnection signup', function () {
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

    it('should call db-connection signup with all the options', function (done) {
      stub(request, 'post', function (url) {
        expect(url).to.be('https://me.auth0.com/dbconnection/signup');
        return new RequestMock({
          body: {
            client_id: '...',
            connection: 'the_connection',
            email: 'me@example.com',
            password: '123456'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function (cb) {
            cb(null, {
              body: {
                _id: '...',
                email_verified: false,
                email: 'me@example.com'
              }
            });
          }
        });
      });

      this.auth0.dbConnection.signup({
        connection: 'the_connection',
        email: 'me@example.com',
        password: '123456'
      }, function (err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({
          _id: '...',
          email_verified: false,
          email: 'me@example.com'
        });
        done();
      });
    });
  });

  context('dbConnection change password options', function () {
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

  context('dbConnection change password', function () {
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

    it('should call db-connection changePassword with all the options', function (done) {
      stub(request, 'post', function (url) {
        expect(url).to.be('https://me.auth0.com/dbconnection/change_password');
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
            cb(null, {});
          }
        });
      });

      this.auth0.dbConnection.changePassword({
        connection: 'the_connection',
        email: 'me@example.com'
      }, function (err) {
        expect(err).to.be(null);
        done();
      });
    });

    it('should call db-connection changePassword should ignore password option', function (done) {
      stub(request, 'post', function (url) {
        expect(url).to.be('https://me.auth0.com/dbconnection/change_password');
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
            cb(null, {});
          }
        });
      });

      this.auth0.dbConnection.changePassword({
        connection: 'the_connection',
        email: 'me@example.com',
        password: '123456'
      }, function (err) {
        expect(err).to.be(null);
        done();
      });
    });
  });
});
