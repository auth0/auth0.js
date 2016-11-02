var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: './standalone.js',
  output: { 
    path: path.join(__dirname, "../build"), 
    filename: 'auth0.min.js' 
  },
  resolve: {
    extensions: ["", ".webpack.js", ".web.js", ".js"]
  },
  progress: true,
  watch: true,
  watchOptions: {
    aggregateTimeout: 500,
    poll: true
  },
  keepalive: true,
  inline: true,
  hot: true, 
  stats: {
    colors: true,
    modules: true,
    reasons: true
  },
  stylus: {
    preferPathResolver: 'webpack',
  }
};