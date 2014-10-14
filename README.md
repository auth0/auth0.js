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

If you are using [browserify](http://browserify.org/) install with `npm i auth0.js --production --save`.

> Note: The following examples use jQuery, but auth0.js is not tied to jQuery and any library can be used with it.

### Initialize:

Construct a new instance of the Auth0 client as follows:

~~~html
<script src="http://cdn.auth0.com/w2/auth0-4.js"></script>
<script type="text/javascript">
  var auth0 = new Auth0({
    domain:       'mine.auth0.com',
    clientID:     'dsa7d77dsa7d7',
    callbackURL:  'http://my-app.com/callback',
    callbackOnLocationHash: true
  });

  //...
</script>
~~~

### Login:

Trigger the login on any of your active identity provider as follows:

~~~js
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
  $('.login-github').click(function () {
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
~~~

You can also request scopes that are not were not configured for the connection.

~~~js
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
~~~

Trigger the login with offline mode support to get the `refresh_token`

````js
$('.login-dbconn').click(function () {
    auth0.login({
      connection: 'db-conn',
      username:   $('.username').val(),
      password:   $('.password').val(),
      offline_mode: true
    },
    function (err, profile, id_token, access_token, state, refresh_token) {
      // store in cookies
      // refresh_token is sent because offline_mode is set to true
    });
  });
````

### Processing the callback

### Redirect Mode

Once you have succesfully authenticated, Auth0 will redirect to your `callbackURL` with a hash containing an `access_token` and the jwt (`id_token`). You can parse the hash and retrieve the full user profile as follows:

```js
  $(function () {
    var result = auth0.parseHash(window.location.hash);

    //use result.id_token to call your rest api

    if (result && result.id_token) {
      auth0.getProfile(result.id_token, function (err, profile) {
        alert('hello ' + profile.name);
      });
      // If offline_mode: true was sent on the request
      // You can grab the result.refresh_token here

    } else if (result && result.error) {
      alert('error: ' + result.error);
    }
  });
```

Or just parse the hash (if loginOption.scope is not `openid profile`, then the profile will only contains the `user_id`):

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

If there is no hash, `result` will be null. It the hash contains the jwt, the profile field will be populated.

### Popup Mode

While using this mode, the result will be passed as the `login` method callback.
```js
  auth0.login({ popup: true }, function(err, profile, id_token, access_token, state, refresh_token) {
    if (err) {
      // Handle the error!
      return;
    }

    //use id_token to call your rest api
    alert('hello ' + profile.name);

    // refresh_token is sent only if offline_mode was set to true
  });
});
```

### Sign up (database connections):

If you use [Database Connections](https://docs.auth0.com/mysql-connection-tutorial) you can signup as follows:

~~~js
  $('.signup').click(function () {
    auth0.signup({
      connection: 'db-conn',
      username:   'foo@bar.com',
      password:   'blabla'
    }, function (err) {
      console.log(err.message);
    });
  });
~~~

After a succesful login it will auto login the user. If you do not want to automatically login the user you have to pass the option `auto_login: false`.

### Change Password (database connections):

~~~js
  $('.change_password').click(function () {
    auth0.changePassword({
      connection: 'db-conn',
      username:   'foo@bar.com',
      password:   'blabla' // new password
    }, function (err, resp) {
      console.log(err.message);
    });
  });
~~~

### Delegation Token Request

A delegation token is a new token for a different service or app/API.

If you just want to get a new token for an addon that you've activated, you can do the following:

````js
var options = {
  id_token: "your id token", // The id_token you have now
  api: 'firebase', // This defaults to the first active addon if any or you can specify this
  "scope": "openid profile"		    // default: openid
};

auth0.getDelegationToken(options, function (err, delegationResult) {
	// Call your API using delegationResult.id_token
});
````

If you want to get the token for another API or App:

````js
var options = {
  id_token: "your id token", // The id_token you have now
  api: 'auth0' // This is default when calling another app that doesn't have an addon
  targetClientId: 'The other client id'
};

auth0.getDelegationToken(options, function (err, delegationResult) {
  // Call your API using delegationResult.id_token
});
````

### Refresh token

If you want to refresh your existing (not expired) token, you can just do the following:

````js
auth0.renewIdToken(current_id_token, function (err, delegationResult) {
  // Get here the new delegationResult.id_token
});
````

If you want to refresh your existing (expired) token, if you have the refresh_token, you can call the following:

````js
auth0.refreshToken(refresh_token, function (err, delegationResult) {
  // Get here the new delegationResult.id_token
});
````

### Validate User

You can validate a user of a specific connection with his username and password:

~~~js
auth0.validateUser({
  connection:   'db-conn',
  username:     'foo@bar.com',
  password:     'blabla'
}, function (err, valid) { });
~~~

### SSO

Method `getSSOData` fetches Single Sign-On information:

```js
  auth0.getSSOData(function (err, ssoData) {
    if (err) return console.log(err.message);
    expect(ssoData.sso).to.exist;
  });
```

```js
  // Don't bring active directoy data
  auth0.getSSOData(false, fn);
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

## License

The MIT License (MIT)

Copyright (c) 2013-2014 Auth0 Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

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
