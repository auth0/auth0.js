var urljoin = require('url-join');

var objectHelper = require('../helper/object');
var assert = require('../helper/assert');
var responseHandler = require('../helper/response-handler');

function DBConnection(request, options) {
  this.baseOptions = options;
  this.request = request;
}

DBConnection.prototype.signup = function (options, cb) {
  var url;
  var body;

  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    connection: { type: 'string', message: 'connection option is required' },
    email: { type: 'string', message: 'email option is required' },
    password: { type: 'string', message: 'password option is required' }
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'dbconnection', 'signup');

  body = objectHelper.merge(this.baseOptions, ['client_id'])
                .with(options);

  body = objectHelper.blacklist(body, ['scope']);

  this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

DBConnection.prototype.changePassword = function (options, cb) {
  var url;
  var body;

  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
    connection: { type: 'string', message: 'connection option is required' },
    email: { type: 'string', message: 'email option is required' }
  });
  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

  url = urljoin(this.baseOptions.rootUrl, 'dbconnection', 'change_password');

  body = objectHelper.merge(this.baseOptions, ['client_id'])
                .with(options, ['email', 'connection']);

  this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

module.exports = DBConnection;
