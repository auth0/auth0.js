import expect from 'expect.js';
import { stub } from 'sinon';
import request from 'superagent';

import RequestMock from '../mock/request-mock';
import UsernamePassword from '../../src/web-auth/username-password';
import windowHelper from '../../src/helper/window';
import WebAuth from '../../src/web-auth';
import TransactionManager from '../../src/web-auth/transaction-manager';
import RequestBuilder from '../../src/helper/request-builder';

var telemetryInfo = new RequestBuilder({}).getTelemetryData();

describe('auth0.WebAuth._universalLogin', function() {
  beforeEach(function() {
    stub(TransactionManager.prototype, 'process', function(params) {
      return params;
    });
  });
  afterEach(function() {
    TransactionManager.prototype.process.restore();
  });
  context('login', function() {
    beforeEach(function() {
      stub(windowHelper, 'getWindow', function() {
        return {
          location: {
            host: 'me.auth0.com'
          },
          crypto: {
            getRandomValues: function() {
              return [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
            }
          }
        };
      });
    });
    afterEach(function() {
      windowHelper.getWindow.restore();
      if (request.post.restore) {
        request.post.restore();
      }
      if (windowHelper.getDocument.restore) {
        windowHelper.getDocument.restore();
      }
    });
    it('should throw an error if window.location.host !== domain', function() {
      var configuration = {
        domain: 'other-domain.auth0.com',
        redirectUri: 'https://localhost:3000/example/',
        clientID: '0HP71GSd6PuoRY',
        responseType: 'token'
      };

      var auth0 = new WebAuth(configuration);

      expect(function() {
        auth0._universalLogin.login({
          connection: 'tests',
          email: 'me@example.com',
          password: '1234',
          scope: 'openid'
        });
      }).throwError('This method is meant to be used only inside the Universal Login Page.');
    });

    it('should authenticate the user, render the callback form and submit it', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/usernamepassword/login');
        return new RequestMock({
          body: {
            client_id: '0HP71GSd6PuoRY',
            connection: 'tests',
            password: '1234',
            redirect_uri: 'https://localhost:3000/example/',
            response_type: 'id_token',
            scope: 'openid',
            tenant: 'me',
            username: 'me@example.com'
          },
          headers: {
            'Content-Type': 'application/json',
            'Auth0-Client': telemetryInfo
          },
          cb: function(cb) {
            cb(null, {
              text: 'the_form_html',
              type: 'text/html'
            });
          }
        });
      });

      stub(windowHelper, 'getDocument', function() {
        return {
          createElement: function() {
            return {};
          },
          body: {
            appendChild: function(element) {
              expect(element.innerHTML).to.eql('the_form_html');
              return {
                children: [
                  {
                    submit: done
                  }
                ]
              };
            }
          }
        };
      });

      var configuration = {
        domain: 'me.auth0.com',
        redirectUri: 'https://localhost:3000/example/',
        clientID: '0HP71GSd6PuoRY',
        responseType: 'id_token'
      };

      var auth0 = new WebAuth(configuration);

      auth0._universalLogin.login(
        {
          connection: 'tests',
          username: 'me@example.com',
          password: '1234',
          scope: 'openid'
        },
        function(err) {
          console.log(err);
        }
      );
    });
    it('should use transactionManager.process', function(done) {
      stub(request, 'post', function() {
        expect(TransactionManager.prototype.process.calledOnce).to.be(true);
        done();
      });

      var auth0 = new WebAuth({
        domain: 'me.auth0.com',
        redirectUri: 'https://localhost:3000/example/',
        clientID: '0HP71GSd6PuoRY',
        responseType: 'id_token'
      });

      auth0._universalLogin.login({
        connection: 'tests',
        username: 'me@example.com',
        password: '1234',
        scope: 'openid'
      });
    });
    it('should propagate the error', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/usernamepassword/login');
        return new RequestMock({
          body: {
            client_id: '0HP71GSd6PuoRY',
            connection: 'tests',
            password: '1234',
            redirect_uri: 'https://localhost:3000/example/',
            response_type: 'token',
            scope: 'openid',
            tenant: 'me',
            username: 'me@example.com'
          },
          headers: {
            'Content-Type': 'application/json',
            'Auth0-Client': telemetryInfo
          },
          cb: function(cb) {
            cb({
              name: 'ValidationError',
              code: 'invalid_user_password',
              description: 'Wrong email or password.'
            });
          }
        });
      });

      var configuration = {
        domain: 'me.auth0.com',
        redirectUri: 'https://localhost:3000/example/',
        clientID: '0HP71GSd6PuoRY',
        responseType: 'token'
      };

      var auth0 = new WebAuth(configuration);

      auth0._universalLogin.login(
        {
          connection: 'tests',
          email: 'me@example.com',
          password: '1234',
          scope: 'openid'
        },
        function(err) {
          expect(err).to.eql({
            original: {
              name: 'ValidationError',
              code: 'invalid_user_password',
              description: 'Wrong email or password.'
            },
            name: 'ValidationError',
            code: 'invalid_user_password',
            description: 'Wrong email or password.'
          });
          done();
        }
      );
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
          location: {
            host: 'me.auth0.com'
          },
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
        if (url === 'https://me.auth0.com/usernamepassword/login') {
          return new RequestMock({
            body: {
              client_id: '...',
              connection: 'the_connection',
              password: '123456',
              redirect_uri: 'http://page.com/callback',
              response_type: 'token',
              scope: 'openid',
              tenant: 'me',
              username: 'me@example.com'
            },
            headers: {
              'Content-Type': 'application/json'
            },
            cb: function(cb) {
              cb({
                response: {
                  body: {
                    name: 'ValidationError',
                    code: 'invalid_user_password',
                    description: 'Wrong email or password.'
                  },
                  statusCode: 400
                }
              });
            }
          });
        } else if (url === 'https://me.auth0.com/dbconnections/signup') {
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
        }

        throw new Error('Invalid URL');
      });

      this.auth0._universalLogin.signupAndLogin(
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
                body: {
                  name: 'ValidationError',
                  code: 'invalid_user_password',
                  description: 'Wrong email or password.'
                },
                statusCode: 400
              }
            },
            name: 'ValidationError',
            code: 'invalid_user_password',
            description: 'Wrong email or password.',
            statusCode: 400
          });
          done();
        }
      );
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

      this.auth0._universalLogin.signupAndLogin(
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

  context('getSSOData', function() {
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
      request.get.restore();
    });

    it('should call /user/ssodata with no options', function(done) {
      stub(request, 'get', function(url) {
        expect(url).to.be('https://me.auth0.com/user/ssodata');
        return new RequestMock({
          headers: {},
          cb: function(cb) {
            cb(null, {
              body: {
                sso: false
              }
            });
          }
        });
      });

      this.auth0._universalLogin.getSSOData(function(err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({
          sso: false
        });
        done();
      });
    });
    it('should call /user/ssodata with all the AD options', function(done) {
      stub(request, 'get', function(url) {
        expect(url).to.be('https://me.auth0.com/user/ssodata?ldaps=1&client_id=...');
        return new RequestMock({
          headers: {},
          cb: function(cb) {
            cb(null, {
              body: {
                sso: false
              }
            });
          }
        });
      });

      this.auth0._universalLogin.getSSOData(true, function(err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({
          sso: false
        });
        done();
      });
    });
  });
});
