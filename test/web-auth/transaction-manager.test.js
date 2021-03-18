import expect from 'expect.js';
import sinon from 'sinon';

import TransactionManager from '../../src/web-auth/transaction-manager';
import random from '../../src/helper/random';
import windowHelper from '../../src/helper/window';
import Storage from '../../src/helper/storage';
import * as times from '../../src/helper/times';

context('TransactionManager', function() {
  beforeEach(function() {
    sinon.stub(windowHelper, 'getWindow').callsFake(function() {
      return { location: { host: 'myapp.com' } };
    });
    this.tm = new TransactionManager({ domain: 'myapp.auth0.com' });
  });
  afterEach(function() {
    windowHelper.getWindow.restore();
  });
  context('process', function() {
    beforeEach(function() {
      sinon
        .stub(TransactionManager.prototype, 'generateTransaction')
        .callsFake(function(appState, state, nonce, lastUsedConnection) {
          return {
            state: state || 'randomState',
            nonce: nonce || 'randomNonce',
            lastUsedConnection: lastUsedConnection
          };
        });
    });
    afterEach(function() {
      TransactionManager.prototype.generateTransaction.restore();
    });
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
      TransactionManager.prototype.generateTransaction.restore();
      sinon
        .stub(TransactionManager.prototype, 'generateTransaction')
        .callsFake(function(
          appState,
          state,
          nonce,
          lastUsedConnection,
          generateNonce
        ) {
          expect(generateNonce).to.be(true);
          return {
            state: state || 'randomState',
            nonce: nonce || 'randomNonce',
            lastUsedConnection: lastUsedConnection
          };
        });
      expect(
        this.tm.process({ responseType: 'code id_token', state: 'some-state' })
      ).to.be.eql({
        responseType: 'code id_token',
        state: 'some-state',
        nonce: 'randomNonce'
      });
    });
    it('returns same object when there is a state and a nonce', function() {
      expect(
        this.tm.process({
          responseType: 'code id_token',
          state: 'some-state',
          nonce: 'some-nonce'
        })
      ).to.be.eql({
        responseType: 'code id_token',
        state: 'some-state',
        nonce: 'some-nonce'
      });
    });
  });
  context('generateTransaction', function() {
    beforeEach(function() {
      sinon.stub(random, 'randomString').callsFake(function() {
        return 'randomString';
      });
      sinon.stub(Storage.prototype, 'setItem');
    });
    afterEach(function() {
      random.randomString.restore();
      Storage.prototype.setItem.restore();
    });
    context('when inside the hosted login page', function() {
      beforeEach(function() {
        windowHelper.getWindow.restore();

        sinon.stub(windowHelper, 'getWindow').callsFake(function() {
          return { location: { host: 'auth.myapp.com' } };
        });

        this.tm = new TransactionManager({ domain: 'auth.myapp.com' });
      });

      it('uses nonce/state when provided', function() {
        var result = this.tm.generateTransaction(
          'appState',
          'providedState',
          'providedNonce',
          null
        );

        expect(result).to.be.eql({
          state: 'providedState',
          nonce: 'providedNonce'
        });
      });

      it('uses random state/nonce when they are not provided', function() {
        var result = this.tm.generateTransaction(null, null, null, null, true);

        expect(result).to.be.eql({
          state: 'randomString',
          nonce: 'randomString'
        });
      });

      it('does not store transaction', function() {
        this.tm.generateTransaction(
          'appState',
          'providedState',
          'providedNonce',
          null
        );

        expect(Storage.prototype.setItem.calledOnce).to.be(false);
      });
    });
    context('when outside the hosted login page', function() {
      it('always stores random state', function() {
        var result = this.tm.generateTransaction(
          'appState',
          null,
          null,
          null,
          false
        );
        expect(result).to.be.eql({ state: 'randomString', nonce: null });
        expect(Storage.prototype.setItem.calledOnce).to.be(true);
        expect(Storage.prototype.setItem.lastCall.args[0]).to.be(
          'com.auth0.auth.randomString'
        );
        expect(Storage.prototype.setItem.lastCall.args[1]).to.be.eql({
          nonce: null,
          appState: 'appState',
          state: 'randomString',
          lastUsedConnection: null
        });
      });
      it('only stores random nonce when generateNonce is true', function() {
        var result = this.tm.generateTransaction(
          'appState',
          null,
          null,
          null,
          true
        );
        expect(result).to.be.eql({
          state: 'randomString',
          nonce: 'randomString'
        });
        expect(Storage.prototype.setItem.calledOnce).to.be(true);
        expect(Storage.prototype.setItem.lastCall.args[0]).to.be(
          'com.auth0.auth.randomString'
        );
        expect(Storage.prototype.setItem.lastCall.args[1]).to.be.eql({
          nonce: 'randomString',
          appState: 'appState',
          state: 'randomString',
          lastUsedConnection: null
        });
      });
      it('uses nonce/state when provided', function() {
        var result = this.tm.generateTransaction(
          'appState',
          'providedState',
          'providedNonce',
          null
        );
        expect(result).to.be.eql({
          state: 'providedState',
          nonce: 'providedNonce'
        });
        expect(Storage.prototype.setItem.calledOnce).to.be(true);
        expect(Storage.prototype.setItem.lastCall.args[0]).to.be(
          'com.auth0.auth.providedState'
        );
        expect(Storage.prototype.setItem.lastCall.args[1]).to.be.eql({
          nonce: 'providedNonce',
          appState: 'appState',
          state: 'providedState',
          lastUsedConnection: null
        });
      });
      it('uses lastUsedConnection when provided', function() {
        var result = this.tm.generateTransaction(
          'appState',
          'providedState',
          'providedNonce',
          'lastUsedConnection'
        );
        expect(result).to.be.eql({
          state: 'providedState',
          nonce: 'providedNonce'
        });
        expect(Storage.prototype.setItem.calledOnce).to.be(true);
        expect(Storage.prototype.setItem.lastCall.args[0]).to.be(
          'com.auth0.auth.providedState'
        );
        expect(Storage.prototype.setItem.lastCall.args[1]).to.be.eql({
          nonce: 'providedNonce',
          appState: 'appState',
          state: 'providedState',
          lastUsedConnection: 'lastUsedConnection'
        });
      });
      it('stores state with expires option equal to 30 mins', function() {
        this.tm.generateTransaction(
          'appState',
          'providedState',
          'providedNonce',
          null
        );
        expect(Storage.prototype.setItem.calledOnce).to.be(true);
        expect(typeof Storage.prototype.setItem.lastCall.args[2]).to.be(
          'object'
        );
        expect(Storage.prototype.setItem.lastCall.args[2]).to.be.eql({
          expires: times.MINUTES_30
        });
      });
      it('stores the organization ID when given', function() {
        this.tm.generateTransaction(
          'appState',
          'providedState',
          'providedNonce',
          null,
          null,
          'org_123'
        );

        expect(Storage.prototype.setItem.lastCall.args[1]).to.eql({
          nonce: 'providedNonce',
          appState: 'appState',
          state: 'providedState',
          lastUsedConnection: null,
          organization: 'org_123'
        })
      })      
    });
  });
  context('getStoredTransaction', function() {
    beforeEach(function() {
      sinon.stub(Storage.prototype, 'getItem').callsFake(function(state) {
        expect(state).to.be('com.auth0.auth.providedState');
        return { from: 'storage' };
      });
      sinon.spy(TransactionManager.prototype, 'clearTransaction');
    });
    afterEach(function() {
      Storage.prototype.getItem.restore();
      TransactionManager.prototype.clearTransaction.restore();
    });
    it('returns transaction data from storage', function() {
      var state = this.tm.getStoredTransaction('providedState');
      expect(state).to.be.eql({ from: 'storage' });
    });
    it('removes data from storage', function() {
      this.tm.getStoredTransaction('providedState');
      expect(
        TransactionManager.prototype.clearTransaction.firstCall.args[0]
      ).to.be('providedState');
    });
  });
  context('clearTransaction', function() {
    beforeEach(function() {
      sinon.stub(Storage.prototype, 'removeItem');
    });
    afterEach(function() {
      Storage.prototype.removeItem.restore();
    });
    it('removes data from storage', function() {
      this.tm.clearTransaction('providedState');
      expect(Storage.prototype.removeItem.calledOnce).to.be(true);
      expect(Storage.prototype.removeItem.lastCall.args[0]).to.be(
        'com.auth0.auth.providedState'
      );
    });
  });
});
