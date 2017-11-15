var expect = require('expect.js');
var stub = require('sinon').stub;

var PopupHandler = require('../../src/helper/popup-handler');
var MockAuth0Plugin = require('../mock/mock-auth0-plugin');
var WebAuth = require('../../src/web-auth');
var version = require('../../src/version');
var TransactionManager = require('../../src/web-auth/transaction-manager');
var objectHelper = require('../../src/helper/object');

describe('auth0.WebAuth extensibility', function() {
  context('validations', function() {
    it('should validate the plugin version (must throw)', function() {
      expect(function() {
        var webAuth = new WebAuth({
          domain: 'test.auth0.com',
          clientID: '...',
          responseType: 'token id_token',
          plugins: [new MockAuth0Plugin({ version: 'v1.0.0' })]
        });
      }).to.throwException(function(e) {
        expect(e.message).to.be(
          'Plugin MockPlugin version (v1.0.0) is not compatible with the SDK version (' +
            version.raw +
            ')'
        );
      });
    });

    it('should validate the plugin version', function() {
      var plugin = new MockAuth0Plugin();
      var webAuth = new WebAuth({
        domain: 'test.auth0.com',
        clientID: '...',
        responseType: 'token id_token',
        plugins: [plugin]
      });

      expect(plugin.webAuth).to.be(webAuth);
    });
  });

  context('buildPopupHandler', function() {
    before(function() {
      this.webAuth = new WebAuth({
        domain: 'test.auth0.com',
        clientID: '...',
        responseType: 'token id_token',
        plugins: [
          new MockAuth0Plugin({
            extensibilityPoints: 'popup.getPopupHandler',
            handler: {
              getPopupHandler: function() {
                return 'CustomPopupHandler';
              }
            }
          })
        ]
      });
    });

    it('should get the popup handler from the plugin', function() {
      var popupHandler = this.webAuth.popup.buildPopupHandler();
      expect(popupHandler).to.eql('CustomPopupHandler');
    });
  });

  context('overrdide popup.authorize params', function() {
    before(function() {
      this.webAuth = new WebAuth({
        domain: 'test.auth0.com',
        clientID: '...',
        responseType: 'token id_token',
        plugins: [
          new MockAuth0Plugin({
            extensibilityPoints: 'popup.authorize',
            handler: {
              processParams: function(params) {
                params.redirectUri = 'http://custom-url.com';
                params.responseType = 'code';
                return params;
              }
            }
          })
        ],
        _sendTelemetry: false
      });
      stub(TransactionManager.prototype, 'generateTransaction', function(appState, state, nonce) {
        return { state: state || 'randomState', nonce: nonce || 'randomNonce' };
      });
    });

    after(function() {
      TransactionManager.prototype.generateTransaction.restore();
      PopupHandler.prototype.load.restore();
    });

    it('should change the content of the params', function(done) {
      stub(PopupHandler.prototype, 'load', function(url, relayUrl, options, cb) {
        expect(url).to.be(
          'https://test.auth0.com/authorize?client_id=...&response_type=code&owp=true&scope=openid&redirect_uri=http%3A%2F%2Fcustom-url.com&state=randomState'
        );
        expect(relayUrl).to.be('https://test.auth0.com/relay.html');
        expect(options).to.eql({});
        cb(null, {
          email_verified: false,
          email: 'me@example.com'
        });
      });

      this.webAuth.popup.authorize({ owp: true, scope: 'openid' }, function(err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({
          emailVerified: false,
          email: 'me@example.com'
        });
        done();
      });
    });
  });
});
