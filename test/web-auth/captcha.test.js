import { JSDOM } from 'jsdom';
import url from 'url';
import sinon from 'sinon';
import captcha from '../../src/web-auth/captcha';
import expect from 'expect.js';

describe('captcha rendering', function () {
  describe('when challenge is not required', function () {
    const { window } = new JSDOM('<body><div class="captcha" /></body>');
    const element = window.document.querySelector('.captcha');
    let c;

    beforeEach(function () {
      const mockClient = {
        getChallenge: cb => cb(null, { required: false })
      };
      c = captcha.render(mockClient, element);
    });

    it('should hide the element', function () {
      expect(element.style.display).to.equal('none');
    });

    it('should clean the innerHTML', function () {
      expect(element.innerHTML).to.equal('');
    });

    it('should return undefined when calling getValue', function () {
      expect(c.getValue()).to.be.equal(undefined);
    });
  });

  describe('when challenge request fail', function () {
    const { window } = new JSDOM('<body><div class="captcha" /></body>');
    const element = window.document.querySelector('.captcha');
    const callbackStub = sinon.stub();

    beforeEach(function () {
      const mockClient = {
        getChallenge: cb => cb(new Error('network error'))
      };
      captcha.render(mockClient, element, {}, callbackStub);
    });

    it('should show the element', function () {
      expect(element.style.display).to.equal('');
    });

    it('should show an error', function () {
      expect(element.querySelector('div.error').innerHTML).to.equal(
        'Error getting the bot detection challenge. Please contact the system administrator.'
      );
    });

    it('should call the optional callback with the error', function () {
      expect(callbackStub.called).to.equal(true);
      expect(callbackStub.args[0][0].message).to.equal('network error');
    });
  });

  describe('when challenge is required and the provider is auth0', function () {
    const { window } = new JSDOM(
      '<body><div class="captcha" style="display: none;" /></body>'
    );
    const element = window.document.querySelector('.captcha');
    const callbackStub = sinon.stub();

    const challenges = [
      {
        required: true,
        provider: 'auth0',
        image: 'img+svg///image1'
      },
      {
        required: true,
        provider: 'auth0',
        image: 'img+svg///image2'
      }
    ];

    let c;

    beforeEach(function () {
      const mockClient = {
        challengeIndex: 0,
        getChallenge(cb) {
          cb(null, challenges[this.challengeIndex++]);
        }
      };
      c = captcha.render(mockClient, element, {}, callbackStub);
    });

    it('should call the optional callback', function () {
      expect(callbackStub.called).to.be.ok();
      expect(callbackStub.args[0]).to.be.empty();
    });

    it('should show the element', function () {
      expect(element.style.display).to.equal('');
    });

    it('should set the image tag', function () {
      const imgEl = element.querySelector('img');
      expect(imgEl.src).to.equal(challenges[0].image);
    });

    it('should contain an input tag with name captcha', function () {
      const inputEl = element.querySelector('input[name="captcha"]');
      expect(inputEl).to.be.ok();
      expect(inputEl.type).to.contain('text');
    });

    it('should return the user input when calling getValue()', function () {
      const inputEl = element.querySelector('input[name="captcha"]');
      inputEl.value = 'foobar';
      expect(c.getValue()).to.equal('foobar');
    });

    it('should load a new image when clicking the reload button', function () {
      const btn = element.querySelector('button.captcha-reload');
      btn.click();
      const imgEl = element.querySelector('img');
      expect(imgEl.src).to.equal(challenges[1].image);
    });

    it('should load a new image when calling the reload method', function () {
      c.reload();
      const imgEl = element.querySelector('img');
      expect(imgEl.src).to.equal(challenges[1].image);
    });
  });

  describe('when challenge is required, the provider is auth0 and we use a custom template', function () {
    const button = {
      listeners: {},
      addEventListener(event, handler) {
        this.listeners[event] = handler;
      }
    };

    const element = {
      style: {},
      display: 'none',
      querySelector(selector) {
        switch (selector) {
          case '.captcha-reload':
            return button;
        }
      }
    };

    const challenges = [
      {
        required: true,
        provider: 'auth0',
        image: 'img+svg///image1'
      },
      {
        required: true,
        provider: 'auth0',
        image: 'img+svg///image2'
      }
    ];

    beforeEach(function () {
      const mockClient = {
        challengeIndex: 0,
        getChallenge(cb) {
          cb(null, challenges[this.challengeIndex++]);
        }
      };
      captcha.render(mockClient, element, {
        templates: {
          auth0: challenge => `custom template: ${challenge.image}`
        }
      });
    });

    it('should show the element', function () {
      expect(element.style.display).to.equal('');
    });

    it('should set the image tag', function () {
      expect(element.innerHTML).to.equal(
        `custom template: ${challenges[0].image}`
      );
    });
  });

  const RECAPTCHA_V2_PROVIDER = 'recaptcha_v2';
  const RECAPTCHA_ENTERPRISE_PROVIDER = 'recaptcha_enterprise';
  const HCAPTCHA_PROVIDER = 'hcaptcha';
  const FRIENDLY_CAPTCHA_PROVIDER = 'friendly_captcha';
  const ARKOSE_PROVIDER = 'arkose';
  const AUTH0_V2_CAPTCHA_PROVIDER = 'auth0_v2';

  [
    RECAPTCHA_V2_PROVIDER,
    RECAPTCHA_ENTERPRISE_PROVIDER,
    HCAPTCHA_PROVIDER,
    FRIENDLY_CAPTCHA_PROVIDER,
    AUTH0_V2_CAPTCHA_PROVIDER
  ].forEach(provider => {
    const getScript = () => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER:
          return 'api.js';
        case HCAPTCHA_PROVIDER:
          return 'api.js';
        case RECAPTCHA_ENTERPRISE_PROVIDER:
          return 'enterprise.js';
        case FRIENDLY_CAPTCHA_PROVIDER:
          return 'widget.min.js';
        case AUTH0_V2_CAPTCHA_PROVIDER:
          return 'api.js';
      }
    };
    const getHostname = () => {
      const hosts = {
        [RECAPTCHA_V2_PROVIDER]: 'recaptcha.net',
        [RECAPTCHA_ENTERPRISE_PROVIDER]: 'recaptcha.net',
        [HCAPTCHA_PROVIDER]: 'hcaptcha.com',
        [FRIENDLY_CAPTCHA_PROVIDER]: 'jsdelivr.net',
        [AUTH0_V2_CAPTCHA_PROVIDER]: 'cloudflare.com'
      };
      return hosts[provider];
    };
    const getSubdomain = () => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER:
          return 'www';
        case RECAPTCHA_ENTERPRISE_PROVIDER:
          return 'www';
        case HCAPTCHA_PROVIDER:
          return 'js';
        case FRIENDLY_CAPTCHA_PROVIDER:
          return 'cdn';
        case AUTH0_V2_CAPTCHA_PROVIDER:
          return 'challenges';
      }
    };
    const getPath = () => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER:
          return 'recaptcha';
        case RECAPTCHA_ENTERPRISE_PROVIDER:
          return 'recaptcha';
        case HCAPTCHA_PROVIDER:
          return '1';
        case FRIENDLY_CAPTCHA_PROVIDER:
          return 'npm/friendly-challenge@0.9.12';
        case AUTH0_V2_CAPTCHA_PROVIDER:
          return 'turnstile/v0';
      }
    };
    const setMockGlobal = mock => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER:
          window.grecaptcha = mock;
          break;
        case RECAPTCHA_ENTERPRISE_PROVIDER:
          window.grecaptcha = { enterprise: mock };
          break;
        case HCAPTCHA_PROVIDER:
          window.hcaptcha = mock;
          break;
        case FRIENDLY_CAPTCHA_PROVIDER:
          window.friendlyChallenge = mock;
          break;
        case AUTH0_V2_CAPTCHA_PROVIDER:
          window.turnstile = mock;
          break;
      }
    };
    describe(`when challenge is required and provider is ${provider}`, function () {
      const challenge = {
        required: true,
        provider,
        siteKey: 'blabla sitekey'
      };

      let c, captchaScript, scriptOnLoadCallback, scriptErrorCallback, element;

      beforeEach(() => {
        const { window } = new JSDOM('<body><div class="captcha" /></body>');
        element = window.document.querySelector('.captcha');
        global.window = window;
        const mockClient = {
          getChallenge(cb) {
            cb(null, challenge);
          }
        };
        c = captcha.render(mockClient, element);
        captchaScript = [...window.document.querySelectorAll('script')].find(
          s => s.src.match(getHostname())
        );
        scriptOnLoadCallback =
          window[url.parse(captchaScript.src, true).query.onload];
        if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
          scriptOnLoadCallback = captchaScript.onload;
        }
        scriptErrorCallback = captchaScript['error-callback'];
      });

      afterEach(function () {
        delete global.window;
      });

      it('should inject the captcha script', function () {
        expect(captchaScript.async).to.be.ok();
        const scriptUrl = url.parse(captchaScript.src, true);
        expect(scriptUrl.hostname).to.equal(
          `${getSubdomain()}.${getHostname()}`
        );
        expect(scriptUrl.pathname).to.equal(`/${getPath()}/${getScript()}`);
        if (
          provider !== FRIENDLY_CAPTCHA_PROVIDER &&
          provider !== AUTH0_V2_CAPTCHA_PROVIDER
        ) {
          expect(scriptUrl.query.hl).to.equal('en');
        }
        if (provider !== FRIENDLY_CAPTCHA_PROVIDER) {
          expect(scriptUrl.query).to.have.property('onload');
        }
      });

      describe('after captcha is loaded', function () {
        let renderOptions;
        let renderElement;
        let resetted = false;

        beforeEach(function () {
          resetted = false;
          class fcWidget {
            constructor(element, options) {
              renderOptions = options;
              renderElement = element;
            }
            reset() {
              resetted = true;
            }
          }
          setMockGlobal({
            render(element, options) {
              renderElement = element;
              renderOptions = options;
              return 0;
            },
            reset() {
              resetted = true;
            },
            WidgetInstance: fcWidget
          });
          scriptOnLoadCallback();
        });

        it('should render with the site key', function () {
          expect(renderOptions.sitekey).to.equal(challenge.siteKey);
        });

        it('should set the value on the input when the user completes the captcha', function () {
          const mockToken = 'token xxxxxx';
          const input = element.querySelector('input[name="captcha"]');
          if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
            renderOptions.doneCallback(mockToken);
          } else {
            renderOptions.callback(mockToken);
          }
          expect(input.value).to.equal(mockToken);
        });

        it('should return the value when calling getValue()', function () {
          const mockToken = 'token xxxxxx';
          if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
            renderOptions.doneCallback(mockToken);
          } else {
            renderOptions.callback(mockToken);
          }
          expect(c.getValue()).to.equal(mockToken);
        });

        if (provider !== FRIENDLY_CAPTCHA_PROVIDER) {
          it('should clean the value when the token expires', function () {
            const input = element.querySelector('input[name="captcha"]');
            input.value = 'expired token';
            renderOptions['expired-callback']();
            expect(input.value).to.equal('');
          });
        }

        if (provider === AUTH0_V2_CAPTCHA_PROVIDER) {
          it('should remove script and set bypass token after more than 3 errors vvs', function () {
            const input = element.querySelector('input[name="captcha"]');
            input.value = '';
            for (let i = 0; i < 4; i++) {
              scriptErrorCallback();
            }
            expect(
              [...window.document.querySelectorAll('script')].find(s =>
                s.src.match('cloudflare.com')
              )
            ).to.equal(undefined);
            expect(input.value).to.equal('BYPASS_CAPTCHA');
          });
        }

        it('should clean the value and reset when reloading', function () {
          const input = element.querySelector('input[name="captcha"]');
          input.value = 'old token';
          c.reload();
          expect(input.value).to.equal('');
          expect(resetted).to.be.ok();
        });

        it('should clean the value when there is an error', function () {
          const input = element.querySelector('input[name="captcha"]');
          input.value = 'expired token';
          if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
            renderOptions.errorCallback();
          } else {
            renderOptions['error-callback']();
          }
          expect(input.value).to.equal('');
        });
      });
    });
  });

  describe(`when challenge is required and provider is ${ARKOSE_PROVIDER}`, function () {
    const challenge = {
      required: true,
      provider: ARKOSE_PROVIDER,
      siteKey: '1234',
      clientSubdomain: 'client-api'
    };

    let c,
      captchaScript,
      arkoseCallback,
      scriptErrorCallback,
      doneCallback,
      triggerCaptcha,
      arkose,
      element;
    beforeEach(() => {
      const { window } = new JSDOM('<body><div class="captcha" /></body>');
      element = window.document.querySelector('.captcha');
      global.window = window;
      const mockClient = {
        getChallenge(cb) {
          cb(null, challenge);
        }
      };
      doneCallback = (err, apis) => {
        triggerCaptcha = apis.triggerCaptcha;
      };
      c = captcha.render(mockClient, element, null, doneCallback);
      captchaScript = [...window.document.querySelectorAll('script')].find(s =>
        s.src.match('arkoselabs.com')
      );
      arkoseCallback = window[captchaScript.getAttribute('data-callback')];
      scriptErrorCallback = captchaScript.onerror;
    });

    afterEach(function () {
      delete global.window;
    });

    it('should inject the captcha script with callback', function () {
      expect(captchaScript.async).to.be.ok();
      const scriptUrl = url.parse(captchaScript.src, true);
      expect(scriptUrl.hostname).to.equal(
        `${challenge.clientSubdomain}.${'arkoselabs.com'}`
      );
      expect(scriptUrl.pathname).to.equal(
        `/${'v2'}/${challenge.siteKey}/${'api.js'}`
      );
      expect(arkoseCallback).to.be.a('function');
      expect(triggerCaptcha).to.be.a('function');
    });

    it('should reinject the captcha script on error', function () {
      expect(scriptErrorCallback).to.be.a('function');
      scriptErrorCallback();
      captchaScript = [...window.document.querySelectorAll('script')].find(s =>
        s.src.match('arkoselabs.com')
      );
      const scriptUrl = url.parse(captchaScript.src, true);
      expect(scriptUrl.hostname).to.equal(
        `${challenge.clientSubdomain}.${'arkoselabs.com'}`
      );
      expect(scriptUrl.pathname).to.equal(
        `/${'v2'}/${challenge.siteKey}/${'api.js'}`
      );
    });

    it('should remove script and set bypass token after more than 3 errors', function () {
      const input = element.querySelector('input[name="captcha"]');
      input.value = '';
      for (let i = 0; i < 4; i++) {
        scriptErrorCallback();
      }
      expect(
        [...window.document.querySelectorAll('script')].find(s =>
          s.src.match('arkoselabs.com')
        )
      ).to.equal(undefined);
      expect(input.value).to.not.equal('');
    });

    describe('after captcha is loaded', function () {
      let configOptions, setConfigSpy, runSpy, resetSpy;
      this.beforeEach(function () {
        arkose = {
          run() {},
          reset() {},
          setConfig(options) {
            configOptions = options;
          }
        };
        setConfigSpy = sinon.spy(arkose, 'setConfig');
        runSpy = sinon.spy(arkose, 'run');
        resetSpy = sinon.spy(arkose, 'reset');
        arkoseCallback(arkose);
      });

      it('should setup captcha config', function () {
        expect(setConfigSpy.calledOnce).to.be.ok();
        expect(configOptions).to.have.property('onCompleted');
        expect(configOptions).to.have.property('onError');
      });

      it('should set the value on the input when the user completes the captcha', function () {
        const mockToken = 'token xxxxxx';
        const input = element.querySelector('input[name="captcha"]');
        configOptions.onCompleted({ token: mockToken });
        expect(input.value).to.equal(mockToken);
      });

      it('should return the value when calling getValue()', function () {
        const mockToken = 'token xxxxxx';
        configOptions.onCompleted({ token: mockToken });
        expect(c.getValue()).to.equal(mockToken);
      });

      it('should clean the value and reset when reloading', function () {
        const input = element.querySelector('input[name="captcha"]');
        input.value = 'old token';
        c.reload();
        expect(input.value).to.equal('');
      });

      it('should clean the value when there is an error and reset arkose', function () {
        const clock = sinon.useFakeTimers();
        const input = element.querySelector('input[name="captcha"]');
        input.value = 'old token';
        configOptions.onError({ error: 'error' });
        clock.tick(1000);
        expect(input.value).to.equal('');
        expect(resetSpy.calledOnce).to.be.ok();
        expect(runSpy.calledOnce).to.be.ok();
      });

      it('should set bypass token after more than 3 errors', function () {
        const input = element.querySelector('input[name="captcha"]');
        input.value = '';
        for (let i = 0; i < 4; i++) {
          configOptions.onError({ error: 'error' });
        }
        expect(input.value).to.not.equal('');
      });

      it('should run arkose when calling function passed by the done callback', function () {
        triggerCaptcha();
        expect(runSpy.calledOnce).to.be.ok();
      });

      it('should call callback when the user completes the captcha', function () {
        let called = false;
        triggerCaptcha(function () {
          called = true;
        });
        configOptions.onCompleted({ token: 'token' });
        expect(called).to.be.ok();
      });
    });
  });
});

