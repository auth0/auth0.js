describe('Auth0 - User And Passwords', function () {
  var auth0 = new Auth0({
    domain:      'mdocs.auth0.com',
    callbackURL: 'http://localhost:3000/',
    clientID:    'ptR6URmXef0OfBDHK0aCIy7iPKpdCG4t'
  });

  describe('Login', function () {

    describe('with callback', function () {

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

      it('should call the callback with err when the connection doesn\'t exists', function (done) {
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
          expect(profile.identities.length).to.eql(1);
          expect(id_token).to.exist;
          expect(access_token).to.exist;
          done();
        });
      });

    });

    describe('without callback function', function () {

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

  });
});
