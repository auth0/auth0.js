import expect from 'expect.js';
import { stub } from 'sinon';

import Storage from '../../src/helper/storage';
import SSODataStorage from '../../src/helper/ssodata';

describe('helpers', function() {
  var ssodata;
  beforeEach(function() {
    ssodata = new SSODataStorage({});
  });
  describe('ssodata', function() {
    afterEach(function() {
      if (Storage.prototype.setItem.restore) {
        Storage.prototype.setItem.restore();
      }
      if (Storage.prototype.getItem.restore) {
        Storage.prototype.getItem.restore();
      }
    });
    describe('get', function() {
      it('when there is data', function() {
        var expectedObject = { foo: 'bar' };
        stub(Storage.prototype, 'getItem', function() {
          return JSON.stringify(expectedObject);
        });
        var data = ssodata.get();
        expect(data).to.be.eql(expectedObject);
      });
      it('when there is no data', function() {
        stub(Storage.prototype, 'getItem', function() {
          return undefined;
        });
        var data = ssodata.get();
        expect(data).to.be(undefined);
      });
    });
    describe('set', function() {
      it('sets ssodata', function(done) {
        stub(Storage.prototype, 'setItem', function(key, value) {
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
