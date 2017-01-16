var windowHelper = require('./window');

const randomFallback = {
  getRandomValues: function(buffer) {
    for(var a = 0; a < buffer.length; a++) {
      buffer[a] = Math.floor(Math.random() * 255);
    }

    return buffer;
  }
}

function randomString(length) {
  if (typeof(Uint8Array) !== "undefined") {
    var bytes = new Uint8Array(length);
  } else {
    var bytes = new Array(length);
  }

  var result = [];
  var charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';

  var cryptoObj = windowHelper.getWindow().crypto || windowHelper.getWindow().msCrypto;
  if (!cryptoObj || typeof(Uint8Array) === "undefined") {
    cryptoObj = randomFallback;
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
