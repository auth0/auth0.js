import windowHelper from './window';

function randomString(length) {
  // Handle invalid length
  if (!length || length <= 0) {
    return '';
  }
  var charset =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';

  var cryptoObj =
    windowHelper.getWindow().crypto || windowHelper.getWindow().msCrypto;
  if (!cryptoObj) {
    return null;
  }

  var result = [];
  // Use rejection sampling to avoid modulo bias
  // 256 % 66 = 58, so we reject values >= 198 (256 - 58)
  var maxValid = 256 - (256 % charset.length);
  while (result.length < length) {
    // eslint-disable-next-line
    var bytes = new Uint8Array(length - result.length);
    var random = cryptoObj.getRandomValues(bytes);

    for (var a = 0; a < random.length && result.length < length; a++) {
      // Reject values that would cause modulo bias
      if (random[a] < maxValid) {
        result.push(charset[random[a] % charset.length]);
      }
    }
  }

  return result.join('');
}

export default {
  randomString: randomString
};
