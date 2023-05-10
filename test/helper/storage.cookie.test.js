import CookieLibrary from 'js-cookie';
import expect from 'expect.js';
import sinon from 'sinon';

import CookieStorage from '../../src/helper/storage/cookie';
import windowHandler from '../../src/helper/window';
import Cookies from 'js-cookie';

const KEY = 'foo';
const VALUE = 'bar';

describe('storage.cookies', function () {
  let cookieStorage;

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

    cookieStorage = new CookieStorage({ legacySameSiteCookie: true });
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

    it('should fall back to the compatibility cookie if the main one isnt available', () => {
      CookieLibrary.get.restore();

      sinon.stub(CookieLibrary, 'get').callsFake(key => {
        switch (key) {
          case `_${KEY}_compat`:
            return VALUE;
          default:
            return undefined;
        }
      });

      const value = cookieStorage.getItem(KEY);
      expect(value).to.be(VALUE);
    });
  });
  describe('removeItem', function () {
    it('calls Cookie.remove', function (done) {
      CookieLibrary.remove.restore();
      sinon.stub(CookieLibrary, 'remove').callsFake();
      cookieStorage.removeItem(KEY);
      expect(Cookies.remove.firstCall.args).to.be.eql(['foo']);
      expect(Cookies.remove.secondCall.args).to.be.eql(['_foo_compat']);
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

    it('sets the secure flag on cookies when using the https protocol, and saves legacy compatibility cookie', function () {
      windowHandler.getWindow.restore();
      sinon.stub(windowHandler, 'getWindow').callsFake(function () {
        return {
          location: {
            protocol: 'https:'
          }
        };
      });

      CookieLibrary.set.restore();
      sinon.stub(CookieLibrary, 'set').callsFake(() => { });

      cookieStorage.setItem(KEY, VALUE, { expires: 2, test: true });

      expect(CookieLibrary.set.firstCall.args).to.be.eql([
        '_foo_compat',
        'bar',
        { expires: 2, test: true, secure: true }
      ]);

      expect(CookieLibrary.set.secondCall.args).to.be.eql([
        'foo',
        'bar',
        { expires: 2, test: true, secure: true, sameSite: 'none' }
      ]);
    });

    it('does not save a legacy compat cookie when legacySameSiteCookie: false', function () {
      cookieStorage = new CookieStorage();

      windowHandler.getWindow.restore();

      sinon.stub(windowHandler, 'getWindow').callsFake(function () {
        return {
          location: {
            protocol: 'https:'
          }
        };
      });

      CookieLibrary.set.restore();
      sinon.stub(CookieLibrary, 'set').callsFake(() => { });

      cookieStorage.setItem(KEY, VALUE, { expires: 2, test: true });

      expect(CookieLibrary.set.firstCall.args).to.be.eql([
        'foo',
        'bar',
        { expires: 2, test: true, secure: true, sameSite: 'none' }
      ]);
    });

    it('calls Cookie.set with a domain when cookieDomain is present', function () {
      const DOMAIN = '.example.com';
      cookieStorage = new CookieStorage({
        legacySameSiteCookie: true,
        cookieDomain: DOMAIN
      });

      cookieStorage.setItem(KEY, VALUE);

      expect(CookieLibrary.set.firstCall.args).to.be.eql([
        'foo',
        'bar',
        { expires: 1, domain: DOMAIN },
      ]);
    });
  });
});
