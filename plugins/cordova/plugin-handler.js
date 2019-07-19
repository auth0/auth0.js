import urljoin from 'url-join';
import PopupHandler from './popup-handler';

function PluginHandler(webAuth) {
  this.webAuth = webAuth;
}

PluginHandler.prototype.processParams = function(params) {
  params.redirectUri = urljoin('https://' + params.domain, 'mobile');
  delete params.owp;
  return params;
};

PluginHandler.prototype.getPopupHandler = function() {
  return new PopupHandler(this.webAuth);
};

export default PluginHandler;
