var assert = require('../helper/assert');
var error = require('../helper/error');
var jwt = require('../helper/jwt');
var qs = require('../helper/qs');
var windowHelper = require('../helper/window');
var objectHelper = require('../helper/object');
var nonceManager = require('./nonce-manager');
var Authentication = require('../authentication');
var Redirect = require('./redirect');
var SilentAuthenticationHandler = require('./silent-authentication-handler');
var windowHelper = require('../helper/window');

function WebAuth(options) {
  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    domain: { type: 'string', message: 'domain option is required' },
    clientID: { type: 'string', message: 'clientID option is required' },
    responseType: { type: 'string', message: 'responseType is not valid' },
    redirectUri: { type: 'string', message: 'redirectUri is not valid' },
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

  this.client = new Authentication(this.baseOptions);
  this.redirect = new Redirect(this.client, this.baseOptions);
}

WebAuth.prototype.parseHash = function (hash, options) {
  var parsedQs;
  var err;
  var prof;

  var _window = windowHelper.getWindow();

  var hashStr = hash || _window.location.hash;
  hashStr = hashStr.replace(/^#?\/?/, '');

  options = options || {};

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
    prof = this.validateToken(parsedQs.id_token, options);
    if (prof.error) {
      return prof;
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

WebAuth.prototype.validateToken = function (token, options) {
  var audiences;
  var nonce;
  var token_nonce;
  var prof = jwt.getPayload(token);

  options = options || {};

  audiences = assert.isArray(prof.aud) ? prof.aud : [prof.aud];
  if (audiences.indexOf(this.baseOptions.clientID) === -1) {
    return error.invalidJwt(
      'The clientID configured (' + this.baseOptions.clientID + ') does not match ' +
      'with the clientID set in the token (' + audiences.join(', ') + ').');
  }

  nonce = nonceManager.getStoredNonce(this.baseOptions) || options.nonce || null;
  token_nonce = prof.nonce || null;

  if (nonce !== token_nonce) {
    return error.invalidJwt('Nonce does not match');
  }

  // iss should be the Auth0 domain (i.e.: https://contoso.auth0.com/)
  if (prof.iss && prof.iss !== 'https://' + this.baseOptions.domain + '/') {
    return error.invalidJwt(
      'The domain configured (https://' + this.baseOptions.domain + '/) does not match ' +
      'with the domain set in the token (' + prof.iss + ').');
  }

  return prof;
};

WebAuth.prototype.renewAuth = function (options, cb) {
  var handler;
  var prof;
  var usePostMessage = !!options.usePostMessage;

  var params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'redirectUri',
    'responseType',
    'scope',
    'audience'
  ]).with(options);

  if (params.responseType.indexOf('id_token') > -1) {
    params.nonce = params.nonce || nonceManager.generateNonce(this.baseOptions);
  }

  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
    scope: { type: 'string', message: 'scope option is required' },
    audience: { type: 'string', message: 'audience option is required' }
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  params.prompt = 'none';

  params = objectHelper.blacklist(params, ['usePostMessage', 'tenant']);

  params = objectHelper.toSnakeCase(params, ['auth0Client']);

  handler = new SilentAuthenticationHandler(this, this.client.buildAuthorizeUrl(params));
  handler.login(usePostMessage, function (err, data){
    if (err) {
      return cb(err);
    }

    if (data.id_token) {
      prof = this.validateToken(data.id_token, options);
      if (prof.error) {
        cb(prof);
      }
      data.idTokenPayload = prof;
    }

    cb(err, data);
  });
};

WebAuth.prototype.changePassword = function (options, cb) {
  return this.client.dbConnection.changePassword(options, cb);
};

WebAuth.prototype.passwordlessStart = function (options, cb) {
  return this.client.passwordless.start(options, cb);
};

WebAuth.prototype.signup = function (options, cb) {
  return this.client.dbConnection.signup(options, cb);
};

WebAuth.prototype.login = function (options) {
  var responseType = options.responseType || this.baseOptions.responseType;

  if (responseType.indexOf('id_token') > -1) {
    options.nonce = options.nonce || nonceManager.generateNonce(this.baseOptions);
  }

  windowHelper.redirect(this.client.buildAuthorizeUrl(options));
};

WebAuth.prototype.logout = function (options) {
  windowHelper.redirect(this.client.buildLogoutUrl(options));
};

WebAuth.prototype.passwordlessVerify = function (options, cb) {
  var _this = this;
  return this.client.passwordless.verify(options, function (err) {
    if (err) {
      return cb(err);
    }
    windowHelper.redirect(_this.client.passwordless.buildVerifyUrl(options));
  });
};


// popup.login
// popup.authorize
// popup.passwordlessVerify
// popup.signupAndLogin

module.exports = WebAuth;
