var windowHandler = require('../../helper/window');

function MobilePopupHandler(webAuth) {
  this.webAuth = webAuth;
  this._current_popup = null;
}

MobilePopupHandler.prototype.stringifyPopupSettings = function (options) {
  var settings = '';

  for (var key in options) {
    settings += key + '=' + options[key] + ',';
  }

  return settings.slice(0, -1);
};

MobilePopupHandler.prototype.preload = function (options) {
  var _this = this;
  var _window = windowHandler.getWindow();

  var url = options.url || 'about:blank';
  var popupOptions = options.popupOptions || {};

  popupOptions.location = 'yes';
  delete popupOptions.width;
  delete popupOptions.height;

  var windowFeatures = this.stringifyPopupSettings(popupOptions);

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

MobilePopupHandler.prototype.load = function (url, _, options, cb) {
  var _this = this;
  this.url = url;
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

MobilePopupHandler.prototype.errorHandler = function (event, cb) {
  if (!this._current_popup) {
    return;
  }

  if (this._current_popup) {
    this._current_popup.kill();
  }

  cb(new Error(event.message), null);
};

MobilePopupHandler.prototype.unhook = function () {
  this._current_popup.removeEventListener('loaderror', this.transientErrorHandler);
  this._current_popup.removeEventListener('loadstart', this.transientStartHandler);
  this._current_popup.removeEventListener('exit', this.transientExitHandler);
};

MobilePopupHandler.prototype.exitHandler = function (cb) {
  if (!this._current_popup) {
    return;
  }

  if (this._current_popup) {
    this._current_popup.kill();
  }

  cb(new Error('Browser window closed'), null);
};

MobilePopupHandler.prototype.startHandler = function(event, cb) {
  var _this = this;

  if (!this._current_popup) {
    return;
  }

  this.webAuth.parseHash(
    { hash: event.url.split('#').pop() },
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

module.exports = MobilePopupHandler;
