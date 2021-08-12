/* eslint-disable no-console, no-unneeded-ternary */

require('@babel/polyfill');
import expect from 'expect.js';
const selenium = require('./selenium');
import { By, authorize, until } from './helper';

selenium.runTests((newSession, browser, done) => {
  describe('redirect authorize', function() {
    this.timeout(9999999);

    after(() => {
      console.log('All done');
      done();
    });

    context(browser, () => {
      // it.only('[token] should result in a successful transaction', async () => {
      //   const session = newSession();
      //   const driver = await session.start();

      //   await driver
      //     .findElement(By.id('login-response-type'))
      //     .sendKeys('token');

      //   await driver
      //     .findElement(By.className('login-redirect-authorize'))
      //     .click();

      //   await driver.wait(until.elementLocated(By.id('hlploaded')), 30000);
      //   await driver.findElement(By.id('email')).sendKeys('johnfoo@gmail.com');
      //   await driver.findElement(By.id('password')).sendKeys('1234');
      //   await driver.findElement(By.id('upLogin')).click();
      //   await driver.wait(until.elementLocated(By.id('parsed')), 10000);

      //   const value = await driver.findElement(By.id('err')).getText();

      //   console.log('ERR:', value ? value : '-empty-');
      //   expect(value).to.equal('');

      //   const result = await driver.findElement(By.id('result')).getText();

      //   console.log('RESULT:', result);
      //   expect(result).to.not.equal('');

      //   const response = JSON.parse(result);

      //   expect(response.accessToken).to.be.ok();
      //   expect(response.idToken).to.not.be.ok();
      //   expect(response.tokenType).to.be.ok();
      //   expect(response.expiresIn).to.be.ok();

      //   session.finish();
      // });

      it.only('[code] should result in a successful transaction', async () => {
        const session = newSession();
        const driver = await session.start();

        await driver.wait(until.elementLocated(By.id('loaded')));
        await driver.findElement(By.id('login-response-type')).sendKeys('code');

        await driver
          .findElement(By.className('login-redirect-authorize'))
          .click();

        await authorize(driver);

        driver.getCurrentUrl().then(function(url) {
          console.log('RESULT URL:', url);
          expect(url).to.contain('code=');
        });

        session.finish();
      });

      /*
      it('[token openid] should result in a successful transaction', function() {
        const session = newSession(this.test.title);
        const driver = session.start();

        driver.findElement(By.id('login-scope')).sendKeys('openid');
        driver.findElement(By.id('login-response-type')).sendKeys('token');
        driver.findElement(By.className('login-redirect-authorize')).click();
        driver.wait(until.elementLocated(By.id('hlploaded')), 30000);
        driver.findElement(By.id('email')).sendKeys('johnfoo@gmail.com');
        driver.findElement(By.id('password')).sendKeys('1234');
        driver.findElement(By.id('upLogin')).click();
        driver.wait(until.elementLocated(By.id('parsed')), 10000);

        driver
          .findElement(By.id('err'))
          .getText()
          .then(function(value) {
            console.log('ERR:', value ? value : '-empty-');
            expect(value).to.equal('');
          });

        driver
          .findElement(By.id('result'))
          .getText()
          .then(function(value) {
            console.log('RESULT:', value);
            expect(value).to.not.equal('');

            const response = JSON.parse(value);

            expect(response.accessToken).to.be.ok();
            expect(response.idToken).to.not.be.ok();
            expect(response.tokenType).to.be.ok();
            expect(response.expiresIn).to.be.ok();
          });

        return session.finish();
      });
      */

      it('[id_token] should result in a successful transaction', function() {
        const session = newSession(this.test.title);
        const driver = session.start();

        driver.findElement(By.id('login-response-type')).sendKeys('id_token');
        driver.findElement(By.className('login-redirect-authorize')).click();
        driver.wait(until.elementLocated(By.id('hlploaded')), 30000);
        driver.findElement(By.id('email')).sendKeys('johnfoo@gmail.com');
        driver.findElement(By.id('password')).sendKeys('1234');
        driver.findElement(By.id('upLogin')).click();
        driver.wait(until.elementLocated(By.id('parsed')), 10000);

        driver
          .findElement(By.id('err'))
          .getText()
          .then(function(value) {
            console.log('ERR:', value ? value : '-empty-');
            expect(value).to.equal('');
          });

        driver
          .findElement(By.id('result'))
          .getText()
          .then(function(value) {
            console.log('RESULT:', value);
            expect(value).to.not.equal('');

            const response = JSON.parse(value);

            expect(response.accessToken).to.not.be.ok();
            expect(response.idToken).to.be.ok();
            expect(response.tokenType).to.not.be.ok();
            expect(response.expiresIn).to.not.be.ok();
          });

        return session.finish();
      });

      it('[token id_token] should result in a successful transaction', function() {
        const session = newSession(this.test.title);
        const driver = session.start();

        driver
          .findElement(By.id('login-response-type'))
          .sendKeys('token id_token');
        driver.findElement(By.className('login-redirect-authorize')).click();
        driver.wait(until.elementLocated(By.id('hlploaded')), 30000);
        driver.findElement(By.id('email')).sendKeys('johnfoo@gmail.com');
        driver.findElement(By.id('password')).sendKeys('1234');
        driver.findElement(By.id('upLogin')).click();
        driver.wait(until.elementLocated(By.id('parsed')), 10000);

        driver
          .findElement(By.id('err'))
          .getText()
          .then(function(value) {
            console.log('ERR:', value ? value : '-empty-');
            expect(value).to.equal('');
          });

        driver
          .findElement(By.id('result'))
          .getText()
          .then(function(value) {
            console.log('RESULT:', value);
            expect(value).to.not.equal('');

            const response = JSON.parse(value);

            expect(response.accessToken).to.be.ok();
            expect(response.idToken).to.be.ok();
            expect(response.tokenType).to.be.ok();
            expect(response.expiresIn).to.be.ok();
          });

        return session.finish();
      });
    });
  });

  run();
});
