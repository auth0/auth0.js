var information = require('../helper/information');
var IframeHandler = require('../helper/iframe-handler');

function SilentAuthenticationHandler(auth0, authenticationUrl, timeout) {
  this.auth0 = auth0;
  this.authenticationUrl = authenticationUrl;
  this.timeout = timeout || 60 * 1000;
  this.handler = null;
}

SilentAuthenticationHandler.prototype.timeoutCallback = function () {
  information.error('Timeout during authentication renew.');
};

SilentAuthenticationHandler.prototype.login = function (usePostMessage, callback) {
  this.handler = new IframeHandler({
    auth0: this.auth0,
    url: this.authenticationUrl,
    callback: callback,
    timeout: this.timeout,
    timeoutCallback: this.timeoutCallback,
    usePostMessage: usePostMessage || false
  });

  this.handler.init();
};

module.exports = SilentAuthenticationHandler;
