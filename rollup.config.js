const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');
const { terser } = require('rollup-plugin-terser');
const serve = require('rollup-plugin-serve');
const livereload = require('rollup-plugin-livereload');
const license = require('rollup-plugin-license');
const json = require('rollup-plugin-json');
const { argv } = require('yargs');

const pkg = require('./package.json');

const isProduction = argv.prod === true;

const OUTPUT_PATH = 'dist';

const getPlugins = isProduction => {
  return [
    resolve({
      browser: true
    }),
    commonjs(),
    json(),
    replace({
      __DEV__: isProduction ? 'false' : 'true',
      'process.env.NODE_ENV': isProduction ? "'production'" : "'development'"
    }),
    isProduction &&
      terser({
        compress: { warnings: false },
        output: { comments: false },
        mangle: false
      }),
    license({
      banner: `
    <%= pkg.name %> v<%= pkg.version %>
    Author: Auth0
    Date: <%= moment().format('YYYY-MM-DD') %>
    License: MIT
    `
    })
  ];
};

const prodFiles = [
  {
    input: 'src/index.js',
    output: [
      {
        name: 'auth0',
        file: pkg.main,
        format: 'umd',
        sourcemap: true,
        exports: 'named'
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: getPlugins(isProduction)
  },
  {
    input: 'plugins/cordova/index.js',
    output: {
      name: 'CordovaAuth0Plugin',
      file: `${OUTPUT_PATH}/cordova-auth0-plugin.min.js`,
      format: 'umd',
      sourcemap: true,
      exports: 'default'
    },
    plugins: getPlugins(isProduction)
  }
];
const devFiles = [
  {
    input: 'src/index.js',
    output: {
      name: 'auth0',
      file: `${OUTPUT_PATH}/auth0.js`,
      format: 'umd',
      sourcemap: isProduction ? false : 'inline',
      exports: 'named'
    },
    plugins: [
      ...getPlugins(false),
      !isProduction &&
        serve({
          contentBase: ['dist', 'example'],
          open: true,
          port: 3000
        }),
      !isProduction && livereload()
    ]
  },
  {
    input: 'plugins/cordova/index.js',
    output: {
      name: 'CordovaAuth0Plugin',
      file: `${OUTPUT_PATH}/cordova-auth0-plugin.js`,
      format: 'umd',
      sourcemap: isProduction ? false : 'inline',
      exports: 'default'
    },
    plugins: getPlugins(false)
  }
];

const finalFiles = [...devFiles];
if (isProduction) {
  finalFiles.push(...prodFiles);
}
export default finalFiles;
