var urljoin = require('url-join');

var RequestBuilder = require('../helper/request-builder');
var qs = require('../helper/qs');
var objectHelper = require('../helper/object');
var assert = require('../helper/assert');
var responseHandler = require('../helper/response-handler');
var parametersWhitelist = require('../helper/parameters-whitelist');
var Warn = require('../helper/warn');

var PasswordlessAuthentication = require('./passwordless-authentication');
var DBConnection = require('./db-connection');

/**
 * Auth0 Authentication API client
 * @constructor
 * @param {Object} options
 * @param {Object} options.domain
 * @param {Object} options.clienID
 * @param {Object} options.responseType
 * @param {Object} options.responseMode
 * @param {Object} options.scope
 * @param {Object} options.audience
 * @param {Object} options._disableDeprecationWarnings
 */
function Authentication(options) {
  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    domain: { type: 'string', message: 'domain option is required' },
    clientID: { type: 'string', message: 'clientID option is required' },
    responseType: { optional: true, type: 'string', message: 'responseType is not valid' },
    responseMode: { optional: true, type: 'string', message: 'responseMode is not valid' },
    redirectUri: { optional: true, type: 'string', message: 'redirectUri is not valid' },
    scope: { optional: true, type: 'string', message: 'scope is not valid' },
    audience: { optional: true, type: 'string', message: 'audience is not valid' },
    _disableDeprecationWarnings: { optional: true, type: 'boolean', message: '_disableDeprecationWarnings option is not valid' },
    _sendTelemetry: { optional: true, type: 'boolean', message: '_sendTelemetry option is not valid' },
    _telemetryInfo: { optional: true, type: 'object', message: '_telemetryInfo option is not valid' }
  });
  /* eslint-enable */

  this.baseOptions = options;

  this.baseOptions._sendTelemetry = this.baseOptions._sendTelemetry === false ?
                                        this.baseOptions._sendTelemetry : true;

  this.baseOptions.rootUrl = 'https://' + this.baseOptions.domain;

  this.request = new RequestBuilder(this.baseOptions);

  this.passwordless = new PasswordlessAuthentication(this.request, this.baseOptions);
  this.dbConnection = new DBConnection(this.request, this.baseOptions);

  this.warn = new Warn({
    disableWarnings: !!options._disableDeprecationWarnings
  });
}

/**
 * Builds and returns the `/authorize` url in order to initialize a new authN/authZ transaction
 *
 * @method buildAuthorizeUrl
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#get--authorize_db
 * @param {Function} cb
 */
Authentication.prototype.buildAuthorizeUrl = function (options) {
  var params;
  var qString;

  assert.check(options, { type: 'object', message: 'options parameter is not valid' });

  params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'responseType',
    'responseMode',
    'redirectUri',
    'scope',
    'audience'
  ]).with(options);

  /* eslint-disable */
  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
    clientID: { type: 'string', message: 'clientID option is required' },
    redirectUri: { optional: true, type: 'string', message: 'redirectUri option is required' },
    responseType: { type: 'string', message: 'responseType option is required' },
    nonce: { type: 'string', message: 'nonce option is required', condition: function(o) {
      return o.responseType.indexOf('code') === -1 && o.responseType.indexOf('id_token') !== -1;
    } },
    scope: { optional: true, type: 'string', message: 'scope option is required' },
    audience: { optional: true, type: 'string', message: 'audience option is required' }
  });
  /* eslint-enable */

  // eslint-disable-next-line
  if (this.baseOptions._sendTelemetry) {
    params.auth0Client = this.request.getTelemetryData();
  }

  if (params.connection_scope && assert.isArray(params.connection_scope)) {
    params.connection_scope = params.connection_scope.join(',');
  }

  params = objectHelper.toSnakeCase(params, ['auth0Client']);
  params = parametersWhitelist.oauthAuthorizeParams(this.warn, params);

  qString = qs.build(params);

  return urljoin(this.baseOptions.rootUrl, 'authorize', '?' + qString);
};

/**
 * Builds and returns the Logout url in order to initialize a new authN/authZ transaction
 *
 * @method buildLogoutUrl
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#get--v2-logout
 */
Authentication.prototype.buildLogoutUrl = function (options) {
  var params;
  var qString;

  assert.check(options, {
    optional: true,
    type: 'object',
    message: 'options parameter is not valid'
  });

  params = objectHelper.merge(this.baseOptions, ['clientID'])
                .with(options || {});

  // eslint-disable-next-line
  if (this.baseOptions._sendTelemetry) {
    params.auth0Client = this.request.getTelemetryData();
  }

  params = objectHelper.toSnakeCase(params, ['auth0Client', 'returnTo']);

  qString = qs.build(params);

  return urljoin(this.baseOptions.rootUrl, 'v2', 'logout', '?' + qString);
};

/**
 * Makes a call to the `oauth/token` endpoint with `password` grant type
 *
 * @method loginWithDefaultDirectory
 * @param {Object} options: https://auth0.com/docs/api-auth/grant/password
 * @param {Function} cb
 */
Authentication.prototype.loginWithDefaultDirectory = function (options, cb) {
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    username: { type: 'string', message: 'username option is required' },
    password: { type: 'string', message: 'password option is required' },
    scope: { optional: true, type: 'string', message: 'scope option is required' },
    audience: { optional: true, type: 'string', message: 'audience option is required' }
  });

  options.grantType = 'password';

  return this.oauthToken(options, cb);
};

