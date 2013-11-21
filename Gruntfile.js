var fs = require('fs');
var pkg = require('./package');

module.exports = function(grunt) {
  grunt.initConfig({
    connect: {
      test: {
        options: {
          hostname: '0.0.0.0',
          port: 9999
        }
      },
      example: {
        options: {
          port: 3000
        }
      },
      example_https: {
        options: {
          base:  "example",
          port:  3000,
          protocol: 'https',
          hostname: '*',
          cert: fs.readFileSync(__dirname + '/test/https_test_certs/server.crt').toString(),
          key:  fs.readFileSync(__dirname + '/test/https_test_certs/server.key').toString(),
        }
      }
    },
    browserify: {
      dist: {
        files: {
          'build/auth0.js': ['standalone.js'],
        }
      },
      debug: {
        files: {
          'build/auth0.debug.js': ['standalone.js'],
        },
        options: {
          debug: true
        }
      }
    },
    uglify: {
      options: {
        ascii: true
      }, min: {
        files: {
          'build/auth0.min.js': ['build/auth0.js']
        }
      }
    },
    copy: {
      example: {
        files: {
          'example/auth0.js': 'build/auth0.js',
        }
      }
    },
    clean: {
      build: ["build/", "example/auth0.js"],
    },
    watch: {
      another: {
        files: ['node_modules', 'standalone.js', 'lib/*.js'],
        tasks: ['build']
      }
    },
    exec: {
      'test-phantom': {
        cmd: 'testem -f testem_dev.yml ci -l PhantomJS',
        stdout: true,
        stderr: true
      },
      'test-desktop': {
        cmd: 'testem ci -l bs_chrome,bs_firefox,bs_ie_8,bs_ie_9,bs_ie_10',
        stdout: true,
        stderr: true
      },
      'test-mobile': {
        cmd: 'testem ci -l bs_iphone_5', //disable ,bs_android_41: is not working
        stdout: true,
        stderr: true
      }
    },
    s3: {
      options: {
        key:    process.env.S3_KEY,
        secret: process.env.S3_SECRET,
        bucket: process.env.S3_BUCKET,
        access: 'public-read',
        headers: {
          'Cache-Control': 'public, max-age=300',
        }
      },
      publish: {
        upload: [
          {
            src:  'build/auth0.min.js',
            dest: 'w2/auth0-' + pkg.version + '.min.js',
            options: { gzip: true }
          },
          {
            src:  'build/auth0.debug.js',
            dest: 'w2/auth0-' + pkg.version + '.js'
          },
        ]
      }
    }
  });

  // Loading dependencies
  for (var key in grunt.file.readJSON("package.json").devDependencies) {
    if (key !== "grunt" && key.indexOf("grunt") === 0) grunt.loadNpmTasks(key);
  }

  grunt.registerTask("build",         ["clean", "browserify:dist", "browserify:debug", "uglify:min", "copy:example"]);
  grunt.registerTask("example",       ["connect:example", "watch"]);
  grunt.registerTask("example_https", ["connect:example_https", "watch", "build"]);
  grunt.registerTask("dev",           ["connect:test", "watch", "build"]);
  grunt.registerTask("test",          ["exec:test-phantom"]);
  grunt.registerTask("integration",   ["exec:test-desktop", "exec:test-mobile"]);
  grunt.registerTask("cdn",           ["s3"]);
};