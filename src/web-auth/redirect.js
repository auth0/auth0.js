var UsernamePassword = require('./username-password');
var TransactionManager = require('./transaction-manager');
var objectHelper = require('../helper/object');
var Warn = require('../helper/warn');

function Redirect(client, options) {
  this.baseOptions = options;
  this.client = client;

  this.transactionManager = new TransactionManager(this.baseOptions.transaction);
  this.warn = new Warn({
    disableWarnings: !!options._disableDeprecationWarnings
  });
}

/**
 * Initializes the legacy Lock login flow in redirect mode
 *
 * @method login
 * @param {Object} options
 * @param {Function} cb
 * @deprecated `webauth.redirect.login` will be soon deprecated, use `webauth.login` instead.
 */
Redirect.prototype.login = function (options, cb) {
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

  this.warn.warning('`webauth.redirect.login` will be soon deprecated, use `webauth.login` instead.');

  params = this.transactionManager.process(params);

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
    return _this.login(options, cb);
  });
};

module.exports = Redirect;
