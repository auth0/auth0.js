var storage = require('./storage');

module.exports = {
  set: function(connection) {
    storage.setItem('auth0.ssodata.connection', connection);
  },
  get: function() {
    return storage.getItem('auth0.ssodata.connection');
  }
};
