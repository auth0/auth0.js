import urljoin from 'url-join';
import PopupHandler from './popup-handler';

class PluginHandler {
  constructor (webAuth) {
    this.webAuth = webAuth;
  }

  // eslint-disable-next-line class-methods-use-this
  processParams(params) {
    params.redirectUri = urljoin('https://' + params.domain, 'mobile');
    delete params.owp;
    return params;
  }

  getPopupHandler() {
    return new PopupHandler(this.webAuth);
  }
}

export default PluginHandler;
