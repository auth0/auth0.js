import urljoin from 'url-join';

import objectHelper from '../helper/object';
import assert from '../helper/assert';
import responseHandler from '../helper/response-handler';

function DBConnection(request, options) {
  this.baseOptions = options;
  this.request = request;
}

/**
 * @callback signUpCallback
 * @param {Error} [err] error returned by Auth0 with the reason why the signup failed
 * @param {Object} [result] result of the signup request
 * @param {Object} result.email user's email
 * @param {Object} result.emailVerified if the user's email was verified
 */

/**
 * Creates a new user in a Auth0 Database connection
 *
 * @method signup
 * @param {Object} options
 * @param {String} options.email user email address
 * @param {String} options.password user password
 * @param {String} options.connection name of the connection where the user will be created
 * @param {Object} [options.userMetadata] additional signup attributes used for creating the user. Will be stored in `user_metadata`
 * @param {signUpCallback} cb
 * @see   {@link https://auth0.com/docs/api/authentication#signup}
 */
DBConnection.prototype.signup = function(options, cb) {
  var url;
  var body;
  var metadata;

  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      connection: { type: 'string', message: 'connection option is required' },
      email: { type: 'string', message: 'email option is required' },
      password: { type: 'string', message: 'password option is required' }
    }
  );
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'dbconnections', 'signup');

  body = objectHelper.merge(this.baseOptions, ['clientID']).with(options);

  metadata = body.user_metadata || body.userMetadata;

  body = objectHelper.blacklist(body, ['scope', 'userMetadata', 'user_metadata']);

  body = objectHelper.toSnakeCase(body, ['auth0Client']);

  if (metadata) {
    body.user_metadata = metadata;
  }

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

/**
 * @callback changePasswordCallback
 * @param {Error} [err] error returned by Auth0 with the reason why the request failed
 */

/**
 * Request an email with instruction to change a user's password
 *
 * @method changePassword
 * @param {Object} options
 * @param {String} options.email address where the user will receive the change password email. It should match the user's email in Auth0
 * @param {String} options.connection name of the connection where the user was created
 * @param {changePasswordCallback} cb
 * @see   {@link https://auth0.com/docs/api/authentication#change-password}
 */
DBConnection.prototype.changePassword = function(options, cb) {
  var url;
  var body;

  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      connection: { type: 'string', message: 'connection option is required' },
      email: { type: 'string', message: 'email option is required' }
    }
  );
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'dbconnections', 'change_password');

  body = objectHelper.merge(this.baseOptions, ['clientID']).with(options, ['email', 'connection']);

  body = objectHelper.toSnakeCase(body, ['auth0Client']);

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

export default DBConnection;
