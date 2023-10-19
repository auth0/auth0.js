// eslint-disable-next-line no-unused-vars
import Authentication from '../authentication';
import object from '../helper/object';

var noop = function () {};
var captchaSolved = noop;

var RECAPTCHA_V2_PROVIDER = 'recaptcha_v2';
var RECAPTCHA_ENTERPRISE_PROVIDER = 'recaptcha_enterprise';
var HCAPTCHA_PROVIDER = 'hcaptcha';
var FRIENDLY_CAPTCHA_PROVIDER = 'friendly_captcha';
var ARKOSE_PROVIDER = 'arkose';
var AUTH0_PROVIDER = 'auth0';
var MAX_RETRY = 3;

var defaults = {
  lang: 'en',
  templates: {
    auth0: function (challenge) {
      var message =
        challenge.type === 'code'
          ? 'Enter the code shown above'
          : 'Solve the formula shown above';
      return (
        '<div class="captcha-challenge">\n' +
        '  <img src="' +
        challenge.image +
        '" />\n' +
        '  <button type="button" class="captcha-reload">↺</button>\n' +
        '</div>\n' +
        '<input type="text" name="captcha"\n' +
        '  class="form-control captcha-control"\n' +
        '  placeholder="' +
        message +
        '" />'
      );
    },
    recaptcha_v2: function () {
      return '<div class="recaptcha" ></div><input type="hidden" name="captcha" />';
    },
    recaptcha_enterprise: function () {
      return '<div class="recaptcha" ></div><input type="hidden" name="captcha" />';
    },
    hcaptcha: function () {
      return '<div class="hcaptcha" ></div><input type="hidden" name="captcha" />';
    },
    friendly_captcha: function () {
      return '<div class="friendly-captcha" ></div><input type="hidden" name="captcha" />';
    },
    arkose: function () {
      return '<div class="arkose" ></div><input type="hidden" name="captcha" />';
    },
    error: function () {
      return '<div class="error" style="color: red;">Error getting the bot detection challenge. Please contact the system administrator.</div>';
    }
  }
};

function handleAuth0Provider(element, options, challenge, load) {
  element.innerHTML = options.templates[challenge.provider](challenge);
  element
    .querySelector('.captcha-reload')
    .addEventListener('click', function (e) {
      e.preventDefault();
      load();
    });
}

function globalForCaptchaProvider(provider) {
  switch (provider) {
    case RECAPTCHA_V2_PROVIDER:
      return window.grecaptcha;
    case RECAPTCHA_ENTERPRISE_PROVIDER:
      return window.grecaptcha.enterprise;
    case HCAPTCHA_PROVIDER:
      return window.hcaptcha;
    case FRIENDLY_CAPTCHA_PROVIDER:
      return window.friendlyChallenge;
    case ARKOSE_PROVIDER:
      return window.arkose;
    /* istanbul ignore next */
    default:
      throw new Error('Unknown captcha provider');
  }
}

function scriptForCaptchaProvider(
  provider,
  lang,
  callback,
  clientSubdomain,
  siteKey
) {
  switch (provider) {
    case RECAPTCHA_V2_PROVIDER:
      return (
        'https://www.recaptcha.net/recaptcha/api.js?hl=' +
        lang +
        '&onload=' +
        callback
      );
    case RECAPTCHA_ENTERPRISE_PROVIDER:
      return (
        'https://www.recaptcha.net/recaptcha/enterprise.js?render=explicit&hl=' +
        lang +
        '&onload=' +
        callback
      );
    case HCAPTCHA_PROVIDER:
      return (
        'https://js.hcaptcha.com/1/api.js?hl=' + lang + '&onload=' + callback
      );
    case FRIENDLY_CAPTCHA_PROVIDER:
      return 'https://cdn.jsdelivr.net/npm/friendly-challenge@0.9.12/widget.min.js';
    case ARKOSE_PROVIDER:
      return (
        'https://' +
        clientSubdomain +
        '.arkoselabs.com/v2/' +
        siteKey +
        '/api.js'
      );
    /* istanbul ignore next */
    default:
      throw new Error('Unknown captcha provider');
  }
}

function loadScript(url, attributes) {
  var script = window.document.createElement('script');
  for (var attr in attributes) {
    if (attr.startsWith('data-')) {
      script.dataset[attr.replace('data-', '')] = attributes[attr];
    } else {
      script[attr] = attributes[attr];
    }
  }
  script.src = url;
  window.document.body.appendChild(script);
}

function removeScript(url) {
  var scripts = window.document.querySelectorAll('script[src="' + url + '"]');
  scripts.forEach(function (script) {
    script.remove();
  });
}

