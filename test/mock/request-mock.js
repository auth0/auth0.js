var expect = require('expect.js');

var RequestMock = function (options) {
  this.options = options;
};

RequestMock.prototype.send = function (body) {
  expect(body).to.eql(this.options.body);
  return this;
};

RequestMock.prototype.set = function (key, value) {
  expect(this.options.headers).to.have.key(key);
  expect(value).to.eql(this.options.headers[key]);
  delete this.options.headers[key];
  return this;
};

RequestMock.prototype.end = function (cb) {
  expect(this.options.headers).to.eql({});
  this.options.cb(cb);
};

module.exports = RequestMock;
