var expect = require('expect.js');
var stub = require('sinon').stub;

var information = require('../../src/helper/information');

describe('helpers information', function () {
  describe('error', function () {
    beforeEach(function() {
      stub(console, 'error', function (message) {
        expect(message).to.be('some error message');
      });
    });

    afterEach(function() {
      console.error.restore();
    });

    it('it should show an error in the console', function () {
      information.error('some error message');
    });
  });
});