function injectCaptchaScript(element, opts, callback, setValue) {
  var callbackName =
    opts.provider + 'Callback_' + Math.floor(Math.random() * 1000001);
  var attributes = {
    async: true,
    defer: true
  };
  var scriptSrc = scriptForCaptchaProvider(
    opts.provider,
    opts.lang,
    callbackName,
    opts.clientSubdomain,
    opts.siteKey
  );
  if (opts.provider === ARKOSE_PROVIDER) {
    var retryCount = 0;
    attributes['data-callback'] = callbackName;
    attributes['onerror'] = function () {
      if (retryCount < MAX_RETRY) {
        removeScript(scriptSrc);
        loadScript(scriptSrc, attributes);
        retryCount++;
        return;
      }
      removeScript(scriptSrc);
      // Optimzation to tell auth0 to fail open if Arkose is configured to fail open
      setValue('BYPASS_CAPTCHA');
    };
    window[callbackName] = function (arkose) {
      window.arkose = arkose;
      callback(arkose);
    };
  } else {
    window[callbackName] = function () {
      delete window[callbackName];
      callback();
    };
    if (opts.provider === FRIENDLY_CAPTCHA_PROVIDER) {
      attributes['onload'] = window[callbackName];
    }
  }
  loadScript(scriptSrc, attributes);
}

function handleCaptchaProvider(element, options, challenge) {
  var widgetId =
    element.hasAttribute('data-wid') && element.getAttribute('data-wid');

  function setValue(value) {
    var input = element.querySelector('input[name="captcha"]');
    input.value = value || '';
  }

  if (
    challenge.provider === FRIENDLY_CAPTCHA_PROVIDER &&
    window.auth0FCInstance
  ) {
    setValue();
    window.auth0FCInstance.reset();
    return;
  } else if (
    challenge.provider === ARKOSE_PROVIDER &&
    globalForCaptchaProvider(challenge.provider)
  ) {
    setValue();
    globalForCaptchaProvider(challenge.provider).reset();
    return;
  } else if (widgetId) {
    setValue();
    globalForCaptchaProvider(challenge.provider).reset(widgetId);
    return;
  }

  element.innerHTML = options.templates[challenge.provider](challenge);

  var captchaClass;
  switch (challenge.provider) {
    case RECAPTCHA_ENTERPRISE_PROVIDER:
      captchaClass = '.recaptcha';
      break;
    case RECAPTCHA_V2_PROVIDER:
      captchaClass = '.recaptcha';
      break;
    case HCAPTCHA_PROVIDER:
      captchaClass = '.hcaptcha';
      break;
    case FRIENDLY_CAPTCHA_PROVIDER:
      captchaClass = '.friendly-captcha';
      break;
    case ARKOSE_PROVIDER:
      captchaClass = '.arkose';
      break;
  }
  var captchaDiv = element.querySelector(captchaClass);

  injectCaptchaScript(
    element,
    {
      lang: options.lang,
      provider: challenge.provider,
      clientSubdomain: challenge.clientSubdomain,
      siteKey: challenge.siteKey
    },
    function (arkose) {
      var global = globalForCaptchaProvider(challenge.provider);
      if (challenge.provider === ARKOSE_PROVIDER) {
        var retryCount = 0;
        arkose.setConfig({
          onCompleted: function (response) {
            setValue(response.token);
            captchaSolved();
          },
          onError: function () {
            if (retryCount < MAX_RETRY) {
              setValue();
              arkose.reset();
              // To ensure reset is successful, we need to set a timeout here
              setTimeout(function () {
                arkose.run();
              }, 500);
              retryCount++;
            } else {
              // Optimzation to tell auth0 to fail open if Arkose is configured to fail open
              setValue('BYPASS_CAPTCHA');
            }
          }
        });
      } else if (challenge.provider === FRIENDLY_CAPTCHA_PROVIDER) {
        window.auth0FCInstance = new global.WidgetInstance(captchaDiv, {
          sitekey: challenge.siteKey,
          language: options.lang,
          doneCallback: function (solution) {
            setValue(solution);
          },
          errorCallback: function () {
            setValue();
          }
        });
      } else {
        widgetId = global.render(captchaDiv, {
          callback: setValue,
          'expired-callback': function () {
            setValue();
          },
          'error-callback': function () {
            setValue();
          },
          sitekey: challenge.siteKey
        });
        element.setAttribute('data-wid', widgetId);
      }
    },
    setValue
  );
}

