// fetch-based superagent shim used in the modern build only. Implements the
// subset called from src/helper/request-builder.js. Abort suppresses the
// callback to match superagent's xhr.abort() behavior.

// Status codes superagent retries on (request-base.js STATUS_CODES). Mostly
// transient-error 5xx + 408/413/429.

const RETRYABLE_STATUS = [408, 413, 429, 500, 502, 503, 504, 521, 522, 524];

function getHeader(headers, key) {
  return headers[key] || headers[key.toLowerCase()];
}

class SARequest {
  constructor(method, url) {
    this.method = method;
    this.url = url;
    this._header = {};
    this._data = undefined;
    this._withCredentials = false;
    this._retries = 0;
    this._abort = null;
  }

  set(key, value) {
    this._header[key] = value;
    return this;
  }

  send(body) {
    this._data = body;
    return this;
  }

  withCredentials() {
    this._withCredentials = true;
    return this;
  }

  retry(times) {
    this._retries = times | 0;
    return this;
  }

  abort() {
    if (this._abort) this._abort.abort();
  }

  end(cb) {
    this._execute(cb, this._retries);
  }

  _execute(cb, attemptsLeft) {
    // eslint-disable-next-line compat/compat
    this._abort = new AbortController();

    const ct = getHeader(this._header, 'Content-Type') || '';
    const init = {
      method: this.method,
      headers: this._header,
      signal: this._abort.signal,
      credentials: this._withCredentials ? 'include' : 'same-origin'
    };

    if (this._data !== undefined && this._data !== null) {
      if (typeof this._data === 'string') {
        init.body = this._data;
      } else if (ct.indexOf('application/json') !== -1 || !ct) {
        init.body = JSON.stringify(this._data);
      } else {
        init.body = String(this._data);
      }
    }

    // eslint-disable-next-line compat/compat
    fetch(this.url, init)
      .then((response) => {
        const rct = response.headers.get('content-type') || '';
        const type = rct.split(';')[0].trim();
        // Match real superagent: parse anything ending in /json or +json
        // (covers application/json, application/vnd.api+json, etc.)
        const isJson = /[/+]json$/.test(type);
        const bodyPromise = isJson
          ? response.json().catch(() => null)
          : response.text();

        return bodyPromise.then((parsed) => {
          const headers = {};
          response.headers.forEach((value, name) => {
            headers[name] = value;
          });
          const res = {
            status: response.status,
            statusCode: response.status,
            statusText: response.statusText,
            headers,
            body: isJson ? parsed : null,
            text: isJson ? null : parsed,
            type
          };

          if (response.ok) return cb(null, res);

          if (RETRYABLE_STATUS.includes(response.status) && attemptsLeft > 0) {
            return this._execute(cb, attemptsLeft - 1);
          }

          const err = new Error(`${response.status} ${response.statusText}`);
          err.status = response.status;
          err.response = res;
          cb(err);
        });
      })
      .catch((e) => {
        if (e && e.name === 'AbortError') return;
        if (attemptsLeft > 0) return this._execute(cb, attemptsLeft - 1);
        const err = new Error((e && e.message) || 'Network error');
        err.original = e;
        cb(err);
      });
  }
}

const get = (url) => new SARequest('GET', url);
const post = (url) => new SARequest('POST', url);
const patch = (url) => new SARequest('PATCH', url);

export default { get, post, patch };
export { get, post, patch };
