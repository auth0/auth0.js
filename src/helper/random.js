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

  random.forEach(function (c) {
    result.push(charset[c % charset.length]);
  });

  return result.join('');
}

module.exports = {
  randomString: randomString
};
