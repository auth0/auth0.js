var expect = require('expect.js');

var stub = require('sinon').stub;

var RequestMock = require('../mock/request-mock');

var request = require('superagent');

var Management = require('../../src/management');

describe('auth0.Management', function() {
  describe('initialization', function() {
    it('should check that options is passed', function() {
      expect(function() {
        var auth0 = new Management();
      }).to.throwException(function(e) {
        expect(e.message).to.be('options parameter is not valid');
      });
    });

    it('should check that domain is set', function() {
      expect(function() {
        var auth0 = new Management({ token: '...' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('domain option is required');
      });
    });

    it('should check that token is set', function() {
      expect(function() {
        var auth0 = new Management({ domain: 'me.auth0.com' });
      }).to.throwException(function(e) {
        expect(e.message).to.be('token option is required');
      });
    });
  });

  context('getUser options', function() {
    before(function() {
      this.auth0 = new Management({
        domain: 'me.auth0.com',
        token: '...',
        _sendTelemetry: false
      });
    });

    it('should check that userId is valid', function() {
      expect(() => {
        this.auth0.getUser();
      }).to.throwException(function(e) {
        expect(e.message).to.be('userId parameter is not valid');
      });
    });

    it('should check that cb is valid', function() {
      expect(() => {
        this.auth0.getUser('...');
      }).to.throwException(function(e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });
  });

  context('getUser', function() {
    before(function() {
      this.auth0 = new Management({
        domain: 'me.auth0.com',
        token: 'the_token',
        _sendTelemetry: false
      });
    });

    afterEach(function() {
      request.get.restore();
    });

    it('should fetch the user from the api', function(done) {
      stub(request, 'get', function(url) {
        expect(url).to.be('https://me.auth0.com/api/v2/users/auth0|123');
        return new RequestMock({
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer the_token'
          },
          cb: function(cb) {
            cb(null, {
              body: {
                user_id: 'auth0|123',
                email: 'me@example.com'
              }
            });
          }
        });
      });

      this.auth0.getUser('auth0|123', function(err, user) {
        expect(err).to.be(null);
        expect(user).to.eql({
          user_id: 'auth0|123',
          email: 'me@example.com'
        });
        done();
      });
    });
  });

  context('patchUserMetadata options', function() {
    before(function() {
      this.auth0 = new Management({
        domain: 'me.auth0.com',
        token: '...',
        _sendTelemetry: false
      });
    });

    it('should check that userId is valid', function() {
      expect(() => {
        this.auth0.patchUserMetadata();
      }).to.throwException(function(e) {
        expect(e.message).to.be('userId parameter is not valid');
      });
    });

    it('should check that userMetadata is valid', function() {
      expect(() => {
        this.auth0.patchUserMetadata('...');
      }).to.throwException(function(e) {
        expect(e.message).to.be('userMetadata parameter is not valid');
      });
    });

    it('should check that cb is valid', function() {
      expect(() => {
        this.auth0.patchUserMetadata('...', {});
      }).to.throwException(function(e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });
  });

  context('patchUserMetadata', function() {
    before(function() {
      this.auth0 = new Management({
        domain: 'me.auth0.com',
        token: 'the_token',
        _sendTelemetry: false
      });
    });

    afterEach(function() {
      request.patch.restore();
    });

    it('should fetch the user from the api', function(done) {
      stub(request, 'patch', function(url) {
        expect(url).to.be('https://me.auth0.com/api/v2/users/auth0|123');
        return new RequestMock({
          body: {
            user_metadata: { role: 'admin' }
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer the_token'
          },
          cb: function(cb) {
            cb(null, {
              body: {
                user_id: 'auth0|123',
                email: 'me@example.com',
                user_metadata: { role: 'admin' }
              }
            });
          }
        });
      });

      this.auth0.patchUserMetadata('auth0|123', { role: 'admin' }, function(err, user) {
        expect(err).to.be(null);
        expect(user).to.eql({
          user_id: 'auth0|123',
          email: 'me@example.com',
          user_metadata: { role: 'admin' }
        });
        done();
      });
    });
  });

  context('linkUsers options', function() {
    before(function() {
      this.auth0 = new Management({
        domain: 'me.auth0.com',
        token: '...',
        _sendTelemetry: false
      });
    });

    it('should check that userId is valid', function() {
      expect(() => {
        this.auth0.linkUser();
      }).to.throwException(function(e) {
        expect(e.message).to.be('userId parameter is not valid');
      });
    });

    it('should check that secondaryUserToken is valid', function() {
      expect(() => {
        this.auth0.linkUser('...');
      }).to.throwException(function(e) {
        expect(e.message).to.be('secondaryUserToken parameter is not valid');
      });
    });

    it('should check that cb is valid', function() {
      expect(() => {
        this.auth0.linkUser('...', '...');
      }).to.throwException(function(e) {
        expect(e.message).to.be('cb parameter is not valid');
      });
    });
  });

  context('linkUsers', function() {
    before(function() {
      this.auth0 = new Management({
        domain: 'me.auth0.com',
        token: 'the_token',
        _sendTelemetry: false
      });
    });

    afterEach(function() {
      request.post.restore();
    });

    it('should fetch the user from the api', function(done) {
      stub(request, 'post', function(url) {
        expect(url).to.be('https://me.auth0.com/api/v2/users/twitter|191919191919191/identities');
        return new RequestMock({
          body: {
            link_with: 'the_second_token'
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer the_token'
          },
          cb: function(cb) {
            cb(null, {
              body: [
                {
                  connection: 'twitter',
                  user_id: '191919191919191',
                  provider: 'twitter',
                  profile_data: {
                    email: '',
                    email_verified: false,
                    name: '',
                    username: 'johndoe',
                    given_name: '',
                    phone_number: '',
                    phone_verified: false,
                    family_name: ''
                  },
                  is_social: false,
                  access_token: ''
                }
              ]
            });
          }
        });
      });

      this.auth0.linkUser('twitter|191919191919191', 'the_second_token', function(err, user) {
        expect(err).to.be(null);
        expect(user).to.eql([
          {
            connection: 'twitter',
            user_id: '191919191919191',
            provider: 'twitter',
            profile_data: {
              email: '',
              email_verified: false,
              name: '',
              username: 'johndoe',
              given_name: '',
              phone_number: '',
              phone_verified: false,
              family_name: ''
            },
            is_social: false,
            access_token: ''
          }
        ]);
        done();
      });
    });
  });
});
