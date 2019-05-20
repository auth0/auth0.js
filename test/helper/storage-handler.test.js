import expect from 'expect.js';
import { stub, spy } from 'sinon';

import windowHandler from '../../src/helper/window';
import StorageHandler from '../../src/helper/storage/handler';
import CookieStorage from '../../src/helper/storage/cookie';
import DummyStorage from '../../src/helper/storage/dummy';

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
  beforeEach(function() {
    stub(windowHandler, 'getWindow', function(message) {
      return {
        localStorage: new MockLocalStorage()
      };
    });
  });
  afterEach(function() {
    windowHandler.getWindow.restore();
  });
  it('should use CookieStorage by default', function() {
    var handler = new StorageHandler({});
    expect(handler.storage).to.be.a(CookieStorage);
  });
  it('should use localStorage when __tryLocalStorageFirst is true', function() {
    var handler = new StorageHandler({ __tryLocalStorageFirst: true });
    expect(handler.storage).to.be.a(MockLocalStorage);
  });
  describe('when using localStorage', function() {
    let setItemSpy;
    let getItemStub;
    let removeItemSpy;
    beforeEach(function() {
      windowHandler.getWindow.restore();

      setItemSpy = spy();
      getItemStub = stub().returns('test');
      removeItemSpy = spy();

      stub(windowHandler, 'getWindow', function() {
        return {
          localStorage: {
            setItem: setItemSpy,
            getItem: getItemStub,
            removeItem: removeItemSpy
          }
        };
      });
    });
    it('calls getItem correctly', function() {
      var key = 'foo';
      var handler = new StorageHandler({ __tryLocalStorageFirst: true });
      expect(handler.getItem(key)).to.be('test');
      expect(getItemStub.firstCall.args).to.be.eql([key]);
    });
    it('calls setItem correctly', function() {
      var key = 'foo';
      var value = 'bar';
      var handler = new StorageHandler({ __tryLocalStorageFirst: true });
      handler.setItem(key, value, {});
      expect(setItemSpy.firstCall.args).to.be.eql([key, value, {}]);
    });
    it('calls removeItem correctly', function() {
      var key = 'foo';
      var handler = new StorageHandler({ __tryLocalStorageFirst: true });
      handler.removeItem(key);
      expect(removeItemSpy.firstCall.args).to.be.eql([key]);
    });
  });
  describe('should use cookie storage', function() {
    it('when __tryLocalStorageFirst is true but localStorage is not available', function() {
      windowHandler.getWindow.restore();
      stub(windowHandler, 'getWindow', function(message) {});

      var handler = new StorageHandler({ __tryLocalStorageFirst: true });
      expect(handler.storage).to.be.a(CookieStorage);
    });
    it('when localstorage throws an error', function() {
      windowHandler.getWindow.restore();
      stub(windowHandler, 'getWindow', function(message) {
        return {
          get localStorage() {
            throw new Error('asdasd');
          }
        };
      });

      var handler = new StorageHandler({ __tryLocalStorageFirst: true });
      expect(handler.storage).to.be.a(CookieStorage);
    });
    it('when localstorage fails with getItem', function() {
      spy(CookieStorage.prototype, 'getItem');

      var handler = new StorageHandler({ __tryLocalStorageFirst: true });

      expect(handler.storage).to.be.a(MockLocalStorage);
      handler.getItem('pepe');

      expect(handler.storage).to.be.a(CookieStorage);
      expect(CookieStorage.prototype.getItem.firstCall.args).to.be.eql(['pepe']);

      CookieStorage.prototype.getItem.restore();
    });
    it('when localstorage fails with setItem', function() {
      spy(CookieStorage.prototype, 'setItem');

      var handler = new StorageHandler({ __tryLocalStorageFirst: true });

      expect(handler.storage).to.be.a(MockLocalStorage);
      handler.setItem('some', 'value', { options: true });

      expect(handler.storage).to.be.a(CookieStorage);
      expect(CookieStorage.prototype.setItem.firstCall.args).to.be.eql([
        'some',
        'value',
        { options: true }
      ]);

      CookieStorage.prototype.setItem.restore();
    });
    it('when localstorage fails with removeItem', function() {
      spy(CookieStorage.prototype, 'removeItem');

      var handler = new StorageHandler({ __tryLocalStorageFirst: true });

      expect(handler.storage).to.be.a(MockLocalStorage);
      handler.removeItem('some');

      expect(handler.storage).to.be.a(CookieStorage);
      expect(CookieStorage.prototype.removeItem.firstCall.args).to.be.eql(['some']);

      CookieStorage.prototype.removeItem.restore();
    });
  });

  it('should failover to from localStorage to CookieStorage to DummyStorage', function() {
    var handler = new StorageHandler({ __tryLocalStorageFirst: true });

    expect(handler.storage).to.be.a(MockLocalStorage);
    handler.failover();

    expect(handler.storage).to.be.a(CookieStorage);
    handler.failover();

    expect(handler.storage).to.be.a(DummyStorage);
    handler.failover();

    expect(handler.storage).to.be.a(DummyStorage);
    expect(handler.storage.getItem()).to.be(null);
  });
});
