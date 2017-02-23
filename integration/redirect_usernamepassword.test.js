var expect = require('expect.js');
var selenium = require('./selenium');

describe('redirect usernamepassword', function () {
  this.timeout(9999999);

  selenium.runTests((clientFactory, webdriver, browser) => {
    var By = webdriver.By;
    var until = webdriver.until;

    it('should result in a successful transaction ' + browser, function () {
      var driver = clientFactory();

      driver.get('https://auth0.github.io/auth0.js/example/test.html');
      driver.wait(until.elementLocated(By.id('loaded')), 10000);
      driver.findElement(By.id('login-response-type')).sendKeys('token');
      driver.findElement(By.id('login-scope')).sendKeys('openid');
      driver.findElement(By.id('login-username')).sendKeys('johnfoo@gmail.com');
      driver.findElement(By.id('login-password')).sendKeys('1234');
      driver.findElement(By.className('login-redirect-usernamepassword')).click();
      driver.wait(until.elementLocated(By.id('parsed')), 10000);

      driver.findElement(By.id('err')).getText().then(function(value) {
        console.log('ERR:', value ? value : '-empty-');
        expect(value).to.equal('');
      });

      driver.findElement(By.id('result')).getText().then(function(value) {
        expect(value).to.not.equal('');
      });

      return driver.quit();
    });
  })
});
