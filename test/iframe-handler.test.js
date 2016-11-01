/**
 * Config mocha
 */

mocha.timeout(60000);
mocha.globals(['jQuery*', '__auth0jp*']);

/**
 * Dependencies
 */

var IframeHandler = require('../lib/IframeHandler');

/**
 * Test Auth0
 */

describe('IframeHandler', function () {
  afterEach(function () {
    global.window.location.hash = '';
  });

  it('IframeHandler should timeout', function (done) {

    var auth0 = new Auth0({
      clientID:     'aaaabcdefgh',
      callbackURL: 'https://myapp.com/callback',
      domain:       'aaa.auth0.com'
    });

    var handler = new IframeHandler({
      auth0:auth0,
      url: "", 
      timeout: 10,
      callback: function(err, result) {

      }
    });

    var oldDestroy = handler.destroy;

    handler.destroy = function() {
      oldDestroy.apply(handler);
      done();
    }

    handler.init();

  });

  it('IframeHandler call the callback with the postMessage result', function (done) {

    var auth0 = new Auth0({
      clientID:     'aaaabcdefgh',
      callbackURL: 'https://myapp.com/callback',
      domain:       'aaa.auth0.com'
    });

    var handler = new IframeHandler({
      auth0:auth0,
      url: "", 
      usePostMessage: true,
      callback: function(err, result) {
        expect(err).to.not.be.ok();
        expect(result).to.be.an('object');
        expect(result.access_token).to.be('access_token');
        expect(result.id_token).to.be('id_token');
        expect(result.token_type).to.be('Bearer');
        done();
      }
    });

    var oldDestroy = handler.destroy;

    handler.destroy = function() {
      oldDestroy.apply(handler);
    }

    handler.init();

    window.postMessage({
      access_token: 'access_token',
      id_token: 'id_token',
      token_type: 'Bearer'
    }, "*");
  });

  it('IframeHandler call the callback with the postMessage error', function (done) {

    var auth0 = new Auth0({
      clientID:     'aaaabcdefgh',
      callbackURL: 'https://myapp.com/callback',
      domain:       'aaa.auth0.com'
    });

    var handler = new IframeHandler({
      auth0:auth0,
      url: "", 
      usePostMessage: true,
      callback: function(err, result) {
        expect(result).to.not.be.ok();
        expect(err).to.be.an('object');
        expect(err.error).to.be('the_error');
        expect(err.error_message).to.be('the error message');
        done();
      }
    });

    var oldDestroy = handler.destroy;

    handler.destroy = function() {
      oldDestroy.apply(handler);
    }

    handler.init();

    window.postMessage({
      error: 'the_error',
      error_message: 'the error message'
    }, "*");
  });

});