var expect = require('expect.js');
var objectHelper = require('../src/helper/object')

describe('auth0.authentication', function () {

  describe('pick', function () {
    it('should return only the requested attributes', function () {

      var object = {
        attr1: "attribute_1",
        attr2: "attribute_2",
        attr3: "attribute_3"
      };

      var newObject = objectHelper.pick(['attr1', 'attr2'], object);

      expect(newObject).to.eql({
        attr1: "attribute_1",
        attr2: "attribute_2"
      });

      expect(object).to.eql({
        attr1: "attribute_1",
        attr2: "attribute_2",
        attr3: "attribute_3"
      });
    });
  })

  describe('extend', function () {
    it('shold merge objects attributes', function () {
      var object1 = {
        attr1: "attribute_1",
        attr2: "attribute_2"
      };

      var object2 = {
        attr3: "attribute_3"
      };

      var newObject = objectHelper.extend(object1, object2);

      expect(newObject).to.eql({
        attr1: "attribute_1",
        attr2: "attribute_2",
        attr3: "attribute_3"
      });

      expect(object1).to.eql({
        attr1: "attribute_1",
        attr2: "attribute_2"
      });

      expect(object2).to.eql({
        attr3: "attribute_3"
      });
    });

    it('shold merge objects attributes and override the first object ones', function () {
      var object1 = {
        attr1: "attribute_1",
        attr2: "attribute_2"
      };

      var object2 = {
        attr2: "attribute_2_2",
        attr3: "attribute_3"
      };

      var newObject = objectHelper.extend(object1, object2);

      expect(newObject).to.eql({
        attr1: "attribute_1",
        attr2: "attribute_2_2",
        attr3: "attribute_3"
      });

      expect(object1).to.eql({
        attr1: "attribute_1",
        attr2: "attribute_2"
      });

      expect(object2).to.eql({
        attr2: "attribute_2_2",
        attr3: "attribute_3"
      });
    });
  })

})