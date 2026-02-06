import expect from 'expect.js';
import sinon from 'sinon';

import windowHelper from '../../src/helper/window';
import random from '../../src/helper/random';

describe('helpers random', function () {
  describe('randomString with crypto', function () {
    before(function () {
      sinon.stub(windowHelper, 'getWindow').callsFake(function () {
        return {
          crypto: {
            getRandomValues: function (arr) {
              // Fill the array with values 10-19 (all < 198, so no rejection)
              for (var i = 0; i < arr.length; i++) {
                arr[i] = 10 + (i % 10);
              }
              return arr;
            }
          }
        };
      });
    });

    after(function () {
      windowHelper.getWindow.restore();
    });

    it('return the a random string', function () {
      var string = random.randomString(10);
      expect(string).to.eql('ABCDEFGHIJ');
    });
  });

  describe('randomString with msCrypto', function () {
    before(function () {
      sinon.stub(windowHelper, 'getWindow').callsFake(function () {
        return {
          msCrypto: {
            getRandomValues: function (arr) {
              // Fill the array with values 10-19 (all < 198, so no rejection)
              for (var i = 0; i < arr.length; i++) {
                arr[i] = 10 + (i % 10);
              }
              return arr;
            }
          }
        };
      });
    });

    after(function () {
      windowHelper.getWindow.restore();
    });

    it('return the a random string', function () {
      var string = random.randomString(10);
      expect(string).to.eql('ABCDEFGHIJ');
    });
  });

  describe('randomString without crypto', function () {
    before(function () {
      sinon.stub(windowHelper, 'getWindow').callsFake(function () {
        return {};
      });
    });

    after(function () {
      windowHelper.getWindow.restore();
    });

    it('return the a random string', function () {
      var string = random.randomString(10);
      expect(string).to.be(null);
    });
  });

  describe('randomString invalid length handling', function () {
    it('returns empty string for zero length', function () {
      expect(random.randomString(0)).to.eql('');
    });

    it('returns empty string for negative length', function () {
      expect(random.randomString(-5)).to.eql('');
    });
  });

  describe('randomString rejection sampling', function () {
    var callCount;

    before(function () {
      callCount = 0;
      sinon.stub(windowHelper, 'getWindow').callsFake(function () {
        return {
          crypto: {
            getRandomValues: function (arr) {
              callCount += 1;
              if (callCount === 1) {
                for (var i = 0; i < arr.length; i++) {
                  arr[i] = 200; // rejected values
                }
              } else {
                for (var j = 0; j < arr.length; j++) {
                  arr[j] = 10 + j;
                }
              }
              return arr;
            }
          }
        };
      });
    });

    after(function () {
      windowHelper.getWindow.restore();
    });

    it('keeps sampling until enough valid values collected', function () {
      var string = random.randomString(5);
      expect(string.length).to.eql(5);
      expect(callCount).to.be.greaterThan(1);
    });
  });
});
