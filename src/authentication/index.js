import urljoin from 'url-join';
import qs from 'qs';

import RequestBuilder from '../helper/request-builder';
import objectHelper from '../helper/object';
import assert from '../helper/assert';
import SSODataStorage from '../helper/ssodata';
import windowHelper from '../helper/window';
import responseHandler from '../helper/response-handler';
import parametersWhitelist from '../helper/parameters-whitelist';
import Warn from '../helper/warn';
import WebAuth from '../web-auth/index';
import PasswordlessAuthentication from './passwordless-authentication';
import DBConnection from './db-connection';

/**
 * Creates a new Auth0 Authentication API client
 * @constructor
 * @param {Object} options
 * @param {String} options.domain your Auth0 domain
 * @param {String} options.clientID the Client ID found on your Application settings page
 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
 * @see {@link https://auth0.com/docs/api/authentication}
 */
function Authentication(auth0, options) {
  // If we have two arguments, the first one is a WebAuth instance, so we assign that
  // if not, it's an options object and then we should use that as options instead
  // this is here because we don't want to break people coming from v8
  if (arguments.length === 2) {
    this.auth0 = auth0;
  } else {
    options = auth0;
  }

  /* eslint-disable */
  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      domain: { type: 'string', message: 'domain option is required' },
      clientID: { type: 'string', message: 'clientID option is required' },
      responseType: { optional: true, type: 'string', message: 'responseType is not valid' },
      responseMode: { optional: true, type: 'string', message: 'responseMode is not valid' },
      redirectUri: { optional: true, type: 'string', message: 'redirectUri is not valid' },
      scope: { optional: true, type: 'string', message: 'scope is not valid' },
      audience: { optional: true, type: 'string', message: 'audience is not valid' },
      _disableDeprecationWarnings: {
        optional: true,
        type: 'boolean',
        message: '_disableDeprecationWarnings option is not valid'
      },
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
  this.baseOptions._sendTelemetry =
    this.baseOptions._sendTelemetry === false ? this.baseOptions._sendTelemetry : true;

  this.baseOptions.rootUrl = 'https://' + this.baseOptions.domain;

  this.request = new RequestBuilder(this.baseOptions);

  this.passwordless = new PasswordlessAuthentication(this.request, this.baseOptions);
  this.dbConnection = new DBConnection(this.request, this.baseOptions);

  this.warn = new Warn({
    disableWarnings: !!options._disableDeprecationWarnings
  });
  this.ssodataStorage = new SSODataStorage(this.baseOptions);
}

/**
 * Builds and returns the `/authorize` url in order to initialize a new authN/authZ transaction
 *
 * @method buildAuthorizeUrl
 * @param {Object} options
 * @param {String} [options.clientID] the Client ID found on your Application settings page
 * @param {String} options.redirectUri url that the Auth0 will redirect after Auth with the Authorization Response
 * @param {String} options.responseType type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
 * @see {@link https://auth0.com/docs/api/authentication#social}
 */
Authentication.prototype.buildAuthorizeUrl = function(options) {
  var params;
  var qString;

  assert.check(options, { type: 'object', message: 'options parameter is not valid' });

  params = objectHelper
    .merge(this.baseOptions, [
      'clientID',
      'responseType',
      'responseMode',
      'redirectUri',
      'scope',
      'audience'
    ])
    .with(options);

  /* eslint-disable */
  assert.check(
    params,
    { type: 'object', message: 'options parameter is not valid' },
    {
      clientID: { type: 'string', message: 'clientID option is required' },
      redirectUri: { optional: true, type: 'string', message: 'redirectUri option is required' },
      responseType: { type: 'string', message: 'responseType option is required' },
      nonce: {
        type: 'string',
        message: 'nonce option is required',
        condition: function(o) {
          return o.responseType.indexOf('code') === -1 && o.responseType.indexOf('id_token') !== -1;
        }
      },
      scope: { optional: true, type: 'string', message: 'scope option is required' },
      audience: { optional: true, type: 'string', message: 'audience option is required' }
    }
  );
  /* eslint-enable */

  // eslint-disable-next-line
  if (this.baseOptions._sendTelemetry) {
    params.auth0Client = this.request.getTelemetryData();
  }

  if (params.connection_scope && assert.isArray(params.connection_scope)) {
    params.connection_scope = params.connection_scope.join(',');
  }

  params = objectHelper.blacklist(params, [
    'username',
    'popupOptions',
    'domain',
    'tenant',
    'timeout',
    'appState'
  ]);
  params = objectHelper.toSnakeCase(params, ['auth0Client']);
  params = parametersWhitelist.oauthAuthorizeParams(this.warn, params);

  qString = qs.stringify(params);

  return urljoin(this.baseOptions.rootUrl, 'authorize', '?' + qString);
};

