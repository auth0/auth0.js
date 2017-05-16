var gulp = require('gulp');
var gutil = require('gulp-util');
var webpack = require('webpack');
var webpackStream = require('webpack-stream');
var WebpackDevServer = require('webpack-dev-server');

var webpackConfig = require('./webpack.config.js');
var webpackProdConfig = require('./webpack.prod.config.js');

gulp.task('build', function () {
  return gulp.src('src/index.js')
    .pipe(webpackStream(webpackProdConfig))
    .pipe(gulp.dest('build/'));
});

gulp.task('dev', function () {
  var compiler = webpack(webpackConfig);

  new WebpackDevServer(compiler, {
    https: true
  }).listen(3000, 'localhost', function (err) {
    if (err) {
      throw new gutil.PluginError('webpack-dev-server', err);
    }
    gutil.log('[webpack-dev-server]', 'https://localhost:3000/example/index.html');
  });
});
