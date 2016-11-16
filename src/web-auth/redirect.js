var windowHelper = require('../helper/window');
var UsernamePassword = require('./username-password');

function Redirect(authentication, options) {
  this.baseOptions = options;
  this.authentication = authentication;
}

Redirect.prototype.authorize = function (options) {
  windowHelper.redirect(this.authentication.buildAuthorizeUrl(options));
};

Redirect.prototype.logout = function (options) {
  windowHelper.redirect(this.authentication.buildLogoutUrl(options));
};

Redirect.prototype.login = function (options, cb) {
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
  return this.authentication.dbConnection.signup(options, function (err) {
    if (err) {
      return cb(err);
    }
    _this.login(options, cb);
  });
};

Redirect.prototype.passwordlessVerify = function (options, cb) {
  var _this = this;
  return this.authentication.passwordless.verify(options, function (err) {
    if (err) {
      return cb(err);
    }
    windowHelper.redirect(_this.authentication.passwordless.buildVerifyUrl(options));
  });
};

module.exports = Redirect;
