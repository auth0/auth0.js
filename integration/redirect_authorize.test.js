var expect = require('expect.js');
var selenium = require('./selenium');

describe('redirect authorize', function () {
  this.timeout(9999999);

  selenium.runTests((clientFactory, webdriver, browser) => {
    var By = webdriver.By;
    var until = webdriver.until;

    it('should result in a successful transaction ' + browser, function () {
      var driver = clientFactory();

      driver.get('https://auth0.github.io/auth0.js/example/test.html');
      driver.wait(until.elementLocated(By.id('loaded')), 10000);
      driver.findElement(By.className('login-redirect-authorize')).click();
      driver.wait(until.elementLocated(By.id('hlploaded')), 30000);
      driver.findElement(By.id('email')).sendKeys('johnfoo@gmail.com');
      driver.findElement(By.id('password')).sendKeys('1234');
      driver.findElement(By.id('upLogin')).click();
      driver.wait(until.elementLocated(By.id('parsed')), 10000);

      driver.findElement(By.id('result')).getText().then(function(value) {
        expect(value).to.not.equal('');
      });

      return driver.quit();
    });
  })
});
