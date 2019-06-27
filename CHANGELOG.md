
## [v9.11.1](https://github.com/auth0/auth0.js/tree/v9.11.1) (2019-06-27)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.11.0...v9.11.1)

**Fixed**
- Fix nonce error when id_token doesn't have a nonce [\#954](https://github.com/auth0/auth0.js/pull/954) ([luisrudge](https://github.com/luisrudge))

## [v9.11.0](https://github.com/auth0/auth0.js/tree/v9.11.0) (2019-06-25)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.10.4...v9.11.0)

**Added**
- Add method to patch root user attributes [\#949](https://github.com/auth0/auth0.js/pull/949) ([luisrudge](https://github.com/luisrudge))

**Changed**
- Fix/check nonce state hs256 tokens [\#952](https://github.com/auth0/auth0.js/pull/952) ([luisrudge](https://github.com/luisrudge))

**Fixed**
- Ignore syntax errors from popups [\#948](https://github.com/auth0/auth0.js/pull/948) ([luisrudge](https://github.com/luisrudge))

## [v9.10.4](https://github.com/auth0/auth0.js/tree/v9.10.4) (2019-05-24)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.10.3...v9.10.4)

**Fixed**
- Fix checksession success response casing [\#943](https://github.com/auth0/auth0.js/pull/943) ([luisrudge](https://github.com/luisrudge))

## [v9.10.3](https://github.com/auth0/auth0.js/tree/v9.10.3) (2019-05-22)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.10.2...v9.10.3)

## [v9.10.2](https://github.com/auth0/auth0.js/tree/v9.10.2) (2019-04-15)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.10.1...v9.10.2)

**Changed**
- Modify telemetry inside the ULP [\#922](https://github.com/auth0/auth0.js/pull/922) ([luisrudge](https://github.com/luisrudge))

## [v9.10.1](https://github.com/auth0/auth0.js/tree/v9.10.1) (2019-03-18)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.10.0...v9.10.1)

**Fixed**
- Throw nonce error when using HS256 id_tokens [\#913](https://github.com/auth0/auth0.js/pull/913) ([luisrudge](https://github.com/luisrudge))
- Fix different id_token payload casing between authorize and popup.authorize [\#911](https://github.com/auth0/auth0.js/pull/911) ([luisrudge](https://github.com/luisrudge))

## [v9.10.0](https://github.com/auth0/auth0.js/tree/v9.10.0) (2019-01-28)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.9.1...v9.10.0)

**Changed**
- Trim `username`, `email` and `phoneNumber` params in every request [\#895](https://github.com/auth0/auth0.js/pull/895) ([ScottRudiger](https://github.com/ScottRudiger))

## [v9.9.1](https://github.com/auth0/auth0.js/tree/v9.9.1) (2019-01-23)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.9.0...v9.9.1)

**Fixed**
- Don't store transactions when inside the hosted login page [\#899](https://github.com/auth0/auth0.js/pull/899) ([luisrudge](https://github.com/luisrudge))

## [v9.9.0](https://github.com/auth0/auth0.js/tree/v9.9.0) (2019-01-10)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.8.2...v9.9.0)

**Fixed**
- Don't use storage when inside the Universal Login Page [\#889](https://github.com/auth0/auth0.js/pull/889) ([luisrudge](https://github.com/luisrudge))

## [v9.8.2](https://github.com/auth0/auth0.js/tree/v9.8.2) (2018-11-13)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.8.1...v9.8.2)

**Fixed**
- Prevent checkSession to be called without a redirect_uri [\#851](https://github.com/auth0/auth0.js/pull/851) ([ojas360](https://github.com/ojas360))
- Parse file protocol from Url [\#846](https://github.com/auth0/auth0.js/pull/846) ([anion155](https://github.com/anion155))

## [v9.8.1](https://github.com/auth0/auth0.js/tree/v9.8.1) (2018-10-23)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.8.0...v9.8.1)

**Fixed**
- Fixed transaction state not being set to expire in 30 minutes [\#835](https://github.com/auth0/auth0.js/pull/835) ([sayuti-daniel](https://github.com/sayuti-daniel))
- Fix incorrect error wrapping for signup/change password errors [\#829](https://github.com/auth0/auth0.js/pull/829) ([luisrudge](https://github.com/luisrudge))

## [v9.8.0](https://github.com/auth0/auth0.js/tree/v9.8.0) (2018-09-26)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.7.4-beta1...v9.8.0)

**Released**
- Start using cookies instead of localStorage by default [\#817](https://github.com/auth0/auth0.js/pull/817) ([luisrudge](https://github.com/luisrudge))

## [v9.7.4-beta1](https://github.com/auth0/auth0.js/tree/v9.7.4-beta1) (2018-08-28)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.7.3...v9.7.4-beta1)

**Changed**
- Start using cookies instead of localStorage by default [\#817](https://github.com/auth0/auth0.js/pull/817) ([luisrudge](https://github.com/luisrudge))

## [v9.7.3](https://github.com/auth0/auth0.js/tree/v9.7.3) (2018-07-23)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.7.3-beta1...v9.7.3)

**Fixed**
- Fix npm module export [\#808](https://github.com/auth0/auth0.js/pull/808) ([luisrudge](https://github.com/luisrudge))

## [v9.7.3-beta1](https://github.com/auth0/auth0.js/tree/v9.7.3-beta1) (2018-07-18)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.7.2...v9.7.3-beta1)

**Fixed**
- Fix npm module export [\#808](https://github.com/auth0/auth0.js/pull/808) ([luisrudge](https://github.com/luisrudge))
  - We're testing the new module export to make sure we restore the previous behavior before committing to a patch fix

## [v9.7.2](https://github.com/auth0/auth0.js/tree/v9.7.2) (2018-07-13)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.7.1...v9.7.2)

**Fixed**
- Fix default export for auth0js [\#803](https://github.com/auth0/auth0.js/pull/803) ([luisrudge](https://github.com/luisrudge))

## [v9.7.1](https://github.com/auth0/auth0.js/tree/v9.7.1) (2018-07-13)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.7.0...v9.7.1)

**Fixed**
- Fix build folder not being published in the tag [\#801](https://github.com/auth0/auth0.js/pull/801) ([luisrudge](https://github.com/luisrudge))

## [v9.7.0](https://github.com/auth0/auth0.js/tree/v9.7.0) (2018-07-12)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.6.1...v9.7.0)

**Added**
- Add SRI hashes to the cdn [\#782](https://github.com/auth0/auth0.js/pull/782) ([luisrudge](https://github.com/luisrudge))

**Fixed**
- options is optional in WebAuth.prototype.authorize [\#789](https://github.com/auth0/auth0.js/pull/789) ([behrangsa](https://github.com/behrangsa))
- Removing `domain` option from methods (it can't be overridden) [\#781](https://github.com/auth0/auth0.js/pull/781) ([luisrudge](https://github.com/luisrudge))

## [v9.6.1](https://github.com/auth0/auth0.js/tree/v9.6.1) (2018-06-07)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.6.0...v9.6.1)

**Fixed**
- Remove global from window helpers [\#764](https://github.com/auth0/auth0.js/pull/764) ([fetis](https://github.com/fetis))

## [v9.6.0](https://github.com/auth0/auth0.js/tree/v9.6.0) (2018-05-28)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.5.1...v9.6.0)

**Changed**
- Added `access_type` and `display` to the parameters-whitelist [\#760](https://github.com/auth0/auth0.js/pull/760) ([lordnox](https://github.com/lordnox))

**Fixed**
- Clear local state when checkSession call fails [\#758](https://github.com/auth0/auth0.js/pull/758) ([luisrudge](https://github.com/luisrudge))

## [v9.5.1](https://github.com/auth0/auth0.js/tree/v9.5.1) (2018-04-28)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.5.0...v9.5.1)

**Fixed**
- Prevent using window object on initialize [\#746](https://github.com/auth0/auth0.js/pull/746) ([luisrudge](https://github.com/luisrudge))

## [v9.5.0](https://github.com/auth0/auth0.js/tree/v9.5.0) (2018-04-24)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.4.2...v9.5.0)

**Added**
- Add transaction manager to passwordlessLogin and login [\#731](https://github.com/auth0/auth0.js/pull/731) ([luisrudge](https://github.com/luisrudge))
- Add error message when there is no access_token and id_token is HS256 [\#727](https://github.com/auth0/auth0.js/pull/727) ([luisrudge](https://github.com/luisrudge))

**Fixed**
- Fix storing values when DOM storage is not available [\#737](https://github.com/auth0/auth0.js/pull/737) ([luisrudge](https://github.com/luisrudge))
- getSSOData should call /ssodata from the ULP [\#733](https://github.com/auth0/auth0.js/pull/733) ([luisrudge](https://github.com/luisrudge))
- Return /userinfo error inside the token validation callback [\#724](https://github.com/auth0/auth0.js/pull/724) ([luisrudge](https://github.com/luisrudge))

## [v9.4.2](https://github.com/auth0/auth0.js/tree/v9.4.2) (2018-03-28)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.4.1...v9.4.2)

**Added**
- Add jwksURI override option [\#717](https://github.com/auth0/auth0.js/pull/717) ([luisrudge](https://github.com/luisrudge))

## [v9.4.1](https://github.com/auth0/auth0.js/tree/v9.4.1) (2018-03-22)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.4.0...v9.4.1)

**Fixed**
- Don't validate access_token when there is no payload.at_hash claim [\#718](https://github.com/auth0/auth0.js/pull/718) ([luisrudge](https://github.com/luisrudge))

## [v9.4.0](https://github.com/auth0/auth0.js/tree/v9.4.0) (2018-03-22)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.3.4...v9.4.0)

**Added**
- Adding access_token validation for RS256 id_token's [\#709](https://github.com/auth0/auth0.js/pull/709) ([luisrudge](https://github.com/luisrudge))

## [v9.3.4](https://github.com/auth0/auth0.js/tree/v9.3.4) (2018-03-21)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.3.3...v9.3.4)

**Added**
- Add flag __enableIdPInitiatedLogin to enable idp initiated logins [\#708](https://github.com/auth0/auth0.js/pull/708) ([luisrudge](https://github.com/luisrudge))

## [v9.3.3](https://github.com/auth0/auth0.js/tree/v9.3.3) (2018-03-09)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.3.2...v9.3.3)

**Added**
- Add __enableImpersonation flag to enable impersonation again [\#689](https://github.com/auth0/auth0.js/pull/689) ([luisrudge](https://github.com/luisrudge))

**Fixed**
- Use CookieStorage when accessing localStorage throws an error [\#698](https://github.com/auth0/auth0.js/pull/698) ([luisrudge](https://github.com/luisrudge))
- Remove `email` param in cross auth login [\#692](https://github.com/auth0/auth0.js/pull/692) ([luisrudge](https://github.com/luisrudge))
- Add audience:/userinfo to getSSOData checkSession call [\#688](https://github.com/auth0/auth0.js/pull/688) ([luisrudge](https://github.com/luisrudge))

## [v9.3.2](https://github.com/auth0/auth0.js/tree/v9.3.2) (2018-03-02)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.3.1...v9.3.2)

**Fixed**
- Adding legacy error handling for co/auth endpoint [\#685](https://github.com/auth0/auth0.js/pull/685) ([luisrudge](https://github.com/luisrudge))

## [v9.3.1](https://github.com/auth0/auth0.js/tree/v9.3.1) (2018-02-28)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.3.0...v9.3.1)

## [v9.3.0](https://github.com/auth0/auth0.js/tree/v9.3.0) (2018-02-22)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.2.3...v9.3.0)

**Fixed**
- Fix CSRF vulnerability when `hash.state` is empty. Please read more about it [here](https://github.com/auth0/auth0.js/blob/master/SECURITY-NOTICE.md) and [here](https://auth0.com/docs/security/bulletins/cve-2018-7307). [\#673](https://github.com/auth0/auth0.js/pull/673) ([luisrudge](https://github.com/luisrudge))
- Use WinChan on popup.callback again + adding origin check to keep it secure [\#669](https://github.com/auth0/auth0.js/pull/669) ([luisrudge](https://github.com/luisrudge))
- Fixed error handling for auth in popup mode [\#668](https://github.com/auth0/auth0.js/pull/668) ([luisrudge](https://github.com/luisrudge))
- Fix inconsistent cross origin error handling [\#667](https://github.com/auth0/auth0.js/pull/667) ([luisrudge](https://github.com/luisrudge))

## [v9.2.3](https://github.com/auth0/auth0.js/tree/v9.2.3) (2018-02-14)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.2.2...v9.2.3)

**Changed**
- Use webAuth.login when calling signupAndLogin to support Universal Login Page [\#664](https://github.com/auth0/auth0.js/pull/664) ([luisrudge](https://github.com/luisrudge))

**Fixed**
- Fix federated param [\#661](https://github.com/auth0/auth0.js/pull/661) ([luisrudge](https://github.com/luisrudge))

## [v9.2.2](https://github.com/auth0/auth0.js/tree/v9.2.2) (2018-02-08)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.2.1...v9.2.2)

**Fixed**
- Making Authentication constructor accept one or two params [\#657](https://github.com/auth0/auth0.js/pull/657) ([luisrudge](https://github.com/luisrudge))

## [v9.2.1](https://github.com/auth0/auth0.js/tree/v9.2.1) (2018-02-05)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.2.0...v9.2.1)

**Fixed**
- Remove origin check from checkSession when redirectUri is empty [\#653](https://github.com/auth0/auth0.js/pull/653) ([luisrudge](https://github.com/luisrudge))

## [v9.2.0](https://github.com/auth0/auth0.js/tree/v9.2.0) (2018-02-01)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.1.3...v9.2.0)

**Added**
- Normalized login and passwordlessLogin usage to make it work in embedded and hosted scenarios [\#646](https://github.com/auth0/auth0.js/pull/646) ([luisrudge](https://github.com/luisrudge))

## [v9.1.3](https://github.com/auth0/auth0.js/tree/v9.1.3) (2018-01-29)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.1.2...v9.1.3)

**Fixed**
- Use origin.port when available [\#641](https://github.com/auth0/auth0.js/pull/641) ([luisrudge](https://github.com/luisrudge))

## [v9.1.2](https://github.com/auth0/auth0.js/tree/v9.1.2) (2018-01-26)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.1.1...v9.1.2)

**Fixed**
- Fixing ie/edge `window.location.origin` issue [\#638](https://github.com/auth0/auth0.js/pull/638) ([luisrudge](https://github.com/luisrudge))

## [v9.1.1](https://github.com/auth0/auth0.js/tree/v9.1.1) (2018-01-24)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.1.0...v9.1.1)

**Fixed**
- Fix undefined origin in popup mode [\#635](https://github.com/auth0/auth0.js/pull/635) ([luisrudge](https://github.com/luisrudge))

## [v9.1.0](https://github.com/auth0/auth0.js/tree/v9.1.0) (2018-01-16)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.0.3...v9.1.0)

**Changed**
- Validate current window origin and redirecturi origin to prevent mismatches [\#615](https://github.com/auth0/auth0.js/pull/615) ([luisrudge](https://github.com/luisrudge))

## [v9.0.3](https://github.com/auth0/auth0.js/tree/v9.0.3) (2018-01-15)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.0.2...v9.0.3)

**Fixed**
- Use window.location.origin instead of window.origin [\#627](https://github.com/auth0/auth0.js/pull/627) ([thoean](https://github.com/thoean))
- Do not consider a load event valid if protocol is "about:" [\#619](https://github.com/auth0/auth0.js/pull/619) ([damien-gl](https://github.com/damien-gl))

## [v9.0.2](https://github.com/auth0/auth0.js/tree/v9.0.2) (2017-12-29)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.0.1...v9.0.2)

**Fixed**
- Blacklisting invalid params in authorize url [\#611](https://github.com/auth0/auth0.js/pull/611) ([luisrudge](https://github.com/luisrudge))

## [v9.0.1](https://github.com/auth0/auth0.js/tree/v9.0.1) (2017-12-26)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.0.0...v9.0.1)

**Changed**
- setting getSSOData timeout to 5s [\#602](https://github.com/auth0/auth0.js/pull/602) ([luisrudge](https://github.com/luisrudge))

## [v9.0.0](https://github.com/auth0/auth0.js/tree/v9.0.0) (2017-12-21)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v9.0.0-beta.9...v8.10.1)

**Breaking change**
Auth0.js v9 uses our latest embedded login API. This version removes API calls to `usernamepassword/login` and `user/ssodata` and **is not supported in centralized login scenarios (i.e. Hosted Login Pages).** If you are using a Hosted Login Page, keep using Auth0.js v8.

The scenarios below use a mix of Cross Origin Authentication and `WebAuth.checkSession`. Read more about Cross Origin Authentication and how to enable Web Origins [here](https://auth0.com/docs/cross-origin-authentication).

We wrote a [Migration Guide](https://auth0.com/docs/libraries/auth0js/v9/migration-guide) to make upgrading your app easy. If you need help, please reach out to our amazing support team at https://support.auth0.com.

**Breaking change**
`WebAuth.client.getSSOData` now uses `WebAuth.checkSession` and a local cache to obtain the resulting data.

**Breaking change**
`WebAuth.client.loginWithCredentials` now uses Cross Origin Authentication to handle authentication requests.

**Breaking change**
`WebAuth.client.signupAndLogin` now uses Cross Origin Authentication to handle the authentication request after the signup.

**Breaking change**
`WebAuth.popup.loginWithCredentials` now uses Cross Origin Authentication and `WebAuth.checkSession` to handle authentication requests without making a page redirect.


## [v8.10.1](https://github.com/auth0/auth0.js/tree/v8.10.1) (2017-09-19)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.10.0...v8.10.1)

**Changed**
- Removing renewSession and keeping only checkSession [\#505](https://github.com/auth0/auth0.js/pull/505) ([luisrudge](https://github.com/luisrudge))

## [v8.10.0](https://github.com/auth0/auth0.js/tree/v8.10.0) (2017-09-18)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.9.3...v8.10.0)

**Added**
- Adding web_message flow [\#500](https://github.com/auth0/auth0.js/pull/500) ([luisrudge](https://github.com/luisrudge))

**Fixed**
- Fixing tenant override in popup mode [\#501](https://github.com/auth0/auth0.js/pull/501) ([luisrudge](https://github.com/luisrudge))
- Allow overriding the timeout as part of the renewAuth method [\#497](https://github.com/auth0/auth0.js/pull/497) ([dctoon](https://github.com/dctoon))

## [v8.9.3](https://github.com/auth0/auth0.js/tree/v8.9.3) (2017-08-21)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.9.2...v8.9.3)

**Fixed**
- Using transaction manager on passwordlessStart [\#492](https://github.com/auth0/auth0.js/pull/492) ([luisrudge](https://github.com/luisrudge))

## [v8.9.2](https://github.com/auth0/auth0.js/tree/v8.9.2) (2017-08-17)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.9.1...v8.9.2)

**Fixed**
- Fix passwordlessVerify not sending nonce [\#489](https://github.com/auth0/auth0.js/pull/489) ([luisrudge](https://github.com/luisrudge))

## [v8.9.1](https://github.com/auth0/auth0.js/tree/v8.9.1) (2017-08-11)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.9.0...v8.9.1)

**Fixed**
- Fixed credentialType url [\#487](https://github.com/auth0/auth0.js/pull/487) ([luisrudge](https://github.com/luisrudge))

## [v8.9.0](https://github.com/auth0/auth0.js/tree/v8.9.0) (2017-08-10)
[Full Changelog](https://github.com/auth0/auth0.js/compare/v8.8.0...v8.9.0)

**Added**
- Add flag to retry requests [\#484](https://github.com/auth0/auth0.js/pull/484) ([luisrudge](https://github.com/luisrudge))
- Add cross-origin-auth support to Passwordless [\#482](https://github.com/auth0/auth0.js/pull/482) ([luisrudge](https://github.com/luisrudge))

**Changed**
- Avoid snake casing of metadata on signup [\#475](https://github.com/auth0/auth0.js/pull/475) ([hzalaz](https://github.com/hzalaz))

**Fixed**
- Send empty verifier when can't access sessionStorage [\#470](https://github.com/auth0/auth0.js/pull/470) ([luisrudge](https://github.com/luisrudge))

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
- Added flag to disable id_token verification for legacy Auth0 Applications [\#341](https://github.com/auth0/auth0.js/pull/341) ([glena](https://github.com/glena))
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

