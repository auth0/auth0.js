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
            getRandomValues: function() {
              return [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
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
            getRandomValues: function() {
              return [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
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
});
