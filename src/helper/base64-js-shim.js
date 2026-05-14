// base64-js shim for the modern build. btoa/atob + Uint8Array; accepts
// URL-safe input like real base64-js does. Used by helper/base64_url.js and
// (via the idtoken-verifier source redirect) idtoken-verifier's base64 helper.

const CHUNK = 8192;

function fromByteArray(arr) {
  let bin = '';
  for (let i = 0; i < arr.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, arr.slice(i, i + CHUNK));
  }
  return btoa(bin);
}

function toByteArray(b64) {
  // Normalize URL-safe → standard for atob; pad to a multiple of 4.
  let s = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  const bin = atob(s);
  // eslint-disable-next-line no-undef
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export { fromByteArray, toByteArray };
export default { fromByteArray, toByteArray };
