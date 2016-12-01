var UsernamePassword = require('./username-password');
var TransactionManager = require('./transaction-manager');
var objectHelper = require('../helper/object');

function Redirect(client, options) {
  this.baseOptions = options;
  this.client = client;

  this.transactionManager = new TransactionManager(this.baseOptions.transaction);
}

Redirect.prototype.login = function (options, cb) {
  var usernamePassword;

  var params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'redirectUri',
    'tenant',
    'responseType',
    'responseMode',
    'scope',
    'audience'
  ]).with(options);

  params = this.transactionManager.process(params);

  usernamePassword = new UsernamePassword(this.baseOptions);
  return usernamePassword.login(params, function (err, data) {
    if (err) {
      return cb(err);
    }
    return usernamePassword.callback(data);
  });
};

Redirect.prototype.signupAndLogin = function (options, cb) {
  var _this = this;
  return this.client.dbConnection.signup(options, function (err) {
    if (err) {
      return cb(err);
    }
    return _this.login(options, cb);
  });
};

module.exports = Redirect;
