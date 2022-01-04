import version from '../../src/version';
import windowHandler from '../../src/helper/window';
import PluginHandler from './plugin-handler';

class CordovaPlugin {
  constructor () {
    this.webAuth = null;
    this.version = version.raw;
    this.extensibilityPoints = ['popup.authorize', 'popup.getPopupHandler'];
  }

  setWebAuth(webAuth) {
    this.webAuth = webAuth;
  }

  supports(extensibilityPoint) {
    var _window = windowHandler.getWindow();
    return (
      (!!_window.cordova || !!_window.electron) &&
      this.extensibilityPoints.indexOf(extensibilityPoint) > -1
    );
  }

  init() {
    return new PluginHandler(this.webAuth);
  }
}

export default CordovaPlugin;
