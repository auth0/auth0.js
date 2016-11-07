var assert = require('../helper/assert');
var error = require('../helper/error');
var jwt = require('../helper/jwt');
var qs = require('../helper/qs');
var objectHelper = require('../helper/object');
var Authentication = require('../authentication');
var Redirect = require('./redirect');
var SilentAuthenticationHandler = require('./silent-authentication-handler');


function WebAuth(options) {
  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    domain: { type: 'string', message: 'domain option is required' },
    client_id: { type: 'string', message: 'client_id option is required' },
    response_type: { type: 'string', message: 'response_type is not valid' },
    redirect_uri: { type: 'string', message: 'redirect_uri is not valid' },
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
  var hashStr;
  var parsedQs;
  var err;
  var prof;
  var audiences;

  hashStr = hash || window.location.hash;
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
    if (audiences.indexOf(this.baseOptions.client_id) === -1) {
      return error.invalidJwt(
        'The clientID configured (' + this.baseOptions.client_id + ') does not match ' +
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
    'client_id',
    'redirect_uri',
    'tenant',
    'response_type'
  ]).with(options);

  params.prompt = 'none';

  objectHelper.blacklist(options, ['usePostMessage', 'tenant']);

  handler = new SilentAuthenticationHandler(this, this.authentication.buildAuthorizeUrl(params));
  handler.login(usePostMessage, cb);
};

// passwordlessStart
// popup.login
// popup.passwordlessVerify
// popup.signup
// changePassword

module.exports = WebAuth;
