var expect = require('expect.js');
var stub = require('sinon').stub;

var WebAuth = require('../../src/web-auth');
var windowHelper = require('../../src/helper/window');
var IframeHandler = require('../../src/helper/iframe-handler');

function stubWindow(event, data) {
  if (event === 'message') {
    var iframe = {
      id: 'the_iframe',
      style: {}
    };
  } else {
    var iframe = {
      id: 'the_iframe',
      style: {},
      contentWindow: {
        location: {
          hash: data || '#access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL21kb2NzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw0QVpERjU2Nzg5IiwiYXVkIjoiMEhQNzFHU2Q2UHVvUllKM0RYS2RpWENVVWRHbUJidXAiLCJleHAiOjE0Nzg1NjIyNTMsImlhdCI6MTQ3ODUyNjI1M30.LELBxWWxcGdYTaE_gpSmlNSdcucqyrhuHQo-s7hTDBA&token_type=Bearer&state=theState&refresh_token=kajshdgfkasdjhgfas'
        }
      },
      removeEventListener: function (event) {
        expect(event).to.be(event);
      },
      addEventListener: function (event, callback) {
        expect(event).to.be(event);
        setTimeout(function(){
          callback();
        }, 100)
      }
    };
  }

  stub(windowHelper, 'getWindow', function () {
    return {
      addEventListener: function (event, callback) {
        expect(event).to.be(event);
        if (data !== false) {
          setTimeout(function(){
            callback({
              data: data || { access_token: '123' }
            });
          }, 100)
        }
      },
      removeEventListener: function (event) {
        expect(event).to.be(event);
      },
      document: {
        createElement: function (element) {
          expect(element).to.be('iframe');
          return iframe
        },
        body: {
          removeChild: function(ele) {
            expect(ele.id).to.be('the_iframe');
          },
          appendChild: function (ele) {
            expect(ele.id).to.be('the_iframe');
          }
        }
      }
    }
  });

  return iframe;
}

describe('helpers iframeHandler', function () {
  context('should render the iframe', function() {
    before(function () {
      this.auth0 = new WebAuth({
        domain: 'mdocs.auth0.com',
        redirectUri: 'http://example.com/callback',
        clientID: '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
        responseType: 'token',
        _sendTelemetry: false
      });
    });

    afterEach(function(){
      windowHelper.getWindow.restore();
    })

    it('and hook to the message event', function (done) {

      var iframe = stubWindow('message');

      var iframeHandler = new IframeHandler({
        auth0: this.auth0,
        url: 'http://example.com',
        callback: function(err,data){
          expect(iframe.style).to.eql({ display: 'none' });
          expect(iframe.src).to.be('http://example.com');

          expect(err).to.be(null);
          expect(data).to.eql({ access_token: '123' });

          done();
        },
        timeoutCallback: function(){},
        usePostMessage: true
      });

      iframeHandler.init();
    });

    it('and hook to the load event', function (done) {

      var iframe = stubWindow('load');

      var iframeHandler = new IframeHandler({
        auth0: this.auth0,
        url: 'http://example.com',
        callback: function(err,data){
          expect(iframe.style).to.eql({ display: 'none' });
          expect(iframe.src).to.be('http://example.com');

          expect(err).to.be(null);

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
            appStatus: null,
            refreshToken: 'kajshdgfkasdjhgfas',
            state: 'theState'
          });

          done();
        }
      });

      iframeHandler.init();
    });

    it(', hook to the load event and returns an error', function (done) {
      var iframe = stubWindow('load', '#error=some_error&error_description=the+error+description');

      var iframeHandler = new IframeHandler({
        auth0: this.auth0,
        url: 'http://example.com',
        callback: function(err,data){
          expect(iframe.style).to.eql({ display: 'none' });
          expect(iframe.src).to.be('http://example.com');

          expect(data).to.be(null);

          expect(err).to.eql({
            error:'some_error',
            error_description: 'the+error+description'
          });

          done();
        }
      });

      iframeHandler.init();
    });

    it('and hook to the load event (with invalid hash) should timeout', function (done) {
      var iframe = stubWindow('load', '#type=invalid_hash&something=else');

      var iframeHandler = new IframeHandler({
        auth0: this.auth0,
        url: 'http://example.com',
        callback: function(err,data){ },
        timeoutCallback: function(){
          expect(iframe.style).to.eql({ display: 'none' });
          expect(iframe.src).to.be('http://example.com');
          done();
        },
        timeout: 100
      });

      iframeHandler.init();
    });

    it('and timeout', function (done) {
      var iframe = stubWindow('message', false);

      var iframeHandler = new IframeHandler({
        auth0: this.auth0,
        url: 'http://example.com',
        callback: function(data){
        },
        timeoutCallback: function(){
          expect(iframe.style).to.eql({ display: 'none' });
          expect(iframe.src).to.be('http://example.com');
          done();
        },
        usePostMessage: true,
        timeout: 100
      });

      iframeHandler.init();
    });

    it('and timeout (without a timeout callback)', function (done) {
      var iframe = stubWindow('message', false);

      var iframeHandler = new IframeHandler({
        auth0: this.auth0,
        url: 'http://example.com',
        callback: function(data){
        },
        usePostMessage: true,
        timeout: 1
      });

      iframeHandler.init();

      setTimeout(done, 100); // we do not assert anything, just wait to make sure anything fails
    });

  });
});
