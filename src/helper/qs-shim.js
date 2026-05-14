// URLSearchParams-based qs shim used in the modern build only. Covers the
// subset used in this codebase: stringify (URL-encoded or `encode: false`
// with custom delimiter for window.open features) and parse for OAuth hashes.
// Used by web-auth, authentication, passwordless, hosted-pages, popup-handler.

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function encodeIf(value, shouldEncode) {
  const str = String(value);
  return shouldEncode ? encodeURIComponent(str) : str;
}

function serializePair(key, value, encode) {
  if (value === null) return `${encodeIf(key, encode)}=`;
  return `${encodeIf(key, encode)}=${encodeIf(value, encode)}`;
}

function flatten(prefix, value, encode, out) {
  if (value === undefined) return;
  if (isPlainObject(value)) {
    Object.keys(value).forEach((k) => {
      flatten(`${prefix}[${k}]`, value[k], encode, out);
    });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flatten(`${prefix}[${index}]`, item, encode, out);
    });
    return;
  }
  out.push(serializePair(prefix, value, encode));
}

function stringify(obj, options) {
  if (obj == null) return '';
  const opts = options || {};
  const encode = opts.encode !== false;
  const delimiter = opts.delimiter || '&';
  const pairs = [];
  Object.keys(obj).forEach((key) => flatten(key, obj[key], encode, pairs));
  return pairs.join(delimiter);
}

function parse(str) {
  const out = {};
  if (!str) return out;
  const input = str.charAt(0) === '?' ? str.slice(1) : str;
  // Duplicates and bracket-nested keys collect into an array under the base
  // key — keeps `state === parsedHash.state` rejecting non-flat input.
  // eslint-disable-next-line compat/compat
  new URLSearchParams(input).forEach((value, key) => {
    const bracketAt = key.indexOf('[');
    const baseKey = bracketAt === -1 ? key : key.slice(0, bracketAt);
    if (Object.prototype.hasOwnProperty.call(out, baseKey)) {
      out[baseKey] = Array.isArray(out[baseKey])
        ? out[baseKey].concat(value)
        : [out[baseKey], value];
    } else {
      out[baseKey] = bracketAt === -1 ? value : [value];
    }
  });
  return out;
}

export { stringify, parse };
export default { stringify, parse };
