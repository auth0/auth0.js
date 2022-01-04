/* eslint-disable no-param-reassign */
import request from 'superagent';
import base64Url from './base64_url';
import version from '../version';
import objectHelper from './object';

// ------------------------------------------------ RequestWrapper

class RequestWrapper {
  constructor (req) {
    this.request = req;
    this.method = req.method;
    this.url = req.url;
    this.body = req._data;
    this.headers = req._header;
  }

  abort() {
    this.request.abort();
  }

  getMethod() {
    return this.method;
  }

  getBody() {
    return this.body;
  }

  getUrl() {
    return this.url;
  }

  getHeaders() {
    return this.headers;
  }
}

// ------------------------------------------------ RequestObj

class RequestObj {
  constructor (req) {
    this.request = req;
  }

  set(key, value) {
    this.request = this.request.set(key, value);
    return this;
  }

  send(body) {
    this.request = this.request.send(objectHelper.trimUserDetails(body));
    return this;
  }

  withCredentials() {
    this.request = this.request.withCredentials();
    return this;
  }

  end(cb) {
    this.request.end(cb);
    return new RequestWrapper(this.request);
  }
}

// ------------------------------------------------ RequestBuilder

class RequestBuilder {
  constructor (options) {
    this._sendTelemetry =
      options._sendTelemetry === false ? options._sendTelemetry : true;
    this._telemetryInfo = options._telemetryInfo || null;
    this._timesToRetryFailedRequests = options._timesToRetryFailedRequests;
    this.headers = options.headers || {};
    this._universalLoginPage = options.universalLoginPage;
  }

  setCommonConfiguration(ongoingRequest, options) {
    options = options || {};

    if (this._timesToRetryFailedRequests > 0) {
      ongoingRequest = ongoingRequest.retry(this._timesToRetryFailedRequests);
    }

    if (options.noHeaders) {
      return ongoingRequest;
    }

    var headers = this.headers;
    ongoingRequest = ongoingRequest.set('Content-Type', 'application/json');

    if (options.xRequestLanguage) {
      ongoingRequest = ongoingRequest.set(
        'X-Request-Language',
        options.xRequestLanguage
      );
    }

    var keys = Object.keys(this.headers);

    for (var a = 0; a < keys.length; a++) {
      ongoingRequest = ongoingRequest.set(keys[a], headers[keys[a]]);
    }

    if (this._sendTelemetry) {
      ongoingRequest = ongoingRequest.set(
        'Auth0-Client',
        this.getTelemetryData()
      );
    }

    return ongoingRequest;
  }

  getTelemetryData() {
    var telemetryName = this._universalLoginPage ? 'auth0.js-ulp' : 'auth0.js';
    var clientInfo = { name: telemetryName, version: version.raw };
    if (this._telemetryInfo) {
      clientInfo = objectHelper.extend({}, this._telemetryInfo);
      clientInfo.env = objectHelper.extend({}, this._telemetryInfo.env);
      clientInfo.env[telemetryName] = version.raw;
    }
    var jsonClientInfo = JSON.stringify(clientInfo);
    return base64Url.encode(jsonClientInfo);
  }

  get(url, options) {
    return new RequestObj(this.setCommonConfiguration(request.get(url), options));
  }

  post(url, options) {
    return new RequestObj(
      this.setCommonConfiguration(request.post(url), options)
    );
  }

  patch(url, options) {
    return new RequestObj(
      this.setCommonConfiguration(request.patch(url), options)
    );
  }
}

export default RequestBuilder;
