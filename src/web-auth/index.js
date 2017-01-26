var IdTokenVerifier = require('idtoken-verifier');

var assert = require('../helper/assert');
var error = require('../helper/error');
var qs = require('../helper/qs');
var PluginHandler = require('../helper/plugins');
var windowHelper = require('../helper/window');
var objectHelper = require('../helper/object');
var TransactionManager = require('./transaction-manager');
var Authentication = require('../authentication');
var Redirect = require('./redirect');
var Popup = require('./popup');
var SilentAuthenticationHandler = require('./silent-authentication-handler');

/**
 * Handles all the browser's authentication flows
 * @constructor
 * @param {Object} options
 * @param {String} options.domain
 * @param {String} options.clienID
 * @param {String} options.responseType
 * @param {String} options.responseMode
 * @param {String} options.scope
 * @param {String} options.audience
 * @param {Array} options.plugins
 * @param {Boolean} options._disableDeprecationWarnings
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
    plugins: { optional: true, type: 'array', message: 'plugins is not valid'},
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
  this.popup = new Popup(this.client, this.baseOptions);
}

/**
 * Parse the url hash and extract the returned tokens depending on the transaction.
 *
 * Only validates id_tokens signed by Auth0 using the RS256 algorithm using the public key exposed
 * by the `/.well-known/jwks.json` endpoint. Id tokens signed with other algorithms will not be
 * accepted.
 *
 * @method parseHash
 * @param {Object} options:
 * @param {String} options.state [OPTIONAL] to verify the response
 * @param {String} options.nonce [OPTIONAL] to verify the id_token
 * @param {String} options.hash [OPTIONAL] the url hash. If not provided it will extract from window.location.hash
 * @param {Function} cb: function(err, token_payload)
 */
WebAuth.prototype.parseHash = function (options, cb) {
  var parsedQs;
  var err;
  var state;
  var transaction;
  var transactionNonce;
  var transactionState;

  if (!cb && typeof options === 'function') {
    cb = options;
    options = {};
  } else {
    options = options || {};
  }

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
  transactionState = options.state || (transaction && transaction.state) || null;

  if (parsedQs.id_token) {
    this.validateToken(
      parsedQs.id_token,
      transactionState,
      transactionNonce,
      function (validationError, payload) {
        if (validationError) {
          return cb(validationError);
        }

        return cb(null, buildParseHashResponse(parsedQs, (transaction && transaction.appStatus) || null, payload));
      });
  } else {
    cb(null, buildParseHashResponse(parsedQs, (transaction && transaction.appStatus) || null, null));
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
 * Decodes the id_token and verifies  the nonce.
 *
 * @method validateToken
 * @param {String} token
 * @param {String} state
 * @param {String} nonce
 * @param {Function} cb: function(err, {payload, transaction})
 */
WebAuth.prototype.validateToken = function (token, state, nonce, cb) {
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
 * Executes a silent authentication transaction under the hood in order to fetch a new token.
 *
 * @method renewAuth
 * @param {Object} options: any valid oauth2 parameter to be sent to the `/authorize` endpoint
 * @param {Function} cb
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
    'audience'
  ]).with(options);

  params.responseType = params.responseType || 'token';
  params.responseMode = params.responseMode || 'fragment';

  params = this.transactionManager.process(params);

  assert.check(params, { type: 'object', message: 'options parameter is not valid' });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  params.prompt = 'none';

  params = objectHelper.blacklist(params, ['usePostMessage', 'tenant']);

  handler = new SilentAuthenticationHandler(this, this.client.buildAuthorizeUrl(params));

  handler.login(usePostMessage, function (err, data) {
    if (err) {
      return cb(err);
    }

    var transaction = _this.transactionManager.getStoredTransaction(params.state);
    var transactionNonce = options.nonce || (transaction && transaction.nonce) || null;
    var transactionState = options.state || (transaction && transaction.state) || null;

    if (data.id_token) {
      return _this.validateToken(data.id_token, transactionState, transactionNonce, function (validationErr, payload) {
        if (validationErr) {
          return cb(validationErr);
        }

        data.idTokenPayload = payload;

        return cb(null, data);
      });
    }

    return cb(err, data);
  });
};

/**
 * Initialices a change password transaction
 *
 * @method changePassword
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-change_password
 * @param {Function} cb
 */
WebAuth.prototype.changePassword = function (options, cb) {
  return this.client.dbConnection.changePassword(options, cb);
};

/**
 * Initialices a passwordless authentication transaction
 *
 * @method passwordlessStart
 * @param {Object} options: https://auth0.com/docs/api/authentication#passwordless
 * @param {Object} options.type: `sms` or `email`
 * @param {Object} options.phoneNumber: only if type = sms
 * @param {Object} options.email: only if type = email
 * @param {Function} cb
 */
WebAuth.prototype.passwordlessStart = function (options, cb) {
  return this.client.passwordless.start(options, cb);
};

/**
 * Signs up a new user
 *
 * @method signup
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-signup
 * @param {Function} cb
 */
WebAuth.prototype.signup = function (options, cb) {
  return this.client.dbConnection.signup(options, cb);
};

/**
 * Redirects to the hosted login page (`/authorize`) in order to initialize a new authN/authZ transaction
 *
 * @method authorize
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#get--authorize_db
 * @param {Function} cb
 */
WebAuth.prototype.authorize = function (options) {
  var params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'responseType',
    'responseMode',
    'redirectUri',
    'scope',
    'audience'
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
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-signup
 * @param {Function} cb
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
 * Redirects to the auth0 logout page
 *
 * @method logout
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#get--v2-logout
 */
WebAuth.prototype.logout = function (options) {
  windowHelper.redirect(this.client.buildLogoutUrl(options));
};

/**
 * Verifies the passwordless TOTP and redirects to finish the passwordless transaction
 *
 * @method passwordlessVerify
 * @param {Object} options:
 * @param {Object} options.type: `sms` or `email`
 * @param {Object} options.phoneNumber: only if type = sms
 * @param {Object} options.email: only if type = email
 * @param {Object} options.connection: the connection name
 * @param {Object} options.verificationCode: the TOTP code
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
