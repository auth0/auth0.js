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

Redirect.prototype.passwordlessVerify = function () {

};

Redirect.prototype.signup = function () {

};

module.exports = Redirect;
