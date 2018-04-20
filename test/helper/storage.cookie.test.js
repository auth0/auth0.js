var CookieLibrary = require('js-cookie');
var expect = require('expect.js');
var stub = require('sinon').stub;
var spy = require('sinon').spy;

var CookieStorage = require('../../src/helper/storage/cookie');
var cookieStorage = new CookieStorage();
const KEY = 'foo';
const VALUE = 'bar';

describe('storage.cookies', function() {
  beforeEach(function() {
    stub(CookieLibrary, 'get', function(key) {
      expect(key).to.be(KEY);
      return VALUE;
    });
    stub(CookieLibrary, 'set', function(key, value) {
      expect(key).to.be(KEY);
      expect(value).to.be(VALUE);
    });
    stub(CookieLibrary, 'remove', function(key) {
      expect(key).to.be(KEY);
    });
  });
  afterEach(function() {
    CookieLibrary.get.restore();
    CookieLibrary.set.restore();
    CookieLibrary.remove.restore();
  });
  describe('getItem', function() {
    it('calls Cookie.get', function() {
      const value = cookieStorage.getItem(KEY);
      expect(value).to.be(VALUE);
    });
  });
  describe('removeItem', function() {
    it('calls Cookie.remove', function(done) {
      cookieStorage.removeItem(KEY);
      done();
    });
  });
  describe('setItem', function() {
    it('calls Cookie.set with default values', function() {
      cookieStorage.setItem(KEY, VALUE);
      expect(CookieLibrary.set.firstCall.args).to.be.eql(['foo', 'bar', { expires: 1 }]);
    });
    it('calls Cookie.set with custom values', function() {
      cookieStorage.setItem(KEY, VALUE, { expires: 2, test: true });
      expect(CookieLibrary.set.firstCall.args).to.be.eql([
        'foo',
        'bar',
        { expires: 2, test: true }
      ]);
    });
  });
});
