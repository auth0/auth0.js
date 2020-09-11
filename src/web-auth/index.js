import IdTokenVerifier from 'idtoken-verifier';
import qs from 'qs';

import assert from '../helper/assert';
import error from '../helper/error';
import PluginHandler from '../helper/plugins';
import windowHelper from '../helper/window';
import objectHelper from '../helper/object';
import SSODataStorage from '../helper/ssodata';
import responseHandler from '../helper/response-handler';
import TransactionManager from './transaction-manager';
import Authentication from '../authentication';
import Redirect from './redirect';
import Popup from './popup';
import SilentAuthenticationHandler from './silent-authentication-handler';
import CrossOriginAuthentication from './cross-origin-authentication';
import WebMessageHandler from './web-message-handler';
import HostedPages from './hosted-pages';
import captcha from './captcha';

function defaultClock() {
  return new Date();
}

/**
 * Handles all the browser's AuthN/AuthZ flows
 * @constructor
 * @param {Object} options
 * @param {String} options.domain your Auth0 domain
 * @param {String} options.clientID the Client ID found on your Application settings page
 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
 * @param {Number} [options.leeway] number of seconds to account for clock skew when validating time-based claims in ID tokens. Defaults to 60 seconds.
 * @param {Number} [options.maxAge] maximum elapsed time in seconds since the last time the user was actively authenticated by the authorization server.
 * @param {Array} [options.plugins]
 * @param {Number} [options._timesToRetryFailedRequests] Number of times to retry a failed request, according to {@link https://github.com/visionmedia/superagent/blob/master/lib/request-base.js}
 * @see {@link https://auth0.com/docs/api/authentication}
 */
function WebAuth(options) {
  /* eslint-disable */
  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      domain: { type: 'string', message: 'domain option is required' },
      clientID: { type: 'string', message: 'clientID option is required' },
      responseType: {
        optional: true,
        type: 'string',
        message: 'responseType is not valid'
      },
      responseMode: {
        optional: true,
        type: 'string',
        message: 'responseMode is not valid'
      },
      redirectUri: {
        optional: true,
        type: 'string',
        message: 'redirectUri is not valid'
      },
      scope: { optional: true, type: 'string', message: 'scope is not valid' },
      audience: {
        optional: true,
        type: 'string',
        message: 'audience is not valid'
      },
      popupOrigin: {
        optional: true,
        type: 'string',
        message: 'popupOrigin is not valid'
      },
      leeway: {
        optional: true,
        type: 'number',
        message: 'leeway is not valid'
      },
      plugins: {
        optional: true,
        type: 'array',
        message: 'plugins is not valid'
      },
      maxAge: {
        optional: true,
        type: 'number',
        message: 'maxAge is not valid'
      },
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
      },
      _timesToRetryFailedRequests: {
        optional: true,
        type: 'number',
        message: '_timesToRetryFailedRequests option is not valid'
      }
    }
  );

  if (options.overrides) {
    assert.check(
      options.overrides,
      { type: 'object', message: 'overrides option is not valid' },
      {
        __tenant: {
          optional: true,
          type: 'string',
          message: '__tenant option is required'
        },
        __token_issuer: {
          optional: true,
          type: 'string',
          message: '__token_issuer option is required'
        },
        __jwks_uri: {
          optional: true,
          type: 'string',
          message: '__jwks_uri is required'
        }
      }
    );
  }
  /* eslint-enable */

  this.baseOptions = options;
  this.baseOptions.plugins = new PluginHandler(
    this,
    this.baseOptions.plugins || []
  );

  this.baseOptions._sendTelemetry =
    this.baseOptions._sendTelemetry === false
      ? this.baseOptions._sendTelemetry
      : true;

  this.baseOptions._timesToRetryFailedRequests = options._timesToRetryFailedRequests
    ? parseInt(options._timesToRetryFailedRequests, 0)
    : 0;

  this.baseOptions.tenant =
    (this.baseOptions.overrides && this.baseOptions.overrides.__tenant) ||
    this.baseOptions.domain.split('.')[0];

  this.baseOptions.token_issuer =
    (this.baseOptions.overrides && this.baseOptions.overrides.__token_issuer) ||
    'https://' + this.baseOptions.domain + '/';

  this.baseOptions.jwksURI =
    this.baseOptions.overrides && this.baseOptions.overrides.__jwks_uri;

  this.transactionManager = new TransactionManager(this.baseOptions);

  this.client = new Authentication(this.baseOptions);
  this.redirect = new Redirect(this, this.baseOptions);
  this.popup = new Popup(this, this.baseOptions);
  this.crossOriginAuthentication = new CrossOriginAuthentication(
    this,
    this.baseOptions
  );
  this.webMessageHandler = new WebMessageHandler(this);
  this._universalLogin = new HostedPages(this, this.baseOptions);
  this.ssodataStorage = new SSODataStorage(this.baseOptions);
}

