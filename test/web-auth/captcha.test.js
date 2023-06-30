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
        getChallenge: (cb) => cb(null, { required: false })
      }
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
        getChallenge: (cb) => cb(new Error('network error'))
      };
      captcha.render(mockClient, element, {}, callbackStub);
    });

    it('should show the element', function () {
      expect(element.style.display).to.equal('');
    });

    it('should show an error', function () {
      expect(element.querySelector('div.error').innerHTML)
        .to.equal('Error getting the bot detection challenge. Please contact the system administrator.')
    });

    it('should call the optional callback with the error', function () {
      expect(callbackStub.called).to.equal(true)
      expect(callbackStub.args[0][0].message).to.equal('network error')
    });
  });

  describe('when challenge is required and the provider is auth0', function () {
    const { window } = new JSDOM('<body><div class="captcha" style="display: none;" /></body>');
    const element = window.document.querySelector('.captcha');
    const callbackStub = sinon.stub();

    const challenges = [{
      required: true,
      provider: 'auth0',
      image: 'img+svg///image1'
    }, {
      required: true,
      provider: 'auth0',
      image: 'img+svg///image2'
    }];

    let c;

    beforeEach(function () {
      const mockClient = {
        challengeIndex: 0,
        getChallenge(cb) {
          cb(null, challenges[this.challengeIndex++]);
        }
      }
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

    const challenges = [{
      required: true,
      provider: 'auth0',
      image: 'img+svg///image1'
    }, {
      required: true,
      provider: 'auth0',
      image: 'img+svg///image2'
    }];

    beforeEach(function () {
      const mockClient = {
        challengeIndex: 0,
        getChallenge(cb) {
          cb(null, challenges[this.challengeIndex++]);
        }
      }
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
      expect(element.innerHTML).to.equal(`custom template: ${challenges[0].image}`);
    });
  });

  const RECAPTCHA_V2_PROVIDER = 'recaptcha_v2';
  const RECAPTCHA_ENTERPRISE_PROVIDER = 'recaptcha_enterprise';
  const HCAPTCHA_PROVIDER = 'hcaptcha';
  const FRIENDLY_CAPTCHA_PROVIDER = 'friendly_captcha';


  [RECAPTCHA_V2_PROVIDER,RECAPTCHA_ENTERPRISE_PROVIDER, HCAPTCHA_PROVIDER, FRIENDLY_CAPTCHA_PROVIDER].forEach(provider => {
    const getScript = () => {
      switch(provider) {
        case RECAPTCHA_V2_PROVIDER: return 'api.js';
        case HCAPTCHA_PROVIDER: return 'api.js';
        case RECAPTCHA_ENTERPRISE_PROVIDER: return 'enterprise.js';
        case FRIENDLY_CAPTCHA_PROVIDER: return 'widget.min.js';
      }
    }
    const getHostname = () => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER: return 'recaptcha.net';
        case RECAPTCHA_ENTERPRISE_PROVIDER: return 'recaptcha.net';
        case HCAPTCHA_PROVIDER: return 'hcaptcha.com';
        case FRIENDLY_CAPTCHA_PROVIDER: return 'jsdelivr.net';
      }
    }
    const getSubdomain = () => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER: return 'www';
        case RECAPTCHA_ENTERPRISE_PROVIDER: return 'www';
        case HCAPTCHA_PROVIDER: return 'js';
        case FRIENDLY_CAPTCHA_PROVIDER: return 'cdn';
      }
    }
    const getPath = () => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER: return 'recaptcha';
        case RECAPTCHA_ENTERPRISE_PROVIDER: return 'recaptcha';
        case HCAPTCHA_PROVIDER: return '1';
        case FRIENDLY_CAPTCHA_PROVIDER: return 'npm/friendly-challenge@0.9.12'
      }
    }
    const setMockGlobal = (mock) => {
      switch(provider) {
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
      }
    }
    describe(`when challenge is required and provider is ${provider}`, function () {

      const challenge = {
        required: true,
        provider,
        siteKey: 'blabla sitekey'
      };
  
      let c, captchaScript, scriptOnLoadCallback, element;
  
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
        captchaScript = [...window.document.querySelectorAll('script')].find(s => s.src.match(getHostname()));
        scriptOnLoadCallback = window[url.parse(captchaScript.src, true).query.onload];
        if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
          scriptOnLoadCallback = captchaScript.onload;
        }
      });
  
      afterEach(function () {
        delete global.window;
      });
  
      it('should inject the recaptcha script', function () {
        expect(captchaScript.async).to.be.ok();
        const scriptUrl = url.parse(captchaScript.src, true);
        expect(scriptUrl.hostname).to.equal(`${getSubdomain()}.${getHostname()}`);
        expect(scriptUrl.pathname).to.equal(`/${getPath()}/${getScript()}`);
        if (provider !== FRIENDLY_CAPTCHA_PROVIDER) {
          expect(scriptUrl.query.hl).to.equal('en');
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
          }
          setMockGlobal({
            render(element, options) {
              renderElement = element;
              renderOptions = options;
              return 0;
            },
            reset() { resetted = true; },
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
            renderOptions.doneCallback(mockToken)
          } else {
            renderOptions.callback(mockToken)
          }
          expect(input.value).to.equal(mockToken);
        });
  
        it('should return the value when calling getValue()', function () {
          const mockToken = 'token xxxxxx';
          if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
            renderOptions.doneCallback(mockToken)
          } else {
            renderOptions.callback(mockToken)
          }
          expect(c.getValue()).to.equal(mockToken);
        });

        if (provider !== FRIENDLY_CAPTCHA_PROVIDER) {
          it('should clean the value when the token expires', function () {
            const input = element.querySelector('input[name="captcha"]');
            input.value = 'expired token';
            renderOptions['expired-callback']()
            expect(input.value).to.equal('');
          });
          
          it('should clean the value and reset when reloading', function () {
            const input = element.querySelector('input[name="captcha"]');
            input.value = 'old token';
            c.reload();
            expect(input.value).to.equal('');
            expect(resetted).to.be.ok();
          });
        }
  
        it('should clean the value when there is an error', function () {
          const input = element.querySelector('input[name="captcha"]');
          input.value = 'expired token';
          if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
            renderOptions.errorCallback()
          } else {
            renderOptions['error-callback']()
          }          
          expect(input.value).to.equal('');
        });
  
      });
    });

  })

});

