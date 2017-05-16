var fs = require('fs');
var webpack = require('webpack');
var CustomVarLibraryNamePlugin = require('webpack-custom-var-library-name-plugin');

var path = require('path');

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
  devtool: 'eval',
  entry: entryPoints,
  output: {
    path: path.join(__dirname, '../build'),
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd',
    publicPath: 'https://localhost:3000/'
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
  stats: {
    colors: true,
    modules: true,
    reasons: true
  },
  stylus: {
    preferPathResolver: 'webpack'
  },
  plugins: [
    new CustomVarLibraryNamePlugin({
      name: nameOverrides
    })
  //   new webpack.HotModuleReplacementPlugin(),
  //   new webpack.NoErrorsPlugin()
  ]
};

function capitalize(name) {
  return name[0].toUpperCase() + name.slice(1);
}
