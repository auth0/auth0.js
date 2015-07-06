/**
 * Config mocha
 */

mocha.timeout(60000);
mocha.globals(['jQuery*', '__auth0jp*']);

/**
 * Test User and Password
 */

describe('Auth0 - Passwordless', function () {
  afterEach(function () {
    this.server.restore();
  });

  beforeEach(function () {
    this.domain = 'aaa.auth0.com';
    this.clientID = 'aaaabcdefgh';
    this.auth0 = new Auth0({
      domain: this.domain,
      clientID: this.clientID,
    });
    this.server = sinon.fakeServer.create();
    this.email = 'foo@bar.com'
  });

  describe('.startPasswordless()', function () {
    it('should throw if no arguments are passed', function () {
      var auth0 = this.auth0;
      expect(function () {
        auth0.startPasswordless();
      }).to.throwError('An options object is required');
    });

    it('should throw if no options are passed', function () {
      var auth0 = this.auth0;
      expect(function () {
        auth0.startPasswordless(undefined, function() {});
      }).to.throwError('An options object is required');
    });

    it('should throw if no callback is passed', function () {
      var auth0 = this.auth0;
      var email = this.email;
      expect(function () {
        auth0.startPasswordless({ email: email });
      }).to.throwError('A callback function is required');
    });

    it('should throw if options has no property email', function () {
      var auth0 = this.auth0;
      expect(function () {
        auth0.startPasswordless({}, function() {});
      }).to.throwError('email is required.');
    });

    it('should send email successfully', function (done) {
      this.server.respondWith('POST', 'https://' + this.domain + '/passwordless/start', [
        200,
        { 'Content-Type': 'application/json' },
        '{"_id":"5b7bb4","email":"foo@bar.com"}'
      ]);

      this.auth0.startPasswordless({ email: this.email }, function (err) {
        expect(err).to.be(null);
        done();
      });

      this.server.respond();
    });
    //
    it('should fail using invalid email', function (done) {
      this.server.respondWith('POST', 'https://' + this.domain + '/passwordless/start', [
        400,
        { 'Content-Type': 'application/json' },
        '{"error":"bad.email","error_description":"error in email - email format validation failed: foo"}'
      ]);

      this.auth0.startPasswordless({ email: this.email }, function (err) {
        expect(err).not.to.be(null);
        expect(err).to.have.property('error');
        expect(err).to.have.property('error_description');
        expect(err.error).to.be('bad.email');
        expect(err.error_description).to.be('error in email - email format validation failed: foo');
        done();
      });

      this.server.respond();
    });
  });
});
