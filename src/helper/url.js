// given a URL, extract the origin. Taken from: https://github.com/firebase/firebase-simple-login/blob/d2cb95b9f812d8488bdbfba51c3a7c153ba1a074/js/src/simple-login/transports/WinChan.js#L25-L30
function extractOrigin(url) {
  if (!/^https?:\/\//.test(url)) url = window.location.href;
  var m = /^(https?:\/\/[-_a-zA-Z.0-9:]+)/.exec(url);
  if (m) return m[1];
  return url;
}

module.exports = {
  extractOrigin: extractOrigin
};
