/*
 *
 * This is used to build the bundle with browserify.
 *
 * The bundle is used by people who doesn't use browserify.
 * Those who use browserify will install with npm and require the module,
 * the package.json file points to index.js.
 */
var authentication = require('./authentication');
var management = require('./management');
var webAuth = require('./webAuth');
var auth0Namespace = {
  authentication: authentication,
  management: management,
  webAuth: webAuth
};

//use amd or just throught to window object.
if (typeof global.window.define == 'function' && global.window.define.amd) {
  global.window.define('auth0', function () { return auth0Namespace; });
} else if (global.window) {
  global.window.auth0 = auth0Namespace;
}