/**
 * Makes a call to the `oauth/token` endpoint with `password-realm` grant type
 *
 * @method login
 * @param {Object} options:
 * @param {Object} options.username
 * @param {Object} options.password
 * @param {Object} options.scope
 * @param {Object} options.audience
 * @param {Object} options.realm: the HRD domain or the connection name
 * @param {Function} cb
 */
Authentication.prototype.login = function (options, cb) {
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    username: { type: 'string', message: 'username option is required' },
    password: { type: 'string', message: 'password option is required' },
    realm: { type: 'string', message: 'realm option is required' },
    scope: { optional: true, type: 'string', message: 'scope option is required' },
    audience: { optional: true, type: 'string', message: 'audience option is required' }
  });

  options.grantType = 'http://auth0.com/oauth/grant-type/password-realm';

  return this.oauthToken(options, cb);
};

/**
 * Makes a call to the `oauth/token` endpoint
 *
 * @method oauthToken
 * @param {Object} options:
 * @param {Object} options.username
 * @param {Object} options.password
 * @param {Object} options.scope
 * @param {Object} options.audience
 * @param {Object} options.grantType
 * @param {Function} cb
 */
Authentication.prototype.oauthToken = function (options, cb) {
  var url;
  var body;

  assert.check(options, { type: 'object', message: 'options parameter is not valid' });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'oauth', 'token');

  body = objectHelper.merge(this.baseOptions, [
    'clientID',
    'scope',
    'audience'
  ]).with(options);

  assert.check(body, { type: 'object', message: 'options parameter is not valid' }, {
    clientID: { type: 'string', message: 'clientID option is required' },
    grantType: { type: 'string', message: 'grantType option is required' },
    scope: { optional: true, type: 'string', message: 'scope option is required' },
    audience: { optional: true, type: 'string', message: 'audience option is required' }
  });

  body = objectHelper.toSnakeCase(body, ['auth0Client']);
  body = parametersWhitelist.oauthTokenParams(this.warn, body);

  body.grant_type = body.grant_type;

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

/**
 * Makes a call to the `/ro` endpoint
 *
 * @method loginWithResourceOwner
 * @param {Object} options:
 * @param {Object} options.username
 * @param {Object} options.password
 * @param {Object} options.connection
 * @param {Object} options.scope
 * @param {Object} options.audience
 * @param {Function} cb
 * @deprecated `loginWithResourceOwner` will be soon deprecated, user `login` instead.
 */
Authentication.prototype.loginWithResourceOwner = function (options, cb) {
  var url;
  var body;

  this.warn.warning('`loginWithResourceOwner` will be soon deprecated, user `login` instead.');

  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    username: { type: 'string', message: 'username option is required' },
    password: { type: 'string', message: 'password option is required' },
    connection: { type: 'string', message: 'connection option is required' },
    scope: { optional: true, type: 'string', message: 'scope option is required' },
    audience: { optional: true, type: 'string', message: 'audience option is required' }
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'oauth', 'ro');

  body = objectHelper.merge(this.baseOptions, [
    'clientID',
    'scope',
    'audience'
  ]).with(options);

  body = objectHelper.toSnakeCase(body, ['auth0Client']);

  body.grant_type = body.grant_type || 'password';

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

/**
 * Makes a call to the `/ssodata` endpoint
 *
 * @method getSSOData
 * @param {Boolean} withActiveDirectories
 * @param {Function} cb
 * @deprecated `getSSOData` will be soon deprecated.
 */
Authentication.prototype.getSSOData = function (withActiveDirectories, cb) {
  var url;
  var params = '';

  this.warn.warning('`getSSOData` will be soon deprecated.');

  if (typeof withActiveDirectories === 'function') {
    cb = withActiveDirectories;
    withActiveDirectories = false;
  }

  assert.check(withActiveDirectories, { type: 'boolean', message: 'withActiveDirectories parameter is not valid' });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  if (withActiveDirectories) {
    params = '?' + qs.build({
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

/**
 * Makes a call to the `/userinfo` endpoint and returns the user profile
 *
 * @method userInfo
 * @param {String} accessToken
 * @param {Function} cb
 */
Authentication.prototype.userInfo = function (accessToken, cb) {
  var url;

  assert.check(accessToken, { type: 'string', message: 'accessToken parameter is not valid' });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'userinfo');

  return this.request
    .get(url)
    .set('Authorization', 'Bearer ' + accessToken)
    .end(responseHandler(cb, { ignoreCasing: true }));
};

/**
 * Makes a call to the `/delegation` endpoint
 *
 * @method delegation
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--delegation
 * @param {Function} cb
 * @deprecated `delegation` will be soon deprecated.
 */
Authentication.prototype.delegation = function (options, cb) {
  var url;
  var body;

  this.warn.warning('`delegation` will be soon deprecated.');

  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    grant_type: { type: 'string', message: 'grant_type option is required' }
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'delegation');

  body = objectHelper.merge(this.baseOptions, ['clientID'])
                .with(options);

  body = objectHelper.toSnakeCase(body, ['auth0Client']);

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

/**
 * Fetches the user country based on the ip.
 *
 * @method getUserCountry
 * @param {Function} cb
 */
Authentication.prototype.getUserCountry = function (cb) {
  var url;

  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'user', 'geoloc', 'country');

  return this.request
    .get(url)
    .end(responseHandler(cb));
};

module.exports = Authentication;
