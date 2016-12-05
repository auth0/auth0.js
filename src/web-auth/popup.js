var urljoin = require('url-join');

var assert = require('../helper/assert');
var responseHandler = require('../helper/response-handler');
var PopupHandler = require('../helper/popup-handler');
var objectHelper = require('../helper/object');
var Warn = require('../helper/warn');
var TransactionManager = require('./transaction-manager');

function Popup(client, options) {
  this.baseOptions = options;
  this.client = client;

  this.transactionManager = new TransactionManager(this.baseOptions.transaction);
  this.warn = new Warn({
    disableWarnings: !!options._disableDeprecationWarnings
  });
}

Popup.prototype.preload = function (options) {
  var popup = new PopupHandler();
  popup.preload(options || {});
  return popup;
};

Popup.prototype.getPopupHandler = function (options) {
  if (options.popupHandler) {
    return options.popupHandler;
  }
  return new PopupHandler();
};

Popup.prototype.authorize = function (options, cb) {
  var popup;
  var url;
  var relayUrl;

  var params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'scope',
    'audience',
    'responseType'
  ]).with(objectHelper.blacklist(options, ['popupHandler']));

  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
    responseType: { type: 'string', message: 'responseType option is required' }
  });

  // used by server to render the relay page instead of sending the chunk in the
  // url to the callback
  params.owp = true;

  params = this.transactionManager.process(params);

  url = this.client.buildAuthorizeUrl(params);

  popup = this.getPopupHandler(options);

  relayUrl = urljoin(this.baseOptions.rootUrl, 'relay.html');

  return popup.load(url, relayUrl, {}, responseHandler(cb));
};

Popup.prototype.login = function (options, cb) {
  var params;
  var popup;
  var url;
  var relayUrl;

  this.warn.warning('`webauth.popup.login` will be soon deprecated, use `webauth.client.login` instead.');

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
    'audience'
  ]).with(objectHelper.blacklist(options, ['popupHandler']));

  params = objectHelper.pick(options, ['clientID', 'domain']);
  params.options = objectHelper.toSnakeCase(
    objectHelper.blacklist(options, ['clientID', 'domain'])
  );

  url = urljoin(this.baseOptions.rootUrl, 'sso_dbconnection_popup', options.clientID);
  relayUrl = urljoin(this.baseOptions.rootUrl, 'relay.html');

  return popup.load(url, relayUrl, params, responseHandler(cb));
};

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

Popup.prototype.signupAndLogin = function (options, cb) {
  var _this = this;
  var popup = this.getPopupHandler(options);
  options.popupHandler = options;
  return this.client.dbConnection.signup(objectHelper.blacklist(options, ['popupHandler']),
    function (err) {
      if (err) {
        return cb(err);
      }
      _this.login(options, cb);
    });
};

module.exports = Popup;