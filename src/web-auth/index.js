var assert = require('../helper/assert');
var error = require('../helper/error');
var jwt = require('../helper/jwt');
var qs = require('../helper/qs');
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
 * @param {Object} options.domain
 * @param {Object} options.clienID
 * @param {Object} options.responseType
 * @param {Object} options.responseMode
 * @param {Object} options.scope
 * @param {Object} options.audience
 * @param {Object} options._disableDeprecationWarnings
 */
function WebAuth(options) {
  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    domain: { type: 'string', message: 'domain option is required' },
    clientID: { type: 'string', message: 'clientID option is required' },
    responseType: { optional: true, type: 'string', message: 'responseType is not valid' },
    responseMode: { optional: true, type: 'string', message: 'responseMode is not valid' },
    redirectUri: { optional: true, type: 'string', message: 'redirectUri is not valid' },
    scope: { optional: true, type: 'string', message: 'audience is not valid' },
    audience: { optional: true, type: 'string', message: 'scope is not valid' },
    tenant: { optional: true, type: 'string', message: 'tenant option is not valid. Required when using custom domains.' },
    _disableDeprecationWarnings: { optional: true, type: 'boolean', message: '_disableDeprecationWarnings option is not valid' },
    _sendTelemetry: { optional: true, type: 'boolean', message: '_sendTelemetry option is not valid' },
    _telemetryInfo: { optional: true, type: 'object', message: '_telemetryInfo option is not valid' }
  });
  /* eslint-enable */

  this.baseOptions = options;

  this.baseOptions._sendTelemetry = this.baseOptions._sendTelemetry === false ?
                                        this.baseOptions._sendTelemetry : true;

  this.baseOptions.tenant = this.baseOptions.domain.split('.')[0];

  this.transactionManager = new TransactionManager(this.baseOptions.transaction);

  this.client = new Authentication(this.baseOptions);
  this.redirect = new Redirect(this.client, this.baseOptions);
  this.popup = new Popup(this.client, this.baseOptions);
}

/**
 * Parse the url hash and extract the access token or id token depending on the transaction.
 *
 * @method parseHash
 * @param {String} hash: the url hash or null to automatically extract from window.location.hash
 * @param {Object} options: state and nonce can be provided to verify the response
 */
WebAuth.prototype.parseHash = function (hash, options) {
  var parsedQs;
  var err;
  var token;

  var _window = windowHelper.getWindow();

  var hashStr = hash || _window.location.hash;
  hashStr = hashStr.replace(/^#?\/?/, '');

  options = options || {};

  parsedQs = qs.parse(hashStr);

  if (parsedQs.hasOwnProperty('error')) {
    err = error.buildResponse(parsedQs.error, parsedQs.error_description);

    if (parsedQs.state) {
      err.state = parsedQs.state;
    }

    return err;
  }

  if (!parsedQs.hasOwnProperty('access_token')
       && !parsedQs.hasOwnProperty('id_token')
       && !parsedQs.hasOwnProperty('refresh_token')) {
    return null;
  }

  if (parsedQs.id_token) {
    token = this.validateToken(parsedQs.id_token, parsedQs.state || options.state, options.nonce);
    if (token.error) {
      return token;
    }
  }

  return {
    accessToken: parsedQs.access_token || null,
    idToken: parsedQs.id_token || null,
    idTokenPayload: token && token.payload ? token.payload : null,
    appStatus: token ? token.appStatus || null : null,
    refreshToken: parsedQs.refresh_token || null,
    state: parsedQs.state || null,
    expiresIn: parsedQs.expires_in || null,
    tokenType: parsedQs.token_type || null
  };
};

/**
 * Decodes the id_token and verifies  the nonce.
 *
 * @method validateToken
 * @param {String} token
 * @param {String} state
 * @param {String} nonce
 */
WebAuth.prototype.validateToken = function (token, state, nonce) {
  var audiences;
  var transaction;
  var transactionNonce;
  var tokenNonce;
  var prof = jwt.getPayload(token);

  audiences = assert.isArray(prof.aud) ? prof.aud : [prof.aud];
  if (audiences.indexOf(this.baseOptions.clientID) === -1) {
    return error.invalidJwt(
      'The clientID configured (' + this.baseOptions.clientID + ') does not match ' +
      'with the clientID set in the token (' + audiences.join(', ') + ').');
  }

  transaction = this.transactionManager.getStoredTransaction(state);
  transactionNonce = (transaction && transaction.nonce) || nonce;
  tokenNonce = prof.nonce || null;

  if (transactionNonce && tokenNonce && transactionNonce !== tokenNonce) {
    return error.invalidJwt('Nonce does not match');
  }

  // iss should be the Auth0 domain (i.e.: https://contoso.auth0.com/)
  if (prof.iss && prof.iss !== 'https://' + this.baseOptions.domain + '/') {
    return error.invalidJwt(
      'The domain configured (https://' + this.baseOptions.domain + '/) does not match ' +
      'with the domain set in the token (' + prof.iss + ').');
  }

  return {
    payload: prof,
    transaction: transaction
  };
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
  var prof;
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

  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
    scope: { type: 'string', message: 'scope option is required' },
    audience: { type: 'string', message: 'audience option is required' }
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  params.prompt = 'none';

  params = objectHelper.blacklist(params, ['usePostMessage', 'tenant']);

  handler = new SilentAuthenticationHandler(this, this.client.buildAuthorizeUrl(params));
  handler.login(usePostMessage, function (err, data) {
    if (err) {
      return cb(err);
    }

    if (data.id_token) {
      prof = _this.validateToken(data.id_token, options.state);
      if (prof.error) {
        cb(prof);
      }
      data.idTokenPayload = prof;
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
 * @method login
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#get--authorize_db
 * @param {Function} cb
 */
WebAuth.prototype.login = function (options) {
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
 * @method signupAndLogin
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-signup
 * @param {Function} cb
 */
WebAuth.prototype.signupAndLogin = function (options, cb) {
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
