function randomString(length) {
  var bytes = new Uint8Array(length);
  var result = [];
  var charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';

  var cryptoObj = window.crypto || window.msCrypto;
  if (!cryptoObj) {
    return null;
  }

  var random = cryptoObj.getRandomValues(bytes);

  random.forEach(function (c) {
    result.push(charset[c % charset.length]);
  });

  return result.join('');
}

module.exports = {
  randomString: randomString
};
