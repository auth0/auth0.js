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
var WebAuth = require('../../src/web-auth');

describe('auth0.WebAuth', function() {
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
    after(function() {
      SilentAuthenticationHandler.prototype.login.restore();

      delete global.window;
    });

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
      storage.reload();
    });

    it('should fail if the nonce is not valid', function(done) {
      stub(SilentAuthenticationHandler.prototype, 'login', function(usePostMessage, cb) {
        cb(
          null,
          '#state=456&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA'
        );
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
        '#access_token=asldkfjahsdlkfjhasd&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&state=theState&refresh_token=kajshdgfkasdjhgfas';
    });

    beforeEach(function() {
      spy(TransactionManager.prototype, 'getStoredTransaction');
    });
    afterEach(function() {
      TransactionManager.prototype.getStoredTransaction.restore();
    });

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
          hash: '#access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&state=theState&refresh_token=kajshdgfkasdjhgfas&scope=foo'
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
            appStatus: null,
            refreshToken: 'kajshdgfkasdjhgfas',
            state: 'theState',
            expiresIn: null,
            tokenType: 'Bearer',
            scope: 'foo'
          });

          expect(TransactionManager.prototype.getStoredTransaction.calledOnce).to.be.ok();

          done();
        }
      ); // eslint-disable-line
    });

    it('should parse a valid hash with HS256 signed token', function(done) {
      var webAuth = new WebAuth({
        domain: 'auth0-tests-lock.auth0.com',
        redirectUri: 'http://example.com/callback',
        clientID: 'ixeOHFhD7NSPxEQK6CFcswjUsa5YkcXS',
        responseType: 'token',
        __disableExpirationCheck: true
      });

      var data = webAuth.parseHash(
        {
          _idTokenVerification: false,
          hash: '#access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik5UWXlNVEJDTVVFNVJFRTBOVVU1T1VFek5VSkJNa0kzUWpZME56SXlSVE01UkRrNU5UUTFSZyJ9.eyJpc3MiOiJodHRwczovL2F1dGgwLXRlc3RzLWxvY2suYXV0aDAuY29tLyIsInN1YiI6InR3aXR0ZXJ8MzY2MTQxOTMxIiwiYXVkIjoiaXhlT0hGaEQ3TlNQeEVRSzZDRmNzd2pVc2E1WWtjWFMiLCJleHAiOjE0ODYwODMxNDYsImlhdCI6MTQ4NjA0NzE0Nn0.hmUmW9DFYVeju8s7k_1Co_eyDrcss5ZqOajV1skZc7lGfrVYVe2MYZ0sX0MNZPFMmPr30cXzaPfUmpluildYYRwKkr3uNw6MpGxM4X5QVrRjFwNnEILzBZdz9KWVjkBV9kbSPnl1YzcgH65ivmUvmk5f2lCcv-i6EXmHlPJyMIxbhk0AfNYD9XdeSN8BhB193m3SJhvHw-B3hOvBqdnGt86qmSmT5x_0UCLBVz3UIaU--08m-0faLeiI9cm7oL4jE1VAQ3ys5lMJQCrgba53xdC7CnzjrgehFIZPfF0A1C553Fj8ZljO63K8ms_v9SNhlGEEutvA3kOuST0WeWcEyQ&token_type=Bearer&state=theState&refresh_token=kajshdgfkasdjhgfas'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({
            accessToken: 'VjubIMBmpgQ2W2',
            idToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik5UWXlNVEJDTVVFNVJFRTBOVVU1T1VFek5VSkJNa0kzUWpZME56SXlSVE01UkRrNU5UUTFSZyJ9.eyJpc3MiOiJodHRwczovL2F1dGgwLXRlc3RzLWxvY2suYXV0aDAuY29tLyIsInN1YiI6InR3aXR0ZXJ8MzY2MTQxOTMxIiwiYXVkIjoiaXhlT0hGaEQ3TlNQeEVRSzZDRmNzd2pVc2E1WWtjWFMiLCJleHAiOjE0ODYwODMxNDYsImlhdCI6MTQ4NjA0NzE0Nn0.hmUmW9DFYVeju8s7k_1Co_eyDrcss5ZqOajV1skZc7lGfrVYVe2MYZ0sX0MNZPFMmPr30cXzaPfUmpluildYYRwKkr3uNw6MpGxM4X5QVrRjFwNnEILzBZdz9KWVjkBV9kbSPnl1YzcgH65ivmUvmk5f2lCcv-i6EXmHlPJyMIxbhk0AfNYD9XdeSN8BhB193m3SJhvHw-B3hOvBqdnGt86qmSmT5x_0UCLBVz3UIaU--08m-0faLeiI9cm7oL4jE1VAQ3ys5lMJQCrgba53xdC7CnzjrgehFIZPfF0A1C553Fj8ZljO63K8ms_v9SNhlGEEutvA3kOuST0WeWcEyQ',
            idTokenPayload: {
              iss: 'https://auth0-tests-lock.auth0.com/',
              sub: 'twitter|366141931',
              aud: 'ixeOHFhD7NSPxEQK6CFcswjUsa5YkcXS',
              exp: 1486083146,
              iat: 1486047146
            },
            appStatus: null,
            refreshToken: 'kajshdgfkasdjhgfas',
            state: 'theState',
            expiresIn: null,
            tokenType: 'Bearer',
            scope: null
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
          appStatus: null,
          refreshToken: 'kajshdgfkasdjhgfas',
          state: 'theState',
          expiresIn: null,
          tokenType: 'Bearer',
          scope: null
        });

        expect(TransactionManager.prototype.getStoredTransaction.calledOnce).to.be.ok();

        done();
      });
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
          hash: '#access_token=VjubIMBmpgQ2W2&token_type=Bearer&state=theState&refresh_token=kajshdgfkasdjhgfas'
        },
        function(err, data) {
          expect(data).to.eql({
            accessToken: 'VjubIMBmpgQ2W2',
            idToken: null,
            idTokenPayload: null,
            appStatus: null,
            refreshToken: 'kajshdgfkasdjhgfas',
            state: 'theState',
            expiresIn: null,
            tokenType: 'Bearer',
            scope: null
          });

          expect(TransactionManager.prototype.getStoredTransaction.calledOnce).to.be.ok();

          done();
        }
      ); // eslint-disable-line
    });

    it('should fail with an invalid audience', function(done) {
      var webAuth = new WebAuth({
        domain: 'mdocs.auth0.com',
        redirectUri: 'http://example.com/callback',
        clientID: '0HP71GSd6PuoRYJ3p',
        responseType: 'token'
      });

      var data = webAuth.parseHash(
        {
          hash: '#access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL21kb2NzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw0QVpERjU2Nzg5IiwiYXVkIjoiMEhQNzFHU2Q2UHVvUllKM0RYS2RpWENVVWRHbUJidXAiLCJleHAiOjE0Nzg1NjIyNTMsImlhdCI6MTQ3ODUyNjI1M30.LELBxWWxcGdYTaE_gpSmlNSdcucqyrhuHQo-s7hTDBA&token_type=Bearer&state=theState&refresh_token=kajshdgfkasdjhgfas'
        },
        function(err, data) {
          expect(err).to.eql({
            error: 'invalid_token',
            errorDescription: 'Audience 0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup is not valid.' // eslint-disable-line
          });
          done();
        }
      ); // eslint-disable-line
    });

    it('should fail with an invalid issuer', function(done) {
      var webAuth = new WebAuth({
        domain: 'mdocs_2.auth0.com',
        redirectUri: 'http://example.com/callback',
        clientID: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
        responseType: 'token'
      });

      var data = webAuth.parseHash(
        {
          hash: '#access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL21kb2NzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw0QVpERjU2Nzg5IiwiYXVkIjoiMEhQNzFHU2Q2UHVvUllKM0RYS2RpWENVVWRHbUJidXAiLCJleHAiOjE0Nzg1NjIyNTMsImlhdCI6MTQ3ODUyNjI1M30.LELBxWWxcGdYTaE_gpSmlNSdcucqyrhuHQo-s7hTDBA&token_type=Bearer&state=theState&refresh_token=kajshdgfkasdjhgfas'
        },
        function(err, data) {
          expect(err).to.eql({
            error: 'invalid_token',
            errorDescription: 'Issuer https://mdocs.auth0.com/ is not valid.' // eslint-disable-line
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
          hash: '#token_type=Bearer&state=theState'
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

  context('renewAuth', function() {
    before(function() {
      global.window = {};
      global.window.removeEventListener = function() {};
    });
    after(function() {
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
  });

  context('login', function() {
    it('should check that responseType is present', function() {
      global.window = { location: '' };
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

      delete global.window;
    });
  });

  context('renewAuth', function() {
    beforeEach(function() {
      global.window = {};
      global.window.document = {};

      spy(TransactionManager.prototype, 'getStoredTransaction');
    });

    afterEach(function() {
      delete global.window;
      SilentAuthenticationHandler.prototype.login.restore();

      TransactionManager.prototype.getStoredTransaction.restore();
    });

    it('should validate the token', function(done) {
      stub(SilentAuthenticationHandler.prototype, 'login', function(usePostMessage, cb) {
        cb(
          null,
          '#id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA'
        );
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
          appStatus: null,
          refreshToken: null,
          state: null,
          expiresIn: null,
          tokenType: null,
          scope: null
        });

        expect(TransactionManager.prototype.getStoredTransaction.calledTwice).to.be.ok();

        done();
      });
    });
    describe('should return the access_token', function() {
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
          cb(null, '#access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1');
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
            appStatus: null,
            refreshToken: null,
            state: null,
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
          '#id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL21kb2NzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw0QVpERjU2Nzg5IiwiYXVkIjpbIjBIUDcxR1NkNlB1b1JZSjNEWEtkaVhDVVVkR21CYnVwIl0sImV4cCI6MTQ3ODU2MjI1MywiaWF0IjoxNDc4NTI2MjUzfQ.3x97RcBqXq9UE3isgbPdVlC0XdU7kQrPhaOFR-Fb4TA'
        );
      });

      var webAuth = new WebAuth({
        domain: 'mdocs.auth0.com',
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

      webAuth.renewAuth(options, function(err, data) {
        expect(data).to.be(undefined);
        expect(err).to.eql({
          error: 'invalid_token',
          errorDescription: 'Audience 0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup is not valid.'
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
        auth: 'params'
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
        verificationCode: '123456'
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
});
