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
          hash: data !== undefined ? data : '#access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&state=theState&refresh_token=kajshdgfkasdjhgfas'
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
      localStorage: {
        removeItem: function(key) {
          expect(key).to.be('com.auth0.auth.theState');
        },
        getItem: function(key) {
          expect(key).to.be('com.auth0.auth.theState');
          return JSON.stringify({
            nonce: 'asfd',
            appState: null
          });
        }
      },
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
        domain: 'wptest.auth0.com',
        redirectUri: 'http://example.com/callback',
        clientID: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
        responseType: 'token',
        _sendTelemetry: false,
        __disableExpirationCheck: true
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

          setTimeout(done, 100);
        },
        timeoutCallback: function(){},
        usePostMessage: true
      });

      iframeHandler.init();
    });

    it('and hook to the load event and returns the hash', function (done) {

      var iframe = stubWindow('load');

      var iframeHandler = new IframeHandler({
        auth0: this.auth0,
        url: 'http://example.com',
        callback: function (err, data) {
          expect(iframe.style).to.eql({ display: 'none' });
          expect(iframe.src).to.be('http://example.com');

          expect(data).to.eql(iframe.contentWindow.location.hash);

          setTimeout(done, 100);
        }
      });

      iframeHandler.init();
    });

    it('and hook to the load event (with invalid hash) should timeout', function (done) {
      var iframe = stubWindow('load', '');

      var iframeHandler = new IframeHandler({
        auth0: this.auth0,
        url: 'http://example.com',
        callback: function(err,data){
        },
        timeoutCallback: function(){
          expect(iframe.style).to.eql({ display: 'none' });
          expect(iframe.src).to.be('http://example.com');
          setTimeout(done, 100);
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
          setTimeout(done, 100);
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
