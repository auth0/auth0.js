var windowHandler = require('./window');

function DummyStorage() {}
DummyStorage.prototype.getItem = function (key) { return null; };
DummyStorage.prototype.removeItem = function (key) {};
DummyStorage.prototype.setItem = function (key, value) {};

function getStorage() {
  return windowHandler.getWindow().localStorage || new DummyStorage();
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
