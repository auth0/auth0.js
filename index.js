var assert_required = require('./assert_required');
var qs = require('qs');
var Base64 = require('Base64');

function Auth0 (options) {
  if (!(this instanceof Auth0)) {
    return new Auth0(options);
  }

  assert_required(options, 'clientID');
  assert_required(options, 'callbackURL');
  assert_required(options, 'domain');

  this._clientID = options.clientID;
  this._callbackURL = options.callbackURL;
  this._domain = options.domain;

  if (options.success && window.location.hash.match(/access_token/)) {
    var parsed_qs = qs.parse(window.location.hash);
    var id_token = parsed_qs.id_token;
    var encoded = id_token.split('.')[1];
    var prof = JSON.parse(Base64.atob(encoded));
    options.success(prof, id_token, parsed_qs.access_token, parsed_qs.state);
  }
}

Auth0.prototype._redirect = function (url) {
  global.window.location = url;
};

Auth0.prototype.login = function (options) {
  var query = {
    response_type: 'token',
    client_id:     this._clientID,
    connection:    options.connection,
    redirect_uri:  this._callbackURL,
    scope:         'openid profile'
  };

  if (options.state) {
    query.state = options.state;
  }

  this._redirect('https://' + this._domain + '/authorize?' + qs.stringify(query));
};

if (global.window) {
  global.window.Auth0 = Auth0;
} else {
  module.exports = Auth0;
}
