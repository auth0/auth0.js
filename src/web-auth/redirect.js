import CrossOriginAuthentication from './cross-origin-authentication';
import Warn from '../helper/warn';

function Redirect(auth0, options) {
  this.webAuth = auth0;
  this.baseOptions = options;
  this.crossOriginAuthentication = new CrossOriginAuthentication(
    auth0,
    this.baseOptions
  );

  this.warn = new Warn({
    disableWarnings: !!options._disableDeprecationWarnings
  });
}

/**
 * Logs in the user with username and password using the cross origin authentication (/co/authenticate) flow. You can use either `username` or `email` to identify the user, but `username` will take precedence over `email`.
 * Some browsers might not be able to successfully authenticate if 3rd party cookies are disabled in your browser. [See here for more information.]{@link https://auth0.com/docs/cross-origin-authentication}.
 * After the /co/authenticate call, you'll have to use the {@link parseHash} function at the `redirectUri` specified in the constructor.
 *
 * @method loginWithCredentials
 * @deprecated This method will be released in the next major version. Use `webAuth.login` instead.
 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
 * @param {String} [options.username] Username (mutually exclusive with email)
 * @param {String} [options.email] Email (mutually exclusive with username)
 * @param {String} options.password Password
 * @param {String} [options.connection] Connection used to authenticate the user, it can be a realm name or a database connection name
 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
 */
Redirect.prototype.loginWithCredentials = function(options, cb) {
  options.realm = options.realm || options.connection;
  delete options.connection;
  this.crossOriginAuthentication.login(options, cb);
};

/**
 * Signs up a new user and automatically logs the user in after the signup.
 *
 * @method signupAndLogin
 * @param {Object} options
 * @param {String} options.email user email address
 * @param {String} options.password user password
 * @param {String} options.connection name of the connection where the user will be created
 * @param {crossOriginLoginCallback} cb
 */
Redirect.prototype.signupAndLogin = function(options, cb) {
  var _this = this;
  return this.webAuth.client.dbConnection.signup(options, function(err) {
    if (err) {
      return cb(err);
    }
    options.realm = options.realm || options.connection;
    delete options.connection;
    return _this.webAuth.login(options, cb);
  });
};

export default Redirect;
