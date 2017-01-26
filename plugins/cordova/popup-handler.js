var windowHandler = require('../../src/helper/window');
var qs = require('../../src/helper/qs');

function PopupHandler(webAuth) {
  this.webAuth = webAuth;
  this._current_popup = null;
  this.options = null;
}

PopupHandler.prototype.preload = function (options) {
  var _this = this;
  var _window = windowHandler.getWindow();

  var url = options.url || 'about:blank';
  var popupOptions = options.popupOptions || {};

  popupOptions.location = 'yes';
  delete popupOptions.width;
  delete popupOptions.height;

  var windowFeatures = qs.build(popupOptions, ',', false);

  if (this._current_popup && !this._current_popup.closed) {
    return this._current_popup;
  }

  this._current_popup = _window.open(url, '_blank', windowFeatures);

  this._current_popup.kill = function () {
    _this.unhook();
    this.close();
    _this._current_popup = null;
  };

  return this._current_popup;
};

PopupHandler.prototype.load = function (url, _, options, cb) {
  var _this = this;
  this.url = url;
  this.options = options;
  if (!this._current_popup) {
    options.url = url;
    this.preload(options);
  } else {
    this._current_popup.location.href = url;
  }

  this.transientErrorHandler = function (event) {
    _this.errorHandler(event, cb);
  };

  this.transientStartHandler = function (event) {
    _this.startHandler(event, cb);
  };

  this.transientExitHandler = function () {
    _this.exitHandler(cb);
  };

  this._current_popup.addEventListener('loaderror', this.transientErrorHandler);
  this._current_popup.addEventListener('loadstart', this.transientStartHandler);
  this._current_popup.addEventListener('exit', this.transientExitHandler);
};

PopupHandler.prototype.errorHandler = function (event, cb) {
  if (!this._current_popup) {
    return;
  }

  if (this._current_popup) {
    this._current_popup.kill();
  }

  cb({ error: 'window_error', errorDescription: event.message });
};

PopupHandler.prototype.unhook = function () {
  this._current_popup.removeEventListener('loaderror', this.transientErrorHandler);
  this._current_popup.removeEventListener('loadstart', this.transientStartHandler);
  this._current_popup.removeEventListener('exit', this.transientExitHandler);
};

PopupHandler.prototype.exitHandler = function (cb) {
  if (!this._current_popup) {
    return;
  }

  if (this._current_popup) {
    this._current_popup.kill();
  }

  cb({ error: 'window_closed', errorDescription: 'Browser window closed' });
};

PopupHandler.prototype.startHandler = function (event, cb) {
  var _this = this;

  if (!this._current_popup) {
    return;
  }

  var opts = { hash: event.url.split('#').pop() };

  if (this.options.nonce) {
    opts.nonce = this.options.nonce;
  }

  this.webAuth.parseHash(
    opts,
    function (error, result) {
      if (error || result) {
        if (_this._current_popup) {
          _this._current_popup.kill();
        }
        cb(error, result);
      }
    }
  );
};

module.exports = PopupHandler;
