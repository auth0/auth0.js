![](https://cdn.auth0.com/resources/oss-source-large-2x.png)

# Auth0.js
[![NPM version][npm-image]][npm-url]
[![Build status][strider-image]][strider-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[Auth0](http://auth0.com) is an authentication broker that supports social identity providers as well as enterprise identity providers such as Active Directory, LDAP, Office365, Google Apps, Salesforce.

Auth0.js is a client-side library for [Auth0](http://auth0.com). It allows you to trigger the authentication process and parse the [JWT](http://openid.net/specs/draft-jones-json-web-token-07.html) (JSON web token) with just the Auth0 `clientID`. Once you have the JWT you can use it to authenticate requests to your http API and validate the JWT in your server-side logic with the `clientSecret`.

## Example

The example directory has a ready-to-go app. In order to run it you need [node](http://nodejs.org/) installed, download dependencies with `npm install`, then execute `npm run example` from the root of this project.

## Usage

Take `auth0.js` or `auth0.min.js` from the `/build` directory and import it to your page.

If you are using [browserify](http://browserify.org/) install with `npm i auth0-js --production --save`.

> Note: The following examples use jQuery, but auth0.js is not tied to jQuery and any library can be used with it.

### Initialize:

Construct a new instance of the Auth0 client as follows:

```html
<script src="//cdn.auth0.com/w2/auth0-6.js"></script>
<script type="text/javascript">
  var auth0 = new Auth0({
    domain:       'mine.auth0.com',
    clientID:     'dsa7d77dsa7d7',
    callbackURL:  'http://my-app.com/callback',
    callbackOnLocationHash: true
  });

  //...
</script>
```

### Login:

This method can be called as indifferently as `signin` or `login`.
Triggers the login on any of your active identity provider as follows:

```js
  //trigger login with google
  $('.login-google').click(function () {
    auth0.login({
      connection: 'google-oauth2'
    });
  });

  //trigger login with github
  $('.login-github').click(function () {
    auth0.login({
      connection: 'github'
    });
  });

  //trigger login with an enterprise connection
  $('.login-microsoft').click(function () {
    auth0.login({
      connection: 'contoso.com'
    });
  });

  //trigger login with a db connection
  $('.login-dbconn').click(function () {
    auth0.login({
      connection: 'db-conn',
      username:   $('.username').val(),
      password:   $('.password').val(),
    });
  });

  //trigger login with a db connection and avoid the redirect (best experience for SPA)
  $('.login-dbconn').click(function () {
    auth0.login({
      connection: 'db-conn',
      username:   $('.username').val(),
      password:   $('.password').val(),
    },
    function (err, profile, id_token, access_token) {
      // store in cookies
    });
  });

  //trigger login popup with google
  $('.login-google-popup').click(function (e) {
    e.preventDefault();
    auth0.login({
      connection: 'google-oauth2',
      popup: true,
      popupOptions: {
        width: 450,
        height: 800
      }
    }, function(err, profile, id_token, access_token, state) {
      if (err) {
        alert("something went wrong: " + err.message);
        return;
      }
      alert('hello ' + profile.name);
    });
  });
```

You can also request scopes that are not were not configured for the connection.

```js
  //trigger login requesting additional scopes with google
  $('.login-google').click(function () {
    auth0.login({
      connection: 'google-oauth2',
      connection_scope: ['https://www.googleapis.com/auth/orkut', 'https://picasaweb.google.com/data/']
    });
  });

  // alternatively a comma separated list also works
  $('.login-google').click(function () {
    auth0.login({
      connection: 'google-oauth2',
      connection_scope: 'https://www.googleapis.com/auth/orkut,https://picasaweb.google.com/data/'
    });
  });
```

Trigger the login with offline mode support to get the `refresh_token`

```js
$('.login-dbconn').click(function () {
    auth0.login({
      connection: 'db-conn',
      username:   $('.username').val(),
      password:   $('.password').val(),
      scope: 'openid offline_access'
    },
    function (err, profile, id_token, access_token, state, refresh_token) {
      // store in cookies
      // refresh_token is sent because offline_access is set as a scope
    });
  });
```

### Passwordless authentication

Passwordless authentication allows users to log in by receiving a one-time password via email or text message.

#### With Email

Once you have configured a passwordless `email` connection, you can request a link to be sent via email that will allow the receiver to sign in to your application.

```js
$('.request-email-link').click(function (ev) {
  ev.preventDefault();

  auth0.startPasswordless({ email: $('.email-input').val() }, function (err) {
    if (err) {
      alert(err.error_description);
      return;
    }
    // the request was successful and you should receive
    // an email with the link at the specified address
  });
});
```

#### With SMS

First you must activate and configure your passwordless [Twilio](https://twilio.com) connection in our [dashboard](https://manage.auth0.com/#/connections/passwordless).

After that you can request a passcode to be sent via SMS to a phone number. Ensure the phone number has the proper [full-length format](https://www.twilio.com/help/faq/phone-numbers/how-do-i-format-phone-numbers-to-work-internationally) `phoneNumber`.

```js
// request a passcode sent via sms to `phoneNumber`
// using Twilio's configured connection
$('.request-sms-code').click(function (ev) {
  ev.preventDefault();

  auth0.startPasswordless({
    phoneNumber: $('.phone-input').val()
  }, function (err) {
    if (err) {
      alert(err.error_description);
      return;
    }
    // the request was successful and you should
    // receive the passcode to the specified phone
  });
});
```

Once you receive the code you follow using `.login()` to authenticate the user using `phone` and `passcode`.

```js
//submit the passcode to authenticate the phone
$('.submit-sms-code').click(function (ev) {
  ev.preventDefault();

  auth0.login({
    phone: $('.phone-input').val(),
    passcode: $('.sms-code-input').val()
  }, function (err, profile, id_token, access_token, state, refresh_token) {
    if (err) {
      alert("something went wrong: " + err.message);
      return;
    }
    console.log(profile, id_token, access_token, state, refresh_token);
  });
});
```

### Processing the Callback

How does control return back to your app after a login has been attempted?  This all depends on which "mode" you choose to use (**Redirect** or **Popup**) and in some cases, which type of connection you're using.

#### Redirect Mode

The default mode of the `login` method is Redirect Mode.  Here two separate "redirect" actions will occur when `login` is called.  First, Auth0 will navigate the browser to a separate login page to collect the user's credentials.  Then, if the user successfully logs in, Auth0 will redirect the user back to your application via the `callbackURL`.

For example, let's say you've initialized your Auth0 client as shown in the [Initialize](#initialize) section above.  Then the following call to `login` using your `google-oauth2` social connection would result in a redirect to a Google login page and then a redirect back to `http://my-app.com/callback` if successful:

```js
auth0.login({
  connection: 'google-oauth2'
});
```

##### Single Page Apps

If you're building a SPA (Single Page Application) and using Redirect Mode, then your `callbackURL` should send the user back to the same page.  The URL that gets called will also have a URL hash containing an `access_token` and the JWT (`id_token`).  These items are in the hash because the `callbackOnLocationHash` initialization option was set to `true`.

> Note: This scenario makes use of the "implicit grant" flow in OAuth 2

After control returns to your app, you can parse the hash and retrieve the full user profile as follows:

```js
$(function () {
  var result = auth0.parseHash(window.location.hash);

  //use result.id_token to call your rest api

  if (result && result.id_token) {
    auth0.getProfile(result.id_token, function (err, profile) {
      alert('hello ' + profile.name);
    });
    // If offline_access was a requested scope
    // You can grab the result.refresh_token here

  } else if (result && result.error) {
    alert('error: ' + result.error);
  }
});
```

Or just parse the hash (if the `scope` option is not `openid profile`, then the profile will only contains the `user_id`):

```js
$(function () {
    var result = auth0.parseHash(window.location.hash);
    if (result && result.profile) {
      alert('your user_id is: ' + result.profile.sub);
      //use result.id_token to call your rest api
    }
  });
});
```

If there is no hash, `result` will be null. It the hash contains the JWT, the `profile` field will be populated.

##### Regular Web Apps

If you're building a regular web application (HTML pages rendered on the server), then `callbackURL` should point to a server-side endpoint that will process the successful login.  In this scenario you should make sure the `callbackOnLocationHash` option is `false` (or just not specified) when you create your Auth0 client:

```js
var auth0 = new Auth0({
  domain:       'mine.auth0.com',
  clientID:     'dsa7d77dsa7d7',
  callbackURL:  'http://my-app.com/callback'
  // callbackOnLocationHash not set (defaults to false)
});
```

This will result in Auth0 redirecting to your `callbackURL` with an authorization `code` query parameter (vs. items in the URL hash).  The server-side endpoint then exchanges the `code` for an `access_token` and `id_token` and optionally a full user profile.  It then usually sets some kind of local session cookie (which is what enables a user to be logged in) and finally redirects back to a meaningful page.

> Note: This scenario makes use of the "authorization code grant" flow in OAuth 2

#### Popup Mode

The `login` method also supports another mode called Popup Mode, which you enable by passing `popup: true` in the `options` argument.  In this mode the browser will not be redirected to a separate login page.  Instead Auth0 will display a popup window where the user enters their credentials.  The advantage of this approach is that the original page (and all of its state) remains intact, which can be important, especially for Single Page Apps.

In Popup Mode you also have no need to get redirected back to the application, since, once the user has logged in, the popup is simply closed.  Instead Auth0 uses the `login` method's `callback` argument to return control to your application, for both failed and successful logins.  Along with the `err` argument, you also need to pass `profile, id_token, access_token, state` (and optionally `refresh_token` if you've requested the `offline_access` scope):

```js
auth0.login({
  popup: true,
  connection: 'google-oauth2'
},
function(err, profile, id_token, access_token, state) {
  if (err) {
    // Handle the error!
    return;
  }

  // Success!
});
```

#### Database and Active Directory/LDAP connections

The behavior of Redirect Mode and Popup Mode are slightly different if you're using a Database or Active Directory/LDAP connection.  Those differences depend on two factors: whether SSO (Single Sign-On) is enabled or not and whether or not you're passing credentials directly to the `login` method.

##### SSO enabled

By default SSO is enabled (equivalent to passing the `sso: true` option to the `login` method).  This means that after a successful login, Auth0 will set a special SSO cookie that can be used to automatically log a user onto additional websites that are registered as Auth0 apps.  When using either the Database or Active Directory/LDAP connections with SSO enabled, you can still choose to go with Redirect or Popup Mode.

Redirect Mode will happen by default (equivalent to passing `popup: false` to the `login` method).  The browser will navigate to a login page that will prompt the user for their credentials and then, when login is complete, redirect back to the `callbackURL` you set when you initialized the Auth0 client.

However, one of the unique options you have with Database and Active Directory/LDAP connections is that you bypass the redirect to the login page by having a *custom login form* in your app where you can collect the user's credentials and pass them directly to the `login` method via the `username` and `password` options:

```js
auth0.login({
  connection: 'db-conn',
  username:   $('.username').val(),
  password:   $('.password').val(),
},
function (err) {
  // this only gets called if there was a login error
});
```

If the login is successful, the browser will then be redirected to `callbackURL`.  It's also a good idea to provide a `callback` argument to the `login` method as shown above that handles any authentication errors (without redirecting).

Furthermore, sometimes you don't want a redirect to occur at all after a login.  This is often the case with Single Page Apps where a redirect will result in loss of important page state.  To handle all login results client-side, simply provide additional parameters to the `callback` argument you pass to the `login` method:

```js
auth0.login({
  connection: 'db-conn',
  username:   $('.username').val(),
  password:   $('.password').val(),
},
function(err, profile, id_token, access_token, state) {
  if (err) {
    // Handle the error!
    return;
  }

  // Success!
});
```

This `callback` approach is similar to what you'd do in the [Popup Mode](#popup-mode) scenario except no popups (or redirects) occur.  Everything happens in the client-code of the current page.

You can still do Popup Mode with SSO enabled with a Database or Active Directory/LDAP connection if you want to.  This is similar to the Redirect Mode scenario where you don't have a custom login form, but want to use a popup window to collect the user's credentials, and also want control to return to the client-side code (vs the `callbackURL`).  This behavior would occur if you simply specified the `popup: true` option:

```js
auth0.login({
  connection: 'db-conn',
  popup: true
},
function(err, profile, id_token, access_token, state) {
  if (err) {
    // Handle the error!
    return;
  }

  // Success!
});
```

##### SSO disabled

If you don't want to use SSO in your application, you can pass the `sso: false` option to the `login` method.  The result is that when a login occurs, Auth0 performs a CORS POST request (or in IE8 or 9 a JSONP request) against a special "resource owner" endpoint (`/ro`), which allows users to authenticate by sending their username and password.  This produces a couple important constraints:

* Because the `/ro` requires a username and password, you must provide them in the options passed to the `login` method
* It's not possible to use Popup Mode when SSO is disabled, even if you pass `popup: true`

This leaves you with a call to the `login` method that looks something like this:

```js
auth0.login({
  connection: 'db-conn',
  sso: false,
  username:   $('.username').val(),
  password:   $('.password').val()  
},
function(err) {
  // this only gets called if there was a login error
});
```

If the login succeeds, Auth0 will redirect to your `callbackURL` and if it fails, control will be given to the `callback`.  

And if you don't want that redirect to occur (i.e. you have a Single Page App), you can use a `callback` that takes the additional parameters (like what's shown in [Popup Mode](#popup-mode)), and control will go to your callback with a failed or successful login.

### Change Password (database connections):

```js
  $('.change_password').click(function () {
    auth0.changePassword({
      connection: 'db-conn',
      username:   'foo@bar.com',
      password:   'blabla' // new password
    }, function (err, resp) {
      console.log(err.message);
    });
  });
```

### Delegation Token Request

A delegation token is a new token for a different service or app/API.

If you just want to get a new token for an addon that you've activated, you can do the following:

```js
var options = {
  id_token: "your id token", // The id_token you have now
  api: 'firebase', // This defaults to the first active addon if any or you can specify this
  "scope": "openid profile"		    // default: openid
};

auth0.getDelegationToken(options, function (err, delegationResult) {
	// Call your API using delegationResult.id_token
});
```

If you want to get the token for another API or App:

```js
var options = {
  id_token: "your id token", // The id_token you have now
  api: 'auth0' // This is default when calling another app that doesn't have an addon
  targetClientId: 'The other client id'
};

auth0.getDelegationToken(options, function (err, delegationResult) {
  // Call your API using delegationResult.id_token
});
```

### Refresh token

If you want to refresh your existing (not expired) token, you can just do the following:

```js
auth0.renewIdToken(current_id_token, function (err, delegationResult) {
  // Get here the new delegationResult.id_token
});
```

If you want to refresh your existing (expired) token, if you have the refresh_token, you can call the following:

```js
auth0.refreshToken(refresh_token, function (err, delegationResult) {
  // Get here the new delegationResult.id_token
});
```

### Validate User

You can validate a user of a specific connection with his username and password:

```js
auth0.validateUser({
  connection:   'db-conn',
  username:     'foo@bar.com',
  password:     'blabla'
}, function (err, valid) { });
```

### SSO

Method `getSSOData` fetches Single Sign-On information:

```js
  auth0.getSSOData(function (err, ssoData) {
    if (err) return console.log(err.message);
    expect(ssoData.sso).to.exist;
  });
```

The returned `ssoData` object will contain the following fields, for example:

```js
{
  sso: true,
  sessionClients: [
    "jGMow0KO3WDJELW8XIxolqb1XIitjkYL"
  ],
  lastUsedClientID: "jGMow0KO3WDJELW8XIxolqb1XIitjkYL",
  lastUsedUsername: "alice@example.com",
  lastUsedConnection: {
    name: "Username-Password-Authentication",
    strategy: "auth0"
  }
}
```

Load Active Directory data if available (Kerberos):

```js
  auth0.getSSOData(true, fn);
```

When Kerberos is available you can automatically trigger Windows Authentication. As a result the user will immediately be authenticated without taking any action.

```js
  auth0.getSSOData(true, function (err, ssoData) {
    if (!err && ssoData && ssoData.connection) {
      auth0.login({ connection: ssoData.connection });
    }
  });
```

## Develop

Run `grunt dev` and point your browser to `http://localhost:9999/test_harness.html` to run the test suite.

Run `grunt phantom` if you have PhantomJS installed.

Run `grunt integration` (or `npm test`) if you have SauceLabs account. You will need a `SAUCE_ACCESS_KEY` and `SAUCE_USERNAME` env variables.

## Publishing a new version

Use:

```
$ ./bin/version patch
$ git push origin master
```

## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

## Author

[Auth0](auth0.com)

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE.txt) file for more info.

<!-- Vaaaaarrrrsss -->

[npm-image]: https://img.shields.io/npm/v/auth0-js.svg?style=flat-square
[npm-url]: https://npmjs.org/package/auth0-js
[strider-image]: https://ci.auth0.com/auth0/auth0.js/badge
[strider-url]: https://ci.auth0.com/auth0/auth0.js
[coveralls-image]: https://img.shields.io/coveralls/auth0/auth0.js.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/auth0/auth0.js?branch=master
[david-image]: http://img.shields.io/david/auth0/auth0.js.svg?style=flat-square
[david-url]: https://david-dm.org/auth0/auth0.js
[license-image]: http://img.shields.io/npm/l/auth0-js.svg?style=flat-square
[license-url]: #license
[downloads-image]: http://img.shields.io/npm/dm/auth0-js.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/auth0-js
