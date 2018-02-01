var UsernamePassword = require('./username-password');
var objectHelper = require('../helper/object');
var windowHelper = require('../helper/window');
var Warn = require('../helper/warn');
var assert = require('../helper/assert');

function HostedPages(client, options) {
  this.baseOptions = options;
  this.client = client;

  this.warn = new Warn({
    disableWarnings: !!options._disableDeprecationWarnings
  });
}

/**
 * @callback credentialsCallback
 * @param {Error} [err] error returned by Auth0 with the reason of the Auth failure
 * @param {Object} [result] result of the AuthN request
 * @param {String} result.accessToken token that can be used with {@link userinfo}
 * @param {String} [result.idToken] token that identifies the user
 * @param {String} [result.refreshToken] token that can be used to get new access tokens from Auth0. Note that not all clients can request them or the resource server might not allow them.
 */

/**
 * Performs authentication with username/email and password with a database connection
 *
 * This method is not compatible with API Auth so if you need to fetch API tokens with audience
 * you should use {@link authorize} or {@link login}.
 *
 * @method loginWithCredentials
 * @param {Object} options
 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
 * @param {String} [options.responseType] type of the response used. It can be any of the values `code` and `token`
 * @param {String} [options.responseMode] how the AuthN response is encoded and redirected back to the client. Supported values are `query` and `fragment`
 * @param {String} [options.scope] scopes to be requested during AuthN. e.g. `openid email`
 * @param {credentialsCallback} cb
 */
HostedPages.prototype.login = function(options, cb) {
  if (windowHelper.getWindow().location.host !== this.baseOptions.domain) {
    throw new Error('This method is meant to be used only inside the Universal Login Page.');
  }
  var usernamePassword;

  var params = objectHelper
    .merge(this.baseOptions, [
      'clientID',
      'redirectUri',
      'tenant',
      'responseType',
      'responseMode',
      'scope',
      'audience',
      '_csrf',
      'state',
      '_intstate',
      'nonce'
    ])
    .with(options);

  assert.check(
    params,
    { type: 'object', message: 'options parameter is not valid' },
    {
      responseType: { type: 'string', message: 'responseType option is required' }
    }
  );

  usernamePassword = new UsernamePassword(this.baseOptions);
  return usernamePassword.login(params, function(err, data) {
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
 * @param {Object} options
 * @param {String} options.email user email address
 * @param {String} options.password user password
 * @param {String} options.connection name of the connection where the user will be created
 * @param {credentialsCallback} cb
 */
HostedPages.prototype.signupAndLogin = function(options, cb) {
  var _this = this;
  return _this.client.client.dbConnection.signup(options, function(err) {
    if (err) {
      return cb(err);
    }
    return _this.login(options, cb);
  });
};

module.exports = HostedPages;
