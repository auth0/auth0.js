var expect = require('chai').expect;
var Auth0  = require('../');
var url    = require('url');

describe('Auth0', function () {
  
  it('should fail to construct without a clientID', function () {
    expect(function () {
      new Auth0({});
    }).to.throw('clientID is required');
  });

  it('should fail to construct without a redirect_uri', function () {
    expect(function () {
      new Auth0({clientID: '1123sadsd'});
    }).to.throw('redirect_uri is required');
  });

  it('should fail to construct without a domain', function () {
    expect(function () {
      new Auth0({clientID: '1123sadsd', redirect_uri: 'aaaa'});
    }).to.throw('domain is required');
  });

  it('should force constructor', function () {
    var initialized_without_new = Auth0({
      clientID:    'aaaabcdefgh', 
      redirect_uri: 'https://myapp.com/callback',
      domain:      'aaa.auth0.com'
    });

    expect(initialized_without_new)
      .to.be.instanceOf(Auth0);
  });

  it('should redirect to /authorize with google', function (done) {
    var auth0 = Auth0({
      clientID:     'aaaabcdefgh', 
      redirect_uri: 'https://myapp.com/callback',
      domain:       'aaa.auth0.com'
    });

    auth0._redirect = function (the_url) {
      var parsed = url.parse(the_url, true);
      expect(parsed.host).to.equal('aaa.auth0.com');
      expect(parsed.pathname).to.equal('/authorize');
      expect(parsed.query.response_type).to.equal('token');
      expect(parsed.query.redirect_uri).to.equal('https://myapp.com/callback');
      expect(parsed.query.client_id).to.equal('aaaabcdefgh');
      expect(parsed.query.scope).to.equal('openid profile');
      done();
    };

    auth0.login({
      connection: 'google-oauth2'
    });
  });

});