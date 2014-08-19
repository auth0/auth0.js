function forceLogout (domain, callback) {
  var endpoint = 'https://' + domain + '/logout';
  var iframe = document.createElement('iframe');
  iframe.style.display = 'none';

  if (iframe.attachEvent) {
    iframe.attachEvent('onload', iframeloaded);
  } else {
    iframe.onload = iframeloaded;
  }

  function iframeloaded () {
    if (this.src !== endpoint) return;
    callback();
  };

  document.body.appendChild(iframe).src = endpoint;
}
