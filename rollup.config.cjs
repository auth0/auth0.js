const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const terser = require('@rollup/plugin-terser');
const dev = require('rollup-plugin-dev');
const license = require('rollup-plugin-license');
const json = require('@rollup/plugin-json');
const { argv } = require('yargs');
const pkg = require('./package.json');

// Safely load oidc-provider
let createApp;
try {
    createApp = require('./scripts/oidc-provider');
} catch (e) {
    console.warn('OIDC provider could not be loaded, using mock instead:', e.message);
    createApp = ({ port }) => ({});
}

// Support both legacy --prod flag and new --environment production
const isProduction = process.env.production === 'true' || argv.prod === true;
const OUTPUT_PATH = 'dist';

const getPlugins = prod => [
    nodeResolve({
        browser: true
    }),
    commonjs(),
    json(),
    replace({
        values: {
            __DEV__: prod ? 'false' : 'true',
            'process.env.NODE_ENV': prod ? "'production'" : "'development'"
        },
        preventAssignment: true
    }),
    prod &&
    terser({
        compress: { warnings: false },
        format: { comments: false }, 
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
].filter(Boolean);

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
                    try {
                        app.use(modules.mount(createApp({ port: 3000 })));
                    } catch (e) {
                        console.warn('Error mounting OIDC provider:', e.message);
                    }
                }
            })
        ].filter(Boolean)
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

module.exports = finalFiles;
