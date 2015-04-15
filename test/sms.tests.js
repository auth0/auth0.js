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
      var apiToken = this.apiToken;
      var phone = this.phone;
      expect(function () {
        auth0.requestSMSCode({ apiToken: apiToken, phone: phone });
      }).to.throwError('A callback function is required');
    });

    it('should throw if options has no property apiToken', function () {
      var auth0 = this.auth0;
      var apiToken = this.apiToken;
      var phone = this.phone;
      expect(function () {
        auth0.requestSMSCode({ phone: phone });
      }).to.throwError('apiToken is required.');
    });

    it('should throw if options has no property phone', function () {
      var auth0 = this.auth0;
      var apiToken = this.apiToken;
      var phone = this.phone;
      expect(function () {
        auth0.requestSMSCode({ apiToken: apiToken });
      }).to.throwError('phone is required.');
    });

    it('should send sms successfully', function (done) {
      this.server.respondWith('POST', 'https://' + this.domain + '/api/v2/users', [
        200,
        { 'Content-Type': 'application/json' },
        '{}'
      ]);

      this.auth0.requestSMSCode({ apiToken: this.apiToken, phone: this.phone }, function (err) {
        expect(err).to.be(null);
        done();
      });

      this.server.respond();
    });

    it('should fail using invalid phone number', function (done) {
      this.server.respondWith('POST', 'https://' + this.domain + '/api/v2/users', [
        400,
        { 'Content-Type': 'application/json' },
        '{"statusCode":400,"error":"Bad Request","message":"The \'To\' number 541234 is not a valid phone number."}'
      ]);

      this.auth0.requestSMSCode({ apiToken: this.apiToken, phone: '+541234' }, function (err) {
        expect(err).not.to.be(null);
        expect(err).to.have.property('statusCode');
        expect(err).to.have.property('error');
        expect(err).to.have.property('message');
        expect(err.statusCode).to.be(400);
        expect(err.error).to.be('Bad Request');
        expect(err.message).to.be('The \'To\' number 541234 is not a valid phone number.');
        done();
      });

      this.server.respond();
    });
  });

  describe('.loginWithPhoneNumber()', function () {
    it('should throw if called without phone', function (done) {
      var auth0 = this.auth0;
      expect(function () {
        auth0.loginWithPhoneNumber({ passcode: '123123' }, function () {});
      }).to.throwError(function (err) {
        expect(err.message).to.contain('phone');
        done();
      });
    });

    it('should throw if called without passcode', function (done) {
      var auth0 = this.auth0;
      expect(function () {
        auth0.loginWithPhoneNumber({ phone: '+123123123123' }, function () {});
      }).to.throwError(function (err) {
        expect(err.message).to.contain('passcode');
        done();
      });
    });

    it('should throw if called without callback', function (done) {
      var auth0 = this.auth0;
      expect(function () {
        auth0.loginWithPhoneNumber({ phone: '+123123123123', passcode: '123123' });
      }).to.throwError(function (err) {
        expect(err.message).to.contain('callback');
        done();
      });
    });

    it('should fallback calling .loginWithResourceOwner() with correct options', function (done) {
      this.auth0.loginWithResourceOwner = function (options, callback) {
        expect(options.sso).to.be(false);
        expect(options.phone).to.be(undefined);
        expect(options.passcode).to.be(undefined);
        expect(options.username).not.to.be.empty();
        expect(options.password).not.to.be.empty();
        expect(options.connection).to.be('sms');
        expect(callback).to.be.a('function');
        done();
      }

      this.auth0.loginWithPhoneNumber({
        phone: '+123123',
        passcode: '123123'
      }, function () {});
    })
  });

  describe('.login()', function () {
    it('should throw if called without callback', function(done) {
      var auth0 = this.auth0;
      expect(function () {
        auth0.login({
          phone: '+123123',
          code: '123123'
        });
      }).to.throwError(function (err) {
        done();
      });
    });

    it('should fallback calling .loginWithPhoneNumber() with correct options', function(done) {
      this.auth0.loginWithPhoneNumber = function (options, callback) {
        expect(options.phone).not.to.be.empty();
        expect(options.passcode).not.to.be.empty();
        expect(callback).to.be.a('function');
        done();
      }

      this.auth0.login({
        phone: this.phone,
        passcode: '123123'
      }, function () {});
    });

    it('should fallback calling .loginWithResourceOwner()', function(done) {
      this.auth0.loginWithResourceOwner = function (options, callback) {
        expect(options.username).to.not.be.empty();
        expect(options.password).to.not.be.empty();
        expect(callback).to.be.a('function');
        done();
      }

      this.auth0.login({
        phone: this.phone,
        passcode: '123123'
      }, function () {});
    });

  });

});
