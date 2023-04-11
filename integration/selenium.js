/* eslint-disable no-restricted-syntax */
/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies, no-console */

import webdriver from 'selenium-webdriver';
import browserstack from 'browserstack-local';
import chrome from 'selenium-webdriver/chrome';
import { By, until } from './helper';

const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
const server = `http://${username}:${accessKey}@hub-cloud.browserstack.com/wd/hub`;

const build = process.env.CIRCLECI
  ? `${process.env.CIRCLE_BRANCH} ${process.env.CIRCLE_BUILD_NUM}`
  : 'Local run';

const commonCapabilities = {
  resolution: '1920x1080',
  name: 'Auth0.js Acceptance Test',
  'browserstack.local': 'true',
  project: 'Auth0.js',
  build
};

const capabilities = [
  {
    browserName: 'chrome',
    platform: 'Windows 10',
    browserVersion: 'latest'
  }
  /*{
    browserName: 'firefox',
    os: 'Windows',
    os_version: '10',
    browser_version: 'latest'
  },
  {
    browserName: 'edge',
    os: 'Windows',
    os_version: '10',
    browser_version: 'latest'
  },
  {
    browserName: 'safari',
    os: 'OS X',
    os_version: 'Big Sur',
    browser_version: 'latest'
  },
  {
    browserName: 'internet explorer',
    os: 'Windows',
    os_version: '10',
    browser_version: '11'
  }*/
];

const startBrowserStackLocal = () =>
  // eslint-disable-next-line compat/compat
  new Promise((res, rej) => {
    const bsLocal = new browserstack.Local();

    bsLocal.start({ force: true }, err => {
      if (err) {
        console.log(err);
        return rej(err);
      }
      console.log('BrowserStack local started', bsLocal.isRunning());
      res(bsLocal);
    });
  });

export async function setupDriver(callback) {
  const runTests = (driver, browser) => {
    // eslint-disable-next-line compat/compat
    return new Promise(res => {
      callback(
        () => ({
          start: async () => {
            await driver.get('http://127.0.0.1:3000/test.html');
            await driver.wait(until.elementLocated(By.id('loaded')), 2000);
            return driver;
          }
        }),
        browser,
        res
      );
    });
  };

  const builder = new webdriver.Builder();

  if (process.env.BROWSERSTACK === 'true') {
    const bsLocal = await startBrowserStackLocal();
    const promises = [];

    capabilities.forEach(capability =>
      promises.push(
        new Promise((res, rej) => {
          // Note: this is just for displaying in the console as the tests are running.
          const browser = `${capability.browserName} ${capability.browser_version} ${capability.os} ${capability.os_version}`;

          builder
            .withCapabilities({
              ...capability,
              ...commonCapabilities
            })
            .usingServer(server)
            .build()
            .then(driver => {
              runTests(driver, browser)
                .then(() => {
                  driver.quit();
                  res();
                })
                .catch(err => {
                  console.error(err);
                  driver.quit();
                  rej(err);
                });
            })
            .catch(e => {
              bsLocal.stop(() => console.log('BrowserStack local stopped'));
              throw e;
            });
        })
      )
    );

    try {
      await Promise.all(promises);
    } finally {
      console.log('Stopping');
      bsLocal.stop(() => console.log('BrowserStack local stopped'));
    }
  } else {
    let browserName = 'Chrome';
    builder.forBrowser('chrome');

    if (process.env.HEADLESS) {
      builder.setChromeOptions(new chrome.Options().headless());
      browserName = 'Chrome Headless';
    }

    let driver;
    try {
      driver = await builder.build();
      await runTests(driver, browserName);
      await driver.quit();
    } catch (e) {
      console.log(e);
    } finally {
      driver.quit();
    }
  }
}