/**
 *
 * Renders the captcha challenge in the provided element.
 *
 * @param {Authentication} auth0Client The challenge response from the authentication server
 * @param {HTMLElement} element The element where the captcha needs to be rendered
 * @param {Object} options The configuration options for the captcha
 * @param {Object} [options.templates] An object containing templates for each captcha provider
 * @param {Function} [options.templates.auth0] template function receiving the challenge and returning a string
 * @param {Function} [options.templates.recaptcha_v2] template function receiving the challenge and returning a string
 * @param {Function} [options.templates.recaptcha_enterprise] template function receiving the challenge and returning a string
 * @param {Function} [options.templates.hcaptcha] template function receiving the challenge and returning a string
 * @param {Function} [options.templates.friendly_captcha] template function receiving the challenge and returning a string
 * @param {Function} [options.templates.arkose] template function receiving the challenge and returning a string
 * @param {Function} [options.templates.error] template function returning a custom error message when the challenge could not be fetched, receives the error as first argument
 * @param {String} [options.lang=en] the ISO code of the language for recaptcha
 * @param {Function} [callback] An optional callback called after captcha is loaded
 * @ignore
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
      if (challenge.provider === AUTH0_PROVIDER) {
        handleAuth0Provider(element, options, challenge, load);
      } else if (
        challenge.provider === RECAPTCHA_V2_PROVIDER ||
        challenge.provider === RECAPTCHA_ENTERPRISE_PROVIDER ||
        challenge.provider === HCAPTCHA_PROVIDER ||
        challenge.provider === FRIENDLY_CAPTCHA_PROVIDER ||
        challenge.provider === ARKOSE_PROVIDER
      ) {
        handleCaptchaProvider(element, options, challenge);
      }
      if (challenge.provider === ARKOSE_PROVIDER) {
        done(null, {
          triggerCaptcha: function (solvedCallback) {
            globalForCaptchaProvider(challenge.provider).run();
            captchaSolved = solvedCallback;
          }
        });
      } else {
        done();
      }
    });
  }

  function getValue() {
    var captchaInput = element.querySelector('input[name="captcha"]');
    if (!captchaInput) {
      return;
    }
    return captchaInput.value;
  }

  load(callback);

  return {
    reload: load,
    getValue: getValue
  };
}

/**
 *
 * Renders the passwordless captcha challenge in the provided element.
 *
 * @param {Authentication} auth0Client The challenge response from the authentication server
 * @param {HTMLElement} element The element where the captcha needs to be rendered
 * @param {Object} options The configuration options for the captcha
 * @param {Object} [options.templates] An object containing templates for each captcha provider
 * @param {Function} [options.templates.auth0] template function receiving the challenge and returning a string
 * @param {Function} [options.templates.recaptcha_v2] template function receiving the challenge and returning a string
 * @param {Function} [options.templates.recaptcha_enterprise] template function receiving the challenge and returning a string
 * @param {Function} [options.templates.hcaptcha] template function receiving the challenge and returning a string
 * @param {Function} [options.templates.friendly_captcha] template function receiving the challenge and returning a string
 * @param {Function} [options.templates.arkose] template function receiving the challenge and returning a string
 * @param {Function} [options.templates.error] template function returning a custom error message when the challenge could not be fetched, receives the error as first argument
 * @param {String} [options.lang=en] the ISO code of the language for recaptcha
 * @param {Function} [callback] An optional callback called after captcha is loaded
 * @ignore
 */
function renderPasswordless(auth0Client, element, options, callback) {
  options = object.merge(defaults).with(options || {});
  function load(done) {
    done = done || noop;
    auth0Client.passwordless.getChallenge(function (err, challenge) {
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
      if (challenge.provider === AUTH0_PROVIDER) {
        handleAuth0Provider(element, options, challenge, load);
      } else if (
        challenge.provider === RECAPTCHA_V2_PROVIDER ||
        challenge.provider === RECAPTCHA_ENTERPRISE_PROVIDER ||
        challenge.provider === HCAPTCHA_PROVIDER ||
        challenge.provider === FRIENDLY_CAPTCHA_PROVIDER ||
        challenge.provider === ARKOSE_PROVIDER
      ) {
        handleCaptchaProvider(element, options, challenge);
      }
      if (challenge.provider === ARKOSE_PROVIDER) {
        done(null, {
          triggerCaptcha: function (solvedCallback) {
            globalForCaptchaProvider(challenge.provider).run();
            captchaSolved = solvedCallback;
          }
        });
      } else {
        done();
      }
    });
  }

  function getValue() {
    var captchaInput = element.querySelector('input[name="captcha"]');
    if (!captchaInput) {
      return;
    }
    return captchaInput.value;
  }

  load(callback);

  return {
    reload: load,
    getValue: getValue
  };
}

export default { render: render, renderPasswordless: renderPasswordless };