/**
 * Builds and returns the Logout url in order to initialize a new authN/authZ transaction
 *
 * If you want to navigate the user to a specific URL after the logout, set that URL at the returnTo parameter. The URL should be included in any the appropriate Allowed Logout URLs list:
 *
 * - If the client_id parameter is included, the returnTo URL must be listed in the Allowed Logout URLs set at the Auth0 Application level (see Setting Allowed Logout URLs at the App Level).
 * - If the client_id parameter is NOT included, the returnTo URL must be listed in the Allowed Logout URLs set at the account level (see Setting Allowed Logout URLs at the Account Level).
 * @method buildLogoutUrl
 * @param {Object} options
 * @param {String} [options.clientID] the Client ID found on your Application settings page
 * @param {String} [options.returnTo] URL to be redirected after the logout
 * @param {Boolean} [options.federated] tells Auth0 if it should logout the user also from the IdP.
 * @see {@link https://auth0.com/docs/api/authentication#logout}
 */
Authentication.prototype.buildLogoutUrl = function(options) {
  var params;
  var qString;

  assert.check(options, {
    optional: true,
    type: 'object',
    message: 'options parameter is not valid'
  });

  params = objectHelper.merge(this.baseOptions, ['clientID']).with(options || {});

  // eslint-disable-next-line
  if (this.baseOptions._sendTelemetry) {
    params.auth0Client = this.request.getTelemetryData();
  }

  params = objectHelper.toSnakeCase(params, ['auth0Client', 'returnTo']);

  qString = qs.stringify(objectHelper.blacklist(params, ['federated']));
  if (
    options &&
    options.federated !== undefined &&
    options.federated !== false &&
    options.federated !== 'false'
  ) {
    qString += '&federated';
  }

  return urljoin(this.baseOptions.rootUrl, 'v2', 'logout', '?' + qString);
};

/**
 * @callback authorizeCallback
 * @param {Error} [err] error returned by Auth0 with the reason of the Auth failure
 * @param {Object} [result] result of the Auth request. If there is no token available, this value will be null.
 * @param {String} [result.accessToken] token that allows access to the specified resource server (identified by the audience parameter or by default Auth0's /userinfo endpoint)
 * @param {Number} [result.expiresIn] number of seconds until the access token expires
 * @param {String} [result.idToken] token that identifies the user
 * @param {String} [result.refreshToken] token that can be used to get new access tokens from Auth0. Note that not all Auth0 Applications can request them or the resource server might not allow them.
 */

/**
 * @callback tokenCallback
 * @param {Error} [err] error returned by Auth0 with the reason of the Auth failure
 * @param {Object} [result] result of the Auth request
 * @param {String} result.accessToken token that allows access to the specified resource server (identified by the audience parameter or by default Auth0's /userinfo endpoint)
 * @param {Number} result.expiresIn number of seconds until the access token expires
 * @param {String} [result.idToken] token that identifies the user
 * @param {String} [result.refreshToken] token that can be used to get new access tokens from Auth0. Note that not all Auth0 Applications can request them or the resource server might not allow them.
 */

/**
 * Makes a call to the `oauth/token` endpoint with `password` grant type to login to the default directory.
 *
 * @method loginWithDefaultDirectory
 * @param {Object} options
 * @param {String} options.username email or username of the user that will perform Auth
 * @param {String} options.password the password of the user that will perform Auth
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
 * @param {tokenCallback} cb function called with the result of the request
 * @see Requires [`password` grant]{@link https://auth0.com/docs/api-auth/grant/password}. For more information, read {@link https://auth0.com/docs/clients/client-grant-types}.
 */
