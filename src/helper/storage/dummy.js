function DummyStorage() {}

DummyStorage.prototype.getItem = function() {
  return null;
};

DummyStorage.prototype.removeItem = function() {};

DummyStorage.prototype.setItem = function() {};

module.exports = DummyStorage;
