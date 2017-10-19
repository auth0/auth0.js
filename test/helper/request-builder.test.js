var expect = require('expect.js');
var stub = require('sinon').stub;

var request = require('superagent');

var RequestMock = require('../mock/request-mock');
var RequestBuilder = require('../../src/helper/request-builder');

var telemetryInfo = new RequestBuilder({}).getTelemetryData();

describe('helpers requestBuilder', function() {
  describe('with noHeaders:false', function() {
    before(function() {
      stub(request, 'get', function(url) {
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

      stub(request, 'post', function(url) {
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

      stub(request, 'patch', function(url) {
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
      var handler = req.get('https://test.com').withCredentials().end(function(err, data) {});

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
      var handler = req.get('https://test.com').withCredentials().end(function(err, data) {});

      expect(handler.request.willRetry).to.eql(retryTimes);
    });

    it('should post stuff', function() {
      var req = new RequestBuilder({});
      var handler = req
        .post('https://test.com')
        .send({
          attr1: 'attribute 1',
          attr2: 'attribute 2'
        })
        .end(function(err, data) {});

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
        .end(function(err, data) {});

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
      stub(request, 'get', function(url) {
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

      stub(request, 'post', function(url) {
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

      stub(request, 'patch', function(url) {
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
        .end(function(err, data) {});

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
        .end(function(err, data) {});

      expect(handler.request.willRetry).to.eql(retryTimes);
    });

    it('should post stuff', function() {
      var req = new RequestBuilder({});
      var handler = req
        .post('https://test.com', { noHeaders: true })
        .send({
          attr1: 'attribute 1',
          attr2: 'attribute 2'
        })
        .end(function(err, data) {});

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
        .end(function(err, data) {});

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
