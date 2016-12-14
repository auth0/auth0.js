function DummyStorage() {}

DummyStorage.prototype.getItem = function (key) { return null; };

DummyStorage.prototype.removeItem = function (key) {};

DummyStorage.prototype.setItem = function (key, value) {};

module.exports = DummyStorage;