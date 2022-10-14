# Examples using auth0-js

- [Passwordless Login](#passwordless-login)
- [Organizations](#organizations)

## Passwordless Login

For information on how to implement Passwordless Login with this SDK, please read [Passwordless Login on Auth0 Docs](https://auth0.com/docs/libraries/auth0js#passwordless-login).

## Organizations

[Organizations](https://auth0.com/docs/organizations) is a set of features that provide better support for developers who build and maintain SaaS and Business-to-Business (B2B) applications.

### Log in to an organization

To log in to a specific organization, pass the ID of the organization as the `organization` parameter when creating the `WebAuth` client:

```js
var webAuth = new WebAuth({
  domain: '{YOUR_AUTH0_DOMAIN}',
  clientID: '{YOUR_AUTH0_CLIENT_ID}',
  organization: '{YOUR_AUTH0_ORGANIZATION_ID}'
});
```

You can also specify an organization when calling `authorize`:

```js
webAuth.authorize({
  organization: '{YOUR_AUTH0_ORGANIZATION_ID}'
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
