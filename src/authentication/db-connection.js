var urljoin = require('url-join');

var objectHelper = require('../helper/object');
var assert = require('../helper/assert');
var responseHandler = require('../helper/response-handler');

function DBConnection(request, options) {
  this.baseOptions = options;
  this.request = request;
}

/**
 * Signup a new user
 *
 * @method signup
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-signup
 * @param {Function} cb
 */
DBConnection.prototype.signup = function (options, cb) {
  var url;
  var body;

  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    connection: { type: 'string', message: 'connection option is required' },
    email: { type: 'string', message: 'email option is required' },
    password: { type: 'string', message: 'password option is required' }
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'dbconnections', 'signup');

  body = objectHelper.merge(this.baseOptions, ['clientID'])
                .with(options);

  body = objectHelper.blacklist(body, ['scope']);

  body = objectHelper.toSnakeCase(body, ['auth0Client']);

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

/**
 * Initializes the change password flow
 *
 * @method signup
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-change_password
 * @param {Function} cb
 */
DBConnection.prototype.changePassword = function (options, cb) {
  var url;
  var body;

  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    connection: { type: 'string', message: 'connection option is required' },
    email: { type: 'string', message: 'email option is required' }
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'dbconnections', 'change_password');

  body = objectHelper.merge(this.baseOptions, ['clientID'])
                .with(options, ['email', 'connection']);

  body = objectHelper.toSnakeCase(body, ['auth0Client']);

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

module.exports = DBConnection;
