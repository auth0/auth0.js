import StorageHandler from './storage/handler';

class Storage {
  constructor (options) {
    this.handler = new StorageHandler(options);
  }

  getItem(key) {
    var value = this.handler.getItem(key);
    try {
      return JSON.parse(value);
    } catch (_) {
      return value;
    }
  }

  removeItem(key) {
    return this.handler.removeItem(key);
  }

  setItem(key, value, options) {
    var json = JSON.stringify(value);
    return this.handler.setItem(key, json, options);
  }
}


export default Storage;
