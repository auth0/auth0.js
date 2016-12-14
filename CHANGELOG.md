#Change Log

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

