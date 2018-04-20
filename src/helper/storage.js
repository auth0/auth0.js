var StorageHandler = require('./storage/handler');
var storage = new StorageHandler();

module.exports = {
  getItem: function(key) {
    var value = storage.getItem(key);
    try {
      return JSON.parse(value);
    } catch (_) {
      return value;
    }
  },
  removeItem: function(key) {
    return storage.removeItem(key);
  },
  setItem: function(key, value, options) {
    var json = JSON.stringify(value);
    return storage.setItem(key, json, options);
  }
};
