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
    if (iframe.src !== endpoint) throw new Error('Could not load logout endpoint via iFrame');
    callback();
  };

  iframe.src = endpoint;
  document.body.appendChild(iframe);
}
