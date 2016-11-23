var urljoin = require('url-join');

var responseHandler = require('../helper/response-handler');
var PopupHandler = require('../helper/popup-handler');
var objectHelper = require('../helper/object');

function Popup(client, options) {
  this.baseOptions = options;
  this.client = client;
}

Popup.prototype.authorize = function (options, cb) {
  var popup;
  var url;
  var relayUrl;

  var params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'responseType',
    'scope',
    'audience'
  ]).with(options);

  params.owp = true;

  popup = new PopupHandler();

  url = this.client.buildAuthorizeUrl(params);
  relayUrl = urljoin(this.baseOptions.rootUrl, 'relay.html');

  return popup.load(url, relayUrl, {}, responseHandler(cb));
};

Popup.prototype.login = function (options, cb) {
  var params;
  var popup;
  var url;
  var relayUrl;

  options = objectHelper.merge(this.baseOptions, [
    'domain',
    'clientID',
    'scope',
    'audience',
    'nonce',
    'state'
  ]).with(options || {});

  params = objectHelper.pick(options, ['clientID', 'domain']);
  params.options = objectHelper.toSnakeCase(
    objectHelper.blacklist(options, ['clientID', 'domain'])
  );

  popup = new PopupHandler();

  url = urljoin(this.baseOptions.rootUrl, 'sso_dbconnection_popup', options.clientID);
  relayUrl = urljoin(this.baseOptions.rootUrl, 'relay.html');

  return popup.load(url, relayUrl, params, responseHandler(cb));
};

Popup.prototype.passwordlessVerify = function (options, cb) {
  var _this = this;
  return this.client.passwordless.verify(options, function (err) {
    if (err) {
      return cb(err);
    }

    options.username = options.phoneNumber || options.email;
    options.password = options.verificationCode;

    delete options.email;
    delete options.phoneNumber;
    delete options.passcode;

    _this.client.loginWithResourceOwner(options, cb);
  });
};

Popup.prototype.signupAndLogin = function (options, cb) {
  var _this = this;
  return this.client.dbConnection.signup(options, function (err) {
    if (err) {
      return cb(err);
    }
    _this.login(options, cb);
  });
};

module.exports = Popup;