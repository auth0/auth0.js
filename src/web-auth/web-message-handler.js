var IframeHandler = require('../helper/iframe-handler');
var objectHelper = require('../helper/object');

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
        return eventData.event.data.type === 'authorization_response';
      }
    },
    timeoutCallback: function() {
      callback({ error: 'timeout', error_description: 'Timeout during fetching SSO data' });
    }
  });
  handler.init();
}

function WebMessageHandler(webAuth) {
  this.webAuth = webAuth;
}

WebMessageHandler.prototype.checkSession = function(options, cb) {
  options.responseMode = 'web_message';
  options.prompt = 'none';
  runWebMessageFlow(this.webAuth.client.buildAuthorizeUrl(options), options, function(
    err,
    eventData
  ) {
    var error = err || eventData.event.data.response.error;
    if (error) {
      return cb(error);
    }
    cb(null, objectHelper.toCamelCase(eventData.event.data.response));
  });
};

module.exports = WebMessageHandler;
