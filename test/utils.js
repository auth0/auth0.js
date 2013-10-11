function forceLogout (domain, callback) {
  var iframe = document.getElementsByName('test-iframe')[0];
  iframe.setAttribute('onload', (function() { callback(); }).call(this));

  window.frames['test-iframe'].location = 'https://' + domain + '/logout';
}
