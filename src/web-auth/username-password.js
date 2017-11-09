var urljoin = require('url-join');

var objectHelper = require('../helper/object');
var RequestBuilder = require('../helper/request-builder');
var responseHandler = require('../helper/response-handler');
var windowHelper = require('../helper/window');
var TransactionManager = require('./transaction-manager');

function UsernamePassword(options) {
  this.baseOptions = options;
  this.request = new RequestBuilder(options);
  this.transactionManager = new TransactionManager(this.baseOptions.transaction);
}

UsernamePassword.prototype.login = function(options, cb) {
  var url;
  var body;

  url = urljoin(this.baseOptions.rootUrl, 'usernamepassword', 'login');

  options.username = options.username || options.email; // eslint-disable-line

  options = objectHelper.blacklist(options, ['email']); // eslint-disable-line

  body = objectHelper
    .merge(this.baseOptions, [
      'clientID',
      'redirectUri',
      'tenant',
      'responseType',
      'responseMode',
      'scope',
      'audience'
    ])
    .with(options);
  body = this.transactionManager.process(body);

  body = objectHelper.toSnakeCase(body, ['auth0Client']);

  return this.request.post(url).send(body).end(responseHandler(cb));
};

UsernamePassword.prototype.callback = function(formHtml) {
  var div;
  var form;
  var _document = windowHelper.getDocument();

  div = _document.createElement('div');
  div.innerHTML = formHtml;
  form = _document.body.appendChild(div).children[0];

  form.submit();
};

module.exports = UsernamePassword;
