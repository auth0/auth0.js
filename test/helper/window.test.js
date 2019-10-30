import expect from 'expect.js';

import windowHelper from '../../src/helper/window';

describe('helpers window', function() {
  beforeEach(function() {
    global.window = { location: '' };
    global.window.document = { body: {} };
  });

  afterEach(function() {
    delete global.window;
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
  describe('isUniversalLoginPage', function() {
    it('returns true when current host === domain', function() {
      global.window = { location: { host: 'brucke.auth0.com' } };
      expect(windowHelper.isUniversalLoginPage('brucke.auth0.com')).to.be(true);
    });
    it('returns true when current host === auth0 tenant specific domain', function() {
      global.window = { location: { host: 'brucke.auth0.cloud' } };
      expect(windowHelper.isUniversalLoginPage('brucke.auth0.com')).to.be(true);
    });
    it('returns true when using a custom domain', function() {
      global.window = { location: { host: 'auth.example.com' } };
      expect(windowHelper.isUniversalLoginPage('auth.example.com')).to.be(true);
    });
    it('returns false when current host does not match any of the domains', function() {
      global.window = { location: { host: 'brucke.auth0.com' } };
      expect(windowHelper.isUniversalLoginPage('myapp.com')).to.be(false);
    });
  });
});
