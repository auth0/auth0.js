var expect = require('expect.js');

var windowHelper = require('../../src/helper/window');

describe('helpers window', function() {
  beforeEach(function() {
    global.window = { location: '' };
    global.window.document = { body: {} };
  });

  it('should redirect', function() {
    windowHelper.redirect('http://example.com');
    expect(global.window.location).to.be('http://example.com');
  });

  it('should return the window.document object', function() {
    var _document = windowHelper.getDocument();
    expect(_document).to.eql({ body: {} });
  });

  it('should return the window object', function() {
    var _window = windowHelper.getWindow();
    expect(_window).to.eql({ document: { body: {} }, location: '' });
  });
  describe('getOrigin', function() {
    it('should use window.location.origin when available', function() {
      global.window = { location: { origin: 'origin' } };
      expect(windowHelper.getOrigin()).to.be('origin');
    });
    it('should build current origin when location.origin is not available', function() {
      global.window = { location: { href: 'http://hostname:30/foobar' } };
      expect(windowHelper.getOrigin()).to.be('http://hostname:30');
    });
  });
});
