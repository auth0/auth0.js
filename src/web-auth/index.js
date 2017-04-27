var IdTokenVerifier = require('idtoken-verifier');
var urljoin = require('url-join');

var assert = require('../helper/assert');
var error = require('../helper/error');
var qs = require('qs');
var PluginHandler = require('../helper/plugins');
var windowHelper = require('../helper/window');
var objectHelper = require('../helper/object');
var TransactionManager = require('./transaction-manager');
var Authentication = require('../authentication');
var Redirect = require('./redirect');
var Popup = require('./popup');
var SilentAuthenticationHandler = require('./silent-authentication-handler');
var RequestBuilder = require('../helper/request-builder');

/**
 * Handles all the browser's AuthN/AuthZ flows
 * @constructor
 * @param {Object} options
 * @param {String} options.domain your Auth0 domain
 * @param {String} options.clientID your Auth0 client identifier obtained when creating the client in the Auth0 Dashboard
 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0}
 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
 * @param {Array} [options.plugins]
 * @see {@link https://auth0.com/docs/api/authentication}
 */
function WebAuth(options) {
  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    domain: { type: 'string', message: 'domain option is required' },
    clientID: { type: 'string', message: 'clientID option is required' },
    responseType: { optional: true, type: 'string', message: 'responseType is not valid' },
    responseMode: { optional: true, type: 'string', message: 'responseMode is not valid' },
    redirectUri: { optional: true, type: 'string', message: 'redirectUri is not valid' },
    scope: { optional: true, type: 'string', message: 'scope is not valid' },
    audience: { optional: true, type: 'string', message: 'audience is not valid' },
    leeway: { optional: true, type: 'number', message: 'leeway is not valid' },
    plugins: { optional: true, type: 'array', message: 'plugins is not valid' },
    _disableDeprecationWarnings: { optional: true, type: 'boolean', message: '_disableDeprecationWarnings option is not valid' },
    _sendTelemetry: { optional: true, type: 'boolean', message: '_sendTelemetry option is not valid' },
    _telemetryInfo: { optional: true, type: 'object', message: '_telemetryInfo option is not valid' }
  });

  if (options.overrides) {
    assert.check(options.overrides, { type: 'object', message: 'overrides option is not valid' }, {
      __tenant: { type: 'string', message: '__tenant option is required' },
      __token_issuer: { type: 'string', message: '__token_issuer option is required' }
    });
  }
  /* eslint-enable */

  this.baseOptions = options;
  this.baseOptions.plugins = new PluginHandler(this, this.baseOptions.plugins || []);

  this.baseOptions._sendTelemetry = this.baseOptions._sendTelemetry === false ?
    this.baseOptions._sendTelemetry : true;

  this.baseOptions.tenant = (this.overrides && this.overrides.__tenant)
    || this.baseOptions.domain.split('.')[0];

  this.baseOptions.token_issuer = (this.overrides && this.overrides.__token_issuer)
    || 'https://' + this.baseOptions.domain + '/';

  this.transactionManager = new TransactionManager(this.baseOptions.transaction);

  this.client = new Authentication(this.baseOptions);
  this.redirect = new Redirect(this.client, this.baseOptions);
  this.popup = new Popup(this, this.baseOptions);
  this.request = new RequestBuilder(options);
}

/**
 * Parse the url hash and extract the Auth response from a Auth flow started with {@link authorize}
 *
 * Only validates id_tokens signed by Auth0 using the RS256 algorithm using the public key exposed
 * by the `/.well-known/jwks.json` endpoint of your account.
 * Tokens signed with other algorithms, e.g. HS256 will not be accepted.
 *
 * @method parseHash
 * @param {Object} options
 * @param {String} options.hash the url hash. If not provided it will extract from window.location.hash
 * @param {String} [options.state] value originally sent in `state` parameter to {@link authorize} to mitigate XSRF
 * @param {String} [options.nonce] value originally sent in `nonce` parameter to {@link authorize} to prevent replay attacks
 * @param {String} [options._idTokenVerification] makes parseHash perform or skip `id_token` verification. We **strongly** recommend validating the `id_token` yourself if you disable the verification.
 * @param {authorizeCallback} cb
 */
