var StorageHandler = require('./storage/handler');
var storage;

function getStorage(force) {
  if (!storage || force) {
    storage = new StorageHandler();
  }
  return storage;
}

module.exports = {
  getItem: function(key) {
    var value = getStorage().getItem(key);
    return value ? JSON.parse(value) : value;
  },
  removeItem: function(key) {
    return getStorage().removeItem(key);
  },
  setItem: function(key, value) {
    var json = JSON.stringify(value);
    return getStorage().setItem(key, json);
  },
  reload: function() {
    getStorage(true);
  }
};
