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
      platform: "Windows 7",
      version: "9"
  }, {
      browserName: "internet explorer",
      platform: "XP",
      version: "8"
  }, {
      browserName: "safari",
      platform: "OS X 10.8",
      version: "6"
  }, {
      browserName: "android",
      platform: "Linux",
      version: "4.0"
  }, {
      browserName: "iphone",
      platform: "OS X 10.8",
      version: "6"
  }];

  grunt.initConfig({
    connect: {
      test: {
        options: {
          base: "test",
          hostname: '0.0.0.0',
          port: 9999
        }
      },
      example: {
        options: {
          base: "example",
          port: 3000
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
    browserify: {
      dist: {
        files: {
          'build/auth0.js': ['index.js'],
        }
      }
    },
    uglify: {
      min: {
        files: {
          'build/auth0.min.js': ['build/auth0.js']
        }
      }
    },
    copy: {
      example: {
        files: {
          'example/auth0.js': 'build/auth0.js',
          'test/auth0.js': 'build/auth0.js'
        }
      }
    },
    clean: {
      build: ["build/", "example/auth0.js"],
    },
    watch: {
      another: {
        files: ['node_modules', 'index.js', 'lib/*.js'],
        tasks: ['build']
      }
    }
  });

  // Loading dependencies
  for (var key in grunt.file.readJSON("package.json").devDependencies) {
    if (key !== "grunt" && key.indexOf("grunt") === 0) grunt.loadNpmTasks(key);
  }

  grunt.registerTask("build",   ["clean", "browserify:dist", "uglify:min", "copy:example"]);
  grunt.registerTask("example", ["connect:example", "watch"]);
  grunt.registerTask("dev",     ["connect:test", "watch"]);
  grunt.registerTask("test",    ["connect", "saucelabs-mocha"]);
};