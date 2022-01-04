import windowHandler from '../window';
import DummyStorage from './dummy';
import CookieStorage from './cookie';
import Warn from '../warn';

class StorageHandler {
  constructor (options) {
    this.warn = new Warn({});
    this.storage = new CookieStorage();
    if (options.__tryLocalStorageFirst !== true) {
      return;
    }
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

  failover() {
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
  }

  getItem(key) {
    try {
      return this.storage.getItem(key);
    } catch (e) {
      this.warn.warning(e);
      this.failover();
      return this.getItem(key);
    }
  }

  removeItem(key) {
    try {
      return this.storage.removeItem(key);
    } catch (e) {
      this.warn.warning(e);
      this.failover();
      return this.removeItem(key);
    }
  }

  setItem(key, value, options) {
    try {
      return this.storage.setItem(key, value, options);
    } catch (e) {
      this.warn.warning(e);
      this.failover();
      return this.setItem(key, value, options);
    }
  }
}

export default StorageHandler;
