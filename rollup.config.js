import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import dev from 'rollup-plugin-dev';
import license from 'rollup-plugin-license';
import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
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
      // We use a more specific pattern to avoid false positives in strings/comments
      const catchRegex = /}\s*catch\s*\{\s*/g;
      let match;

      while ((match = catchRegex.exec(code)) !== null) {
        const startPos = match.index;
        const endPos = startPos + match[0].length;
        const originalText = match[0];
        const replacement = originalText.replace(/catch\s*\{/, 'catch (e) {');

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

const argv = yargs(hideBin(process.argv)).argv;

const isProduction = process.env.PROD === 'true' || argv.prod === true;
const OUTPUT_PATH = 'dist';

const getPlugins = prod => [
  resolve({
    browser: true
  }),
  commonjs({
    // Safe to ignore dynamic requires since the codebase doesn't use them
    // Verified via grep - no require() calls in src/
    ignoreDynamicRequires: true,
    // Keep default behavior for better compatibility with CommonJS modules
    // 'auto' attempts to detect the correct export style, which is safer for mixed module types
    defaultIsModuleExports: 'auto'
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
    output: { comments: false },
    // Enable mangle for better minification in production builds
    mangle: true
  }),
  license({
    banner: `
    <%= pkg.name %> v<%= pkg.version %>
    Author: Auth0
    Date: <%= moment().format('YYYY-MM-DD') %>
    License: MIT
    `
  }),
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
