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
          password: '12345',
          sso: false
        }, function (err, profile) {
          expect(err.status).to.equal(401);
          expect(err.details.code).to.equal('invalid_user_password');
          expect(profile).not.to.be.ok();
          done();
        });
      });

      // Fails on IE8. Some bug with errors on XMLHttpRequest handling
      // XXX: Fix it!
      it.skip('should call the callback with err when the connection doesn\'t exists', function (done) {
        auth0.login({
          connection: 'testsw3eeasdsadsa',
          username: 'testttt@wrong.com',
          password: '12345',
          sso:      false
        }, function (err, profile) {
          expect(err.status).to.equal(400);
          expect(err.message).to.equal('invalid_connection');
          expect(profile).not.to.be.ok();
          done();
        });
      });

      it('should return profile after successfull authentication', function (done) {
        auth0.login({
          connection: 'tests',
          username: 'johnfoo@gmail.com',
          password: '12345',
          sso: false
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
          offline_mode: true,
          sso: false
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

      it('should trim username before login', function (done) {
        auth0.login({
          connection: 'tests',
          username: '    johnfoo@gmail.com     ',
          password: '12345',
          sso:      false
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
        password:   '12345',
        auto_login: false
      }, function (err) {
        expect(err.status).to.equal(401);
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
          password:   '12345',
          sso:        false
        }, function (err, profile, id_token, access_token) {
          expect(profile.name).to.eql('John Foo');
          expect(profile.identities.length).to.eql(1);
          expect(id_token).to.exist;
          expect(access_token).to.exist;
          done();
        });
      });

      it('should not return profile after successfull signup if auto_login is false', function (done) {
        auth0._renderAndSubmitWSFedForm = function () {
          done(new Error('this should not be called'));
        };

        auth0.signup({
          connection: 'tests',
          username:   'johnfoo@gmail.com',
          password:   '12345',
          auto_login: false,
          sso: false
        }, function (err, profile) {
          done(profile);
        });
      });

      it('should trim username before signup', function (done) {
        auth0.signup({
          connection: 'tests',
          username:   'johnfoo@gmail.com',
          password:   '12345',
          sso:        false
        }, function (err, profile) {
          expect(err).to.be(null);
          expect(profile).to.be.ok();
          done();
        });
      });

      it('should handle username and email when requires_username enabled', function (done) {
        var username = makeUsername(15);

        auth0.signup({
          connection: 'requires-username',
          username:   username,
          email: username + '@gmail.com',
          password:   '12345',
          sso: false
        }, function (err, profile) {
          expect(err).to.be(null);
          expect(profile).to.have.property('username');
          expect(profile).to.have.property('email');
          expect(profile.username).to.be(username);
          expect(profile.email).to.be(username + '@gmail.com');
          done();
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

    it('should error when username is missing when requires_username enabled', function (done) {
      var username = makeUsername(15);

      auth0.signup({
        connection: 'requires-username',
        email: username + '@gmail.com',
        password:   '12345'
      }, function (err, profile) {
        expect(err).to.not.be(null);
        expect(err.status).to.be(400);
        expect(err).to.have.property('message');
        expect(err).to.have.property('details');
        expect(err.message).to.match(/missing username/ig);
        expect(profile).not.to.be.ok();
        done();
      });
    });
  });

  describe('Change Password', function () {
    // TODO: add a test to check that the user can provide a username or email, when `requires_username` is enabled

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

    it('should present a proper error message for password strength errors (xhr ' + xhrSupportPrefix + ' supported)', function(done) {
      // TODO test JSONP request
      if (!xhrSupport) return done();

       var server = sinon.fakeServer.create();

       var response = {
         "name": "PasswordStrengthError",
         "code": "invalid_password",
         "description": {
           "rules": [{
             "message": "At least %d characters in length",
             "format": [6],
             "code": "lengthAtLeast",
             "verified": false
           }],
           "verified": false
         },
         "statusCode":400
       };

       server.respondWith('POST', 'https://' + auth0._domain + '/dbconnections/change_password',[
         400,
         { 'Content-Type': 'application/json' },
         JSON.stringify(response)
       ]);

       auth0.changePassword({
         connection: 'tests',
         username:   'johnfoo@contoso.com',
         password:   '12345'
       }, function (err) {
         expect(err).to.not.be(null);
         expect(err.message).to.be("Password is not strong enough.");
         expect(err.details).to.eql(response);
         done();
       });


       server.respond();
       server.restore();
    })
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

    it('should return "true" if the credentials with username and email are valid', function (done) {
      auth0.validateUser({
        connection:   'tests',
        username:     'johnfoo',
        email:        'johnfoo@gmail.com',
        password:     '12345'
      }, function (err, valid) {
        expect(err).to.be(null);
        expect(valid).to.equal(false);
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

    it('should return "false" if email is valid and username is invalid', function (done) {
      auth0.validateUser({
        connection:   'tests',
        username:     'invalid-user',
        email:        'johnfoo@gmail.com',
        password:     '12345'
      }, function (err, valid) {
        expect(err).to.be(null);
        expect(valid).to.equal(false);
        done();
      });
    });

    it('should return "false" if email is invalid and username is valid', function (done) {
      auth0.validateUser({
        connection:   'tests',
        username:     'johnfoo',
        email:        'invalid#email@gmail.com',
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


function makeUsername(size) {
  var uname = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for( var i=0; i < size; i++ ) {
    uname += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return uname.toLowerCase();
}