Authentication.prototype.loginWithDefaultDirectory = function(options, cb) {
  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      username: { type: 'string', message: 'username option is required' },
      password: { type: 'string', message: 'password option is required' },
      scope: { optional: true, type: 'string', message: 'scope option is required' },
      audience: { optional: true, type: 'string', message: 'audience option is required' }
    }
  );

  options.grantType = 'password';

  return this.oauthToken(options, cb);
};

/**
 * Makes a call to the `oauth/token` endpoint with `password-realm` grant type
 *
 * @method login
 * @param {Object} options
 * @param {String} options.username email or username of the user that will perform Auth
 * @param {String} options.password the password of the user that will perform Auth
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
 * @param {Object} options.realm the HRD domain or the connection name where the user belongs to. e.g. `Username-Password-Authentication`
 * @param {tokenCallback} cb function called with the result of the request
 * @see Requires [`http://auth0.com/oauth/grant-type/password-realm` grant]{@link https://auth0.com/docs/api-auth/grant/password#realm-support}. For more information, read {@link https://auth0.com/docs/clients/client-grant-types}.
 */
Authentication.prototype.login = function(options, cb) {
  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      username: { type: 'string', message: 'username option is required' },
      password: { type: 'string', message: 'password option is required' },
      realm: { type: 'string', message: 'realm option is required' },
      scope: { optional: true, type: 'string', message: 'scope option is required' },
      audience: { optional: true, type: 'string', message: 'audience option is required' }
    }
  );

  options.grantType = 'http://auth0.com/oauth/grant-type/password-realm';

  return this.oauthToken(options, cb);
};

/**
 * Makes a call to the `oauth/token` endpoint
 *
 * @method oauthToken
 * @private
 */
Authentication.prototype.oauthToken = function(options, cb) {
  var url;
  var body;

  assert.check(options, { type: 'object', message: 'options parameter is not valid' });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'oauth', 'token');

  body = objectHelper.merge(this.baseOptions, ['clientID', 'scope', 'audience']).with(options);

  assert.check(
    body,
    { type: 'object', message: 'options parameter is not valid' },
    {
      clientID: { type: 'string', message: 'clientID option is required' },
      grantType: { type: 'string', message: 'grantType option is required' },
      scope: { optional: true, type: 'string', message: 'scope option is required' },
      audience: { optional: true, type: 'string', message: 'audience option is required' }
    }
  );

  body = objectHelper.toSnakeCase(body, ['auth0Client']);
  body = parametersWhitelist.oauthTokenParams(this.warn, body);

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

/**
 * Performs authentication calling `/oauth/ro` endpoint with username
 * and password for a given connection name.
 *
 * This method is not compatible with API Auth so if you need to fetch API tokens with audience
 * you should use {@link login} or {@link loginWithDefaultDirectory}.
 *
 * @method loginWithResourceOwner
 * @param {Object} options
 * @param {String} options.username email or username of the user that will perform Auth
 * @param {String} options.password the password of the user that will perform Auth
 * @param {Object} options.connection the connection name where the user belongs to. e.g. `Username-Password-Authentication`
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.device] name of the device/browser where the Auth was requested
 * @param {tokenCallback} cb function called with the result of the request
 */
Authentication.prototype.loginWithResourceOwner = function(options, cb) {
  var url;
  var body;

  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      username: { type: 'string', message: 'username option is required' },
      password: { type: 'string', message: 'password option is required' },
      connection: { type: 'string', message: 'connection option is required' },
      scope: { optional: true, type: 'string', message: 'scope option is required' }
    }
  );
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'oauth', 'ro');

  body = objectHelper
    .merge(this.baseOptions, ['clientID', 'scope'])
    .with(options, ['username', 'password', 'scope', 'connection', 'device']);

  body = objectHelper.toSnakeCase(body, ['auth0Client']);

  body.grant_type = body.grant_type || 'password';

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

/**
 * Uses {@link checkSession} and localStorage to return data from the last successful authentication request.
 *
 * @method getSSOData
 * @param {Boolean} withActiveDirectories this parameter is not used anymore. It's here to be backward compatible
 * @param {Function} cb
 */