WebAuth.prototype.parseHash = function (options, cb) {
  var parsedQs;
  var err;
  var state;
  var transaction;
  var transactionNonce;

  if (!cb && typeof options === 'function') {
    cb = options;
    options = {};
  } else {
    options = options || {};
  }

  options._idTokenVerification = !(options._idTokenVerification === false);

  var _window = windowHelper.getWindow();

  var hashStr = options.hash === undefined ? _window.location.hash : options.hash;
  hashStr = hashStr.replace(/^#?\/?/, '');

  parsedQs = qs.parse(hashStr);

  if (parsedQs.hasOwnProperty('error')) {
    err = error.buildResponse(parsedQs.error, parsedQs.error_description);

    if (parsedQs.state) {
      err.state = parsedQs.state;
    }

    return cb(err);
  }

  if (!parsedQs.hasOwnProperty('access_token')
    && !parsedQs.hasOwnProperty('id_token')
    && !parsedQs.hasOwnProperty('refresh_token')) {
    return cb(null, null);
  }

  state = parsedQs.state || options.state;

  transaction = this.transactionManager.getStoredTransaction(state);
  transactionNonce = options.nonce || (transaction && transaction.nonce) || null;

  var applicationStatus = (transaction && transaction.appStatus) || null;
  if (parsedQs.id_token && options._idTokenVerification) {
    return this.validateToken(
      parsedQs.id_token,
      transactionNonce,
      function (validationError, payload) {
        if (validationError) {
          return cb(validationError);
        }
        return cb(null, buildParseHashResponse(parsedQs, applicationStatus, payload));
      });
  }

  if (parsedQs.id_token) {
    var verifier = new IdTokenVerifier({
      issuer: this.baseOptions.token_issuer,
      audience: this.baseOptions.clientID,
      leeway: this.baseOptions.leeway || 0,
      __disableExpirationCheck: this.baseOptions.__disableExpirationCheck
    });

    var decodedToken = verifier.decode(parsedQs.id_token);
    cb(null, buildParseHashResponse(parsedQs, applicationStatus, decodedToken.payload));
  } else {
    cb(null, buildParseHashResponse(parsedQs, applicationStatus, null));
  }
};

function buildParseHashResponse(qsParams, appStatus, token) {
  return {
    accessToken: qsParams.access_token || null,
    idToken: qsParams.id_token || null,
    idTokenPayload: token || null,
    appStatus: appStatus || null,
    refreshToken: qsParams.refresh_token || null,
    state: qsParams.state || null,
    expiresIn: qsParams.expires_in ? parseInt(qsParams.expires_in, 10) : null,
    tokenType: qsParams.token_type || null
  };
}

/**
 * @callback validateTokenCallback
 * @param {Error} [err] error returned by while validating the token
 * @param {Object} [payload] claims stored in the token
 */

/**
 * Decodes the a JWT and verifies its nonce value
 *
 * @method validateToken
 * @private
 * @param {String} token
 * @param {String} nonce
 * @param {validateTokenCallback} cb
 */
WebAuth.prototype.validateToken = function (token, nonce, cb) {
  var verifier = new IdTokenVerifier({
    issuer: this.baseOptions.token_issuer,
    audience: this.baseOptions.clientID,
    leeway: this.baseOptions.leeway || 0,
    __disableExpirationCheck: this.baseOptions.__disableExpirationCheck
  });

  verifier.verify(token, nonce, function (err, payload) {
    if (err) {
      return cb(error.invalidJwt(err.message));
    }

    cb(null, payload);
  });
};

/**
 * Executes a silent authentication transaction under the hood in order to fetch a new tokens for the current session.
 * This method requires that all Auth is performed with {@link authorize}
 *
 * @method renewAuth
 * @param {Object} options
 * @param {String} [options.domain] your Auth0 domain
 * @param {String} [options.clientID] your Auth0 client identifier obtained when creating the client in the Auth0 Dashboard
 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0}
 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
 */
WebAuth.prototype.renewAuth = function (options, cb) {
  var handler;
  var usePostMessage = !!options.usePostMessage;
  var _this = this;

  var params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'redirectUri',
    'responseType',
    'scope',
    'audience',
    '_csrf',
    'state',
    '_instate',
    'nonce'
  ]).with(options);

  params.responseType = params.responseType || 'token';
  params.responseMode = params.responseMode || 'fragment';
  if (!options.nonce) {
    params = this.transactionManager.process(params);
  }

  assert.check(params, { type: 'object', message: 'options parameter is not valid' });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  params.prompt = 'none';

  params = objectHelper.blacklist(params, ['usePostMessage', 'tenant']);

  handler = new SilentAuthenticationHandler(this, this.client.buildAuthorizeUrl(params));

  handler.login(usePostMessage, function (err, hash) {
    if (typeof hash === 'object') {
      // hash was already parsed, so we just return it
      // it's here to be backwards compatible and should be removed in the next major version
      return cb(err, hash);
    }
    var transaction = _this.transactionManager.getStoredTransaction(params.state);
    var transactionNonce = options.nonce || (transaction && transaction.nonce) || null;
    var transactionState = options.state || (transaction && transaction.state) || null;
    _this.parseHash({ hash: hash, nonce: transactionNonce, state: transactionState }, cb);
  });
};

