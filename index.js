var assert_required = require('./assert_required');
var qs = require('querystring');

function Auth0 (options) {
  if (!(this instanceof Auth0)) {
    return new Auth0(options);
  }

  assert_required(options, 'clientID');
  assert_required(options, 'redirect_uri');
  assert_required(options, 'domain');

  this._clientID = options.clientID;
  this._redirect_uri = options.redirect_uri;
  this._domain = options.domain;

}

Auth0.prototype._redirect = function (url) {
  global.window.location = url;
};

Auth0.prototype.login = function (options) {
  var query = qs.stringify({
    response_type: 'token',
    client_id:     this._clientID,
    connection:    options.connection,
    redirect_uri:  this._redirect_uri,
    scope:         'openid profile'
  });

  this._redirect('https://' + this._domain + '/authorize?' + query);
};

if (global.window) {
  global.window.Auth0 = Auth0;
} else {
  module.exports = Auth0;
}