describe('passwordless captcha rendering', function () {
  describe('when challenge is not required', function () {
    const { window } = new JSDOM('<body><div class="captcha" /></body>');
    const element = window.document.querySelector('.captcha');
    let c;

    beforeEach(function () {
      const mockClient = {
        passwordless: { getChallenge: (cb) => cb(null, { required: false }) }
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
        passwordless: { getChallenge: (cb) => cb(new Error('network error')) }
      };
      captcha.renderPasswordless(mockClient, element, {}, callbackStub);
    });

    it('should show the element', function () {
      expect(element.style.display).to.equal('');
    });

    it('should show an error', function () {
      expect(element.querySelector('div.error').innerHTML)
        .to.equal('Error getting the bot detection challenge. Please contact the system administrator.')
    });

    it('should call the optional callback with the error', function () {
      expect(callbackStub.called).to.equal(true)
      expect(callbackStub.args[0][0].message).to.equal('network error')
    });
  });

  describe('when challenge is required and the provider is auth0', function () {
    const { window } = new JSDOM('<body><div class="captcha" style="display: none;" /></body>');
    const element = window.document.querySelector('.captcha');
    const callbackStub = sinon.stub();

    const challenges = [{
      required: true,
      provider: 'auth0',
      image: 'img+svg///image1'
    }, {
      required: true,
      provider: 'auth0',
      image: 'img+svg///image2'
    }];

    let c;

    beforeEach(function () {
      const mockClient = {
        challengeIndex: 0,
        passwordless: {
          getChallenge: (cb) => {
            cb(null, challenges[mockClient.challengeIndex++]);
          }
        }
      }
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

    const challenges = [{
      required: true,
      provider: 'auth0',
      image: 'img+svg///image1'
    }, {
      required: true,
      provider: 'auth0',
      image: 'img+svg///image2'
    }];

    beforeEach(function () {
      const mockClient = {
        challengeIndex: 0,
        passwordless: {
          getChallenge: (cb) => {
            cb(null, challenges[mockClient.challengeIndex++]);
          }
        }
      }
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
      expect(element.innerHTML).to.equal(`custom template: ${challenges[0].image}`);
    });
  });

  const RECAPTCHA_V2_PROVIDER = 'recaptcha_v2';
  const RECAPTCHA_ENTERPRISE_PROVIDER = 'recaptcha_enterprise';
  const HCAPTCHA_PROVIDER = 'hcaptcha';
  const FRIENDLY_CAPTCHA_PROVIDER = 'friendly_captcha';

  [RECAPTCHA_V2_PROVIDER,RECAPTCHA_ENTERPRISE_PROVIDER, HCAPTCHA_PROVIDER, FRIENDLY_CAPTCHA_PROVIDER].forEach(provider => {
    const getScript = () => {
      switch(provider) {
        case RECAPTCHA_V2_PROVIDER: return 'api.js';
        case HCAPTCHA_PROVIDER: return 'api.js';
        case RECAPTCHA_ENTERPRISE_PROVIDER: return 'enterprise.js';
        case FRIENDLY_CAPTCHA_PROVIDER: return 'widget.min.js';
      }
    }
    const getHostname = () => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER: return 'recaptcha.net';
        case RECAPTCHA_ENTERPRISE_PROVIDER: return 'recaptcha.net';
        case HCAPTCHA_PROVIDER: return 'hcaptcha.com';
        case FRIENDLY_CAPTCHA_PROVIDER: return 'jsdelivr.net';
      }
    }
    const getSubdomain = () => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER: return 'www';
        case RECAPTCHA_ENTERPRISE_PROVIDER: return 'www';
        case HCAPTCHA_PROVIDER: return 'js';
        case FRIENDLY_CAPTCHA_PROVIDER: return 'cdn';
      }
    }
    const getPath = () => {
      switch (provider) {
        case RECAPTCHA_V2_PROVIDER: return 'recaptcha';
        case RECAPTCHA_ENTERPRISE_PROVIDER: return 'recaptcha';
        case HCAPTCHA_PROVIDER: return '1';
        case FRIENDLY_CAPTCHA_PROVIDER: return 'npm/friendly-challenge@0.9.12';
      }
    }
    const setMockGlobal = (mock) => {
      switch(provider) {
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
      }
    }
    describe(`when challenge is required and provider is ${provider}`, function () {

      const challenge = {
        required: true,
        provider,
        siteKey: 'blabla sitekey'
      };
  
      let c, captchaScript, scriptOnLoadCallback, element;
  
      beforeEach(() => {
        const { window } = new JSDOM('<body><div class="captcha" /></body>');
        element = window.document.querySelector('.captcha');
        global.window = window;
        const mockClient = {
          passwordless: {
            getChallenge: (cb) => {
              cb(null, challenge);
            }
          }
        };
        c = captcha.renderPasswordless(mockClient, element);
        captchaScript = [...window.document.querySelectorAll('script')].find(s => s.src.match(getHostname()));
        scriptOnLoadCallback = window[url.parse(captchaScript.src, true).query.onload];
        if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
          scriptOnLoadCallback = captchaScript.onload;
        }
      });
  
      afterEach(function () {
        delete global.window;
      });
  
      it('should inject the recaptcha script', function () {
        expect(captchaScript.async).to.be.ok();
        const scriptUrl = url.parse(captchaScript.src, true);
        expect(scriptUrl.hostname).to.equal(`${getSubdomain()}.${getHostname()}`);
        expect(scriptUrl.pathname).to.equal(`/${getPath()}/${getScript()}`);
        if (provider !== FRIENDLY_CAPTCHA_PROVIDER) {
          expect(scriptUrl.query.hl).to.equal('en');
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
          }
          setMockGlobal({
            render(element, options) {
              renderElement = element;
              renderOptions = options;
              return 0;
            },
            reset() { resetted = true; },
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
            renderOptions.doneCallback(mockToken)
          } else {
            renderOptions.callback(mockToken)
          }
          expect(input.value).to.equal(mockToken);
        });
  
        it('should return the value when calling getValue()', function () {
          const mockToken = 'token xxxxxx';
          if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
            renderOptions.doneCallback(mockToken)
          } else {
            renderOptions.callback(mockToken)
          }
          expect(c.getValue()).to.equal(mockToken);
        });
  
        if (provider !== FRIENDLY_CAPTCHA_PROVIDER) {
          it('should clean the value when the token expires', function () {
            const input = element.querySelector('input[name="captcha"]');
            input.value = 'expired token';
            renderOptions['expired-callback']()
            expect(input.value).to.equal('');
          });
          
          it('should clean the value and reset when reloading', function () {
            const input = element.querySelector('input[name="captcha"]');
            input.value = 'old token';
            c.reload();
            expect(input.value).to.equal('');
            expect(resetted).to.be.ok();
          });   
        }
  
        it('should clean the value when there is an error', function () {
          const input = element.querySelector('input[name="captcha"]');
          input.value = 'expired token';
          if (provider === FRIENDLY_CAPTCHA_PROVIDER) {
            renderOptions.errorCallback()
          } else {
            renderOptions['error-callback']()
          }  
          expect(input.value).to.equal('');
        });
  
      });
    });

  })

});
