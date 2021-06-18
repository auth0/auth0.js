import urljoin from 'url-join';
import qs from 'qs';

import UsernamePassword from './username-password';
import RequestBuilder from '../helper/request-builder';
import responseHandler from '../helper/response-handler';
import objectHelper from '../helper/object';
import windowHelper from '../helper/window';
import Warn from '../helper/warn';
import assert from '../helper/assert';

function HostedPages(client, options) {
  this.baseOptions = options;
  this.client = client;
  this.baseOptions.universalLoginPage = true;
  this.request = new RequestBuilder(this.baseOptions);

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
 * @param {String} [result.refreshToken] token that can be used to get new access tokens from Auth0. Note that not all Auth0 Applications can request them or the resource server might not allow them.
 * @ignore
 */

/**
 * @callback onRedirectingCallback
 * @param {function} done Must be called when finished so that authentication can be resumed
 * @ignore
 */

/**
 * Performs authentication with username/email and password with a database connection
 *
 * This method is not compatible with API Auth so if you need to fetch API tokens with audience
 * you should use {@link authorize} or {@link login}.
 *
 * @method login
 * @param {Object} options
 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
 * @param {String} [options.responseType] type of the response used. It can be any of the values `code` and `token`
 * @param {String} [options.responseMode] how the AuthN response is encoded and redirected back to the client. Supported values are `query` and `fragment`
 * @param {String} [options.scope] scopes to be requested during AuthN. e.g. `openid email`
 * @param {onRedirectingCallback} [options.onRedirecting] Hook function that is called before redirecting to /authorize, allowing you to handle custom code. You must call the `done` function to resume authentication.
 * @param {credentialsCallback} cb
 * @ignore
 */
HostedPages.prototype.login = function(options, cb) {
  if (windowHelper.getWindow().location.host !== this.baseOptions.domain) {
    throw new Error(
      'This method is meant to be used only inside the Universal Login Page.'
    );
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
      responseType: {
        type: 'string',
        message: 'responseType option is required'
      }
    }
  );

  usernamePassword = new UsernamePassword(this.baseOptions);

  return usernamePassword.login(params, function(err, data) {
    if (err) {
      return cb(err);
    }

    function doAuth() {
      usernamePassword.callback(data);
    }

    if (typeof options.onRedirecting === 'function') {
      return options.onRedirecting(function() {
        doAuth();
      });
    }

    doAuth();
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
 * @ignore
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

HostedPages.prototype.getSSOData = function(withActiveDirectories, cb) {
  var url;
  var params = '';

  if (typeof withActiveDirectories === 'function') {
    cb = withActiveDirectories;
    withActiveDirectories = false;
  }

  assert.check(withActiveDirectories, {
    type: 'boolean',
    message: 'withActiveDirectories parameter is not valid'
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  if (withActiveDirectories) {
    params =
      '?' +
      qs.stringify({
        ldaps: 1,
        client_id: this.baseOptions.clientID
      });
  }

  url = urljoin(this.baseOptions.rootUrl, 'user', 'ssodata', params);

  return this.request
    .get(url, { noHeaders: true })
    .withCredentials()
    .end(responseHandler(cb));
};

export default HostedPages;
