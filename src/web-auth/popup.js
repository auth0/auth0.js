var urljoin = require('url-join');

var urlHelper = require('../helper/url');
var assert = require('../helper/assert');
var responseHandler = require('../helper/response-handler');
var PopupHandler = require('../helper/popup-handler');
var objectHelper = require('../helper/object');
var windowHelper = require('../helper/window');
var Warn = require('../helper/warn');
var TransactionManager = require('./transaction-manager');
var CrossOriginAuthentication = require('./cross-origin-authentication');

function Popup(webAuth, options) {
  this.baseOptions = options;
  this.baseOptions.popupOrigin = options.popupOrigin;
  this.client = webAuth.client;
  this.webAuth = webAuth;

  this.transactionManager = new TransactionManager(this.baseOptions.transaction);
  this.crossOriginAuthentication = new CrossOriginAuthentication(webAuth, this.baseOptions);
  this.warn = new Warn({
    disableWarnings: !!options._disableDeprecationWarnings
  });
}

/**
 * Returns a new instance of the popup handler
 *
 * @method buildPopupHandler
 * @private
 */
Popup.prototype.buildPopupHandler = function() {
  var pluginHandler = this.baseOptions.plugins.get('popup.getPopupHandler');

  if (pluginHandler) {
    return pluginHandler.getPopupHandler();
  }

  return new PopupHandler();
};

/**
 * Initializes the popup window and returns the instance to be used later in order to avoid being blocked by the browser.
 *
 * @method preload
 * @param {Object} options receives the window height and width and any other window feature to be sent to window.open
 */
Popup.prototype.preload = function(options) {
  options = options || {};

  var popup = this.buildPopupHandler();

  popup.preload(options);
  return popup;
};

/**
 * Internal use.
 *
 * @method getPopupHandler
 * @private
 */
Popup.prototype.getPopupHandler = function(options, preload) {
  if (options.popupHandler) {
    return options.popupHandler;
  }

  if (preload) {
    return this.preload(options);
  }

  return this.buildPopupHandler();
};

/**
 * Handles the popup logic for the callback page.
 *
 * @method callback
 * @param {Object} options
 * @param {String} options.hash the url hash. If not provided it will extract from window.location.hash
 * @param {String} [options.state] value originally sent in `state` parameter to {@link authorize} to mitigate XSRF
 * @param {String} [options.nonce] value originally sent in `nonce` parameter to {@link authorize} to prevent replay attacks
 * @see   {@link parseHash}
 */
Popup.prototype.callback = function(options) {
  var _this = this;
  options = options || {};
  var originUrl =
    options.popupOrigin || this.baseOptions.popupOrigin || windowHelper.getWindow().origin;
  _this.webAuth.parseHash(options || {}, function(err, data) {
    // {a, d} is WinChan's message format.
    // We have to keep the same format because we're opening the popup with WinChan.
    var response = { a: 'response', d: data };
    if (err) {
      response = { a: 'error', d: err };
    }
    windowHelper.getWindow().opener.postMessage(JSON.stringify(response), originUrl);
  });
};

/**
 * Shows inside a new window the hosted login page (`/authorize`) in order to start a new authN/authZ transaction and post its result using `postMessage`.
 *
 * @method authorize
 * @param {Object} options
 * @param {String} [options.domain] your Auth0 domain
 * @param {String} [options.clientID] your Auth0 client identifier obtained when creating the client in the Auth0 Dashboard
 * @param {String} options.redirectUri url that the Auth0 will redirect after Auth with the Authorization Response
 * @param {String} options.responseType type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0}
 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
 * @param {Boolean} [options.owp] determines if Auth0 should render the relay page or not and the caller is responsible of handling the response.
 * @param {authorizeCallback} cb
 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
 */
