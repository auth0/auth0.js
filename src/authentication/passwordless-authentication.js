import urljoin from 'url-join';

import objectHelper from '../helper/object';
import assert from '../helper/assert';
import qs from 'qs';
import responseHandler from '../helper/response-handler';

function PasswordlessAuthentication(request, options) {
  this.baseOptions = options;
  this.request = request;
}

PasswordlessAuthentication.prototype.buildVerifyUrl = function(options) {
  var params;
  var qString;

  /* eslint-disable */
  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      connection: { type: 'string', message: 'connection option is required' },
      verificationCode: {
        type: 'string',
        message: 'verificationCode option is required'
      },
      phoneNumber: {
        optional: false,
        type: 'string',
        message: 'phoneNumber option is required',
        condition: function(o) {
          return !o.email;
        }
      },
      email: {
        optional: false,
        type: 'string',
        message: 'email option is required',
        condition: function(o) {
          return !o.phoneNumber;
        }
      }
    }
  );
  /* eslint-enable */

  params = objectHelper
    .merge(this.baseOptions, [
      'clientID',
      'responseType',
      'responseMode',
      'redirectUri',
      'scope',
      'audience',
      '_csrf',
      'state',
      '_intstate',
      'protocol',
      'nonce'
    ])
    .with(options);

  // eslint-disable-next-line
  if (this.baseOptions._sendTelemetry) {
    params.auth0Client = this.request.getTelemetryData();
  }

  params = objectHelper.toSnakeCase(params, ['auth0Client']);

  qString = qs.stringify(params);

  return urljoin(
    this.baseOptions.rootUrl,
    'passwordless',
    'verify_redirect',
    '?' + qString
  );
};

PasswordlessAuthentication.prototype.start = function(options, cb) {
  var url;
  var body;

  /* eslint-disable */
  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      connection: { type: 'string', message: 'connection option is required' },
      send: {
        type: 'string',
        message: 'send option is required',
        values: ['link', 'code'],
        value_message: 'send is not valid ([link, code])'
      },
      phoneNumber: {
        optional: true,
        type: 'string',
        message: 'phoneNumber option is required',
        condition: function(o) {
          return o.send === 'code' || !o.email;
        }
      },
      email: {
        optional: true,
        type: 'string',
        message: 'email option is required',
        condition: function(o) {
          return o.send === 'link' || !o.phoneNumber;
        }
      },
      authParams: {
        optional: true,
        type: 'object',
        message: 'authParams option is required'
      }
    }
  );
  /* eslint-enable */

  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'start');

  var xRequestLanguage = options.xRequestLanguage;
  delete options.xRequestLanguage;

  body = objectHelper
    .merge(this.baseOptions, [
      'clientID',
      'responseType',
      'redirectUri',
      'scope'
    ])
    .with(options);

  if (body.scope) {
    body.authParams = body.authParams || {};
    body.authParams.scope = body.authParams.scope || body.scope;
  }

  if (body.redirectUri) {
    body.authParams = body.authParams || {};
    body.authParams.redirect_uri =
      body.authParams.redirectUri || body.redirectUri;
  }

  if (body.responseType) {
    body.authParams = body.authParams || {};
    body.authParams.response_type =
      body.authParams.responseType || body.responseType;
  }

  delete body.redirectUri;
  delete body.responseType;
  delete body.scope;

  body = objectHelper.toSnakeCase(body, ['auth0Client', 'authParams']);

  var postOptions = xRequestLanguage
    ? { xRequestLanguage: xRequestLanguage }
    : undefined;

  return this.request
    .post(url, postOptions)
    .send(body)
    .end(responseHandler(cb));
};

PasswordlessAuthentication.prototype.verify = function(options, cb) {
  var url;
  var cleanOption;

  /* eslint-disable */
  assert.check(
    options,
    { type: 'object', message: 'options parameter is not valid' },
    {
      connection: { type: 'string', message: 'connection option is required' },
      verificationCode: {
        type: 'string',
        message: 'verificationCode option is required'
      },
      phoneNumber: {
        optional: false,
        type: 'string',
        message: 'phoneNumber option is required',
        condition: function(o) {
          return !o.email;
        }
      },
      email: {
        optional: false,
        type: 'string',
        message: 'email option is required',
        condition: function(o) {
          return !o.phoneNumber;
        }
      }
    }
  );
  /* eslint-enable */

  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  cleanOption = objectHelper.pick(options, [
    'connection',
    'verificationCode',
    'phoneNumber',
    'email',
    'auth0Client',
    'clientID'
  ]);
  cleanOption = objectHelper.toSnakeCase(cleanOption, ['auth0Client']);

  url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'verify');

  return this.request
    .post(url)
    .send(cleanOption)
    .end(responseHandler(cb));
};

/**
 * Makes a call to the `/passwordless/challenge` endpoint
 * and returns the challenge (captcha) if necessary.
 *
 * @method getChallenge
 * @param {callback} cb
 * @memberof PasswordlessAuthentication.prototype
 */
PasswordlessAuthentication.prototype.getChallenge = function(cb) {
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  if (!this.baseOptions.state) {
    return cb();
  }

  var url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'challenge');

  return this.request
    .post(url)
    .send({ state: this.baseOptions.state })
    .end(responseHandler(cb, { ignoreCasing: true }));
};

export default PasswordlessAuthentication;
