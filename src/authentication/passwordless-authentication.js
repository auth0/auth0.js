var urljoin = require('url-join');

var objectHelper = require('../helper/object');
var assert = require('../helper/assert');
var responseHandler = require('../helper/response-handler');

function PasswordlessAuthentication(request, options) {
  this.baseOptions = options;
  this.request = request;
}

PasswordlessAuthentication.prototype.start = function (options, cb) {
  var url;
  var body;
  var cleanOption;

  /* eslint-disable */
  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    connection: { type: 'string', message: 'connection option is required' },
    type: { type: 'string', message: 'type option is required', values: ['sms', 'email'],
            value_message: 'type is not valid ([email,sms])' },
    phone_number: { required: true, type: 'string', message: 'phone_number option is required',
            condition: function (o) { return o.type === 'sms'; } },
    email: { required: true, type: 'string', message: 'email option is required',
            condition: function (o) { return o.type === 'email'; } }
  });
  /* eslint-enable */

  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  cleanOption = objectHelper.blacklist(options, ['type']);

  url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'start');

  body = objectHelper.merge(this.baseOptions, ['client_id'])
                .with(cleanOption);

  this.request
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
    verification_code: { type: 'string', message: 'verification_code option is required' },
    phone_number: { required: true, type: 'string', message: 'phone_number option is required', 
            condition: function (o) { return o.type === 'sms'; } },
    email: { required: true, type: 'string', message: 'email option is required', 
            condition: function (o) { return o.type === 'email'; } }
  });
  /* eslint-enable */

  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  cleanOption = objectHelper.blacklist(options, ['type']);

  url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'verify');

  this.request
    .post(url)
    .send(cleanOption)
    .end(responseHandler(cb));
};

module.exports = PasswordlessAuthentication;
