var gulp = require('gulp');
var webpack = require('webpack-stream');

const webpackConfig = require("./webpack.config.js");
const webpackProdConfig = require("./webpack.prod.config.js");

gulp.task('dev', function() {
  return gulp.src('src/index.js')
    .pipe(webpack( webpackConfig ))
    .pipe(gulp.dest('build/'));
});

gulp.task('build', function() {
  return gulp.src('src/index.js')
    .pipe(webpack( webpackProdConfig ))
    .pipe(gulp.dest('build/'));
});

gulp.task("webpack-dev-server", function(callback) {
    // Start a webpack-dev-server
    var compiler = webpack(webpackConfig);

    new WebpackDevServer(compiler, {
    }).listen(8080, "localhost", function(err) {
        if(err) throw new gutil.PluginError("webpack-dev-server", err);
        // Server listening
        gutil.log("[webpack-dev-server]", "http://localhost:8080/webpack-dev-server/index.html");

        // keep the server alive or continue?
        // callback();
    });
});