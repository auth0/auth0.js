/* eslint-disable no-console, no-unneeded-ternary */

require('@babel/polyfill');
import expect from 'expect.js';
import { runTests } from './selenium';
import { By, authorize, until, logout } from './helper';

runTests((newSession, browser, done) => {
  describe('redirect authorize', function() {
    this.timeout(9999999);

    after(() => {
      console.log('All done');
      done();
    });

    context(browser, () => {
      it('[code] should result in a successful transaction', async () => {
        const session = newSession();
        const driver = await session.start();

        await driver.wait(until.elementLocated(By.id('loaded')));
        await driver.findElement(By.id('login-response-type')).sendKeys('code');

        await authorize(driver);

        const url = await driver.getCurrentUrl();

        expect(url).to.contain('code=');
        await logout(driver);
      });

      it('[id_token] should result in a successful transaction', async () => {
        const session = newSession();
        const driver = await session.start();

        await driver
          .findElement(By.id('login-response-type'))
          .sendKeys('id_token');

        await authorize(driver);
        await driver.wait(until.elementLocated(By.id('parsed')), 2000);

        const err = await driver.findElement(By.id('err')).getText();

        console.log('ERR:', err ?? '-empty-');
        expect(err).to.equal('');

        const value = await driver.findElement(By.id('result')).getText();
        expect(value).to.not.equal('');

        const response = JSON.parse(value);

        expect(response.accessToken).to.not.be.ok();
        expect(response.idToken).to.be.ok();
        expect(response.tokenType).to.not.be.ok();
        expect(response.expiresIn).to.not.be.ok();

        await logout(driver);
      });

      it('[token id_token] should result in a successful transaction', async () => {
        const session = newSession();
        const driver = await session.start();

        await driver
          .findElement(By.id('login-response-type'))
          .sendKeys('token id_token');

        await authorize(driver);

        const errValue = await driver.findElement(By.id('err')).getText();

        console.log('ERR:', errValue ?? '-empty-');
        expect(errValue).to.equal('');

        const value = await driver.findElement(By.id('result')).getText();

        console.log('RESULT:', value);
        expect(value).to.not.equal('');

        const response = JSON.parse(value);

        expect(response.accessToken).to.be.ok();
        expect(response.idToken).to.be.ok();
        expect(response.tokenType).to.be.ok();
        expect(response.expiresIn).to.be.ok();
        await logout(driver);
      });
    });
  });

  run();
});
