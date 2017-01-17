/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
var WinChan = require('winchan');

var windowHandler = require('../helper/window');
var objectHelper = require('../helper/object');

function PopupHandler() {
  this._current_popup = null;
}

PopupHandler.prototype.stringifyPopupSettings = function (options) {
  var settings = '';

  for (var key in options) {
    settings += key + '=' + options[key] + ',';
  }

  return settings.slice(0, -1);
};

PopupHandler.prototype.calculatePosition = function (options) {
  var width = options.width || 500;
  var height = options.height || 600;
  var _window = windowHandler.getWindow();

  var screenX = typeof _window.screenX !== 'undefined' ? _window.screenX : _window.screenLeft;
  var screenY = typeof _window.screenY !== 'undefined' ? _window.screenY : _window.screenTop;

  var outerWidth = typeof _window.outerWidth !== 'undefined'
    ? _window.outerWidth
    : _window.document.body.clientWidth;

  var outerHeight = typeof _window.outerHeight !== 'undefined'
    ? _window.outerHeight
    : _window.document.body.clientHeight;

  var left = screenX + ((outerWidth - width) / 2);
  var top = screenY + ((outerHeight - height) / 2);

  return { width: width, height: height, left: left, top: top };
};

PopupHandler.prototype.preload = function (options) {
  var _this = this;
  var _window = windowHandler.getWindow();
  var popupPosition = this.calculatePosition(options.popupOptions || {});
  var popupOptions = objectHelper.merge(popupPosition).with(options.popupOptions);
  var url = options.url || 'about:blank';
  var windowFeatures = this.stringifyPopupSettings(popupOptions);

  if (this._current_popup && !this._current_popup.closed) {
    return this._current_popup;
  }

  this._current_popup = _window.open(url, 'auth0_signup_popup', windowFeatures);

  this._current_popup.kill = function () {
    this.close();
    _this._current_popup = null;
  };

  return this._current_popup;
};

PopupHandler.prototype.load = function (url, relayUrl, options, cb) {
  var _this = this;
  var popupPosition = this.calculatePosition(options.popupOptions || {});
  var popupOptions = objectHelper.merge(popupPosition).with(options.popupOptions);

  var winchanOptions = {
    url: url,
    relay_url: relayUrl,
    window_features: this.stringifyPopupSettings(popupOptions),
    popup: this._current_popup,
    params: options
  };

  var popup = WinChan.open(winchanOptions, function (err, data) {
    _this._current_popup = null;
    return cb(err, data);
  });

  popup.focus();

  return popup;
};

module.exports = PopupHandler;
