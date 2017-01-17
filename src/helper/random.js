var windowHelper = require('./window');

function randomString(length) {
  var bytes = new Uint8Array(length);
  var result = [];
  var charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';

  var cryptoObj = windowHelper.getWindow().crypto || windowHelper.getWindow().msCrypto;
  if (!cryptoObj) {
    return null;
  }

  var random = cryptoObj.getRandomValues(bytes);

  for (var a = 0; a < random.length; a++) {
    result.push(charset[random[a] % charset.length]);
  }

  return result.join('');
}

module.exports = {
  randomString: randomString
};
