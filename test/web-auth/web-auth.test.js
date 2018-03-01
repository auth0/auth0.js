var expect = require('expect.js');
var stub = require('sinon').stub;
var spy = require('sinon').spy;
var request = require('superagent');

var storage = require('../../src/helper/storage');
var windowHelper = require('../../src/helper/window');

var RequestMock = require('../mock/request-mock');

var TransactionManager = require('../../src/web-auth/transaction-manager');
var SilentAuthenticationHandler = require('../../src/web-auth/silent-authentication-handler');
var CrossOriginAuthentication = require('../../src/web-auth/cross-origin-authentication');
var IframeHandler = require('../../src/helper/iframe-handler');

var objectHelper = require('../../src/helper/object');
var WebAuth = require('../../src/web-auth');

describe('auth0.WebAuth', function() {
  beforeEach(function() {
    stub(TransactionManager.prototype, 'generateTransaction', function(appState, state, nonce) {
      return { state: state || 'randomState', nonce: nonce || 'randomNonce' };
    });
    stub(TransactionManager.prototype, 'getStoredTransaction', function(state) {
      expect(state).to.be('foo');
      return { state: 'foo' };
    });
  });
  afterEach(function() {
    TransactionManager.prototype.generateTransaction.restore();
    TransactionManager.prototype.getStoredTransaction.restore();
  });
  context('init', function() {
    after(function() {
      delete global.window;
    });

    before(function() {
      global.window = {};
      global.window.localStorage = {};
      storage.reload();
    });

    it('should properly set the overrides', function() {
      var webAuth = new WebAuth({
        domain: 'wptest.auth0.com',
        redirectUri: 'http://page.com/callback',
        clientID: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
        responseType: 'id_token',
        scope: 'openid name read:blog',
        audience: 'urn:site:demo:blog',
        _sendTelemetry: false,
        _timesToRetryFailedRequests: 2,
        overrides: {
          __tenant: 'tenant1',
          __token_issuer: 'issuer1'
        }
      });

      expect(webAuth.baseOptions.tenant).to.be('tenant1');
      expect(webAuth.baseOptions.token_issuer).to.be('issuer1');
    });
  });
  context('nonce validation', function() {
    before(function() {
      global.window = {};
      global.window.localStorage = {};
      global.window.localStorage.removeItem = function(key) {
        expect(key).to.be('com.auth0.auth.456');
      };
      global.window.localStorage.getItem = function(key) {
        expect(key).to.be('com.auth0.auth.456');
        return JSON.stringify({
          nonce: 'thenonce',
          appState: null
        });
      };
      global.window.location = {};
      storage.reload();
    });
    after(function() {
      SilentAuthenticationHandler.prototype.login.restore();

      delete global.window;
    });

    it('should fail if the nonce is not valid', function(done) {
      stub(SilentAuthenticationHandler.prototype, 'login', function(usePostMessage, cb) {
        cb(
          null,
          '#state=foo&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA'
        );
      });

      var webAuth = new WebAuth({
        domain: 'wptest.auth0.com',
        redirectUri: 'http://page.com/callback',
        clientID: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
        responseType: 'id_token',
        scope: 'openid name read:blog',
        audience: 'urn:site:demo:blog',
        state: 'foo',
        _sendTelemetry: false
      });

      var options = {
        nonce: '123'
      };

      webAuth.renewAuth(options, function(err, data) {
        expect(err).to.eql({
          error: 'invalid_token',
          errorDescription: 'Nonce does not match.'
        });
        expect(data).to.be(undefined);
        done();
      });
    });
  });

  context('Pass correct postMessageData value to silent-authentication-handler', function() {
    before(function() {
      global.window = { origin: 'foobar' };
    });

    after(function() {
      delete global.window;
    });

    afterEach(function() {
      SilentAuthenticationHandler.create.restore();
    });

    it('should pass correct postMessageDataType=false value on to silent authentication handler', function(
      done
    ) {
      stub(SilentAuthenticationHandler, 'create', function(options) {
        expect(options.postMessageDataType).to.be(false);
        done();
        return {
          login: function() {}
        };
      });

      var webAuth = new WebAuth({
        domain: 'wptest.auth0.com',
        redirectUri: 'http://page.com/callback',
        clientID: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
        responseType: 'id_token',
        scope: 'openid name read:blog',
        audience: 'urn:site:demo:blog',
        _sendTelemetry: false
      });

      var options = {
        nonce: '123',
        state: '456'
      };

      webAuth.renewAuth(options, function(err, data) {});
    });

    it('should pass correct postMessageDataType=<value> on to silent authentication handler', function(
      done
    ) {
      stub(SilentAuthenticationHandler, 'create', function(options) {
        expect(options.postMessageDataType).to.eql('auth0:silent-authentication');
        done();
        return {
          login: function() {}
        };
      });

      var webAuth = new WebAuth({
        domain: 'wptest.auth0.com',
        redirectUri: 'http://page.com/callback',
        clientID: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
        responseType: 'id_token',
        scope: 'openid name read:blog',
        audience: 'urn:site:demo:blog',
        _sendTelemetry: false
      });

      var options = {
        nonce: '123',
        state: '456',
        postMessageDataType: 'auth0:silent-authentication'
      };

      webAuth.renewAuth(options, function(err, data) {});
    });

    it('should set a default postMessageOrigin to the window origin', function(done) {
      stub(SilentAuthenticationHandler, 'create', function(options) {
        expect(options.postMessageOrigin).to.eql('foobar');
        done();
        return {
          login: function() {}
        };
      });

      var webAuth = new WebAuth({
        domain: 'wptest.auth0.com',
        redirectUri: 'http://page.com/callback',
        clientID: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
        responseType: 'id_token',
        scope: 'openid name read:blog',
        audience: 'urn:site:demo:blog',
        _sendTelemetry: false
      });

      var options = {
        nonce: '123',
        state: '456'
      };

      webAuth.renewAuth(options, function(err, data) {});
    });

    it('should use postMessageOrigin if provided', function(done) {
      var postMessageOrigin = 'foobar1';
      stub(SilentAuthenticationHandler, 'create', function(options) {
        expect(options.postMessageOrigin).to.eql(postMessageOrigin);
        done();
        return {
          login: function() {}
        };
      });

      var webAuth = new WebAuth({
        domain: 'wptest.auth0.com',
        redirectUri: 'http://page.com/callback',
        clientID: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
        responseType: 'id_token',
        scope: 'openid name read:blog',
        audience: 'urn:site:demo:blog',
        _sendTelemetry: false
      });

      var options = {
        nonce: '123',
        state: '456',
        postMessageOrigin: postMessageOrigin
      };

      webAuth.renewAuth(options, function(err, data) {});
    });
  });

  context('parseHash', function() {
    before(function() {
      global.window = {};
      global.window.location = {};
      global.window.localStorage = {};
      global.window.localStorage.removeItem = function(key) {
        expect(key).to.be('com.auth0.auth.theState');
      };
      global.window.localStorage.getItem = function(key) {
        expect(key).to.be('com.auth0.auth.theState');
        return JSON.stringify({
          nonce: 'asfd',
          appState: null
        });
      };
      global.window.location.hash =
        '#state=foo&access_token=asldkfjahsdlkfjhasd&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas';
    });

    it('should parse a valid hash without id_token', function(done) {
      var webAuth = new WebAuth({
        domain: 'mdocs.auth0.com',
        redirectUri: 'http://example.com/callback',
        clientID: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
        responseType: 'token'
      });

      var data = webAuth.parseHash(
        {
          hash: '#state=foo&access_token=VjubIMBmpgQ2W2&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas'
        },
        function(err, data) {
          expect(data).to.eql({
            accessToken: 'VjubIMBmpgQ2W2',
            idToken: null,
            idTokenPayload: null,
            appState: null,
            refreshToken: 'kajshdgfkasdjhgfas',
            state: 'foo',
            expiresIn: null,
            tokenType: 'Bearer',
            scope: null
          });

          expect(TransactionManager.prototype.getStoredTransaction.calledOnce).to.be.ok();

          done();
        }
      ); // eslint-disable-line
    });

    it('should return transaction.appState', function(done) {
      var webAuth = new WebAuth({
        domain: 'mdocs.auth0.com',
        redirectUri: 'http://example.com/callback',
        clientID: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
        responseType: 'token'
      });
      TransactionManager.prototype.getStoredTransaction.restore();
      stub(TransactionManager.prototype, 'getStoredTransaction', function() {
        return {
          nonce: 'asfd',
          appState: 'the-app-state',
          state: 'foo'
        };
      });

      var data = webAuth.parseHash(
        {
          hash: '#state=foo&access_token=VjubIMBmpgQ2W2&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas'
        },
        function(err, data) {
          expect(data).to.eql({
            accessToken: 'VjubIMBmpgQ2W2',
            idToken: null,
            idTokenPayload: null,
            appState: 'the-app-state',
            refreshToken: 'kajshdgfkasdjhgfas',
            state: 'foo',
            expiresIn: null,
            tokenType: 'Bearer',
            scope: null
          });

          expect(TransactionManager.prototype.getStoredTransaction.calledOnce).to.be.ok();

          done();
        }
      ); // eslint-disable-line
    });

    context('with RS256 id_token', function() {
      it('should parse a valid hash', function(done) {
        var webAuth = new WebAuth({
          domain: 'wptest.auth0.com',
          redirectUri: 'http://example.com/callback',
          clientID: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
          responseType: 'token',
          __disableExpirationCheck: true
        });

        var data = webAuth.parseHash(
          {
            nonce: 'asfd',
            hash: '#state=foo&access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas&scope=foo'
          },
          function(err, data) {
            expect(err).to.be(null);
            expect(data).to.eql({
              accessToken: 'VjubIMBmpgQ2W2',
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
              scope: 'foo'
            });

            expect(TransactionManager.prototype.getStoredTransaction.calledOnce).to.be.ok();

            done();
          }
        ); // eslint-disable-line
      });

      it('should parse a valid hash from the location.hash', function(done) {
        var webAuth = new WebAuth({
          domain: 'wptest.auth0.com',
          redirectUri: 'http://example.com/callback',
          clientID: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
          responseType: 'token',
          __disableExpirationCheck: true
        });

        var data = webAuth.parseHash({ nonce: 'asfd' }, function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({
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

          expect(TransactionManager.prototype.getStoredTransaction.calledOnce).to.be.ok();

          done();
        });
      });

      it('should parse a valid hash from the location.hash even if transaction is null but state & nonce passed as parameters', function(
        done
      ) {
        var webAuth = new WebAuth({
          domain: 'wptest.auth0.com',
          redirectUri: 'http://example.com/callback',
          clientID: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
          responseType: 'token',
          __disableExpirationCheck: true
        });

        TransactionManager.prototype.getStoredTransaction.restore();
        stub(TransactionManager.prototype, 'getStoredTransaction', function() {
          return null;
        });

        var data = webAuth.parseHash(
          {
            nonce: 'asfd',
            state: '123',
            hash: '#state=123&access_token=asldkfjahsdlkfjhasd&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas'
          },
          function(err, data) {
            expect(err).to.be(null);
            expect(data).to.eql({
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
              appState: '123',
              refreshToken: 'kajshdgfkasdjhgfas',
              state: '123',
              expiresIn: null,
              tokenType: 'Bearer',
              scope: null
            });

            expect(TransactionManager.prototype.getStoredTransaction.calledOnce).to.be.ok();

            done();
          }
        );
      });

      it('should fail when there is no state available in the hash', function(done) {
        var webAuth = new WebAuth({
          domain: 'mdocs.auth0.com',
          redirectUri: 'http://example.com/callback',
          clientID: '0HP71GSd6PuoRYJ3p',
          responseType: 'token'
        });
        TransactionManager.prototype.getStoredTransaction.restore();
        stub(TransactionManager.prototype, 'getStoredTransaction', function() {
          return null;
        });

        var data = webAuth.parseHash(
          {
            hash: '#access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas'
          },
          function(err, data) {
            expect(err).to.eql({
              error: 'invalid_token',
              errorDescription: '`state` does not match.'
            });
            done();
          }
        ); // eslint-disable-line
      });

      it('should fail with an invalid state (null transaction)', function(done) {
        var webAuth = new WebAuth({
          domain: 'mdocs.auth0.com',
          redirectUri: 'http://example.com/callback',
          clientID: '0HP71GSd6PuoRYJ3p',
          responseType: 'token'
        });
        TransactionManager.prototype.getStoredTransaction.restore();
        stub(TransactionManager.prototype, 'getStoredTransaction', function() {
          return null;
        });

        var data = webAuth.parseHash(
          {
            hash: '#state=123&access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas'
          },
          function(err, data) {
            expect(err).to.eql({
              error: 'invalid_token',
              errorDescription: '`state` does not match.'
            });
            done();
          }
        ); // eslint-disable-line
      });

      it('should fail with an invalid state (available transaction)', function(done) {
        var webAuth = new WebAuth({
          domain: 'mdocs.auth0.com',
          redirectUri: 'http://example.com/callback',
          clientID: '0HP71GSd6PuoRYJ3p',
          responseType: 'token'
        });
        TransactionManager.prototype.getStoredTransaction.restore();
        stub(TransactionManager.prototype, 'getStoredTransaction', function() {
          return {
            state: 'not-123'
          };
        });

        var data = webAuth.parseHash(
          {
            hash: '#state=123&access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas'
          },
          function(err, data) {
            expect(err).to.eql({
              error: 'invalid_token',
              errorDescription: '`state` does not match.'
            });
            done();
          }
        ); // eslint-disable-line
      });

      it('should fail with an invalid audience', function(done) {
        var webAuth = new WebAuth({
          domain: 'wptest.auth0.com',
          redirectUri: 'http://example.com/callback',
          clientID: '0HP71GSd6PuoRYJ3p',
          responseType: 'token'
        });

        var data = webAuth.parseHash(
          {
            hash: '#state=foo&access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas'
          },
          function(err, data) {
            expect(err).to.eql({
              error: 'invalid_token',
              errorDescription: 'Audience gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt is not valid.' // eslint-disable-line
            });
            done();
          }
        ); // eslint-disable-line
      });

      it('should fail with an invalid issuer', function(done) {
        var webAuth = new WebAuth({
          domain: 'wptest_2.auth0.com',
          redirectUri: 'http://example.com/callback',
          clientID: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
          responseType: 'token'
        });

        var data = webAuth.parseHash(
          {
            hash: '#state=foo&access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas'
          },
          function(err, data) {
            expect(err).to.eql({
              error: 'invalid_token',
              errorDescription: 'Issuer https://wptest.auth0.com/ is not valid.' // eslint-disable-line
            });
            done();
          }
        ); // eslint-disable-line
      });

      it('should fail if there is no token', function(done) {
        var webAuth = new WebAuth({
          domain: 'mdocs_2.auth0.com',
          redirectUri: 'http://example.com/callback',
          clientID: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
          responseType: 'token'
        });

        var data = webAuth.parseHash(
          {
            hash: '#token_type=Bearer'
          },
          function(err, data) {
            expect(err).to.be(null);
            expect(data).to.be(null);
            done();
          }
        ); // eslint-disable-line
      });

      it('should parse an error response', function(done) {
        var webAuth = new WebAuth({
          domain: 'mdocs_2.auth0.com',
          redirectUri: 'http://example.com/callback',
          clientID: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
          responseType: 'token'
        });

        webAuth.parseHash(
          {
            hash: '#error=the_error_code&error_description=the_error_description&state=some_state'
          },
          function(err, data) {
            expect(err).to.eql({
              error: 'the_error_code',
              errorDescription: 'the_error_description',
              state: 'some_state'
            });
            done();
          }
        );
      });
    });
    context('with HS256 id_token', function() {
      beforeEach(function() {
        this.webAuth = new WebAuth({
          domain: 'auth0-tests-lock.auth0.com',
          redirectUri: 'http://example.com/callback',
          clientID: 'ixeOHFhD7NSPxEQK6CFcswjUsa5YkcXS',
          responseType: 'token id_token',
          __disableExpirationCheck: true
        });
      });
      afterEach(function() {
        this.webAuth.client.userInfo.restore();
      });
      it('should use result from /userinfo as idTokenPayload', function(done) {
        stub(this.webAuth.client, 'userInfo', function(accessToken, cb) {
          expect(accessToken).to.be('VjubIMBmpgQ2W2');
          cb(null, { from: 'userinfo' });
        });

        var data = this.webAuth.parseHash(
          {
            hash: '#state=foo&access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F1dGgwLXRlc3RzLWxvY2suYXV0aDAuY29tLyIsImlhdCI6MTUwOTA0MDk4MiwiZXhwIjoxNTQwNTc2OTgyLCJhdWQiOiJpeGVPSEZoRDdOU1B4RVFLNkNGY3N3alVzYTVZa2NYUyIsInN1YiI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJHaXZlbk5hbWUiOiJKb2hubnkiLCJTdXJuYW1lIjoiUm9ja2V0IiwiRW1haWwiOiJqcm9ja2V0QGV4YW1wbGUuY29tIiwiUm9sZSI6WyJNYW5hZ2VyIiwiUHJvamVjdCBBZG1pbmlzdHJhdG9yIl19._JvcLjX308NtT16oegF2wFeOcdEYKM3DqX-V4POwIeg&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas'
          },
          function(err, data) {
            expect(err).to.be(null);
            expect(data).to.be.eql({
              accessToken: 'VjubIMBmpgQ2W2',
              idToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F1dGgwLXRlc3RzLWxvY2suYXV0aDAuY29tLyIsImlhdCI6MTUwOTA0MDk4MiwiZXhwIjoxNTQwNTc2OTgyLCJhdWQiOiJpeGVPSEZoRDdOU1B4RVFLNkNGY3N3alVzYTVZa2NYUyIsInN1YiI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJHaXZlbk5hbWUiOiJKb2hubnkiLCJTdXJuYW1lIjoiUm9ja2V0IiwiRW1haWwiOiJqcm9ja2V0QGV4YW1wbGUuY29tIiwiUm9sZSI6WyJNYW5hZ2VyIiwiUHJvamVjdCBBZG1pbmlzdHJhdG9yIl19._JvcLjX308NtT16oegF2wFeOcdEYKM3DqX-V4POwIeg',
              idTokenPayload: { from: 'userinfo' },
              appState: null,
              refreshToken: 'kajshdgfkasdjhgfas',
              state: 'foo',
              expiresIn: null,
              tokenType: 'Bearer',
              scope: null
            });
            done();
          }
        );
      });
      it('should throw validationError when /userinfo call has an error', function(done) {
        stub(this.webAuth.client, 'userInfo', function(accessToken, cb) {
          cb({ any: 'error' });
        });

        var data = this.webAuth.parseHash(
          {
            hash: '#state=foo&access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F1dGgwLXRlc3RzLWxvY2suYXV0aDAuY29tLyIsImlhdCI6MTUwOTA0MDk4MiwiZXhwIjoxNTQwNTc2OTgyLCJhdWQiOiJpeGVPSEZoRDdOU1B4RVFLNkNGY3N3alVzYTVZa2NYUyIsInN1YiI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJHaXZlbk5hbWUiOiJKb2hubnkiLCJTdXJuYW1lIjoiUm9ja2V0IiwiRW1haWwiOiJqcm9ja2V0QGV4YW1wbGUuY29tIiwiUm9sZSI6WyJNYW5hZ2VyIiwiUHJvamVjdCBBZG1pbmlzdHJhdG9yIl19._JvcLjX308NtT16oegF2wFeOcdEYKM3DqX-V4POwIeg&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas'
          },
          function(err, data) {
            expect(err).to.be.eql({
              error: 'invalid_token',
              errorDescription: 'Algorithm HS256 is not supported. (Expected algs: [RS256])'
            });
            done();
          }
        );
      });
    });
  });

  context('renewAuth', function() {
    beforeEach(function() {
      global.window = {};
      global.window.origin = 'unit-test-origin';
      global.window.removeEventListener = function() {};
    });
    afterEach(function() {
      delete global.window;
      SilentAuthenticationHandler.prototype.login.restore();
    });

    it('should pass the correct authorize url', function(done) {
      stub(SilentAuthenticationHandler.prototype, 'login', function() {
        expect(this.authenticationUrl).to.be(
          'https://me.auth0.com/authorize?client_id=...&response_type=id_token&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback&scope=openid%20name%20read%3Ablog&audience=urn%3Asite%3Ademo%3Ablog&nonce=123&state=456&response_mode=fragment&prompt=none'
        );
        done();
      });

      var webAuth = new WebAuth({
        domain: 'me.auth0.com',
        redirectUri: 'http://page.com/callback',
        clientID: '...',
        responseType: 'id_token',
        scope: 'openid name read:blog',
        audience: 'urn:site:demo:blog',
        _sendTelemetry: false
      });

      var options = {
        nonce: '123',
        state: '456'
      };

      webAuth.renewAuth(options, function() {});
    });

    it('should pass the correct timeout', function(done) {
      stub(SilentAuthenticationHandler.prototype, 'login', function() {
        expect(this.timeout).to.be(5000);
        done();
      });

      var webAuth = new WebAuth({
        domain: 'me.auth0.com',
        redirectUri: 'http://page.com/callback',
        clientID: '...',
        responseType: 'id_token',
        scope: 'openid name read:blog',
        audience: 'urn:site:demo:blog',
        _sendTelemetry: false
      });

      var options = {
        nonce: '123',
        state: '456',
        timeout: 5000
      };

      webAuth.renewAuth(options, function() {});
    });
  });

  context('authorize', function() {
    beforeEach(function() {
      global.window = { location: '' };
    });
    afterEach(function() {
      delete global.window;
    });
    it('should check that responseType is present', function() {
      var webAuth = new WebAuth({
        domain: 'me.auth0.com',
        redirectUri: 'http://page.com/callback',
        clientID: '...',
        scope: 'openid name read:blog',
        audience: 'urn:site:demo:blog',
        _sendTelemetry: false
      });

      expect(function() {
        webAuth.authorize({ connection: 'facebook' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('responseType option is required');
      });
    });
  });

  context('renewAuth', function() {
    beforeEach(function() {
      global.window = {};
      global.window.document = {};
      global.window.origin = 'unit-test-origin';
    });

    afterEach(function() {
      delete global.window;
      SilentAuthenticationHandler.prototype.login.restore();
    });

    it('should validate the token', function(done) {
      stub(SilentAuthenticationHandler.prototype, 'login', function(usePostMessage, cb) {
        cb(
          null,
          '#state=foo&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA'
        );
      });
      TransactionManager.prototype.getStoredTransaction.restore();
      stub(TransactionManager.prototype, 'getStoredTransaction', function() {
        return {
          nonce: 'asfd',
          state: 'foo'
        };
      });

      var webAuth = new WebAuth({
        domain: 'wptest.auth0.com',
        redirectUri: 'http://page.com/callback',
        clientID: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
        responseType: 'id_token',
        scope: 'openid name read:blog',
        audience: 'urn:site:demo:blog',
        _sendTelemetry: false,
        __disableExpirationCheck: true
      });

      var options = {
        nonce: 'asfd'
      };

      webAuth.renewAuth(options, function(err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({
          accessToken: null,
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
          refreshToken: null,
          state: 'foo',
          expiresIn: null,
          tokenType: null,
          scope: null
        });

        done();
      });
    });
    describe('should return the access_token', function() {
      beforeEach(function() {
        global.window = { origin: 'unit-test-origin' };
      });
      afterEach(function() {
        delete global.window;
      });
      it('when login returns an object', function(done) {
        stub(SilentAuthenticationHandler.prototype, 'login', function(usePostMessage, cb) {
          cb(null, { accessToken: '123' });
        });

        var webAuth = new WebAuth({
          domain: 'mdocs.auth0.com',
          redirectUri: 'http://page.com/callback',
          clientID: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
          responseType: 'token',
          scope: 'openid name read:blog',
          audience: 'urn:site:demo:blog',
          _sendTelemetry: false
        });

        var options = {};

        webAuth.renewAuth(options, function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({
            accessToken: '123'
          });
          done();
        });
      });
      it('when login returns a string', function(done) {
        stub(SilentAuthenticationHandler.prototype, 'login', function(usePostMessage, cb) {
          cb(null, '#state=foo&access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1');
        });

        var webAuth = new WebAuth({
          domain: 'mdocs.auth0.com',
          redirectUri: 'http://page.com/callback',
          clientID: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
          responseType: 'token',
          scope: 'openid name read:blog',
          audience: 'urn:site:demo:blog',
          _sendTelemetry: false
        });

        var options = {};

        webAuth.renewAuth(options, function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({
            accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1',
            idToken: null,
            idTokenPayload: null,
            appState: null,
            refreshToken: null,
            state: 'foo',
            expiresIn: null,
            tokenType: null,
            scope: null
          });
          done();
        });
      });
    });

    it('should validate the token and fail', function(done) {
      stub(SilentAuthenticationHandler.prototype, 'login', function(usePostMessage, cb) {
        cb(
          null,
          '#state=foo&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA'
        );
      });

      var webAuth = new WebAuth({
        domain: 'wptest.auth0.com',
        redirectUri: 'http://page.com/callback',
        clientID: '...',
        responseType: 'id_token',
        scope: 'openid name read:blog',
        audience: 'urn:site:demo:blog',
        _sendTelemetry: false
      });

      var options = {
        nonce: '123'
      };

      webAuth.renewAuth(options, function(err, data) {
        expect(data).to.be(undefined);
        expect(err).to.eql({
          error: 'invalid_token',
          errorDescription: 'Audience gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt is not valid.'
        });
        done();
      });
    });
  });

  context('change password', function() {
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

    it('should call db-connection changePassword with all the options', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/dbconnections/change_password');
        return new RequestMock({
          body: {
            client_id: '...',
            connection: 'the_connection',
            email: 'me@example.com'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {});
          }
        });
      });

      this.auth0.changePassword(
        {
          connection: 'the_connection',
          email: 'me@example.com'
        },
        function(err) {
          expect(err).to.be(null);
          done();
        }
      );
    });

    it('should call db-connection changePassword should ignore password option', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/dbconnections/change_password');
        return new RequestMock({
          body: {
            client_id: '...',
            connection: 'the_connection',
            email: 'me@example.com'
          },
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {});
          }
        });
      });

      this.auth0.changePassword(
        {
          connection: 'the_connection',
          email: 'me@example.com',
          password: '123456'
        },
        function(err) {
          expect(err).to.be(null);
          done();
        }
      );
    });
  });

  context('passwordless start', function() {
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
      TransactionManager.prototype.process.restore();
      if (request.post.restore) {
        request.post.restore();
      }
      if (this.auth0.client.passwordless.start.restore) {
        this.auth0.client.passwordless.start.restore();
      }
    });
    it('should call `transactionManager.process` with merged params', function() {
      stub(this.auth0.client.passwordless, 'start', function() {});
      spy(TransactionManager.prototype, 'process');
      var expectedOptions = {
        responseType: 'code',
        redirectUri: 'http://page.com/callback',
        auth: 'params',
        state: 'randomState'
      };

      this.auth0.passwordlessStart(
        {
          connection: 'sms',
          phoneNumber: '+55165134',
          verificationCode: '123456',
          authParams: {
            auth: 'params'
          }
        },
        function(err, data) {
          return 'cb';
        }
      );
      var mock = TransactionManager.prototype.process;
      expect(mock.calledOnce).to.be(true);
      expect(mock.firstCall.args[0]).to.be.eql(expectedOptions);
    });
    it('should call `passwordless.start` with params from transactionManager', function() {
      var expectedOptions = {
        authParams: {
          from: 'transactionManager'
        }
      };
      var mockVerify = stub(this.auth0.client.passwordless, 'start', function() {});
      stub(TransactionManager.prototype, 'process', function() {
        return expectedOptions.authParams;
      });

      this.auth0.passwordlessStart({}, function(err, data) {
        return 'cb';
      });
      expect(mockVerify.calledOnce).to.be(true);
      expect(mockVerify.firstCall.args[0]).to.be.eql(expectedOptions);
    });

    it('should call passwordless start sms with all the options', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/passwordless/start');
        return new RequestMock({
          body: {
            client_id: '...',
            connection: 'the_connection',
            phone_number: '123456',
            send: 'code',
            authParams: {
              redirect_uri: 'http://page.com/callback',
              response_type: 'code',
              from: 'tm'
            }
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

      stub(TransactionManager.prototype, 'process', function() {
        return { from: 'tm' };
      });

      this.auth0.passwordlessStart(
        {
          connection: 'the_connection',
          phoneNumber: '123456',
          send: 'code'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({});
          done();
        }
      );
    });

    it('should call passwordless start email with all the options', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/passwordless/start');
        return new RequestMock({
          body: {
            client_id: '...',
            connection: 'the_connection',
            email: 'me@example.com',
            send: 'code',
            authParams: {
              redirect_uri: 'http://page.com/callback',
              response_type: 'code',
              from: 'tm'
            }
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

      stub(TransactionManager.prototype, 'process', function() {
        return { from: 'tm' };
      });

      this.auth0.passwordlessStart(
        {
          connection: 'the_connection',
          email: 'me@example.com',
          send: 'code'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({});
          done();
        }
      );
    });
  });

  context('passwordlessLogin', function() {
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
    it('should call `crossOriginAuthentication.login` with phoneNumber', function(done) {
      var expectedOptions = {
        credentialType: 'http://auth0.com/oauth/grant-type/passwordless/otp',
        realm: 'sms',
        username: '+55165134',
        otp: '123456'
      };
      stub(CrossOriginAuthentication.prototype, 'login', function(options, cb) {
        expect(options).to.be.eql(expectedOptions);
        expect(cb()).to.be('cb');
        done();
      });

      this.auth0.passwordlessLogin(
        {
          connection: 'sms',
          phoneNumber: '+55165134',
          verificationCode: '123456'
        },
        function(err, data) {
          return 'cb';
        }
      );
    });
    it('should call `crossOriginAuthentication.login` with email', function(done) {
      var expectedOptions = {
        credentialType: 'http://auth0.com/oauth/grant-type/passwordless/otp',
        realm: 'email',
        username: 'the@email.com',
        otp: '123456'
      };
      stub(CrossOriginAuthentication.prototype, 'login', function(options, cb) {
        expect(options).to.be.eql(expectedOptions);
        expect(cb()).to.be('cb');
        done();
      });

      this.auth0.passwordlessLogin(
        {
          connection: 'email',
          email: 'the@email.com',
          verificationCode: '123456'
        },
        function(err, data) {
          return 'cb';
        }
      );
    });
  });

  context('passwordlessVerify', function() {
    beforeEach(function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });
    afterEach(function() {
      TransactionManager.prototype.process.restore();
      this.auth0.client.passwordless.verify.restore();
    });
    it('should validate params', function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: undefined,
        _sendTelemetry: false
      });
      stub(this.auth0.client.passwordless, 'verify', function() {});
      spy(TransactionManager.prototype, 'process');
      expect(() => this.auth0.passwordlessVerify({})).to.throwError(
        /responseType option is required/
      );
    });
    it('should call `transactionManager.process` with merged params', function() {
      stub(this.auth0.client.passwordless, 'verify', function() {});
      spy(TransactionManager.prototype, 'process');
      var expectedOptions = {
        clientID: '...',
        responseType: 'code',
        redirectUri: 'http://page.com/callback',
        connection: 'sms',
        phoneNumber: '+55165134',
        verificationCode: '123456',
        state: 'randomState'
      };

      this.auth0.passwordlessVerify(
        {
          connection: 'sms',
          phoneNumber: '+55165134',
          verificationCode: '123456'
        },
        function(err, data) {
          return 'cb';
        }
      );
      var mock = TransactionManager.prototype.process;
      expect(mock.calledOnce).to.be(true);
      expect(mock.firstCall.args[0]).to.be.eql(expectedOptions);
    });
    it('should call `passwordless.verify` with params from transactionManager', function() {
      var expectedOptions = {
        from: 'transactionManager'
      };
      var mockVerify = stub(this.auth0.client.passwordless, 'verify', function() {});
      stub(TransactionManager.prototype, 'process', function() {
        return expectedOptions;
      });

      this.auth0.passwordlessVerify({}, function(err, data) {
        return 'cb';
      });
      expect(mockVerify.calledOnce).to.be(true);
      expect(mockVerify.firstCall.args[0]).to.be.eql(expectedOptions);
    });
    it('should call callback with error', function(done) {
      var expectedError = new Error('some error');
      stub(this.auth0.client.passwordless, 'verify', function(params, cb) {
        cb(expectedError);
      });
      stub(TransactionManager.prototype, 'process', function() {});

      this.auth0.passwordlessVerify({}, function(err, data) {
        expect(err).to.be.eql(expectedError);
        done();
      });
    });
    it('should windowHelper.redirect on success', function(done) {
      var expectedUrl = 'https://verify-url.example.com';

      stub(this.auth0.client.passwordless, 'buildVerifyUrl', function() {
        return expectedUrl;
      });
      stub(this.auth0.client.passwordless, 'verify', function(params, cb) {
        cb(null);
      });
      stub(TransactionManager.prototype, 'process', function() {});
      stub(windowHelper, 'redirect', function(url) {
        expect(url).to.be(expectedUrl);
        done();
      });

      this.auth0.passwordlessVerify({});

      windowHelper.redirect.restore();
      this.auth0.client.passwordless.buildVerifyUrl.restore();
    });
  });

  context('signup', function() {
    before(function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'token',
        _sendTelemetry: false
      });
    });

    afterEach(function() {
      request.post.restore();
    });

    it('should call db-connection signup with all the options', function(done) {
      stub(request, 'post', function(url) {
        if (url === 'https://me.auth0.com/oauth/token') {
          return new RequestMock({
            body: {
              client_id: '...',
              realm: 'the_connection',
              grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
              username: 'me@example.com',
              password: '123456',
              scope: 'openid'
            },
            headers: {
              'Content-Type': 'application/json'
            },
            cb: function(cb) {
              cb(null, {
                body: {
                  token_type: 'Bearer',
                  expires_in: 36000,
                  id_token: 'eyJ...'
                }
              });
            }
          });
        }

        if (url === 'https://me.auth0.com/dbconnections/signup') {
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

        throw new Error('Invalid url in request post stub');
      });

      this.auth0.signupAndAuthorize(
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

      this.auth0.signupAndAuthorize(
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
  context('crossOriginAuthentication', function() {
    before(function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'token',
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

    it('should call login', function(done) {
      var expectedOptions = { foo: 'bar' };
      stub(CrossOriginAuthentication.prototype, 'login', function(options, cb) {
        expect(options).to.be.eql(expectedOptions);
        expect(cb()).to.be('cb');
        done();
      });
      this.auth0.login(expectedOptions, function() {
        return 'cb';
      });
    });
    it('should call callback', function(done) {
      stub(CrossOriginAuthentication.prototype, 'callback', done);
      this.auth0.crossOriginAuthenticationCallback();
    });
  });

  context('checkSession', function() {
    beforeEach(function() {
      this.auth0 = new WebAuth({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'token',
        _sendTelemetry: false
      });
      stub(TransactionManager.prototype, 'process', function(params) {
        return Object.assign({}, params, { from: 'transaction-manager' });
      });
    });
    afterEach(function() {
      TransactionManager.prototype.process.restore();
      if (IframeHandler.prototype.init.restore) {
        IframeHandler.prototype.init.restore();
      }
      if (WebAuth.prototype.validateAuthenticationResponse.restore) {
        WebAuth.prototype.validateAuthenticationResponse.restore();
      }
    });
    it('inits IframeHandler with correct params', function(done) {
      stub(IframeHandler.prototype, 'init', function() {
        expect(this.url).to.be(
          'https://me.auth0.com/authorize?client_id=...&response_type=token&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback&from=transaction-manager&response_mode=web_message&prompt=none'
        );
        expect(this.eventListenerType).to.be('message');
        expect(this.timeout).to.be(60000);
        done();
      });
      this.auth0.checkSession({}, function(err, data) {});
    });
    it('uses custom timeout when provided', function(done) {
      var timeout = 1;
      stub(IframeHandler.prototype, 'init', function() {
        expect(this.timeout).to.be(timeout);
        done();
      });
      this.auth0.checkSession(
        {
          timeout: timeout
        },
        function(err, data) {}
      );
    });
    it('eventValidator validates the event data type is `authorization_response`', function(done) {
      stub(IframeHandler.prototype, 'init', function() {
        var getEvent = function(type) {
          return { event: { data: { type: type } } };
        };
        expect(this.eventValidator.isValid(getEvent('wrong'))).to.be(false);
        expect(this.eventValidator.isValid(getEvent('authorization_response'))).to.be(true);
        done();
      });
      this.auth0.checkSession({}, function(err, data) {});
    });
    it('timeoutCallback calls callback with error response', function(done) {
      stub(IframeHandler.prototype, 'init', function() {
        console.log('ca;llleleled');
        this.timeoutCallback();
      });
      this.auth0.checkSession({}, function(err, data) {
        expect(err).to.be.eql({
          error: 'timeout',
          error_description: 'Timeout during executing web_message communication'
        });
        done();
      });
    });
    it('callback handles error response', function(done) {
      var errorResponse = {
        error: 'the-error',
        error_description: 'error description',
        somethingElse: 'foobar'
      };
      stub(IframeHandler.prototype, 'init', function() {
        this.callback({ event: { data: { response: errorResponse } } });
      });
      this.auth0.checkSession({}, function(err, data) {
        expect(err).to.be.eql({
          error: 'the-error',
          error_description: 'error description'
        });
        done();
      });
    });
    it('callback handles success response', function(done) {
      var response = { access_token: 'foobar' };
      stub(WebAuth.prototype, 'validateAuthenticationResponse', function(options, parsedHash, cb) {
        expect(options).to.be.eql({
          clientID: '...',
          redirectUri: 'http://page.com/callback',
          responseType: 'token',
          from: 'transaction-manager',
          responseMode: 'web_message',
          prompt: 'none'
        });
        expect(parsedHash).to.be.eql(response);
        cb(null, {
          accessToken: response.access_token
        });
      });
      stub(IframeHandler.prototype, 'init', function() {
        this.callback({ event: { data: { response: response } } });
      });
      this.auth0.checkSession({}, function(err, data) {
        expect(err).to.be(null);
        expect(data).to.be.eql({ accessToken: 'foobar' });
        done();
      });
    });
  });
});
