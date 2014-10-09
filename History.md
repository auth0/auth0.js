
v4.2.10 / 2014-10-07
====================

  * release: 4.2.10
  * restore old popup behavior for response_type=code

v4.2.9 / 2014-10-07
===================

  * release: 4.2.9
  * open popup on signup case when callbackOnLocaHash:false and popup true
  * remove debug option

v4.2.8 / 2014-09-30
===================

  * release: 4.2.8
  * Fix phonegap/cordova fast close window popup for better UX
  * Update README.md
  * Add open source banner png to README.md
  * Updating jshintrc configuration.
  * Updates AUth0.js version from README
  * minor

v4.2.7 / 2014-09-15
===================

  * remove grunt task for maxcdn
  * update grunt-s3-aws
  * release: 4.2.7
  * Added scope passthrough
  * purge fastly on every push
  * Minor: Docs: Adding firebase delegation example
  * Minor: Improving API Docs
  * Minor

v4.2.6 / 2014-09-02
===================

  * release: 4.2.6
  * Defaulting to window hash

v4.2.5 / 2014-09-01
===================

  * release: 4.2.5
  * Merge branch 'master' of github.com:auth0/auth0.js
  * 4.1.1
  * Added popup options to Phonegap as well
  * Update mocha@1.20.1 - We should handle global.window differently since mocha@1.21.x breaks the global `global` pattern and just use `this`
  * Fix tests
  * Fix bug on IE8 with `this` referencing window instead of iframe
  * Fix support forceLogout helper for IE8
  * Disabled tag badge since fails 99% of the time
  * Properly disable coverage badge
  * Disable coverage badge
  * Update Readme.md badges
  * change deploy instructions
  * fix indentation
  * check every deploy target before deploying

v4.2.4 / 2014-08-15
===================

  * release: 4.2.4
  * force delete dist branch

v4.2.3 / 2014-08-15
===================

  * release: 4.2.3
  * update badget url
  * release: 4.2.2
  * minor

v4.2.1 / 2014-08-15
===================

  * release: 4.2.1
  * delete built resources
  * change new deploy flow
  * check outdated versions before release

v4.2.0 / 2014-08-15
===================

  * change the way of running tests
  * Merge pull request #39 from alyssaq/master
  * example command to run auth0 example
  * Minor: Improving signup docs
  * increaste waiting for browserstack tunnel
  * add sleep before opening the browser
  * Revert "add drone.yml to test drone.io"
  * Updating README

v4.1.0 / 2014-08-13
===================

  * Merge pull request #38 from auth0/added-offline-mode
  * Fixes & more tests
  * Offline mode
  * add drone.yml to test drone.io
  * add npm tasks to run desktop and mobile tests
  * minor
  * minor
  * add dockerfile to run tests

v4.0.1 / 2014-08-07
===================

  * Merge branch 'updates'
  * Update is-array module to resolve native first or fallback instead
  * Update use_jsonp API docs
  * Update LoginError API docs
  * Move `Array.isArray` polyfill to function wrapper
  * Update API docs for assert_required
  * Update API documentation for lib/base64_url_decode.js
  * Update to better JSON.parse fallback

v4.0.0 / 2014-08-05
===================

  * Merge pull request #36 from auth0/delegation-token
  * Done Iaco Suggestions
  * Added refresh_token API as well
  * Finished build
  * Updated README
  * Added new DelegationToken API

v3.2.3 / 2014-07-25
===================

  * reference branch of qs

v3.2.2 / 2014-07-25
===================

  * Update package.json
  * Update README.md

v3.2.1 / 2014-07-22
===================

  * Oops, fixing tests

v3.2.0 / 2014-07-22
===================

  * Fixes #16: Make callbackURL optional and makes it default to document.location.href
  * Merge pull request #32 from auth0/update-login
  * Add block docs to auth0.js API

v3.1.0 / 2014-07-14
===================

  * Merge pull request #30 from auth0/phonegap
  * Updating auth0.js to latest version
  * Fixing parseHash documentation.
  * More documentation improvement.
  * Adding compiled files.
  * Phonegap fine tunning.
  * Improving docs.
  * Documenting parseHash method.
  * First take on Phonegap implementation.
  * Minor: documentation typo.
  * Updating .gitignore

