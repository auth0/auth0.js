var UsernamePassword = require('./username-password');
var objectHelper = require('../helper/object');
var Warn = require('../helper/warn');
var assert = require('../helper/assert');

function Redirect(client, options) {
  this.baseOptions = options;
  this.client = client;

  this.warn = new Warn({
    disableWarnings: !!options._disableDeprecationWarnings
  });
}

/**
 * Initializes the legacy Lock login flow in redirect mode
 *
 * @method loginWithCredentials
 * @param {Object} options
 * @param {Function} cb
 * @deprecated `webauth.redirect.loginWithCredentials` will be soon deprecated, use `webauth.login` instead.
 */
Redirect.prototype.loginWithCredentials = function (options, cb) {
  var usernamePassword;

  var params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'redirectUri',
    'tenant',
    'responseType',
    'responseMode',
    'scope',
    'audience'
  ]).with(options);

  this.warn.warning('`webauth.redirect.loginWithCredentials` will be soon deprecated, use `webauth.login` instead.');

  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
    responseType: { type: 'string', message: 'responseType option is required' }
  });

  usernamePassword = new UsernamePassword(this.baseOptions);
  return usernamePassword.login(params, function (err, data) {
    if (err) {
      return cb(err);
    }
    return usernamePassword.callback(data);
  });
};

/**
 * Signs up a new user and automatically logs the user in after the signup.
 *
 * @method signupAndLogin
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-signup
 * @param {Function} cb
 */
Redirect.prototype.signupAndLogin = function (options, cb) {
  var _this = this;
  return this.client.dbConnection.signup(options, function (err) {
    if (err) {
      return cb(err);
    }
    return _this.loginWithCredentials(options, cb);
  });
};

module.exports = Redirect;
