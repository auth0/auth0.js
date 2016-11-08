var path = require('path');

module.exports = {
  devtool: 'eval',
  entry: {
    auth0: './src/index.js'
  },
  output: {
    path: path.join(__dirname, '../build'),
    filename: '[name].js',
    library: 'auth0',
    libraryTarget: 'var'
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js']
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
    preferPathResolver: 'webpack'
  }
};
