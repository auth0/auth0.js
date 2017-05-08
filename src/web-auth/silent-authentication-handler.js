var IframeHandler = require('../helper/iframe-handler');

function SilentAuthenticationHandler(auth0, authenticationUrl, timeout) {
  this.auth0 = auth0;
  this.authenticationUrl = authenticationUrl;
  this.timeout = timeout || 60 * 1000;
  this.handler = null;
}

SilentAuthenticationHandler.prototype.login = function (usePostMessage, callback) {
  this.handler = new IframeHandler({
    auth0: this.auth0,
    url: this.authenticationUrl,
    callback: callback,
    timeout: this.timeout,
    timeoutCallback: function () {
      callback(null, '#error=timeout&error_description=Timeout+during+authentication+renew.');
    },
    usePostMessage: usePostMessage || false
  });

  this.handler.init();
};

module.exports = SilentAuthenticationHandler;
