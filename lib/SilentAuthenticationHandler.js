var IframeHandler = require('./IframeHandler');

var SilentAuthenticationHandler = function (authenticationUrl, timeout) {
  
  this.authenticationUrl = authenticationUrl;
  this.timeout = timeout || 60 * 1000;
  this.handler = null;

}

SilentAuthenticationHandler.prototype.timeoutCallback = function () {

  console.error('Timeout during silent authentication.')

}

SilentAuthenticationHandler.prototype.login = function (callback, useWebMessage) {

  this.handler = new IframeHandler({
    url: this.authenticationUrl, 
    callback: callback, 
    timeout: this.timeout, 
    timeoutCallback: this.timeoutCallback,
    useWebMessage: useWebMessage || false
  });

  this.handler.init();

}


module.exports = SilentAuthenticationHandler;