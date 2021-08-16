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
    os: 'Windows',
    os_version: '10',
    browser_version: 'latest'
  },
  {
    browserName: 'firefox',
    os: 'Windows',
    os_version: '10',
    browser_version: 'latest'
  },
  // {
  //   'browserName': 'firefox',
  //   'platform': 'Windows 10',
  //   'version': 'beta'
  // }
  // ,
  {
    browserName: 'internet explorer',
    os: 'Windows',
    os_version: '10',
    browser_version: '11'
  }
  // ,
  // {
  //   'browserName': 'internet explorer',
  //   'platform': 'Windows 7',
  //   'version': '10.0'
  // }
  // ,
  // {
  //   'browserName': 'MicrosoftEdge',
  //   'platform': 'Windows 10',
  //   'version': '13.10586'
  // }
  // ,
  // {
  //   browserName: 'safari',
  //   platform: 'macOS Big Sur',
  //   version: 'latest'
  // }
];

export async function setupDriver(callback) {
  const runTests = (driver, browser) =>
    // eslint-disable-next-line compat/compat
    new Promise(res => {
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

  const builder = new webdriver.Builder();

  if (process.env.BROWSERSTACK === 'true') {
    const bsLocal = new browserstack.Local();

    bsLocal.start(
      { force: 'true', verbose: 'true', localIdentifier: 'auth0jstests' },
      err => {
        if (err) throw err;
        console.log('BrowserStack local started', bsLocal.isRunning());
      }
    );

    await Promise.all(
      capabilities.map(async capability => {
        // Note: this is just for displaying in the console as the tests are running.
        const browser = `${capability.browserName} ${capability.browser_version} ${capability.os} ${capability.os_version}`;

        const driver = await builder
          .withCapabilities({
            ...capability,
            ...commonCapabilities
          })
          .usingServer(server)
          .build();

        await runTests(driver, browser).then(() => {
          driver.quit();
        });
      })
    );

    bsLocal.stop(() => {
      console.log('Stopped BrowserStackLocal');
    });
  } else {
    let browserName = 'Chrome';
    builder.forBrowser('chrome');

    if (process.env.HEADLESS) {
      builder.setChromeOptions(new chrome.Options().headless());
      browserName = 'Chrome Headless';
    }

    const driver = await builder.build();

    await runTests(driver, browserName);
    await driver.quit();
  }
}
