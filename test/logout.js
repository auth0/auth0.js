/**
 * Config mocha
 */

mocha.timeout(60000);
mocha.globals(['jQuery*', '__auth0jp*']);

/**
 * Test Logout
 */

describe('logout', function () {
  it('should redirect to the logout url', function (done) {
    var auth0 = Auth0({
      domain:      'mdocs.auth0.com',
      callbackURL: 'http://localhost:3000/',
      clientID:    'ptR6URmXef0OfBDHK0aCIy7iPKpdCG4t'
    });

    auth0._redirect = function (url) {
      expect(url).to.equal('https://mdocs.auth0.com/logout');
      done();
    };

    auth0.logout();
  });

  it('should redirect to the logout url with params', function (done) {
    var auth0 = Auth0({
      domain:      'mdocs.auth0.com',
      callbackURL: 'http://localhost:3000/',
      clientID:    'ptR6URmXef0OfBDHK0aCIy7iPKpdCG4t'
    });

    auth0._redirect = function (url) {
      expect(url).to.equal('https://mdocs.auth0.com/logout?returnTo=http%3A%2F%2Flogout');
      done();
    };

    auth0.logout({returnTo: 'http://logout'});
  });

});
