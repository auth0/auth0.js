var expect = require('expect.js');
var base64url = require('../../src/helper/base64_url');

var tests = [
  { decoded: 'test', encoded: '' },
  { decoded: JSON.stringify({ foo: 'bar' }), encoded: '' },
  { decoded: '123', encoded: '' }
];

describe('helpers base64_url', function() {
  describe('encode', function() {
    tests.forEach(function(s) {
      it('should encode ' + s.decoded, function() {
        expect(base64url.encode(s.decoded, s.encoded));
      });
    });
  });
  describe('decode', function() {
    tests.forEach(function(s) {
      it('should decode ' + s.decoded, function() {
        expect(base64url.encode(s.encoded, s.decoded));
      });
    });
  });
});