v3.0.3 / 2014-07-11
===================

  * Removing popup tests that no longer apply after winchan.

v3.0.2 / 2014-07-11
===================

  * Update build
  * Add trim to each method accepting username|email parameters before execution and tests
  * Add trim to .validateUser() and tests. #28
  * Add trim as dependency

v3.0.1 / 2014-07-11
===================

  * Merge pull request #27 from auth0/winchan

v3.0.0 / 2014-07-11
===================

  * Winchan refactor.
  * 2.3.1
  * Update README.md
  * Merge pull request #25 from auth0/issues/24
  * Update README.md
  * Fixes #24 by adding support for connection_scope to login and signin. Bump to 2.3.0

v2.3.0 / 2014-07-03
===================

  * Updating Auth0 Logo
  * Add tests for IE11. Related #23
  * 2.1.10
  * update jsonp timeout
  * 2.1.9
  * Bump jsonp dependency
  * 2.1.8

v2.2.0 / 2014-06-10
===================



v2.1.10 / 2014-06-17
====================

  * update jsonp timeout

v2.1.9 / 2014-06-17
===================

  * Bump jsonp dependency

v2.1.8 / 2014-06-10
===================

  * add packageify as a dep
  * 2.1.7
  * Add prefix to all jsonp requests to avoid bug when learnboost/jsonp is used in same site

v2.1.7 / 2014-06-10
===================

  * add packageify as a dep

v2.1.6 / 2014-06-04
===================

  * add versioning task
  * add version with packageify

v2.1.5 / 2014-06-03
===================

  * Minor: Updating built file with comment change.
  * Merge pull request #19 from auth0/add-version-field
  * Minor: fixed english
  * Updating copyright notice
  * Removing CI Badge that no longer works.
  * Adds Auth0.version property that contains the current auth0.js version.
  * Merge pull request #18 from gdi2290/patch-1
  * undo shorthand npm install
  * Adding browserstack-cli dependecy.

v2.1.4 / 2014-05-16
===================

  * Bug fix: ie11 never finding out that popup was closed.
  * Update README.md
  * Removing weird character after ||
  * Update index.html
  * include snippet for "change password"
  * Minor: Adding clarification to callback argument check.

v2.1.3 / 2014-05-09
===================

  * Filtering popup and popupOptions when calling /authorize endpoint.

v2.1.2 / 2014-05-08
===================

  * Minor: Fixing bug when popupOptions is undefined.

v2.1.1 / 2014-05-08
===================

  * Centering login popup by default.

v2.1.0 / 2014-05-08
===================

  * Fixing loginWithPopup and documenting callback usage.
  * Fixing broken getDelegationToken test.

v2.0.18 / 2014-04-30
====================

  * do not send popup and popupOptions as qs

v2.0.17 / 2014-04-23
====================

  * Merge pull request #14 from auth0/notify-about-popup-close
  * Making callback(err, null) -> err instance of Error
  * Notifying when user closed the popup window.

v2.0.16 / 2014-04-23
====================

  * Merge pull request #13 from auth0/popup-error-url-fix
  * Fixing #error and ?error handling in popup

v2.0.15 / 2014-04-19
====================

  * minor

v2.0.14 / 2014-04-19
====================

  * do not validate iss if not present in the jwt
  * fix broken tests

v2.0.13 / 2014-04-19
====================

  * minor

v2.0.12 / 2014-04-15
====================

  * Delete auth0.debug.js

