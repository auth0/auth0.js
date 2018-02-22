var expect = require('expect.js');
var stub = require('sinon').stub;

var RequestMock = require('../mock/request-mock');
var request = require('superagent');

var RequestBuilder = require('../../src/helper/request-builder');
var Authentication = require('../../src/authentication');
var telemetryInfo = new RequestBuilder({}).getTelemetryData();

describe('auth0.authentication', function() {
  context('dbConnection signup options', function() {
    before(function() {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code'
      });
    });

    it('should check that options is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.dbConnection.signup();
      }).to.throwException(function(e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should check that options.connection is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.dbConnection.signup({});
      }).to.throwException(function(e) {
        expect(e.message).to.be('connection option is required');
      });
    });

    it('should check that options.email is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.dbConnection.signup({ connection: 'bla' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('email option is required');
      });
    });

    it('should check that options.password is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.dbConnection.signup({ connection: 'bla', email: 'blabla' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('password option is required');
      });
    });

    it('should check that cb is valid', function() {
      var _this = this;
      expect(function() {
        _this.auth0.dbConnection.signup({ connection: 'bla', email: 'blabla', password: '123456' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });

    context('additional fields', function() {
      afterEach(function() {
        request.post.restore();
      });

      it('should send metadata on signup', function(done) {
        stub(request, 'post', function(url) {
          expect(url).to.be('https://me.auth0.com/dbconnections/signup');
          expect;
          return new RequestMock({
            body: {
              client_id: '...',
              email: 'the email',
              password: 'the password',
              connection: 'the_connection',
              user_metadata: {
                firstName: 'Toon',
                lastName: 'De Coninck'
              }
            },
            headers: {
              'Content-Type': 'application/json',
              'Auth0-Client': telemetryInfo
            },
            cb: function(cb) {
              cb(null, {
                body: {
                  email: 'the email'
                }
              });
            }
          });
        });

        this.auth0.dbConnection.signup(
          {
            email: 'the email',
            password: 'the password',
            connection: 'the_connection',
            user_metadata: {
              firstName: 'Toon',
              lastName: 'De Coninck'
            }
          },
          function(err, data) {
            expect(err).to.be(null);
            expect(data).to.eql({
              email: 'the email'
            });
            done();
          }
        );
      });

      it('should send metadata on signup when using camel case', function(done) {
        stub(request, 'post', function(url) {
          expect(url).to.be('https://me.auth0.com/dbconnections/signup');
          expect;
          return new RequestMock({
            body: {
              client_id: '...',
              email: 'the email',
              password: 'the password',
              connection: 'the_connection',
              user_metadata: {
                firstName: 'Toon',
                lastName: 'De Coninck',
                last_location: 'Mexico'
              }
            },
            headers: {
              'Content-Type': 'application/json',
              'Auth0-Client': telemetryInfo
            },
            cb: function(cb) {
              cb(null, {
                body: {
                  email: 'the email'
                }
              });
            }
          });
        });

        this.auth0.dbConnection.signup(
          {
            email: 'the email',
            password: 'the password',
            connection: 'the_connection',
            userMetadata: {
              firstName: 'Toon',
              lastName: 'De Coninck',
              last_location: 'Mexico'
            }
          },
          function(err, data) {
            expect(err).to.be(null);
            expect(data).to.eql({
              email: 'the email'
            });
            done();
          }
        );
      });
    });
  });

  context('change password options', function() {
    before(function() {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    it('should check that options is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.dbConnection.changePassword();
      }).to.throwException(function(e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should check that options.connection is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.dbConnection.changePassword({});
      }).to.throwException(function(e) {
        expect(e.message).to.be('connection option is required');
      });
    });

    it('should check that options.email is passed', function() {
      var _this = this;
      expect(function() {
        _this.auth0.dbConnection.changePassword({ connection: 'bla' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('email option is required');
      });
    });

    it('should check that cb is valid', function() {
      var _this = this;
      expect(function() {
        _this.auth0.dbConnection.changePassword({
          connection: 'bla',
          email: 'blabla',
          password: '123456'
        });
      }).to.throwException(function(e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });
  });
});
