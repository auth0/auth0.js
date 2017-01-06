![](https://cdn.auth0.com/resources/oss-source-large-2x.png)

# auth0.js

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Coverage][codecov-image]][codecov-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

Client Side Javascript toolkit for Auth0 API

## Install

From CDN

```html
<!-- Latest patch release (recommended for production) -->
<script src="http://cdn.auth0.com/js/auth0/8.0.4/auth0.min.js"></script>
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
- **domain {REQUIRED, string}**: Your Auth0 account domain.
- **clientID {REQUIRED, string}**: Your Auth0 client_id.
- **redirectUri {OPTIONAL, string}**: The url used as the redirectUri.
- **scope {OPTIONAL, string}**: The default scope used for all Auth.
- **audience {OPTIONAL, string}**: The default audience used for requesting access to an API.
- **responseType {OPTIONAL, string}**: The default responseType used.
- **responseMode {OPTIONAL, string}**: The default responseMode used.
- **_disableDeprecationWarnings {OPTIONAL, boolean}**: Disables the deprecation warnings, defaults to `false`.

### API

- **authorize(options)**: Redirects to `/authorize` endpoint to start the AuthN/AuthZ transaction. Once finished it will redirect back to yout `redirectUri` with the result of the transaction

```js
auth0.authorize({
  audience: 'https://mystore.com/api/v2',
  scope: 'read:order write:order',
  responseType: 'token',
  redirectUri: 'https://example.com/auth/callback'
});
```

- **parseHash(options, callback)**: Parses the url hash of the redirect Url to extract result of the AuthN/AuthZ transaction.

```js
auth0.parseHash({}, function(err, authResult) {
  if (err) {
    return console.log(err);
  }

  auth0.client.userInfo(authResult.accessToken, function(err, user) {
    // Now you have the user information
  });
});
```

- **renewAuth(options, cb)**: Gets a new token from Auth0 (the user should be authenticated using the hosted login page first)

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

> ***Important:*** this will use postMessage to communicate between the silent callback and the SPA. When false the SDK will attempt to parse the url hash should ignore the url hash and no extra behaviour is needed.

The callback page should be something like the following one. It will parse the url hash and post it to the parent document:

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
      var result = auth0.parseHash(window.location.hash);
      if (result) {
        parent.postMessage(result, "https://example.com/"); //The second parameter should be your domain
      }
    </script>
  </head>
  <body></body>
</html>
```

- **client.login(options, cb)**: Authenticates the user with username & password in a realm using `/oauth/token`. This will not initialize a SSO session in auth0, hence can not be used along with renew auth.

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

- **buildAuthorizeUrl(options)**: Builds and returns the `/authorize` url in order to initialize a new authN/authZ transaction. https://auth0.com/docs/api/authentication#!#get--authorize_db
- **buildLogoutUrl(options)**: Builds and returns the Logout url in order to initialize a new authN/authZ transaction. https://auth0.com/docs/api/authentication#!#get--v2-logout
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



## Develop

Run `npm start` and point your browser to `http://localhost:3000/example` to run the example page.

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

This project is licensed under the MIT license. See the [LICENSE](LICENSE.txt) file for more info.

<!-- Vaaaaarrrrsss -->

[npm-image]: https://img.shields.io/npm/v/auth0-js.svg?style=flat-square
[npm-url]: https://npmjs.org/package/auth0-js
[travis-image]: http://img.shields.io/travis/auth0/auth0.js.svg?branch=v8&style=flat-square
[travis-url]: https://travis-ci.org/auth0/auth0.js
[codecov-image]: https://img.shields.io/codecov/c/github/auth0/auth0.js/v8.svg?style=flat-square
[codecov-url]: https://codecov.io/github/auth0/auth0.js?branch=v8
[license-image]: http://img.shields.io/npm/l/auth0-js.svg?style=flat-square
[license-url]: #license
[downloads-image]: http://img.shields.io/npm/dm/auth0-js.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/auth0-js
