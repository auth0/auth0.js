var expect = require('expect.js');
var stub = require('sinon').stub;
var request = require('superagent');

var RequestMock = require('../mock/request-mock');
var UsernamePassword = require('../../src/web-auth/username-password');
var WebAuth = require('../../src/web-auth');
var RequestBuilder = require('../../src/helper/request-builder');

var telemetryInfo = (new RequestBuilder({})).getTelemetryData();

describe('auth0.WebAuth.redirect', function () {

  context('signup', function () {
    before(function () {
      this.auth0 = new WebAuth({
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

      this.auth0.redirect.signup({
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
      UsernamePassword.prototype.getWindowDocument.restore();
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

      stub(UsernamePassword.prototype, 'getWindowDocument', function (message) {
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
        redirect_uri: 'http://localhost:3000/example/',
        client_id: '0HP71GSd6PuoRY',
        response_type: 'token'
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
              'description': 'Wrong email or password.',
              'statusCode': 400
            });
          }
        });
      });

      var configuration = {
        domain: 'me.auth0.com',
        redirect_uri: 'http://localhost:3000/example/',
        client_id: '0HP71GSd6PuoRY',
        response_type: 'token'
      };

      var auth0 = new WebAuth(configuration);

      auth0.redirect.login({
        connection: 'tests',
        email: 'me@example.com',
        password: '1234',
        scope: 'openid'
      }, function (err) {
        expect(err).to.eql({
          'name': 'ValidationError',
          'code': 'invalid_user_password',
          'description': 'Wrong email or password.',
          'statusCode': 400
        });
        done();
      });
    });
  });

  context('signup and login', function () {
    before(function () {
      this.auth0 = new WebAuth({
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
                'name': 'ValidationError',
                'code': 'invalid_user_password',
                'description': 'Wrong email or password.',
                'statusCode': 400
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
          'name': 'ValidationError',
          'code': 'invalid_user_password',
          'description': 'Wrong email or password.',
          'statusCode': 400
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
              "name":"BadRequestError",
              "code":"user_exists",
              "description":"The user already exists.",
              "statusCode":400
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
          "name":"BadRequestError",
          "code":"user_exists",
          "description":"The user already exists.",
          "statusCode":400
        });
        done();
      });
    });
  });
});
