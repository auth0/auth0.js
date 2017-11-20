var windowHelper = require('./window');

function IframeHandler(options) {
  this.url = options.url;
  this.callback = options.callback;
  this.timeout = options.timeout || 60 * 1000;
  this.timeoutCallback = options.timeoutCallback || null;
  this.eventListenerType = options.eventListenerType || 'message';
  this.iframe = null;
  this.timeoutHandle = null;
  this._destroyTimeout = null;
  this.transientMessageEventListener = null;
  this.proxyEventListener = null;
  // If no event identifier specified, set default
  this.eventValidator = options.eventValidator || {
    isValid: function() {
      return true;
    }
  };

  if (typeof this.callback !== 'function') {
    throw new Error('options.callback must be a function');
  }
}

IframeHandler.prototype.init = function() {
  var _this = this;
  var _window = windowHelper.getWindow();

  this.iframe = _window.document.createElement('iframe');
  this.iframe.style.display = 'none';

  // Workaround to avoid using bind that does not work in IE8
  this.proxyEventListener = function(e) {
    _this.eventListener(e);
  };

  switch (this.eventListenerType) {
    case 'message':
      this.eventSourceObject = _window;
      break;
    case 'load':
      this.eventSourceObject = this.iframe;
      break;
    default:
      throw new Error('Unsupported event listener type: ' + this.eventListenerType);
  }

  this.eventSourceObject.addEventListener(this.eventListenerType, this.proxyEventListener, false);

  _window.document.body.appendChild(this.iframe);
  
  this.iframe.src = this.url;
  
  this.timeoutHandle = setTimeout(function() {
    _this.timeoutHandler();
  }, this.timeout);
};

IframeHandler.prototype.eventListener = function(event) {
  var eventData = { event: event, sourceObject: this.eventSourceObject };

  if (!this.eventValidator.isValid(eventData)) {
    return;
  }

  this.destroy();
  this.callback(eventData);
};

IframeHandler.prototype.timeoutHandler = function() {
  this.destroy();
  if (this.timeoutCallback) {
    this.timeoutCallback();
  }
};

IframeHandler.prototype.destroy = function() {
  var _this = this;
  var _window = windowHelper.getWindow();

  clearTimeout(this.timeoutHandle);

  this._destroyTimeout = setTimeout(function() {
    _this.eventSourceObject.removeEventListener(
      _this.eventListenerType,
      _this.proxyEventListener,
      false
    );
    _window.document.body.removeChild(_this.iframe);
  }, 0);
};

module.exports = IframeHandler;
