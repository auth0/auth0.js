import expect from 'expect.js';
import qs from 'qs';
import shim from '../../src/helper/qs-shim';

describe('helpers qs-shim (modern build)', function () {
  describe('stringify parity with qs', function () {
    it('flat OAuth-style authorize params', function () {
      const params = {
        client_id: 'abc123',
        response_type: 'token id_token',
        redirect_uri: 'https://example.com/cb',
        scope: 'openid profile email',
        state: 'xyz',
        nonce: 'n-0S6_WzA2Mj'
      };
      expect(shim.stringify(params)).to.be(qs.stringify(params));
    });

    it('auth0Client base64 string', function () {
      const params = {
        client_id: 'abc',
        auth0Client: 'eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiMTAuMC4wIn0='
      };
      expect(shim.stringify(params)).to.be(qs.stringify(params));
    });

    it('popup windowFeatures (encode:false, delimiter:",")', function () {
      const opts = { width: 400, height: 600, left: 100, top: 100 };
      const fmt = { encode: false, delimiter: ',' };
      expect(shim.stringify(opts, fmt)).to.be(qs.stringify(opts, fmt));
    });

    it('one-level nested objects', function () {
      const params = {
        client_id: 'abc',
        auth0Client: { name: 'auth0.js', version: '10.0.0' }
      };
      expect(shim.stringify(params)).to.be(qs.stringify(params));
    });

    it('skips undefined values', function () {
      const params = { a: 'x', b: undefined, c: 'y' };
      expect(shim.stringify(params)).to.be(qs.stringify(params));
    });

    it('emits empty value for null', function () {
      const params = { a: null, b: 'x' };
      expect(shim.stringify(params)).to.be(qs.stringify(params));
    });

    it('returns empty string for null/undefined input', function () {
      expect(shim.stringify(null)).to.be('');
      expect(shim.stringify(undefined)).to.be('');
    });
  });

  describe('parse', function () {
    it('parses a typical success hash', function () {
      const result = shim.parse(
        'access_token=AT&id_token=ID&token_type=Bearer&expires_in=3600&state=xyz'
      );
      expect(result.access_token).to.be('AT');
      expect(result.id_token).to.be('ID');
      expect(result.token_type).to.be('Bearer');
      expect(result.expires_in).to.be('3600');
      expect(result.state).to.be('xyz');
    });

    it('parses an error hash', function () {
      const result = shim.parse(
        'error=access_denied&error_description=user%20declined&state=xyz'
      );
      expect(result.error).to.be('access_denied');
      expect(result.error_description).to.be('user declined');
      expect(result.state).to.be('xyz');
    });

    it('returns plain object with hasOwnProperty', function () {
      const result = shim.parse('access_token=AT');
      expect(result.hasOwnProperty('access_token')).to.be(true);
      expect(result.hasOwnProperty('id_token')).to.be(false);
    });

    it('returns empty object for empty/null/undefined', function () {
      expect(Object.keys(shim.parse(''))).to.eql([]);
      expect(Object.keys(shim.parse(null))).to.eql([]);
      expect(Object.keys(shim.parse(undefined))).to.eql([]);
    });

    it('decodes percent-encoded values and + as space', function () {
      const result = shim.parse('a=hello%20world&b=foo+bar');
      expect(result.a).to.be('hello world');
      expect(result.b).to.be('foo bar');
    });

    it('duplicate keys → array', function () {
      expect(shim.parse('a=1&a=2&a=3').a).to.eql(['1', '2', '3']);
    });

    it('duplicate state keys produce a non-string (rejects strict ===)', function () {
      const result = shim.parse('state=a&state=b&id_token=AT');
      expect(typeof result.state).to.not.be('string');
    });

    it('bracket-nested keys merge into base key (flat then bracket)', function () {
      const result = shim.parse('state=a&state[x]=b');
      expect(typeof result.state).to.not.be('string');
      expect(result).to.not.have.property('state[x]');
    });

    it('bracket-nested keys merge into base key (bracket then flat)', function () {
      const result = shim.parse('state[x]=b&state=a');
      expect(typeof result.state).to.not.be('string');
    });

    it('bracket-only key → array under base key', function () {
      const result = shim.parse('state[x]=b');
      expect(result.state).to.eql(['b']);
      expect(result).to.not.have.property('state[x]');
    });

    it('multiple bracket keys collect under base key', function () {
      expect(shim.parse('a[x]=1&a[y]=2&a[z]=3').a).to.have.length(3);
    });
  });
});
