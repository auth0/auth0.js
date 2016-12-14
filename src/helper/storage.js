var StorageHandler = require('./storage/handler');
var storage;

function getStorage() {
  if (!storage) {
    storage = new StorageHandler();
  }
  return storage;
}

module.exports = {
  getItem: function (key) {
    var value = getStorage().getItem(key);
    return JSON.parse(value);
  },
  removeItem: function (key) {
    return getStorage().removeItem(key);
  },
  setItem: function (key, value) {
    var json = JSON.stringify(value);
    return getStorage().setItem(key, json);
  }
};
