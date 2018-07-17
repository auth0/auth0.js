import IframeHandler from '../helper/iframe-handler';
import windowHelper from '../helper/window';

function SilentAuthenticationHandler(options) {
  this.authenticationUrl = options.authenticationUrl;
  this.timeout = options.timeout || 60 * 1000;
  this.handler = null;
  this.postMessageDataType = options.postMessageDataType || false;

  // prefer origin from options, fallback to origin from browser, and some browsers (for example MS Edge) don't support origin; fallback to construct origin manually
  this.postMessageOrigin =
    options.postMessageOrigin ||
    windowHelper.getWindow().location.origin ||
    windowHelper.getWindow().location.protocol +
      '//' +
      windowHelper.getWindow().location.hostname +
      (windowHelper.getWindow().location.port ? ':' + windowHelper.getWindow().location.port : '');
}

SilentAuthenticationHandler.create = function(options) {
  return new SilentAuthenticationHandler(options);
};

SilentAuthenticationHandler.prototype.login = function(usePostMessage, callback) {
  this.handler = new IframeHandler({
    auth0: this.auth0,
    url: this.authenticationUrl,
    eventListenerType: usePostMessage ? 'message' : 'load',
    callback: this.getCallbackHandler(callback, usePostMessage),
    timeout: this.timeout,
    eventValidator: this.getEventValidator(),
    timeoutCallback: function() {
      callback(null, '#error=timeout&error_description=Timeout+during+authentication+renew.');
    },
    usePostMessage: usePostMessage || false
  });

  this.handler.init();
};

SilentAuthenticationHandler.prototype.getEventValidator = function() {
  var _this = this;
  return {
    isValid: function(eventData) {
      switch (eventData.event.type) {
        case 'message':
          // Message must come from the expected origin and iframe window.
          if (
            eventData.event.origin !== _this.postMessageOrigin ||
            eventData.event.source !== _this.handler.iframe.contentWindow
          ) {
            return false;
          }

          // Default behaviour, return all message events from the iframe.
          if (_this.postMessageDataType === false) {
            return true;
          }

          return (
            eventData.event.data.type && eventData.event.data.type === _this.postMessageDataType
          );

        case 'load':
          if (eventData.sourceObject.contentWindow.location.protocol === 'about:') {
            // Chrome is automatically loading the about:blank page, we ignore this.
            return false;
          }
        // Fall through to default
        default:
          return true;
      }
    }
  };
};

SilentAuthenticationHandler.prototype.getCallbackHandler = function(callback, usePostMessage) {
  return function(eventData) {
    var callbackValue;
    if (!usePostMessage) {
      callbackValue = eventData.sourceObject.contentWindow.location.hash;
    } else if (typeof eventData.event.data === 'object' && eventData.event.data.hash) {
      callbackValue = eventData.event.data.hash;
    } else {
      callbackValue = eventData.event.data;
    }
    callback(null, callbackValue);
  };
};

export default SilentAuthenticationHandler;
