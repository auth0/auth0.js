/**
 * Config mocha
 */

mocha.timeout(60000);
mocha.globals(['jQuery*', '__auth0jp*']);

/**
 * Test User and Password
 */

describe('Auth0 - User And Passwords', function () {
  var auth0 = new Auth0({
    domain:      'mdocs.auth0.com',
    callbackURL: 'http://localhost:3000/',
    clientID:    'ptR6URmXef0OfBDHK0aCIy7iPKpdCG4t'
  });

  describe('Login', function () {

    describe('with resource owner', function () {

      it('should call the callback when user/pass is wrong', function (done) {
        auth0.login({
          connection: 'tests',
          username: 'testttt@wrong.com',
          password: '12345'
        }, function (err, profile) {
          expect(err.status).to.equal(401);
          expect(err.details.code).to.equal('invalid_user_password');
          done();
        });
      });

      // Fails on IE8. Some bug with errors on XMLHttpRequest handling
      // XXX: Fix it!
      it.skip('should call the callback with err when the connection doesn\'t exists', function (done) {
        auth0.login({
          connection: 'testsw3eeasdsadsa',
          username: 'testttt@wrong.com',
          password: '12345'
        }, function (err, profile) {
          expect(err.status).to.equal(400);
          expect(err.message).to.equal('invalid_connection');
          done();
        });
      });

      it('should return profile after successfull authentication', function (done) {
        auth0.login({
          connection: 'tests',
          username: 'johnfoo@gmail.com',
          password: '12345'
        }, function (err, profile, id_token, access_token) {
          expect(profile.name).to.eql('John Foo');
          expect(profile.foo).to.eql('bar');
          expect(profile.identities.length).to.eql(1);
          expect(id_token).to.exist;
          expect(access_token).to.exist;
          done();
        });
      });

      it('should return refresh_token after successfull authentication with offline_mode', function (done) {
        auth0.login({
          connection: 'tests',
          username: 'johnfoo@gmail.com',
          password: '12345',
          offline_mode: true
        }, function (err, profile, id_token, access_token, state, refresh_token) {
          expect(profile.name).to.eql('John Foo');
          expect(profile.foo).to.eql('bar');
          expect(profile.identities.length).to.eql(1);
          expect(id_token).to.exist;
          expect(refresh_token).to.exist;
          expect(access_token).to.exist;
          done();
        });
      });

    });

    describe('with wsfed', function () {

      it('should call the callback when user/pass is wrong', function (done) {
        auth0.login({
          connection: 'tests',
          username: 'testttt@wrong.com',
          password: '12345'
        }, function (err) {
          expect(err.status).to.equal(401);
          expect(err.details.code).to.equal('invalid_user_password');
          done();
        });
      });

      it('should call the callback with err when the connection doesn\'t exists', function (done) {
        auth0.login({
          connection: 'testsw3eeasdsadsa',
          username: 'testttt@wrong.com',
          password: '12345'
        }, function (err) {
          expect(err.status).to.equal(404);
          expect(err.message).to.match(/connection not found/ig);
          done();
        });
      });

      it('should render wsfed form after successfull authentication', function (done) {
        auth0._renderAndSubmitWSFedForm = function (options, htmlForm) {
          expect(htmlForm).to.match(/<form/);
          done();
        };

        auth0.login({
          connection: 'tests',
          username: 'johnfoo@gmail.com',
          password: '12345'
        });
      });

    });

    it('should trim username before login', function (done) {
      auth0.login({
        connection: 'tests',
        username: '    johnfoo@gmail.com     ',
        password: '12345'
      }, function (err, profile, id_token, access_token) {
        expect(profile.name).to.eql('John Foo');
        expect(profile.foo).to.eql('bar');
        expect(profile.identities.length).to.eql(1);
        expect(id_token).to.exist;
        expect(access_token).to.exist;
        done();
      });
    });
  });

  describe('Signup', function () {

    it('should fail when the username is null', function (done) {
      auth0.signup({
        connection: 'tests',
        username: null,
        password: '12345'
      }, function (err) {
        expect(err.status).to.equal(400);
        expect(err.message).to.exist;
        expect(err.details).to.exist;
        done();
      });
    });

    it('should handle server errors', function (done) {
      auth0.signup({
        connection: 'tests',
        username:   'pepo@example.com',
        password:   '12345'
      }, function (err) {
        expect(err.status).to.equal(500);
        expect(err.message).to.exist;
        expect(err.details).to.exist;
        done();
      });
    });

    describe('with resource owner authentication', function () {

      it('should return profile after successfull signup', function (done) {
        auth0.signup({
          connection: 'tests',
          username:   'johnfoo@gmail.com',
          password:   '12345'
        }, function (err, profile, id_token, access_token) {
          expect(profile.name).to.eql('John Foo');
          expect(profile.identities.length).to.eql(1);
          expect(id_token).to.exist;
          expect(access_token).to.exist;
          done();
        });
      });

      it('should not return profile after successfull signup if auto_login is false', function (done) {
        auth0._renderAndSubmitWSFedForm = function (options, htmlForm) {
          done(new Error('this should not be called'));
        };

        auth0.signup({
          connection: 'tests',
          username:   'johnfoo@gmail.com',
          password:   '12345',
          auto_login: false
        }, function (err, profile) {
          done(profile);
        });
      });

    });

    describe('with wsfed authentication', function () {

      it('should render wsfed form after successfull signup', function (done) {
        auth0._renderAndSubmitWSFedForm = function (options, htmlForm) {
          expect(htmlForm).to.match(/<form/);
          done();
        };

        auth0.signup({
          connection: 'tests',
          username: 'johnfoo@gmail.com',
          password: '12345'
        }, function (err) {
          done(err);
        });
      });

      it('should not render wsfed form after successfull signup if auto_login is false', function (done) {
        auth0._renderAndSubmitWSFedForm = function (options, htmlForm) {
          done(new Error('this should not be called'));
        };

        auth0.signup({
          connection: 'tests',
          username:   'johnfoo@gmail.com',
          password:   '12345',
          auto_login: false
        }, function (err) {
          done(err);
        });
      });

    });

    it('should trim username before signup', function (done) {
      auth0.signup({
        connection: 'tests',
        username:   'johnfoo@gmail.com',
        password:   '12345'
      }, function (err, profile) {
        expect(err).to.be(null);
        done();
      });
    });

  });

  describe('Change Password', function () {
    it('should fail when the username is null', function (done) {
      auth0.changePassword({
        connection: 'tests',
        username:   null,
        password:   '12345'
      }, function (err) {
        expect(err.status).to.equal(400);
        expect(err).to.have.property('message');
        expect(err).to.have.property('details');
        done();
      });
    });

    //this timeout sometimes. I need to improve.
    it('should return OK after successfull operation', function (done) {
      auth0.changePassword({
        connection: 'tests',
        username:   'johnfoo@contoso.com',
        password:   '12345'
      }, function (err) {
        expect(err).to.be(null);
        done();
      });
    });

    it('should trim username before operation', function (done) {
      auth0.changePassword({
        connection: 'tests',
        username:     '    johnfoo@gmail.com    ',
        password:   '12345'
      }, function (err) {
        expect(err).to.be(null);
        done();
      });
    });

  });

  describe('Validate User', function () {

    it('should return "true" if the credentials are valid', function (done) {
      auth0.validateUser({
        connection:   'tests',
        username:     'johnfoo@gmail.com',
        password:     '12345'
      }, function (err, valid) {
        expect(err).to.be(null);
        expect(valid).to.equal(true);
        done();
      });
    });

    it('should return "false" if username is invalid', function (done) {
      auth0.validateUser({
        connection:   'tests',
        username:     'invalid-user@gmail.com',
        password:     '12345'
      }, function (err, valid) {
        expect(err).to.be(null);
        expect(valid).to.equal(false);
        done();
      });
    });

    it('should return "false" if connection is invalid', function (done) {
      auth0.validateUser({
        connection:   'invalid-conn',
        username:     'johnfoo@gmail.com',
        password:     '12345'
      }, function (err, valid) {
        expect(err).to.be(null);
        expect(valid).to.equal(false);
        done();
      });
    });

    it('should return error if connection is not specified', function (done) {
      auth0.validateUser({
        username:     'johnfoo@gmail.com',
        password:     '12345'
      }, function (err) {
        if (auth0._use)
        expect(err.message).to.equal('connection parameter is mandatory');
        done();
      });
    });

    it('should trim username before validation', function (done) {
      auth0.validateUser({
        connection:   'tests',
        username:     '    johnfoo@gmail.com    ',
        password:     '12345'
      }, function (err, valid) {
        expect(err).to.be(null);
        expect(valid).to.equal(true);
        done();
      });
    });

  });

});
