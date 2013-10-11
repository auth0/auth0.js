function forceLogout (domain, callback) {
  window.frames['test-iframe'].location = 'https://' + domain + '/logout';
  setTimeout(function () {
    callback();
  }, 1 * 1000);
}
