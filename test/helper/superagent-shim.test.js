import expect from 'expect.js';
import shim from '../../src/helper/superagent-shim';

function makeResponse({ status, statusText, type, body, headers }) {
  const hdrs = headers || {};
  if (type && !hdrs['content-type']) hdrs['content-type'] = type;
  return {
    status: status,
    statusText: statusText || '',
    ok: status >= 200 && status < 300,
    headers: {
      get: function (k) { return hdrs[k.toLowerCase()] || null; },
      forEach: function (fn) { Object.keys(hdrs).forEach(function (k) { fn(hdrs[k], k); }); }
    },
    json: function () { return Promise.resolve(typeof body === 'string' ? JSON.parse(body) : body); },
    text: function () { return Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)); }
  };
}

describe('helpers superagent-shim (modern build)', function () {
  let originalFetch;

  beforeEach(function () { originalFetch = globalThis.fetch; });
  afterEach(function () { globalThis.fetch = originalFetch; });

  function mockFetch(handler) {
    globalThis.fetch = function (url, init) { return Promise.resolve(handler(url, init)); };
  }

  it('200 JSON → res with status, body, type', function (done) {
    mockFetch(function () {
      return makeResponse({ status: 200, statusText: 'OK', type: 'application/json', body: { hello: 'world' } });
    });
    shim.get('https://t.auth0.com/userinfo').end(function (err, res) {
      try {
        expect(err).to.be(null);
        expect(res.status).to.be(200);
        expect(res.statusCode).to.be(200);
        expect(res.body).to.eql({ hello: 'world' });
        expect(res.text).to.be(null);
        expect(res.type).to.be('application/json');
        done();
      } catch (e) { done(e); }
    });
  });

  it('parses vendor JSON content types (application/vnd.api+json)', function (done) {
    mockFetch(function () {
      return makeResponse({
        status: 200,
        statusText: 'OK',
        type: 'application/vnd.api+json',
        body: { data: { id: '1' } }
      });
    });
    shim.get('https://t.auth0.com/x').end(function (err, res) {
      try {
        expect(err).to.be(null);
        expect(res.body).to.eql({ data: { id: '1' } });
        expect(res.text).to.be(null);
        done();
      } catch (e) { done(e); }
    });
  });

  it('200 text/plain → res.text populated, res.body null', function (done) {
    mockFetch(function () {
      return makeResponse({ status: 200, statusText: 'OK', type: 'text/plain', body: 'hello world' });
    });
    shim.get('https://t.auth0.com/anything').end(function (err, res) {
      try {
        expect(err).to.be(null);
        expect(res.text).to.be('hello world');
        expect(res.body).to.be(null);
        done();
      } catch (e) { done(e); }
    });
  });

  it('4xx JSON → err.response.{statusCode,statusText,body}', function (done) {
    mockFetch(function () {
      return makeResponse({
        status: 400,
        statusText: 'Bad Request',
        type: 'application/json',
        body: { error: 'invalid_request', error_description: 'bad token' }
      });
    });
    shim.post('https://t.auth0.com/oauth/token').send({ grant_type: 'password' }).end(function (err) {
      try {
        expect(err.status).to.be(400);
        expect(err.response.statusCode).to.be(400);
        expect(err.response.statusText).to.be('Bad Request');
        expect(err.response.body).to.eql({ error: 'invalid_request', error_description: 'bad token' });
        done();
      } catch (e) { done(e); }
    });
  });

  it('5xx text → err.response.body null, err.response.text populated', function (done) {
    mockFetch(function () {
      return makeResponse({ status: 500, statusText: 'Server Error', type: 'text/plain', body: 'oh no' });
    });
    shim.get('https://t.auth0.com/x').end(function (err) {
      try {
        expect(err.status).to.be(500);
        expect(err.response.body).to.be(null);
        expect(err.response.text).to.be('oh no');
        done();
      } catch (e) { done(e); }
    });
  });

  it('network failure → cb(err) with message + original', function (done) {
    globalThis.fetch = function () { return Promise.reject(new Error('Failed to fetch')); };
    shim.get('https://t.auth0.com/x').end(function (err, res) {
      try {
        expect(err.message).to.be('Failed to fetch');
        expect(err.original).to.be.an(Error);
        expect(err.response).to.be(undefined);
        expect(res).to.be(undefined);
        done();
      } catch (e) { done(e); }
    });
  });

  it('abort suppresses the callback (matches superagent)', function (done) {
    globalThis.fetch = function (url, init) {
      return new Promise(function (_resolve, reject) {
        init.signal.addEventListener('abort', function () {
          const e = new Error('aborted');
          e.name = 'AbortError';
          reject(e);
        });
      });
    };
    const req = shim.get('https://t.auth0.com/x');
    let called = false;
    req.end(function () { called = true; });
    req.abort();
    setTimeout(function () {
      try { expect(called).to.be(false); done(); } catch (e) { done(e); }
    }, 30);
  });

  it('.send(obj) stringifies + .set() headers reach fetch init', function (done) {
    let captured;
    mockFetch(function (url, init) {
      captured = init;
      return makeResponse({ status: 204, statusText: 'No Content', type: 'application/json', body: null });
    });
    shim
      .post('https://t.auth0.com/dbconnections/signup')
      .set('Content-Type', 'application/json')
      .send({ email: 'a@b.com', password: 'x' })
      .end(function () {
        try {
          expect(captured.method).to.be('POST');
          expect(captured.body).to.be('{"email":"a@b.com","password":"x"}');
          expect(captured.headers['Content-Type']).to.be('application/json');
          done();
        } catch (e) { done(e); }
      });
  });

  it('.withCredentials() → credentials:"include"', function (done) {
    let captured;
    mockFetch(function (url, init) {
      captured = init;
      return makeResponse({ status: 200, statusText: 'OK', type: 'application/json', body: {} });
    });
    shim.get('https://t.auth0.com/user/ssodata').withCredentials().end(function () {
      try { expect(captured.credentials).to.be('include'); done(); } catch (e) { done(e); }
    });
  });

  it('default credentials is "same-origin"', function (done) {
    let captured;
    mockFetch(function (url, init) {
      captured = init;
      return makeResponse({ status: 200, statusText: 'OK', type: 'application/json', body: {} });
    });
    shim.get('https://t.auth0.com/x').end(function () {
      try { expect(captured.credentials).to.be('same-origin'); done(); } catch (e) { done(e); }
    });
  });

  it('exposes method, url, _data, _header for RequestWrapper', function () {
    const req = shim.post('https://t.auth0.com/x').set('Authorization', 'Bearer abc').send({ a: 1 });
    expect(req.method).to.be('POST');
    expect(req.url).to.be('https://t.auth0.com/x');
    expect(req._data).to.eql({ a: 1 });
    expect(req._header.Authorization).to.be('Bearer abc');
  });

  it('.retry(n) retries on network error', function (done) {
    let attempts = 0;
    globalThis.fetch = function () {
      attempts++;
      return Promise.reject(new Error('boom'));
    };
    shim.get('https://t.auth0.com/x').retry(2).end(function (err) {
      try {
        expect(attempts).to.be(3);
        expect(err.message).to.be('boom');
        done();
      } catch (e) { done(e); }
    });
  });

  it('.retry(n) retries on retryable HTTP statuses (500, 503, 429, ...)', function (done) {
    let attempts = 0;
    mockFetch(function () {
      attempts++;
      return makeResponse({ status: 503, statusText: 'Unavailable', type: 'text/plain', body: 'down' });
    });
    shim.get('https://t.auth0.com/x').retry(2).end(function (err) {
      try {
        expect(attempts).to.be(3);
        expect(err.status).to.be(503);
        done();
      } catch (e) { done(e); }
    });
  });

  it('.retry(n) does NOT retry on non-retryable statuses (404, 401, ...)', function (done) {
    let attempts = 0;
    mockFetch(function () {
      attempts++;
      return makeResponse({ status: 404, statusText: 'Not Found', type: 'application/json', body: { error: 'nope' } });
    });
    shim.get('https://t.auth0.com/x').retry(2).end(function (err) {
      try {
        expect(attempts).to.be(1);
        expect(err.status).to.be(404);
        done();
      } catch (e) { done(e); }
    });
  });

  it('.retry(n) returns success when a later attempt succeeds', function (done) {
    let attempts = 0;
    mockFetch(function () {
      attempts++;
      if (attempts < 3) {
        return makeResponse({ status: 500, statusText: 'Server Error', type: 'text/plain', body: 'oh no' });
      }
      return makeResponse({ status: 200, statusText: 'OK', type: 'application/json', body: { ok: true } });
    });
    shim.get('https://t.auth0.com/x').retry(3).end(function (err, res) {
      try {
        expect(err).to.be(null);
        expect(attempts).to.be(3);
        expect(res.body).to.eql({ ok: true });
        done();
      } catch (e) { done(e); }
    });
  });
});
