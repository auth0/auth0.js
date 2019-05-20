import StorageHandler from './storage/handler';

function Storage(options) {
  this.handler = new StorageHandler(options);
}

Storage.prototype.getItem = function(key) {
  var value = this.handler.getItem(key);
  try {
    return JSON.parse(value);
  } catch (_) {
    return value;
  }
};
Storage.prototype.removeItem = function(key) {
  return this.handler.removeItem(key);
};
Storage.prototype.setItem = function(key, value, options) {
  var json = JSON.stringify(value);
  return this.handler.setItem(key, json, options);
};

export default Storage;
