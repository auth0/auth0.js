var expect = require('expect.js');
var stub = require('sinon').stub;

var objectAssign = require('../../src/helper/object-assign');
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

    it('shold merge objects attributes with polyfill', function () {

      stub(objectAssign, 'get', function() {
        return objectAssign.objectAssignPolyfill;
      });

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

      objectAssign.get.restore();
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

  describe('toSnakeCase', function () {
    it('should change the casing to all the attributes', function () {
      var object = {
        attrName1: 'attribute_1',
        attrName22: 'attribute_2',
        attrNAME3: 'attribute_3',
        someObj: {
          objAtt1: 'asd',
          objAtt2: '123'
        }
      };

      var newObject = objectHelper.toSnakeCase(object);

      expect(object).to.eql({
        attrName1: 'attribute_1',
        attrName22: 'attribute_2',
        attrNAME3: 'attribute_3',
        someObj: {
          objAtt1: 'asd',
          objAtt2: '123'
        }
      });

      expect(newObject).to.eql({
        attr_name_1: 'attribute_1',
        attr_name_22: 'attribute_2',
        attr_name_3: 'attribute_3',
        some_obj: {
          obj_att_1: 'asd',
          obj_att_2: '123'
        }
      });
    });

    it('should change the casing to all the attributes that are not blacklisted', function () {
      var object = {
        attrName1: 'attribute_1',
        attrName22: 'attribute_2',
        attrNAME3: 'attribute_3'
      };

      var newObject = objectHelper.toSnakeCase(object, ['attrName22']);

      expect(object).to.eql({
        attrName1: 'attribute_1',
        attrName22: 'attribute_2',
        attrNAME3: 'attribute_3'
      });

      expect(newObject).to.eql({
        attr_name_1: 'attribute_1',
        attrName22: 'attribute_2',
        attr_name_3: 'attribute_3'
      });
    });
  });

  describe('toCamelCase', function () {
    it('should change the casing to all the attributes', function () {
      var object = {
        attr_name_1: 'attribute_1',
        attr_name_22: 'attribute_2',
        attr__name_3: 'attribute_3',
        some_obj: {
          obj_att_1: 'asdf',
          obj_att_2: '1234'
        }
      };

      var newObject = objectHelper.toCamelCase(object);

      expect(object).to.eql({
        attr_name_1: 'attribute_1',
        attr_name_22: 'attribute_2',
        attr__name_3: 'attribute_3',
        some_obj: {
          obj_att_1: 'asdf',
          obj_att_2: '1234'
        }
      });

      expect(newObject).to.eql({
        attrName1: 'attribute_1',
        attrName22: 'attribute_2',
        attrName3: 'attribute_3',
        someObj: {
          objAtt1: 'asdf',
          objAtt2: '1234'
        }
      });
    });

    it('should change the casing to all the attributes that are not blacklisted', function () {
      var object = {
        attr_name_1: 'attribute_1',
        attr_name_22: 'attribute_2',
        attr__name_3: 'attribute_3'
      };

      var newObject = objectHelper.toCamelCase(object, ['attr_name_22']);

      expect(object).to.eql({
        attr_name_1: 'attribute_1',
        attr_name_22: 'attribute_2',
        attr__name_3: 'attribute_3'
      });

      expect(newObject).to.eql({
        attrName1: 'attribute_1',
        attr_name_22: 'attribute_2',
        attrName3: 'attribute_3'
      });
    });
  });
});
