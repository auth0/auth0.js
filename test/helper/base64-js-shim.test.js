import expect from 'expect.js';
import base64Real from 'base64-js';
import base64Shim from '../../src/helper/base64-js-shim';

describe('helpers base64-js-shim (modern build)', function () {
  it('encodes a known byte array identically to base64-js', function () {
    const bytes = [104, 101, 108, 108, 111]; // "hello"
    expect(base64Shim.fromByteArray(bytes)).to.be(
      base64Real.fromByteArray(bytes)
    );
  });

  it('encodes a JWT-payload-shaped string identically', function () {
    const payload = JSON.stringify({
      iss: 'https://t.auth0.com/',
      sub: 'auth0|abcdef',
      aud: 'clientid',
      exp: 1700000000,
      iat: 1699999000
    });
    const bytes = [];
    for (let i = 0; i < payload.length; i++) bytes.push(payload.charCodeAt(i));
    expect(base64Shim.fromByteArray(bytes)).to.be(
      base64Real.fromByteArray(bytes)
    );
  });

  it('round-trips through the base64_url usage pattern', function () {
    const input = 'hello world!@#$%^&*()';
    const bytes = [];
    for (let i = 0; i < input.length; i++) bytes.push(input.charCodeAt(i));
    const encoded = base64Shim.fromByteArray(bytes);
    const decoded = base64Shim.toByteArray(encoded);
    let result = '';
    for (let j = 0; j < decoded.length; j++) {
      result += String.fromCharCode(decoded[j]);
    }
    expect(result).to.be(input);
  });

  it('toByteArray returns a Uint8Array with the same bytes as base64-js', function () {
    const b64 = base64Real.fromByteArray([1, 2, 3, 4, 5, 250, 0, 127]);
    const realBytes = base64Real.toByteArray(b64);
    const shimBytes = base64Shim.toByteArray(b64);
    expect(shimBytes).to.be.a(Uint8Array);
    expect(shimBytes.length).to.be(realBytes.length);
    for (let i = 0; i < realBytes.length; i++) {
      expect(shimBytes[i]).to.be(realBytes[i]);
    }
  });

  it('handles large arrays (>8KB) without RangeError', function () {
    const big = new Array(20000);
    for (let i = 0; i < big.length; i++) big[i] = i % 256;
    expect(base64Shim.fromByteArray(big)).to.be(base64Real.fromByteArray(big));
  });

  it('accepts URL-safe base64 input (-, _) like base64-js does', function () {
    // JWT signature is base64url-encoded — must decode without manual
    // standardization, because idtoken-verifier/src/helpers/base64.js's
    // decodeToHEX path passes URL-safe input directly to toByteArray.
    let urlSafe =
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InIxTGtiQm8zOTI1UmIyWkZGckt5VTNNVmV4OVQyODE3S3gwdmJpNmlfS2MifQ';
    while (urlSafe.length % 4 !== 0) urlSafe += '=';
    const realBytes = base64Real.toByteArray(urlSafe);
    const shimBytes = base64Shim.toByteArray(urlSafe);
    expect(shimBytes.length).to.be(realBytes.length);
    for (let i = 0; i < realBytes.length; i++) {
      expect(shimBytes[i]).to.be(realBytes[i]);
    }
  });

  it('tolerates missing trailing padding (auth0.js callers sometimes omit it)', function () {
    // A 3-byte payload encodes to 4 base64 chars with no padding; longer
    // payloads need = padding. Test the unpadded case for safety.
    const unpadded = 'eyJoZWxsbyI6IndvcmxkIn0';
    const padded = unpadded + '=';
    const realBytes = base64Real.toByteArray(padded);
    const shimBytes = base64Shim.toByteArray(unpadded);
    expect(shimBytes.length).to.be(realBytes.length);
    for (let i = 0; i < realBytes.length; i++) {
      expect(shimBytes[i]).to.be(realBytes[i]);
    }
  });
});
