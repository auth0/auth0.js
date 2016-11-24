var expect = require('expect.js');
var stub = require('sinon').stub;

var windowHandler = require('../../src/helper/window');
var storage = require('../../src/helper/storage');

describe('helpers storage', function () {
  describe('with localstorage', function () {

    before(function(){
      var data = {};
      stub(windowHandler, 'getWindow', function () {
        return {
          localStorage: {
            getItem: function(key) { return data[key] ? data[key] : null; },
            removeItem: function(key) { if (data[key]) { delete data[key]; } },
            setItem: function(key, value) { data[key] = value; },
          }
        };
      });
    });

    after(function(){
      windowHandler.getWindow.restore();
    });

    it('should store stuff', function () {
      expect(storage.getItem('data')).to.be(null);
      storage.setItem('data', 'text');
      expect(storage.getItem('data')).to.eql('text');
      storage.removeItem('data');
      expect(storage.getItem('data')).to.be(null);
    });
  });

  describe('without localstorage', function () {
    before(function(){
      stub(windowHandler, 'getWindow', function () {
        return {
        };
      });
    });

    after(function(){
      windowHandler.getWindow.restore();
    });

    it('should ignore the data', function () {
      expect(storage.getItem('data')).to.be(null);
      storage.setItem('data', 'text');
      expect(storage.getItem('data')).to.be(null);
      storage.removeItem('data');
      expect(storage.getItem('data')).to.be(null);
    });
  });
});
