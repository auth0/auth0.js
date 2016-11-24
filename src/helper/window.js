function redirect(url) {
  global.window.location = url;
}

function getDocument() {
  return global.window.document;
}

function getWindow() {
  return global.window;
}

module.exports = {
  redirect: redirect,
  getDocument: getDocument,
  getWindow: getWindow
};
