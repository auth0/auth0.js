import version from '../version';

function PluginHandler(webAuth, plugins) {
  this.plugins = plugins;

  for (var a = 0; a < this.plugins.length; a++) {
    if (this.plugins[a].version !== version.raw) {
      var pluginName = '';

      if (this.plugins[a].constructor && this.plugins[a].constructor.name) {
        pluginName = this.plugins[a].constructor.name;
      }

      throw new Error(
        'Plugin ' +
          pluginName +
          ' version (' +
          this.plugins[a].version +
          ') ' +
          'is not compatible with the SDK version (' +
          version.raw +
          ')'
      );
    }

    this.plugins[a].setWebAuth(webAuth);
  }
}

PluginHandler.prototype.get = function(extensibilityPoint) {
  for (var a = 0; a < this.plugins.length; a++) {
    if (this.plugins[a].supports(extensibilityPoint)) {
      return this.plugins[a].init();
    }
  }

  return null;
};

export default PluginHandler;
