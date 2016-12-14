var StorageHandler = require('./storage/handler');
var storage = new StorageHandler();

module.exports = {
  getItem: function (key) {
    var value = storage.getItem(key);
    return JSON.parse(value);
  },
  removeItem: function (key) {
    return storage.removeItem(key);
  },
  setItem: function (key, value) {
    var json = JSON.stringify(value);
    return storage.setItem(key, json);
  }
};
