var expect = require('expect.js');

var responseHandler = require('../../src/helper/response-handler');

describe('helpers responseHandler', function() {
  it('should return default error', function(done) {
    responseHandler(function(err, data) {
      expect(data).to.be(undefined);
      expect(err).to.eql({
        error: 'generic_error',
        errorDescription: 'Something went wrong'
      });
      done();
    })(null, null);
  });

  it('should return normalized format 1', function(done) {
    var assert_err = {};
    assert_err.response = {};
    assert_err.response.statusCode = 400;
    assert_err.response.statusText = 'Bad request';
    assert_err.response.body = {
      error: 'the_error_code',
      policy: 'the policy',
      error_description: 'The error description.',
      name: 'SomeName'
    };

    responseHandler(function(err, data) {
      expect(data).to.be(undefined);
      expect(err).to.eql({
        original: assert_err,
        statusCode: 400,
        statusText: 'Bad request',
        code: 'the_error_code',
        policy: 'the policy',
        description: 'The error description.',
        name: 'SomeName'
      });
      done();
    })(assert_err, null);
  });

  it('should return normalized format 2', function(done) {
    var assert_err = {};
    assert_err.response = {};
    assert_err.response.body = {
      code: 'the_error_code',
      description: 'The error description.'
    };

    responseHandler(function(err, data) {
      expect(data).to.be(undefined);
      expect(err).to.eql({
        original: assert_err,
        code: 'the_error_code',
        description: 'The error description.'
      });
      done();
    })(assert_err, null);
  });

  it('should return normalized format 3', function(done) {
    var assert_err = {};
    assert_err.response = {};
    assert_err.response.body = {};

    responseHandler(function(err, data) {
      expect(data).to.be(undefined);
      expect(err).to.eql({
        original: assert_err,
        code: null,
        description: null
      });
      done();
    })(assert_err, null);
  });

  it('should return normalized format 4', function(done) {
    var assert_err = {};
    assert_err.response = {};
    assert_err.response.body = {
      error_code: 'the_error_code',
      error_description: 'The error description.'
    };

    responseHandler(function(err, data) {
      expect(data).to.be(undefined);
      expect(err).to.eql({
        original: assert_err,
        code: 'the_error_code',
        description: 'The error description.'
      });
      done();
    })(assert_err, null);
  });

  it('should return normalized format 4', function(done) {
    var assert_err = {};
    assert_err.err = {};
    assert_err.err = {
      status: 'the_error_code',
      err: 'The error description.'
    };

    responseHandler(function(err, data) {
      expect(data).to.be(undefined);
      expect(err).to.eql({
        original: assert_err,
        code: 'the_error_code',
        description: 'The error description.'
      });
      done();
    })(assert_err, null);
  });

  it('should return normalized format 5 (error comes from data)', function(done) {
    var assert_err = {
      error: 'the_error_code',
      errorDescription: 'The error description.'
    };

    responseHandler(function(err, data) {
      expect(data).to.be(undefined);
      expect(err).to.eql({
        original: assert_err,
        code: 'the_error_code',
        description: 'The error description.'
      });
      done();
    })(null, assert_err);
  });

  it('should return the data', function(done) {
    var assert_data = {
      body: {
        attr1: 'attribute 1',
        attr2: 'attribute 2'
      }
    };

    responseHandler(function(err, data) {
      expect(err).to.be(null);
      expect(data).to.eql({
        attr1: 'attribute 1',
        attr2: 'attribute 2'
      });
      done();
    })(null, assert_data);
  });

  it('should return the data 2', function(done) {
    var assert_data = {
      text: 'The response message',
      type: 'text/html'
    };

    responseHandler(function(err, data) {
      expect(err).to.be(null);
      expect(data).to.eql('The response message');
      done();
    })(null, assert_data);
  });
});
