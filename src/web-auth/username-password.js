import urljoin from 'url-join';

import objectHelper from '../helper/object';
import RequestBuilder from '../helper/request-builder';
import responseHandler from '../helper/response-handler';
import windowHelper from '../helper/window';
import TransactionManager from './transaction-manager';
import constants from '../helper/constants';
import paramsArray from '../helper/param-constants';

function UsernamePassword(options) {
  this.baseOptions = options;
  this.request = new RequestBuilder(options);
  this.transactionManager = new TransactionManager(this.baseOptions);
}

UsernamePassword.prototype.login = function(options, cb) {
  var url;
  var body;

  url = urljoin(this.baseOptions.rootUrl, 'usernamepassword', 'login');

  options.username = options.username || options.email; // eslint-disable-line

  options = objectHelper.blacklist(options, constants.blacklist.email); // eslint-disable-line

  body = objectHelper
    .merge(this.baseOptions, paramsArray.clientID.scope.response.tenant)
    .with(options);
  body = this.transactionManager.process(body);

  body = objectHelper.toSnakeCase(body, paramsArray.snakeCase.base);

  return this.request
    .post(url)
    .send(body)
    .end(responseHandler(cb));
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

export default UsernamePassword;
