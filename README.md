# Auth0.js

[![Build Status](https://travis-ci.org/auth0/auth0.js.svg?branch=v8)](https://travis-ci.org/auth0/auth0.js)
[![codecov.io](http://codecov.io/github/auth0/auth0.js/coverage.svg?branch=v8)](http://codecov.io/github/auth0/auth0.js/coverage.svg?branch=v8)

## WebAuth

### Initialize

```js
var auth0 = new auth0.WebAuth({
  domain: "tenant.auth0.com",
  client_id: "..."
});
```

Parameters:
- **domain {REQUIRED, string}**: Your Auth0 account domain
- **client_id {REQUIRED, string}**: Your Auth0 client_id

### API

- **passwordlessStart**
- **redirect.login**
- **redirect.passwordlessVerify**
- **redirect.signup**
- **popup.login**
- **popup.passwordlessVerify**
- **popup.signup**
- **changePassword**
- **parseHash**
- **renewAuth**

## Authentication API

### Initialize

```js
var authentication = new auth0.Authentication({
  domain: "me.auth0.com",
  client_id: "..."
});
```

Parameters:
- **domain {REQUIRED, string}**: Your Auth0 account domain
- **client_id {REQUIRED, string}**: Your Auth0 client_id

### API

- **buildAuthorizeUrl**
- **buildLogoutUrl**
- **ro**
- **passwordless.start**: 
- **passwordless.verify**: 
- **userInfo**: 
- **delelegation**: 
- **dbConnection.signup**: 
- **dbConnection.changePassword**: 

## Management API

### Initialize

```js
var management = new auth0.Management({
  domain: "me.auth0.com",
  token: "..."
});
```

Parameters:
- **domain {REQUIRED, string}**: Your Auth0 account domain
- **token {REQUIRED, string}**: The user token obteined after authentication

### API

- **getUser**:
- **patchUserMetadata**:
- **linkUsers**:
