var version = require('../../version');
var windowHandler = require('../../helper/window');
var PluginHandler = require('./plugin-handler');

function CordovaPlugin() {
  this.version = version.raw;
  this.extensibilityPoints = [
    'popup.authorize',
    'popup.getPopupHandler'
  ];
}

CordovaPlugin.prototype.supports = function (extensibilityPoint) {
  var _window = windowHandler.getWindow();
  return (!!_window.cordova || !!_window.electron) &&
          this.extensibilityPoints.indexOf(extensibilityPoint) > -1;
};

CordovaPlugin.prototype.init = function (webAuth) {
  return new PluginHandler(webAuth);
};

module.exports = CordovaPlugin;
