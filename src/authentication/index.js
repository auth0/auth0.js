var urljoin = require('url-join');

var RequestBuilder = require('../helper/request-builder');
var qs = require('../helper/qs');
var objectHelper = require('../helper/object');
var assert = require('../helper/assert');
var responseHandler = require('../helper/response-handler');

var PasswordlessAuthentication = require('./passwordless-authentication');
var DBConnection = require('./db-connection');

function Authentication(options) {
  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    domain: { type: 'string', message: 'domain option is required' },
    clientID: { type: 'string', message: 'clientID option is required' },
    responseType: { optional: true, type: 'string', message: 'responseType is not valid' },
    redirectUri: { optional: true, type: 'string', message: 'redirectUri is not valid' },
    scope: { optional: true, type: 'string', message: 'scope is not valid' },
    audience: { optional: true, type: 'string', message: 'audience is not valid' },
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
}

Authentication.prototype.buildAuthorizeUrl = function (options) {
  var params;
  var qString;

  assert.check(options, { type: 'object', message: 'options parameter is not valid' });

  params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'responseType',
    'redirectUri',
    'scope',
    'audience'
  ]).with(options);

  /* eslint-disable */
  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
    clientID: { type: 'string', message: 'clientID option is required' },
    redirectUri: { type: 'string', message: 'redirectUri option is required' },
    responseType: { type: 'string', message: 'responseType option is required' },
    nonce: { type: 'string', message: 'nonce option is required', condition: function(o) {
      return o.responseType.indexOf('code') === -1 && o.responseType.indexOf('id_token') !== -1;
    } },
    state: { type: 'string', message: 'state option is required', condition: function(o) {
      return o.responseType.indexOf('code') === -1;
    } },
    scope: { optional: true, type: 'string', message: 'scope option is required' },
    audience: { optional: true, type: 'string', message: 'audience option is required' }
  });
  /* eslint-enable */

  // eslint-disable-next-line
  if (this.baseOptions._sendTelemetry) {
    params.auth0Client = this.request.getTelemetryData();
  }

  params = objectHelper.toSnakeCase(params, ['auth0Client']);

  qString = qs.build(params);

  return urljoin(this.baseOptions.rootUrl, 'authorize', '?' + qString);
};

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

Authentication.prototype.login = function (options, cb) {
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    username: { type: 'string', message: 'username option is required' },
    password: { type: 'string', message: 'password option is required' }
  });

  options.grantType = 'password';

  return this.oauthToken(options, cb);
};

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

  body.grant_type = body.grant_type;

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

Authentication.prototype.loginWithResourceOwner = function (options, cb) {
  var url;
  var body;

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

Authentication.prototype.userInfo = function (accessToken, cb) {
  var url;

  assert.check(accessToken, { type: 'string', message: 'accessToken parameter is not valid' });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'userinfo');

  return this.request
    .get(url)
    .set('Authorization', 'Bearer ' + accessToken)
    .end(responseHandler(cb));
};

Authentication.prototype.delegation = function (options, cb) {
  var url;
  var body;

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

module.exports = Authentication;
