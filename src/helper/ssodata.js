import Storage from './storage';

function SSODataStorage(options) {
  this.storage = new Storage(options);
}

SSODataStorage.prototype.set = function(connection, sub) {
  var ssodata = {
    lastUsedConnection: connection,
    lastUsedSub: sub
  };
  this.storage.setItem('auth0.ssodata', JSON.stringify(ssodata));
};
SSODataStorage.prototype.get = function() {
  var ssodata = this.storage.getItem('auth0.ssodata');
  if (!ssodata) {
    return;
  }
  return JSON.parse(ssodata);
};

export default SSODataStorage;
