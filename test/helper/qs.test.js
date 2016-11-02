var expect = require('expect.js');

var qsBuilder = require('../../src/helper/qs-builder');

describe('helpers', function () {
  describe('qsBuilder', function () {
    it('return the formated query string', function () {
      var object = {
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      };

      var qs = qsBuilder(object);

      expect(qs).to.eql('attr1=attribute_1&attr2=attribute_2&attr3=attribute_3');
    });
  });
});
