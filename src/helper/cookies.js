var windowHandler = require('./window');
var base64Url = require('./base64_url');

function create(name, value, days) {
  var date;
  var expires;

  if (
    windowHandler.getDocument().cookie === undefined ||
    windowHandler.getDocument().cookie === null
  ) {
    throw new Error('cookie storage not available');
  }

  if (days) {
    var timeToExpire = days * 24 * 60 * 60 * 1000;
    date = new Date();
    date.setTime(date.getTime() + timeToExpire);
    expires = '; expires=' + date.toGMTString();
  } else {
    expires = '';
  }

  windowHandler.getDocument().cookie = name + '=' + base64Url.encode(value) + expires + '; path=/';
}

function read(name) {
  var i;
  var cookie;
  var cookies;
  var nameEQ = name + '=';

  if (
    windowHandler.getDocument().cookie === undefined ||
    windowHandler.getDocument().cookie === null
  ) {
    throw new Error('cookie storage not available');
  }

  cookies = windowHandler.getDocument().cookie.split(';');

  for (i = 0; i < cookies.length; i++) {
    cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return base64Url.decode(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
}

function erase(name) {
  create(name, '', -1);
}

module.exports = {
  create: create,
  read: read,
  erase: erase
};
