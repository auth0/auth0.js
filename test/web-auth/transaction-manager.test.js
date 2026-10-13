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
    it('forwards options.max_age to generateTransaction when options.maxAge is null', function() {
      TransactionManager.prototype.generateTransaction.restore();
      sinon
        .stub(TransactionManager.prototype, 'generateTransaction')
        .callsFake(function(
          appState,
          state,
          nonce,
          lastUsedConnection,
          generateNonce,
          organization,
          maxAge
        ) {
          expect(maxAge).to.be(300);
          return {
            state: state || 'randomState',
            nonce: nonce || 'randomNonce',
            lastUsedConnection: lastUsedConnection
          };
        });
      this.tm.process({ responseType: 'code', state: 'some-state', maxAge: null, max_age: 300 });
    });
    it('forwards options.max_age to generateTransaction when options.maxAge is not set', function() {
      TransactionManager.prototype.generateTransaction.restore();
      sinon
        .stub(TransactionManager.prototype, 'generateTransaction')
        .callsFake(function(
          appState,
          state,
          nonce,
          lastUsedConnection,
          generateNonce,
          organization,
          maxAge
        ) {
          expect(maxAge).to.be(300);
          return {
            state: state || 'randomState',
            nonce: nonce || 'randomNonce',
            lastUsedConnection: lastUsedConnection
          };
        });
      this.tm.process({ responseType: 'code', state: 'some-state', max_age: 300 });
    });
    it('forwards options.maxAge (including 0) to generateTransaction', function() {
      TransactionManager.prototype.generateTransaction.restore();
      sinon
        .stub(TransactionManager.prototype, 'generateTransaction')
        .callsFake(function(
          appState,
          state,
          nonce,
          lastUsedConnection,
          generateNonce,
          organization,
          maxAge
        ) {
          expect(maxAge).to.be(0);
          return {
            state: state || 'randomState',
            nonce: nonce || 'randomNonce',
            lastUsedConnection: lastUsedConnection
          };
        });
      this.tm.process({ responseType: 'code', state: 'some-state', maxAge: 0 });
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
      it('stores state with expires option equal to 30 mins by default', function () {
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
      it('stores state with expires option equal to X mins if passed in', function () {
        this.tm = new TransactionManager({
          domain: 'myapp.auth0.com',
          stateExpiration: 60 //minutes
        });
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
          expires: 1 / 24 //days
        });
      });
      it('stores the organization ID when given', function () {
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
      it('stores the maxAge when given', function () {
        this.tm.generateTransaction(
          'appState',
          'providedState',
          'providedNonce',
          null,
          null,
          null,
          200
        );

        expect(Storage.prototype.setItem.lastCall.args[1]).to.eql({
          nonce: 'providedNonce',
          appState: 'appState',
          state: 'providedState',
          lastUsedConnection: null,
          maxAge: 200
        });
      });
      it('stores a maxAge of 0', function () {
        this.tm.generateTransaction(
          'appState',
          'providedState',
          'providedNonce',
          null,
          null,
          null,
          0
        );

        expect(Storage.prototype.setItem.lastCall.args[1]).to.eql({
          nonce: 'providedNonce',
          appState: 'appState',
          state: 'providedState',
          lastUsedConnection: null,
          maxAge: 0
        });
      });
      it('does not store a maxAge key when maxAge is not given', function () {
        this.tm.generateTransaction(
          'appState',
          'providedState',
          'providedNonce',
          null
        );

        expect(
          Storage.prototype.setItem.lastCall.args[1].hasOwnProperty('maxAge')
        ).to.be(false);
      });
      it('does not store a maxAge key when maxAge is an empty string', function () {
        this.tm.generateTransaction(
          'appState',
          'providedState',
          'providedNonce',
          null,
          null,
          null,
          ''
        );

        expect(
          Storage.prototype.setItem.lastCall.args[1].hasOwnProperty('maxAge')
        ).to.be(false);
      });
      it('does not store a maxAge key when maxAge is boolean false', function () {
        this.tm.generateTransaction(
          'appState',
          'providedState',
          'providedNonce',
          null,
          null,
          null,
          false
        );

        expect(
          Storage.prototype.setItem.lastCall.args[1].hasOwnProperty('maxAge')
        ).to.be(false);
      });
      it('does not store a maxAge key when maxAge is NaN', function () {
        this.tm.generateTransaction(
          'appState',
          'providedState',
          'providedNonce',
          null,
          null,
          null,
          NaN
        );

        expect(
          Storage.prototype.setItem.lastCall.args[1].hasOwnProperty('maxAge')
        ).to.be(false);
      });
      [
        ['maxAge is an empty string and max_age is 300', { maxAge: '', max_age: 300 }, 300],
        ['maxAge is false and max_age is 300', { maxAge: false, max_age: 300 }, 300],
        ['both maxAge and max_age are numbers', { maxAge: 100, max_age: 300 }, 100],
        ['max_age is 0', { max_age: 0 }, 0],
        ['max_age is the string "300"', { max_age: '300' }, 300],
        ['neither value can be used', { maxAge: '', max_age: false }, undefined],
        ['no maxAge is given', {}, undefined]
      ].forEach(function (testCase) {
        var expected = testCase[2];
        it(
          'process stores ' +
            (expected === undefined ? 'no maxAge' : 'maxAge ' + expected) +
            ' when ' +
            testCase[0],
          function () {
            this.tm.process(
              Object.assign({ responseType: 'code', state: 'some-state' }, testCase[1])
            );

            var stored = Storage.prototype.setItem.lastCall.args[1];
            if (expected === undefined) {
              expect(stored.hasOwnProperty('maxAge')).to.be(false);
            } else {
              expect(stored.maxAge).to.be(expected);
            }
          }
        );
      });
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
