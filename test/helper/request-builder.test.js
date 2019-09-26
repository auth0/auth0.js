import expect from 'expect.js';
import sinon from 'sinon';

import request from 'superagent';

import RequestMock from '../mock/request-mock';
import RequestBuilder from '../../src/helper/request-builder';
import base64url from '../../src/helper/base64_url';
import version from '../../src/version';
import objectHelper from '../../src/helper/object';

var telemetryInfo = new RequestBuilder({}).getTelemetryData();

describe('helpers requestBuilder', function() {
  describe('getTelemetryData', function() {
    it('should encode telemetry', function() {
      var rb = new RequestBuilder({
        _telemetryInfo: { foo: 'bar', env: { other: 'key' } }
      });
      var telemetry = rb.getTelemetryData();
      const expectedTelemetry = {
        foo: 'bar',
        env: {
          other: 'key',
          'auth0.js': version.raw
        }
      };

      expect(JSON.parse(base64url.decode(telemetry))).to.be.eql(
        expectedTelemetry
      );
      expect(telemetry).to.be(
        base64url.encode(JSON.stringify(expectedTelemetry))
      );
    });
    it('should use default telemetry', function() {
      var rb = new RequestBuilder({ _telemetryInfo: null });
      var telemetry = rb.getTelemetryData();
      expect(JSON.parse(base64url.decode(telemetry))).to.be.eql({
        name: 'auth0.js',
        version: version.raw
      });
    });
    it('should use ulp telemetry when `universalLoginPage` is true', function() {
      var rb = new RequestBuilder({
        _telemetryInfo: null,
        universalLoginPage: true
      });
      var telemetry = rb.getTelemetryData();
      expect(JSON.parse(base64url.decode(telemetry))).to.be.eql({
        name: 'auth0.js-ulp',
        version: version.raw
      });
    });
  });
  describe('with noHeaders:false', function() {
    before(function() {
      sinon.stub(request, 'get').callsFake(function(url) {
        expect(url).to.be('https://test.com');
        return new RequestMock(
          {
            headers: {
              'Content-Type': 'application/json',
              'Auth0-Client': telemetryInfo
            },
            cb: function(cb) {
              cb(null, {
                body: {
                  user_id: 'auth0|123',
                  email: 'me@example.com'
                }
              });
            }
          },
          'GET',
          'https://test.com'
        );
      });

      sinon.stub(request, 'post').callsFake(function(url) {
        expect(url).to.be('https://test.com');
        return new RequestMock(
          {
            body: {
              attr1: 'attribute 1',
              attr2: 'attribute 2'
            },
            headers: {
              'Content-Type': 'application/json',
              'Auth0-Client': telemetryInfo
            },
            cb: function(cb) {
              cb(null, {
                body: {
                  user_id: 'auth0|123',
                  email: 'me@example.com'
                }
              });
            }
          },
          'POST',
          'https://test.com'
        );
      });

      sinon.stub(request, 'patch').callsFake(function(url) {
        expect(url).to.be('https://test.com');
        return new RequestMock(
          {
            body: {
              attr1: 'attribute 1',
              attr2: 'attribute 2'
            },
            headers: {
              'Content-Type': 'application/json',
              'Auth0-Client': telemetryInfo
            },
            cb: function(cb) {
              cb(null, {
                body: {
                  user_id: 'auth0|123',
                  email: 'me@example.com'
                }
              });
            }
          },
          'PATCH',
          'https://test.com'
        );
      });
    });

    after(function() {
      request.get.restore();
      request.post.restore();
      request.patch.restore();
    });

    it('should get stuff', function() {
      var req = new RequestBuilder({});
      var handler = req
        .get('https://test.com')
        .withCredentials()
        .then(function(data) {});

      expect(handler.getMethod()).to.eql('GET');
      expect(handler.getUrl()).to.eql('https://test.com');
      expect(handler.getHeaders()).to.eql({
        'Content-Type': 'application/json',
        'Auth0-Client': telemetryInfo
      });
    });

    it('should retry request', function() {
      var retryTimes = 2;
      var req = new RequestBuilder({
        _timesToRetryFailedRequests: retryTimes
      });
      var handler = req
        .get('https://test.com')
        .withCredentials()
        .then(function(data) {});

      expect(handler.request.willRetry).to.eql(retryTimes);
    });

    it('should post stuff', function() {
      var req = new RequestBuilder({});
      var trimUserDetailsStub = sinon
        .stub(objectHelper, 'trimUserDetails')
        .callsFake(function(obj) {
          return obj;
        });
      var handler = req
        .post('https://test.com')
        .send({
          attr1: 'attribute 1',
          attr2: 'attribute 2'
        })
        .then(function(data) {});

      expect(trimUserDetailsStub).to.be.called;
      trimUserDetailsStub.restore();
      expect(handler.getMethod()).to.eql('POST');
      expect(handler.getUrl()).to.eql('https://test.com');
      expect(handler.getBody()).to.eql({
        attr1: 'attribute 1',
        attr2: 'attribute 2'
      });
      expect(handler.getHeaders()).to.eql({
        'Content-Type': 'application/json',
        'Auth0-Client': telemetryInfo
      });
    });

    it('should patch stuff', function() {
      var req = new RequestBuilder({});
      var handler = req
        .patch('https://test.com')
        .send({
          attr1: 'attribute 1',
          attr2: 'attribute 2'
        })
        .then(function(data) {});

      expect(handler.getMethod()).to.eql('PATCH');
      expect(handler.getUrl()).to.eql('https://test.com');
      expect(handler.getBody()).to.eql({
        attr1: 'attribute 1',
        attr2: 'attribute 2'
      });
      expect(handler.getHeaders()).to.eql({
        'Content-Type': 'application/json',
        'Auth0-Client': telemetryInfo
      });

      handler.abort();
    });
  });

  describe('with noHeaders:true', function() {
    before(function() {
      sinon.stub(request, 'get').callsFake(function(url) {
        expect(url).to.be('https://test.com');
        return new RequestMock(
          {
            headers: {},
            cb: function(cb) {
              cb(null, {
                body: {
                  user_id: 'auth0|123',
                  email: 'me@example.com'
                }
              });
            }
          },
          'GET',
          'https://test.com'
        );
      });

      sinon.stub(request, 'post').callsFake(function(url) {
        expect(url).to.be('https://test.com');
        return new RequestMock(
          {
            body: {
              attr1: 'attribute 1',
              attr2: 'attribute 2'
            },
            headers: {},
            cb: function(cb) {
              cb(null, {
                body: {
                  user_id: 'auth0|123',
                  email: 'me@example.com'
                }
              });
            }
          },
          'POST',
          'https://test.com'
        );
      });

      sinon.stub(request, 'patch').callsFake(function(url) {
        expect(url).to.be('https://test.com');
        return new RequestMock(
          {
            body: {
              attr1: 'attribute 1',
              attr2: 'attribute 2'
            },
            headers: {},
            cb: function(cb) {
              cb(null, {
                body: {
                  user_id: 'auth0|123',
                  email: 'me@example.com'
                }
              });
            }
          },
          'PATCH',
          'https://test.com'
        );
      });
    });

    after(function() {
      request.get.restore();
      request.post.restore();
      request.patch.restore();
    });

    it('should get stuff', function() {
      var req = new RequestBuilder({});
      var handler = req
        .get('https://test.com', { noHeaders: true })
        .withCredentials()
        .then(function(data) {});

      expect(handler.getMethod()).to.eql('GET');
      expect(handler.getUrl()).to.eql('https://test.com');
      expect(handler.getHeaders()).to.eql({});
    });

    it('should retry request', function() {
      var retryTimes = 2;
      var req = new RequestBuilder({
        _timesToRetryFailedRequests: retryTimes
      });
      var handler = req
        .get('https://test.com', { noHeaders: true })
        .withCredentials()
        .then(function(data) {});

      expect(handler.request.willRetry).to.eql(retryTimes);
    });

    it('should post stuff', function() {
      var req = new RequestBuilder({});
      var trimUserDetailsStub = sinon
        .stub(objectHelper, 'trimUserDetails')
        .callsFake(function(obj) {
          return obj;
        });
      var handler = req
        .post('https://test.com', { noHeaders: true })
        .send({
          attr1: 'attribute 1',
          attr2: 'attribute 2'
        })
        .then(function(data) {});

      expect(trimUserDetailsStub).to.be.called;
      trimUserDetailsStub.restore();
      expect(handler.getMethod()).to.eql('POST');
      expect(handler.getUrl()).to.eql('https://test.com');
      expect(handler.getBody()).to.eql({
        attr1: 'attribute 1',
        attr2: 'attribute 2'
      });
      expect(handler.getHeaders()).to.eql({});
    });

    it('should patch stuff', function() {
      var req = new RequestBuilder({});
      var handler = req
        .patch('https://test.com', { noHeaders: true })
        .send({
          attr1: 'attribute 1',
          attr2: 'attribute 2'
        })
        .then(function(data) {});

      expect(handler.getMethod()).to.eql('PATCH');
      expect(handler.getUrl()).to.eql('https://test.com');
      expect(handler.getBody()).to.eql({
        attr1: 'attribute 1',
        attr2: 'attribute 2'
      });
      expect(handler.getHeaders()).to.eql({});

      handler.abort();
    });
  });
});
