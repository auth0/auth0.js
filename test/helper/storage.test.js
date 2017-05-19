var expect = require('expect.js');
var stub = require('sinon').stub;

var windowHandler = require('../../src/helper/window');
var storage = require('../../src/helper/storage');

describe('helpers storage', function() {
  beforeEach(function() {
    storage.reload();
  });

  describe('with localstorage', function() {
    before(function() {
      var data = {};
      stub(windowHandler, 'getWindow', function() {
        return {
          localStorage: {
            getItem: function(key) {
              return data[key] ? data[key] : null;
            },
            removeItem: function(key) {
              if (data[key]) {
                delete data[key];
              }
            },
            setItem: function(key, value) {
              data[key] = value;
            }
          }
        };
      });
    });

    after(function() {
      windowHandler.getWindow.restore();
    });

    it('should store stuff', function() {
      expect(storage.getItem('data')).to.be(null);
      storage.setItem('data', 'text');
      expect(storage.getItem('data')).to.eql('text');
      storage.removeItem('data');
      expect(storage.getItem('data')).to.be(null);
    });
  });

  describe('without localstorage and with cookies', function() {
    before(function() {
      var document = {
        cookie: ''
      };
      stub(windowHandler, 'getWindow', function() {
        return {
          localStorage: {
            getItem: function(key) {
              throw new Error('localStorage not available');
            }
          }
        };
      });
      stub(windowHandler, 'getDocument', function() {
        return document;
      });
    });

    after(function() {
      windowHandler.getDocument.restore();
      windowHandler.getWindow.restore();
    });

    it('should store stuff', function() {
      expect(storage.getItem('data')).to.be(null);
      storage.setItem('data', 'text');
      expect(storage.getItem('data')).to.eql('text');
      storage.removeItem('data');
      // Cookies mock does not delete the cookie since it works as a variable not an actual method.
      // When it depetes the cookie it stays as an empty string. The browser should delete it
      // for real and return null instead
      expect(storage.getItem('data')).to.be('');
    });
  });

  describe('with dummy storage', function() {
    before(function() {
      stub(windowHandler, 'getWindow', function() {
        return {};
      });
      stub(windowHandler, 'getDocument', function() {
        return {};
      });
    });

    after(function() {
      windowHandler.getDocument.restore();
      windowHandler.getWindow.restore();
    });

    it('should ignore the data', function() {
      expect(storage.getItem('data')).to.be(null);
      storage.setItem('data', 'text');
      expect(storage.getItem('data')).to.be(null);
      storage.removeItem('data');
      expect(storage.getItem('data')).to.be(null);
    });
  });
});
