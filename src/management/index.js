var urljoin = require('url-join');

var RequestBuilder = require('../helper/request-builder');
var assert = require('../helper/assert');
var responseHandler = require('../helper/response-handler');

/**
 * Auth0 Management API Client (methods allowed to be called from the browser only)
 * @constructor
 * @param {Object} options
 * @param {Object} options.domain your Auth0 acount domain
 * @param {Object} options.token a valid API token
 */
function Management(options) {
  /* eslint-disable */
  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      domain: { type: 'string', message: 'domain option is required' },
      token: { type: 'string', message: 'token option is required' },
      _sendTelemetry: {
        optional: true,
        type: 'boolean',
        message: '_sendTelemetry option is not valid'
      },
      _telemetryInfo: {
        optional: true,
        type: 'object',
        message: '_telemetryInfo option is not valid'
      }
    }
  );
  /* eslint-enable */

  this.baseOptions = options;

  this.baseOptions.headers = { Authorization: 'Bearer ' + this.baseOptions.token };

  this.request = new RequestBuilder(this.baseOptions);
  this.baseOptions.rootUrl = urljoin('https://' + this.baseOptions.domain, 'api', 'v2');
}

/**
 * @callback userCallback
 * @param {Error} [err] failure reason for the failed request to Management API
 * @param {Object} [result] user profile
 */

/**
 * Returns the user profile
 *
 * @method getUser
 * @param {String} userId identifier of the user to retrieve
 * @param {userCallback} cb
 * @see https://auth0.com/docs/api/management/v2#!/Users/get_users_by_id
 */
Management.prototype.getUser = function(userId, cb) {
  var url;

  assert.check(userId, { type: 'string', message: 'userId parameter is not valid' });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'users', userId);

  return this.request.get(url).end(responseHandler(cb, { ignoreCasing: true }));
};

/**
 * Updates the user metdata. It will patch the user metdata with the attributes sent.
 *
 *
 * @method patchUserMetadata
 * @param {String} userId
 * @param {Object} userMetadata
 * @param {userCallback} cb
 * @see   {@link https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id}
 */
Management.prototype.patchUserMetadata = function(userId, userMetadata, cb) {
  var url;

  assert.check(userId, { type: 'string', message: 'userId parameter is not valid' });
  assert.check(userMetadata, { type: 'object', message: 'userMetadata parameter is not valid' });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'users', userId);

  return this.request
    .patch(url)
    .send({ user_metadata: userMetadata })
    .end(responseHandler(cb, { ignoreCasing: true }));
};

/**
 * Link two users
 *
 * @method linkUser
 * @param {String} userId
 * @param {String} secondaryUserToken
 * @param {userCallback} cb
 * @see   {@link https://auth0.com/docs/api/management/v2#!/Users/post_identities}
 */
Management.prototype.linkUser = function(userId, secondaryUserToken, cb) {
  var url;
  /* eslint-disable */
  assert.check(userId, { type: 'string', message: 'userId parameter is not valid' });
  assert.check(secondaryUserToken, {
    type: 'string',
    message: 'secondaryUserToken parameter is not valid'
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
  /* eslint-enable */

  url = urljoin(this.baseOptions.rootUrl, 'users', userId, 'identities');

  return this.request
    .post(url)
    .send({ link_with: secondaryUserToken })
    .end(responseHandler(cb, { ignoreCasing: true }));
};

module.exports = Management;
