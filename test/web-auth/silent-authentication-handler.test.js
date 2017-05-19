var expect = require('expect.js');
var stub = require('sinon').stub;

var WebAuth = require('../../src/web-auth');
var SilentAuthenticationHandler = require('../../src/web-auth/silent-authentication-handler');
var IframeHandler = require('../../src/helper/iframe-handler');

var eventEmitter = {
  emitEvent: function(mockEvent) {
    iframeHandler.callback(mockEvent);
  }
};
var iframeHandler = {};

describe('handlers silent-authentication-handler', function() {
  context('with context', function() {
    afterEach(function() {
      if (IframeHandler.prototype.init.restore) {
        IframeHandler.prototype.init.restore();
      }
    });
    it('should return correct value for usePostMessage=false', function(done) {
      stub(IframeHandler.prototype, 'init', function() {
        iframeHandler.callback = this.callback;
      });
      var sah = new SilentAuthenticationHandler({});

      sah.login(false, function(arg1, arg2) {
        expect(arg1).to.be(null);
        expect(arg2).to.be('my-hash-data');
        done();
      });

      eventEmitter.emitEvent({
        sourceObject: { contentWindow: { location: { hash: 'my-hash-data' } } }
      });
    });
    context('should return correct value for usePostMessage=true', function() {
      it('when the event payload is an object with a `hash` property', function(done) {
        stub(IframeHandler.prototype, 'init', function() {
          iframeHandler.callback = this.callback;
        });
        var sah = new SilentAuthenticationHandler({});

        sah.login(true, function(arg1, arg2) {
          expect(arg1).to.be(null);
          expect(arg2).to.be('my-hash-data-2');
          done();
        });

        eventEmitter.emitEvent({ event: { data: { hash: 'my-hash-data-2' } } });
      });
      it('when the event payload is an object (parsed hash)', function(done) {
        stub(IframeHandler.prototype, 'init', function() {
          iframeHandler.callback = this.callback;
        });
        var sah = new SilentAuthenticationHandler({});

        sah.login(true, function(arg1, arg2) {
          expect(arg1).to.be(null);
          expect(arg2).to.eql({ foo: 'bar' });
          done();
        });

        eventEmitter.emitEvent({ event: { data: { foo: 'bar' } } });
      });
      it('when the event payload is a string', function(done) {
        stub(IframeHandler.prototype, 'init', function() {
          iframeHandler.callback = this.callback;
        });
        var sah = new SilentAuthenticationHandler({});

        sah.login(true, function(arg1, arg2) {
          expect(arg1).to.be(null);
          expect(arg2).to.eql('foobar');
          done();
        });

        eventEmitter.emitEvent({ event: { data: 'foobar' } });
      });
    });

    it('should positively validate message event types with correct postMessageDataType set', function() {
      var sah = new SilentAuthenticationHandler({
        postMessageDataType: 'auth0:silent-authentication'
      });
      var validator = sah.getEventValidator();

      expect(
        validator.isValid({
          event: { type: 'message', data: { type: 'auth0:silent-authentication' } }
        })
      ).to.be(true);
    });

    it('should negatively validate message event types with invalid postMessageDataType', function() {
      var sah = new SilentAuthenticationHandler({
        postMessageDataType: 'auth0:silent-authentication'
      });
      var validator = sah.getEventValidator();

      expect(
        validator.isValid({
          event: { type: 'message', data: { type: 'some unexpected data type' } }
        })
      ).to.be(false);
    });

    it('should positively validate message event types with postMessageDataType as false', function() {
      var sah = new SilentAuthenticationHandler({
        postMessageDataType: false
      });
      var validator = sah.getEventValidator();

      expect(
        validator.isValid({
          event: { type: 'message', data: { type: 'some unexpected data type' } }
        })
      ).to.be(true);
    });

    it('should positively validate message event types with postMessageDataType not set', function() {
      var sah = new SilentAuthenticationHandler({
        postMessageDataType: false
      });
      var validator = sah.getEventValidator();

      expect(
        validator.isValid({
          event: { type: 'message', data: { type: 'some unexpected data type' } }
        })
      ).to.be(true);
    });

    it('should positively validate load event types', function() {
      var sah = new SilentAuthenticationHandler({
        postMessageDataType: false
      });
      var validator = sah.getEventValidator();

      expect(validator.isValid({ event: { type: 'load' } })).to.be(true);
    });
  });
});
