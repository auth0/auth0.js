var expect = require('expect.js');
var stub = require('sinon').stub;

var RequestMock = require('../mock/request-mock');

var request = require('superagent');

var RequestBuilder = require('../../src/helper/request-builder');
var Authentication = require('../../src/authentication');

var telemetryInfo = new RequestBuilder({}).getTelemetryData();

describe('auth0.authentication', function() {
  context('/oauth/ro', function() {
    before(function() {
      this.auth0 = new Authentication({
        domain: 'me.auth0.com',
        clientID: '...',
        redirectUri: 'http://page.com/callback',
        responseType: 'code'
      });
    });

    afterEach(function() {
      request.post.restore();
    });

    it('should call the ro endpoint with all the parameters', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/oauth/ro');
        return new RequestMock({
          body: {
            client_id: '...',
            grant_type: 'password',
            username: 'the username',
            password: 'the password',
            connection: 'the_connection',
            scope: 'openid'
          },
          headers: {
            'Content-Type': 'application/json',
            'Auth0-Client': telemetryInfo
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
      });

      this.auth0.loginWithResourceOwner(
        {
          username: 'the username',
          password: 'the password',
          connection: 'the_connection',
          scope: 'openid'
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

    it('should handle ro errors', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/oauth/ro');
        return new RequestMock({
          body: {
            client_id: '...',
            grant_type: 'password',
            username: 'the username',
            password: 'the password',
            connection: 'the_connection',
            scope: 'openid'
          },
          headers: {
            'Content-Type': 'application/json',
            'Auth0-Client': telemetryInfo
          },
          cb: function(cb) {
            cb({ error: 'unauthorized', error_description: 'invalid username' });
          }
        });
      });

      this.auth0.loginWithResourceOwner(
        {
          username: 'the username',
          password: 'the password',
          connection: 'the_connection',
          scope: 'openid'
        },
        function(err, data) {
          expect(data).to.be(undefined);
          expect(err).to.eql({
            original: {
              error: 'unauthorized',
              error_description: 'invalid username'
            },
            code: 'unauthorized',
            description: 'invalid username'
          });
          done();
        }
      );
    });

    it('should call the ro endpoint overriding the parameters', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/oauth/ro');
        return new RequestMock({
          body: {
            client_id: '...',
            grant_type: 'password',
            username: 'the username',
            password: 'the password',
            connection: 'the_connection',
            scope: 'openid'
          },
          headers: {
            'Content-Type': 'application/json',
            'Auth0-Client': telemetryInfo
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
      });

      this.auth0.loginWithResourceOwner(
        {
          username: 'the username',
          password: 'the password',
          connection: 'the_connection',
          scope: 'openid'
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

    it('should exclude parameters not in whitelist', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/oauth/ro');
        return new RequestMock({
          body: {
            client_id: '...',
            grant_type: 'password',
            username: 'the username',
            password: 'the password',
            connection: 'the_connection'
          },
          headers: {
            'Content-Type': 'application/json',
            'Auth0-Client': telemetryInfo
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
      });

      this.auth0.loginWithResourceOwner(
        {
          username: 'the username',
          password: 'the password',
          connection: 'the_connection',
          should_ignore: { invalid: 'invalid value' }
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
  });
});
