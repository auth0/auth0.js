var expect = require('expect.js');

var objectHelper = require('../../src/helper/object');

describe('helpers', function () {
  describe('pick', function () {
    it('should return only the requested attributes', function () {
      var object = {
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      };

      var newObject = objectHelper.pick(object, ['attr1', 'attr2']);

      expect(newObject).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2'
      });

      expect(object).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      });
    });

    it('should ignore missing keys', function () {
      var object = {
        attr1: 'attribute_1',
        attr3: 'attribute_3'
      };

      var newObject = objectHelper.pick(object, ['attr1', 'attr2']);

      expect(newObject).to.eql({
        attr1: 'attribute_1'
      });

      expect(object).to.eql({
        attr1: 'attribute_1',
        attr3: 'attribute_3'
      });
    });
  });

  describe('extend', function () {
    it('shold merge objects attributes', function () {
      var object1 = {
        attr1: 'attribute_1',
        attr2: 'attribute_2'
      };

      var object2 = {
        attr3: 'attribute_3'
      };

      var newObject = objectHelper.extend(object1, object2);

      expect(newObject).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      });

      expect(object1).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2'
      });

      expect(object2).to.eql({
        attr3: 'attribute_3'
      });
    });

    it('shold merge objects attributes and override the first object ones', function () {
      var object1 = {
        attr1: 'attribute_1',
        attr2: 'attribute_2'
      };

      var object2 = {
        attr2: 'attribute_2_2',
        attr3: 'attribute_3'
      };

      var newObject = objectHelper.extend(object1, object2);

      expect(newObject).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2_2',
        attr3: 'attribute_3'
      });

      expect(object1).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2'
      });

      expect(object2).to.eql({
        attr2: 'attribute_2_2',
        attr3: 'attribute_3'
      });
    });
  });

  describe('merge', function () {
    it('shold merge without pick', function () {
      var object1 = {
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      };

      var object2 = {
        attrA: 'attribute_A',
        attrB: 'attribute_B',
        attrC: 'attribute_C'
      };

      var newObject = objectHelper.merge(object1).with(object2);

      expect(newObject).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3',
        attrA: 'attribute_A',
        attrB: 'attribute_B',
        attrC: 'attribute_C'
      });

      expect(object1).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      });

      expect(object2).to.eql({
        attrA: 'attribute_A',
        attrB: 'attribute_B',
        attrC: 'attribute_C'
      });
    });

    it('shold merge picking attributes of the base object', function () {
      var object1 = {
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      };

      var object2 = {
        attrA: 'attribute_A',
        attrB: 'attribute_B',
        attrC: 'attribute_C'
      };

      var newObject = objectHelper.merge(object1, ['attr1', 'attr2']).with(object2);

      expect(newObject).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attrA: 'attribute_A',
        attrB: 'attribute_B',
        attrC: 'attribute_C'
      });

      expect(object1).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      });

      expect(object2).to.eql({
        attrA: 'attribute_A',
        attrB: 'attribute_B',
        attrC: 'attribute_C'
      });
    });

    it('shold merge picking attributes of the second object', function () {
      var object1 = {
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      };

      var object2 = {
        attrA: 'attribute_A',
        attrB: 'attribute_B',
        attrC: 'attribute_C'
      };

      var newObject = objectHelper.merge(object1).with(object2, ['attrA', 'attrC']);

      expect(newObject).to.eql({ attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3',
        attrA: 'attribute_A',
        attrC: 'attribute_C'
      });

      expect(object1).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      });

      expect(object2).to.eql({
        attrA: 'attribute_A',
        attrB: 'attribute_B',
        attrC: 'attribute_C'
      });
    });

    it('shold merge picking attributes of both objects', function () {
      var object1 = {
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      };

      var object2 = {
        attrA: 'attribute_A',
        attrB: 'attribute_B',
        attrC: 'attribute_C'
      };

      var newObject = objectHelper.merge(object1, ['attr2', 'attr3']).with(object2, ['attrA', 'attrC']);

      expect(newObject).to.eql({
        attr2: 'attribute_2',
        attr3: 'attribute_3',
        attrA: 'attribute_A',
        attrC: 'attribute_C'
      });

      expect(object1).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      });

      expect(object2).to.eql({
        attrA: 'attribute_A',
        attrB: 'attribute_B',
        attrC: 'attribute_C'
      });
    });
  });

  describe('blacklist', function () {
    it('should return all the attributes not blacklisted', function () {
      var object = {
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      };

      var newObject = objectHelper.blacklist(object, ['attr1', 'attr2']);

      expect(newObject).to.eql({
        attr3: 'attribute_3'
      });

      expect(object).to.eql({
        attr1: 'attribute_1',
        attr2: 'attribute_2',
        attr3: 'attribute_3'
      });
    });
  });
});
