var redirect = require('../helper/redirect');
var UsernamePassword = require('./username-password');

function Redirect(authentication, options) {
  this.baseOptions = options;
  this.authentication = authentication;
}

Redirect.prototype.login = function (options, cb) {
  var usernamePassword = new UsernamePassword(this.baseOptions);
  usernamePassword.login(options, function (err, data) {
    if (err) {
      return cb(err);
    }
    usernamePassword.callback(data, {});
  });
};

Redirect.prototype.signup = function (options, cb) {
  this.authentication.dbConnection.signup(options, cb);
};

Redirect.prototype.signupAndLogin = function (options, cb) {
  var _this = this;
  this.authentication.dbConnection.signup(options, function (err) {
    if (err) {
      return cb(err);
    }
    _this.login(options, cb);
  });
};

Redirect.prototype.passwordlessVerify = function (options, cb) {
  var _this = this;
  this.authentication.passwordless.verify(options, function (err) {
    if (err) {
      return cb(err);
    }
    redirect.redirect(_this.authentication.passwordless.buildVerifyUrl(options));
  });
};

module.exports = Redirect;
