import storage from './storage';

export default {
  set: function(connection, sub) {
    var ssodata = {
      lastUsedConnection: connection,
      lastUsedSub: sub
    };
    storage.setItem('auth0.ssodata', JSON.stringify(ssodata));
  },
  get: function() {
    var ssodata = storage.getItem('auth0.ssodata');
    if (!ssodata) {
      return;
    }
    return JSON.parse(ssodata);
  }
};
