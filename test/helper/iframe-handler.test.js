var expect = require('expect.js');
var stub = require('sinon').stub;

var WebAuth = require('../../src/web-auth');
var windowHelper = require('../../src/helper/window');
var IframeHandler = require('../../src/helper/iframe-handler');

function MockEventSourceObject() {
  this.eventListeners = {
    load: [],
    message: []
  };

  this.emitEvent = function(eventType, eventObject) {
    expect(!!this.eventListeners[eventType]).to.be(true);

    for (var a in this.eventListeners[eventType]) {
      this.eventListeners[eventType][a](eventObject);
    }
  };

  this.addEventListener = function(eventType, callback) {
    expect(!!this.eventListeners[eventType]).to.be(true);

    this.eventListeners[eventType].push(callback);
  };

  this.removeEventListener = function(eventType, callback) {
    expect(!!this.eventListeners[eventType]).to.be(true);

    var index = this.eventListeners[eventType].indexOf(callback);
    if (index > -1) {
      this.eventListeners[eventType].splice(index, 1);
    }
  };

  this.assimilate = function(object) {
    var keys = Object.keys(object);
    for (var a in keys) {
      this[keys[a]] = object[keys[a]];
    }
  };
}

function stubWindow(eventType, data) {
  var iFrame = new MockEventSourceObject();

  if (eventType === 'message') {
    iFrame.assimilate({
      id: 'the_iframe',
      style: {}
    });
  } else if (eventType === 'load') {
    iFrame.assimilate({
      id: 'the_iframe',
      style: {},
      contentWindow: {
        location: {
          hash: data !== undefined
            ? data
            : '#access_token=VjubIMBmpgQ2W2&id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA&token_type=Bearer&refresh_token=kajshdgfkasdjhgfas'
        }
      }
    });
  }

  var fauxWindow = new MockEventSourceObject();
  fauxWindow.assimilate({
    mockObjectStore: {
      iframe: null
    },
    localStorage: {
      removeItem: function(key) {
        expect(key).to.be('com.auth0.auth.theState');
      },
      getItem: function(key) {
        expect(key).to.be('com.auth0.auth.theState');
        return JSON.stringify({
          nonce: 'asfd',
          appState: null
        });
      }
    },
    document: {
      createElement: function(element) {
        expect(element).to.be('iframe');
        return iFrame;
      },
      body: {
        removeChild: function(ele) {
          expect(ele).to.be(iFrame);
          expect(fauxWindow.mockObjectStore.iframe).to.be(iFrame);
          fauxWindow.mockObjectStore.iframe = null;
        },
        appendChild: function(ele) {
          expect(fauxWindow.mockObjectStore.iframe).to.be(null);
          expect(ele.id).to.be('the_iframe');
          fauxWindow.mockObjectStore.iframe = ele;
        }
      }
    }
  });

  stub(windowHelper, 'getWindow', function() {
    return fauxWindow;
  });

  return iFrame;
}

