var windowHelper = require('../helper/window');
var UsernamePassword = require('./username-password');
var nonceManager = require('./nonce-manager');

function Redirect(client, options) {
  this.baseOptions = options;
  this.client = client;
}

Redirect.prototype.login = function (options, cb) {

  var responseType = options.responseType || this.baseOptions.responseType;

  if (responseType.indexOf('id_token') > -1) {
    options.nonce = options.nonce || nonceManager.generateNonce(this.baseOptions);
  }

  var usernamePassword = new UsernamePassword(this.baseOptions);
  return usernamePassword.login(options, function (err, data) {
    if (err) {
      return cb(err);
    }
    usernamePassword.callback(data, {});
  });
};

Redirect.prototype.signupAndLogin = function (options, cb) {
  var _this = this;
  return this.client.dbConnection.signup(options, function (err) {
    if (err) {
      return cb(err);
    }
    _this.login(options, cb);
  });
};

module.exports = Redirect;
