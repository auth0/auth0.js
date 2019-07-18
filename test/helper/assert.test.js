import expect from "expect.js";
import sinon from "sinon";

import assert from "../../src/helper/assert";

describe("helpers assert", function() {
  describe("isArray native", function() {
    it("should say it is a valid isArray", function() {
      expect(assert.isArray([1, 2, 3])).to.be.ok();
      expect(assert.isArray([])).to.be.ok();
    });

    it("should say it is NOT a valid isArray", function() {
      expect(assert.isArray({})).to.not.be.ok();
      expect(assert.isArray("hello")).to.not.be.ok();
      expect(assert.isArray(123)).to.not.be.ok();
    });
  });

  describe("isArray polyfill", function() {
    beforeEach(function() {
      sinon.stub(assert, "supportsIsArray").callsFake(function(message) {
        return false;
      });
    });

    afterEach(function() {
      assert.supportsIsArray.restore();
    });
    it("should show an error in the console", function() {
      expect(assert.isArray([1, 2, 3])).to.be.ok();
      expect(assert.isArray([])).to.be.ok();
    });
    it("should say it is NOT a valid isArray", function() {
      expect(assert.isArray({})).to.not.be.ok();
      expect(assert.isArray("hello")).to.not.be.ok();
      expect(assert.isArray(123)).to.not.be.ok();
    });
  });
});