Popup.prototype.authorize = function(options, cb) {
  var popup;
  var url;
  var relayUrl;
  var popOpts = {};

  var pluginHandler = this.baseOptions.plugins.get('popup.authorize');

  var params = objectHelper
    .merge(this.baseOptions, [
      'clientID',
      'scope',
      'domain',
      'audience',
      'tenant',
      'responseType',
      'redirectUri',
      '_csrf',
      'state',
      '_intstate',
      'nonce'
    ])
    .with(objectHelper.blacklist(options, ['popupHandler']));

  assert.check(
    params,
    { type: 'object', message: 'options parameter is not valid' },
    {
      responseType: { type: 'string', message: 'responseType option is required' }
    }
  );

  // the relay page should not be necesary as long it happens in the same domain
  // (a redirectUri shoul be provided). It is necesary when using OWP
  relayUrl = urljoin(this.baseOptions.rootUrl, 'relay.html');

  // if a owp is enabled, it should use the owp flag
  if (options.owp) {
    // used by server to render the relay page instead of sending the chunk in the
    // url to the callback
    params.owp = true;
  } else {
    popOpts.origin = urlHelper.extractOrigin(params.redirectUri);
    relayUrl = params.redirectUri;
  }

  if (options.popupOptions) {
    popOpts.popupOptions = objectHelper.pick(options.popupOptions, ['width', 'height']);
  }

  if (pluginHandler) {
    params = pluginHandler.processParams(params);
  }

  params = this.transactionManager.process(params);
  params.scope = params.scope || 'openid profile email';
  delete params.domain;

  url = this.client.buildAuthorizeUrl(params);

  popup = this.getPopupHandler(options);

  return popup.load(url, relayUrl, popOpts, responseHandler(cb));
};

/**
 * Performs authentication with username/email and password with a database connection inside a new window
 *
 * This method is not compatible with API Auth so if you need to fetch API tokens with audience
 * you should use {@link authorize} or {@link login}.
 *
 * @method loginWithCredentials
 * @param {Object} options
 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
 * @param {String} [options.responseType] type of the response used. It can be any of the values `code` and `token`
 * @param {String} [options.responseMode] how the AuthN response is encoded and redirected back to the client. Supported values are `query` and `fragment`. The `query` value is only supported when `responseType` is `code`.
 * @param {String} [options.scope] scopes to be requested during AuthN. e.g. `openid email`
 * @param {credentialsCallback} cb
 */
Popup.prototype.loginWithCredentials = function(options, cb) {
  options.realm = options.realm || options.connection;
  options.popup = true;
  options = objectHelper
    .merge(this.baseOptions, ['responseType', 'state', 'nonce'])
    .with(objectHelper.blacklist(options, ['popupHandler', 'connection']));
  options = this.transactionManager.process(options);
  this.crossOriginAuthentication.login(options, cb);
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
Popup.prototype.passwordlessVerify = function(options, cb) {
  var _this = this;
  return this.client.passwordless.verify(
    objectHelper.blacklist(options, ['popupHandler']),
    function(err) {
      if (err) {
        return cb(err);
      }

      options.username = options.phoneNumber || options.email;
      options.password = options.verificationCode;

      delete options.email;
      delete options.phoneNumber;
      delete options.verificationCode;
      delete options.type;

      _this.client.loginWithResourceOwner(options, cb);
    }
  );
};

/**
 * Signs up a new user and automatically logs the user in after the signup.
 *
 * This method is not compatible with API Auth so if you need to fetch API tokens with audience
 * you should use {@link authorize} or {@link signupAndAuthorize}.
 *
 * @method signupAndLogin
 * @param {Object} options
 * @param {String} options.email user email address
 * @param {String} options.password user password
 * @param {String} options.connection name of the connection where the user will be created
 * @param {credentialsCallback} cb
 */
Popup.prototype.signupAndLogin = function(options, cb) {
  var _this = this;

  // Preload popup to avoid the browser to block it since the login happens later
  var popupHandler = this.getPopupHandler(options, true);
  options.popupHandler = popupHandler;

  return this.client.dbConnection.signup(
    objectHelper.blacklist(options, ['popupHandler']),
    function(err) {
      if (err) {
        if (popupHandler._current_popup) {
          popupHandler._current_popup.kill();
        }
        return cb(err);
      }
      _this.loginWithCredentials(options, cb);
    }
  );
};

module.exports = Popup;
