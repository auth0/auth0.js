var expect = require('expect.js');
var stub = require('sinon').stub;
var request = require('superagent');

var RequestMock = require('../mock/request-mock');
var UsernamePassword = require('../../src/web-auth/username-password');
var windowHelper = require('../../src/helper/window');
var WebAuth = require('../../src/web-auth');
var RequestBuilder = require('../../src/helper/request-builder');

var telemetryInfo = (new RequestBuilder({})).getTelemetryData();

describe('auth0.WebAuth.redirect', function () {

  context('signup', function () {
    before(function () {
      this.auth0 = new WebAuth({
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

      this.auth0.signup({
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

  context('login', function () {
    afterEach(function () {
      request.post.restore();
      windowHelper.getDocument.restore();
    });

    it('should authenticate the user, render the callback form and submit it', function (done) {
      stub(request, 'post', function (url) {
        expect(url).to.be('https://me.auth0.com/usernamepassword/login');
        return new RequestMock({
          body: {
            client_id: '0HP71GSd6PuoRY',
            connection: 'tests',
            password: '1234',
            redirect_uri: 'http://localhost:3000/example/',
            response_type: 'token',
            scope: 'openid',
            tenant: 'me',
            username: 'me@example.com'
          },
          headers: {
            'Content-Type': 'application/json',
            'Auth0-Client': telemetryInfo
          },
          cb: function (cb) {
            cb(null, {
              text: 'the_form_html'
            });
          }
        });
      });

      stub(windowHelper, 'getDocument', function () {
        return {
          createElement: function () {
            return {}
          },
          body: {
            appendChild: function (element) {
              expect(element.innerHTML).to.eql('the_form_html');
              return {
                children: [{
                  submit: done
                }]
              };
            }
          }
        };
      });

      var configuration = {
        domain: 'me.auth0.com',
        redirectUri: 'http://localhost:3000/example/',
        clientID: '0HP71GSd6PuoRY',
        responseType: 'token'
      };

      var auth0 = new WebAuth(configuration);

      auth0.redirect.login({
        connection: 'tests',
        username: 'me@example.com',
        password: '1234',
        scope: 'openid'
      }, function (err) {
        console.log(err);
      });
    });
  });

  context('login', function () {
    afterEach(function () {
      request.post.restore();
    });

    it('should propagate the error', function (done) {
      stub(request, 'post', function (url) {
        expect(url).to.be('https://me.auth0.com/usernamepassword/login');
        return new RequestMock({
          body: {
            client_id: '0HP71GSd6PuoRY',
            connection: 'tests',
            password: '1234',
            redirect_uri: 'http://localhost:3000/example/',
            response_type: 'token',
            scope: 'openid',
            tenant: 'me',
            username: 'me@example.com'
          },
          headers: {
            'Content-Type': 'application/json',
            'Auth0-Client': telemetryInfo
          },
          cb: function (cb) {
            cb({
              'name': 'ValidationError',
              'code': 'invalid_user_password',
              'description': 'Wrong email or password.'
            });
          }
        });
      });

      var configuration = {
        domain: 'me.auth0.com',
        redirectUri: 'http://localhost:3000/example/',
        clientID: '0HP71GSd6PuoRY',
        responseType: 'token'
      };

      var auth0 = new WebAuth(configuration);

      auth0.redirect.login({
        connection: 'tests',
        email: 'me@example.com',
        password: '1234',
        scope: 'openid'
      }, function (err) {
        expect(err).to.eql({
          'original': {
            'name': 'ValidationError',
            'code': 'invalid_user_password',
            'description': 'Wrong email or password.'
          },
          'name': 'ValidationError',
          'code': 'invalid_user_password',
          'description': 'Wrong email or password.'
        });
        done();
      });
    });
  });

  context('signup and login', function () {
    before(function () {
      this.auth0 = new WebAuth({
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

    it('should call db-connection signup with all the options', function (done) {
      stub(request, 'post', function (url) {

        if (url === 'https://me.auth0.com/usernamepassword/login') {
          return new RequestMock({
            body: {
              client_id: '...',
              connection: 'the_connection',
              password: '123456',
              redirect_uri: 'http://page.com/callback',
              response_type: 'code',
              scope: 'openid',
              tenant: 'me',
              username: 'me@example.com'
            },
            headers: {
              'Content-Type': 'application/json'
            },
            cb: function (cb) {
              cb({
                response: {
                  body: {
                    'name': 'ValidationError',
                    'code': 'invalid_user_password',
                    'description': 'Wrong email or password.'
                  },
                  'statusCode': 400
                }
              });
            }
          });
        } else if (url === 'https://me.auth0.com/dbconnection/signup'){
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
        }

        throw new Error('Invalid URL');
      });

      this.auth0.redirect.signupAndLogin({
        connection: 'the_connection',
        email: 'me@example.com',
        password: '123456',
        scope: 'openid'
      }, function (err, data) {
        expect(data).to.be(undefined);
        expect(err).to.eql({
          'original': {
            'response': {
              'body': {
                'name': 'ValidationError',
                'code': 'invalid_user_password',
                'description': 'Wrong email or password.'
              },
              'statusCode': 400
            }
          },
          'name': 'ValidationError',
          'code': 'invalid_user_password',
          'description': 'Wrong email or password.',
          'status_code': 400
        });
        done();
      });
    });

    it('should propagate signup errors', function (done) {
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
            cb({
              response: {
                "statusCode":400,
                body: {
                  "code":"user_exists",
                  "description":"The user already exists."
                }
              }
            });
          }
        });
      });

      this.auth0.redirect.signupAndLogin({
        connection: 'the_connection',
        email: 'me@example.com',
        password: '123456',
        scope: 'openid'
      }, function (err, data) {
        expect(data).to.be(undefined);
        expect(err).to.eql({
          original: {
            response: {
              "statusCode":400,
              body: {
                "code":"user_exists",
                "description":"The user already exists."
              }
            }
          },
          "code":"user_exists",
          "description":"The user already exists.",
          "status_code":400
        });
        done();
      });
    });
  });

  context('passwordlessVerify', function() {
    before(function () {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code'
      });
    });

    afterEach(function () {
      request.post.restore();
      windowHelper.redirect.restore();
    });

    it('should verify the code and redirect to the passwordless verify page', function(done){
      stub(windowHelper, 'redirect', function (url) {
        expect(url).to.be("https://me.auth0.com/passwordless/verify_redirect?client_id=...&response_type=code&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback&connection=the_connection&phone_number=123456&verification_code=abc&auth0Client=" + telemetryInfo);
        done();
      });

      stub(request, 'post', function (url) {
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
          cb: function (cb) {
            cb(null, {
              body: {}
            });
          }
        });
      });

      this.auth0.passwordlessVerify({
        connection: 'the_connection',
        phoneNumber: '123456',
        type: 'sms',
        verificationCode: 'abc'
      }, function (err) {});
    });
  });

  context('passwordlessVerify without telemetry', function() {
    before(function () {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function () {
      request.post.restore();
      windowHelper.redirect.restore();
    });

    it('should verify the code and redirect to the passwordless verify page', function(done){
      stub(windowHelper, 'redirect', function (url) {
        expect(url).to.be("https://me.auth0.com/passwordless/verify_redirect?client_id=...&response_type=code&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback&connection=the_connection&phone_number=123456&verification_code=abc");
        done();
      });

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

      this.auth0.passwordlessVerify({
        connection: 'the_connection',
        phoneNumber: '123456',
        type: 'sms',
        verificationCode: 'abc'
      }, function (err) {});
    });
  });
  context('passwordlessVerify with error', function() {
    before(function () {
      this.auth0 = new WebAuth({
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

    it('should verify the code and redirect to the passwordless verify page', function(done){
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
            cb({
              error: 'some_error_code',
              error_description: 'Some error description'
            });
          }
        });
      });

      this.auth0.passwordlessVerify({
        connection: 'the_connection',
        phoneNumber: '123456',
        type: 'sms',
        verificationCode: 'abc'
      }, function (err) {
        expect(err).to.eql({
          original: {
            error: 'some_error_code',
            error_description: 'Some error description'
          },
          code: 'some_error_code',
          description: 'Some error description'
        });
        done();
      });
    });
  });

  describe('authenticate', function () {
    beforeEach(function() {
      global.window = { location: '' };
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    it('should redirect to authorize', function () {
      this.auth0.login({connection: 'facebook'})
      expect(global.window.location).to.be('https://me.auth0.com/authorize?client_id=...&response_type=code&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback&connection=facebook');
    });

    it('should redirect to logout', function () {
      this.auth0.logout({redirect_to: 'http://example.com/logout'})
      expect(global.window.location).to.be('https://me.auth0.com/v2/logout?client_id=...&redirect_to=http%3A%2F%2Fexample.com%2Flogout');
    });
  });

});
