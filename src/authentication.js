var request = require('superagent');
var qsBuilder = require('./helper/qs-builder');
var objectHelper = require('./helper/object');

var Authentication = function (options) {
  this.options = options;
}

Authentication.prototype.buildAuthorizeUrl = function (options) {
  var root = "https://" + this.options.domain;

  var params = objectHelper.pick([
      'redirect_uri',
      'client_id',
      'response_type'
    ], this.options);

  params = objectHelper.extend(params, options);

  var qs = qsBuilder(params);

  return urljoin(root, 'authorize?', qs);
};

Authentication.prototype.buildLogoutUrl = function () {};
Authentication.prototype.ro = function () {};
Authentication.prototype.passwordlessStart = function () {};
Authentication.prototype.passwordlessVerify = function () {};
Authentication.prototype.userInfo = function () {};
Authentication.prototype.delelegation = function () {};
Authentication.prototype.buildLinkUrl = function () {};
Authentication.prototype.unlink = function () {};
Authentication.prototype.dbConnectionSignup = function () {};
Authentication.prototype.dbConnectionChangePassword = function () {};
Authentication.prototype.usernamePasswordLogin = function () {};
Authentication.prototype.usernamePasswordCallback = function () {};

module.exports = Authentication;