/**
 * Request an email with instruction to change a user's password
 *
 * @method changePassword
 * @param {Object} options
 * @param {String} options.email address where the user will recieve the change password email. It should match the user's email in Auth0
 * @param {String} options.connection name of the connection where the user was created
 * @param {changePasswordCallback} cb
 * @see   {@link https://auth0.com/docs/api/authentication#change-password}
 */
WebAuth.prototype.changePassword = function (options, cb) {
  return this.client.dbConnection.changePassword(options, cb);
};

/**
 * Starts a passwordless authentication transaction.
 *
 * @method passwordlessStart
 * @param {Object} options
 * @param {String} options.send what will be sent via email which could be `link` or `code`. For SMS `code` is the only one valud
 * @param {String} [options.phoneNumber] phone number where to send the `code`. This parameter is mutually exclusive with `email`
 * @param {String} [options.email] email where to send the `code` or `link`. This parameter is mutually exclusive with `phoneNumber`
 * @param {String} options.connection name of the passwordless connection
 * @param {Object} [options.authParams] additional Auth parameters when using `link`
 * @param {Function} cb
 * @see   {@link https://auth0.com/docs/api/authentication#passwordless}
 */
WebAuth.prototype.passwordlessStart = function (options, cb) {
  return this.client.passwordless.start(options, cb);
};

/**
 * Creates a new user in a Auth0 Database connection
 *
 * @method signup
 * @param {Object} options
 * @param {String} options.email user email address
 * @param {String} options.password user password
 * @param {String} options.connection name of the connection where the user will be created
 * @param {signUpCallback} cb
 * @see   {@link https://auth0.com/docs/api/authentication#signup}
 */
WebAuth.prototype.signup = function (options, cb) {
  return this.client.dbConnection.signup(options, cb);
};

/**
 * Redirects to the hosted login page (`/authorize`) in order to start a new authN/authZ transaction
 *
 * @method authorize
 * @param {Object} options
 * @param {String} [options.domain] your Auth0 domain
 * @param {String} [options.clientID] your Auth0 client identifier obtained when creating the client in the Auth0 Dashboard
 * @param {String} options.redirectUri url that the Auth0 will redirect after Auth with the Authorization Response
 * @param {String} options.responseType type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0}
 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
 */
WebAuth.prototype.authorize = function (options) {
  var params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'responseType',
    'responseMode',
    'redirectUri',
    'scope',
    'audience',
    '_csrf',
    'state',
    '_instate',
    'nonce'
  ]).with(options);

  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
    responseType: { type: 'string', message: 'responseType option is required' }
  });

  params = this.transactionManager.process(params);

  windowHelper.redirect(this.client.buildAuthorizeUrl(params));
};

