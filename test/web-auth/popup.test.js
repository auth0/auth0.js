var expect = require('expect.js');
var stub = require('sinon').stub;
var spy = require('sinon').spy;
var URL = require('url');
var WinChan = require('winchan');

var RequestMock = require('../mock/request-mock');
var request = require('superagent');

var PopupHandler = require('../../src/helper/popup-handler');
var windowHandler = require('../../src/helper/window');
var storage = require('../../src/helper/storage');
var WebAuth = require('../../src/web-auth');
var CrossOriginAuthentication = require('../../src/web-auth/cross-origin-authentication');
var TransactionManager = require('../../src/web-auth/transaction-manager');

describe('auth0.WebAuth.popup', function() {
  before(function() {
    this.auth0 = new WebAuth({
      domain: 'me.auth0.com',
      clientID: '...',
      redirectUri: 'http://page.com/callback',
      responseType: 'id_token',
      _sendTelemetry: false,
      popupOrigin: 'https://baseoptions.popupOrigin.com'
    });
  });

  describe('getPopupHandler', function() {
    it('should return a new instance', function() {
      var handler1 = this.auth0.popup.getPopupHandler({});
      var handler2 = this.auth0.popup.getPopupHandler({});
      expect(handler1).to.not.be(handler2);
    });
    it('should return not a new instance', function() {
      var handler1 = this.auth0.popup.getPopupHandler({});
      var handler2 = this.auth0.popup.getPopupHandler({ popupHandler: handler1 });
      expect(handler1).to.be(handler2);
    });
  });

  describe('preload should open the popup', function() {
    before(function() {
      global.window = {};
      global.window.screenX = 500;
      global.window.screenY = 500;
      global.window.outerWidth = 2000;
      global.window.outerHeight = 2000;

      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'id_token',
        _sendTelemetry: false
      });
    });

    after(function() {
      delete global.window;
    });

    it('should open the window', function() {
      global.window.open = function(url, name, windowFeatures) {
        expect(url).to.eql('about:blank');
        expect(name).to.eql('auth0_signup_popup');
        expect(windowFeatures).to.eql('width=500,height=600,left=1250,top=1200');

        return { close: function() {} };
      };

      var handler = new PopupHandler();

      this.auth0.popup.preload();
    });
  });

  context('authorize', function() {
    before(function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'id_token',
        _sendTelemetry: false
      });
    });

    afterEach(function() {
      PopupHandler.prototype.load.restore();
    });

    it('should default scope to openid', function(done) {
      stub(PopupHandler.prototype, 'load', function(url) {
        expect(url).to.be(
          'https://me.auth0.com/authorize?client_id=...&response_type=id_token&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback&connection=the_connection&state=123&nonce=456&scope=openid'
        );
        storage.setItem.restore();
        TransactionManager.prototype.process.restore();
        done();
      });
      stub(storage, 'setItem', function() {});
      stub(TransactionManager.prototype, 'process', function(options) {
        return options;
      });

      this.auth0.popup.authorize({
        connection: 'the_connection',
        state: '123',
        nonce: '456',
        scope: 'openid'
      });
    });

    it('should open the popup a with the proper parameters', function(done) {
      stub(PopupHandler.prototype, 'load', function(url, relayUrl, options, cb) {
        expect(relayUrl).to.be('https://me.auth0.com/relay.html');
        expect(options.popupOptions.height).to.be(300);
        expect(options.popupOptions.width).to.be(250);
        expect(options.popupOptions).to.not.have.property('extra');
        cb(null, {
          email_verified: false,
          email: 'me@example.com'
        });
      });

      this.auth0.popup.authorize(
        {
          connection: 'the_connection',
          state: '123',
          nonce: '456',
          owp: true,
          popupOptions: {
            height: 300,
            width: 250,
            extra: 'blacklisted'
          }
        },
        function(err, data) {
          done();
        }
      );
    });

    it('should open the authorize page in a popup', function(done) {
      stub(PopupHandler.prototype, 'load', function(url, relayUrl, options, cb) {
        var components = URL.parse(url, true);
        expect(components.protocol).to.be('https:');
        expect(components.host).to.be('me.auth0.com');
        expect(components.pathname).to.be('/authorize');
        expect(components.query.client_id).to.be('...');
        expect(components.query.response_type).to.be('id_token');
        expect(components.query.connection).to.be('the_connection');
        expect(components.query.nonce).to.be('123');
        expect(components.query.state).to.be('456');
        expect(components.query.owp).to.be('true');
        expect(relayUrl).to.be('https://me.auth0.com/relay.html');
        expect(options).to.eql({});
        cb(null, {
          email_verified: false,
          email: 'me@example.com'
        });
      });

      this.auth0.popup.authorize(
        {
          connection: 'the_connection',
          nonce: '123',
          state: '456',
          owp: true
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
        responseType: 'id_token',
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
      if (TransactionManager.prototype.process.restore) {
        TransactionManager.prototype.process.restore();
      }
    });
    it('should call CrossOriginAuthentication.login', function(done) {
      var inputOptions = { foo: 'bar', connection: 'realm' };
      var expectedOptions = {
        foo: 'bar',
        realm: 'realm',
        responseType: 'id_token',
        redirectUri: 'http://page.com/callback',
        popup: true
      };
      stub(CrossOriginAuthentication.prototype, 'login', function(options, cb) {
        expect(options).to.be.eql(expectedOptions);
        expect(cb()).to.be('cb');
        done();
      });
      stub(TransactionManager.prototype, 'process', function(options) {
        expect(options).to.be.eql(expectedOptions);
        return options;
      });
      this.auth0.popup.loginWithCredentials(inputOptions, function() {
        return 'cb';
      });
    });
  });

  context('passwordlessVerify', function() {
    before(function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'id_token',
        _sendTelemetry: false
      });
    });

    afterEach(function() {
      request.post.restore();
    });

    it('(phone) should do the redirections in the popup', function(done) {
      stub(request, 'post', function(url) {
        expect([
          'https://me.auth0.com/passwordless/verify',
          'https://me.auth0.com/oauth/ro'
        ]).to.contain(url);

        if (url === 'https://me.auth0.com/passwordless/verify') {
          return new RequestMock({
            body: {
              connection: 'the_connection',
              phone_number: '+5491178786555',
              verification_code: '123'
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
        }

        if (url === 'https://me.auth0.com/oauth/ro') {
          return new RequestMock({
            body: {
              client_id: '...',
              grant_type: 'password',
              username: '+5491178786555',
              password: '123',
              connection: 'the_connection'
            },
            headers: {
              'Content-Type': 'application/json'
            },
            cb: function(cb) {
              cb(null, {
                body: {
                  idToken: 'id_token.id_token.id_token',
                  accessToken: 'access_token',
                  tokenType: 'bearer'
                }
              });
            }
          });
        }
      });

      this.auth0.popup.passwordlessVerify(
        {
          connection: 'the_connection',
          phoneNumber: '+5491178786555',
          verificationCode: '123'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({
            idToken: 'id_token.id_token.id_token',
            accessToken: 'access_token',
            tokenType: 'bearer'
          });
          done();
        }
      );
    });

    it('(email) should do the redirections in the popup', function(done) {
      stub(request, 'post', function(url) {
        expect([
          'https://me.auth0.com/passwordless/verify',
          'https://me.auth0.com/oauth/ro'
        ]).to.contain(url);

        if (url === 'https://me.auth0.com/passwordless/verify') {
          return new RequestMock({
            body: {
              connection: 'the_connection',
              email: 'test@example.com',
              verification_code: '123'
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
        }

        if (url === 'https://me.auth0.com/oauth/ro') {
          return new RequestMock({
            body: {
              client_id: '...',
              grant_type: 'password',
              username: 'test@example.com',
              password: '123',
              connection: 'the_connection'
            },
            headers: {
              'Content-Type': 'application/json'
            },
            cb: function(cb) {
              cb(null, {
                body: {
                  id_token: 'id_token.id_token.id_token',
                  access_token: 'access_token',
                  token_type: 'bearer'
                }
              });
            }
          });
        }
      });

      this.auth0.popup.passwordlessVerify(
        {
          connection: 'the_connection',
          email: 'test@example.com',
          verificationCode: '123'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({
            idToken: 'id_token.id_token.id_token',
            accessToken: 'access_token',
            tokenType: 'bearer'
          });
          done();
        }
      );
    });

    it('should propagate the error', function(done) {
      var assert_err = {};
      assert_err.response = {};
      assert_err.response.body = {
        code: 'the_error_code',
        description: 'The error description.'
      };

      stub(request, 'post', function(url) {
        expect(url).to.eql('https://me.auth0.com/passwordless/verify');
        return new RequestMock({
          body: {
            connection: 'the_connection',
            phone_number: '+5491178786555',
            verification_code: '123'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(assert_err);
          }
        });
      });

      this.auth0.popup.passwordlessVerify(
        {
          connection: 'the_connection',
          phoneNumber: '+5491178786555',
          verificationCode: '123'
        },
        function(err, data) {
          expect(data).to.be(undefined);
          expect(err).to.eql({
            original: assert_err,
            code: 'the_error_code',
            description: 'The error description.'
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

      stub(windowHandler, 'getWindow', function() {
        return {
          screenX: 500,
          screenY: 500,
          outerWidth: 2000,
          outerHeight: 500,
          open: function() {
            return {
              close: function() {}
            };
          }
        };
      });

      stub(PopupHandler.prototype, 'load', function(url, relayUrl, options, cb) {
        expect(url).to.be('https://me.auth0.com/sso_dbconnection_popup/...');
        expect(relayUrl).to.be('https://me.auth0.com/relay.html');
        expect(options).to.eql({
          params: {
            clientID: '...',
            domain: 'me.auth0.com',
            options: {
              connection: 'the_connection',
              username: 'me@example.com',
              password: '123456',
              scope: 'openid'
            }
          }
        });

        cb();
      });
    });

    afterEach(function() {
      request.post.restore();
      if (CrossOriginAuthentication.prototype.login.restore) {
        CrossOriginAuthentication.prototype.login.restore();
      }
      if (CrossOriginAuthentication.prototype.callback.restore) {
        CrossOriginAuthentication.prototype.callback.restore();
      }
      if (TransactionManager.prototype.process.restore) {
        TransactionManager.prototype.process.restore();
      }
    });

    after(function() {
      windowHandler.getWindow.restore();
      PopupHandler.prototype.load.restore();
    });

    it('should call db-connection signup with all the options', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.eql('https://me.auth0.com/dbconnections/signup');

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

      var expectedOptions = {
        email: 'me@example.com',
        password: '123456',
        scope: 'openid',
        realm: 'the_connection',
        popup: true,
        responseType: 'token',
        redirectUri: 'http://page.com/callback'
      };
      stub(TransactionManager.prototype, 'process', function(options) {
        delete options.popupHandler;
        expect(options).to.be.eql(expectedOptions);
        return options;
      });
      stub(CrossOriginAuthentication.prototype, 'login', function(options, cb) {
        delete options.popupHandler;
        expect(options).to.be.eql(expectedOptions);
        cb();
      });

      this.auth0.popup.signupAndLogin(
        {
          connection: 'the_connection',
          email: 'me@example.com',
          password: '123456',
          scope: 'openid'
        },
        function(err, data) {
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

      this.auth0.popup.signupAndLogin(
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

  context('callback', function() {
    beforeEach(function() {
      stub(windowHandler, 'getWindow', function() {
        return {
          opener: {}
        };
      });
    });
    afterEach(function() {
      if (WinChan.onOpen.restore) {
        WinChan.onOpen.restore();
      }
      if (this.auth0.parseHash.restore) {
        this.auth0.parseHash.restore();
      }
      if (windowHandler.getOrigin.restore) {
        windowHandler.getOrigin.restore();
      }
      windowHandler.getWindow.restore();
    });
    it('sends parseHash result to the callback when there is no error', function(done) {
      stub(this.auth0, 'parseHash', function(options, cb) {
        cb(null, { accessToken: 'accessToken' });
      });
      stub(WinChan, 'onOpen', function(onOpenCallback) {
        onOpenCallback('https://baseoptions.popupOrigin.com', null, function(result) {
          expect(result).to.be.eql({ accessToken: 'accessToken' });
          done();
        });
      });

      this.auth0.popup.callback();
    });
    it('sends parseHash result to the callback when there is an error', function(done) {
      stub(this.auth0, 'parseHash', function(options, cb) {
        cb({ error: 'any_error', error_description: 'a big error message' });
      });
      stub(WinChan, 'onOpen', function(onOpenCallback) {
        onOpenCallback('https://baseoptions.popupOrigin.com', null, function(result) {
          expect(result).to.be.eql({
            error: 'any_error',
            error_description: 'a big error message'
          });
          done();
        });
      });

      this.auth0.popup.callback();
    });
    it('validates origin with baseOptions.popupOrigin', function(done) {
      stub(WinChan, 'onOpen', function(onOpenCallback) {
        onOpenCallback('https://notBaseOptions.popupOrigin.com', null, function(result) {
          expect(result).to.be.eql({
            error: 'origin_mismatch',
            error_description: "The popup's origin (https://notBaseOptions.popupOrigin.com) should match the `popupOrigin` parameter (https://baseoptions.popupOrigin.com)."
          });
          done();
        });
      });

      this.auth0.popup.callback();
    });
    it('validates origin with options.popupOrigin', function(done) {
      stub(WinChan, 'onOpen', function(onOpenCallback) {
        onOpenCallback('https://notOptions.popupOrigin.com', null, function(result) {
          expect(result).to.be.eql({
            error: 'origin_mismatch',
            error_description: "The popup's origin (https://notOptions.popupOrigin.com) should match the `popupOrigin` parameter (https://options.popupOrigin.com)."
          });
          done();
        });
      });

      this.auth0.popup.callback({ popupOrigin: 'https://options.popupOrigin.com' });
    });
    it('validates origin with windowHelper.getOrigin()', function(done) {
      var auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'id_token',
        _sendTelemetry: false
      });
      stub(windowHandler, 'getOrigin', function() {
        return 'https://window.popupOrigin.com';
      });
      stub(WinChan, 'onOpen', function(onOpenCallback) {
        onOpenCallback('https://notWindow.popupOrigin.com', null, function(result) {
          expect(result).to.be.eql({
            error: 'origin_mismatch',
            error_description: "The popup's origin (https://notWindow.popupOrigin.com) should match the `popupOrigin` parameter (https://window.popupOrigin.com)."
          });
          done();
        });
      });

      auth0.popup.callback();
    });
    it('handles window.opener being undefined', function(done) {
      windowHandler.getWindow.restore();
      var theWindow = {
        opener: undefined,
        parent: {
          postMessage: function(msg, origin) {
            expect(msg).to.be.eql({ from: 'winchan' });
            expect(origin).to.be('https://window.popupOrigin.com');
            done();
          }
        }
      };
      stub(windowHandler, 'getWindow', function() {
        return theWindow;
      });
      stub(windowHandler, 'getOrigin', function() {
        return 'https://window.popupOrigin.com';
      });
      var auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'id_token',
        _sendTelemetry: false
      });
      auth0.popup.callback();
      theWindow.doPost({ from: 'winchan' });
    });
  });
});
