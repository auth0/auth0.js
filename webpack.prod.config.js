var fs = require('fs');
var webpack = require('webpack');
var CustomVarLibraryNamePlugin = require('webpack-custom-var-library-name-plugin');
var path = require('path');
var SmartBannerPlugin = require('smart-banner-webpack-plugin');
var UnminifiedWebpackPlugin = require('unminified-webpack-plugin');
var version = require('./src/version.js').raw;

var entryPoints = {
  'auth0-js': ['./src/index.js']
};

var nameOverrides = {
  'auth0-js': {
    var: 'auth0',
    file: 'auth0'
  }
};

var files = fs.readdirSync(path.join(__dirname, './plugins/'));

for (var a = 0; a < files.length; a++) {
  var pluginName = files[a] + '-auth0-plugin';
  var className = capitalize(files[a]) + 'Auth0Plugin';

  entryPoints[pluginName] = ['./plugins/' + files[a] + '/index.js'];

  nameOverrides[pluginName] = {
    var: className,
    file: pluginName
  };
}

module.exports = {
  devtool: 'source-map',
  entry: entryPoints,
  output: {
    path: path.join(__dirname, '../build'),
    filename: '[name].min.js',
    library: '[name]',
    libraryTarget: 'umd',
    umdNamedDefine: true
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
  stats: {
    colors: true,
    modules: true,
    reasons: true
  },
  plugins: [
    new CustomVarLibraryNamePlugin({
      name: nameOverrides
    }),
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

function capitalize(name) {
  return name[0].toUpperCase() + name.slice(1);
}
