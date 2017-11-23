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
        return eventData.event.data.type === 'authorization_response' 
          && options.state === eventData.event.data.response.state;
      }
    },
    timeoutCallback: function() {
      callback({
        error: 'timeout',
        error_description: 'Timeout during executing web_message communication'
      });
    }
  });
  handler.init();
}

function WebMessageHandler(webAuth) {
  this.webAuth = webAuth;
}

WebMessageHandler.prototype.run = function(options, cb) {
  var _this = this;
  options.responseMode = 'web_message';
  options.prompt = 'none';
  runWebMessageFlow(this.webAuth.client.buildAuthorizeUrl(options), options, function(
    err,
    eventData
  ) {
    var error = err;
    if (!err && eventData.event.data.response.error) {
      error = objectHelper.pick(eventData.event.data.response, ['error', 'error_description']);
    }
    if (error) {
      return cb(error);
    }
    var parsedHash = eventData.event.data.response;
    _this.webAuth.validateAuthenticationResponse(options, parsedHash, cb);
  });
};

module.exports = WebMessageHandler;