Authentication.prototype.getSSOData = function(withActiveDirectories, cb) {
  /* istanbul ignore if  */
  if (!this.auth0) {
    this.auth0 = new WebAuth(this.baseOptions);
  }
  var isHostedLoginPage = windowHelper.getWindow().location.host === this.baseOptions.domain;
  if (isHostedLoginPage) {
    return this.auth0._universalLogin.getSSOData(withActiveDirectories, cb);
  }
  if (typeof withActiveDirectories === 'function') {
    cb = withActiveDirectories;
  }
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
  var clientId = this.baseOptions.clientID;
  var ssodataInformation = this.ssodataStorage.get() || {};

  this.auth0.checkSession(
    {
      responseType: 'token id_token',
      scope: 'openid profile email',
      connection: ssodataInformation.lastUsedConnection,
      timeout: 5000
    },
    function(err, result) {
      if (err) {
        if (err.error === 'login_required') {
          return cb(null, { sso: false });
        }
        if (err.error === 'consent_required') {
          err.error_description =
            'Consent required. When using `getSSOData`, the user has to be authenticated with the following scope: `openid profile email`.';
        }
        return cb(err, { sso: false });
      }
      if (
        ssodataInformation.lastUsedSub &&
        ssodataInformation.lastUsedSub !== result.idTokenPayload.sub
      ) {
        return cb(err, { sso: false });
      }
      return cb(null, {
        lastUsedConnection: {
          name: ssodataInformation.lastUsedConnection
        },
        lastUsedUserID: result.idTokenPayload.sub,
        lastUsedUsername: result.idTokenPayload.email || result.idTokenPayload.name,
        lastUsedClientID: clientId,
        sessionClients: [clientId],
        sso: true
      });
    }
  );
};

/**
 * @callback userInfoCallback
 * @param {Error} [err] error returned by Auth0
 * @param {Object} [userInfo] user information
 */

/**
 * Makes a call to the `/userinfo` endpoint and returns the user profile
 *
 * @method userInfo
 * @param {String} accessToken token issued to a user after Auth
 * @param {userInfoCallback} cb
 * @see   {@link https://auth0.com/docs/api/authentication#get-user-info}
 */
Authentication.prototype.userInfo = function(accessToken, cb) {
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
 * @callback delegationCallback
 * @param {Error} [err] error returned by Auth0 with the reason why the delegation failed
 * @param {Object} [result] result of the delegation request. The payload depends on what ai type was used
 */

/**
 * Makes a call to the `/delegation` endpoint with either an `id_token` or `refresh_token`
 *
 * @method delegation
 * @param {Object} options
 * @param {String} [options.clientID] the Client ID found on your Application settings page
 * @param {String} options.grantType  grant type used for delegation. The only valid value is `urn:ietf:params:oauth:grant-type:jwt-bearer`
 * @param {String} [options.idToken] valid token of the user issued after Auth. If no `refresh_token` is provided this parameter is required
 * @param {String} [options.refreshToken] valid refresh token of the user issued after Auth. If no `id_token` is provided this parameter is required
 * @param {String} [options.target] the target ClientID of the delegation
 * @param {String} [options.scope] either `openid` or `openid profile email`
 * @param {String} [options.apiType] the api to be called
 * @param {delegationCallback} cb
 * @see   {@link https://auth0.com/docs/api/authentication#delegation}
 * @see Requires [http://auth0.com/oauth/grant-type/password-realm]{@link https://auth0.com/docs/api-auth/grant/password#realm-support}. For more information, read {@link https://auth0.com/docs/clients/client-grant-types}.
 */
Authentication.prototype.delegation = function(options, cb) {
  var url;
  var body;

  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      grant_type: { type: 'string', message: 'grant_type option is required' }
    }
  );
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'delegation');

  body = objectHelper.merge(this.baseOptions, ['clientID']).with(options);

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
 * @private
 * @param {Function} cb
 */
Authentication.prototype.getUserCountry = function(cb) {
  var url;

  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'user', 'geoloc', 'country');

  return this.request.get(url).end(responseHandler(cb));
};

export default Authentication;