/**
 * Parse the url hash and extract the Auth response from a Auth flow started with {@link authorize}
 *
 * Only validates id_tokens signed by Auth0 using the RS256 algorithm using the public key exposed
 * by the `/.well-known/jwks.json` endpoint of your account.
 * Tokens signed with the HS256 algorithm cannot be properly validated.
 * Instead, a call to {@link userInfo} will be made with the parsed `access_token`.
 * If the {@link userInfo} call fails, the {@link userInfo} error will be passed to the callback.
 * Tokens signed with other algorithms will not be accepted.
 *
 * @method parseHash
 * @param {Object} options
 * @param {String} options.hash the url hash. If not provided it will extract from window.location.hash
 * @param {String} [options.state] value originally sent in `state` parameter to {@link authorize} to mitigate XSRF
 * @param {String} [options.nonce] value originally sent in `nonce` parameter to {@link authorize} to prevent replay attacks
 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `token`, `id_token`. For this specific method, we'll only use this value to check if the hash contains the tokens requested in the responseType.
 * @param {authorizeCallback} cb
 */
WebAuth.prototype.parseHash = function(options, cb) {
  var parsedQs;
  var err;

  if (!cb && typeof options === 'function') {
    cb = options;
    options = {};
  } else {
    options = options || {};
  }

  var _window = windowHelper.getWindow();

  var hashStr =
    options.hash === undefined ? _window.location.hash : options.hash;
  hashStr = hashStr.replace(/^#?\/?/, '');

  parsedQs = qs.parse(hashStr);

  if (parsedQs.hasOwnProperty('error')) {
    err = error.buildResponse(parsedQs.error, parsedQs.error_description);

    if (parsedQs.state) {
      err.state = parsedQs.state;
    }

    return cb(err);
  }

  if (
    !parsedQs.hasOwnProperty('access_token') &&
    !parsedQs.hasOwnProperty('id_token') &&
    !parsedQs.hasOwnProperty('refresh_token')
  ) {
    return cb(null, null);
  }
  var responseTypes = (
    this.baseOptions.responseType ||
    options.responseType ||
    ''
  ).split(' ');
  if (
    responseTypes.length > 0 &&
    responseTypes.indexOf('token') !== -1 &&
    !parsedQs.hasOwnProperty('access_token')
  ) {
    return cb(
      error.buildResponse(
        'invalid_hash',
        'response_type contains `token`, but the parsed hash does not contain an `access_token` property'
      )
    );
  }
  if (
    responseTypes.length > 0 &&
    responseTypes.indexOf('id_token') !== -1 &&
    !parsedQs.hasOwnProperty('id_token')
  ) {
    return cb(
      error.buildResponse(
        'invalid_hash',
        'response_type contains `id_token`, but the parsed hash does not contain an `id_token` property'
      )
    );
  }
  return this.validateAuthenticationResponse(options, parsedQs, cb);
};

/**
 * Validates an Auth response from a Auth flow started with {@link authorize}
 *
 * Only validates id_tokens signed by Auth0 using the RS256 algorithm using the public key exposed
 * by the `/.well-known/jwks.json` endpoint of your account.
 * Tokens signed with the HS256 algorithm cannot be properly validated.
 * Instead, a call to {@link userInfo} will be made with the parsed `access_token`.
 * If the {@link userInfo} call fails, the {@link userInfo} error will be passed to the callback.
 * Tokens signed with other algorithms will not be accepted.
 *
 * @method validateAuthenticationResponse
 * @param {Object} options
 * @param {String} options.hash the url hash. If not provided it will extract from window.location.hash
 * @param {String} [options.state] value originally sent in `state` parameter to {@link authorize} to mitigate XSRF
 * @param {String} [options.nonce] value originally sent in `nonce` parameter to {@link authorize} to prevent replay attacks
 * @param {Object} parsedHash an object that represents the parsed hash
 * @param {authorizeCallback} cb
 */
WebAuth.prototype.validateAuthenticationResponse = function(
  options,
  parsedHash,
  cb
) {
  var _this = this;
  options.__enableIdPInitiatedLogin =
    options.__enableIdPInitiatedLogin || options.__enableImpersonation;
  var state = parsedHash.state;
  var transaction = this.transactionManager.getStoredTransaction(state);
  var transactionState =
    options.state || (transaction && transaction.state) || null;

  var transactionStateMatchesState = transactionState === state;
  var shouldBypassStateChecking =
    !state && !transactionState && options.__enableIdPInitiatedLogin;

  if (!shouldBypassStateChecking && !transactionStateMatchesState) {
    return cb({
      error: 'invalid_token',
      errorDescription: '`state` does not match.'
    });
  }
  var transactionNonce =
    options.nonce || (transaction && transaction.nonce) || null;

  var appState = options.state || (transaction && transaction.appState) || null;

  var callback = function(err, payload) {
    if (err) {
      return cb(err);
    }
    if (transaction && transaction.lastUsedConnection) {
      var sub;
      if (payload) {
        sub = payload.sub;
      }
      _this.ssodataStorage.set(transaction.lastUsedConnection, sub);
    }
    return cb(null, buildParseHashResponse(parsedHash, appState, payload));
  };

  if (!parsedHash.id_token) {
    return callback(null, null);
  }
  return this.validateToken(parsedHash.id_token, transactionNonce, function(
    validationError,
    payload
  ) {
    if (!validationError) {
      if (!parsedHash.access_token) {
        return callback(null, payload);
      }
      // id_token's generated by non-oidc applications don't have at_hash
      if (!payload.at_hash) {
        return callback(null, payload);
      }
      // here we're absolutely sure that the id_token's alg is RS256
      // and that the id_token is valid, so we can check the access_token
      return new IdTokenVerifier().validateAccessToken(
        parsedHash.access_token,
        'RS256',
        payload.at_hash,
        function(err) {
          if (err) {
            return callback(error.invalidToken(err.message));
          }
          return callback(null, payload);
        }
      );
    }

    if (
      validationError.error !== 'invalid_token' ||
      (validationError.errorDescription &&
        validationError.errorDescription.indexOf(
          'Nonce (nonce) claim value mismatch in the ID token'
        ) > -1)
    ) {
      return callback(validationError);
    }

    // if it's an invalid_token error, decode the token
    var decodedToken = new IdTokenVerifier().decode(parsedHash.id_token);

    // if the alg is not HS256, return the raw error
    if (decodedToken.header.alg !== 'HS256') {
      return callback(validationError);
    }

    if ((decodedToken.payload.nonce || null) !== transactionNonce) {
      return callback({
        error: 'invalid_token',
        errorDescription:
          'Nonce (nonce) claim value mismatch in the ID token; expected "' +
          transactionNonce +
          '", found "' +
          decodedToken.payload.nonce +
          '"'
      });
    }

    if (!parsedHash.access_token) {
      var noAccessTokenError = {
        error: 'invalid_token',
        description:
          'The id_token cannot be validated because it was signed with the HS256 algorithm and public clients (like a browser) can’t store secrets. Please read the associated doc for possible ways to fix this. Read more: https://auth0.com/docs/errors/libraries/auth0-js/invalid-token#parsing-an-hs256-signed-id-token-without-an-access-token'
      };
      return callback(noAccessTokenError);
    }

    // if the alg is HS256, use the /userinfo endpoint to build the payload
    return _this.client.userInfo(parsedHash.access_token, function(
      errUserInfo,
      profile
    ) {
      // if the /userinfo request fails, use the validationError instead
      if (errUserInfo) {
        return callback(errUserInfo);
      }
      return callback(null, profile);
    });
  });
};

function buildParseHashResponse(qsParams, appState, token) {
  return {
    accessToken: qsParams.access_token || null,
    idToken: qsParams.id_token || null,
    idTokenPayload: token || null,
    appState: appState || null,
    refreshToken: qsParams.refresh_token || null,
    state: qsParams.state || null,
    expiresIn: qsParams.expires_in ? parseInt(qsParams.expires_in, 10) : null,
    tokenType: qsParams.token_type || null,
    scope: qsParams.scope || null
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
WebAuth.prototype.validateToken = function(token, nonce, cb) {
  var verifier = new IdTokenVerifier({
    issuer: this.baseOptions.token_issuer,
    jwksURI: this.baseOptions.jwksURI,
    audience: this.baseOptions.clientID,
    leeway: this.baseOptions.leeway || 60,
    maxAge: this.baseOptions.maxAge,
    __clock: this.baseOptions.__clock || defaultClock
  });

  verifier.verify(token, nonce, function(err, payload) {
    if (err) {
      return cb(error.invalidToken(err.message));
    }

    cb(null, payload);
  });
};

/**
 * Executes a silent authentication transaction under the hood in order to fetch a new tokens for the current session.
 * This method requires that all Auth is performed with {@link authorize}
 * Watch out! If you're not using the hosted login page to do social logins, you have to use your own [social connection keys](https://manage.auth0.com/#/connections/social). If you use Auth0's dev keys, you'll always get `login_required` as an error when calling this method.
 *
 * @method renewAuth
 * @param {Object} [options]
 * @param {String} [options.clientID] the Client ID found on your Application settings page
 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
 * @param {String} [options.postMessageDataType] identifier data type to look for in postMessage event data, where events are initiated from silent callback urls, before accepting a message event is the event expected. A value of false means any postMessage event will trigger a callback.
 * @param {String} [options.postMessageOrigin] origin of redirectUri to expect postMessage response from.  Defaults to the origin of the receiving window. Only used if usePostMessage is truthy.
 * @param {String} [options.timeout] value in milliseconds used to timeout when the `/authorize` call is failing as part of the silent authentication with postmessage enabled due to a configuration.
 * @param {Boolean} [options.usePostMessage] use postMessage to comunicate between the silent callback and the SPA. When false the SDK will attempt to parse the url hash should ignore the url hash and no extra behaviour is needed
 * @param {authorizeCallback} cb
 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
 */
WebAuth.prototype.renewAuth = function(options, cb) {
  var handler;
  var usePostMessage = !!options.usePostMessage;
  var postMessageDataType = options.postMessageDataType || false;
  var postMessageOrigin =
    options.postMessageOrigin || windowHelper.getWindow().origin;
  var timeout = options.timeout;
  var _this = this;

  var params = objectHelper
    .merge(this.baseOptions, [
      'clientID',
      'redirectUri',
      'responseType',
      'scope',
      'audience',
      '_csrf',
      'state',
      '_intstate',
      'nonce'
    ])
    .with(options);

  params.responseType = params.responseType || 'token';
  params.responseMode = params.responseMode || 'fragment';
  params = this.transactionManager.process(params);

  assert.check(params, {
    type: 'object',
    message: 'options parameter is not valid'
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  params.prompt = 'none';

  params = objectHelper.blacklist(params, [
    'usePostMessage',
    'tenant',
    'postMessageDataType',
    'postMessageOrigin'
  ]);

  handler = SilentAuthenticationHandler.create({
    authenticationUrl: this.client.buildAuthorizeUrl(params),
    postMessageDataType: postMessageDataType,
    postMessageOrigin: postMessageOrigin,
    timeout: timeout
  });

  handler.login(usePostMessage, function(err, hash) {
    if (typeof hash === 'object') {
      // hash was already parsed, so we just return it.
      // it's here to be backwards compatible and should be removed in the next major version.
      return cb(err, hash);
    }
    _this.parseHash({ hash: hash }, cb);
  });
};

/**
 * Renews an existing session on Auth0's servers using `response_mode=web_message`
 *
 * @method checkSession
 * @param {Object} [options]
 * @param {String} [options.clientID] the Client ID found on your Application settings page
 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
 * @param {String} [options.timeout] value in milliseconds used to timeout when the `/authorize` call is failing as part of the silent authentication with postmessage enabled due to a configuration.
 * @param {checkSessionCallback} cb
 * @see {@link https://auth0.com/docs/libraries/auth0js/v9#using-checksession-to-acquire-new-tokens}
 */
WebAuth.prototype.checkSession = function(options, cb) {
  var params = objectHelper
    .merge(this.baseOptions, [
      'clientID',
      'responseType',
      'redirectUri',
      'scope',
      'audience',
      '_csrf',
      'state',
      '_intstate',
      'nonce'
    ])
    .with(options);

  if (params.responseType === 'code') {
    return cb({
      error: 'error',
      error_description: "responseType can't be `code`"
    });
  }

  if (!options.nonce) {
    params = this.transactionManager.process(params);
  }

  if (!params.redirectUri) {
    return cb({
      error: 'error',
      error_description: "redirectUri can't be empty"
    });
  }

  assert.check(params, {
    type: 'object',
    message: 'options parameter is not valid'
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  params = objectHelper.blacklist(params, [
    'usePostMessage',
    'tenant',
    'postMessageDataType'
  ]);
  this.webMessageHandler.run(
    params,
    responseHandler(cb, { forceLegacyError: true, ignoreCasing: true })
  );
};

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
WebAuth.prototype.changePassword = function(options, cb) {
  return this.client.dbConnection.changePassword(options, cb);
};

/**
 * Starts a passwordless authentication transaction.
 *
 * @method passwordlessStart
 * @param {Object} options
 * @param {String} options.send what will be sent via email which could be `link` or `code`. For SMS `code` is the only one valid
 * @param {String} [options.phoneNumber] phone number where to send the `code`. This parameter is mutually exclusive with `email`
 * @param {String} [options.email] email where to send the `code` or `link`. This parameter is mutually exclusive with `phoneNumber`
 * @param {String} options.connection name of the passwordless connection
 * @param {Object} [options.authParams] additional Auth parameters when using `link`
 * @param {Function} cb
 * @see   {@link https://auth0.com/docs/api/authentication#passwordless}
 */
WebAuth.prototype.passwordlessStart = function(options, cb) {
  var authParams = objectHelper
    .merge(this.baseOptions, [
      'responseType',
      'responseMode',
      'redirectUri',
      'scope',
      'audience',
      '_csrf',
      'state',
      '_intstate',
      'nonce'
    ])
    .with(options.authParams);

  options.authParams = this.transactionManager.process(authParams);
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
WebAuth.prototype.signup = function(options, cb) {
  return this.client.dbConnection.signup(options, cb);
};

/**
 * Redirects to the hosted login page (`/authorize`) in order to start a new authN/authZ transaction.
 * After that, you'll have to use the {@link parseHash} function at the specified `redirectUri`.
 *
 * @method authorize
 * @param {Object} [options]
 * @param {String} [options.clientID] the Client ID found on your Application settings page
 * @param {String} options.redirectUri url that the Auth0 will redirect after Auth with the Authorization Response
 * @param {String} options.responseType type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
 * @param {Object} [options.appState] any values that you want back on the authentication response
 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
 */
WebAuth.prototype.authorize = function(options) {
  var params = objectHelper
    .merge(this.baseOptions, [
      'clientID',
      'responseType',
      'responseMode',
      'redirectUri',
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

  params = this.transactionManager.process(params);
  params.scope = params.scope || 'openid profile email';

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
WebAuth.prototype.signupAndAuthorize = function(options, cb) {
  var _this = this;

  return this.client.dbConnection.signup(
    objectHelper.blacklist(options, ['popupHandler']),
    function(err) {
      if (err) {
        return cb(err);
      }
      options.realm = options.connection;
      if (!options.username) {
        options.username = options.email;
      }
      _this.client.login(options, cb);
    }
  );
};

/**
 * @callback crossOriginLoginCallback
 * @param {Error} [err] Authentication error returned by Auth0 with the reason why the request failed
 */

/**
 * Logs the user in with username and password using the correct flow based on where it's called from:
 * - If you're calling this method from the Universal Login Page, it will use the usernamepassword/login endpoint
 * - If you're calling this method outside the Universal Login Page, it will use the cross origin authentication (/co/authenticate) flow
 * You can use either `username` or `email` to identify the user, but `username` will take precedence over `email`.
 * After the redirect to `redirectUri`, use {@link parseHash} to retrieve the authentication data.
 * **Notice that when using the cross origin authentication flow, some browsers might not be able to successfully authenticate if 3rd party cookies are disabled. [See here for more information.]{@link https://auth0.com/docs/cross-origin-authentication}.**
 *
 * @method login
 * @see Requires [`Implicit` grant]{@link https://auth0.com/docs/api-auth/grant/implicit}. For more information, read {@link https://auth0.com/docs/clients/client-grant-types}.
 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
 * @param {String} [options.username] Username (mutually exclusive with email)
 * @param {String} [options.email] Email (mutually exclusive with username)
 * @param {String} options.password Password
 * @param {String} [options.realm] Realm used to authenticate the user, it can be a realm name or a database connection name
 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
 */
WebAuth.prototype.login = function(options, cb) {
  var params = objectHelper
    .merge(this.baseOptions, [
      'clientID',
      'responseType',
      'redirectUri',
      'scope',
      'audience',
      '_csrf',
      'state',
      '_intstate',
      'nonce'
    ])
    .with(options);
  params = this.transactionManager.process(params);

  var isHostedLoginPage =
    windowHelper.getWindow().location.host === this.baseOptions.domain;
  if (isHostedLoginPage) {
    params.connection = params.realm;
    delete params.realm;
    this._universalLogin.login(params, cb);
  } else {
    this.crossOriginAuthentication.login(params, cb);
  }
};

/**
 * Logs in the user by verifying the verification code (OTP) using the cross origin authentication (/co/authenticate) flow. You can use either `phoneNumber` or `email` to identify the user.
 * This only works when 3rd party cookies are enabled in the browser. After the /co/authenticate call, you'll have to use the {@link parseHash} function at the `redirectUri` specified in the constructor.
 *
 * @method passwordlessLogin
 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
 * @param {String} [options.phoneNumber] Phone Number (mutually exclusive with email)
 * @param {String} [options.email] Email (mutually exclusive with username)
 * @param {String} options.verificationCode Verification Code (OTP)
 * @param {String} options.connection Passwordless connection to use. It can either be 'sms' or 'email'.
 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
 */
WebAuth.prototype.passwordlessLogin = function(options, cb) {
  var params = objectHelper
    .merge(this.baseOptions, [
      'clientID',
      'responseType',
      'redirectUri',
      'scope',
      'audience',
      '_csrf',
      'state',
      '_intstate',
      'nonce'
    ])
    .with(options);
  params = this.transactionManager.process(params);

  var isHostedLoginPage =
    windowHelper.getWindow().location.host === this.baseOptions.domain;
  if (isHostedLoginPage) {
    this.passwordlessVerify(params, cb);
  } else {
    var crossOriginOptions = objectHelper.extend(
      {
        credentialType: 'http://auth0.com/oauth/grant-type/passwordless/otp',
        realm: params.connection,
        username: params.email || params.phoneNumber,
        otp: params.verificationCode
      },
      objectHelper.blacklist(params, [
        'connection',
        'email',
        'phoneNumber',
        'verificationCode'
      ])
    );
    this.crossOriginAuthentication.login(crossOriginOptions, cb);
  }
};

/**
 * Runs the callback code for the cross origin authentication call. This method is meant to be called by the cross origin authentication callback url.
 *
 * @method crossOriginAuthenticationCallback
 * @deprecated Use {@link crossOriginVerification} instead.
 */
WebAuth.prototype.crossOriginAuthenticationCallback = function() {
  this.crossOriginVerification();
};

/**
 * Runs the callback code for the cross origin authentication call. This method is meant to be called by the cross origin authentication callback url.
 *
 * @method crossOriginVerification
 */
WebAuth.prototype.crossOriginVerification = function() {
  this.crossOriginAuthentication.callback();
};

/**
 * Redirects to the auth0 logout endpoint
 *
 * If you want to navigate the user to a specific URL after the logout, set that URL at the returnTo parameter. The URL should be included in any the appropriate Allowed Logout URLs list:
 *
 * - If the client_id parameter is included, the returnTo URL must be listed in the Allowed Logout URLs set at the Auth0 Application level (see Setting Allowed Logout URLs at the App Level).
 * - If the client_id parameter is NOT included, the returnTo URL must be listed in the Allowed Logout URLs set at the account level (see Setting Allowed Logout URLs at the Account Level).
 *
 * @method logout
 * @param {Object} [options]
 * @param {String} [options.clientID] the Client ID found on your Application settings page
 * @param {String} [options.returnTo] URL to be redirected after the logout
 * @param {Boolean} [options.federated] tells Auth0 if it should logout the user also from the IdP.
 * @see   {@link https://auth0.com/docs/api/authentication#logout}
 */
WebAuth.prototype.logout = function(options) {
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
WebAuth.prototype.passwordlessVerify = function(options, cb) {
  var _this = this;
  var params = objectHelper
    .merge(this.baseOptions, [
      'clientID',
      'responseType',
      'responseMode',
      'redirectUri',
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

  params = this.transactionManager.process(params);
  return this.client.passwordless.verify(params, function(err) {
    if (err) {
      return cb(err);
    }
    return windowHelper.redirect(
      _this.client.passwordless.buildVerifyUrl(params)
    );
  });
};

/**
 *
 * Renders the captcha challenge in the provided element.
 * This function can only be used in the context of a Classic Universal Login Page.
 *
 * @param {HTMLElement} element The element where the captcha needs to be rendered
 * @param {Object} options The configuration options for the captcha
 * @param {Object} [options.templates] An object containaing templates for each captcha provider
 * @param {Function} [options.templates.auth0] template function receiving the challenge and returning an string
 * @param {Function} [options.templates.recaptcha_v2] template function receiving the challenge and returning an string
 * @param {String} [options.lang=en] the ISO code of the language for recaptcha
 * @param {Function} [callback] An optional completion callback
 */
WebAuth.prototype.renderCaptcha = function(element, options, callback) {
  return captcha.render(this.client, element, options, callback);
};

export default WebAuth;
