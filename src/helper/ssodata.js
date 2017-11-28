var storage = require('./storage');

module.exports = {
  set: function(connection, username, sub) {
    var ssodata = {
      lastUsedUsername: username,
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
