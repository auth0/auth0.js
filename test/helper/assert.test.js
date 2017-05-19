var expect = require('expect.js');
var stub = require('sinon').stub;

var assert = require('../../src/helper/assert');

describe('helpers assert', function() {
  describe('isArray native', function() {
    it('should say it is a valid isArray', function() {
      expect(assert.isArray([1, 2, 3])).to.be.ok();
      expect(assert.isArray([])).to.be.ok();
    });

    it('should say it is NOT a valid isArray', function() {
      expect(assert.isArray({})).to.not.be.ok();
      expect(assert.isArray('hello')).to.not.be.ok();
      expect(assert.isArray(123)).to.not.be.ok();
    });
  });

  describe('isArray polyfill', function() {
    beforeEach(function() {
      stub(assert, 'supportsIsArray', function(message) {
        return false;
      });
    });

    afterEach(function() {
      assert.supportsIsArray.restore();
    });
    it('should show an error in the console', function() {
      expect(assert.isArray([1, 2, 3])).to.be.ok();
      expect(assert.isArray([])).to.be.ok();
    });
    it('should say it is NOT a valid isArray', function() {
      expect(assert.isArray({})).to.not.be.ok();
      expect(assert.isArray('hello')).to.not.be.ok();
      expect(assert.isArray(123)).to.not.be.ok();
    });
  });
});
