import CookieLibrary from 'js-cookie';
import expect from 'expect.js';
import sinon from 'sinon';

import CookieStorage from '../../src/helper/storage/cookie';
import windowHandler from '../../src/helper/window';

var cookieStorage = new CookieStorage();
const KEY = 'foo';
const VALUE = 'bar';

describe('storage.cookies', function () {
  beforeEach(function () {
    sinon.stub(CookieLibrary, 'get').callsFake(function (key) {
      expect(key).to.be(KEY);
      return VALUE;
    });
    sinon.stub(CookieLibrary, 'set').callsFake(function (key, value) {
      expect(key).to.be(KEY);
      expect(value).to.be(VALUE);
    });
    sinon.stub(CookieLibrary, 'remove').callsFake(function (key) {
      expect(key).to.be(KEY);
    });
  });
  afterEach(function () {
    CookieLibrary.get.restore();
    CookieLibrary.set.restore();
    CookieLibrary.remove.restore();
  });
  describe('getItem', function () {
    it('calls Cookie.get', function () {
      const value = cookieStorage.getItem(KEY);
      expect(value).to.be(VALUE);
    });
  });
  describe('removeItem', function () {
    it('calls Cookie.remove', function (done) {
      cookieStorage.removeItem(KEY);
      done();
    });
  });
  describe('setItem', function () {
    beforeEach(function () {
      sinon.stub(windowHandler, 'getWindow').callsFake(function () {
        return {
          location: {
            protocol: 'http:'
          }
        };
      });
    });

    afterEach(function () {
      windowHandler.getWindow.restore();
    });

    it('calls Cookie.set with default values', function () {
      cookieStorage.setItem(KEY, VALUE);

      expect(CookieLibrary.set.firstCall.args).to.be.eql([
        'foo',
        'bar',
        { expires: 1 }
      ]);
    });

    it('calls Cookie.set with custom values', function () {
      cookieStorage.setItem(KEY, VALUE, { expires: 2, test: true });

      expect(CookieLibrary.set.firstCall.args).to.be.eql([
        'foo',
        'bar',
        { expires: 2, test: true }
      ]);
    });

    it('sets the secure flag on cookies when using the https protocol', function () {
      windowHandler.getWindow.restore();
      sinon.stub(windowHandler, 'getWindow').callsFake(function () {
        return {
          location: {
            protocol: 'https:'
          }
        };
      });

      cookieStorage.setItem(KEY, VALUE, { expires: 2, test: true });

      expect(CookieLibrary.set.firstCall.args).to.be.eql([
        'foo',
        'bar',
        { expires: 2, test: true, secure: true, sameSite: 'none' }
      ]);
    });
  });
});
