import expect from 'expect.js';

class RequestMock {
  constructor (options, method, url) {
    this.options = options;
    this.method = method;
    this.url = url;
    this._header = {};
  }

  send(body) {
    this._data = body;
    expect(body).to.eql(this.options.body);
    return this;
  }

  set(key, value) {
    expect(this.options.headers).to.have.key(key);
    expect(value).to.eql(this.options.headers[key]);
    this._header[key] = value;
    delete this.options.headers[key];
    return this;
  }

  abort() { }

  withCredentials() {
    return this;
  }

  end(cb) {
    expect(this.options.headers).to.eql({});
    this.options.cb(cb);
    return this;
  }

  retry(times) {
    this.willRetry = times;
    return this;
  }
}

module.exports = RequestMock;
