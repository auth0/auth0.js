import expect from 'expect.js';

import maxAgeHelper from '../../src/helper/max-age';

describe('helpers max-age', function () {
  describe('normalise', function () {
    it('returns numbers as they are, including 0 and negative numbers', function () {
      expect(maxAgeHelper.normalise(300)).to.be(300);
      expect(maxAgeHelper.normalise(0)).to.be(0);
      expect(maxAgeHelper.normalise(-1)).to.be(-1);
      expect(maxAgeHelper.normalise(1.5)).to.be(1.5);
    });

    it('converts numeric strings, including zero strings', function () {
      expect(maxAgeHelper.normalise('300')).to.be(300);
      expect(maxAgeHelper.normalise(' 300 ')).to.be(300);
      expect(maxAgeHelper.normalise('0')).to.be(0);
      expect(maxAgeHelper.normalise(' 0 ')).to.be(0);
      expect(maxAgeHelper.normalise('0.0')).to.be(0);
    });

    it('returns null for values that mean "not set"', function () {
      [undefined, null, '', '   ', false, true, [], [300], {}, NaN].forEach(function (value) {
        expect(maxAgeHelper.normalise(value)).to.be(null);
      });
    });

    it('returns null for non numeric strings', function () {
      expect(maxAgeHelper.normalise('abc')).to.be(null);
      expect(maxAgeHelper.normalise('300abc')).to.be(null);
    });
  });
});
