![](https://cdn.auth0.com/resources/oss-source-large-2x.png)

# auth0.js

[![Build Status][circleci-image]][circleci-url]
[![NPM version][npm-image]][npm-url]
[![Coverage][codecov-image]][codecov-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

Client Side Javascript toolkit for Auth0 API

> We recommend using auth0.js v8 if you need to use [API Auth](https://auth0.com/docs/api-auth) features. For auth0.js v7 code please check the [v7 branch](https://github.com/auth0/auth0.js/tree/v7), this version will be supported and maintained alongside v8.

Need help migrating from v7? Please check our [Migration Guide](https://auth0.com/docs/libraries/auth0js/v8/migration-guide)

## Install

From CDN

```html
<!-- Latest patch release (recommended for production) -->
<script src="http://cdn.auth0.com/js/auth0/8.8.0/auth0.min.js"></script>
```

From [bower](http://bower.io)

```sh
bower install auth0-lock
```

```html
<script src="bower_components/auth0.js/build/auth0.min.js"></script>
```

From [npm](https://npmjs.org)

```sh
npm install auth0-js
```

After installing the `auth0-js` module, you'll need bundle it up along with all of its dependencies.

## auth0.WebAuth

Provides support for all the authentication flows

### Initialize

```js
var auth0 = new auth0.WebAuth({
  domain: "{YOUR_AUTH0_DOMAIN}",
  clientID: "{YOUR_AUTH0_CLIENT_ID}"
});
```

Parameters:
- **domain {REQUIRED, string}**: Your Auth0 account domain such as `'example.auth0.com'` or `'example.eu.auth0.com'`.
- **clientID {REQUIRED, string}**: Your Auth0 client ID.
- **redirectUri {OPTIONAL, string}**: The URL where Auth0 will call back to with the result of a successful or failed authentication. It must be whitelisted in the "Allowed Callback URLs" in your Auth0 client's settings.
- **scope {OPTIONAL, string}**: The default scope used for all authorization requests.
- **audience {OPTIONAL, string}**: The default audience, used if requesting access to an API.
- **responseType {OPTIONAL, string}**: Response type for all authentication requests. Defaults to `'token'`. It can be any space separated list of the values `code`, `token`, `id_token`.
- **responseMode {OPTIONAL, string}**: The default responseMode used, defaults to `'fragment'`. The `parseHash` method can be used to parse authentication responses using fragment response mode. Supported values are `query`, `fragment` and `form_post`.
- **_disableDeprecationWarnings {OPTIONAL, boolean}**: Disables the deprecation warnings, defaults to `false`.

### API

- **authorize(options)**: Redirects to the `/authorize` endpoint to start an authentication/authorization transaction.
Auth0 will call back to your application with the results at the specified `redirectUri`.

```js
auth0.authorize({
  audience: 'https://mystore.com/api/v2',
  scope: 'read:order write:order',
  responseType: 'token',
  redirectUri: 'https://example.com/auth/callback'
});
```

- **parseHash(options, callback)**: Parses a URL hash fragment to extract the result of an Auth0 authentication response.

> This method requires that your tokens are signed with **RS256**. Please check our [Migration Guide](https://auth0.com/docs/libraries/auth0js/v8/migration-guide#switching-from-hs256-to-rs256) for more information.

```js
auth0.parseHash(window.location.hash, function(err, authResult) {
  if (err) {
    return console.log(err);
  }

  // The contents of authResult depend on which authentication parameters were used.
  // It can include the following:
  // authResult.accessToken - access token for the API specified by `audience`
  // authResult.expiresIn - string with the access token's expiration time in seconds
  // authResult.idToken - ID token JWT containing user profile information

  auth0.client.userInfo(authResult.accessToken, function(err, user) {
    // Now you have the user's information
  });
});
```

- **renewAuth(options, callback)**: Attempts to get a new token from Auth0 by using [silent authentication](https://auth0.com/docs/api-auth/tutorials/silent-authentication), or invokes `callback` with an error if the user does not have an active SSO session at your Auth0 domain.

This method can be used to detect a locally unauthenticated user's SSO session status, or to renew an authenticated user's access token.
The actual redirect to `/authorize` happens inside an iframe, so it will not reload your application or redirect away from it.

```js
auth0.renewAuth({
  audience: 'https://mystore.com/api/v2',
  scope: 'read:order write:order',
  redirectUri: 'https://example.com/auth/silent-callback',

  // this will use postMessage to comunicate between the silent callback
  // and the SPA. When false the SDK will attempt to parse the url hash
  // should ignore the url hash and no extra behaviour is needed.
  usePostMessage: true
  }, function (err, authResult) {
    // Renewed tokens or error
});
```

The contents of `authResult` are identical to those returned by `parseHash()`.
For this request to succeed, the user must have an active SSO session at Auth0 by having logged in through the [hosted login page](https://manage.auth0.com/#/login_page) of your Auth0 domain.

> ***Important:*** this will use postMessage to communicate between the silent callback and the SPA. When false the SDK will attempt to parse the url hash should ignore the url hash and no extra behaviour is needed.

> **Also important:** If you're not using the hosted login page to do social logins, you have to use your own [social connection keys](https://manage.auth0.com/#/connections/social). If you use Auth0's dev keys, you'll always get `login_required` as an error when calling `renewAuth`.

It is strongly recommended to have a dedicated callback page for silent authentication in order to avoid loading your entire application again inside an iframe.
This callback page should only parse the URL hash and post it to the parent document so that your application can take action depending on the outcome of the silent authentication attempt.
For example:

```js
<!DOCTYPE html>
<html>
  <head>
    <script src="/auth0.js"></script>
    <script type="text/javascript">
      var auth0 = new auth0.WebAuth({
        domain: '{YOUR_AUTH0_DOMAIN}',
        clientID: '{YOUR_AUTH0_CLIENT_ID}'
      });
      auth0.parseHash(window.location.hash, function (err, result) {
        parent.postMessage(err || result, 'https://example.com/');
      });
    </script>
  </head>
  <body></body>
</html>
```

Remember to add the URL of the silent authentication callback page to the "Allowed Callback URLs" list of your Auth0 client.

- **client.login(options, callback)**: Authenticates a user with username and password in a realm using `/oauth/token`. This will not initialize a SSO session at Auth0, hence can not be used along with silent authentication.

```js
auth0.client.login({
  realm: 'Username-Password-Authentication', //connection name or HRD domain
  username: 'info@auth0.com',
  password: 'areallystrongpassword',
  audience: 'https://mystore.com/api/v2',
  scope: 'read:order write:order',
  }, function(err, authResult) {
    // Auth tokens in the result or an error
});
```

The contents of `authResult` are identical to those returned by `parseHash()`.

## auth0.Authentication

Provides an API client for the Auth0 Authentication API.

### Initialize

```js
var auth0 = new auth0.Authentication({
  domain: "{YOUR_AUTH0_DOMAIN}",
  clientID: "{YOUR_AUTH0_CLIENT_ID}"
});
```

### API

- **buildAuthorizeUrl(options)**: Builds and returns the `/authorize` url in order to initialize a new authN/authZ transaction. https://auth0.com/docs/api/authentication#database-ad-ldap-passive-
- **buildLogoutUrl(options)**: Builds and returns the Logout url in order to initialize a new authN/authZ transaction. https://auth0.com/docs/api/authentication#logout
- **loginWithDefaultDirectory(options, cb)**: Makes a call to the `oauth/token` endpoint with `password` grant type. https://auth0.com/docs/api-auth/grant/password
- **login(options, cb)**: Makes a call to the `oauth/token` endpoint with `http://auth0.com/oauth/grant-type/password-realm` grant type.
- **oauthToken(options, cb)**: Makes a call to the `oauth/token` endpoint.
- **userInfo(token, cb)**: Makes a call to the `/userinfo` endpoint and returns the user profile.

## auth0.Management

Provides an API Client for the Auth0 Management API (only methods meant to be used from the client with the user token).

### Initialize

```js
var auth0 = new auth0.Management({
  domain: "{YOUR_AUTH0_DOMAIN}",
  token: "{YOUR_AUTH0_API_TOKEN}"
});
```

### API

- **getUser(userId, cb)**: Returns the user profile. https://auth0.com/docs/api/management/v2#!/Users/get_users_by_id
- **patchUserMetadata(userId, userMetadata, cb)**: Updates the user metdata. It will patch the user metdata with the attributes sent. https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id
- **linkUser(userId, secondaryUserToken, cb)**: Link two users. https://auth0.com/docs/api/management/v2#!/Users/post_identities

## Documentation

For a complete reference and examples please check our [docs](https://auth0.com/docs/libraries/auth0js) and our [Migration Guide](https://auth0.com/docs/libraries/auth0js/v8/migration-guide) if you need help to migrate from v7

## Develop

Run `npm start` and point your browser to `https://localhost:3000/example` to run the example page.

Run `npm run test` to run the test suite.

Run `npm run test:watch` to run the test suite while you work.

Run `npm run test:coverage` to run the test suite with coverage report.

Run `npm run lint` to run the linter and check code styles.

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

For auth0 related questions/support please use the [Support Center](https://support.auth0.com).

## Author

[Auth0](auth0.com)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.

<!-- Vaaaaarrrrsss -->

[npm-image]: https://img.shields.io/npm/v/auth0-js.svg?style=flat-square
[npm-url]: https://npmjs.org/package/auth0-js
[circleci-image]: http://img.shields.io/circleci/project/github/auth0/auth0.js.svg?branch=master&style=flat-square
[circleci-url]: https://circleci.com/gh/auth0/auth0.js
[codecov-image]: https://img.shields.io/codecov/c/github/auth0/auth0.js/v8.svg?style=flat-square
[codecov-url]: https://codecov.io/github/auth0/auth0.js?branch=v8
[license-image]: http://img.shields.io/npm/l/auth0-js.svg?style=flat-square
[license-url]: #license
[downloads-image]: http://img.shields.io/npm/dm/auth0-js.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/auth0-js
