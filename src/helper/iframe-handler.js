var windowHelper = require('./window');

function IframeHandler(options) {
  this.auth0 = options.auth0;
  this.url = options.url;
  this.callback = options.callback;
  this.timeout = options.timeout || 60 * 1000;
  this.timeoutCallback = options.timeoutCallback || null;
  this.usePostMessage = options.usePostMessage || false;
  this.iframe = null;
  this.timeoutHandle = null;
  this._destroyTimeout = null;
  this.transientMessageEventListener = null;
  this.transientEventListener = null;
}

IframeHandler.prototype.init = function () {
  var _this = this;
  var _window = windowHelper.getWindow();

  this.iframe = _window.document.createElement('iframe');
  this.iframe.style.display = 'none';
  this.iframe.src = this.url;

  if (this.usePostMessage) {
    // Workaround to avoid using bind that does not work in IE8
    this.transientMessageEventListener = function (e) {
      _this.messageEventListener(e);
    };

    _window.addEventListener('message', this.transientMessageEventListener, false);
  } else {
    // Workaround to avoid using bind that does not work in IE8
    this.transientEventListener = function () {
      _this.loadEventListener();
    };

    this.iframe.addEventListener('load', this.transientEventListener, false);
  }

  _window.document.body.appendChild(this.iframe);

  this.timeoutHandle = setTimeout(function () {
    _this.timeoutHandler();
  }, this.timeout);
};

IframeHandler.prototype.messageEventListener = function (e) {
  this.destroy();
  this.callbackHandler(e.data);
};

IframeHandler.prototype.loadEventListener = function () {
  var _this = this;
  _this.callback(null, this.iframe.contentWindow.location.hash);
};

IframeHandler.prototype.callbackHandler = function (result) {
  var error = null;

  if (result && result.error) {
    error = result;
    result = null;
  }

  this.callback(error, result);
};

IframeHandler.prototype.timeoutHandler = function () {
  this.destroy();
  if (this.timeoutCallback) {
    this.timeoutCallback();
  }
};

IframeHandler.prototype.destroy = function () {
  var _this = this;
  var _window = windowHelper.getWindow();

  clearTimeout(this.timeoutHandle);

  this._destroyTimeout = setTimeout(function () {
    if (_this.usePostMessage) {
      _window.removeEventListener('message', _this.transientMessageEventListener, false);
    } else {
      _this.iframe.removeEventListener('load', _this.transientEventListener, false);
    }

    _window.document.body.removeChild(_this.iframe);
  }, 0);
};

module.exports = IframeHandler;
