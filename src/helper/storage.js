var StorageHandler = require('./storage/handler');
var storage = false;

function getStorage(force) {
  if (!storage || force) {
    storage = new StorageHandler();
  }
  return storage;
}

module.exports = {
  getItem: function(key) {
    var value = getStorage().getItem(key);
    try {
      return JSON.parse(value);
    } catch (_) {
      return value;
    }
  },
  removeItem: function(key) {
    return getStorage().removeItem(key);
  },
  setItem: function(key, value, options) {
    var json = JSON.stringify(value);
    return getStorage().setItem(key, json, options);
  },
  reload: function() {
    getStorage(true);
  }
};
