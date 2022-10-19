![](./banner.png)

![Release](https://img.shields.io/npm/v/auth0-js)
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

- [constructor](https://auth0.github.io/auth0.js/WebAuth.html#WebAuth)
- [authorize(options)](https://auth0.github.io/auth0.js/WebAuth.html#authorize)
- [changePassword(options)](https://auth0.github.io/auth0.js/WebAuth.html#changePassword)
- [checkSession(options, callback)](https://auth0.github.io/auth0.js/WebAuth.html#checkSession)
- [login(options, callback)](https://auth0.github.io/auth0.js/WebAuth.html#login)
- [logout(options)](https://auth0.github.io/auth0.js/WebAuth.html#logout)
- [parseHash(options, callback)](https://auth0.github.io/auth0.js/WebAuth.html#parseHash)
- [passwordlessLogin(options, callback)](https://auth0.github.io/auth0.js/WebAuth.html#passwordlessLogin)
- [passwordlessStart(options, callback)](https://auth0.github.io/auth0.js/WebAuth.html#passwordlessStart)
- [passwordlessVerify(options, callback)](https://auth0.github.io/auth0.js/WebAuth.html#passwordlessVerify)
- [renderCaptcha(element, options, callback)](https://auth0.github.io/auth0.js/WebAuth.html#renderCaptcha)
- [renewAuth(options, callback)](https://auth0.github.io/auth0.js/WebAuth.html#renewAuth)
- [signup(options, callback)](https://auth0.github.io/auth0.js/WebAuth.html#signup)
- [signupAndAuthorize(options, callback)](https://auth0.github.io/auth0.js/WebAuth.html#signupAndAuthorize)
- [validateAuthenticationResponse(options, parsedHash, callback)](https://auth0.github.io/auth0.js/WebAuth.html#validateAuthenticationResponse)

### auth0.Authentication

- [buildAuthorizeUrl(options)](http://localhost:8080/Authentication.html#buildAuthorizeUrl)
- [buildLogoutUrl(options)](http://localhost:8080/Authentication.html#buildLogoutUrl)
- [delegation(options, callback)](http://localhost:8080/Authentication.html#delegation)
- [getChallenge(callback)](http://localhost:8080/Authentication.html#getChallenge)
- [getSSOData(withActiveDirectories, callback)](http://localhost:8080/Authentication.html#getSSOData)
- [login(options, callback)](http://localhost:8080/Authentication.html#login)
- [loginWithDefaultDirectory(options, callback)](http://localhost:8080/Authentication.html#loginWithDefaultDirectory)
- [loginWithResourceOwner(options, callback)](http://localhost:8080/Authentication.html#loginWithResourceOwner)
- [userInfo(token, callback)](http://localhost:8080/Authentication.html#userInfo)

### auth0.Management

- [getUser(userId, callback)](http://localhost:8080/Management.html#getUser)
- [linkUser(userId, secondaryUserId, callback)](http://localhost:8080/Management.html#linkUser)
- [patchUserAttributes(userId, user, callback)](http://localhost:8080/Management.html#patchUserAttributes)
- [patchUserMetadata(userId, userMetadata, callback)](http://localhost:8080/Management.html#patchUserMetadata)

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
