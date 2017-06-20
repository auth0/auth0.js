# Change Log

## [v8.8.0](https://github.com/auth0/auth0.js/tree/v8.8.0) (2017-06-20)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.7.0...v8.8.0)

**Changed**
- Update idtoken-verifier [\#458](https://github.com/auth0/auth0.js/pull/458) ([hzalaz](https://github.com/hzalaz))

**Fixed**
- Fix passwordless inside hosted login page [\#459](https://github.com/auth0/auth0.js/pull/459) ([hzalaz](https://github.com/hzalaz))

## [v8.7.0](https://github.com/auth0/auth0.js/tree/v8.7.0) (2017-05-24)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.6.1...v8.7.0)

**Added**
- Adding `scope` to the parsed hash object [\#434](https://github.com/auth0/auth0.js/pull/434) ([luisrudge](https://github.com/luisrudge))
- Add option to filter iframe events to prevent incorrect events triggering callbacks [\#432](https://github.com/auth0/auth0.js/pull/432) ([aaronchilcott](https://github.com/aaronchilcott))
- Adding cross-origin-auth sessionless flow [\#431](https://github.com/auth0/auth0.js/pull/431) ([luisrudge](https://github.com/luisrudge))
- Adding new LoginTicket flow (with session)  [\#426](https://github.com/auth0/auth0.js/pull/426) ([hzalaz](https://github.com/hzalaz))

**Changed**
- Sending all /co/authenticate errors to the error callback [\#443](https://github.com/auth0/auth0.js/pull/443) ([luisrudge](https://github.com/luisrudge))
- Fix some examples and docs + using https everywhere [\#436](https://github.com/auth0/auth0.js/pull/436) ([luisrudge](https://github.com/luisrudge))

**Fixed**
- Add login_ticket to params whitelist [\#442](https://github.com/auth0/auth0.js/pull/442) ([luisrudge](https://github.com/luisrudge))
- Fix decoding base64 string with special characters [\#440](https://github.com/auth0/auth0.js/pull/440) ([luisrudge](https://github.com/luisrudge))
- Fixed issues with overrides not being used [\#430](https://github.com/auth0/auth0.js/pull/430) ([sandrinodimattia](https://github.com/sandrinodimattia))
# Change Log

## [v8.6.1](https://github.com/auth0/auth0.js/tree/v8.6.1) (2017-05-08)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.6.0...v8.6.1)

**Fixed**
- Fix postMessage handler to handle parsed objects as well [\#420](https://github.com/auth0/auth0.js/pull/420) ([luisrudge](https://github.com/luisrudge))


## [v8.6.0](https://github.com/auth0/auth0.js/tree/v8.6.0) (2017-04-24)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.5.0...v8.6.0)

**Fixed**
- Fixed `nonce` checking on `renewAuth` method [\#413](https://github.com/auth0/auth0.js/pull/413) ([luisrudge](https://github.com/luisrudge))
- Fixed 'qs' dependency [\#401](https://github.com/auth0/auth0.js/pull/401) ([maxpaj](https://github.com/maxpaj))


## [v8.5.0](https://github.com/auth0/auth0.js/tree/v8.5.0) (2017-03-27)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.4.0...v8.5.0)

**Changed**
- Improve jsdocs [\#393](https://github.com/auth0/auth0.js/pull/393) ([hzalaz](https://github.com/hzalaz))

**Fixed**
- Fixing error handling for when the error comes as a successful response from WinChan [\#395](https://github.com/auth0/auth0.js/pull/395) ([luisrudge](https://github.com/luisrudge))
- Correct spelling mistake in web-auth JSDoc resulting in incorrect autocomplete suggestions [\#388](https://github.com/auth0/auth0.js/pull/388) ([Geeman201](https://github.com/Geeman201))


## [v8.4.0](https://github.com/auth0/auth0.js/tree/v8.4.0) (2017-03-13)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.3.0...v8.4.0)
**Closed issues**
- winchanOptions missing parameters [\#378](https://github.com/auth0/auth0.js/issues/378)
- 'Nonce does not match' error when state data contains '=' encoded as %3D [\#377](https://github.com/auth0/auth0.js/issues/377)

**Added**
- Added possibility to specify custom popup size [\#379](https://github.com/auth0/auth0.js/pull/379) ([artemtool](https://github.com/artemtool))

**Changed**
- Whitelist resource owner parameters [\#386](https://github.com/auth0/auth0.js/pull/386) ([hzalaz](https://github.com/hzalaz))
- Only allow to be used in node 6.9 or later [\#385](https://github.com/auth0/auth0.js/pull/385) ([hzalaz](https://github.com/hzalaz))
- Restrict what popupOptions fields are used [\#383](https://github.com/auth0/auth0.js/pull/383) ([hzalaz](https://github.com/hzalaz))
- Replace querystring implementation with qs module [\#382](https://github.com/auth0/auth0.js/pull/382) ([selaux](https://github.com/selaux))
- Deprecation warning: webauth.login → webauth.authorize [\#367](https://github.com/auth0/auth0.js/pull/367) ([dtinth](https://github.com/dtinth))

**Fixed**
- Pass to popup the needed params for auth [\#381](https://github.com/auth0/auth0.js/pull/381) ([hzalaz](https://github.com/hzalaz))


## [v8.3.0](https://github.com/auth0/auth0.js/tree/v8.3.0) (2017-03-01)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.2.0...v8.3.0)

**Added**
- Integration tests [\#346](https://github.com/auth0/auth0.js/pull/346) ([glena](https://github.com/glena))
- Whitelist nonce, state, _csrf and _instate from constructor [\#345](https://github.com/auth0/auth0.js/pull/345) ([glena](https://github.com/glena))
- Added flag to disable id_token verification for legacy clients [\#341](https://github.com/auth0/auth0.js/pull/341) ([glena](https://github.com/glena))
- Popup no owp [\#337](https://github.com/auth0/auth0.js/pull/337) ([glena](https://github.com/glena))

**Changed**
- Remove warnings around refreshing session [\#353](https://github.com/auth0/auth0.js/pull/353) ([hzalaz](https://github.com/hzalaz))
- Updated passwordless start jsdocs [\#340](https://github.com/auth0/auth0.js/pull/340) ([glena](https://github.com/glena))

**Fixed**
- Only parse cordova callback hash  [\#370](https://github.com/auth0/auth0.js/pull/370) ([hzalaz](https://github.com/hzalaz))


## [v8.2.0](https://github.com/auth0/auth0.js/tree/v8.2.0) (2017-01-30)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.1.3...v8.2.0)

**Added**
- Plugins support + cordova plugin [\#333](https://github.com/auth0/auth0.js/pull/333) ([glena](https://github.com/glena))

**Fixed**
- popup.authorize should not require redirectURI when using OWP [\#336](https://github.com/auth0/auth0.js/pull/336) ([glena](https://github.com/glena))


## [v8.1.3](https://github.com/auth0/auth0.js/tree/v8.1.3) (2017-01-23)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.1.2...v8.1.3)

**Fixed**
- Fix case convertion of null values [\#329](https://github.com/auth0/auth0.js/pull/329) ([glena](https://github.com/glena))


## [v8.1.2](https://github.com/auth0/auth0.js/tree/v8.1.2) (2017-01-19)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.1.1...v8.1.2)

**Fixed**
- Fixed params whitelist for authorize endpoint [\#324](https://github.com/auth0/auth0.js/pull/324) ([glena](https://github.com/glena))


## [v8.1.1](https://github.com/auth0/auth0.js/tree/v8.1.1) (2017-01-17)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.1.0...v8.1.1)

**Changed**
- Removed state requirement [\#321](https://github.com/auth0/auth0.js/pull/321) ([glena](https://github.com/glena))

**Removed**
- Revert "Fallback to math.random if there is no crypto support" [\#320](https://github.com/auth0/auth0.js/pull/320) ([glena](https://github.com/glena))

**Fixed**
- Fix undefined variable [\#319](https://github.com/auth0/auth0.js/pull/319) ([glena](https://github.com/glena))


## [v8.1.0](https://github.com/auth0/auth0.js/tree/v8.1.0) (2017-01-17)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.0.4...v8.1.0)

**Added**
- Fallback to math.random if there is no crypto support [\#316](https://github.com/auth0/auth0.js/pull/316) ([glena](https://github.com/glena))

**Fixed**
- Fix passwordless [\#315](https://github.com/auth0/auth0.js/pull/315) ([glena](https://github.com/glena))
- Passwordless start: map params to authParams and fix tests [\#306](https://github.com/auth0/auth0.js/pull/306) ([glena](https://github.com/glena))
- Fix transaction usage to delete what is stored in local storage [\#298](https://github.com/auth0/auth0.js/pull/298) ([glena](https://github.com/glena))

**Breaking changes**
- Do not change casing of the user profile object [\#307](https://github.com/auth0/auth0.js/pull/307) ([glena](https://github.com/glena))


## [v8.0.4](https://github.com/auth0/auth0.js/tree/v8.0.4) (2017-01-06)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.0.3...v8.0.4)

**Fixed**
- Fix undefined valud in for [\#295](https://github.com/auth0/auth0.js/pull/295) ([glena](https://github.com/glena))


## [v8.0.3](https://github.com/auth0/auth0.js/tree/v8.0.3) (2017-01-06)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.0.2...v8.0.3)

**Added**
- Add the option to provide a leeway [\#292](https://github.com/auth0/auth0.js/pull/292) ([glena](https://github.com/glena))


## [v8.0.2](https://github.com/auth0/auth0.js/tree/v8.0.2) (2017-01-05)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.0.1...v8.0.2)

**Fixed**
- Polyfill functions [\#285](https://github.com/auth0/auth0.js/pull/285) ([glena](https://github.com/glena))


## [v8.0.1](https://github.com/auth0/auth0.js/tree/v8.0.1) (2017-01-04)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.0.0...v8.0.1)

**Fixed**
- Fix getSSOData failing due to extra headers [\#284](https://github.com/auth0/auth0.js/pull/284) ([glena](https://github.com/glena))


## [v8.0.0](https://github.com/auth0/auth0.js/tree/v8.0.0) (2017-01-03)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.0.0-beta.3...v8.0.0)

In v8 **auth0.js** is divided in three different components:

- WebAuth: Handles all AuthN/AuthZ flows with redirect/popup inside the browser and related Auth API endpoints, e.g. `/logout`.
- AuthenticationAPI: Helper methods for calling Auth0 Authentication API
- ManagementAPI: Helper methods for calling Auth0 Management API

To get started you can just create a `WebAuth` instance like this

```js
var auth0 = new auth0.WebAuth({
  domain: "{YOUR_AUTH0_DOMAIN}",
  clientID: "{YOUR_AUTH0_CLIENT_ID}"
});
```

> Since auth0.js is intended to be used in javascript clients running in the browser most of the times an instance of `WebAuth` is needed.

And if you ever need to perform an `xhr` request to Auth0 Authentication API, `WebAuth` exposes an instance of `AuthenticationAPI`

```js
auth0.client.userInfo(accessToken, function(error, userInfo) {
    // User information or error
  });
```

**Added**
- add token validation and signature verification to the parseHash method [\#278](https://github.com/auth0/auth0.js/pull/278) ([glena](https://github.com/glena))
- Add method to signup and login using password-realm [\#277](https://github.com/auth0/auth0.js/pull/277) ([glena](https://github.com/glena))

**Breaking changes**
- Rename methods based on authN and authZ type [\#280](https://github.com/auth0/auth0.js/pull/280) ([glena](https://github.com/glena))

## [v8.0.0-beta.3](https://github.com/auth0/auth0.js/tree/v8.0.0-beta.3) (2016-12-19)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.0.0-beta.3...v8.0.0-beta.3)

**Fixed**
- special handling for popup error responses [\#276](https://github.com/auth0/auth0.js/pull/276) ([glena](https://github.com/glena))


## [v8.0.0-beta.2](https://github.com/auth0/auth0.js/tree/v8.0.0-beta.2) (2016-12-16)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.0.0-beta.2...v8.0.0-beta.2)

**Added**
- Cookie fallback for storage [\#270](https://github.com/auth0/auth0.js/pull/270) ([glena](https://github.com/glena))

**Fixed**
- Return policy attr in errors + responseType validation [\#273](https://github.com/auth0/auth0.js/pull/273) ([glena](https://github.com/glena))


## [v8.0.0-beta.1](https://github.com/auth0/lock/tree/v8.0.0-beta.1) (2016-12-14)
[Full Changelog](https://github.com/auth0/lock/tree/v8.0.0-alpha.2...v8.0.0-beta.1)

**Added**
- Add get user country method for passwordless [\#267](https://github.com/auth0/auth0.js/pull/267) ([glena](https://github.com/glena))
- Login with password realm grant via /oauth/token [\#265](https://github.com/auth0/auth0.js/pull/265) ([glena](https://github.com/glena))

**Changed**
- Add standard fields to parseHash and normalize responses to camelCase [\#261](https://github.com/auth0/auth0.js/pull/261) ([glena](https://github.com/glena))
- Add Whitelist of authorize parameters  [\#258](https://github.com/auth0/auth0.js/pull/258) ([glena](https://github.com/glena))

**Fixed**
- Send cookies on CORS call [\#259](https://github.com/auth0/auth0.js/pull/259) ([glena](https://github.com/glena))

## [v8.0.0-alpha.2](https://github.com/auth0/lock/tree/v8.0.0-alpha.2) (2016-12-05)
[Full Changelog](https://github.com/auth0/lock/tree/v8.0.0-alpha.1...v8.0.0-alpha.2)

**Closed issues**
- redirectUri should not be mandatory in the constructor [\#249](https://github.com/auth0/auth0.js/issues/249)
- responseMode should be part of the constructor params [\#247](https://github.com/auth0/auth0.js/issues/247)
- Check if all the methods accepts the same parames from constructor [\#246](https://github.com/auth0/auth0.js/issues/246)

**Added**
- Preload window for popup signup and login  [\#256](https://github.com/auth0/auth0.js/pull/256) ([glena](https://github.com/glena))
- Quirks mode and deprecations warning [\#255](https://github.com/auth0/auth0.js/pull/255) ([glena](https://github.com/glena))
- Added responseMode, all methods uses the same params from construct, redirectUri is not mandatory [\#253](https://github.com/auth0/auth0.js/pull/253) ([glena](https://github.com/glena))
- Added sso data client [\#251](https://github.com/auth0/auth0.js/pull/251) ([glena](https://github.com/glena))
- V8 Popup mode [\#245](https://github.com/auth0/auth0.js/pull/245) ([glena](https://github.com/glena))
- Added nonce and status to mitigate replay attacks [\#244](https://github.com/auth0/auth0.js/pull/244) ([glena](https://github.com/glena))

**Changed**
- Fix nonce mismatch check [\#254](https://github.com/auth0/auth0.js/pull/254) ([glena](https://github.com/glena))

## [v8.0.0-alpha.1](https://github.com/auth0/lock/tree/v8.0.0-alpha.1) (2016-11-21)
[Full Changelog](https://github.com/auth0/lock/tree/v8.0.0-alpha.1)

**Added**
- Change webauth structure + Allow to abort requests [\#240](https://github.com/auth0/auth0.js/pull/240) ([glena](https://github.com/glena))
- added extra options + snake to camel all the options [\#236](https://github.com/auth0/auth0.js/pull/236) ([glena](https://github.com/glena))
- V8: Signup and passwordless [\#232](https://github.com/auth0/auth0.js/pull/232) ([glena](https://github.com/glena))
- Webauth redirect login/callback [\#231](https://github.com/auth0/auth0.js/pull/231) ([glena](https://github.com/glena))

