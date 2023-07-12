# Examples using auth0-js

- [Passwordless Login](#passwordless-login)
- [Organizations](#organizations)
- [WebAuth.client.login(options, callback)](#webauthclientloginoptions-callback)

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