v2.0.11 / 2014-04-15
====================

  * change bower to use built-in file
  * Removing haunted character (╯°□°）╯︵ ┻━┻
  * Removing invalid character.
  * Removing invalid character.

v2.0.10 / 2014-04-03
====================

  * fix issue with use_jsonp() and add an option to force jsonp
  * Adds to CDN URLs like auth0-2.js, auth0-2.0.js
  * Merge pull request #10 from cbas/patch-1
  * Fixed bower name & version
  * Adding error handling to examples.

v2.0.9 / 2014-03-31
===================

  * Fixing ',' that broke IE8

v2.0.8 / 2014-03-31
===================

  * Simplifying getProfile method.
  * Update README.md

v2.0.7 / 2014-03-29
===================

  * Fixing bug on popup logic.

v2.0.6 / 2014-03-29
===================

  * Updating compiled files.
  * minor
  * Removing debugger statement.
  * Update README.md
  * minor
  * Updating login-google-popup example.

v2.0.5 / 2014-03-28
===================

  * build library

v2.0.4 / 2014-03-28
===================

  * minor
  * Updating parseHash and getProfile docs

v2.0.3 / 2014-03-28
===================

  * s/throw/return/g in some tests
  * Fixing popup example.
  * * parseHash now returns null on invalid hash URL. * getProfile MUST be called exclusively using a token (object obtained by doing parseHash of the hash URL). * Removed inCallback function as it was confusing.

v2.0.2 / 2014-03-27
===================

  * Fixing tests that were not working.
  * Fixing broken example.
  * signin with {popup: true} MUST receive a callback.

v2.0.1 / 2014-03-27
===================

  * Fixing callback(err) -> callback(e)
  * Updating how parseHash sync works.

v2.0.0 / 2014-03-27
===================

  * Merge pull request #9 from auth0/callback-policy-change
  * parseHash sync refactor and Adding inCallback method.
  * Making methods that receive callbacks always call callbacks.

v1.6.5 / 2014-03-26
===================

  * change  to  to avoid ad-block plugins

v1.6.4 / 2014-03-08
===================

  * change "/api/users/validate_userpassword" with "/public/api/users/validate_userpassword"

v1.6.3 / 2014-03-07
===================

  * validateUser method

v1.6.2 / 2014-03-04
===================

  * getProfile: call POST /userinfo
  * fix parse error when hash starts with a slash (#/access_token, #/error)

v1.6.1 / 2014-03-04
===================

  * getProfile: use /tokeninfo instead of /api/users/:id
  * fix test

v1.6.0 / 2014-03-02
===================

  * support for callback on popup mode and chance getProfile signature
  * updated bower version

v1.5.1 / 2014-02-28
===================

  * improve readme

v1.5.0 / 2014-02-28
===================

  * more tests
  * minor
  * code improvements
  * loginWithUsernamePassword: call loginWithResourceOwner based on callback.arguments
  * loginWithUsernamePassword: by default use RO endpoint

v1.4.3 / 2014-02-27
===================

  * rebuild js

v1.4.2 / 2014-02-27
===================

  * minor fix

v1.4.1 / 2014-02-27
===================

  * minor
  * Update README.md
  * Update README.md
  * update doc

v1.4.0 / 2014-02-27
===================

  * default scope: openid

v1.3.12 / 2014-02-25
====================

  * improve validation error messages
  * 1.3.11
  * more tests

v1.3.11 / 2014-02-25
====================

  * validate id_token.aud and id_token.iss. closes #7

v1.3.10 / 2014-02-24
====================

  * fix encoding issues
  * code improvements

v1.3.9 / 2014-02-24
===================

  * getProfile method. closes #6
  * 1.3.8

v1.3.8 / 2014-02-24
===================

  * login method: call loginWithUsernamePassword only if options.username/options.email is not undefined
  * fix tests

v1.3.7 / 2014-02-24
===================

  * close popup on signing with db connection errors

v1.3.6 / 2014-02-23
===================

  * partially implement popup mode for user&pass
  * configured grunt-maxcdn

v1.3.5 / 2014-02-03
===================

  * show popup sample
  * Merge pull request #5 from cristiandouce/feature-popup
  * Update example with new popup support and make it work
  * Add popup support for 3rd party connection login
  * minor
  * v1.3.4
  * update getDelegationToken in order to require id_token parameter
  * update example based on recent changes
  * Update README.md

v1.3.4 / 2014-01-30
===================

  * update getDelegationToken in order to require id_token parameter
  * update example based on recent changes
  * v1.3.3
  * minor
  * Update README.md

v1.3.3 / 2014-01-23
===================

  * minor

v1.3.2 / 2014-01-23
===================

  * getDelegationToken method

v1.3.1 / 2014-01-11
===================

  * fix minor

v1.3.0 / 2014-01-11
===================

  * add parameter to getSSOData to query for ADs

v1.2.8 / 2014-01-03
===================

  * Moving bower version to 1.2.8.

v1.2.7 / 2014-01-03
===================

  * Adding alias login=signin and error hash parsing.
  * Making testem to be run from node_modules.

v1.2.6 / 2013-12-24
===================

  * minor

v1.2.5 / 2013-12-24
===================



v1.2.4 / 2013-12-24
===================

  * update version in bower.json
  * 1.2.3

v1.2.3 / 2013-12-24
===================

  * fix tests
  * add experimental support for bower, closes #4

v1.2.2 / 2013-11-27
===================

  * 1.2.1
  * use "/usernamepassword/login" endpoint for  loginWithUsernamePassword method
  * minor

v1.2.0 / 2013-11-21
===================



v1.1.2 / 2013-11-21
===================

  * add logout method

v1.1.1 / 2013-11-14
===================

  * fix signup bug on server error for ie8

v1.1.0 / 2013-11-13
===================

  * fix change_password false/positive error
  * upload to cdn with sourcemaps
  * add version number to file in cdn

v1.0.0 / 2013-11-05
===================

  * change parseHash api and introduce callbackOnLocationHash
  * minor

v0.2.2 / 2013-11-01
===================

  * code improvements
  * support response_type and scope parameters
  * add cdn task
  * minor
  * add build badge
  * minor
  * change layout of the repo
  * run in two phases
  * minor
  * minor

v0.2.1 / 2013-10-31
===================

  * update debug
  * change timeouts
  * simplify phantomjs runner
  * minor
  * minor
  * minor
  * change to my fork of browserstack cli
  * use basic config for testem browserstack
  * let's trick travis
  * minor
  * add timeout to browserstack tests

v0.2.0 / 2013-10-25
===================

  * rename loginWithDbConnection with loginWithUsernamePassword in order to support adldap connections

v0.1.8 / 2013-10-24
===================

  * Merge pull request #2 from auth0/standalone_vs_npm
  * minor
  * do not pollute windown when used as a module
  * minor
  * minor
  * minor
  * minor
  * changePassword: improve success result
  * 0.1.7
  * changePassword method
  * getConnections method
  * fix test for ie10
  * disable safari tests
  * minor
  * change set of browsers for tests
  * use BrowserStack/testem instead of saucelabs
  * 0.1.6
  * fix problem with XDomainRequest
  * add certs to test
  * add example_https
  * have a nice weekend!
  * include simple test for getSSOData (for all browsers)
  * hipchat notifications
  * dont run getSSOData tests in iPhone browser
  * comment all getSSOData tests
  * improved logout helper method
  * minor
  * remove setTimeout because safari (iphone) does not support it
  * minnor
  * minor
  * commented getSSOData tests (temporarily)
  * forceLogout method for tests
  * skip getSSOData test (temporarily)
  * minor
  * getSSOData method
  * minor
  * more details to readme
  * improvements to readme
  * minor
  * minor
  * minor
  * minor
  * minor
  * more info to the readme + parseHash feature
  * increase font size of test harness
  * minor
  * minor
  * change to jsonp module
  * minor
  * fix tests in ie
  * change from chai to expect
  * do not use jsonp for IE10
  * minor
  * minor
  * increate timeout
  * add travis image to readme
  * change to phantomjs

v0.1.5 / 2013-09-28
===================

  * use jsonp for signup when the browser doesnt support cors

v0.1.4 / 2013-09-27
===================

  * fix 404 error on db connections login
  * some fixes for IE7

v0.1.3 / 2013-09-27
===================

  * improve errors in jsonp case

v0.1.2 / 2013-09-27
===================

  * improve errors in JSONP case

v0.1.1 / 2013-09-27
===================

  * update readme

v0.1.0 / 2013-09-27
===================

  * add signup feature
  * update builds
  * add support for jsonp
  * minor

v0.0.3 / 2013-09-26
===================

  * add support for db connections user&pass
  * base64 url decode id_token

v0.0.2 / 2013-09-26
===================

  * decode token
  * change to callbackURL
  * add browserling
  * add readme
  * initial
