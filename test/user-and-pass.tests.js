describe('Auth0 - User And Passwords', function () {

  it('should call the failure callback when user/pass is wrong', function (done) {
    var auth0 = new Auth0({
      domain:      'mdocs.auth0.com',
      callbackURL: 'http://localhost:3000/',
      clientID:    '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup',
      failure: function (err) {
        expect(err.status).to.equal(401);
        expect(err.details.code).to.equal('invalid_user_password');
        done();
      }
    });

    auth0._renderAndSubmitWSFedForm = function(){};

    auth0.login({
      connection: 'tests',
      username: 'testttt@wrong.com',
      password: '12345'
    });
  });

  it('should call the callback when user/pass is wrong', function (done) {
    var auth0 = new Auth0({
      domain:      'mdocs.auth0.com',
      callbackURL: 'http://localhost:3000/',
      clientID:    '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup'
    });

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
    var auth0 = new Auth0({
      domain:      'mdocs.auth0.com',
      callbackURL: 'http://localhost:3000/',
      clientID:    '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup'
    });

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
    var auth0 = new Auth0({
      domain:      'mdocs.auth0.com',
      callbackURL: 'http://localhost:3000/',
      clientID:    '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup'
    });

    auth0._renderAndSubmitWSFedForm = function (htmlForm) {
      expect(htmlForm).to.match(/<form/);
      done();
    };

    auth0.login({
      connection: 'tests',
      username: 'johnfoo@gmail.com',
      password: '12345'
    });
  });

  it('should render wsfed form after successfull signup', function (done) {
    var auth0 = new Auth0({
      domain:      'mdocs.auth0.com',
      callbackURL: 'http://localhost:3000/',
      clientID:    '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup'
    });

    auth0._renderAndSubmitWSFedForm = function (htmlForm) {
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
    var auth0 = new Auth0({
      domain:      'mdocs.auth0.com',
      callbackURL: 'http://localhost:3000/',
      clientID:    '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup'
    });

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

  it('should not render wsfed form after successfull signup if auto_login is false', function (done) {
    var auth0 = new Auth0({
      domain:      'mdocs.auth0.com',
      callbackURL: 'http://localhost:3000/',
      clientID:    '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup'
    });

    auth0._renderAndSubmitWSFedForm = function (htmlForm) {
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

  /*it('should return SSO data after successfull authentication', function (done) {
    forceLogout('mdocs.auth0.com', function () {
      var auth0 = new Auth0({
        domain:       'mdocs.auth0.com',
        callbackURL:  'http://localhost:3000',
        clientID:     '0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup'
      });

      var loginStarted;
      var iframe = document.createElement('iframe');
      iframe.name = 'test-iframe';
      iframe.style.display = 'none';
      iframe.onload = function() {
        if (!loginStarted) return;
        
        auth0.getSSOData(function (err, ssoData) {
          expect(ssoData.sso).to.eql(true);
          expect(ssoData.lastUsedClientID).to.eql('0HP71GSd6PuoRYJ3DXKdiXCUUdGmBbup');
          expect(ssoData.lastUsedUsername).to.eql('johnfoo@gmail.com');
          expect(ssoData.lastUsedConnection).to.exist;
          expect(ssoData.lastUsedConnection.name).to.eql('tests');
          expect(ssoData.lastUsedConnection.strategy).to.eql('auth0');
          done();
        });
      };

      document.body.appendChild(iframe);

      auth0._renderAndSubmitWSFedForm = function (formHtml) {
        var div = document.createElement('div');
        div.innerHTML = formHtml;
        var form = document.body.appendChild(div).children[0];
        form.setAttribute('target', 'test-iframe');
        form.submit();
        loginStarted = true;
      };

      auth0.login({
        connection: 'tests',
        username:   'johnfoo@gmail.com',
        password:   '12345'
      });
    });
  });*/
});
