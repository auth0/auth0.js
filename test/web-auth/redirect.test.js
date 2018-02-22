var expect = require('expect.js');
var stub = require('sinon').stub;
var request = require('superagent');

var RequestMock = require('../mock/request-mock');
var windowHelper = require('../../src/helper/window');
var WebAuth = require('../../src/web-auth');
var RequestBuilder = require('../../src/helper/request-builder');
var CrossOriginAuthentication = require('../../src/web-auth/cross-origin-authentication');
var telemetryInfo = new RequestBuilder({}).getTelemetryData();
var TransactionManager = require('../../src/web-auth/transaction-manager');
var objectHelper = require('../../src/helper/object');

describe('auth0.WebAuth.redirect', function() {
  before(function() {
    stub(TransactionManager.prototype, 'generateTransaction', function(appState, state, nonce) {
      return { state: state || 'randomState', nonce: nonce || 'randomNonce' };
    });
  });
  after(function() {
    TransactionManager.prototype.generateTransaction.restore();
  });
  context('signup', function() {
    before(function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function() {
      request.post.restore();
    });

    it('should call db-connection signup with all the options', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/dbconnections/signup');
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
          cb: function(cb) {
            cb(null, {
              body: {
                email_verified: false,
                email: 'me@example.com'
              }
            });
          }
        });
      });

      this.auth0.signup(
        {
          connection: 'the_connection',
          email: 'me@example.com',
          password: '123456'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({
            emailVerified: false,
            email: 'me@example.com'
          });
          done();
        }
      );
    });
  });

  context('login', function() {
    before(function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });
    afterEach(function() {
      if (CrossOriginAuthentication.prototype.login.restore) {
        CrossOriginAuthentication.prototype.login.restore();
      }
      if (CrossOriginAuthentication.prototype.callback.restore) {
        CrossOriginAuthentication.prototype.callback.restore();
      }
    });
    it('should call CrossOriginAuthentication.login', function(done) {
      var inputOptions = { foo: 'bar', connection: 'realm' };
      var expectedOptions = { foo: 'bar', realm: 'realm' };
      stub(CrossOriginAuthentication.prototype, 'login', function(options, cb) {
        expect(options).to.be.eql(expectedOptions);
        expect(cb()).to.be('cb');
        done();
      });
      this.auth0.redirect.loginWithCredentials(inputOptions, function() {
        return 'cb';
      });
    });
  });

  context('signup and login', function() {
    before(function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'token',
        _sendTelemetry: false
      });
      stub(windowHelper, 'getWindow', function() {
        return {
          crypto: {
            getRandomValues: function() {
              return [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
            }
          }
        };
      });
    });

    afterEach(function() {
      request.post.restore();
    });

    after(function() {
      windowHelper.getWindow.restore();
    });

    it('should call db-connection signup with all the options', function(done) {
      stub(request, 'post', function(url) {
        if (url !== 'https://me.auth0.com/dbconnections/signup') {
          throw new Error('Invalid URL');
        }

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
          cb: function(cb) {
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
      stub(this.auth0, 'login', function(options, cb) {
        expect(options).to.be.eql({
          email: 'me@example.com',
          password: '123456',
          scope: 'openid',
          realm: 'the_connection'
        });
        done();
      });

      this.auth0.redirect.signupAndLogin({
        connection: 'the_connection',
        email: 'me@example.com',
        password: '123456',
        scope: 'openid'
      });
    });

    it('should propagate signup errors', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/dbconnections/signup');

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
          cb: function(cb) {
            cb({
              response: {
                statusCode: 400,
                body: {
                  code: 'user_exists',
                  description: 'The user already exists.'
                }
              }
            });
          }
        });
      });

      this.auth0.redirect.signupAndLogin(
        {
          connection: 'the_connection',
          email: 'me@example.com',
          password: '123456',
          scope: 'openid'
        },
        function(err, data) {
          expect(data).to.be(undefined);
          expect(err).to.eql({
            original: {
              response: {
                statusCode: 400,
                body: {
                  code: 'user_exists',
                  description: 'The user already exists.'
                }
              }
            },
            code: 'user_exists',
            description: 'The user already exists.',
            statusCode: 400
          });
          done();
        }
      );
    });
  });

  context('passwordlessVerify', function() {
    before(function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code'
      });
    });

    afterEach(function() {
      request.post.restore();
      windowHelper.redirect.restore();
    });

    it('should verify the code and redirect to the passwordless verify page', function(done) {
      stub(windowHelper, 'redirect', function(url) {
        expect(url).to.be(
          'https://me.auth0.com/passwordless/verify_redirect?client_id=...&response_type=code&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback&connection=the_connection&phone_number=123456&verification_code=abc&state=randomState&auth0Client=' +
            encodeURIComponent(telemetryInfo)
        );
        done();
      });

      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/passwordless/verify');
        return new RequestMock({
          body: {
            connection: 'the_connection',
            phone_number: '123456',
            verification_code: 'abc'
          },
          headers: {
            'Content-Type': 'application/json',
            'Auth0-Client': telemetryInfo
          },
          cb: function(cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      this.auth0.passwordlessVerify(
        {
          connection: 'the_connection',
          phoneNumber: '123456',
          verificationCode: 'abc'
        },
        function(err) {}
      );
    });
  });

  context('passwordlessVerify without telemetry', function() {
    before(function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function() {
      request.post.restore();
      windowHelper.redirect.restore();
    });

    it('should verify the code and redirect to the passwordless verify page', function(done) {
      stub(windowHelper, 'redirect', function(url) {
        expect(url).to.be(
          'https://me.auth0.com/passwordless/verify_redirect?client_id=...&response_type=code&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback&connection=the_connection&phone_number=123456&verification_code=abc&state=randomState'
        );
        done();
      });

      stub(request, 'post', function(url) {
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
          cb: function(cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      this.auth0.passwordlessVerify(
        {
          connection: 'the_connection',
          phoneNumber: '123456',
          verificationCode: 'abc'
        },
        function(err) {}
      );
    });
  });
  context('passwordlessVerify with error', function() {
    before(function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function() {
      request.post.restore();
    });

    it('should verify the code and redirect to the passwordless verify page', function(done) {
      stub(request, 'post', function(url) {
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
          cb: function(cb) {
            cb({
              error: 'some_error_code',
              error_description: 'Some error description'
            });
          }
        });
      });

      this.auth0.passwordlessVerify(
        {
          connection: 'the_connection',
          phoneNumber: '123456',
          verificationCode: 'abc'
        },
        function(err) {
          expect(err).to.eql({
            original: {
              error: 'some_error_code',
              error_description: 'Some error description'
            },
            code: 'some_error_code',
            description: 'Some error description'
          });
          done();
        }
      );
    });
  });

  describe('authenticate', function() {
    beforeEach(function() {
      global.window = { location: '' };
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        _sendTelemetry: false
      });
    });

    it('should check that responseType is present', function() {
      var _this = this;
      expect(function() {
        _this.auth0.authorize({ connection: 'facebook' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('responseType option is required');
      });
    });

    it('should redirect to authorize', function() {
      this.auth0.authorize({
        responseType: 'code',
        connection: 'facebook',
        state: '1234',
        scope: 'openid'
      });
      expect(global.window.location).to.be(
        'https://me.auth0.com/authorize?client_id=...&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback&response_type=code&connection=facebook&state=1234&scope=openid'
      );
    });

    it('should redirect to logout', function() {
      this.auth0.logout({ redirect_to: 'http://example.com/logout' });
      expect(global.window.location).to.be(
        'https://me.auth0.com/v2/logout?client_id=...&redirect_to=http%3A%2F%2Fexample.com%2Flogout'
      );
    });
  });
});