describe('passwordless captcha rendering', function () {
  describe('when challenge is not required', function () {
    const { window } = new JSDOM('<body><div class="captcha" /></body>');
    const element = window.document.querySelector('.captcha');
    let c;

    beforeEach(function () {
      const mockClient = {
        passwordless: { getChallenge: cb => cb(null, { required: false }) }
      };
      c = captcha.renderPasswordless(mockClient, element);
    });

    it('should hide the element', function () {
      expect(element.style.display).to.equal('none');
    });

    it('should clean the innerHTML', function () {
      expect(element.innerHTML).to.equal('');
    });

    it('should return undefined when calling getValue', function () {
      expect(c.getValue()).to.be.equal(undefined);
    });
  });

  describe('when challenge request fail', function () {
    const { window } = new JSDOM('<body><div class="captcha" /></body>');
    const element = window.document.querySelector('.captcha');
    const callbackStub = sinon.stub();

    beforeEach(function () {
      const mockClient = {
        passwordless: { getChallenge: cb => cb(new Error('network error')) }
      };
      captcha.renderPasswordless(mockClient, element, {}, callbackStub);
    });

    it('should show the element', function () {
      expect(element.style.display).to.equal('');
    });

    it('should show an error', function () {
      expect(element.querySelector('div.error').innerHTML).to.equal(
        'Error getting the bot detection challenge. Please contact the system administrator.'
      );
    });

    it('should call the optional callback with the error', function () {
      expect(callbackStub.called).to.equal(true);
      expect(callbackStub.args[0][0].message).to.equal('network error');
    });
  });

  describe('when challenge is required and the provider is auth0', function () {
    const { window } = new JSDOM(
      '<body><div class="captcha" style="display: none;" /></body>'
    );
    const element = window.document.querySelector('.captcha');
    const callbackStub = sinon.stub();

    const challenges = [
      {
        required: true,
        provider: 'auth0',
        image: 'img+svg///image1'
      },
      {
        required: true,
        provider: 'auth0',
        image: 'img+svg///image2'
      }
    ];

    let c;

    beforeEach(function () {
      const mockClient = {
        challengeIndex: 0,
        passwordless: {
          getChallenge: cb => {
            cb(null, challenges[mockClient.challengeIndex++]);
          }
        }
      };
      c = captcha.renderPasswordless(mockClient, element, {}, callbackStub);
    });

    it('should call the optional callback', function () {
      expect(callbackStub.called).to.be.ok();
      expect(callbackStub.args[0]).to.be.empty();
    });

    it('should show the element', function () {
      expect(element.style.display).to.equal('');
    });

    it('should set the image tag', function () {
      const imgEl = element.querySelector('img');
      expect(imgEl.src).to.equal(challenges[0].image);
    });

    it('should contain an input tag with name captcha', function () {
      const inputEl = element.querySelector('input[name="captcha"]');
      expect(inputEl).to.be.ok();
      expect(inputEl.type).to.contain('text');
    });

    it('should return the user input when calling getValue()', function () {
      const inputEl = element.querySelector('input[name="captcha"]');
      inputEl.value = 'foobar';
      expect(c.getValue()).to.equal('foobar');
    });

    it('should load a new image when clicking the reload button', function () {
      const btn = element.querySelector('button.captcha-reload');
      btn.click();
      const imgEl = element.querySelector('img');
      expect(imgEl.src).to.equal(challenges[1].image);
    });

    it('should load a new image when calling the reload method', function () {
      c.reload();
      const imgEl = element.querySelector('img');
      expect(imgEl.src).to.equal(challenges[1].image);
    });
  });

  describe('when challenge is required, the provider is auth0 and we use a custom template', function () {
    const button = {
      listeners: {},
      addEventListener(event, handler) {
        this.listeners[event] = handler;
      }
    };

    const element = {
      style: {},
      display: 'none',
      querySelector(selector) {
        switch (selector) {
          case '.captcha-reload':
            return button;
        }
      }
    };

    const challenges = [
      {
        required: true,
        provider: 'auth0',
        image: 'img+svg///image1'
      },
      {
        required: true,
        provider: 'auth0',
        image: 'img+svg///image2'
      }
    ];

    beforeEach(function () {
      const mockClient = {
        challengeIndex: 0,
        passwordless: {
          getChallenge: cb => {
            cb(null, challenges[mockClient.challengeIndex++]);
          }
        }
      };
      captcha.renderPasswordless(mockClient, element, {
        templates: {
          auth0: challenge => `custom template: ${challenge.image}`
        }
      });
    });

    it('should show the element', function () {
      expect(element.style.display).to.equal('');
    });

    it('should set the image tag', function () {
      expect(element.innerHTML).to.equal(
        `custom template: ${challenges[0].image}`
      );
    });
  });

  const RECAPTCHA_V2_PROVIDER = 'recaptcha_v2';
  const RECAPTCHA_ENTERPRISE_PROVIDER = 'recaptcha_enterprise';
  const HCAPTCHA_PROVIDER = 'hcaptcha';
  const FRIENDLY_CAPTCHA_PROVIDER = 'friendly_captcha';
  const ARKOSE_PROVIDER = 'arkose';
  const AUTH0_V2_CAPTCHA_PROVIDER = 'auth0_v2';

  [
    RECAPTCHA_V2_PROVIDER,
    RECAPTCHA_ENTERPRISE_PROVIDER,
    HCAPTCHA_PROVIDER,
    FRIENDLY_CAPTCHA_PROVIDER,
    AUTH0_V2_CAPTCHA_PROVIDER
  ].forEach(provider => {
    const getScript = () => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER:
          return 'api.js';
        case HCAPTCHA_PROVIDER:
          return 'api.js';
        case RECAPTCHA_ENTERPRISE_PROVIDER:
          return 'enterprise.js';
        case FRIENDLY_CAPTCHA_PROVIDER:
          return 'widget.min.js';
        case AUTH0_V2_CAPTCHA_PROVIDER:
          return 'api.js';
      }
    };
    const getHostname = () => {
      const hosts = {
        [RECAPTCHA_V2_PROVIDER]: 'recaptcha.net',
        [RECAPTCHA_ENTERPRISE_PROVIDER]: 'recaptcha.net',
        [HCAPTCHA_PROVIDER]: 'hcaptcha.com',
        [FRIENDLY_CAPTCHA_PROVIDER]: 'jsdelivr.net',
        [AUTH0_V2_CAPTCHA_PROVIDER]: 'cloudflare.com'
      };
      return hosts[provider];
    };
    const getSubdomain = () => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER:
          return 'www';
        case RECAPTCHA_ENTERPRISE_PROVIDER:
          return 'www';
        case HCAPTCHA_PROVIDER:
          return 'js';
        case FRIENDLY_CAPTCHA_PROVIDER:
          return 'cdn';
        case AUTH0_V2_CAPTCHA_PROVIDER:
          return 'challenges';
      }
    };
    const getPath = () => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER:
          return 'recaptcha';
        case RECAPTCHA_ENTERPRISE_PROVIDER:
          return 'recaptcha';
        case HCAPTCHA_PROVIDER:
          return '1';
        case FRIENDLY_CAPTCHA_PROVIDER:
          return 'npm/friendly-challenge@0.9.12';
        case AUTH0_V2_CAPTCHA_PROVIDER:
          return 'turnstile/v0';
      }
    };
    const setMockGlobal = mock => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER:
          window.grecaptcha = mock;
          break;
        case RECAPTCHA_ENTERPRISE_PROVIDER:
          window.grecaptcha = { enterprise: mock };
          break;
        case HCAPTCHA_PROVIDER:
          window.hcaptcha = mock;
          break;
        case FRIENDLY_CAPTCHA_PROVIDER:
          window.friendlyChallenge = mock;
          break;
        case AUTH0_V2_CAPTCHA_PROVIDER:
          window.turnstile = mock;
          break;
      }
    };
    describe(`when challenge is required and provider is ${provider}`, function () {
      const challenge = {
        required: true,
        provider,
        siteKey: 'blabla sitekey'
      };

      let c, captchaScript, scriptOnLoadCallback, scriptErrorCallback, element;

      beforeEach(() => {
        const { window } = new JSDOM('<body><div class="captcha" /></body>');
        element = window.document.querySelector('.captcha');
        global.window = window;
        const mockClient = {
          passwordless: {
            getChallenge: cb => {
              cb(null, challenge);
            }
          }
        };
        c = captcha.renderPasswordless(mockClient, element);
        captchaScript = [...window.document.querySelectorAll('script')].find(
          s => s.src.match(getHostname())
        );
        scriptOnLoadCallback =
          window[url.parse(captchaScript.src, true).query.onload];
        if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
          scriptOnLoadCallback = captchaScript.onload;
        }
        scriptErrorCallback = captchaScript['error-callback'];
      });

      afterEach(function () {
        delete global.window;
      });

      it('should inject the captcha script', function () {
        expect(captchaScript.async).to.be.ok();
        const scriptUrl = url.parse(captchaScript.src, true);
        expect(scriptUrl.hostname).to.equal(
          `${getSubdomain()}.${getHostname()}`
        );
        expect(scriptUrl.pathname).to.equal(`/${getPath()}/${getScript()}`);
        if (
          provider !== FRIENDLY_CAPTCHA_PROVIDER &&
          provider !== AUTH0_V2_CAPTCHA_PROVIDER
        ) {
          expect(scriptUrl.query.hl).to.equal('en');
        }
        if (provider !== FRIENDLY_CAPTCHA_PROVIDER) {
          expect(scriptUrl.query).to.have.property('onload');
        }
      });

      describe('after captcha is loaded', function () {
        let renderOptions;
        let renderElement;
        let resetted = false;

        beforeEach(function () {
          resetted = false;
          class fcWidget {
            constructor(element, options) {
              renderOptions = options;
              renderElement = element;
            }
            reset() {
              resetted = true;
            }
          }
          setMockGlobal({
            render(element, options) {
              renderElement = element;
              renderOptions = options;
              return 0;
            },
            reset() {
              resetted = true;
            },
            WidgetInstance: fcWidget
          });
          scriptOnLoadCallback();
        });

        it('should render with the site key', function () {
          expect(renderOptions.sitekey).to.equal(challenge.siteKey);
        });

        it('should set the value on the input when the user completes the captcha', function () {
          const mockToken = 'token xxxxxx';
          const input = element.querySelector('input[name="captcha"]');
          if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
            renderOptions.doneCallback(mockToken);
          } else {
            renderOptions.callback(mockToken);
          }
          expect(input.value).to.equal(mockToken);
        });

        it('should return the value when calling getValue()', function () {
          const mockToken = 'token xxxxxx';
          if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
            renderOptions.doneCallback(mockToken);
          } else {
            renderOptions.callback(mockToken);
          }
          expect(c.getValue()).to.equal(mockToken);
        });

        if (provider !== FRIENDLY_CAPTCHA_PROVIDER) {
          it('should clean the value when the token expires', function () {
            const input = element.querySelector('input[name="captcha"]');
            input.value = 'expired token';
            renderOptions['expired-callback']();
            expect(input.value).to.equal('');
          });
        }

        it('should clean the value and reset when reloading', function () {
          const input = element.querySelector('input[name="captcha"]');
          input.value = 'old token';
          c.reload();
          expect(input.value).to.equal('');
          expect(resetted).to.be.ok();
        });

        if (provider === AUTH0_V2_CAPTCHA_PROVIDER) {
          it('should remove script and set bypass token after more than 3 errors vvs', function () {
            const input = element.querySelector('input[name="captcha"]');
            input.value = '';
            for (let i = 0; i < 4; i++) {
              scriptErrorCallback();
            }
            expect(
              [...window.document.querySelectorAll('script')].find(s =>
                s.src.match('cloudflare.com')
              )
            ).to.equal(undefined);
            expect(input.value).to.equal('BYPASS_CAPTCHA');
          });
        }

        it('should clean the value when there is an error', function () {
          const input = element.querySelector('input[name="captcha"]');
          input.value = 'expired token';
          if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
            renderOptions.errorCallback();
          } else {
            renderOptions['error-callback']();
          }
          expect(input.value).to.equal('');
        });
      });
    });
  });

  describe(`when challenge is required and provider is ${ARKOSE_PROVIDER}`, function () {
    const challenge = {
      required: true,
      provider: ARKOSE_PROVIDER,
      siteKey: '1234',
      clientSubdomain: 'client-api'
    };

    let c,
      captchaScript,
      arkoseCallback,
      doneCallback,
      triggerCaptcha,
      arkose,
      element;
    beforeEach(() => {
      const { window } = new JSDOM('<body><div class="captcha" /></body>');
      element = window.document.querySelector('.captcha');
      global.window = window;
      const mockClient = {
        passwordless: {
          getChallenge(cb) {
            cb(null, challenge);
          }
        }
      };
      doneCallback = (err, apis) => {
        triggerCaptcha = apis.triggerCaptcha;
      };
      c = captcha.renderPasswordless(mockClient, element, null, doneCallback);
      captchaScript = [...window.document.querySelectorAll('script')].find(s =>
        s.src.match('arkoselabs.com')
      );
      arkoseCallback = window[captchaScript.getAttribute('data-callback')];
    });

    afterEach(function () {
      delete global.window;
    });

    it('should inject the captcha script with callback', function () {
      expect(captchaScript.async).to.be.ok();
      const scriptUrl = url.parse(captchaScript.src, true);
      expect(scriptUrl.hostname).to.equal(
        `${challenge.clientSubdomain}.${'arkoselabs.com'}`
      );
      expect(scriptUrl.pathname).to.equal(
        `/${'v2'}/${challenge.siteKey}/${'api.js'}`
      );
      expect(arkoseCallback).to.be.a('function');
      expect(triggerCaptcha).to.be.a('function');
    });

    describe('after captcha is loaded', function () {
      let configOptions, setConfigSpy, runSpy, resetSpy;
      this.beforeEach(function () {
        arkose = {
          run() {},
          reset() {},
          setConfig(options) {
            configOptions = options;
          }
        };
        setConfigSpy = sinon.spy(arkose, 'setConfig');
        runSpy = sinon.spy(arkose, 'run');
        resetSpy = sinon.spy(arkose, 'reset');
        arkoseCallback(arkose);
      });

      it('should setup captcha config', function () {
        expect(setConfigSpy.calledOnce).to.be.ok();
        expect(configOptions).to.have.property('onCompleted');
        expect(configOptions).to.have.property('onError');
      });

      it('should set the value on the input when the user completes the captcha', function () {
        const mockToken = 'token xxxxxx';
        const input = element.querySelector('input[name="captcha"]');
        configOptions.onCompleted({ token: mockToken });
        expect(input.value).to.equal(mockToken);
      });

      it('should return the value when calling getValue()', function () {
        const mockToken = 'token xxxxxx';
        configOptions.onCompleted({ token: mockToken });
        expect(c.getValue()).to.equal(mockToken);
      });

      it('should clean the value and reset when reloading', function () {
        const input = element.querySelector('input[name="captcha"]');
        input.value = 'old token';
        c.reload();
        expect(input.value).to.equal('');
      });

      it('should clean the value when there is an error and reset arkose', function () {
        const clock = sinon.useFakeTimers();
        const input = element.querySelector('input[name="captcha"]');
        input.value = 'old token';
        configOptions.onError({ error: 'error' });
        clock.tick(1000);
        expect(input.value).to.equal('');
        expect(resetSpy.calledOnce).to.be.ok();
        expect(runSpy.calledOnce).to.be.ok();
      });

      it('should set bypass token after more than 3 errors', function () {
        const input = element.querySelector('input[name="captcha"]');
        input.value = '';
        for (let i = 0; i < 4; i++) {
          configOptions.onError({ error: 'error' });
        }
        expect(input.value).to.not.equal('');
      });

      it('should run arkose when calling function passed by the done callback', function () {
        triggerCaptcha();
        expect(runSpy.calledOnce).to.be.ok();
      });

      it('should call callback when the user completes the captcha', function () {
        let called = false;
        triggerCaptcha(function () {
          called = true;
        });
        configOptions.onCompleted({ token: 'token' });
        expect(called).to.be.ok();
      });
    });
  });
});