/**
 * Signs up a new user, automatically logs the user in after the signup and returns the user token.
 * The login will be done using /oauth/token with password-realm grant type.
 *
 * @method signupAndAuthorize
 * @param {Object} options
 * @param {String} options.email user email address
 * @param {String} options.password user password
 * @param {String} options.connection name of the connection where the user will be created
 * @param {tokenCallback} cb
 * @see   {@link https://auth0.com/docs/api/authentication#signup}
 * @see   {@link https://auth0.com/docs/api-auth/grant/password}
 */
WebAuth.prototype.signupAndAuthorize = function (options, cb) {
  var _this = this;

  return this.client.dbConnection.signup(objectHelper.blacklist(options, ['popupHandler']),
    function (err) {
      if (err) {
        return cb(err);
      }
      options.realm = options.connection;
      if (!options.username) {
        options.username = options.email;
      }
      _this.client.login(options, cb);
    });
};

/**
 * Logs in the user with username and password. You can use `username` or `email` as the actual username.
 *
 * @method login
 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
 * @param {String} options.username username
 * @param {String} options.email email
 * @param {String} options.password user password
 * @param {String} options.realm realm
 */
WebAuth.prototype.login = function (options) {
  var _this = this;
  var url = urljoin(this.baseOptions.rootUrl, '/co/authenticate');
  var authenticateBody = {
    client_id: options.clientID || this.baseOptions.clientID,
    credential_type: 'password',
    username: options.username || options.email,
    password: options.password
  };
  var realm = options.realm || this.baseOptions.realm;
  if (realm) {
    authenticateBody.realm = realm;
    authenticateBody.credential_type = 'http://auth0.com/oauth/grant-type/password-realm';
  }
  this.request.post(url).withCredentials().send(authenticateBody).end(function (err, data) {
    if (err) {
      var errorObject = err.response || {
        error: 'Request Error',
        error_description: JSON.stringify(err)
      };
      var redirectUrl = _this.baseOptions.redirectUri || options.redirectUri;
      var errorHash = '#error=' + encodeURI(errorObject.error) + '&error_description=' + encodeURI(errorObject.error_description);
      return windowHelper.redirect(redirectUrl + errorHash);
    }
    options = objectHelper.blacklist(options, ['username', 'password']);
    var authorizeOptions = objectHelper.merge(options).with({ loginTicket: data.body.login_ticket });
    _this.authorize(authorizeOptions);
  });
};

/**
 * Redirects to the auth0 logout endpoint
 *
 * If you want to navigate the user to a specific URL after the logout, set that URL at the returnTo parameter. The URL should be included in any the appropriate Allowed Logout URLs list:
 *
 * - If the client_id parameter is included, the returnTo URL must be listed in the Allowed Logout URLs set at the client level (see Setting Allowed Logout URLs at the App Level).
 * - If the client_id parameter is NOT included, the returnTo URL must be listed in the Allowed Logout URLs set at the account level (see Setting Allowed Logout URLs at the Account Level).
 *
 * @method logout
 * @param {Object} options
 * @param {String} [options.clientID] identifier of your client
 * @param {String} [options.returnTo] URL to be redirected after the logout
 * @param {Boolean} [options.federated] tells Auth0 if it should logout the user also from the IdP.
 * @see   {@link https://auth0.com/docs/api/authentication#logout}
 */
WebAuth.prototype.logout = function (options) {
  windowHelper.redirect(this.client.buildLogoutUrl(options));
};

/**
 * Verifies the passwordless TOTP and redirects to finish the passwordless transaction
 *
 * @method passwordlessVerify
 * @param {Object} options
 * @param {String} options.type `sms` or `email`
 * @param {String} options.phoneNumber only if type = sms
 * @param {String} options.email only if type = email
 * @param {String} options.connection the connection name
 * @param {String} options.verificationCode the TOTP code
 * @param {Function} cb
 */
WebAuth.prototype.passwordlessVerify = function (options, cb) {
  var _this = this;
  return this.client.passwordless.verify(options, function (err) {
    if (err) {
      return cb(err);
    }
    return windowHelper.redirect(_this.client.passwordless.buildVerifyUrl(options));
  });
};

module.exports = WebAuth;
