# auth0-js

Client Side JavaScript toolkit for Auth0 API.

![Release](https://img.shields.io/github/v/release/auth0/auth0.js)
[![Codecov](https://img.shields.io/codecov/c/github/auth0/auth0.js)](https://codecov.io/gh/auth0/auth0.js)
![Downloads](https://img.shields.io/npm/dw/auth0-js)
[![License](https://img.shields.io/:license-MIT-blue.svg?style=flat)](https://opensource.org/licenses/MIT)
[![CircleCI](https://img.shields.io/circleci/build/github/auth0/auth0.js)](https://circleci.com/gh/auth0/auth0.js)

:books: [Documentation](#documentation) - :rocket: [Getting Started](#getting-started) - :computer: [API Reference](#api-reference) - :speech_balloon: [Feedback](#feedback)

## Documentation

- [Library docs](https://auth0.com/docs/libraries/auth0js) - a complete reference and examples.
- [Sample App](./example/) - a sample application integrated with Auth0.
- [Examples](./EXAMPLES.md) - code samples for common auth0-js authentication scenario's.
- [Docs site](https://www.auth0.com/docs) - explore our docs site and learn more about Auth0.

## Getting started

### Installation

From CDN:

```html
<!-- Latest patch release -->
<script src="https://cdn.auth0.com/js/auth0/9.19.1/auth0.min.js"></script>
```

From [npm](https://npmjs.org):

```sh
npm install auth0-js
```

After installing the `auth0-js` module using [npm](https://npmjs.org), you'll need to bundle it up along with all of its dependencies, or import it using:

```js
import auth0 from 'auth0-js';
```

### Configure the SDK

#### auth0.WebAuth

Provides support for all the authentication flows.

```js
var auth0 = new auth0.WebAuth({
  domain: '{YOUR_AUTH0_DOMAIN}',
  clientID: '{YOUR_AUTH0_CLIENT_ID}'
});
```

#### auth0.Authentication

Provides an API client for the Auth0 Authentication API.

```js
var auth0 = new auth0.Authentication({
  domain: '{YOUR_AUTH0_DOMAIN}',
  clientID: '{YOUR_AUTH0_CLIENT_ID}'
});
```

#### auth0.Management

Provides an API Client for the Auth0 Management API (only methods meant to be used from the client with the user token). You should use an `access_token` with the `https://YOUR_DOMAIN.auth0.com/api/v2/` audience to make this work. For more information, read [the user management section of the Auth0.js documentation](https://auth0.com/docs/libraries/auth0js/v9#user-management).

```js
var auth0 = new auth0.Management({
  domain: '{YOUR_AUTH0_DOMAIN}',
  token: '{ACCESS_TOKEN_FROM_THE_USER}'
});
```

## API reference

### auth0.webAuth

#### constructor(options)

**Parameters**

All parameters can be considered optional unless otherwise stated.

| Option                        | Type              | Description                                                                                                                                                                                                                                                                              |
| :---------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain`                      | string (required) | Your Auth0 account domain such as `'example.auth0.com'` or `'example.eu.auth0.com'`.                                                                                                                                                                                                     |
| `clientID`                    | string (required) | The Client ID found on your Application settings page.                                                                                                                                                                                                                                   |
| `redirectUri`                 | string            | The URL where Auth0 will call back to with the result of a successful or failed authentication. It must be added to the "Allowed Callback URLs" in your Auth0 Application's settings.                                                                                                    |
| `scope`                       | string            | The default scope used for all authorization requests.                                                                                                                                                                                                                                   |
| `audience`                    | string            | The default audience, used if requesting access to an API.                                                                                                                                                                                                                               |
| `responseType`                | string            | Response type for all authentication requests. It can be any space separated list of the values `code`, `token`, `id_token`. **If you don't provide a global `responseType`, you will have to provide a `responseType` for each method that you use**.                                   |
| `responseMode`                | string            | The default responseMode used, defaults to `'fragment'`. The `parseHash` method can be used to parse authentication responses using fragment response mode. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. |
| `_disableDeprecationWarnings` | boolean           | Indicates if deprecation warnings should be output to the browser console, defaults to `false`.                                                                                                                                                                                          |
| `maxAge`                      | number            | Used during token validation. Specifies the maximum elapsed time in seconds since the last time the user was actively authenticated by the authorization server. If the elapsed time is greater than this value, the token is considered invalid and the user must be re-authenticated.  |
| `leeway`                      | number            | Used during ID token validation. Specifies the number of seconds to account for clock skew when validating time-based claims such as `iat` and `exp`. The default is 60 seconds.                                                                                                         |
| `organization`                | string            | The ID of the Organization to log in to (see [Organizations](#organizations))                                                                                                                                                                                                            |
| `invitation`                  | string            | The ID of the user invitation to accept. This is usually used in conjunction with the `organization` parameter, and should be parsed from an invitation URL. (see [Organizations](#organizations))                                                                                       |

#### authorize(options)

Redirects to the `/authorize` endpoint to start an authentication/authorization transaction. Auth0 will call back to your application with the results at the specified `redirectUri`.

**Note:** The default scope for this method is `openid profile email`.

```js
auth0.authorize({
  audience: 'https://mystore.com/api/v2',
  scope: 'read:order write:order',
  responseType: 'token',
  redirectUri: 'https://example.com/auth/callback'
});
```

#### parseHash(options, callback)

Parses a URL hash fragment to extract the result of an Auth0 authentication response.

**Note:** This method requires that your tokens are signed with **RS256** - please read [our documentation on signing algorithms](https://auth0.com/docs/get-started/applications/signing-algorithms) for more information.

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

#### checkSession(options, callback)

Allows you to acquire a new token from Auth0 for a user who already has an SSO session established against Auth0 for your domain. If the user is not authenticated, the authentication result will be empty and you'll receive an error like this: `{error: 'login_required'}`.The method accepts any valid OAuth2 parameters that would normally be sent to `/authorize`.

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

**Important:** If you're not using the hosted login page to do social logins, you have to use your own [social connection keys](https://manage.auth0.com/#/connections/social). If you use Auth0's dev keys, you'll always get `login_required` as an error when calling `checkSession`.

**Important:** Because there is no redirect in this method, `responseType: 'code'` is not supported and will throw an error.

Remember to add the URL where the authorization request originates from to the Allowed Web Origins list of your Auth0 Application in the [Dashboard](https://manage.auth0.com/) under your Applications's **Settings**.

#### client.login(options, callback)

Authenticates a user with username and password in a realm using `/oauth/token`. This will not initialize a SSO session at Auth0, hence can not be used along with silent authentication.

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

**onRedirecting hook**

When using `login` to log in using a username and password, Auth0.js initially makes a call to Auth0 to get a login ticket, before sending that login ticket to the `/authorize` endpoint to be exchanged for tokens. You are able to specify an `onRedirecting` hook here to handle when Auth0.js is about to redirect to the `/authorize` endpoint, for the purposes of executing some custom code (analytics, etc).

To do this, specify the `onRedirecting` function in the options and ensure that the `done` callback is called when you are finished executing your custom code. Otherwise, authentication will be blocked.

```js
auth0.client.login(
  {
    realm: 'Username-Password-Authentication', //connection name or HRD domain
    username: 'info@auth0.com',
    password: 'areallystrongpassword',
    onRedirecting: function(done) {
      // Your custom code here
      done();
    }
  },
  function(err, authResult) {
    // Auth tokens in the result or an error
  }
);
```

### auth0.Authentication

#### buildAuthorizeUrl(options)

Builds and returns the `/authorize` url in order to initialize a new authN/authZ transaction. [https://auth0.com/docs/api/authentication#database-ad-ldap-passive-](https://auth0.com/docs/api/authentication#database-ad-ldap-passive-)

#### buildLogoutUrl(options)

Builds and returns the Logout url in order to initialize a new authN/authZ transaction. [https://auth0.com/docs/api/authentication#logout](https://auth0.com/docs/api/authentication#logout)

#### loginWithDefaultDirectory(options, cb)

Makes a call to the `oauth/token` endpoint with `password` grant type. [https://auth0.com/docs/api-auth/grant/password](https://auth0.com/docs/api-auth/grant/password)

#### login(options, cb)

Makes a call to the `oauth/token` endpoint with `https://auth0.com/oauth/grant-type/password-realm` grant type.

#### oauthToken(options, cb)

Makes a call to the `oauth/token` endpoint.

#### userInfo(token, cb)

Makes a call to the `/userinfo` endpoint and returns the user profile.

### auth0.Management

- **getUser(userId, cb)**: Returns the user profile. [https://auth0.com/docs/api/management/v2#!/Users/get_users_by_id](https://auth0.com/docs/api/management/v2#!/Users/get_users_by_id)
- **patchUserMetadata(userId, userMetadata, cb)**: Updates the user metadata. It will patch the user metadata with the attributes sent. [https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id](https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id)
- **patchUserAttributes(userId, user, cb)**: Updates the user attributes. It will patch the root attributes that the server allows it. To check what attributes can be patched, go to [https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id](https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id)
- **linkUser(userId, secondaryUserToken, cb)**: Link two users. [https://auth0.com/docs/api/management/v2#!/Users/post_identities](https://auth0.com/docs/api/management/v2#!/Users/post_identities)

## Feedback

### Contributing

We appreciate feedback and contribution to this repo! Before you get started, please see the following:

- [Auth0's general contribution guidelines](https://github.com/auth0/open-source-template/blob/master/GENERAL-CONTRIBUTING.md)
- [Auth0's code of conduct guidelines](https://github.com/auth0/open-source-template/blob/master/CODE-OF-CONDUCT.md)

### Raise an issue

To provide feedback or report a bug, please [raise an issue on our issue tracker](https://github.com/auth0/auth0.js/issues).

### Vulnerability Reporting

Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/responsible-disclosure-policy) details the procedure for disclosing security issues.

---

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="./auth0_light_mode.png"   width="150">
    <source media="(prefers-color-scheme: dark)" srcset="./auth0_dark_mode.png" width="150">
    <img alt="Auth0 Logo" src="./auth0_light_mode.png" width="150">
  </picture>
</p>
<p align="center">Auth0 is an easy to implement, adaptable authentication and authorization platform. To learn more checkout <a href="https://auth0.com/why-auth0">Why Auth0?</a></p>
<p align="center">
This project is licensed under the MIT license. See the <a href="./LICENSE"> LICENSE</a> file for more info.</p>
