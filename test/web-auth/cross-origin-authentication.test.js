import expect from 'expect.js';
import sinon from 'sinon';
import request from 'superagent';

import Storage from '../../src/helper/storage';
import * as times from '../../src/helper/times';
import RequestMock from '../mock/request-mock';

import CrossOriginAuthentication from '../../src/web-auth/cross-origin-authentication';
import windowHelper from '../../src/helper/window';
import WebMessageHandler from '../../src/web-auth/web-message-handler';

describe('auth0.WebAuth.crossOriginAuthentication', function() {
  context('login', function() {
    before(function() {
      this.webAuthSpy = {
        authorize: sinon.spy(),
        baseOptions: {}
      };
      this.co = new CrossOriginAuthentication(this.webAuthSpy, {
        rootUrl: 'https://me.auth0.com',
        clientID: '...',
        _sendTelemetry: false,
        redirectUri: 'https://page.com/callback'
      });
      global.window = {};
    });
    beforeEach(function() {
      sinon.spy(Storage.prototype, 'setItem');
    });
    afterEach(function() {
      request.post.restore();
      Storage.prototype.setItem.restore();
      this.webAuthSpy.authorize = sinon.spy();
      if (windowHelper.redirect.restore) {
        windowHelper.redirect.restore();
      }
      if (WebMessageHandler.prototype.run.restore) {
        WebMessageHandler.prototype.run.restore();
      }
    });
    it('should call /co/authenticate and redirect to /authorize with login_ticket using `username`', function() {
      sinon.stub(request, 'post').callsFake(function(url) {
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
      sinon.stub(request, 'post').callsFake(function(url) {
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
    it('should call /co/authenticate and call `webMessageHandler.run` when popup:true', function(done) {
      sinon.stub(request, 'post').callsFake(function(url) {
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
      sinon
        .stub(WebMessageHandler.prototype, 'run')
        .callsFake(function(options, callback) {
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
      sinon.stub(request, 'post').callsFake(function(url) {
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
      sinon
        .stub(WebMessageHandler.prototype, 'run')
        .callsFake(function(options, callback) {
          callback({
            error: 'any error',
            error_description: 'a huge error string'
          });
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
      sinon.stub(request, 'post').callsFake(function(url) {
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
      sinon.stub(request, 'post').callsFake(function(url) {
        expect(url).to.be('https://me.auth0.com/co/authenticate');
        return new RequestMock({
          body: {
            client_id: '...',
            credential_type:
              'http://auth0.com/oauth/grant-type/passwordless/otp',
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
    it('should call /co/authenticate and save the verifier in storage', function() {
      sinon.stub(request, 'post').callsFake(function(url) {
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
      expect(Storage.prototype.setItem.callCount).to.be(1);
      expect(Storage.prototype.setItem.firstCall.args).to.be.eql([
        'co/verifier/https%3A%2F%2Fme.auth0.com/co_id',
        'co_verifier',
        { expires: times.MINUTES_15 }
      ]);
    });
    context(
      'should call callback and not redirect to authorize when it is an authentication error',
      function() {
        it('with error_description', function(done) {
          sinon.stub(request, 'post').callsFake(function(url) {
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
          sinon.stub(request, 'post').callsFake(function(url) {
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
        addEventListener: sinon.spy(),
        parent: {
          postMessage: sinon.spy()
        },
        location: {
          hash: '#origin=origin'
        }
      };
    });
    beforeEach(function() {
      sinon.spy(Storage.prototype, 'removeItem');
      sinon.stub(Storage.prototype, 'getItem').callsFake(function(key) {
        expect(key).to.be('co/verifier/https%3A%2F%2Fme.auth0.com/co_id');
        return 'co_verifier';
      });
    });
    afterEach(function() {
      Storage.prototype.getItem.restore();
      Storage.prototype.removeItem.restore();
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
        expect(Storage.prototype.removeItem.called).to.be(false);
      });
      it('should remove item from storage', function() {
        this.co.callback();
        var onMessageHandler = global.window.addEventListener.getCall(0)
          .args[1];
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
        var theCall = Storage.prototype.removeItem.getCall(0);
        expect(theCall.args[0]).to.be(
          'co/verifier/https%3A%2F%2Fme.auth0.com/co_id'
        );
      });
      it('should send the verifier response', function() {
        this.co.callback();
        var onMessageHandler = global.window.addEventListener.getCall(0)
          .args[1];
        var evt = {
          origin: 'https://me.auth0.com',
          data: {
            type: 'co_verifier_request',
            request: {
              id: 'co_id'
            }
          },
          source: {
            postMessage: sinon.spy()
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
      it('should send empty verifier in the response when storage can not be accessed', function() {
        Storage.prototype.getItem.restore();
        sinon.stub(Storage.prototype, 'getItem').callsFake(function() {
          throw new Error('');
        });
        this.co.callback();
        var onMessageHandler = global.window.addEventListener.getCall(0)
          .args[1];
        var evt = {
          origin: 'https://me.auth0.com',
          data: {
            type: 'co_verifier_request',
            request: {
              id: 'co_id'
            }
          },
          source: {
            postMessage: sinon.spy()
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
