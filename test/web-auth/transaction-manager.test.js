var expect = require('expect.js');
var stub = require('sinon').stub;

var TransactionManager = require('../../src/web-auth/transaction-manager');
var objectHelper = require('../../src/helper/object');

context('TransactionManager', function() {
  before(function() {
    stub(TransactionManager.prototype, 'generateTransaction', function(appState, state, nonce) {
      return { state: state || 'randomState', nonce: nonce || 'randomNonce' };
    });
  });
  after(function() {
    TransactionManager.prototype.generateTransaction.restore();
  });
  beforeEach(function() {
    this.tm = new TransactionManager();
  });
  context('process', function() {
    it('throws when responseType is not available', function() {
      var _this = this;
      expect(function() {
        _this.tm.process({});
      }).to.throwException('responseType is required');
    });
    it('generates a state when a state is not provided', function() {
      expect(this.tm.process({ responseType: 'code' })).to.be.eql({
        responseType: 'code',
        state: 'randomState'
      });
    });
    it('generates a nonce when responseType contains id_token and a nonce is not provided', function() {
      expect(this.tm.process({ responseType: 'code id_token', state: 'some-state' })).to.be.eql({
        responseType: 'code id_token',
        state: 'some-state',
        nonce: 'randomNonce'
      });
    });
    it('returns same object when there is a state and a nonce', function() {
      expect(
        this.tm.process({ responseType: 'code id_token', state: 'some-state', nonce: 'some-nonce' })
      ).to.be.eql({
        responseType: 'code id_token',
        state: 'some-state',
        nonce: 'some-nonce'
      });
    });
  });
});
