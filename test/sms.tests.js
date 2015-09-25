/**
 * Config mocha
 */

mocha.timeout(60000);
mocha.globals(['jQuery*', '__auth0jp*']);

/**
 * Test User and Password
 */

describe('Auth0 - SMS', function () {
  // TODO: Most of this are usage and params tests
  //       integration tests should be added
  //       hitting Auth0's APIv2

  afterEach(function () {
    global.window.location.hash = '';
    this.server.restore();
  });

  beforeEach(function () {
    this.domain = 'aaa.auth0.com';
    this.clientID = 'aaaabcdefgh';
    this.callbackURL = 'https://myapp.com/callback';
    this.auth0 = new Auth0({
      domain: this.domain,
      clientID: this.clientID,
      callbackURL: this.callbackURL
    });
    this.server = sinon.fakeServer.create();
    this.apiToken = 'aaaabcdefgh';
    this.phone = '+5491122334455';
  });

  describe('.requestSMSCode()', function () {
    it('should throw if no arguments are passed', function () {
      var auth0 = this.auth0;
      expect(function () {
        auth0.requestSMSCode();
      }).to.throwError('An options object is required');
    });

    it('should throw if no options are passed', function () {
      var auth0 = this.auth0;
      expect(function () {
        auth0.requestSMSCode(undefined, function() {});
      }).to.throwError('An options object is required');
    });

    it('should throw if no callback is passed', function () {
      var auth0 = this.auth0;
      var phone = this.phone;
      expect(function () {
        auth0.requestSMSCode({ phone: phone });
      }).to.throwError('A callback function is required');
    });

    it('should throw if options has no property phone', function () {
      var auth0 = this.auth0;
      var phone = this.phone;
      expect(function () {
        auth0.requestSMSCode({}, function() {});
      }).to.throwError('phone is required.');
    });

    it('should call startPasswordless', function(done) {
      var callback = function() {};
      var phone = this.phone;
      this.auth0.startPasswordless = function(options, cb) {
        expect(cb).to.be(callback);
        expect(options).to.eql({phoneNumber: phone, other: 'other'});
        done();
      };

      this.auth0.requestSMSCode({ phone: this.phone, other: 'other' }, callback);
    });
  });
});
