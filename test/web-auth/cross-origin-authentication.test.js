var expect = require('expect.js');
var stub = require('sinon').stub;
var spy = require('sinon').spy;
var request = require('superagent');

var storage = require('../../src/helper/storage');
var IframeHandler = require('../../src/helper/iframe-handler');

var RequestMock = require('../mock/request-mock');

var TransactionManager = require('../../src/web-auth/transaction-manager');
var SilentAuthenticationHandler = require('../../src/web-auth/silent-authentication-handler');
var CrossOriginAuthentication = require('../../src/web-auth/cross-origin-authentication');
var WebAuth = require('../../src/web-auth');
var windowHelper = require('../../src/helper/window');
var WebMessageHandler = require('../../src/web-auth/web-message-handler');

describe('auth0.WebAuth.crossOriginAuthentication', function() {
  context('login', function() {
    before(function() {
      this.webAuthSpy = {
        authorize: spy(),
        baseOptions: {}
      };
      this.co = new CrossOriginAuthentication(this.webAuthSpy, {
        rootUrl: 'https://me.auth0.com',
        clientID: '...',
        _sendTelemetry: false,
        redirectUri: 'https://page.com/callback'
      });
      global.window = {};
      global.window.sessionStorage = {};
    });
    afterEach(function() {
      request.post.restore();
      this.webAuthSpy.authorize = spy();
      if (windowHelper.redirect.restore) {
        windowHelper.redirect.restore();
      }
      if (WebMessageHandler.prototype.run.restore) {
        WebMessageHandler.prototype.run.restore();
      }
      if (storage.setItem.restore) {
        storage.setItem.restore();
      }
    });
    it('should call /co/authenticate and redirect to /authorize with login_ticket using `username`', function() {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/co/authenticate');
        return new RequestMock({
          body: {
            client_id: '...',
            credential_type: 'password',
            username: 'me@example.com',
            password: '123456'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {
                login_ticket: 'a_login_ticket',
                co_verifier: 'co_verifier',
                co_id: 'co_id'
              }
            });
          }
        });
      });
      this.co.login({
        username: 'me@example.com',
        password: '123456',
        anotherOption: 'foobar'
      });
      expect(this.webAuthSpy.authorize.getCall(0).args[0]).to.be.eql({
        username: 'me@example.com',
        loginTicket: 'a_login_ticket',
        anotherOption: 'foobar'
      });
    });
    it('should call /co/authenticate and redirect to /authorize with login_ticket using `email`', function() {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/co/authenticate');
        return new RequestMock({
          body: {
            client_id: '...',
            credential_type: 'password',
            username: 'me@example.com',
            password: '123456'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {
                login_ticket: 'a_login_ticket',
                co_verifier: 'co_verifier',
                co_id: 'co_id'
              }
            });
          }
        });
      });
      this.co.login({
        email: 'me@example.com',
        password: '123456',
        anotherOption: 'foobar'
      });
      expect(this.webAuthSpy.authorize.getCall(0).args[0]).to.be.eql({
        username: 'me@example.com',
        loginTicket: 'a_login_ticket',
        anotherOption: 'foobar'
      });
    });
    it('should call /co/authenticate and call `webMessageHandler.run` when popup:true', function(
      done
    ) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/co/authenticate');
        return new RequestMock({
          body: {
            client_id: '...',
            credential_type: 'password',
            username: 'me@example.com',
            password: '123456'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {
                login_ticket: 'a_login_ticket',
                co_verifier: 'co_verifier',
                co_id: 'co_id'
              }
            });
          }
        });
      });
      stub(WebMessageHandler.prototype, 'run', function(options, callback) {
        expect(options).to.be.eql({
          username: 'me@example.com',
          loginTicket: 'a_login_ticket',
          anotherOption: 'foobar'
        });
        callback();
      });
      this.co.login(
        {
          username: 'me@example.com',
          password: '123456',
          anotherOption: 'foobar',
          popup: true
        },
        function() {
          done();
        }
      );
    });
    it('should map error correctly when popup:true', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/co/authenticate');
        return new RequestMock({
          body: {
            client_id: '...',
            credential_type: 'password',
            username: 'me@example.com',
            password: '123456'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {
                login_ticket: 'a_login_ticket',
                co_verifier: 'co_verifier',
                co_id: 'co_id'
              }
            });
          }
        });
      });
      stub(WebMessageHandler.prototype, 'run', function(options, callback) {
        callback({ error: 'any error', error_description: 'a huge error string' });
      });
      this.co.login(
        {
          username: 'me@example.com',
          password: '123456',
          anotherOption: 'foobar',
          popup: true
        },
        function(err) {
          expect(err).to.be.eql({
            original: {
              error: 'any error',
              error_description: 'a huge error string'
            },
            code: 'any error',
            description: 'a huge error string',
            error: 'any error',
            error_description: 'a huge error string'
          });
          done();
        }
      );
    });
    it('should call /co/authenticate with realm grant and redirect to /authorize with login_ticket when realm is used', function() {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/co/authenticate');
        return new RequestMock({
          body: {
            client_id: '...',
            credential_type: 'http://auth0.com/oauth/grant-type/password-realm',
            username: 'me@example.com',
            password: '123456',
            realm: 'a-connection'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {
                login_ticket: 'a_login_ticket',
                co_verifier: 'co_verifier',
                co_id: 'co_id'
              }
            });
          }
        });
      });
      this.co.login({
        username: 'me@example.com',
        password: '123456',
        realm: 'a-connection'
      });
      expect(this.webAuthSpy.authorize.getCall(0).args[0]).to.be.eql({
        username: 'me@example.com',
        loginTicket: 'a_login_ticket',
        realm: 'a-connection'
      });
    });
    it('should work with custom realm, grant and otp', function() {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/co/authenticate');
        return new RequestMock({
          body: {
            client_id: '...',
            credential_type: 'http://auth0.com/oauth/grant-type/passwordless/otp',
            username: 'me@example.com',
            otp: '123456',
            realm: 'email'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {
                login_ticket: 'a_login_ticket',
                co_verifier: 'co_verifier',
                co_id: 'co_id'
              }
            });
          }
        });
      });
      this.co.login({
        username: 'me@example.com',
        otp: '123456',
        realm: 'email',
        credentialType: 'http://auth0.com/oauth/grant-type/passwordless/otp'
      });
      expect(this.webAuthSpy.authorize.getCall(0).args[0]).to.be.eql({
        username: 'me@example.com',
        loginTicket: 'a_login_ticket',
        realm: 'email'
      });
    });
    it('should call /co/authenticate and save the verifier in sessionStorage', function() {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/co/authenticate');
        return new RequestMock({
          body: {
            client_id: '...',
            credential_type: 'password',
            username: 'me@example.com',
            password: '123456'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {
                login_ticket: 'a_login_ticket',
                co_verifier: 'co_verifier',
                co_id: 'co_id'
              }
            });
          }
        });
      });
      this.co.login({
        username: 'me@example.com',
        password: '123456',
        anotherOption: 'foobar'
      });
      expect(global.window.sessionStorage).to.be.eql({
        'co/verifier/https%3A%2F%2Fme.auth0.com/co_id': 'co_verifier'
      });
    });
    context(
      'should call callback and not redirect to authorize when it is an authentication error',
      function() {
        it('with error_description', function(done) {
          stub(request, 'post', function(url) {
            expect(url).to.be('https://me.auth0.com/co/authenticate');
            return new RequestMock({
              body: {
                client_id: '...',
                credential_type: 'password',
                username: 'me@example.com',
                password: '123456'
              },
              headers: {
                'Content-Type': 'application/json'
              },
              cb: function(cb) {
                cb({
                  response: {
                    body: {
                      error: 'any_error',
                      error_description: 'a super big error message description'
                    }
                  }
                });
              }
            });
          });
          var _this = this;
          this.co.login(
            {
              username: 'me@example.com',
              password: '123456',
              anotherOption: 'foobar'
            },
            function(err) {
              expect(err).to.be.eql({
                original: {
                  error: 'any_error',
                  error_description: 'a super big error message description'
                },
                code: 'any_error',
                description: 'a super big error message description',
                error: 'any_error',
                error_description: 'a super big error message description'
              });
              expect(_this.webAuthSpy.authorize.called).to.be.eql(false);
              done();
            }
          );
        });
        it('without error_description', function(done) {
          stub(request, 'post', function(url) {
            expect(url).to.be('https://me.auth0.com/co/authenticate');
            return new RequestMock({
              body: {
                client_id: '...',
                credential_type: 'password',
                username: 'me@example.com',
                password: '123456'
              },
              headers: {
                'Content-Type': 'application/json'
              },
              cb: function(cb) {
                cb({ some: 'error' });
              }
            });
          });
          var _this = this;
          this.co.login(
            {
              username: 'me@example.com',
              password: '123456',
              anotherOption: 'foobar'
            },
            function(err) {
              expect(err).to.be.eql({
                original: {
                  error: 'request_error',
                  error_description: '{"some":"error"}'
                },
                code: 'request_error',
                description: '{"some":"error"}',
                error: 'request_error',
                error_description: '{"some":"error"}'
              });
              expect(_this.webAuthSpy.authorize.called).to.be.eql(false);
              done();
            }
          );
        });
      }
    );
  });
  context('callback', function() {
    before(function() {
      this.co = new CrossOriginAuthentication(
        { baseOptions: {} },
        {
          rootUrl: 'https://me.auth0.com',
          clientID: '...',
          _sendTelemetry: false,
          redirectUri: 'https://page.com/callback'
        }
      );
      global.window = {
        addEventListener: spy(),
        sessionStorage: {
          'co/verifier/https%3A%2F%2Fme.auth0.com/co_id': 'co_verifier',
          removeItem: spy()
        },
        parent: {
          postMessage: spy()
        },
        location: {
          hash: '#origin=origin'
        }
      };
    });
    it('should call parent.postMessage on load', function() {
      this.co.callback();
      var theCall = global.window.parent.postMessage.getCall(0);
      expect(theCall.args[0]).to.be.eql({ type: 'ready' });
      expect(theCall.args[1]).to.be('origin');
    });
    it('should add a listener to the message event', function() {
      this.co.callback();
      var theCall = global.window.addEventListener.getCall(0);
      expect(theCall.args[0]).to.be('message');
    });
    context('when a message is received', function() {
      it('should ignore if the message.data.type !== co_verifier_request', function() {
        this.co.callback();
        var theCall = global.window.addEventListener.getCall(0);
        var evt = {
          data: {
            type: 'foobar'
          }
        };
        theCall.args[1](evt);
        expect(global.window.sessionStorage.removeItem.called).to.be(false);
      });
      it('should remove item from sessionStorage', function() {
        this.co.callback();
        var onMessageHandler = global.window.addEventListener.getCall(0).args[1];
        var evt = {
          origin: 'https://me.auth0.com',
          data: {
            type: 'co_verifier_request',
            request: {
              id: 'co_id'
            }
          },
          source: {
            postMessage: function() {}
          }
        };
        onMessageHandler(evt);
        var theCall = global.window.sessionStorage.removeItem.getCall(0);
        expect(theCall.args[0]).to.be('co/verifier/https%3A%2F%2Fme.auth0.com/co_id');
      });
      it('should send the verifier response', function() {
        this.co.callback();
        var onMessageHandler = global.window.addEventListener.getCall(0).args[1];
        var evt = {
          origin: 'https://me.auth0.com',
          data: {
            type: 'co_verifier_request',
            request: {
              id: 'co_id'
            }
          },
          source: {
            postMessage: spy()
          }
        };
        onMessageHandler(evt);
        var theCall = evt.source.postMessage.getCall(0);
        expect(theCall.args[0]).to.be.eql({
          type: 'co_verifier_response',
          response: { verifier: 'co_verifier' }
        });
        expect(theCall.args[1]).to.be('https://me.auth0.com');
      });
      it('should send empty verifier in the response when sessionStorage can not be accessed', function() {
        global.window.sessionStorage = undefined;
        this.co.callback();
        var onMessageHandler = global.window.addEventListener.getCall(0).args[1];
        var evt = {
          origin: 'https://me.auth0.com',
          data: {
            type: 'co_verifier_request',
            request: {
              id: 'co_id'
            }
          },
          source: {
            postMessage: spy()
          }
        };
        onMessageHandler(evt);
        var theCall = evt.source.postMessage.getCall(0);
        expect(theCall.args[0]).to.be.eql({
          type: 'co_verifier_response',
          response: { verifier: '' }
        });
        expect(theCall.args[1]).to.be('https://me.auth0.com');
      });
    });
  });
});
