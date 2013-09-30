module.exports = function(grunt) {
  var browsers = [{
      browserName: "firefox",
      version: "19",
      platform: "XP"
  }, {
      browserName: "chrome",
      platform: "XP"
  }, {
      browserName: "chrome",
      platform: "linux"
  }, {
      browserName: "internet explorer",
      platform: "WIN8",
      version: "10"
  }, {
      browserName: "internet explorer",
      platform: "VISTA",
      version: "9"
  }, {
      browserName: "internet explorer",
      platform: "XP",
      version: "8"
  }];

  grunt.initConfig({
    connect: {
      server: {
        options: {
          base: "test",
          port: 9999
        }
      }
    },
    'saucelabs-mocha': {
        all: {
            options: {
                urls: ["http://127.0.0.1:9999/index.html"],
                tunnelTimeout: 5,
                build: process.env.TRAVIS_JOB_ID,
                concurrency: 3,
                browsers: browsers,
                testname: "mocha tests",
                tags: ["master"]
            }
        }
    },
    watch: {}
  });

  // Loading dependencies
  for (var key in grunt.file.readJSON("package.json").devDependencies) {
    if (key !== "grunt" && key.indexOf("grunt") === 0) grunt.loadNpmTasks(key);
  }

  grunt.registerTask("dev", ["connect", "watch"]);
  grunt.registerTask("test", ["connect", "saucelabs-mocha"]);
};