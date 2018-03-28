var objectHelper = require('./object');

function redirect(url) {
  global.window.location = url;
}

function getDocument() {
  return global.window.document;
}

function getWindow() {
  return global.window;
}

function getOrigin() {
  var location = global.window.location;
  var origin = location.origin;
  if (!origin) {
    origin = objectHelper.getOriginFromUrl(location.href);
  }
  return origin;
}

module.exports = {
  redirect: redirect,
  getDocument: getDocument,
  getWindow: getWindow,
  getOrigin: getOrigin
};
