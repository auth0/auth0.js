var expect = require('expect.js');

var RequestMock = function(options, method, url) {
  this.options = options;
  this.method = method;
  this.url = url;
  this._header = {};
};

RequestMock.prototype.send = function(body) {
  this._data = body;
  expect(body).to.eql(this.options.body);
  return this;
};

RequestMock.prototype.set = function(key, value) {
  expect(this.options.headers).to.have.key(key);
  expect(value).to.eql(this.options.headers[key]);
  this._header[key] = value;
  delete this.options.headers[key];
  return this;
};

RequestMock.prototype.abort = function() {};

RequestMock.prototype.withCredentials = function() {
  return this;
};

RequestMock.prototype.end = function(cb) {
  expect(this.options.headers).to.eql({});
  this.options.cb(cb);
  return this;
};

RequestMock.prototype.retry = function(times) {
  this.willRetry = times;
  return this;
};

module.exports = RequestMock;
