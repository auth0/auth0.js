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

  [RECAPTCHA_V2_PROVIDER,RECAPTCHA_ENTERPRISE_PROVIDER].forEach(provider => {

    const hostName = () => {
      switch(provider) {
        case RECAPTCHA_V2_PROVIDER: return 'www.google.com';
        case RECAPTCHA_ENTERPRISE_PROVIDER: return 'www.recaptcha.net';
      }
    }

    const pathName = () => {
      switch(provider) {
        case RECAPTCHA_V2_PROVIDER: return '/recaptcha/api.js';
        case RECAPTCHA_ENTERPRISE_PROVIDER: return '/recaptcha/enterprise.js';
      }
    }

    const getScript = () => `https://${hostName()}${pathName()}`;

    const setMockGlobal = (mock) => {
      switch(provider) {
        case RECAPTCHA_V2_PROVIDER: 
          window.grecaptcha = mock;
          break;
        case RECAPTCHA_ENTERPRISE_PROVIDER:
          window.grecaptcha = {enterprise:mock}
      }
    }
    describe(`when challenge is required and provider is ${provider}`, function () {

      const challenge = {
        required: true,
        provider,
        siteKey: 'blabla sitekey'
      };
  
      let c, recaptchaScript, scriptOnLoadCallback, element;
  
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
        recaptchaScript = [...window.document.querySelectorAll('script')].find(s => s.src.match(getScript()));
        scriptOnLoadCallback = window[url.parse(recaptchaScript.src, true).query.onload];
      });
  
      afterEach(function () {
        delete global.window;
      });
  
      it('should inject the recaptcha script', function () {
        expect(recaptchaScript.async).to.be.ok();
        const scriptUrl = url.parse(recaptchaScript.src, true);
        expect(scriptUrl.hostname).to.equal(hostName());
        expect(scriptUrl.pathname).to.equal(pathName());
        expect(scriptUrl.query.hl).to.equal('en');
        expect(scriptUrl.query).to.have.property('onload');
      });
  
      describe('after captcha is loaded', function () {
        let renderOptions;
        let renderElement;
        let reseted = false;
  
        beforeEach(function () {
          reseted = false;      
          setMockGlobal({
            render(element, options) {
              renderElement = element;
              renderOptions = options;
              return 0;
            },
            reset() { reseted = true; }
          });
          scriptOnLoadCallback();
        });
  
        it('should render with the site key', function () {
          expect(renderOptions.sitekey).to.equal(challenge.siteKey);
        });
  
        it('should set the value on the input when the user completes the captcha', function () {
          const mockToken = 'token xxxxxx';
          const input = element.querySelector('input[name="captcha"]');
          renderOptions.callback(mockToken)
          expect(input.value).to.equal(mockToken);
        });
  
  
        it('should return the value when calling getValue()', function () {
          const mockToken = 'token xxxxxx';
          renderOptions.callback(mockToken)
          expect(c.getValue()).to.equal(mockToken);
        });
  
        it('should clean the value when the token expires', function () {
          const input = element.querySelector('input[name="captcha"]');
          input.value = 'expired token';
          renderOptions['expired-callback']()
          expect(input.value).to.equal('');
        });
  
        it('should clean the value when there is an error', function () {
          const input = element.querySelector('input[name="captcha"]');
          input.value = 'expired token';
          renderOptions['error-callback']()
          expect(input.value).to.equal('');
        });
  
        it('should clean the value and reset when reloading', function () {
          const input = element.querySelector('input[name="captcha"]');
          input.value = 'old token';
          c.reload();
          expect(input.value).to.equal('');
          expect(reseted).to.be.ok();
        });
  
      });
    });

  })

});
