var webdriver = require('selenium-webdriver');

var username = process.env.SAUCELABS_USER;
var accessKey = process.env.SAUCELABS_KEY;

var capabilities = [{
  'browserName': 'chrome',
  'platform': 'Windows XP',
  'version': '43.0',
  'username': username,
  'accessKey': accessKey
},
{
  'browserName': 'internet explorer',
  'platform': 'Windows 10',
  'version': '11.00',
  'username': username,
  'accessKey': accessKey
}];

module.exports = {
  runTests: (tests) => {
    capabilities.forEach((capability) => {
      var browser = capability.browserName + ' ' + capability.version + ' ' + capability.platform;

      tests(() => {
          return new webdriver.Builder()
          .withCapabilities(capability)
          .usingServer("http://" + username + ":" + accessKey + "@ondemand.saucelabs.com:80/wd/hub")
          .build();
        },
        webdriver,
        browser,
        capability);
    });
  }
}