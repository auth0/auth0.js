var expect = require('expect.js');

var qs = require('../../src/helper/qs');

describe('helpers qs', function () {
  describe('build', function () {
    it('return the formated query string', function () {
      var object = {
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      };

      var qString = qs.build(object);

      expect(qString).to.eql('attr1=attribute_1&attr2=attribute_2&attr3=attribute_3');
    });
  });

  describe('parse', function () {
    it('return the formated query string', function () {
      var qString = 'attr1=attribute_1&attr2=attribute_2&attr3=attribute_3';

      var object = qs.parse(qString);

      expect(object).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      });
    });
  });

  describe('build and parse', function () {
    it('return the formated query string', function () {
      var object = {
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      };

      var new_object = qs.parse(qs.build(object));

      expect(new_object).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      });
    });
  });
});
