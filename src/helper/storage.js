var windowHandler = require('./window');

function DummyStorage() {}
DummyStorage.prototype.getItem = function(key) { return null; }
DummyStorage.prototype.removeItem = function(key) {}
DummyStorage.prototype.setItem = function(key, value) {}

var storage = windowHandler.localStorage || new DummyStorage();

module.exports = storage;
