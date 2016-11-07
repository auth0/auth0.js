var expect = require('expect.js');
var stub = require('sinon').stub;
var request = require('superagent');

var RequestMock = require('../mock/request-mock');
var UsernamePassword = require('../../src/web-auth/username-password');
var WebAuth = require('../../src/web-auth');
var RequestBuilder = require('../../src/helper/request-builder');

var telemetryInfo = (new RequestBuilder({})).getTelemetryData();

describe('auth0.WebAuth.redirect', function () {
  context('login', function () {
    afterEach(function () {
      request.post.restore();
    });

    it('should authenticate the user, render the callback form and submit it', function (done) {
      stub(request, 'post', function (url) {
        expect(url).to.be('https://me.auth0.com/usernamepassword/login');
        return new RequestMock({
          body: {
            client_id: '0HP71GSd6PuoRY',
            connection: 'tests',
            password: '1234',
            redirect_uri: 'http://localhost:3000/example/',
            response_type: 'token',
            scope: 'openid',
            tenant: 'me',
            username: 'me@example.com'
          },
          headers: {
            'Content-Type': 'application/json',
            'Auth0-Client': telemetryInfo
          },
          cb: function (cb) {
            cb(null, {
              text: 'the_form_html'
            });
          }
        });
      });

      UsernamePassword.prototype.getWindowDocument = function () {
        return {
          createElement: function () {
            return {}
          },
          body: {
            appendChild: function (element) {
              expect(element.innerHTML).to.eql('the_form_html');
              return {
                children: [{
                  submit: done
                }]
              };
            }
          }
        };
      };

      var configuration = {
        domain: 'me.auth0.com',
        redirect_uri: 'http://localhost:3000/example/',
        client_id: '0HP71GSd6PuoRY',
        response_type: 'token'
      };

      var auth0 = new WebAuth(configuration);

      auth0.redirect.login({
        connection: 'tests',
        username: 'me@example.com',
        password: '1234',
        scope: 'openid'
      }, function (err) {
        console.log(err);
      });
    });
  });
});
