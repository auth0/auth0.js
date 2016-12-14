var windowHandler = require('../window');
var DummyStorage = require('./dummy');
var CookieStorage = require('./cookie');

function StorageHandler() {
  this.storage = windowHandler.getWindow().localStorage || new CookieStorage();
}

StorageHandler.prototype.failover = function () {
  if (this.storage instanceof DummyStorage) {
    return;
  } else if (this.storage instanceof CookieStorage) {
    this.storage = new DummyStorage();
  } else {
    this.storage = new CookieStorage();
  }
};

StorageHandler.prototype.getItem = function (key) {
  try {
    return this.storage.getItem(key);
  } catch (e) {
    console.log(e);
    this.failover();
    return this.getItem(key);
  }
};

StorageHandler.prototype.removeItem = function (key) {
  try {
    return this.storage.removeItem(key);
  } catch (e) {
    this.failover();
    return this.removeItem(key);
  }
};

StorageHandler.prototype.setItem = function (key, value) {
  try {
    return this.storage.setItem(key, value);
  } catch (e) {
    this.failover();
    return this.setItem(key, value);
  }
};

module.exports = StorageHandler;
