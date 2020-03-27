![](https://cdn.auth0.com/resources/oss-source-large-2x.png)

# auth0.js

[![Build Status][circleci-image]][circleci-url]
[![NPM version][npm-image]][npm-url]
[![Coverage][codecov-image]][codecov-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

Client Side Javascript toolkit for Auth0 API.

If you want to read the full API documentation of auth0.js, see [here](https://auth0.github.io/auth0.js/index.html).

## Index

1. [Install](#install)
2. [auth0.WebAuth](#auth0webauth)
3. [auth0.Authentication](#auth0authentication)
4. [auth0.Management](#auth0management)
5. [Documentation](#documentation)
6. [Migration](#migration)
7. [Develop](#develop)
8. [Issue Reporting](#issue-reporting)
9. [Author](#author)
10. [License](#license)

## Install

From CDN:

```html
<!-- Latest patch release -->
<script src="https://cdn.auth0.com/js/auth0/9.13.0/auth0.min.js"></script>
```

From [npm](https://npmjs.org):

```sh
npm install auth0-js
```

After installing the `auth0-js` module, you'll need bundle it up along with all of its dependencies.

## auth0.WebAuth

Provides support for all the authentication flows.

### Initialize

```js
var auth0 = new auth0.WebAuth({
  domain: '{YOUR_AUTH0_DOMAIN}',
  clientID: '{YOUR_AUTH0_CLIENT_ID}'
});
```

Parameters:

- **domain {REQUIRED, string}**: Your Auth0 account domain such as `'example.auth0.com'` or `'example.eu.auth0.com'`.
- **clientID {REQUIRED, string}**: The Client ID found on your Application settings page.
- **redirectUri {OPTIONAL, string}**: The URL where Auth0 will call back to with the result of a successful or failed authentication. It must be whitelisted in the "Allowed Callback URLs" in your Auth0 Application's settings.
- **scope {OPTIONAL, string}**: The default scope used for all authorization requests.
- **audience {OPTIONAL, string}**: The default audience, used if requesting access to an API.
- **responseType {OPTIONAL, string}**: Response type for all authentication requests. It can be any space separated list of the values `code`, `token`, `id_token`. **If you don't provide a global `responseType`, you will have to provide a `responseType` for each method that you use**.
- **responseMode {OPTIONAL, string}**: The default responseMode used, defaults to `'fragment'`. The `parseHash` method can be used to parse authentication responses using fragment response mode. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`.
- **\_disableDeprecationWarnings {OPTIONAL, boolean}**: Indicates if deprecation warnings should be output to the browser console, defaults to `false`.
- **maxAge {OPTIONAL, number}**: Used during token validation. Specifies the maximum elapsed time in seconds since the last time the user was actively authenticated by the authorization server. If the elapsed time is greater than this value, the token is considered invalid and the user must be re-authenticated.
- **leeway {OPTIONAL, number}**: Used during ID token validation. Specifies the number of seconds to account for clock skew when validating time-based claims such as `iat` and `exp`. The default is 60 seconds.

### API

- **authorize(options)**: Redirects to the `/authorize` endpoint to start an authentication/authorization transaction.
  Auth0 will call back to your application with the results at the specified `redirectUri`. **The default scope for this method is `openid profile email`**.

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
auth0.parseHash({ hash: window.location.hash }, function(err, authResult) {
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

- **checkSession(options, callback)**: Allows you to acquire a new token from Auth0 for a user who already has an SSO session established against Auth0 for your domain. If the user is not authenticated, the authentication result will be empty and you'll receive an error like this: `{error: 'login_required'}`.The method accepts any valid OAuth2 parameters that would normally be sent to `/authorize`.
  Everything happens inside an iframe, so it will not reload your application or redirect away from it.

```js
auth0.checkSession(
  {
    audience: 'https://mystore.com/api/v2',
    scope: 'read:order write:order'
  },
  function(err, authResult) {
    // Authentication tokens or error
  }
);
```

The contents of `authResult` are identical to those returned by `parseHash()`.

> **Important:** If you're not using the hosted login page to do social logins, you have to use your own [social connection keys](https://manage.auth0.com/#/connections/social). If you use Auth0's dev keys, you'll always get `login_required` as an error when calling `checkSession`.

> **Important:** Because there is no redirect in this method, `responseType: 'code'` is not supported and will throw an error.

Remember to add the URL where the authorization request originates from to the Allowed Web Origins list of your Auth0 Application in the [Dashboard](https://manage.auth0.com/) under your Applications's **Settings**.

- **client.login(options, callback)**: Authenticates a user with username and password in a realm using `/oauth/token`. This will not initialize a SSO session at Auth0, hence can not be used along with silent authentication.

```js
auth0.client.login(
  {
    realm: 'Username-Password-Authentication', //connection name or HRD domain
    username: 'info@auth0.com',
    password: 'areallystrongpassword',
    audience: 'https://mystore.com/api/v2',
    scope: 'read:order write:order'
  },
  function(err, authResult) {
    // Auth tokens in the result or an error
  }
);
```

The contents of `authResult` are identical to those returned by `parseHash()`.

## auth0.Authentication

Provides an API client for the Auth0 Authentication API.

### Initialize

```js
var auth0 = new auth0.Authentication({
  domain: '{YOUR_AUTH0_DOMAIN}',
  clientID: '{YOUR_AUTH0_CLIENT_ID}'
});
```

### API

- **buildAuthorizeUrl(options)**: Builds and returns the `/authorize` url in order to initialize a new authN/authZ transaction. [https://auth0.com/docs/api/authentication#database-ad-ldap-passive-](https://auth0.com/docs/api/authentication#database-ad-ldap-passive-)
- **buildLogoutUrl(options)**: Builds and returns the Logout url in order to initialize a new authN/authZ transaction. [https://auth0.com/docs/api/authentication#logout](https://auth0.com/docs/api/authentication#logout)
- **loginWithDefaultDirectory(options, cb)**: Makes a call to the `oauth/token` endpoint with `password` grant type. [https://auth0.com/docs/api-auth/grant/password](https://auth0.com/docs/api-auth/grant/password)
- **login(options, cb)**: Makes a call to the `oauth/token` endpoint with `https://auth0.com/oauth/grant-type/password-realm` grant type.
- **oauthToken(options, cb)**: Makes a call to the `oauth/token` endpoint.
- **userInfo(token, cb)**: Makes a call to the `/userinfo` endpoint and returns the user profile.

## auth0.Management

Provides an API Client for the Auth0 Management API (only methods meant to be used from the client with the user token). You should use an `access_token` with the `https://YOUR_DOMAIN.auth0.com/api/v2/` audience to make this work. For more information, read [the user management section of the Auth0.js documentation](https://auth0.com/docs/libraries/auth0js/v9#user-management).

### Initialize

```js
var auth0 = new auth0.Management({
  domain: '{YOUR_AUTH0_DOMAIN}',
  token: '{ACCESS_TOKEN_FROM_THE_USER}'
});
```

### API

- **getUser(userId, cb)**: Returns the user profile. [https://auth0.com/docs/api/management/v2#!/Users/get_users_by_id](https://auth0.com/docs/api/management/v2#!/Users/get_users_by_id)
- **patchUserMetadata(userId, userMetadata, cb)**: Updates the user metadata. It will patch the user metadata with the attributes sent. [https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id](https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id)
- **patchUserAttributes(userId, user, cb)**: Updates the user attributes. It will patch the root attributes that the server allows it. To check what attributes can be patched, go to [https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id](https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id)
- **linkUser(userId, secondaryUserToken, cb)**: Link two users. [https://auth0.com/docs/api/management/v2#!/Users/post_identities](https://auth0.com/docs/api/management/v2#!/Users/post_identities)

## Documentation

For a complete reference and examples please check our [docs](https://auth0.com/docs/libraries/auth0js).

## Migration

If you need help migrating to v9, please refer to the [v9 Migration Guide](https://auth0.com/docs/libraries/auth0js/v9/migration-guide).

If you need help migrating to v8, please refer to the [v8 Migration Guide](https://auth0.com/docs/libraries/auth0js/v8/migration-guide).

## Develop

Run `yarn install` to set up the environment.

Run `yarn start` to point your browser to [`https://localhost:3000/`](https://localhost:3000/) to verify the example page works.

Run `yarn test` to run the test suite.

Run `yarn ci:test` to run the tests that ci runs.

Run `yarn test:watch` to run the test suite while you work.

Run `yarn test:coverage` to run the test suite with coverage report.

Run `yarn lint` to run the linter and check code styles.

Run `yarn install && yarn build && yarn test:es-check:es5 && yarn test:es-check:es2015:module` to check for JS incompatibility.

See [.circleci/config.yml](.circleci/config.yml) for additional checks that might be run as part of
[circleci integration tests](https://circleci.com/).

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

For auth0 related questions/support please use the [Support Center](https://support.auth0.com).

## Author

[Auth0](https://auth0.com)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.

<!-- Vaaaaarrrrsss -->

[npm-image]: https://img.shields.io/npm/v/auth0-js.svg?style=flat-square
[npm-url]: https://npmjs.org/package/auth0-js
[circleci-image]: https://img.shields.io/circleci/project/github/auth0/auth0.js.svg?branch=master&style=flat-square
[circleci-url]: https://circleci.com/gh/auth0/auth0.js
[codecov-image]: https://img.shields.io/codecov/c/github/auth0/auth0.js/master.svg?style=flat-square
[codecov-url]: https://codecov.io/github/auth0/auth0.js?branch=master
[license-image]: https://img.shields.io/npm/l/auth0-js.svg?style=flat-square
[license-url]: #license
[downloads-image]: https://img.shields.io/npm/dm/auth0-js.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/auth0-js
