var webpack = require('webpack');
var path = require('path');
var SmartBannerPlugin = require('smart-banner-webpack-plugin');
var UnminifiedWebpackPlugin = require('unminified-webpack-plugin');
var version = require('./src/version.js').raw;

module.exports = {
  devtool: 'source-map',
  entry: './src/index.js',
  output: { 
    path: path.join(__dirname, '../build'), 
    filename: 'auth0.min.js',
    library: ['auth0']
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.js']
  },
  progress: true,
  watchOptions: {
    aggregateTimeout: 500,
    poll: true
  },
  watch: false,
  keepalive: false,
  inline: false,
  hot: false,
  stats: {
    colors: true,
    modules: true,
    reasons: true
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.optimize.UglifyJsPlugin({ 
      compress: { warnings: false, screw_ie8: true },
      comments: false
    }),
    new UnminifiedWebpackPlugin(),
    new SmartBannerPlugin(
      `[filename] v${version}\n\nAuthor: Auth0\nDate: ${new Date().toLocaleString()}\nLicense: MIT\n`, // eslint-disable-line
      { raw: false, entryOnly: true }
    )
  ]
};
