var urljoin = require('url-join');

var objectHelper = require('../helper/object');
var assert = require('../helper/assert');
var qs = require('qs');
var responseHandler = require('../helper/response-handler');

function PasswordlessAuthentication(request, options) {
  this.baseOptions = options;
  this.request = request;
}

/**
 * Builds and returns the passwordless TOTP verify url in order to initialize a new authN/authZ transaction
 *
 * @method buildVerifyUrl
 * @param {Object} options
 * @param {Function} cb
 */
PasswordlessAuthentication.prototype.buildVerifyUrl = function (options) {
  var params;
  var qString;

  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    connection: { type: 'string', message: 'connection option is required' },
    verificationCode: { type: 'string', message: 'verificationCode option is required' },
    phoneNumber: { optional: false, type: 'string', message: 'phoneNumber option is required',
            condition: function (o) { return !o.email; } },
    email: { optional: false, type: 'string', message: 'email option is required',
            condition: function (o) { return !o.phoneNumber; } }
  });
  /* eslint-enable */

  params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'responseType',
    'responseMode',
    'redirectUri',
    'scope',
    'audience'
  ]).with(options);

  // eslint-disable-next-line
  if (this.baseOptions._sendTelemetry) {
    params.auth0Client = this.request.getTelemetryData();
  }

  params = objectHelper.toSnakeCase(params, ['auth0Client']);

  qString = qs.stringify(params);

  return urljoin(this.baseOptions.rootUrl, 'passwordless', 'verify_redirect', '?' + qString);
};

/**
 * Initializes a new passwordless authN/authZ transaction
 *
 * @method start
 * @param {Object} options: https://auth0.com/docs/api/authentication#passwordless
 * @param {Function} cb
 */
PasswordlessAuthentication.prototype.start = function (options, cb) {
  var url;
  var body;

  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    connection: { type: 'string', message: 'connection option is required' },
    send: { type: 'string', message: 'send option is required', values: ['link', 'code'],
            value_message: 'send is not valid ([link, code])' },
    phoneNumber: { optional: true, type: 'string', message: 'phoneNumber option is required',
            condition: function (o) { return o.send === 'code' || !o.email; } },
    email: { optional: true, type: 'string', message: 'email option is required',
            condition: function (o) { return o.send === 'link' || !o.phoneNumber; } },
    authParams: { optional: true, type: 'object', message: 'authParams option is required' }
  });
  /* eslint-enable */

  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'start');

  body = objectHelper.merge(this.baseOptions, [
    'clientID',
    'responseType',
    'redirectUri',
    'scope'
  ]).with(options);

  if (body.scope) {
    body.authParams = body.authParams || {};
    body.authParams.scope = body.scope;
  }

  if (body.redirectUri) {
    body.authParams = body.authParams || {};
    body.authParams.redirect_uri = body.redirectUri;
  }

  if (body.responseType) {
    body.authParams = body.authParams || {};
    body.authParams.response_type = body.responseType;
  }

  delete body.redirectUri;
  delete body.responseType;
  delete body.scope;

  body = objectHelper.toSnakeCase(body, ['auth0Client', 'authParams']);

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

/**
 * Verifies the passwordless TOTP and returns an error if any.
 *
 * @method buildVerifyUrl
 * @param {Object} options
 * @param {Function} cb
 */
PasswordlessAuthentication.prototype.verify = function (options, cb) {
  var url;
  var cleanOption;

  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    connection: { type: 'string', message: 'connection option is required' },
    verificationCode: { type: 'string', message: 'verificationCode option is required' },
    phoneNumber: { optional: false, type: 'string', message: 'phoneNumber option is required',
            condition: function (o) { return !o.email; } },
    email: { optional: false, type: 'string', message: 'email option is required',
            condition: function (o) { return !o.phoneNumber; } }
  });
  /* eslint-enable */

  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  cleanOption = objectHelper.toSnakeCase(options, ['auth0Client']);

  url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'verify');

  return this.request
    .post(url)
    .send(cleanOption)
    .end(responseHandler(cb));
};

module.exports = PasswordlessAuthentication;
