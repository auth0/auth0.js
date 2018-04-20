var windowHandler = require('../window');
var DummyStorage = require('./dummy');
var CookieStorage = require('./cookie');
var Warn = require('../warn');

function StorageHandler() {
  this.warn = new Warn({});
  this.storage = new CookieStorage();
  try {
    // some browsers throw an error when trying to access localStorage
    // when localStorage is disabled.
    var localStorage = windowHandler.getWindow().localStorage;
    if (localStorage) {
      this.storage = localStorage;
    }
  } catch (e) {
    this.warn.warning(e);
    this.warn.warning("Can't use localStorage. Using CookieStorage instead.");
  }
}

StorageHandler.prototype.failover = function() {
  if (this.storage instanceof DummyStorage) {
    this.warn.warning('DummyStorage: ignore failover');
    return;
  } else if (this.storage instanceof CookieStorage) {
    this.warn.warning('CookieStorage: failing over DummyStorage');
    this.storage = new DummyStorage();
  } else {
    this.warn.warning('LocalStorage: failing over CookieStorage');
    this.storage = new CookieStorage();
  }
};

StorageHandler.prototype.getItem = function(key) {
  try {
    return this.storage.getItem(key);
  } catch (e) {
    this.warn.warning(e);
    this.failover();
    return this.getItem(key);
  }
};

StorageHandler.prototype.removeItem = function(key) {
  try {
    return this.storage.removeItem(key);
  } catch (e) {
    this.warn.warning(e);
    this.failover();
    return this.removeItem(key);
  }
};

StorageHandler.prototype.setItem = function(key, value, options) {
  try {
    return this.storage.setItem(key, value, options);
  } catch (e) {
    this.warn.warning(e);
    this.failover();
    return this.setItem(key, value, options);
  }
};

module.exports = StorageHandler;
