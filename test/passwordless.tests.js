/**
 * Config mocha
 */

mocha.timeout(60000);
mocha.globals(['jQuery*', '__auth0jp*']);

/**
 * XHR support variables
 */

var xhrSupport = !(new Auth0({clientID: "clientID", domain: "domain"}))._useJSONP;
var xhrSupportPrefix = xhrSupport ? '' : 'not ';

// TODO: we are using the support variables to test only for XHR requests, since
// we don't have an easy way to test JSONP. The plan is to wrap calls to reqwest
// and jsonp so we can stub them.

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
    this.email = 'foo@bar.com';
    this.phoneNumber = '+5491122334455';
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

    it('should throw if options has no property email or phoneNumber', function () {
      var auth0 = this.auth0;
      expect(function () {
        auth0.startPasswordless({}, function() {});
      }).to.throwError('email is required.');
    });

    describe('sending an email successfully (xhr ' + xhrSupportPrefix + ' supported)', function() {
      beforeEach(function() {
        this.server.respondWith('POST', 'https://' + this.domain + '/passwordless/start', [
          200,
          { 'Content-Type': 'application/json' },
          '{"_id":"5b7bb4","email":"' + this.email + '"}'
        ]);
      });

      it('should send the expected parameters', function (done) {
        // TODO test JSONP request
        if (!xhrSupport) return done();
        this.auth0.startPasswordless({ email: this.email }, function (err) {
          expect(err).to.be(null);
          done();
        });

        var requestData = parseRequestBody(this.server.requests[0]);
        expect(requestData.client_id).to.be(this.clientID);
        expect(requestData.email).to.be(this.email);
        expect(requestData.connection).to.be('email');
        this.server.respond();
      });

      it('should allow a send option', function (done) {
        // TODO test JSONP request
        if (!xhrSupport) return done();
        var send = 'code';
        this.auth0.startPasswordless({ email: this.email, send: send }, function (err) {
          done();
        });

        var requestData = parseRequestBody(this.server.requests[0]);
        expect(requestData.client_id).to.be(this.clientID);
        expect(requestData.email).to.be(this.email);
        expect(requestData.connection).to.be('email');
        expect(requestData.send).to.be(send);
        this.server.respond();
      });

      it('should allow an authParams option', function (done) {
        // TODO test JSONP request
        if (!xhrSupport) return done();
        var authParams = 'fakeauthparams';
        this.auth0.startPasswordless({ email: this.email, authParams: authParams }, function (err) {
          done();
        });

        var requestData = parseRequestBody(this.server.requests[0]);
        expect(requestData.client_id).to.be(this.clientID);
        expect(requestData.email).to.be(this.email);
        expect(requestData.connection).to.be('email');
        expect(requestData.authParams).to.be(authParams);
        this.server.respond();
      });
    });

    describe('unsuccessful attempt to send an email (xhr ' + xhrSupportPrefix + ' supported)', function() {
      beforeEach(function() {
        this.email = "foo";
        this.server.respondWith('POST', 'https://' + this.domain + '/passwordless/start', [
          400,
          { 'Content-Type': 'application/json' },
          '{"error":"bad.email","error_description":"error in email - email format validation failed: ' + this.email + '"}'
        ]);
      });

      it('should provide the error information', function (done) {
        // TODO test JSONP request
        if (!xhrSupport) return done();

        var email = this.email;
        this.auth0.startPasswordless({ email: this.email }, function (err) {
          expect(err).not.to.be(null);
          expect(err).to.have.property('error');
          expect(err).to.have.property('error_description');
          expect(err.error).to.be('bad.email');
          expect(err.error_description).to.be('error in email - email format validation failed: ' + email);
          done();
        });

        this.server.respond();
      });
    });

    describe('sending a sms successfully (xhr ' + xhrSupportPrefix + ' supported)', function() {
      beforeEach(function() {
        this.server.respondWith('POST', 'https://' + this.domain + '/passwordless/start', [
          200,
          { 'Content-Type': 'application/json' },
          '{}'
        ]);
      });

      it('should send the expected parameters', function (done) {
        // TODO test JSONP request
        if (!xhrSupport) return done();

        this.auth0.startPasswordless({ phoneNumber: this.phoneNumber }, function (err) {
          expect(err).to.be(null);
          done();
        });

        var requestData = parseRequestBody(this.server.requests[0]);
        expect(requestData.client_id).to.be(this.clientID);
        expect(requestData.phone_number).to.be(this.phoneNumber);
        expect(requestData.connection).to.be('sms');
        this.server.respond();
      });

      it('should not allow a send option', function (done) {
        // TODO test JSONP request
        if (!xhrSupport) return done();

        this.auth0.startPasswordless({ phoneNumber: this.phoneNumber, send: 'link' }, function (err) {
          done();
        });

        var requestData = parseRequestBody(this.server.requests[0]);
        expect(requestData.authParams).to.be(undefined);
        this.server.respond();
      });

      it('should not allow an authParams option', function (done) {
        // TODO test JSONP request
        if (!xhrSupport) return done();

        this.auth0.startPasswordless({ phoneNumber: this.phoneNumber, authParams: 'fakeauthparams' }, function (err) {
          done();
        });

        var requestData = parseRequestBody(this.server.requests[0]);
        expect(requestData.authParams).to.be(undefined);
        this.server.respond();
      });

    });

    describe('unsuccessful attempt to send a sms (xhr ' + xhrSupportPrefix + ' supported)', function() {
      beforeEach(function() {
        this.phoneNumber = '+541234';
        this.server.respondWith('POST', 'https://' + this.domain + '/passwordless/start', [
          400,
          { 'Content-Type': 'application/json' },
          '{"statusCode":400,"error":"Bad Request","message":"The \'To\' number ' + this.phoneNumber + ' is not a valid phone number."}'
        ]);
      });

      it('should provide the error information', function (done) {
        // TODO test JSONP request
        if (!xhrSupport) return done();

        this.auth0.startPasswordless({ phoneNumber: this.phoneNumber }, function (err) {
          expect(err).not.to.be(null);
          expect(err).to.have.property('statusCode');
          expect(err).to.have.property('error');
          expect(err).to.have.property('message');
          expect(err.statusCode).to.be(400);
          expect(err.error).to.be('Bad Request');
          expect(err.message).to.be('The \'To\' number +541234 is not a valid phone number.');
          done();
        });

        this.server.respond();
      });
    });
  });

  describe('.loginWithPasscode()', function () {
    it('should throw if called with just a passcode attribute', function (done) {
      var auth0 = this.auth0;
      expect(function () {
        auth0.loginWithPasscode({ passcode: '123123' }, function () {});
      }).to.throwError(function (err) {
        expect(err.message).to.contain('email');
        expect(err.message).to.contain('phoneNumber');
        done();
      });
    });

    it('should throw if called with just phoneNumber', function (done) {
      var auth0 = this.auth0;
      expect(function () {
        auth0.loginWithPasscode({ phoneNumber: '+123123123123' }, function () {});
      }).to.throwError(function (err) {
        expect(err.message).to.contain('passcode');
        done();
      });
    });

    it('should throw if called with just email', function (done) {
      var auth0 = this.auth0;
      expect(function () {
        auth0.loginWithPasscode({ email: 'foo@bar.com' }, function () {});
      }).to.throwError(function (err) {
        expect(err.message).to.contain('passcode');
        done();
      });
    });

    it.skip('should fallback calling .loginWithResourceOwner() with correct options', function (done) {
      this.auth0.loginWithResourceOwner = function (options, callback) {
        expect(options.sso).to.be(false);
        expect(options.phoneNumber).to.be(undefined);
        expect(options.passcode).to.be(undefined);
        expect(options.username).not.to.be.empty();
        expect(options.password).not.to.be.empty();
        expect(options.connection).to.be('sms');
        expect(options.customOption).to.be('customOption');
        expect(callback).to.be.a('function');
        done();
      }

      this.auth0.loginWithPhoneNumber({
        phoneNumber: '+123123',
        passcode: '123123',
        connection: 'email',
        customOption: 'customOption'
      }, function () {});
    })
  });

  describe('.login()', function() {
    describe('/oauth/ro', function() {
      describe('successful login (xhr ' + xhrSupportPrefix + ' supported)', function() {
        beforeEach(function() {
          this.passcode = '123456';
          this.server.respondWith('POST', 'https://' + this.domain + '/oauth/ro', [
            200,
            { 'Content-Type': 'application/json' },
            '{}'
          ]);
          // XXX Avoid fetching the profile
          this.auth0.getProfile = function(id_token, callback) {
            return callback(null, {});
          }
        });

        it('should send the expected parameters', function (done) {
          // TODO test JSONP request
          if (!xhrSupport) return done();

          this.auth0.login({ phoneNumber: this.phoneNumber, passcode: this.passcode }, function (err, profile) {
            expect(err).to.be(null);
            done();
          });

          var requestData = parseRequestBody(this.server.requests[0]);
          expect(requestData.client_id).to.be(this.clientID);
          expect(requestData.connection).to.be('sms');
          expect(requestData.grant_type).to.be('password');
          expect(requestData.username).to.be(this.phoneNumber);
          expect(requestData.password).to.be(this.passcode);
          expect(requestData.scope).to.be('openid');
          expect(requestData.sso).to.be('false');
          expect(requestData.phoneNumber).to.be(undefined);
          expect(requestData.passcode).to.be(undefined);

          this.server.respond();
        });
      });
    });
  });
});

function parseRequestBody(request) {
  var result = {};
  if (!request || 'string' !== typeof request.requestBody) {
    return result;
  }

  var pairs = request.requestBody.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }

  return result;
}
