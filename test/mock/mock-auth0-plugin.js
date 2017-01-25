var version = require('../../src/version');

function MockPlugin(configuration) {
  configuration = configuration || {};

  this.version = configuration.version || version.raw;
  this.handler = configuration.handler || null;
  this.extensibilityPoints = configuration.extensibilityPoints || [];
}

MockPlugin.prototype.supports = function (extensibilityPoint) {
  return this.extensibilityPoints.indexOf(extensibilityPoint) > -1;
};

MockPlugin.prototype.init = function (webAuth) {
  return this.handler;
};

module.exports = MockPlugin;
