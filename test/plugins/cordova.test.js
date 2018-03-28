var IdTokenVerifier = require('idtoken-verifier');
var expect = require('expect.js');
var stub = require('sinon').stub;

var WebAuth = require('../../src/web-auth');
var TransactionManager = require('../../src/web-auth/transaction-manager');
var CordovaPlugin = require('../../plugins/cordova');
var PluginHandler = require('../../plugins/cordova/plugin-handler');
var PopupHandler = require('../../plugins/cordova/popup-handler');

describe('auth0.plugins.cordova', function() {
  beforeEach(function() {
    stub(TransactionManager.prototype, 'getStoredTransaction', function(state) {
      expect(state).to.be('foo');
      return { state: 'foo' };
    });
  });
  afterEach(function() {
    TransactionManager.prototype.getStoredTransaction.restore();
  });
  context('platform support cordova', function() {
    before(function() {
      this.plugin = new CordovaPlugin();
      global.window = {
        cordova: true
      };
    });
    after(function() {
      delete global.window;
    });

    it('should validate the extencibility points', function() {
      expect(this.plugin.supports('popup.authorize')).to.be.ok();
      expect(this.plugin.supports('popup.getPopupHandler')).to.be.ok();
      expect(this.plugin.supports('not.existent')).to.not.be.ok();
    });
  });

  context('platform support electron', function() {
    before(function() {
      this.plugin = new CordovaPlugin();
      global.window = {
        electron: true
      };
    });
    after(function() {
      delete global.window;
    });

    it('should validate the extencibility points', function() {
      expect(this.plugin.supports('popup.authorize')).to.be.ok();
      expect(this.plugin.supports('popup.getPopupHandler')).to.be.ok();
      expect(this.plugin.supports('not.existent')).to.not.be.ok();
    });
  });

  context('platform support', function() {
    before(function() {
      this.plugin = new CordovaPlugin();
      global.window = {};
    });
    after(function() {
      delete global.window;
    });

    it('should ignore if it is not electron or cordova', function() {
      expect(this.plugin.supports('popup.authorize')).to.not.be.ok();
      expect(this.plugin.supports('popup.getPopupHandler')).to.not.be.ok();
      expect(this.plugin.supports('not.existent')).to.not.be.ok();
    });
  });

  context('handler', function() {
    before(function() {
      this.handler = new CordovaPlugin().init();
    });

    it('should return a PluginHandler', function() {
      expect(this.handler).to.be.a(PluginHandler);
    });

    it('should return a PopupHandler', function() {
      expect(this.handler.getPopupHandler()).to.be.a(PopupHandler);
    });

    it('should return a change the authorize params', function() {
      expect(
        this.handler.processParams({
          domain: 'test.auth0.com',
          redirectUri: 'https://callback.com',
          owp: true,
          otherParam: 'something'
        })
      ).to.eql({
        domain: 'test.auth0.com',
        redirectUri: 'https://test.auth0.com/mobile',
        otherParam: 'something'
      });
    });
  });

  context('PopupHandler', function() {
    beforeEach(function() {
      stub(IdTokenVerifier.prototype, 'validateAccessToken', function(at, alg, atHash, cb) {
        cb(null);
      });
      var _this = this;
      this.events = {};
      var webAuth = new WebAuth({
        domain: 'wptest.auth0.com',
        clientID: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
        responseType: 'token',
        __disableExpirationCheck: true
      });
      var plugin = new CordovaPlugin();
      plugin.setWebAuth(webAuth);
      this.popupHandler = plugin.init().getPopupHandler();
      global.window = {};
      global.window.open = function(url, name, features) {
        expect(url).to.eql('https://teest.com');
        expect(name).to.eql('_blank');
        expect(features).to.eql('location=yes');

        return {
          addEventListener: function(event, cb) {
            _this.events[event] = cb;
          },
          removeEventListener: function(event) {
            delete _this.events[event];
          },
          close: function() {
            _this.events.exit();
          }
        };
      };
    });

    afterEach(function() {
      IdTokenVerifier.prototype.validateAccessToken.restore();
      delete global.window;
      this.events = null;
      this.popupHandler = null;
    });

    it('should return the transaction result', function(done) {
      var _this = this;
      this.popupHandler.load('https://teest.com', '', { nonce: 'asfd' }, function(err, result) {
        expect(err).to.be(null);
        expect(result).to.eql({
          accessToken: 'asldkfjahsdlkfjhasd',
          idToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA',
          idTokenPayload: {
            iss: 'https://wptest.auth0.com/',
            sub: 'auth0|55d48c57d5b0ad0223c408d7',
            aud: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
            exp: 1482969031,
            iat: 1482933031,
            nonce: 'asfd'
          },
          appState: null,
          refreshToken: 'kajshdgfkasdjhgfas',
          state: 'foo',
          expiresIn: null,
          tokenType: 'Bearer',
          scope: null
        });
        expect(_this.events).to.eql({});
        done();
      });

      this.events.loadstart({
        url: 'https://wptest.auth0.com/mobile#state=foo&access_token=asldkfjahsdlkfjhasd&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas'
      });
    });

    it('should return the transaction result after a non matching callback url', function(done) {
      var _this = this;
      this.popupHandler.load('https://teest.com', '', { nonce: 'asfd' }, function(err, result) {
        expect(err).to.be(null);
        expect(result).to.eql({
          accessToken: 'asldkfjahsdlkfjhasd',
          idToken: null,
          idTokenPayload: null,
          appState: null,
          refreshToken: null,
          state: 'foo',
          expiresIn: null,
          tokenType: 'Bearer',
          scope: null
        });
        expect(_this.events).to.eql({});
        done();
      });

      this.events.loadstart({
        url: 'http://randomsite.com#somerandomhash'
      });
      this.events.loadstart({
        url: 'https://wptest.auth0.com/mobile#state=foo&access_token=asldkfjahsdlkfjhasd&token_type=Bearer'
      });
    });

    it('should return the transaction error', function(done) {
      var _this = this;
      this.popupHandler.load('https://teest.com', '', { nonce: 'asfd' }, function(err, result) {
        expect(err).to.eql({
          error: 'some_error',
          errorDescription: 'with a description'
        });
        expect(result).to.be(undefined);
        expect(_this.events).to.eql({});

        done();
      });

      this.events.loadstart({
        url: 'https://wptest.auth0.com/mobile#error=some_error&error_description=with a description'
      });
    });

    it('should handle if the popup is closed', function(done) {
      var _this = this;
      this.popupHandler.load('https://teest.com', '', { nonce: 'asfd' }, function(err, result) {
        expect(err).to.eql({
          error: 'window_closed',
          errorDescription: 'Browser window closed'
        });
        expect(result).to.be(undefined);
        expect(_this.events).to.eql({});

        done();
      });

      this.events.exit();
    });

    it('should handle popup errors', function(done) {
      var _this = this;
      this.popupHandler.load('https://teest.com', '', { nonce: 'asfd' }, function(err, result) {
        expect(err).to.eql({
          error: 'window_error',
          errorDescription: 'some error'
        });
        expect(result).to.be(undefined);
        expect(_this.events).to.eql({});

        done();
      });

      this.events.loaderror({
        message: 'some error'
      });
    });
  });
});
