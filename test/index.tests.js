/**
 * Config mocha
 */

mocha.timeout(60000);
mocha.globals(['jQuery*', '__auth0jp*']);

/**
 * Test Auth0
 */

describe('Auth0', function () {
  afterEach(function () {
    global.window.location.hash = '';
  });

  it('has a semver tag', function (done) {
    expect(Auth0.version).to.be.a('string');
    done();
  });

  it('has a client information', function (done) {
    expect(Auth0.clientInfo).to.be.a('object');
    done();
  });

  it('sends client information by default', function (done) {
    var auth0 = new Auth0({
      clientID:     'aaaabcdefgh',
      callbackURL: 'https://myapp.com/callback',
      domain:       'aaa.auth0.com'
    });

    auth0._redirect = function (the_url) {
      expect(the_url).to.contain('auth0Client');
    };

    auth0.login({nonce: '12345'});

    done();
  });

  it('should not send client information when disabled', function (done) {
    var auth0 = new Auth0({
      clientID:     'aaaabcdefgh',
      callbackURL: 'https://myapp.com/callback',
      domain:       'aaa.auth0.com',
      sendSDKClientInfo: false
    });

    auth0._redirect = function (the_url) {
      expect(the_url).to.not.contain('auth0Client');
    };

    auth0.login({nonce: '12345'});

    done();
  });

  it('should fail if auth0.login is called with {popup: true, callbackOnLocationHash: true} and without callback', function () {
    var auth0 = new Auth0({
      clientID:    'aaaabcdefgh',
      domain:      'aaa.auth0.com',
      callbackURL: 'https://myapp.com/callback',
      callbackOnLocationHash: true
    });

    expect(function () {
      auth0.signin({popup: true, nonce: '12345'});
    }).to.throwError(/popup mode should receive a mandatory callback/);
  });

  it('should fail if auth0.loginWithPopup is called with {callbackOnLocationHash: true} without callback', function () {
    var auth0 = new Auth0({
      clientID:    'aaaabcdefgh',
      domain:      'aaa.auth0.com',
      callbackURL: 'https://myapp.com/callback',
      callbackOnLocationHash: true
    });

    expect(function () {
      auth0.loginWithPopup({});
    }).to.throwError(/popup mode should receive a mandatory callback/);
  });

  it('should support to use signin as an alias for login', function () {
    var auth0 = new Auth0({
      clientID:    'aaaabcdefgh',
      domain:      'aaa.auth0.com',
      callbackURL: 'https://myapp.com/callback',
      callbackOnLocationHash: true
    });

    expect(auth0.signin).to.be.equal(auth0.login);
  });

  it('should not contain popupOptions= inside the authorize query string', function (done) {
    var auth0 = new Auth0({
      clientID:     'aaaabcdefgh',
      callbackURL: 'https://myapp.com/callback',
      domain:       'aaa.auth0.com'
    });

    auth0._redirect = function (the_url) {
      expect(the_url.split('?')[0])
        .to.contain('https://aaa.auth0.com/authorize');

      var parsed = {};
      the_url.split('?')[1].replace(
        new RegExp('([^?=&]+)(=([^&]*))?', 'g'),
        function($0, $1, $2, $3) { parsed[$1] = decodeURIComponent($3); }
      );

      expect(parsed.response_type).to.equal('code');
      expect(parsed.redirect_uri).to.equal('https://myapp.com/callback');
      expect(parsed.client_id).to.equal('aaaabcdefgh');
      expect(parsed.scope).to.equal('openid');
      expect(parsed.popupOptions).not.to.be.ok;
      done();
    };

    auth0.login({
      connection: 'google-oauth2',
      nonce: '1234',
      popupOptions: {}
    });
  });

  if (!navigator.userAgent.match(/iPad|iPhone|iPod/g)) {
    it('should return empty SSO data after logout', function (done) {
      forceLogout('aaa.auth0.com', function () {
        var auth0 = new Auth0({
          clientID:     'aaaabcdefgh',
          callbackURL:  'https://myapp.com/callback',
          domain:       'aaa.auth0.com'
        });

        auth0.getSSOData(function (err, ssoData) {
          expect(ssoData.sso).to.eql(false);
          done();
        });
      });
    });
  }

  describe('Constructor', function () {
    it('should fail to construct without a clientID', function () {
      expect(function () {
        new Auth0({});
      }).to.throwError(/clientID is required/);
    });

    it('should not fail to construct without a callbackURL', function () {
      expect(function () {
        new Auth0({clientID: '1123sadsd'});
      }).not.to.throwError(/callbackURL is required/);
    });

    it('should fail to construct without a domain', function () {
      expect(function () {
        new Auth0({clientID: '1123sadsd', callbackURL: 'aaaa'});
      }).to.throwError(/domain is required/);
    });

    it('should use constructor if called as function', function () {
      var auth0 = Auth0;
      var initialized_without_new = auth0({
        clientID:    'aaaabcdefgh',
        callbackURL: 'https://myapp.com/callback',
        domain:      'aaa.auth0.com'
      });

      expect(initialized_without_new).to.be.an(Auth0);
    });

    it('should set forceJSONP to the provided Boolean value', function(done) {
      var auth0 = new Auth0({
        clientID:    'aaaabcdefgh',
        callbackURL: 'https://myapp.com/callback',
        domain:      'aaa.auth0.com',
        forceJSONP:  false
      });
      expect(auth0._useJSONP).to.be(false);

      auth0 = new Auth0({
        clientID:    'aaaabcdefgh',
        callbackURL: 'https://myapp.com/callback',
        domain:      'aaa.auth0.com',
        forceJSONP:  true
      });
      expect(auth0._useJSONP).to.be(true);
      done();
    });
  });

  describe('In redirect mode', function () {
    it('should redirect to /authorize with google (callbackOnLocationHash: on)', function (done) {
      var auth0 = new Auth0({
        clientID:    'aaaabcdefgh',
        domain:      'aaa.auth0.com',
        callbackURL: 'https://myapp.com/callback',
        callbackOnLocationHash: true
      });

      auth0._redirect = function (the_url) {
        expect(the_url.split('?')[0])
          .to.contain('https://aaa.auth0.com/authorize');

        var parsed = {};
        the_url.split('?')[1].replace(
          new RegExp('([^?=&]+)(=([^&]*))?', 'g'),
          function($0, $1, $2, $3) { parsed[$1] = decodeURIComponent($3); }
        );

        expect(parsed.response_type).to.equal('token');
        expect(parsed.redirect_uri).to.equal('https://myapp.com/callback');
        expect(parsed.client_id).to.equal('aaaabcdefgh');
        expect(parsed.scope).to.equal('openid');
        done();
      };

      auth0.login({ connection: 'google-oauth2', nonce:'12345' });
    });

    it('should disable phonegap by default', function () {
      var auth0 = new Auth0({
        clientID:    'aaaabcdefgh',
        callbackURL: 'https://myapp.com/callback',
        domain:      'aaa.auth0.com'
      });

      expect(auth0._useCordovaSocialPlugins).not.to.be.ok();
    });

    it('should redirect to /authorize with values set on login (overriding constructor)', function (done) {
      var auth0 = new Auth0({
        clientID:    'aaaabcdefgh',
        domain:      'aaa.auth0.com',
        callbackURL: 'http://fakeCallback.com',
        callbackOnLocationHash: false
      });

      auth0._redirect = function (the_url) {
        expect(the_url.split('?')[0])
          .to.contain('https://aaa.auth0.com/authorize');

        var parsed = {};
        the_url.split('?')[1].replace(
          new RegExp('([^?=&]+)(=([^&]*))?', 'g'),
          function($0, $1, $2, $3) { parsed[$1] = decodeURIComponent($3); }
        );

        expect(parsed.response_type).to.equal('token');
        expect(parsed.redirect_uri).to.equal('https://myapp.com/callback');
        expect(parsed.client_id).to.equal('aaaabcdefgh');
        expect(parsed.scope).to.equal('openid');
        done();
      };

      auth0.login({
        connection: 'google-oauth2',
        callbackOnLocationHash: true,
        callbackURL: 'https://myapp.com/callback',
        nonce:'12345'
      });
    });

    it('should redirect to /authorize with google (callbackOnLocationHash: off)', function (done) {
      var auth0 = new Auth0({
        clientID:     'aaaabcdefgh',
        callbackURL: 'https://myapp.com/callback',
        domain:       'aaa.auth0.com'
      });

      auth0._redirect = function (the_url) {
        expect(the_url.split('?')[0])
          .to.contain('https://aaa.auth0.com/authorize');

        var parsed = {};
        the_url.split('?')[1].replace(
          new RegExp('([^?=&]+)(=([^&]*))?', 'g'),
          function($0, $1, $2, $3) { parsed[$1] = decodeURIComponent($3); }
        );

        expect(parsed.response_type).to.equal('code');
        expect(parsed.redirect_uri).to.equal('https://myapp.com/callback');
        expect(parsed.client_id).to.equal('aaaabcdefgh');
        expect(parsed.scope).to.equal('openid');
        done();
      };

      auth0.login({
        connection: 'google-oauth2',
        nonce:'12345'
      });
    });

    it('contains client version information within authorize redirection url', function (done) {
      var auth0 = new Auth0({
        clientID:     'aaaabcdefgh',
        callbackURL: 'https://myapp.com/callback',
        domain:       'aaa.auth0.com'
      });

      auth0._redirect = function (url) {
        expect(url).to.contain('auth0Client=');
        done();
      };

      auth0.login({
        connection: 'google-oauth2',
        nonce:'12345'
      });
    })
  });

  describe('parseHash', function () {
    context('response_type=token + scope=openid offline_access + state', function() {
      before(function() {
        var hash = '#access_token=AdyWpLVbQi2GA0fy&refresh_token=8m8M2Dk7BWsmpyumpguR4ZVKpZDy6bhFrZacaq6kmEVtt&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2duYW5kcmV0dGEuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3MmNhOWYzMGRjMjhkOGQ3YmY3MzRhYSIsImF1ZCI6Iks2bkFFT2dFZVN3b2dDR3Y2TjZtOXdOZlFodmJGQW0wIiwiZXhwIjoxNDcwOTYzOTQyLCJpYXQiOjE0NzA5Mjc5NDJ9.KcxIWhnTHeL_kNwUq74ef3REOCFDxiOH_NiNMqNNZks&token_type=Bearer&state=hello';
        this.parsedHash = new Auth0({
          clientID: 'K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0',
          domain: 'gnandretta.auth0.com'
        }).parseHash(hash);
      });

      it('copies the access_token', function() {
        expect(this.parsedHash.accessToken).to.be('AdyWpLVbQi2GA0fy');
      });

      it('copies the id_token', function() {
        expect(this.parsedHash.idToken).to.be('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2duYW5kcmV0dGEuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3MmNhOWYzMGRjMjhkOGQ3YmY3MzRhYSIsImF1ZCI6Iks2bkFFT2dFZVN3b2dDR3Y2TjZtOXdOZlFodmJGQW0wIiwiZXhwIjoxNDcwOTYzOTQyLCJpYXQiOjE0NzA5Mjc5NDJ9.KcxIWhnTHeL_kNwUq74ef3REOCFDxiOH_NiNMqNNZks');
      });

      it('decodes the id_token', function() {
        expect(this.parsedHash.idTokenPayload.aud).to.be('K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0');
      });

      it('copies the refresh_token', function() {
        expect(this.parsedHash.refreshToken).to.be('8m8M2Dk7BWsmpyumpguR4ZVKpZDy6bhFrZacaq6kmEVtt');
      });

      it('copies the sate', function() {
        expect(this.parsedHash.state).to.be('hello');
      });

      it('doesn\'t have an error', function() {
        expect(this.parsedHash.error).to.be(undefined);
      });
    });

    context('response_type=token + scope=openid offline_access', function() {
      before(function() {
        var hash = '#access_token=meZc5MnnwwL0LyZO&refresh_token=Xqs1iD2F4IxL3C9WaOaDllZd5ns411967JPPZubuf8K8H&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2duYW5kcmV0dGEuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3MmNhOWYzMGRjMjhkOGQ3YmY3MzRhYSIsImF1ZCI6Iks2bkFFT2dFZVN3b2dDR3Y2TjZtOXdOZlFodmJGQW0wIiwiZXhwIjoxNDcwOTY0MDU2LCJpYXQiOjE0NzA5MjgwNTZ9.zM12OViHQQkSogcW_-CXat_2cOMIHy0JShbbNIxKRkM&token_type=Bearer';
        this.parsedHash = new Auth0({
          clientID: 'K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0',
          domain: 'gnandretta.auth0.com'
        }).parseHash(hash);
      });

      it('copies the access_token', function() {
        expect(this.parsedHash.accessToken).to.be('meZc5MnnwwL0LyZO');
      });

      it('copies the id_token', function() {
        expect(this.parsedHash.idToken).to.be('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2duYW5kcmV0dGEuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3MmNhOWYzMGRjMjhkOGQ3YmY3MzRhYSIsImF1ZCI6Iks2bkFFT2dFZVN3b2dDR3Y2TjZtOXdOZlFodmJGQW0wIiwiZXhwIjoxNDcwOTY0MDU2LCJpYXQiOjE0NzA5MjgwNTZ9.zM12OViHQQkSogcW_-CXat_2cOMIHy0JShbbNIxKRkM');
      });

      it('decodes the id_token', function() {
        expect(this.parsedHash.idTokenPayload.aud).to.be('K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0');
      });

      it('copies the refresh_token', function() {
        expect(this.parsedHash.refreshToken).to.be('Xqs1iD2F4IxL3C9WaOaDllZd5ns411967JPPZubuf8K8H');
      });

      it('doesn\'t include sate', function() {
        expect(this.parsedHash.state).to.be(undefined);
      });

      it('doesn\'t have an error', function() {
        expect(this.parsedHash.error).to.be(undefined);
      });
    });

    context('response_type=token + scope=openid + state', function() {
      before(function() {
        var hash = '#access_token=I6MceMUVoKxyWhJN&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2duYW5kcmV0dGEuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3MmNhOWYzMGRjMjhkOGQ3YmY3MzRhYSIsImF1ZCI6Iks2bkFFT2dFZVN3b2dDR3Y2TjZtOXdOZlFodmJGQW0wIiwiZXhwIjoxNDcwOTY0MTIwLCJpYXQiOjE0NzA5MjgxMjB9.tkUFnd9oi5AAo9yraQwkrn5Z1D-G4HX3wzQ1yWSM81g&token_type=Bearer&state=hello';
        this.parsedHash = new Auth0({
          clientID: 'K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0',
          domain: 'gnandretta.auth0.com'
        }).parseHash(hash);
      });

      it('copies the access_token', function() {
        expect(this.parsedHash.accessToken).to.be('I6MceMUVoKxyWhJN');
      });

      it('copies the id_token', function() {
        expect(this.parsedHash.idToken).to.be('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2duYW5kcmV0dGEuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3MmNhOWYzMGRjMjhkOGQ3YmY3MzRhYSIsImF1ZCI6Iks2bkFFT2dFZVN3b2dDR3Y2TjZtOXdOZlFodmJGQW0wIiwiZXhwIjoxNDcwOTY0MTIwLCJpYXQiOjE0NzA5MjgxMjB9.tkUFnd9oi5AAo9yraQwkrn5Z1D-G4HX3wzQ1yWSM81g');
      });

      it('decodes the id_token', function() {
        expect(this.parsedHash.idTokenPayload.aud).to.be('K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0');
      });

      it('doesn\'t include a refresh_token', function() {
        expect(this.parsedHash.refreshToken).to.be(undefined);
      });

      it('copies the sate', function() {
        expect(this.parsedHash.state).to.be('hello');
      });

      it('doesn\'t have an error', function() {
        expect(this.parsedHash.error).to.be(undefined);
      });
    });

    context('response_type=token + scope=openid', function() {
      before(function() {
        var hash = '#access_token=kb1t8RwAmevjnV2F&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2duYW5kcmV0dGEuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3MmNhOWYzMGRjMjhkOGQ3YmY3MzRhYSIsImF1ZCI6Iks2bkFFT2dFZVN3b2dDR3Y2TjZtOXdOZlFodmJGQW0wIiwiZXhwIjoxNDcwOTY0MTY5LCJpYXQiOjE0NzA5MjgxNjl9.KC6stFcLPFnEPMmRfRVoM3Fe2WMNLBn68Aa63kyZ5gI&token_type=Bearer';
        this.parsedHash = new Auth0({
          clientID: 'K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0',
          domain: 'gnandretta.auth0.com'
        }).parseHash(hash);
      });

      it('copies the access_token', function() {
        expect(this.parsedHash.accessToken).to.be('kb1t8RwAmevjnV2F');
      });

      it('copies the id_token', function() {
        expect(this.parsedHash.idToken).to.be('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2duYW5kcmV0dGEuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3MmNhOWYzMGRjMjhkOGQ3YmY3MzRhYSIsImF1ZCI6Iks2bkFFT2dFZVN3b2dDR3Y2TjZtOXdOZlFodmJGQW0wIiwiZXhwIjoxNDcwOTY0MTY5LCJpYXQiOjE0NzA5MjgxNjl9.KC6stFcLPFnEPMmRfRVoM3Fe2WMNLBn68Aa63kyZ5gI');
      });

      it('decodes the id_token', function() {
        expect(this.parsedHash.idTokenPayload.aud).to.be('K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0');
      });

      it('doesn\'t include a refresh_token', function() {
        expect(this.parsedHash.refreshToken).to.be(undefined);
      });

      it('doesn\'t include state', function() {
        expect(this.parsedHash.state).to.be(undefined);
      });

      it('doesn\'t have an error', function() {
        expect(this.parsedHash.error).to.be(undefined);
      });
    });

    context('response_type=token + state', function() {
      before(function() {
        var hash = '#access_token=thu2az95NNmhCfeZ&token_type=Bearer&state=hello';
        this.parsedHash = new Auth0({
          clientID: 'K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0',
          domain: 'gnandretta.auth0.com'
        }).parseHash(hash);
      });

      it('copies the access_token', function() {
        expect(this.parsedHash.accessToken).to.be('thu2az95NNmhCfeZ');
      });

      it('doesn\'t include an id_token', function() {
        expect(this.parsedHash.idToken).to.be(undefined);
      });

      it('doesn\'t decode an id_token', function() {
        expect(this.parsedHash.idTokenPayload).to.be(undefined);
      });

      it('doesn\'t include a refresh_token', function() {
        expect(this.parsedHash.refreshToken).to.be(undefined);
      });

      it('copies the state', function() {
        expect(this.parsedHash.state).to.be('hello');
      });

      it('doesn\'t have an error', function() {
        expect(this.parsedHash.error).to.be(undefined);
      });
    });

    context('response_type=token', function() {
      before(function() {
        var hash = '#access_token=cpiUDP1E8zX1Dfyw&token_type=Bearer';
        this.parsedHash = new Auth0({
          clientID: 'K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0',
          domain: 'gnandretta.auth0.com'
        }).parseHash(hash);
      });

      it('copies the access_token', function() {
        expect(this.parsedHash.accessToken).to.be('cpiUDP1E8zX1Dfyw');
      });

      it('doesn\'t include an id_token', function() {
        expect(this.parsedHash.idToken).to.be(undefined);
      });

      it('doesn\'t decode an id_token', function() {
        expect(this.parsedHash.idTokenPayload).to.be(undefined);
      });

      it('doesn\'t include a refresh_token', function() {
        expect(this.parsedHash.refreshToken).to.be(undefined);
      });

      it('doesn\'t include state', function() {
        expect(this.parsedHash.state).to.be(undefined);
      });

      it('doesn\'t have an error', function() {
        expect(this.parsedHash.error).to.be(undefined);
      });
    });

    context('response_type=id_token + scope=openid + state', function() {
      before(function() {
        var hash = '#id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2duYW5kcmV0dGEuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3MmNhOWYzMGRjMjhkOGQ3YmY3MzRhYSIsImF1ZCI6Iks2bkFFT2dFZVN3b2dDR3Y2TjZtOXdOZlFodmJGQW0wIiwiZXhwIjoxNDcwOTY0NzE0LCJpYXQiOjE0NzA5Mjg3MTR9.mQ-OLmCuoveYeH3PhDBXYJOwq8sSfdOieXzUoZqZT2k&state=hello';
        this.parsedHash = new Auth0({
          clientID: 'K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0',
          domain: 'gnandretta.auth0.com'
        }).parseHash(hash);
      });

      it('doesn\'t include an access_token', function() {
        expect(this.parsedHash.accessToken).to.be(undefined);
      });

      it('copies the id_token', function() {
        expect(this.parsedHash.idToken).to.be('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2duYW5kcmV0dGEuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3MmNhOWYzMGRjMjhkOGQ3YmY3MzRhYSIsImF1ZCI6Iks2bkFFT2dFZVN3b2dDR3Y2TjZtOXdOZlFodmJGQW0wIiwiZXhwIjoxNDcwOTY0NzE0LCJpYXQiOjE0NzA5Mjg3MTR9.mQ-OLmCuoveYeH3PhDBXYJOwq8sSfdOieXzUoZqZT2k');
      });

      it('decodes the id_token', function() {
        expect(this.parsedHash.idTokenPayload.aud).to.be('K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0');
      });

      it('doesn\'t include a refresh_token', function() {
        expect(this.parsedHash.refreshToken).to.be(undefined);
      });

      it('copies the state', function() {
        expect(this.parsedHash.state).to.be('hello');
      });

      it('doesn\'t have an error', function() {
        expect(this.parsedHash.error).to.be(undefined);
      });
    });

    context('response_type=id_token', function() {
      before(function() {
        var hash = '#id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2duYW5kcmV0dGEuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3MmNhOWYzMGRjMjhkOGQ3YmY3MzRhYSIsImF1ZCI6Iks2bkFFT2dFZVN3b2dDR3Y2TjZtOXdOZlFodmJGQW0wIiwiZXhwIjoxNDcwOTY0NzU0LCJpYXQiOjE0NzA5Mjg3NTR9.gsjJQyYJzIShiBcI02i4fsGk68nbSCOLojReI2czI7Y';
        this.parsedHash = new Auth0({
          clientID: 'K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0',
          domain: 'gnandretta.auth0.com'
        }).parseHash(hash);
      });

      it('doesn\'t include an access_token', function() {
        expect(this.parsedHash.accessToken).to.be(undefined);
      });

      it('copies the id_token', function() {
        expect(this.parsedHash.idToken).to.be('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2duYW5kcmV0dGEuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDU3MmNhOWYzMGRjMjhkOGQ3YmY3MzRhYSIsImF1ZCI6Iks2bkFFT2dFZVN3b2dDR3Y2TjZtOXdOZlFodmJGQW0wIiwiZXhwIjoxNDcwOTY0NzU0LCJpYXQiOjE0NzA5Mjg3NTR9.gsjJQyYJzIShiBcI02i4fsGk68nbSCOLojReI2czI7Y');
      });

      it('decodes the id_token', function() {
        expect(this.parsedHash.idTokenPayload.aud).to.be('K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0');
      });

      it('doesn\'t include a refresh_token', function() {
        expect(this.parsedHash.refreshToken).to.be(undefined);
      });

      it('doesn\'t include state', function() {
        expect(this.parsedHash.state).to.be(undefined);
      });

      it('doesn\'t have an error', function() {
        expect(this.parsedHash.error).to.be(undefined);
      });
    });

    context("error + state", function() {
      before(function() {
        var hash = '#error=unauthorized&error_description=My%20custom%20error%20message&state=hello';
        this.parsedHash = new Auth0({
          clientID: 'K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0',
          domain: 'gnandretta.auth0.com'
        }).parseHash(hash);
      });

      it('copies the error', function() {
        expect(this.parsedHash.error).to.be('unauthorized');
      });

      it('copies the error message', function() {
        expect(this.parsedHash.error_description).to.be('My custom error message');
      });

      it('copies the state', function() {
        expect(this.parsedHash.state).to.be('hello');
      });
    });

    context("error", function() {
      before(function() {
        var hash = '#error=unauthorized&error_description=My%20custom%20error%20message';
        this.parsedHash = new Auth0({
          clientID: 'K6nAEOgEeSwogCGv6N6m9wNfQhvbFAm0',
          domain: 'gnandretta.auth0.com'
        }).parseHash(hash);
      });

      it('copies the error', function() {
        expect(this.parsedHash.error).to.be('unauthorized');
      });

      it('copies the error message', function() {
        expect(this.parsedHash.error_description).to.be('My custom error message');
      });

      it('doesn\'t include state', function() {
        expect(this.parsedHash.state).to.be(undefined);
      });
    });

    it('should be able to parse the profile (if it starts with a slash)', function () {
      var hash = '#/access_token=jFxsZUQTJXXwcwIm&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2xvZ2luLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExODMwNDIzMTY0MDMwMTY4NTU3OSIsImF1ZCI6IjBIUDcxR1NkNlB1b1JZSjNEWEtkaVhDVVVkR21CYnVwIiwiZXhwIjoxMzgwMjU4NzU4LCJpYXQiOjEzODAyMjI3NTgsImNsaWVudElEIjoiMEhQNzFHU2Q2UHVvUllKM0RYS2RpWENVVWRHbUJidXAiLCJlbWFpbCI6Impvc2Uucm9tYW5pZWxsb0BxcmFmdGxhYnMuY29tIiwiZmFtaWx5X25hbWUiOiJSb21hbmllbGxvIiwiZ2VuZGVyIjoibWFsZSIsImdpdmVuX25hbWUiOiJKb3NlIiwiaWRlbnRpdGllcyI6W3siYWNjZXNzX3Rva2VuIjoieWEyOS5BSEVTNlpUSllmQnN3a1NFbUU2YTQ2SlpHYVgxV1Jqc2ZrUzd5Vm81RXNPdktKWVhnenpEZl9ZUiIsInByb3ZpZGVyIjoiZ29vZ2xlLW9hdXRoMiIsInVzZXJfaWQiOiIxMTgzMDQyMzE2NDAzMDE2ODU1NzkiLCJjb25uZWN0aW9uIjoiZ29vZ2xlLW9hdXRoMiIsImlzU29jaWFsIjp0cnVlfV0sImxvY2FsZSI6ImVuIiwibmFtZSI6Ikpvc2UgUm9tYW5pZWxsbyIsIm5pY2tuYW1lIjoiam9zZS5yb21hbmllbGxvIiwicGljdHVyZSI6Imh0dHBzOi8vbGg2Lmdvb2dsZXVzZXJjb250ZW50LmNvbS8tcF81dUwxTDFkdkUvQUFBQUFBQUFBQUkvQUFBQUFBQUFBQlEvaVBIRUQ0ajlxblkvcGhvdG8uanBnIiwidXNlcl9pZCI6Imdvb2dsZS1vYXV0aDJ8MTE4MzA0MjMxNjQwMzAxNjg1NTc5In0.Qrhrkp7hCYFyN_Ax9yVPKztuJNFHjnGbyUfLJsccLGU&token_type=bearer&state=Ttct3tBlHDhRnXCv';

      var auth0 = new Auth0({
        clientID:     '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
        callbackURL:  'https://myapp.com/callback',
        domain:       'login.auth0.com'
      });

      var result = auth0.parseHash(hash);
      expect(result.idTokenPayload.name).to.eql('Jose Romaniello');
      expect(result.accessToken).to.eql('jFxsZUQTJXXwcwIm');
      expect(result.state).to.eql('Ttct3tBlHDhRnXCv');

    });

    it('should return error if iss is invalid', function () {
      var hash = '#access_token=jFxsZUQTJXXwcwIm&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2xvZ2luLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExODMwNDIzMTY0MDMwMTY4NTU3OSIsImF1ZCI6IjBIUDcxR1NkNlB1b1JZSjNEWEtkaVhDVVVkR21CYnVwIiwiZXhwIjoxMzgwMjU4NzU4LCJpYXQiOjEzODAyMjI3NTgsImNsaWVudElEIjoiMEhQNzFHU2Q2UHVvUllKM0RYS2RpWENVVWRHbUJidXAiLCJlbWFpbCI6Impvc2Uucm9tYW5pZWxsb0BxcmFmdGxhYnMuY29tIiwiZmFtaWx5X25hbWUiOiJSb21hbmllbGxvIiwiZ2VuZGVyIjoibWFsZSIsImdpdmVuX25hbWUiOiJKb3NlIiwiaWRlbnRpdGllcyI6W3siYWNjZXNzX3Rva2VuIjoieWEyOS5BSEVTNlpUSllmQnN3a1NFbUU2YTQ2SlpHYVgxV1Jqc2ZrUzd5Vm81RXNPdktKWVhnenpEZl9ZUiIsInByb3ZpZGVyIjoiZ29vZ2xlLW9hdXRoMiIsInVzZXJfaWQiOiIxMTgzMDQyMzE2NDAzMDE2ODU1NzkiLCJjb25uZWN0aW9uIjoiZ29vZ2xlLW9hdXRoMiIsImlzU29jaWFsIjp0cnVlfV0sImxvY2FsZSI6ImVuIiwibmFtZSI6Ikpvc2UgUm9tYW5pZWxsbyIsIm5pY2tuYW1lIjoiam9zZS5yb21hbmllbGxvIiwicGljdHVyZSI6Imh0dHBzOi8vbGg2Lmdvb2dsZXVzZXJjb250ZW50LmNvbS8tcF81dUwxTDFkdkUvQUFBQUFBQUFBQUkvQUFBQUFBQUFBQlEvaVBIRUQ0ajlxblkvcGhvdG8uanBnIiwidXNlcl9pZCI6Imdvb2dsZS1vYXV0aDJ8MTE4MzA0MjMxNjQwMzAxNjg1NTc5In0.Qrhrkp7hCYFyN_Ax9yVPKztuJNFHjnGbyUfLJsccLGU&token_type=bearer&state=Ttct3tBlHDhRnXCv';

      var auth0 = new Auth0({
        clientID:     '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
        callbackURL:  'https://myapp.com/callback',
        domain:       'wrong.auth0.com'
      });

      var result = auth0.parseHash(hash);
      expect(result.error).to.be.equal('invalid_token');
      expect(result.error_description).to.be.equal('The domain configured (https://wrong.auth0.com/) does not match with the domain set in the token (https://login.auth0.com/).');

    });

    it('should be able to parse an aud array', function () {
      var hash = '#access_token=jFxsZUQTJXXwcwIm&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2xvZ2luLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExODMwNDIzMTY0MDMwMTY4NTU3OSIsImF1ZCI6WyIwSFA3MUdTZDZQdW9SWUozRFhLZGlYQ1VVZEdtQmJ1cCIsIjFKUTgyR1NkNlB1b1JZSjNEWEtkaVhDVVVkR21CYnVwIl0sImV4cCI6MTM4MDI1ODc1OCwiaWF0IjoxMzgwMjIyNzU4LCJjbGllbnRJRCI6IjBIUDcxR1NkNlB1b1JZSjNEWEtkaVhDVVVkR21CYnVwIiwiZW1haWwiOiJqb3NlLnJvbWFuaWVsbG9AcXJhZnRsYWJzLmNvbSIsImZhbWlseV9uYW1lIjoiUm9tYW5pZWxsbyIsImdlbmRlciI6Im1hbGUiLCJnaXZlbl9uYW1lIjoiSm9zZSIsImlkZW50aXRpZXMiOlt7ImFjY2Vzc190b2tlbiI6InlhMjkuQUhFUzZaVEpZZkJzd2tTRW1FNmE0NkpaR2FYMVdSanNma1M3eVZvNUVzT3ZLSllYZ3p6RGZfWVIiLCJwcm92aWRlciI6Imdvb2dsZS1vYXV0aDIiLCJ1c2VyX2lkIjoiMTE4MzA0MjMxNjQwMzAxNjg1NTc5IiwiY29ubmVjdGlvbiI6Imdvb2dsZS1vYXV0aDIiLCJpc1NvY2lhbCI6dHJ1ZX1dLCJsb2NhbGUiOiJlbiIsIm5hbWUiOiJKb3NlIFJvbWFuaWVsbG8iLCJuaWNrbmFtZSI6Impvc2Uucm9tYW5pZWxsbyIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLXBfNXVMMUwxZHZFL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUJRL2lQSEVENGo5cW5ZL3Bob3RvLmpwZyIsInVzZXJfaWQiOiJnb29nbGUtb2F1dGgyfDExODMwNDIzMTY0MDMwMTY4NTU3OSJ9.9j4aVz2Kx5pdY8dxdu59tNe8xxNAXa4b2_IPgpCW0wA&token_type=bearer&state=Ttct3tBlHDhRnXCv';

      var auth0 = new Auth0({
        clientID:     '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
        callbackURL:  'https://myapp.com/callback',
        domain:       'login.auth0.com'
      });

      var result = auth0.parseHash(hash);
      expect(result.error).to.not.be.ok();
      expect(result.error_description).to.not.be.ok();
    });

    it('should return an error if aud string is invalid', function () {
      var hash = '#access_token=jFxsZUQTJXXwcwIm&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2xvZ2luLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExODMwNDIzMTY0MDMwMTY4NTU3OSIsImF1ZCI6IjBIUDcxR1NkNlB1b1JZSjNEWEtkaVhDVVVkR21CYnVwIiwiZXhwIjoxMzgwMjU4NzU4LCJpYXQiOjEzODAyMjI3NTgsImNsaWVudElEIjoiMEhQNzFHU2Q2UHVvUllKM0RYS2RpWENVVWRHbUJidXAiLCJlbWFpbCI6Impvc2Uucm9tYW5pZWxsb0BxcmFmdGxhYnMuY29tIiwiZmFtaWx5X25hbWUiOiJSb21hbmllbGxvIiwiZ2VuZGVyIjoibWFsZSIsImdpdmVuX25hbWUiOiJKb3NlIiwiaWRlbnRpdGllcyI6W3siYWNjZXNzX3Rva2VuIjoieWEyOS5BSEVTNlpUSllmQnN3a1NFbUU2YTQ2SlpHYVgxV1Jqc2ZrUzd5Vm81RXNPdktKWVhnenpEZl9ZUiIsInByb3ZpZGVyIjoiZ29vZ2xlLW9hdXRoMiIsInVzZXJfaWQiOiIxMTgzMDQyMzE2NDAzMDE2ODU1NzkiLCJjb25uZWN0aW9uIjoiZ29vZ2xlLW9hdXRoMiIsImlzU29jaWFsIjp0cnVlfV0sImxvY2FsZSI6ImVuIiwibmFtZSI6Ikpvc2UgUm9tYW5pZWxsbyIsIm5pY2tuYW1lIjoiam9zZS5yb21hbmllbGxvIiwicGljdHVyZSI6Imh0dHBzOi8vbGg2Lmdvb2dsZXVzZXJjb250ZW50LmNvbS8tcF81dUwxTDFkdkUvQUFBQUFBQUFBQUkvQUFBQUFBQUFBQlEvaVBIRUQ0ajlxblkvcGhvdG8uanBnIiwidXNlcl9pZCI6Imdvb2dsZS1vYXV0aDJ8MTE4MzA0MjMxNjQwMzAxNjg1NTc5In0.Qrhrkp7hCYFyN_Ax9yVPKztuJNFHjnGbyUfLJsccLGU&token_type=bearer&state=Ttct3tBlHDhRnXCv';

      var auth0 = new Auth0({
        clientID:     'wrong',
        callbackURL:  'https://myapp.com/callback',
        domain:       'login.auth0.com'
      });

      var result = auth0.parseHash(hash);
      expect(result.error).to.be.equal('invalid_token');
      expect(result.error_description).to.be.equal('The clientID configured (wrong) does not match with the clientID set in the token (0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup).');
    });

    it('should return an error if aud array is invalid', function () {
      var hash = '#access_token=jFxsZUQTJXXwcwIm&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2xvZ2luLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExODMwNDIzMTY0MDMwMTY4NTU3OSIsImF1ZCI6WyIwSFA3MUdTZDZQdW9SWUozRFhLZGlYQ1VVZEdtQmJ1cCIsIjFKUTgyR1NkNlB1b1JZSjNEWEtkaVhDVVVkR21CYnVwIl0sImV4cCI6MTM4MDI1ODc1OCwiaWF0IjoxMzgwMjIyNzU4LCJjbGllbnRJRCI6IjBIUDcxR1NkNlB1b1JZSjNEWEtkaVhDVVVkR21CYnVwIiwiZW1haWwiOiJqb3NlLnJvbWFuaWVsbG9AcXJhZnRsYWJzLmNvbSIsImZhbWlseV9uYW1lIjoiUm9tYW5pZWxsbyIsImdlbmRlciI6Im1hbGUiLCJnaXZlbl9uYW1lIjoiSm9zZSIsImlkZW50aXRpZXMiOlt7ImFjY2Vzc190b2tlbiI6InlhMjkuQUhFUzZaVEpZZkJzd2tTRW1FNmE0NkpaR2FYMVdSanNma1M3eVZvNUVzT3ZLSllYZ3p6RGZfWVIiLCJwcm92aWRlciI6Imdvb2dsZS1vYXV0aDIiLCJ1c2VyX2lkIjoiMTE4MzA0MjMxNjQwMzAxNjg1NTc5IiwiY29ubmVjdGlvbiI6Imdvb2dsZS1vYXV0aDIiLCJpc1NvY2lhbCI6dHJ1ZX1dLCJsb2NhbGUiOiJlbiIsIm5hbWUiOiJKb3NlIFJvbWFuaWVsbG8iLCJuaWNrbmFtZSI6Impvc2Uucm9tYW5pZWxsbyIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLXBfNXVMMUwxZHZFL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUJRL2lQSEVENGo5cW5ZL3Bob3RvLmpwZyIsInVzZXJfaWQiOiJnb29nbGUtb2F1dGgyfDExODMwNDIzMTY0MDMwMTY4NTU3OSJ9.9j4aVz2Kx5pdY8dxdu59tNe8xxNAXa4b2_IPgpCW0wA&token_type=bearer&state=Ttct3tBlHDhRnXCv';

      var auth0 = new Auth0({
        clientID:     'wrong',
        callbackURL:  'https://myapp.com/callback',
        domain:       'login.auth0.com'
      });

      var result = auth0.parseHash(hash);
      expect(result.error).to.be.equal('invalid_token');
      expect(result.error_description).to.be.equal('The clientID configured (wrong) does not match with the clientID set in the token (0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup, 1JQ82GSd6PuoRYJ3DXKdiXCUUdGmBbup).');
    });

    it('should be able to parse an error (if it starts with a slash)', function () {
      var hash = '#/error=invalid_grant&error_description=this%20is%20a%20cool%20error%20description';

      var auth0 = new Auth0({
        clientID:     'aaaabcdefgh',
        callbackURL:  'https://myapp.com/callback',
        domain:       'aaa.auth0.com'
      });

      function neverCall() {
        // should never call success as it fails
        expect(false).to.be.equal(true);
      }

      var result = auth0.parseHash(hash);
      expect(result.error).to.be.equal('invalid_grant');
      expect(result.error_description).to.be.equal('this is a cool error description');

    });


    it('should return null if the hash URL doesn\'t contain access_token/error', function () {
      var hash = '#myfooobarrr=123';

      var auth0 = new Auth0({
        clientID:     'aaaabcdefgh',
        callbackURL:  'https://myapp.com/callback',
        domain:       'aaa.auth0.com'
      });

      expect(auth0.parseHash(hash)).to.eql(null);

    });

  });

  describe('getUserInfo', function () {
    describe('when called with an object', function () {
      it('should call the callback with error', function (done) {
        var auth0 = new Auth0({
          clientID:     'aaaabcdefgh',
          callbackURL:  'https://myapp.com/callback',
          domain:       'aaa.auth0.com'
        });

        auth0.getUserInfo({foo: 'bar'}, function (err) {
          expect(err.message).to.eql('Invalid token');
          done();
        });
      });
    });

    describe('when called with an null', function () {
      it('should call the callback with error', function (done) {
        var auth0 = Auth0({
          clientID:     'aaaabcdefgh',
          callbackURL:  'https://myapp.com/callback',
          domain:       'aaa.auth0.com'
        });

        auth0.getUserInfo(null, function (err) {
          expect(err.message).to.eql('Invalid token');
          done();
        });
      });
    });

    describe('from token', function () {

      it('should be able to fetch the profile from auth0', function (done) {
        var auth0 = Auth0({
          clientID:     '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
          callbackURL:  'https://myapp.com/callback',
          domain:       'mdocs.auth0.com'
        });

        var parseHashResult = {
          access_token: 'EwmMATEAtRwfu2bJ'
        };

        auth0.getUserInfo = function (access_token, callback) {
          expect(access_token).to.eql(parseHashResult.access_token);
          done();
        };

        auth0.getUserInfo(parseHashResult.access_token, function () {});
      });

    });
  });

  it('should fail when an invalid token is sent to the server', function (done) {

    var auth0 = Auth0({
      clientID:     '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
      callbackURL:  'https://myapp.com/callback',
      domain:       'mdocs.auth0.com'
    });

    auth0.getUserInfo("invalid token", function(err, profile) {
      expect(profile).to.be(undefined);
      expect(err).to.have.property('error');
      expect(err).to.have.property('error_description');
      done();
    });

  });

  describe('getSSOData', function () {
    it('should return SSO data', function (done) {
      var auth0 = new Auth0({
        clientID:     'aaaabcdefgh',
        callbackURL:  'https://myapp.com/callback',
        domain:       'aaa.auth0.com'
      });

      auth0.getSSOData(function (err, ssoData) {
        expect(ssoData.sso).to.exist;
        done();
      });
    });
  });

  describe('getConnections', function () {
    it('should return configured connections', function (done) {
      var auth0 = new Auth0({
        domain:      'mdocs.auth0.com',
        callbackURL: 'http://localhost:3000/',
        clientID:    'ptR6URmXef0OfBDHK0aCIy7iPKpdCG4t'
      });

      auth0.getConnections(function (err, conns) {
        expect(conns.length).to.be.above(0);
        expect(conns[0].name).to.eql('Apprenda.com');
        expect(conns[0].strategy).to.eql('adfs');
        expect(conns[0].status).to.eql(true);
        expect(conns[0].domain).to.eql('Apprenda.com');
        done();
      });
    });
  });

  describe.skip('getDelegationToken', function () {
    var auth0 = Auth0({
      domain:      'samples.auth0.com',
      callbackURL: 'http://localhost:3000/',
      clientID:    'BUIJSW9x60sIHBw8Kd9EmCbj8eDIFxDC',
      // forceJSONP:  ('XDomainRequest' in window) //force JSONP in IE8 and IE9
    });

    it('should refresh the token', function (done) {
      var id_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3NhbXBsZXMuYXV0aDAuY29tLyIsInN1YiI6ImdpdGh1Ynw3MjM3MjMiLCJhdWQiOiJCVUlKU1c5eDYwc0lIQnc4S2Q5RW1DYmo4ZURJRnhEQyIsImlhdCI6MTM5MDUxMjU0OH0.Rd3wjlFhRk6CBzsB371V5x41HITzx5880ezK9rwYzuM';

      auth0.getDelegationToken({
        id_token: id_token,
        api: 'auth0'
      }, function (err, delegationResult) {
        if (err) {
          throw new Error(err.message);
        }
        expect(delegationResult.id_token).to.exist;
        expect(delegationResult.token_type).to.eql('Bearer');
        expect(delegationResult.expires_in).to.eql(36000);
        done();
      });
    });

    it('should refresh the token when calling refresh as well', function (done) {
      var id_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3NhbXBsZXMuYXV0aDAuY29tLyIsInN1YiI6ImdpdGh1Ynw3MjM3MjMiLCJhdWQiOiJCVUlKU1c5eDYwc0lIQnc4S2Q5RW1DYmo4ZURJRnhEQyIsImlhdCI6MTM5MDUxMjU0OH0.Rd3wjlFhRk6CBzsB371V5x41HITzx5880ezK9rwYzuM';

      auth0.renewIdToken(id_token, function (err, delegationResult) {
        expect(delegationResult.id_token).to.exist;
        expect(delegationResult.token_type).to.eql('Bearer');
        expect(delegationResult.expires_in).to.eql(36000);
        done();
      });
    });

    it('should throw error if no token is sent', function () {
      expect(function () {
        auth0.getDelegationToken(null, function(err, delegation) {});
      }).to.throwError(/You must send either an id_token or a refresh_token to get a delegation token./);
    });



    it('should return a Firebase token by default since it\'s active', function (done) {
      var id_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3NhbXBsZXMuYXV0aDAuY29tLyIsInN1YiI6ImdpdGh1Ynw3MjM3MjMiLCJhdWQiOiJCVUlKU1c5eDYwc0lIQnc4S2Q5RW1DYmo4ZURJRnhEQyIsImlhdCI6MTM5MDUxMjU0OH0.Rd3wjlFhRk6CBzsB371V5x41HITzx5880ezK9rwYzuM';

      auth0.getDelegationToken({
        id_token: id_token
      }, function (err, delegationResult) {
        expect(delegationResult.id_token).to.exist;
        expect(delegationResult.token_type).to.eql('Bearer');
        expect(delegationResult.expires_in).to.eql(36000);
        done();
      });
    });

    it('should return a Firebase token by default or when asked', function (done) {
      var id_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3NhbXBsZXMuYXV0aDAuY29tLyIsInN1YiI6ImdpdGh1Ynw3MjM3MjMiLCJhdWQiOiJCVUlKU1c5eDYwc0lIQnc4S2Q5RW1DYmo4ZURJRnhEQyIsImlhdCI6MTM5MDUxMjU0OH0.Rd3wjlFhRk6CBzsB371V5x41HITzx5880ezK9rwYzuM';

      auth0.getDelegationToken({
        id_token: id_token
      }, function (err, delegationResult) {
        auth0.getDelegationToken({
          id_token: id_token,
          api: 'firebase'
        }, function(err, delegationResult2) {
          expect(delegationResult2.id_token).to.exist;
          expect(delegationResult2.token_type).to.eql('Bearer');
          expect(delegationResult2.expires_in).to.eql(36000);
          done();
        });
      });
    });

  });

  describe('_buildAuthorizeQueryString', function () {
    it('should filter elements in blacklist', function () {
      var blacklist = ['hello', 'foo', 'bar'];

      var queryString = Auth0.prototype._buildAuthorizeQueryString([
        {hello: 'world', useful: 'info'},
        {foo: 'bar', baz: true},
        {bar: 9}
      ], blacklist);

      expect(queryString).to.equal('useful=info&baz=true');
    });

    it('should handle connection_scope array', function () {
      var connection_scope = ['grant1', 'grant2', 'grant3'];

      var queryString = Auth0.prototype._buildAuthorizeQueryString([
        { connection_scope: connection_scope }
      ], []);

      expect(queryString).to.equal('connection_scope=grant1%2Cgrant2%2Cgrant3');
    });

    it('should add offline mode', function () {
      var c = new Auth0({
        clientID: "1",
         domain: "example.auth0.com",
         sendSDKClientInfo: false
       });
      var queryString = c._buildAuthorizeQueryString([
        c._getMode(), { scope: 'openid offline_access'}
      ], []);
      expect(queryString).to.equal('scope=openid%20offline_access&response_type=code&device=Browser');
    });

    it('should handle connection_scope string', function () {
      var connection_scope = 'grant1,grant2,grant3';

      var queryString = Auth0.prototype._buildAuthorizeQueryString([
        { connection_scope: connection_scope }
      ], []);

      expect(queryString).to.equal('connection_scope=grant1%2Cgrant2%2Cgrant3');
    });
  });
});
