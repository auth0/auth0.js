/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
import WinChan from 'winchan';

import windowHandler from './window';
import objectHelper from './object';
import qs from 'qs';

function PopupHandler() {
  this._current_popup = null;
}

PopupHandler.prototype.calculatePosition = function(options) {
  var width = options.width || 500;
  var height = options.height || 600;
  var _window = windowHandler.getWindow();

  var screenX = typeof _window.screenX !== 'undefined' ? _window.screenX : _window.screenLeft;
  var screenY = typeof _window.screenY !== 'undefined' ? _window.screenY : _window.screenTop;

  var outerWidth =
    typeof _window.outerWidth !== 'undefined'
      ? _window.outerWidth
      : _window.document.body.clientWidth;

  var outerHeight =
    typeof _window.outerHeight !== 'undefined'
      ? _window.outerHeight
      : _window.document.body.clientHeight;

  var left = options.left || screenX + (outerWidth - width) / 2;
  var top = options.top || screenY + (outerHeight - height) / 2;

  return { width: width, height: height, left: left, top: top };
};

PopupHandler.prototype.preload = function(options) {
  var _this = this;
  var _window = windowHandler.getWindow();
  var popupPosition = this.calculatePosition(options.popupOptions || {});
  var popupOptions = objectHelper.merge(popupPosition).with(options.popupOptions);
  var url = options.url || 'about:blank';
  var windowFeatures = qs.stringify(popupOptions, {
    encode: false,
    delimiter: ','
  });

  if (this._current_popup && !this._current_popup.closed) {
    return this._current_popup;
  }

  this._current_popup = _window.open(url, 'auth0_signup_popup', windowFeatures);

  this._current_popup.kill = function() {
    this.close();
    _this._current_popup = null;
  };

  return this._current_popup;
};

PopupHandler.prototype.load = function(url, relayUrl, options, cb) {
  var _this = this;
  var popupPosition = this.calculatePosition(options.popupOptions || {});
  var popupOptions = objectHelper.merge(popupPosition).with(options.popupOptions);

  var winchanOptions = objectHelper
    .merge({
      url: url,
      relay_url: relayUrl,
      window_features: qs.stringify(popupOptions, {
        delimiter: ',',
        encode: false
      }),
      popup: this._current_popup
    })
    .with(options);

  var popup = WinChan.open(winchanOptions, function(err, data) {
    // Ignores messages sent by browser extensions.
    if (err && err.name === 'SyntaxError') {
      return;
    }
    _this._current_popup = null;
    return cb(err, data);
  });

  popup.focus();

  return popup;
};

export default PopupHandler;
