var expect = require('expect.js');
var stub = require('sinon').stub;

var windowHandler = require('../../src/helper/window');
var StorageHandler = require('../../src/helper/storage/handler');
var CookieStorage = require('../../src/helper/storage/cookie');
var DummyStorage = require('../../src/helper/storage/dummy');

function MockLocalStorage() {}
MockLocalStorage.prototype.getItem = function() {
  throw new Error('fail');
};
MockLocalStorage.prototype.removeItem = function() {
  throw new Error('fail');
};
MockLocalStorage.prototype.setItem = function() {
  throw new Error('fail');
};

describe('helpers storage handler', function() {
  it('should use localStorage by default', function() {
    stub(windowHandler, 'getWindow', function(message) {
      return {
        localStorage: new MockLocalStorage()
      };
    });

    var handler = new StorageHandler();
    expect(handler.storage).to.be.a(MockLocalStorage);

    windowHandler.getWindow.restore();
  });

  it('should use cookie storage when localstorage is not available', function() {
    stub(windowHandler, 'getWindow', function(message) {});

    var handler = new StorageHandler();
    expect(handler.storage).to.be.a(CookieStorage);

    windowHandler.getWindow.restore();
  });
  it('should use cookie storage when localstorage throws an error', function() {
    stub(windowHandler, 'getWindow', function(message) {
      return {
        get localStorage() {
          throw new Error('asdasd');
        }
      };
    });

    var handler = new StorageHandler();
    expect(handler.storage).to.be.a(CookieStorage);

    windowHandler.getWindow.restore();
  });

  it('should use cookie storage is localstorage fails with getItem', function() {
    stub(windowHandler, 'getWindow', function(message) {
      return {
        localStorage: new MockLocalStorage()
      };
    });
    stub(windowHandler, 'getDocument', function(message) {
      return {
        cookie: ''
      };
    });

    var handler = new StorageHandler();

    expect(handler.storage).to.be.a(MockLocalStorage);
    handler.getItem('pepe');

    expect(handler.storage).to.be.a(CookieStorage);

    windowHandler.getWindow.restore();
    windowHandler.getDocument.restore();
  });

  it('should use cookie storage is localstorage fails with setItem', function() {
    var document = {
      cookie: ''
    };
    stub(windowHandler, 'getWindow', function(message) {
      return {
        localStorage: new MockLocalStorage()
      };
    });
    stub(windowHandler, 'getDocument', function(message) {
      return document;
    });
    stub(Date.prototype, 'getTime', function(message) {
      return 0;
    });

    var handler = new StorageHandler();

    expect(handler.storage).to.be.a(MockLocalStorage);
    handler.setItem('some', 'value');

    expect(handler.storage).to.be.a(CookieStorage);
    expect(document.cookie).to.be('some=dmFsdWU=; expires=Fri, 02 Jan 1970 00:00:00 GMT; path=/');

    windowHandler.getWindow.restore();
    windowHandler.getDocument.restore();
    Date.prototype.getTime.restore();
  });

  it('should use cookie storage is localstorage fails with removeItem', function() {
    var document = {
      cookie: ''
    };
    stub(windowHandler, 'getWindow', function(message) {
      return {
        localStorage: new MockLocalStorage()
      };
    });
    stub(windowHandler, 'getDocument', function(message) {
      return document;
    });
    stub(Date.prototype, 'getTime', function(message) {
      return 0;
    });

    var handler = new StorageHandler();

    expect(handler.storage).to.be.a(MockLocalStorage);
    handler.removeItem('some');

    expect(handler.storage).to.be.a(CookieStorage);
    expect(document.cookie).to.be('some=; expires=Wed, 31 Dec 1969 00:00:00 GMT; path=/');

    windowHandler.getWindow.restore();
    windowHandler.getDocument.restore();
    Date.prototype.getTime.restore();
  });

  it('should failover to dummy', function() {
    var document = {
      cookie: ''
    };
    stub(windowHandler, 'getWindow', function(message) {
      return {
        localStorage: new MockLocalStorage()
      };
    });

    var handler = new StorageHandler();

    expect(handler.storage).to.be.a(MockLocalStorage);
    handler.failover();

    expect(handler.storage).to.be.a(CookieStorage);
    handler.failover();

    expect(handler.storage).to.be.a(DummyStorage);
    handler.failover();

    expect(handler.storage).to.be.a(DummyStorage);

    windowHandler.getWindow.restore();
  });
});
