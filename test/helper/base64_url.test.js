var expect = require('expect.js');
var base64url = require('../../src/helper/base64_url');

var tests = [
  { decoded: 'test', encoded: 'dGVzdA==' },
  { decoded: JSON.stringify({ foo: 'bar' }), encoded: 'eyJmb28iOiJiYXIifQ==' },
  { decoded: 'a', encoded: 'YQ==' }
];

describe('helpers base64_url', function() {
  describe('encode', function() {
    tests.forEach(function(s) {
      it('should encode ' + s.decoded + ' to ' + s.encoded, function() {
        expect(base64url.encode(s.decoded)).to.be(s.encoded);
      });
    });
  });
  describe('decode', function() {
    tests.forEach(function(s) {
      it('should decode ' + s.decoded, function() {
        expect(base64url.decode(s.encoded)).to.be(s.decoded);
      });
    });
    it('should handle special case when `str.length % 4 !== 0`', () => {
      expect(base64url.decode('YW=')).to.be('a');
    });
  });
});
