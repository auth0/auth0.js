var webdriver = require('selenium-webdriver');

var username = process.env.SAUCELABS_USER;
var accessKey = process.env.SAUCELABS_KEY;

var capabilities = [
  {
    browserName: 'chrome',
    platform: 'Windows 10',
    version: '55.0'
  },
  {
    browserName: 'chrome',
    platform: 'Windows 10',
    version: 'beta'
  },
  {
    browserName: 'firefox',
    platform: 'Windows 10',
    version: '50.0'
  },
  // {
  //   'browserName': 'firefox',
  //   'platform': 'Windows 10',
  //   'version': 'beta'
  // }
  // ,
  // {
  //   'browserName': 'internet explorer',
  //   'platform': 'Windows 7',
  //   'version': '11.0'
  // }
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
  {
    browserName: 'safari',
    platform: 'macOS 10.12',
    version: '10.0'
  }
];

var By = webdriver.By;
var until = webdriver.until;

module.exports = {
  runTests: tests => {
    capabilities.forEach(capability => {
      var browser = capability.browserName + ' ' + capability.version + ' ' + capability.platform;

      tests(name => {
        var driver = new webdriver.Builder()
          .withCapabilities(capability)
          .usingServer('http://' + username + ':' + accessKey + '@ondemand.saucelabs.com:80/wd/hub')
          .build();
        driver.executeScript('sauce:job-name=' + name);
        return {
          start: () => {
            driver.get('https://auth0.github.io/auth0.js/example/test.html');
            driver.wait(until.elementLocated(By.id('loaded')), 10000);
            return driver;
          },
          finish: () => {
            driver.executeScript('sauce:job-result=passed');
            return driver.quit();
          }
        };
      }, browser);
    });
  }
};