describe('helpers iframeHandler', function() {
  context('with context', function() {
    afterEach(function() {
      windowHelper.getWindow.restore();
    });

    it('should create a hidden iframe with a specific url', function() {
      var iframe = stubWindow('message');
      var iframeHandler = new IframeHandler({
        url: 'my-url',
        callback: function() {}
      });

      iframeHandler.init();

      expect(windowHelper.getWindow().document.body);
      expect(iframe.src).to.be('my-url');
      expect(iframe.style.display).to.be('none');
    });

    it('should callback after a timeout', function() {
      var iframe = stubWindow('message');
      var timeOutCalled = false;
      var iframeHandler = new IframeHandler({
        timeout: 10,
        timeoutCallback: function() {
          timeOutCalled = true;
        },
        callback: function() {}
      });

      iframeHandler.init();

      setTimeout(function() {
        expect(timeOutCalled).to.be(true);
      }, 20);
    });

    it('should add an event listener, adding it to the window for message type events by default', function() {
      var iframe = stubWindow('message');
      var iframeHandler = new IframeHandler({
        callback: function() {}
      });

      expect(windowHelper.getWindow().eventListeners['message'].length).to.be(0);
      expect(iframe.eventListeners['load'].length).to.be(0);
      iframeHandler.init();
      expect(windowHelper.getWindow().eventListeners['message'].length).to.be(1);
      expect(iframe.eventListeners['load'].length).to.be(0);
    });

    it('should add an event listener, adding it to the window for message type events, when specified', function() {
      var iframe = stubWindow('message');
      var iframeHandler = new IframeHandler({
        eventListenerType: 'message',
        callback: function() {}
      });

      expect(windowHelper.getWindow().eventListeners['message'].length).to.be(0);
      expect(iframe.eventListeners['load'].length).to.be(0);
      iframeHandler.init();
      expect(windowHelper.getWindow().eventListeners['message'].length).to.be(1);
      expect(iframe.eventListeners['load'].length).to.be(0);
    });

    it('should add an event listener, adding it to the iframe for load type events', function() {
      var iframe = stubWindow('message');
      var iframeHandler = new IframeHandler({
        eventListenerType: 'load',
        callback: function() {}
      });

      expect(iframe.eventListeners['load'].length).to.be(0);
      expect(windowHelper.getWindow().eventListeners['message'].length).to.be(0);
      iframeHandler.init();
      expect(iframe.eventListeners['load'].length).to.be(1);
      expect(windowHelper.getWindow().eventListeners['message'].length).to.be(0);
    });

    it('should call an event validator for a message event on the window', function() {
      var iframe = stubWindow('message');
      var validatorCalled = false;
      var iframeHandler = new IframeHandler({
        eventListenerType: 'message',
        eventValidator: {
          isValid: function(eventData) {
            validatorCalled = true;
            expect(eventData.event).to.eql({ id: 'my-id' });
            expect(eventData.sourceObject).to.eql(windowHelper.getWindow());
          }
        },
        callback: function() {}
      });

      iframeHandler.init();
      expect(validatorCalled).to.be(false);
      windowHelper.getWindow().emitEvent('message', { id: 'my-id' });
      expect(validatorCalled).to.be(true);
    });

    it('should call an event validator for a load event on the Iframe', function() {
      var iframe = stubWindow('load');
      var validatorCalled = false;
      var iframeHandler = new IframeHandler({
        eventListenerType: 'load',
        eventValidator: {
          isValid: function(eventData) {
            validatorCalled = true;
            expect(eventData.event).to.eql({ id: 'my-id-2' });
            expect(eventData.sourceObject).to.eql(iframe);
          }
        },
        callback: function() {}
      });

      iframeHandler.init();
      expect(validatorCalled).to.be(false);
      iframe.emitEvent('load', { id: 'my-id-2' });
      expect(validatorCalled).to.be(true);
    });

    it('should not destroy or callback if an event is not valid', function() {
      var iframe = stubWindow('message');
      var destroyCalled = false;
      var callbackCalled = false;
      var iframeHandler = new IframeHandler({
        eventListenerType: 'message',
        callback: function() {
          callbackCalled = true;
        },
        eventValidator: {
          isValid: function(eventData) {
            return false;
          }
        }
      });

      // Overload the destroy function
      iframeHandler.destroy = function() {
        destroyCalled = true;
      };

      iframeHandler.init();

      windowHelper.getWindow().emitEvent('message');

      expect(callbackCalled).to.eql(false);
      expect(destroyCalled).to.eql(false);
    });

    it('should destroy and callback with valid data if an event is valid', function(done) {
      var iframe = stubWindow('message');
      var destroyCalled = false;
      var callbackCalled = false;
      var iframeHandler = new IframeHandler({
        eventListenerType: 'message',
        callback: function(eventData) {
          expect(eventData.event).to.eql({ id: 'my-event-5' });
          callbackCalled = true;
        },
        eventValidator: {
          isValid: function(eventData) {
            return true;
          }
        }
      });

      iframeHandler.init();

      windowHelper.getWindow().emitEvent('message', { id: 'my-event-5' });

      expect(callbackCalled).to.eql(true);

      setTimeout(function() {
        expect(callbackCalled).to.eql(true);
        expect(windowHelper.getWindow().eventListeners['message'].length).to.be(0);
        expect(windowHelper.getWindow().mockObjectStore.iframe).to.be(null);

        done();
      }, 200);
    });
    it('default eventValidator should always return true', function() {
      var iframe = stubWindow('message');
      var callbackCalled = false;
      var iframeHandler = new IframeHandler({
        eventListenerType: 'message',
        callback: function() {
          callbackCalled = true;
        },
        eventValidator: undefined
      });

      iframeHandler.init();

      windowHelper.getWindow().emitEvent('message', { id: 'my-event-5' });
      expect(callbackCalled).to.eql(true);
    });

    it('should destroy and callback if a timeout occurs', function(done) {
      var iframe = stubWindow('message');
      var destroyCalled = false;
      var callbackCalled = false;

      var iframeHandler = new IframeHandler({
        eventListenerType: 'message',
        timeout: 100,
        timeoutCallback: function() {
          callbackCalled = true;
        },
        callback: function() {}
      });

      iframeHandler.destroy = function() {
        destroyCalled = true;
      };

      iframeHandler.init();

      setTimeout(function() {
        expect(callbackCalled).to.eql(true);
        expect(destroyCalled).to.eql(true);

        done();
      }, 200);
    });

    it('should throw an exception if a callback is not specified', function(done) {
      var iframe = stubWindow('message');
      try {
        var iframeHandler = new IframeHandler({});
      } catch (e) {
        expect(e.message).to.eql('options.callback must be a function');
        done();
      }
    });

    it('should throw an exception if an invalid eventListernerType is specified', function(done) {
      var iframe = stubWindow('message');
      try {
        var iframeHandler = new IframeHandler({
          eventListenerType: 'invalid',
          callback: function() {}
        });
        iframeHandler.init();
      } catch (e) {
        expect(e.message).to.eql('Unsupported event listener type: invalid');
        done();
      }
    });
  });
});
