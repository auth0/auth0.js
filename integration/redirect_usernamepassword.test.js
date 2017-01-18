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
      driver.findElement(By.className('login-redirect-usernamepassword')).click();
      driver.wait(until.elementLocated(By.id('parsed')), 10000);

      driver.findElement(By.id('result')).getText().then(function(value) {
        expect(value).to.not.equal('');
      });


      return driver.quit();
    });
  })
});
