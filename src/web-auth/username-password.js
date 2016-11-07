var urljoin = require('url-join');

var objectHelper = require('../helper/object');
var RequestBuilder = require('../helper/request-builder');
var responseHandler = require('../helper/response-handler');

function UsernamePassword(options) {
  this.baseOptions = options;
  this.request = new RequestBuilder(options);
}

UsernamePassword.prototype.login = function (options, cb) {
  var url;
  var body;

  url = urljoin(this.baseOptions.rootUrl, 'usernamepassword', 'login');

  options.username = options.username || email; // eslint-disable-line

  body = objectHelper.merge(this.baseOptions, [
    'client_id',
    'redirect_uri',
    'tenant',
    'response_type'
  ]).with(options);

  this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
};

UsernamePassword.prototype.getWindowDocument = function () {
  return window.document;
};

UsernamePassword.prototype.callback = function (formHtml, options) {
  var div;
  var form;
  var document = this.getWindowDocument();

  div = document.createElement('div');
  div.innerHTML = formHtml;
  form = document.body.appendChild(div).children[0];

  if (options.popup) { // review
    form.target = 'auth0_signup_popup';
  }

  form.submit();
};

module.exports = UsernamePassword;
