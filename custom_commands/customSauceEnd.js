exports.command = function(cb) {
    var SauceLabs = require("saucelabs");

    var saucelabs = new SauceLabs({
        username: process.env.SAUCELABS_USER,
        password: process.env.SAUCELABS_KEY
    });

    var sessionid = this.capabilities['webdriver.remote.sessionid'];
    var jobName = this.currentTest.name;
console.log('sessionid',sessionid);
    saucelabs.updateJob(sessionid, {
        passed: this.currentTest.results.failed === 0,
        name: jobName
    }, function() {
      console.log('arguments', arguments);
      cb();
    });

    console.log("SauceOnDemandSessionID=" + sessionid + " job-name=" + jobName);
};