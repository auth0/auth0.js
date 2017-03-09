var urljoin = require('url-join');
var WinChan = require('winchan');

var urlHelper = require('../helper/url');
var assert = require('../helper/assert');
var responseHandler = require('../helper/response-handler');
var PopupHandler = require('../helper/popup-handler');
var objectHelper = require('../helper/object');
var Warn = require('../helper/warn');
var TransactionManager = require('./transaction-manager');

function Popup(webAuth, options) {
  this.baseOptions = options;
  this.client = webAuth.client;
  this.webAuth = webAuth;

  this.transactionManager = new TransactionManager(this.baseOptions.transaction);
  this.warn = new Warn({
    disableWarnings: !!options._disableDeprecationWarnings
  });
}


/**
 * Returns a new instance of the popup handler
 *
 * @method buildPopupHandler
 */
Popup.prototype.buildPopupHandler = function () {
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
 * @param {Object} options: receives the window height and width and any other window feature to be sent to window.open
 */
Popup.prototype.preload = function (options) {
  options = options || {};

  var popup = this.buildPopupHandler();

  popup.preload(options);
  return popup;
};

/**
 * Internal use.
 *
 * @method getPopupHandler
 */
Popup.prototype.getPopupHandler = function (options, preload) {
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
 * @param {Object} options:
 * @param {String} options.state [OPTIONAL] to verify the response
 * @param {String} options.nonce [OPTIONAL] to verify the id_token
 * @param {String} options.hash [OPTIONAL] the url hash. If not provided it will extract from window.location.hash
 */
Popup.prototype.callback = function (options) {
  var _this = this;
  WinChan.onOpen(function (popupOrigin, r, cb) {
    _this.webAuth.parseHash(options || {}, function (err, data) {
      return cb(err || data);
    });
  });
};

/**
 * Opens in a popup the hosted login page (`/authorize`) in order to initialize a new authN/authZ transaction
 *
 * @method authorize
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#get--authorize_db
 * @param {Function} cb
 */
Popup.prototype.authorize = function (options, cb) {
  var popup;
  var url;
  var relayUrl;
  var popOpts = {};

  var pluginHandler = this.baseOptions.plugins.get('popup.authorize');

  var params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'scope',
    'domain',
    'audience',
    'responseType',
    'redirectUri',
    '_csrf',
    'state',
    '_instate',
    'nonce'
  ]).with(objectHelper.blacklist(options, ['popupHandler']));

  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
    responseType: { type: 'string', message: 'responseType option is required' }
  });

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
      popOpts.popupOptions = options.popupOptions;
  }

  if (pluginHandler) {
    params = pluginHandler.processParams(params);
  }

  params = this.transactionManager.process(params);

  delete params.domain;

  url = this.client.buildAuthorizeUrl(params);

  popup = this.getPopupHandler(options);

  return popup.load(url, relayUrl, popOpts, responseHandler(cb));
};

/**
 * Initializes the legacy Lock login flow in a popup
 *
 * @method loginWithCredentials
 * @param {Object} options
 * @param {Function} cb
 * @deprecated `webauth.popup.loginWithCredentials` will be soon deprecated, use `webauth.client.login` instead.
 */
Popup.prototype.loginWithCredentials = function (options, cb) {
  var params;
  var popup;
  var url;
  var relayUrl;

  this.warn.warning('`webauth.popup.loginWithCredentials` will be soon deprecated, use `webauth.client.login` instead.');

  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    clientID: { optional: true, type: 'string', message: 'clientID option is required' },
    redirectUri: { optional: true, type: 'string', message: 'redirectUri option is required' },
    responseType: { optional: true, type: 'string', message: 'responseType option is required' },
    scope: { optional: true, type: 'string', message: 'scope option is required' },
    audience: { optional: true, type: 'string', message: 'audience option is required' }
  });
  /* eslint-enable */

  popup = this.getPopupHandler(options);

  options = objectHelper.merge(this.baseOptions, [
    'clientID',
    'scope',
    'domain',
    'audience',
    '_csrf',
    'state',
    '_instate',
    'nonce'
  ]).with(objectHelper.blacklist(options, ['popupHandler']));

  params = objectHelper.pick(options, ['clientID', 'domain']);
  params.options = objectHelper.toSnakeCase(
    objectHelper.pick(options, ['password', 'connection', 'state', 'scope', '_csrf', 'device'])
  );
  params.options.username = options.username || options.email;

  url = urljoin(this.baseOptions.rootUrl, 'sso_dbconnection_popup', options.clientID);
  relayUrl = urljoin(this.baseOptions.rootUrl, 'relay.html');

  return popup.load(url, relayUrl, { params: params }, responseHandler(cb));
};

/**
 * Verifies the passwordless TOTP and returns the requested token
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
Popup.prototype.passwordlessVerify = function (options, cb) {
  var _this = this;
  return this.client.passwordless.verify(objectHelper.blacklist(options, ['popupHandler']),
    function (err) {
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
    });
};

/**
 * Signs up a new user and automatically logs the user in after the signup.
 *
 * @method signupAndLogin
 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-signup
 * @param {Function} cb
 */
Popup.prototype.signupAndLogin = function (options, cb) {
  var _this = this;

  // Preload popup to avoid the browser to block it since the login happens later
  var popupHandler = this.getPopupHandler(options, true);
  options.popupHandler = popupHandler;

  return this.client.dbConnection.signup(objectHelper.blacklist(options, ['popupHandler']),
    function (err) {
      if (err) {
        if (popupHandler._current_popup) {
          popupHandler._current_popup.kill();
        }
        return cb(err);
      }
      _this.loginWithCredentials(options, cb);
    });
};

module.exports = Popup;
