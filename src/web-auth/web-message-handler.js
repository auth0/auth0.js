import IframeHandler from '../helper/iframe-handler';
import objectHelper from '../helper/object';
import windowHelper from '../helper/window';
import Warn from '../helper/warn';

function runWebMessageFlow(authorizeUrl, options, callback) {
  var handler = new IframeHandler({
    url: authorizeUrl,
    eventListenerType: 'message',
    callback: function(eventData) {
      callback(null, eventData);
    },
    timeout: options.timeout,
    eventValidator: {
      isValid: function(eventData) {
        return (
          eventData.event.data.type === 'authorization_response' &&
          options.state === eventData.event.data.response.state
        );
      }
    },
    timeoutCallback: function() {
      callback({
        error: 'timeout',
        error_description: 'Timeout during executing web_message communication',
        state: options.state
      });
    }
  });
  handler.init();
}

function WebMessageHandler(webAuth) {
  this.webAuth = webAuth;
  this.warn = new Warn(webAuth.baseOptions);
}

WebMessageHandler.prototype.run = function(options, cb) {
  var _this = this;
  options.responseMode = 'web_message';
  options.prompt = 'none';

  var currentOrigin = windowHelper.getOrigin();
  var redirectUriOrigin = objectHelper.getOriginFromUrl(options.redirectUri);
  if (redirectUriOrigin && currentOrigin !== redirectUriOrigin) {
    return cb({
      error: 'origin_mismatch',
      error_description:
        "The redirectUri's origin (" +
        redirectUriOrigin +
        ") should match the window's origin (" +
        currentOrigin +
        ').'
    });
  }

  runWebMessageFlow(
    this.webAuth.client.buildAuthorizeUrl(options),
    options,
    function(err, eventData) {
      var error = err;
      if (!err && eventData.event.data.response.error) {
        error = eventData.event.data.response;
      }
      if (!error) {
        var parsedHash = eventData.event.data.response;
        return _this.webAuth.validateAuthenticationResponse(
          options,
          parsedHash,
          cb
        );
      }
      if (
        error.error === 'consent_required' &&
        windowHelper.getWindow().location.hostname === 'localhost'
      ) {
        _this.warn.warning(
          "Consent Required. Consent can't be skipped on localhost. Read more here: https://auth0.com/docs/api-auth/user-consent#skipping-consent-for-first-party-clients"
        );
      }
      _this.webAuth.transactionManager.clearTransaction(error.state);
      return cb(objectHelper.pick(error, ['error', 'error_description']));
    }
  );
};

export default WebMessageHandler;
