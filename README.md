[![Build Status](https://auth0-tc-hub.herokuapp.com/bt21/status.png)](https://auth0-tc-hub.herokuapp.com/bt21)
[![NPM version](https://badge.fury.io/js/auth0-js.png)](http://badge.fury.io/js/auth0-js)

[![Auth0](http://blog.auth0.com.s3.amazonaws.com/logo-290x200-letters.png)](http://auth0.com)

[Auth0](http://auth0.com) is an authentication broker that supports social identity providers as well as enterprise identity providers such as Active Directory, LDAP, Office365, Google Apps, Salesforce.

Auth0.js is a client-side library for [Auth0](http://auth0.com). It allows you to trigger the authentication process and parse the [JWT](http://openid.net/specs/draft-jones-json-web-token-07.html) (JSON web token) with just the Auth0 `clientID`. Once you have the JWT you can use it to authenticate requests to your http API and validate the JWT in your server-side logic with the `clientSecret`.

## Example

The example directory has a ready-to-go app. In order to run it you need [node](http://nodejs.org/) installed, then execute `npm run example` from the root of this project.

## Usage

Take `auth0.js` or `auth0.min.js` from the `build` directory and import it to your page.

If you are using [browserify](http://browserify.org/) install with `npm i auth0.js`.

> Note: I use jQuery in these examples but auth0.js doesn't need jquery and you can use anything.

### Initialize:

Construct a new instance of the Auth0 client as follows:

~~~html
<script src="auth0.min.js"></script>
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
      connection: 'github',
      username:   $('.username').val(),
      password:   $('.password').val(),
    });
  });
~~~

### Parsing JWT profile

Once you have succesfully authenticated, auth0 will redirect to your `callbackURL` with a hash containing an access_token and the jwt. You can parse the hash as follows:

~~~js
  $(function () {
    auth0.parseHash(window.location.hash, function (profile, id_token, access_token, state) {
      alert('hello ' + profile.name);
      //use id_token to call your rest api
    });
  });
~~~

If there is no hash or the hash doesn't contain the jwt the callback function will not be called. So, it is safe to put this in the same page where you trigger the login.

### Sign up (database connections):

If you use [Database Connections](https://docs.auth0.com/mysql-connection-tutorial) you can signup as follows:

~~~js
  $('.signup').click(function () {
    auth0.signup({
      connection: 'google-oauth2',
      username:   'foo@bar.com',
      password:   'blabla'
    }, function (err) {
      console.log(err.message); ///this could be something like "email is required"
    });
  });
~~~

After a succesful login it will auto login the user. If you do not want to automatically login the user you have to pass the option `auto_login: false`.

### Delegation Token Request

You can obtain a delegation token specifying the ID of the target client (`targetClientId`) and an object (`options`) in order to include custom parameters like id_token or scope:

~~~js
var targetClientId = "{TARGET_CLIENT_ID}";
var options = {
    "id_token": "USER_ID_TOKEN",		// MANDATORY!
    "scope": "openid profile"		    // default: openid
};

auth0.getDelegationToken(targetClientId, options, function (err, delegationResult) {
	// Call your API using delegationResult.id_token
});
~~~

## Develop

Run `grunt dev` and point your browser to `http://localhost:9999/test_harness.html` to run the test suite.

Run `grunt test` if you have PhantomJS installed.

Do you have issues in some browser? Ask us guidance to test in multiple browsers!

## Publishing a new version

Use:

```
$ mversion patch -m "v%s"
$ git push origin master --tags
$ npm publish
```

## Browser Compatibility

We are using [BrowserStack](http://browserstack.com) and our own CI server to run the test suite on multiple browsers on every push.

## License

The MIT License (MIT)

Copyright (c) 2013 AUTH10 LLC

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
