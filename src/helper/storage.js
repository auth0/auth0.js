var StorageHandler = require('./storage/handler');
var storage;
var getStorage = function() {
  if (!storage) {
    storage = new StorageHandler();
  }
  return storage;
};

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
  }
};
