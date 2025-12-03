import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import dev from 'rollup-plugin-dev';
import license from 'rollup-plugin-license';
import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';
import { createRequire } from 'module';
import MagicString from 'magic-string';
import createApp from './scripts/oidc-provider.js';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

// Plugin to fix ES5 compatibility by replacing optional catch bindings
// This is needed because Rollup 4.x can generate optional catch bindings (catch {})
// which are not ES5 compatible. We need to add an error parameter for IE9 support.
const fixES5 = () => ({
  name: 'fix-es5',
  renderChunk(code, chunk, options) {
    // Only apply to UMD and ES formats
    if (options.format === 'umd' || options.format === 'es') {
      // Use MagicString for proper source map handling
      const magicString = new MagicString(code);
      let hasReplacements = false;

      // More robust regex that matches optional catch bindings
      // This pattern looks for 'catch' followed by optional whitespace and an opening brace
      const catchRegex = /catch\s*\{\s*\}/g;
      const matches = [];
      let match;

      // Collect all matches first
      while ((match = catchRegex.exec(code)) !== null) {
        matches.push(match);
      }

      // Apply replacements in reverse order to avoid position shifting issues
      for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const startPos = match.index;
        const endPos = startPos + match[0].length;
        // Direct string replacement - add error parameter
        const replacement = 'catch (e) {}';

        magicString.overwrite(startPos, endPos, replacement);
        hasReplacements = true;
      }

      if (hasReplacements) {
        return {
          code: magicString.toString(),
          map: magicString.generateMap({ hires: true })
        };
      }
    }
    return null;
  }
});

const isProduction = process.env.PRODUCTION === 'true';
const OUTPUT_PATH = 'dist';

const getPlugins = prod => [
  resolve({
    browser: true
  }),
  commonjs({
    // Safe to ignore dynamic requires - verified no dynamic require(variable) patterns exist
    // Source code (src/) uses ES6 imports, dependencies use only static require('string')
    // Dynamic requires would be patterns like: require(variableName) or require('./' + path)
    ignoreDynamicRequires: true
  }),
  json(),
  babel({
    babelHelpers: 'bundled',
    presets: [
      ['@babel/preset-env', {
        targets: {
          ie: '9'
        }
      }]
    ],
    include: ['src/**', 'node_modules/superagent/**']
  }),
  replace({
    __DEV__: prod ? 'false' : 'true',
    'process.env.NODE_ENV': prod ? "'production'" : "'development'",
    preventAssignment: true
  }),
  prod &&
  terser({
    compress: true,
    output: { comments: false }
  }),
  license({
    banner: `
    <%= pkg.name %> v<%= pkg.version %>
    Author: Auth0
    Date: <%= moment().format('YYYY-MM-DD') %>
    License: MIT
    `
  }),
  // Always apply ES5 compatibility fixes since all builds need to support IE9
  fixES5()
];

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
      dev({
        dirs: ['dist', 'example'],
        port: 3000,
        extend(app, modules) {
          app.use(modules.mount(createApp({ port: 3000 })));
        }
      })
      // !isProduction && livereload()
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
