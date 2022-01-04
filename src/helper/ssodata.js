import Storage from './storage';

class SSODataStorage {
  constructor (options) {
    this.storage = new Storage(options);
  }

  set(connection, sub) {
    var ssodata = {
      lastUsedConnection: connection,
      lastUsedSub: sub
    };
    this.storage.setItem('auth0.ssodata', JSON.stringify(ssodata));
  }

  get() {
    var ssodata = this.storage.getItem('auth0.ssodata');
    if (!ssodata) {
      return;
    }
    return JSON.parse(ssodata);
  }
}


export default SSODataStorage;
