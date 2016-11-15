var assert = require('../helper/assert');
var error = require('../helper/error');
var jwt = require('../helper/jwt');
var qs = require('../helper/qs');
var windowHelper = require('../helper/window');
var objectHelper = require('../helper/object');
var Authentication = require('../authentication');
var Redirect = require('./redirect');
var SilentAuthenticationHandler = require('./silent-authentication-handler');

function WebAuth(options) {
  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    domain: { type: 'string', message: 'domain option is required' },
    clientID: { type: 'string', message: 'clientID option is required' },
    responseType: { type: 'string', message: 'responseType is not valid' },
    redirectURI: { type: 'string', message: 'redirectURI is not valid' },
    scope: { optional: true, type: 'string', message: 'audience is not valid' },
    audience: { optional: true, type: 'string', message: 'scope is not valid' },
    tenant: { optional: true, type: 'string', message: 'tenant option is not valid. Required when using custom domains.' },
    _sendTelemetry: { optional: true, type: 'boolean', message: '_sendTelemetry option is not valid' },
    _telemetryInfo: { optional: true, type: 'object', message: '_telemetryInfo option is not valid' }
  });
  /* eslint-enable */

  this.baseOptions = options;

  this.baseOptions._sendTelemetry = this.baseOptions._sendTelemetry === false ?
                                        this.baseOptions._sendTelemetry : true;

  this.baseOptions.tenant = this.baseOptions.domain.split('.')[0];

  this.authentication = new Authentication(this.baseOptions);
  this.redirect = new Redirect(this.authentication, this.baseOptions);
}

WebAuth.prototype.parseHash = function (hash) {
  var parsedQs;
  var err;
  var prof;
  var audiences;

  var _window = windowHelper.getWindow();

  var hashStr = hash || _window.location.hash;
  hashStr = hashStr.replace(/^#?\/?/, '');

  parsedQs = qs.parse(hashStr);

  if (parsedQs.hasOwnProperty('error')) {
    err = error.buildResponse(parsedQs.error, parsedQs.error_description);

    if (parsedQs.state) {
      err.state = parsedQs.state;
    }

    return err;
  }

  if (!parsedQs.hasOwnProperty('access_token')
       && !parsedQs.hasOwnProperty('id_token')
       && !parsedQs.hasOwnProperty('refresh_token')) {
    return null;
  }

  if (parsedQs.id_token) {
    prof = jwt.getPayload(parsedQs.id_token);
    // aud should be the clientID
    audiences = assert.isArray(prof.aud) ? prof.aud : [prof.aud];
    if (audiences.indexOf(this.baseOptions.clientID) === -1) {
      return error.invalidJwt(
        'The clientID configured (' + this.baseOptions.clientID + ') does not match ' +
        'with the clientID set in the token (' + audiences.join(', ') + ').');
    }

    // iss should be the Auth0 domain (i.e.: https://contoso.auth0.com/)
    if (prof.iss && prof.iss !== 'https://' + this.baseOptions.domain + '/') {
      return error.invalidJwt(
        'The domain configured (https://' + this.baseOptions.domain + '/) does not match ' +
        'with the domain set in the token (' + prof.iss + ').');
    }
  }

  return {
    accessToken: parsedQs.access_token,
    idToken: parsedQs.id_token,
    idTokenPayload: prof,
    refreshToken: parsedQs.refresh_token,
    state: parsedQs.state
  };
};

WebAuth.prototype.renewAuth = function (options, cb) {
  var handler;
  var usePostMessage = options.usePostMessage || false;

  var params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'redirectURI',
    'responseType',
    'scope',
    'audience'
  ]).with(options);

  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
    scope: { type: 'string', message: 'scope option is required' },
    audience: { type: 'string', message: 'audience option is required' }
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  params.prompt = 'none';

  params = objectHelper.blacklist(params, ['usePostMessage', 'tenant']);

  params = objectHelper.toSnakeCase(params, ['auth0Client']);

  handler = new SilentAuthenticationHandler(this, this.authentication.buildAuthorizeUrl(params));
  handler.login(usePostMessage, cb);
};

WebAuth.prototype.changePassword = function (options, cb) {
  this.authentication.dbConnection.changePassword(options, cb);
};

WebAuth.prototype.passwordlessStart = function (options, cb) {
  this.authentication.passwordless.start(options, cb);
};

// popup.login
// popup.passwordlessVerify
// popup.signup

module.exports = WebAuth;
