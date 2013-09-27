var expect = require('chai').expect;

describe('Auth0 - User And Passwords', function () {
  var Auth0;
  
  before(function () {
    Auth0 = require('../index');
  });

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
});