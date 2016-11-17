var urljoin = require('url-join');

var objectHelper = require('../helper/object');
var assert = require('../helper/assert');
var qs = require('../helper/qs');
var responseHandler = require('../helper/response-handler');

function PasswordlessAuthentication(request, options) {
  this.baseOptions = options;
  this.request = request;
}

PasswordlessAuthentication.prototype.buildVerifyUrl = function (options) {
  var params;
  var qString;

  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    connection: { type: 'string', message: 'connection option is required' },
    type: { type: 'string', message: 'type option is required', values: ['sms', 'email'],
            value_message: 'type is not valid ([email,sms])' },
    verificationCode: { type: 'string', message: 'verificationCode option is required' },
    phoneNumber: { required: true, type: 'string', message: 'phoneNumber option is required',
            condition: function (o) { return o.type === 'sms'; } },
    email: { required: true, type: 'string', message: 'email option is required',
            condition: function (o) { return o.type === 'email'; } }
  });
  /* eslint-enable */

  assert.check(options, {
    optional: true,
    type: 'object',
    message: 'options parameter is not valid'
  });

  params = objectHelper.merge(this.baseOptions, [
    'clientID',
    'responseType',
    'redirectUri',
    'scope',
    'audience'
  ]).with(options);

  params = objectHelper.blacklist(params, ['type']);

  // eslint-disable-next-line
  if (this.baseOptions._sendTelemetry) {
    params.auth0Client = this.request.getTelemetryData();
  }

  params = objectHelper.toSnakeCase(params, ['auth0Client']);

  qString = qs.build(params);

  return urljoin(this.baseOptions.rootUrl, 'passwordless', 'verify_redirect', '?' + qString);
};

PasswordlessAuthentication.prototype.start = function (options, cb) {
  var url;
  var body;
  var cleanOption;

  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    connection: { type: 'string', message: 'connection option is required' },
    type: { type: 'string', message: 'type option is required', values: ['sms', 'email'],
            value_message: 'type is not valid ([email,sms])' },
    phoneNumber: { required: true, type: 'string', message: 'phoneNumber option is required',
            condition: function (o) { return o.type === 'sms'; } },
    email: { required: true, type: 'string', message: 'email option is required',
            condition: function (o) { return o.type === 'email'; } }
  });
  /* eslint-enable */

  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  cleanOption = objectHelper.blacklist(options, ['type']);

  url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'start');

  body = objectHelper.merge(this.baseOptions, ['clientID'])
                .with(cleanOption);

  body = objectHelper.toSnakeCase(body, ['auth0Client']);

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

PasswordlessAuthentication.prototype.verify = function (options, cb) {
  var url;
  var cleanOption;

  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    connection: { type: 'string', message: 'connection option is required' },
    type: { type: 'string', message: 'type option is required', values: ['sms', 'email'],
            value_message: 'type is not valid ([email,sms])' },
    verificationCode: { type: 'string', message: 'verificationCode option is required' },
    phoneNumber: { required: true, type: 'string', message: 'phoneNumber option is required',
            condition: function (o) { return o.type === 'sms'; } },
    email: { required: true, type: 'string', message: 'email option is required',
            condition: function (o) { return o.type === 'email'; } }
  });
  /* eslint-enable */

  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  cleanOption = objectHelper.blacklist(options, ['type']);

  cleanOption = objectHelper.toSnakeCase(cleanOption, ['auth0Client']);

  url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'verify');

  return this.request
    .post(url)
    .send(cleanOption)
    .end(responseHandler(cb));
};

module.exports = PasswordlessAuthentication;
