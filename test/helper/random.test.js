import expect from 'expect.js';
import sinon from 'sinon';

import windowHelper from '../../src/helper/window';
import random from '../../src/helper/random';

describe('helpers random', function() {
  describe('randomString with crypto', function() {
    before(function() {
      sinon.stub(windowHelper, 'getWindow').callsFake(function() {
        return {
          crypto: {
            getRandomValues: function(bytes) {
              // Use values < 195 to pass rejection sampling (maxValid = 195)
              var values = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
              for (var i = 0; i < bytes.length; i++) {
                bytes[i] = values[i % values.length];
              }
              return bytes;
            }
          }
        };
      });
    });

    after(function() {
      windowHelper.getWindow.restore();
    });

    it('return the a random string', function() {
      var string = random.randomString(10);
      expect(string).to.eql('ABCDEFGHIJ');
    });
  });

  describe('randomString with msCrypto', function() {
    before(function() {
      sinon.stub(windowHelper, 'getWindow').callsFake(function() {
        return {
          msCrypto: {
            getRandomValues: function(bytes) {
              // Use values < 195 to pass rejection sampling (maxValid = 195)
              var values = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
              for (var i = 0; i < bytes.length; i++) {
                bytes[i] = values[i % values.length];
              }
              return bytes;
            }
          }
        };
      });
    });

    after(function() {
      windowHelper.getWindow.restore();
    });

    it('return the a random string', function() {
      var string = random.randomString(10);
      expect(string).to.eql('ABCDEFGHIJ');
    });
  });

  describe('randomString without crypto', function() {
    before(function() {
      sinon.stub(windowHelper, 'getWindow').callsFake(function() {
        return {};
      });
    });

    after(function() {
      windowHelper.getWindow.restore();
    });

    it('return the a random string', function() {
      var string = random.randomString(10);
      expect(string).to.be(null);
    });
  });

  describe('randomString rejection sampling', function() {
    it('should reject values >= 195 to avoid modulo bias', function() {
      var callCount = 0;
      sinon.stub(windowHelper, 'getWindow').callsFake(function() {
        return {
          crypto: {
            getRandomValues: function(bytes) {
              callCount++;
              if (callCount === 1) {
                // First call: return values that should be rejected (>= 195)
                bytes[0] = 200;
                bytes[1] = 255;
              } else {
                // Second call: return valid values
                bytes[0] = 10; // 'A'
                bytes[1] = 11; // 'B'
              }
              return bytes;
            }
          }
        };
      });

      var string = random.randomString(2);
      expect(string).to.eql('AB');
      expect(callCount).to.be(2); // Should have made 2 calls due to rejection

      windowHelper.getWindow.restore();
    });
  });
});
