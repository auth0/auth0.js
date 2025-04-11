# Examples using auth0-js

- [Passwordless Login](#passwordless-login)
- [Organizations](#organizations)
- [WebAuth.client.login(options, callback)](#webauthclientloginoptions-callback)
- [Get and use a Refresh token](#get-and-use-a-refresh-token)

## Passwordless Login

For information on how to implement Passwordless Login with this SDK, please read [Passwordless Login on Auth0 Docs](https://auth0.com/docs/libraries/auth0js#passwordless-login).

## Organizations

[Organizations](https://auth0.com/docs/organizations) is a set of features that provide better support for developers who build and maintain SaaS and Business-to-Business (B2B) applications.

### Log in to an organization

To log in to a specific organization, pass the ID, or name, of the organization as the `organization` parameter when creating the `WebAuth` client:

```js
var webAuth = new WebAuth({
  domain: '{YOUR_AUTH0_DOMAIN}',
  clientID: '{YOUR_AUTH0_CLIENT_ID}',
  organization: '{YOUR_AUTH0_ORGANIZATION_ID_OR_NAME}'
});
```

You can also specify an organization when calling `authorize`:

```js
webAuth.authorize({
  organization: '{YOUR_AUTH0_ORGANIZATION_ID_OR_NAME}'
});
```

### Accept user invitations

Accept a user invitation through the SDK by creating a route within your application that can handle the user invitation URL, and log the user in by passing the `organization` and `invitation` parameters from this URL. You can either use `authorize` or `popup.authorize` as needed.

```js
var url = new URL(invitationUrl)
var params = new URLSearchParams(url.search);

if (organization && invitation) {
  webAuth.authorize({
    organization: params.get('organization')
    invitation: params.get('invitation')
  });
}
```

### Storing the organization

When working with organizations, you might want to store the organization to ensure subsequent renewals of tokens using `checkSession` do not lose the context of the last used organization.

```js
auth0.parseHash({}, ({ idTokenPayload }) => {
  var organization = idTokenPayload.org_id || idTokenPayload.org_name;

  // store organization somewhere that persists across page-refreshes
  // - localstorage
  // - cookie
  localStorage.setItem('app_organization', organization);
});
```

With the organization stored in a persistent storage, you want to ensure it's always pulled in from there when calling `checkSession`:

```js
webAuth.checkSession(
  {
    organization: localStorage.setItem('app_organization')
  },
  () => {}
);
```

Additionally, you also want to ensure to read the last used organization when instantiating `WebAuth` on every subsequent page refresh.

```js
var webAuth = new WebAuth({
  domain: '{YOUR_AUTH0_DOMAIN}',
  clientID: '{YOUR_AUTH0_CLIENT_ID}',
  organization: localStorage.setItem('app_organization')
});
```

## WebAuth.client.login(options, callback)

Authenticates a user with username and password in a realm using `/oauth/token`. This will not initialize a SSO session at Auth0, hence can not be used along with silent authentication.

```js
var auth0 = new auth0.WebAuth({
  domain: '{YOUR_AUTH0_DOMAIN}',
  clientID: '{YOUR_AUTH0_CLIENT_ID}'
});

auth0.client.login(
  {
    realm: 'Username-Password-Authentication', //connection name or HRD domain
    username: 'info@auth0.com',
    password: 'areallystrongpassword',
    audience: 'https://mystore.com/api/v2',
    scope: 'read:order write:order'
  },
  function (err, authResult) {
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
    onRedirecting: function (done) {
      // Your custom code here
      done();
    }
  },
  function (err, authResult) {
    // Auth tokens in the result or an error
  }
);
```

## Get and use a Refresh token

How to obtain and generate a refresh_token to use it for getting new access_tokens.

To do this, set `responseType` to `code` when creating the `WebAuth` client:
```js
var webAuth = new auth0.WebAuth({
  domain: '{YOUR_AUTH0_DOMAIN}',
  redirectUri: '{YOUR_REDIRECT_URI}',
  clientID: '{YOUR_CLIENT_ID}',
  responseType: 'code',
});
```

Call `authorize`, add `offline_access` as part of the `scope`:
```js
webAuth.authorize({
  audience: '{THE_AUDIENCE}',
  scope: 'offline_access'
});
```

`code` can be obtained as a string param in the callback

Exchange the obtained `code` to get an `access_token` and the `refresh_token`:
```js
webAuth.client.oauthToken(
  {
    code,
    grantType: 'authorization_code',
    redirectUri: '{YOUR_REDIRECT_URI}',
  }, function(err, result) {
    if (!err) {
      // result.refreshToken
    }
  }
);
```

Use the `refresh_token` to generate `access_token`
```js
webAuth.client.oauthToken(
  {
    grantType: 'refresh_token',
    clientID: '{YOUR_CLIENT_ID}',
    refresh_token: '{THE_REFRESH_TOKEN}',
  }
```
