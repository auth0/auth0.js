var expect = require('expect.js');
var stub = require('sinon').stub;

var windowHandler = require('../../src/helper/window');
var cookies = require('../../src/helper/cookies');

describe('helpers cookies', function() {
  beforeEach(function() {
    var document = {
      cookie: ''
    };

    stub(windowHandler, 'getDocument', function(message) {
      return document;
    });
    stub(Date.prototype, 'getTime', function(message) {
      return 0;
    });
  });

  afterEach(function() {
    windowHandler.getDocument.restore();
    Date.prototype.getTime.restore();
  });

  it('create a cookie with exp', function() {
    cookies.create('cookie_name', 'cookie value', 1);
    expect(windowHandler.getDocument().cookie).to.be.eql(
      'cookie_name=Y29va2llIHZhbHVl; expires=Fri, 02 Jan 1970 00:00:00 GMT; path=/'
    );
  });

  it('create a cookie without exp', function() {
    cookies.create('cookie_name', 'cookie value');
    expect(windowHandler.getDocument().cookie).to.be.eql('cookie_name=Y29va2llIHZhbHVl; path=/');
  });

  it('returns null if the cookie does not exist', function() {
    var value = cookies.read('cookie_name');
    expect(value).to.be.eql(null);
  });

  it('returns the cookie value', function() {
    cookies.create('cookie_name', 'cookie value');
    expect(windowHandler.getDocument().cookie).to.be.eql('cookie_name=Y29va2llIHZhbHVl; path=/');

    var value = cookies.read('cookie_name');
    expect(value).to.be.eql('cookie value');
  });

  it('should handle multiple cookies', function() {
    windowHandler.getDocument.restore();
    stub(windowHandler, 'getDocument', function(message) {
      return {
        cookie: 'cookie_name=Y29va2llIHZhbHVl; path=/; cookie_name2=Y29va2llIHZhbHVlMg; path=/'
      };
    });

    var value = cookies.read('cookie_name2');
    expect(value).to.be.eql('cookie value2');
  });

  it('returns the cookie value (with ;)', function() {
    cookies.create('cookie_name', 'cookie; value');
    expect(windowHandler.getDocument().cookie).to.be.eql(
      'cookie_name=Y29va2llOyB2YWx1ZQ==; path=/'
    );

    var value = cookies.read('cookie_name');
    expect(value).to.be.eql('cookie; value');
  });

  it('should reset the expiration', function() {
    cookies.create('cookie_name', 'cookie; value');
    expect(windowHandler.getDocument().cookie).to.be.eql(
      'cookie_name=Y29va2llOyB2YWx1ZQ==; path=/'
    );

    cookies.erase('cookie_name');

    expect(windowHandler.getDocument().cookie).to.be.eql(
      'cookie_name=; expires=Wed, 31 Dec 1969 00:00:00 GMT; path=/'
    );
  });

  it('handle cookie not available', function() {
    windowHandler.getDocument.restore();
    stub(windowHandler, 'getDocument', function(message) {
      return {};
    });
    expect(function() {
      cookies.create('cookie_name', 'cookie; value');
    }).to.throwError();

    expect(function() {
      cookies.read('cookie_name');
    }).to.throwError();
  });
});
