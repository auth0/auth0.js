var expect = require('expect.js');
var WebAuth = require('../../src/web-auth');

describe('auth0.WebAuth', function () {
  context('paseHash', function () {
    it('should parse a valid hash', function () {
      var webAuth = new WebAuth({
        domain: 'mdocs.auth0.com',
        redirect_uri: 'http://example.com/callback',
        client_id: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
        response_type: 'token'
      });

      var data = webAuth.parseHash('#access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL21kb2NzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw0QVpERjU2Nzg5IiwiYXVkIjoiMEhQNzFHU2Q2UHVvUllKM0RYS2RpWENVVWRHbUJidXAiLCJleHAiOjE0Nzg1NjIyNTMsImlhdCI6MTQ3ODUyNjI1M30.LELBxWWxcGdYTaE_gpSmlNSdcucqyrhuHQo-s7hTDBA&token_type=Bearer&state=theState&refresh_token=kajshdgfkasdjhgfas'); // eslint-disable-line

      expect(data).to.eql({
        accessToken: 'VjubIMBmpgQ2W2',
        idToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL21kb2NzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw0QVpERjU2Nzg5IiwiYXVkIjoiMEhQNzFHU2Q2UHVvUllKM0RYS2RpWENVVWRHbUJidXAiLCJleHAiOjE0Nzg1NjIyNTMsImlhdCI6MTQ3ODUyNjI1M30.LELBxWWxcGdYTaE_gpSmlNSdcucqyrhuHQo-s7hTDBA', // eslint-disable-line
        idTokenPayload: {
          aud: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
          exp: 1478562253,
          iat: 1478526253,
          iss: 'https://mdocs.auth0.com/',
          sub: 'auth0|4AZDF56789'
        },
        refreshToken: 'kajshdgfkasdjhgfas',
        state: 'theState'
      });
    });

    it('should fail with an invalid audience', function () {
      var webAuth = new WebAuth({
        domain: 'mdocs.auth0.com',
        redirect_uri: 'http://example.com/callback',
        client_id: '0HP71GSd6PuoRYJ3p',
        response_type: 'token'
      });

      var data = webAuth.parseHash('#access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL21kb2NzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw0QVpERjU2Nzg5IiwiYXVkIjoiMEhQNzFHU2Q2UHVvUllKM0RYS2RpWENVVWRHbUJidXAiLCJleHAiOjE0Nzg1NjIyNTMsImlhdCI6MTQ3ODUyNjI1M30.LELBxWWxcGdYTaE_gpSmlNSdcucqyrhuHQo-s7hTDBA&token_type=Bearer&state=theState&refresh_token=kajshdgfkasdjhgfas'); // eslint-disable-line

      expect(data).to.eql({
        error: 'invalid_token',
        error_description: 'The clientID configured (0HP71GSd6PuoRYJ3p) does not match with the clientID set in the token (0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup).' // eslint-disable-line
      });
    });

    it('should fail with an invalid issuer', function () {
      var webAuth = new WebAuth({
        domain: 'mdocs_2.auth0.com',
        redirect_uri: 'http://example.com/callback',
        client_id: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
        response_type: 'token'
      });

      var data = webAuth.parseHash('#access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL21kb2NzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw0QVpERjU2Nzg5IiwiYXVkIjoiMEhQNzFHU2Q2UHVvUllKM0RYS2RpWENVVWRHbUJidXAiLCJleHAiOjE0Nzg1NjIyNTMsImlhdCI6MTQ3ODUyNjI1M30.LELBxWWxcGdYTaE_gpSmlNSdcucqyrhuHQo-s7hTDBA&token_type=Bearer&state=theState&refresh_token=kajshdgfkasdjhgfas'); // eslint-disable-line

      expect(data).to.eql({
        error: 'invalid_token',
        error_description: 'The domain configured (https://mdocs_2.auth0.com/) does not match with the domain set in the token (https://mdocs.auth0.com/).' // eslint-disable-line
      });
    });


    it('should fail if there is no token', function () {
      var webAuth = new WebAuth({
        domain: 'mdocs_2.auth0.com',
        redirect_uri: 'http://example.com/callback',
        client_id: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
        response_type: 'token'
      });

      var data = webAuth.parseHash('#token_type=Bearer&state=theState'); // eslint-disable-line

      expect(data).to.be(null);
    });

    it('should parse an error response', function () {
      var webAuth = new WebAuth({
        domain: 'mdocs_2.auth0.com',
        redirect_uri: 'http://example.com/callback',
        client_id: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
        response_type: 'token'
      });

      var data = webAuth.parseHash('#error=the_error_code&error_description=the_error_description&state=some_state');

      expect(data).to.eql({
        error: 'the_error_code',
        error_description: 'the_error_description',
        state: 'some_state'
      });
    });
  });
});
