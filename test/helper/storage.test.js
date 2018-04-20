var expect = require('expect.js');
var stub = require('sinon').stub;
var spy = require('sinon').spy;

var windowHandler = require('../../src/helper/window');
var StorageHandler = require('../../src/helper/storage/handler');
var storage = require('../../src/helper/storage');

describe('helpers storage', function() {
  describe('setItem', function() {
    beforeEach(function() {
      spy(StorageHandler.prototype, 'setItem');
    });
    afterEach(function() {
      StorageHandler.prototype.setItem.restore();
    });
    it('should call setItem when value is a string', function() {
      storage.setItem('data', 'text', { options: true });
      console.log(StorageHandler.prototype.setItem.toString());
      expect(StorageHandler.prototype.setItem.firstCall.args).to.be.eql([
        'data',
        '"text"',
        { options: true }
      ]);
    });
    it('should call setItem with a JSON string when value is an object', function() {
      storage.setItem('data', { myProp: true }, { options: true });
      expect(StorageHandler.prototype.setItem.firstCall.args).to.be.eql([
        'data',
        JSON.stringify({ myProp: true }),
        { options: true }
      ]);
    });
  });
  describe('getItem', function() {
    afterEach(function() {
      StorageHandler.prototype.getItem.restore();
    });
    it('should call getItem and return string when value is a string', function() {
      stub(StorageHandler.prototype, 'getItem', function(key) {
        expect(key).to.be('data');
        return 'the-value';
      });
      var theValue = storage.getItem('data');
      expect(theValue).to.be('the-value');
    });
    it('should call getItem and return an object when value is a JSON string', function() {
      stub(StorageHandler.prototype, 'getItem', function(key) {
        expect(key).to.be('data');
        return JSON.stringify({ theObject: true });
      });
      var theObject = storage.getItem('data');
      expect(theObject).to.be.eql({ theObject: true });
    });
    it('should call getItem and return undefined when value is undefined', function() {
      stub(StorageHandler.prototype, 'getItem', function(key) {
        expect(key).to.be('data');
        return undefined;
      });
      var nothing = storage.getItem('data');
      expect(nothing).to.be(undefined);
    });
    it('should call getItem and return null when value is null', function() {
      stub(StorageHandler.prototype, 'getItem', function(key) {
        expect(key).to.be('data');
        return null;
      });
      var noValue = storage.getItem('data');
      expect(noValue).to.be(null);
    });
  });
  describe('removeItem', () => {
    beforeEach(function() {
      spy(StorageHandler.prototype, 'removeItem');
    });
    afterEach(function() {
      StorageHandler.prototype.removeItem.restore();
    });
    it('should call removeItem', function() {
      storage.removeItem('data');
      expect(StorageHandler.prototype.removeItem.firstCall.args).to.be.eql(['data']);
    });
  });
});
