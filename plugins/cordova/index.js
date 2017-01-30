var version = require('../../src/version');
var windowHandler = require('../../src/helper/window');
var PluginHandler = require('./plugin-handler');

function CordovaPlugin() {
  this.webAuth = null;
  this.version = version.raw;
  this.extensibilityPoints = [
    'popup.authorize',
    'popup.getPopupHandler'
  ];
}

CordovaPlugin.prototype.setWebAuth = function (webAuth) {
  this.webAuth = webAuth;
};

CordovaPlugin.prototype.supports = function (extensibilityPoint) {
  var _window = windowHandler.getWindow();
  return (!!_window.cordova || !!_window.electron) &&
          this.extensibilityPoints.indexOf(extensibilityPoint) > -1;
};

CordovaPlugin.prototype.init = function () {
  return new PluginHandler(this.webAuth);
};

module.exports = CordovaPlugin;
