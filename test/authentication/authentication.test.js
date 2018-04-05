var expect = require('expect.js');

var stub = require('sinon').stub;
var spy = require('sinon').spy;

var RequestMock = require('../mock/request-mock');

var request = require('superagent');

var RequestBuilder = require('../../src/helper/request-builder');
var windowHelper = require('../../src/helper/window');
var storage = require('../../src/helper/storage');
var Authentication = require('../../src/authentication');
var WebAuth = require('../../src/web-auth');

var telemetryInfo = new RequestBuilder({}).getTelemetryData();

describe('auth0.authentication', function() {
  before(function() {
    this.webAuthSpy = {
      checkSession: spy(),
      _universalLogin: {
        getSSOData: spy()
      }
    };
  });
  describe('initialization', function() {
    it('should use first argument as options when only one argument is used', function() {
      var auth0 = new Authentication({ domain: 'foo', clientID: 'cid' });
      expect(auth0.baseOptions.domain).to.be.equal('foo');
    });
    it('should use second argument as options when two arguments are used', function() {
      var auth0 = new Authentication({}, { domain: 'foo', clientID: 'cid' });
      expect(auth0.baseOptions.domain).to.be.equal('foo');
    });
    it('should check that options is passed', function() {
      expect(function() {
        var auth0 = new Authentication();
      }).to.throwException(function(e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should check that domain is set', function() {
      expect(function() {
        var auth0 = new Authentication(this.webAuthSpy, { clientID: '...' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('domain option is required');
      });
    });

    it('should check that clientID is set', function() {
      expect(function() {
        var auth0 = new Authentication(this.webAuthSpy, { domain: 'me.auth0.com' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('clientID option is required');
      });
    });
  });

  context('buildAuthorizeUrl', function() {
    before(function() {
      this.auth0 = new Authentication(this.webAuthSpy, {
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    it('should check that options is valid', function() {
      expect(() => {
        this.auth0.buildAuthorizeUrl('asdfasdfds');
      }).to.throwException(function(e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    ['username', 'popupOptions', 'domain', 'tenant', 'timeout'].forEach(function(param) {
      it('should remove parameter: ' + param, function() {
        var options = {};
        options[param] = 'foobar';
        var url = this.auth0.buildAuthorizeUrl(options);
        expect(url).to.be(
          'https://me.auth0.com/authorize?client_id=...&response_type=code&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback'
        );
      });
    });

    it('should return a url using the default settings', function() {
      var url = this.auth0.buildAuthorizeUrl({ state: '1234' });

      expect(url).to.be(
        'https://me.auth0.com/authorize?client_id=...&response_type=code&redirect_uri=http%3A%2F%2Fpage.com%2Fcallback&state=1234'
      );
    });

    it('should return a url with connection_scope', function() {
      var url = this.auth0.buildAuthorizeUrl({
        responseType: 'token',
        redirectUri: 'http://anotherpage.com/callback2',
        prompt: 'none',
        state: '1234',
        connection_scope: 'scope1,scope2'
      });

      expect(url).to.be(
        'https://me.auth0.com/authorize?client_id=...&response_type=token&redirect_uri=http%3A%2F%2Fanotherpage.com%2Fcallback2&prompt=none&state=1234&connection_scope=scope1%2Cscope2'
      );
    });

    it('should return a url with connection_scope as a string', function() {
      var url = this.auth0.buildAuthorizeUrl({
        responseType: 'token',
        redirectUri: 'http://anotherpage.com/callback2',
        prompt: 'none',
        state: '1234',
        connection_scope: ['scope1', 'scope2']
      });

      expect(url).to.be(
        'https://me.auth0.com/authorize?client_id=...&response_type=token&redirect_uri=http%3A%2F%2Fanotherpage.com%2Fcallback2&prompt=none&state=1234&connection_scope=scope1%2Cscope2'
      );
    });

    it('should return a url using overriding the default settings', function() {
      var url = this.auth0.buildAuthorizeUrl({
        responseType: 'token',
        redirectUri: 'http://anotherpage.com/callback2',
        prompt: 'none',
        state: '1234'
      });

      expect(url).to.be(
        'https://me.auth0.com/authorize?client_id=...&response_type=token&redirect_uri=http%3A%2F%2Fanotherpage.com%2Fcallback2&prompt=none&state=1234'
      );
    });

    it('should return a url using using whitelisted authorization parameter device', function() {
      var url = this.auth0.buildAuthorizeUrl({
        responseType: 'token',
        redirectUri: 'http://anotherpage.com/callback2',
        prompt: 'none',
        state: '1234',
        device: 'my-device'
      });

      expect(url).to.be(
        'https://me.auth0.com/authorize?client_id=...&response_type=token&redirect_uri=http%3A%2F%2Fanotherpage.com%2Fcallback2&prompt=none&state=1234&device=my-device'
      );
    });
  });

  context('buildAuthorizeUrl with Telemetry', function() {
    before(function() {
      this.auth0 = new Authentication(this.webAuthSpy, {
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code'
      });
    });

    it('should return a url using overriding the default settings', function() {
      var url = this.auth0.buildAuthorizeUrl({
        responseType: 'token',
        redirectUri: 'http://anotherpage.com/callback2',
        prompt: 'none',
        state: '1234'
      });

      expect(url).to.be(
        'https://me.auth0.com/authorize?client_id=...&response_type=token&redirect_uri=http%3A%2F%2Fanotherpage.com%2Fcallback2&prompt=none&state=1234&auth0Client=' +
          encodeURIComponent(telemetryInfo)
      );
    });
  });

  context('buildLogoutUrl', function() {
    before(function() {
      this.auth0 = new Authentication(this.webAuthSpy, {
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    it('should check that options is valid', function() {
      expect(() => {
        this.auth0.buildLogoutUrl('asdfasdfds');
      }).to.throwException(function(e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should return a url using the default settings', function() {
      var url = this.auth0.buildLogoutUrl();

      expect(url).to.be('https://me.auth0.com/v2/logout?client_id=...');
    });

    it('should ignore the clientID', function() {
      var url = this.auth0.buildLogoutUrl({
        clientID: undefined
      });

      expect(url).to.be('https://me.auth0.com/v2/logout?');
    });

    it('should return a url using overriding the default settings', function() {
      var url = this.auth0.buildLogoutUrl({
        clientID: '123',
        returnTo: 'http://page.com',
        federated: ''
      });

      expect(url).to.be(
        'https://me.auth0.com/v2/logout?client_id=123&returnTo=http%3A%2F%2Fpage.com&federated'
      );
    });
    it('should not add value for federated', function() {
      var url = this.auth0.buildLogoutUrl({
        clientID: '123',
        returnTo: 'http://page.com',
        federated: true
      });

      expect(url).to.be(
        'https://me.auth0.com/v2/logout?client_id=123&returnTo=http%3A%2F%2Fpage.com&federated'
      );
    });
    it('should not included federated param if the value is false', function() {
      var url = this.auth0.buildLogoutUrl({
        clientID: '123',
        returnTo: 'http://page.com',
        federated: false
      });

      expect(url).to.be(
        'https://me.auth0.com/v2/logout?client_id=123&returnTo=http%3A%2F%2Fpage.com'
      );
    });
  });

  context('buildLogoutUrl with Telemetry', function() {
    before(function() {
      this.auth0 = new Authentication(this.webAuthSpy, {
        domain: 'me.auth0.com',
        clientID: '123',
        redirectUri: 'http://page.com/callback',
        responseType: 'code'
      });
    });

    it('should return a url using overriding the default settings', function() {
      var url = this.auth0.buildLogoutUrl({
        clientID: '123',
        returnTo: 'http://page.com',
        federated: ''
      });

      expect(url).to.be(
        'https://me.auth0.com/v2/logout?client_id=123&returnTo=http%3A%2F%2Fpage.com&auth0Client=' +
          encodeURIComponent(telemetryInfo) +
          '&federated'
      );
    });
  });

  context('getSSOData', function() {
    context('when outside of the hosted login page', function() {
      before(function() {
        this.auth0 = new Authentication(this.webAuthSpy, {
          domain: 'me.auth0.com',
          clientID: '...',
          redirectUri: 'http://page.com/callback',
          responseType: 'code',
          _sendTelemetry: false
        });
        stub(storage, 'getItem', function(key) {
          expect(key).to.be('auth0.ssodata');
          return JSON.stringify({
            lastUsedConnection: 'lastUsedConnection',
            lastUsedUsername: 'lastUsedUsername',
            lastUsedSub: 'the-user-id'
          });
        });
      });
      after(function() {
        storage.getItem.restore();
      });
      beforeEach(function() {
        stub(windowHelper, 'getWindow', function() {
          return { location: { host: 'other-domain.auth0.com' } };
        });
      });
      afterEach(function() {
        windowHelper.getWindow.restore();
      });
      it('fails if callback is not a function', function() {
        var _this = this;
        expect(function() {
          _this.auth0.getSSOData(null, null);
        }).to.throwError();
      });
      it('works if callback is the second param', function(done) {
        this.auth0.getSSOData(null, function(err, result) {
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1](null, {
          idTokenPayload: { sub: 'some-other-id' }
        });
      });
      it('uses correct scope and responseType', function() {
        this.auth0.getSSOData(function() {});
        expect(this.webAuthSpy.checkSession.lastCall.args[0]).to.be.eql({
          responseType: 'token id_token',
          scope: 'openid profile email',
          connection: 'lastUsedConnection',
          timeout: 5000
        });
      });
      it('returns sso:false if checkSession fails', function(done) {
        this.auth0.getSSOData(function(err, result) {
          expect(err).to.be.eql({ some: 'error' });
          expect(result).to.be.eql({ sso: false });
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1]({ some: 'error' });
      });
      it("returns sso:false if lastUsedSub is different from checkSesion's sub", function(done) {
        this.auth0.getSSOData(function(err, result) {
          expect(err).to.be.eql(null);
          expect(result).to.be.eql({ sso: false });
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1](null, {
          idTokenPayload: { sub: 'some-other-id' }
        });
      });
      it('do not return error if error === login_required', function(done) {
        this.auth0.getSSOData(function(err, result) {
          expect(err).to.be(null);
          expect(result).to.be.eql({ sso: false });
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1]({
          error: 'login_required',
          error_description: 'foobar'
        });
      });
      it('provides a better description for consent_required error', function(done) {
        this.auth0.getSSOData(function(err, result) {
          expect(err).to.be.eql({
            error: 'consent_required',
            error_description: 'Consent required. When using `getSSOData`, the user has to be authenticated with the following scope: `openid profile email`.'
          });
          expect(result).to.be.eql({ sso: false });
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1]({
          error: 'consent_required',
          error_description: 'foobar'
        });
      });
      it('returns ssoData object with lastUsedConnection and idTokenPayload.name when there is no idTokenPayload.email', function(
        done
      ) {
        this.auth0.getSSOData(function(err, result) {
          expect(err).to.be(null);
          expect(result).to.be.eql({
            lastUsedConnection: { name: 'lastUsedConnection' },
            lastUsedUserID: 'the-user-id',
            lastUsedUsername: 'last-used-user-name',
            lastUsedClientID: '...',
            sessionClients: ['...'],
            sso: true
          });
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1](null, {
          idTokenPayload: { sub: 'the-user-id', name: 'last-used-user-name' }
        });
      });
      it('returns ssoData object with lastUsedConnection and idTokenPayload.email by default', function(
        done
      ) {
        this.auth0.getSSOData(function(err, result) {
          expect(err).to.be(null);
          expect(result).to.be.eql({
            lastUsedConnection: { name: 'lastUsedConnection' },
            lastUsedUserID: 'the-user-id',
            lastUsedUsername: 'last-used-user-email',
            lastUsedClientID: '...',
            sessionClients: ['...'],
            sso: true
          });
          done();
        });

        this.webAuthSpy.checkSession.lastCall.args[1](null, {
          idTokenPayload: {
            sub: 'the-user-id',
            email: 'last-used-user-email',
            name: 'do not use me'
          }
        });
      });
    });

    context('when inside of the hosted login page', function() {
      before(function() {
        this.auth0 = new Authentication(this.webAuthSpy, {
          domain: 'me.auth0.com',
          clientID: '...',
          redirectUri: 'http://page.com/callback',
          responseType: 'code',
          _sendTelemetry: false
        });
      });
      beforeEach(function() {
        stub(windowHelper, 'getWindow', function() {
          return { location: { host: 'me.auth0.com' } };
        });
      });
      afterEach(function() {
        windowHelper.getWindow.restore();
      });
      it('calls webauth._universalLogin.getSSOData with same params', function() {
        this.auth0.getSSOData('withActiveDirectories', 'cb');
        expect(this.webAuthSpy._universalLogin.getSSOData.lastCall.args).to.be.eql([
          'withActiveDirectories',
          'cb'
        ]);
      });
    });
  });

  context('userInfo', function() {
    before(function() {
      this.auth0 = new Authentication(this.webAuthSpy, {
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

    it('should call userinfo with the access token', function(done) {
      stub(request, 'get', function(url) {
        expect(url).to.be('https://me.auth0.com/userinfo');
        return new RequestMock({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer abcd1234'
          },
          cb: function(cb) {
            cb(null, {
              body: {
                user_id: '...',
                provider: 'auth0',
                connection: 'Username-Password-Authentication',
                is_social: false
              }
            });
          }
        });
      });

      this.auth0.userInfo('abcd1234', function(err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({
          user_id: '...',
          provider: 'auth0',
          connection: 'Username-Password-Authentication',
          is_social: false
        });
        done();
      });
    });
  });

  context('delegation', function() {
    before(function() {
      this.auth0 = new Authentication(this.webAuthSpy, {
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

    it('should call delegation with all the options', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/delegation');
        return new RequestMock({
          body: {
            client_id: '...',
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            refresh_token: 'your_refresh_token',
            api_type: 'app'
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
      });

      this.auth0.delegation(
        {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          refresh_token: 'your_refresh_token',
          api_type: 'app'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({
            tokenType: 'Bearer',
            expiresIn: 36000,
            idToken: 'eyJ...'
          });
          done();
        }
      );
    });
  });

  context('login', function() {
    before(function() {
      this.auth0 = new Authentication(this.webAuthSpy, {
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code',
        _sendTelemetry: false
      });
    });

    afterEach(function() {
      this.auth0.oauthToken.restore();
    });

    it('should call oauthToken with all the options', function(done) {
      stub(this.auth0, 'oauthToken', function(options, cb) {
        expect(options).to.eql({
          username: 'someUsername',
          password: '123456',
          grantType: 'password'
        });
        cb();
      });

      this.auth0.loginWithDefaultDirectory(
        {
          username: 'someUsername',
          password: '123456'
        },
        function(err, data) {
          done();
        }
      );
    });

    it('should call oauthToken with all the options', function(done) {
      stub(this.auth0, 'oauthToken', function(options, cb) {
        expect(options).to.eql({
          username: 'someUsername',
          password: '123456',
          grantType: 'http://auth0.com/oauth/grant-type/password-realm',
          realm: 'pepe.com'
        });
        cb();
      });

      this.auth0.login(
        {
          username: 'someUsername',
          password: '123456',
          realm: 'pepe.com'
        },
        function(err, data) {
          done();
        }
      );
    });
  });

  context('oauthToken', function() {
    before(function() {
      this.auth0 = new Authentication(this.webAuthSpy, {
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

    it('should allow to login', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/oauth/token');
        return new RequestMock({
          body: {
            client_id: '...',
            grant_type: 'password',
            username: 'someUsername',
            password: '123456'
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
      });

      this.auth0.oauthToken(
        {
          username: 'someUsername',
          password: '123456',
          grantType: 'password'
        },
        function(err, data) {
          expect(err).to.be(null);
          expect(data).to.eql({
            tokenType: 'Bearer',
            expiresIn: 36000,
            idToken: 'eyJ...'
          });
          done();
        }
      );
    });
  });

  context('getUserCountry', function() {
    before(function() {
      this.auth0 = new Authentication(this.webAuthSpy, {
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

    it('should return the user country code', function(done) {
      stub(request, 'get', function(url) {
        expect(url).to.be('https://me.auth0.com/user/geoloc/country');
        return new RequestMock({
          headers: {
            'Content-Type': 'application/json'
          },
          cb: function(cb) {
            cb(null, {
              body: {
                country_code: 'AR'
              }
            });
          }
        });
      });

      this.auth0.getUserCountry(function(err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({
          countryCode: 'AR'
        });
        done();
      });
    });
  });
});
