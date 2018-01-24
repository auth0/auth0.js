var expect = require('expect.js');
var stub = require('sinon').stub;

var storage = require('../../src/helper/storage');
var ssodata = require('../../src/helper/ssodata');

describe('helpers', function() {
  describe('ssodata', function() {
    afterEach(function() {
      if (storage.setItem.restore) {
        storage.setItem.restore();
      }
      if (storage.getItem.restore) {
        storage.getItem.restore();
      }
    });
    describe('get', function() {
      it('when there is data', function() {
        var expectedObject = { foo: 'bar' };
        stub(storage, 'getItem', function() {
          return JSON.stringify(expectedObject);
        });
        var data = ssodata.get();
        expect(data).to.be.eql(expectedObject);
      });
      it('when there is no data', function() {
        stub(storage, 'getItem', function() {
          return undefined;
        });
        var data = ssodata.get();
        expect(data).to.be(undefined);
      });
    });
    describe('set', function() {
      it('sets ssodata', function(done) {
        stub(storage, 'setItem', function(key, value) {
          expect(key).to.be('auth0.ssodata');
          expect(JSON.parse(value)).to.be.eql({
            lastUsedConnection: 'connection',
            lastUsedSub: 'sub'
          });
          done();
        });
        ssodata.set('connection', 'sub');
      });
    });
  });
});
