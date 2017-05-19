var expect = require('expect.js');
var stub = require('sinon').stub;
var WinChan = require('winchan');

var qs = require('qs');
var PopupHandler = require('../../src/helper/popup-handler');

describe('helpers popupHandler', function() {
  describe('calculates the window position', function() {
    before(function() {
      global.window = {};
      global.window.screenX = 500;
      global.window.screenY = 500;
      global.window.outerWidth = 2000;
      global.window.outerHeight = 2000;
    });

    after(function() {
      delete global.window;
    });

    it('should use default values', function() {
      var handler = new PopupHandler();
      var position = handler.calculatePosition({});
      expect(position).to.eql({
        width: 500,
        height: 600,
        left: 1250,
        top: 1200
      });
    });

    it('should use the size from the parameters', function() {
      var handler = new PopupHandler();
      var position = handler.calculatePosition({ width: 200, height: 300 });
      expect(position).to.eql({
        width: 200,
        height: 300,
        left: 1400,
        top: 1350
      });
    });
  });

  describe('calculates the window position w screen left/top and body client size', function() {
    before(function() {
      global.window = {};
      global.window.screenLeft = 500;
      global.window.screenTop = 500;
      global.window.document = {};
      global.window.document.body = {};
      global.window.document.body.clientHeight = 2000;
      global.window.document.body.clientWidth = 2000;
    });

    after(function() {
      delete global.window;
    });

    it('should use default values', function() {
      var handler = new PopupHandler();
      var position = handler.calculatePosition({});
      expect(position).to.eql({
        width: 500,
        height: 600,
        left: 1250,
        top: 1200
      });
    });

    it('should use the size from the parameters', function() {
      var handler = new PopupHandler();
      var position = handler.calculatePosition({ width: 200, height: 300 });
      expect(position).to.eql({
        width: 200,
        height: 300,
        left: 1400,
        top: 1350
      });
    });
  });

  describe('should open the popup', function() {
    before(function() {
      global.window = {};
      global.window.screenX = 500;
      global.window.screenY = 500;
      global.window.outerWidth = 2000;
      global.window.outerHeight = 2000;
    });

    after(function() {
      delete global.window;
      WinChan.open.restore();
    });

    it('with the correct parametrs', function(done) {
      stub(WinChan, 'open', function(options, cb) {
        expect(options).to.eql({
          url: 'url',
          relay_url: 'relayUrl',
          window_features: 'width=500,height=600,left=1250,top=1200',
          popup: null,
          params: { opt: 'value' }
        });

        cb(null, { data2: 'value2' });

        return {
          focus: function() {
            done();
          }
        };
      });

      var handler = new PopupHandler();

      handler.load('url', 'relayUrl', { params: { opt: 'value' } }, function(err, data) {
        expect(err).to.be(null);
        expect(data).to.eql({ data2: 'value2' });
      });
    });
  });

  describe('preload should open the popup', function() {
    before(function() {
      global.window = {};
      global.window.screenX = 500;
      global.window.screenY = 500;
      global.window.outerWidth = 2000;
      global.window.outerHeight = 2000;
    });

    after(function() {
      delete global.window;
    });

    it('should open the window', function(done) {
      global.window.open = function(url, name, windowFeatures) {
        expect(url).to.eql('about:blank');
        expect(name).to.eql('auth0_signup_popup');
        expect(windowFeatures).to.eql('width=500,height=600,left=1250,top=1200');

        return {
          close: function() {
            done();
          }
        };
      };

      var handler = new PopupHandler();

      var popup = handler.preload({});

      popup.kill();
    });

    it('should open the window once', function(done) {
      var counter = 0;
      global.window.open = function(url, name, windowFeatures) {
        counter++;
        expect(url).to.eql('about:blank');
        expect(counter).to.eql(1);
        expect(name).to.eql('auth0_signup_popup');
        expect(windowFeatures).to.eql('width=500,height=600,left=1250,top=1200');

        return {
          close: function() {
            done();
          }
        };
      };

      var handler = new PopupHandler();

      var popup = handler.preload({});
      var popup = handler.preload({});

      popup.kill();
    });
  });
});
