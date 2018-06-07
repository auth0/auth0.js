var objectHelper = require('./object');

function redirect(url) {
  getWindow().location = url;
}

function getDocument() {
  return getWindow().document;
}

function getWindow() {
  return window;
}

function getOrigin() {
  var location = getWindow().location;
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
