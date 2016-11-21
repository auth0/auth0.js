function randomString(length) {
    var bytes = new Uint8Array(length);
    var cryptoObj = window.crypto || window.msCrypto;
    var random = cryptoObj.getRandomValues(bytes);
    var result = [];
    var charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';
    random.forEach(function (c) {
        result.push(charset[c % charset.length]);
    });
    return result.join('');
}

module.exports = {
  randomString: randomString
};