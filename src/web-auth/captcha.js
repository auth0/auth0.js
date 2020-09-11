// eslint-disable-next-line no-unused-vars
import Authentication from '../authentication';
import object from '../helper/object';

var noop = function () { };

var defaults = {
  lang: 'en',
  templates: {
    'auth0': function (challenge) {
      var message = challenge.type === 'code' ?
        'Enter the code shown above' :
        'Solve the formula shown above';
      return '<div class="captcha-challenge">\n' +
        '  <img src="' + challenge.image + '" />\n' +
        '  <button type="button" class="captcha-reload">↺</button>\n' +
        '</div>\n' +
        '<input type="text" name="captcha"\n' +
        '  class="form-control captcha-control"\n' +
        '  placeholder="' + message + '" />';
    }
    ,
    'recaptcha_v2': function () {
      return '<div class="recaptcha" ></div><input type="hidden" name="captcha" />';
    }
    ,
    'error': function () {
      return '<div class="error" style="color: red;">Error getting the bot detection challenge. Please contact the system administrator.</div>'
    }
  }
};

function handleAuth0Provider(element, options, challenge, load) {
  element.innerHTML = options.templates[challenge.provider](challenge);
  element.querySelector('.captcha-reload').addEventListener('click', function (e) {
    e.preventDefault();
    load();
  });
}

function injectRecaptchaScript(element, lang, callback) {
  var callbackName = 'recaptchaCallback_' + Math.floor(Math.random() * 1000001);
  window[callbackName] = function () {
    delete window[callbackName];
    callback();
  };
  var script = window.document.createElement('script');
  script.src = 'https://www.google.com/recaptcha/api.js?hl=' + lang + '&onload=' + callbackName;
  script.async = true;
  window.document.body.appendChild(script);
}

function handleRecaptchaProvider(element, options, challenge) {
  var widgetId = element.hasAttribute('data-wid') && element.getAttribute('data-wid');

  function setValue(value) {
    var input = element.querySelector('input[name="captcha"]');
    input.value = value || '';
  }

  if (widgetId) {
    setValue();
    window.grecaptcha.reset(widgetId);
    return;
  }

  element.innerHTML = options.templates[challenge.provider](challenge);

  var recaptchaDiv = element.querySelector('.recaptcha');

  injectRecaptchaScript(element, options.lang, function () {
    widgetId = window.grecaptcha.render(recaptchaDiv, {
      callback: setValue,
      'expired-callback': function () { setValue(); },
      'error-callback': function () { setValue(); },
      sitekey: challenge.siteKey
    });
    element.setAttribute('data-wid', widgetId)
  });
}


/**
 *
 * Renders the captcha challenge in the provided element.
 *
 * @param {Authentication} auth0Client The challenge response from the authentication server
 * @param {HTMLElement} element The element where the captcha needs to be rendered
 * @param {Object} options The configuration options for the captcha
 * @param {Object} [options.templates] An object containaing templates for each captcha provider
 * @param {Function} [options.templates.auth0] template function receiving the challenge and returning an string
 * @param {Function} [options.templates.recaptcha_v2] template function receiving the challenge and returning an string
 * @param {String} [options.lang=en] the ISO code of the language for recaptcha*
 * @param {Function} [callback] an optional callback function
 */
function render(auth0Client, element, options, callback) {
  options = object.merge(defaults).with(options || {});

  function load(done) {
    done = done || noop;
    auth0Client.getChallenge(function (err, challenge) {
      if (err) {
        element.innerHTML = options.templates.error(err);
        return done(err);
      }
      if (!challenge.required) {
        element.style.display = 'none';
        element.innerHTML = '';
        return;
      }
      element.style.display = '';
      if (challenge.provider === 'auth0') {
        handleAuth0Provider(element, options, challenge, load);
      } else if (challenge.provider === 'recaptcha_v2') {
        handleRecaptchaProvider(element, options, challenge);
      }
      done();
    });
  }

  function getValue() {
    var captchaInput = element.querySelector('input[name="captcha"]');
    if (!captchaInput) { return; }
    return captchaInput.value;
  }

  load(callback);

  return {
    reload: load,
    getValue: getValue
  };
}

export default { render: render };
