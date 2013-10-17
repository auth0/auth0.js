var fs = require('fs');

module.exports = function(grunt) {
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
      },
      example_https: {
        options: {
          base:  "example",
          port:  3000,
          protocol: 'https',
          hostname: '*',
          cert: fs.readFileSync(__dirname + '/https_test_certs/server.crt').toString(),
          key:  fs.readFileSync(__dirname + '/https_test_certs/server.key').toString(),
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
  grunt.registerTask("example_https", ["connect:example_https", "watch"]);
  grunt.registerTask("dev",     ["connect:test", "watch"]);
};