[![Build Status](https://travis-ci.org/auth0/auth0.js.png)](https://travis-ci.org/auth0/auth0.js)

[![Integrated Test Status](https://saucelabs.com/browser-matrix/jfromaniello.svg)](https://saucelabs.com/u/jfromaniello)

[![Auth0](http://blog.auth0.com.s3.amazonaws.com/logo-290x200-letters.png)](http://auth0.com)

[Auth0](http://auth0.com) is an authentication broker that supports social identity providers as well as enterprise identity providers such as Active Directory, LDAP, Office365, Google Apps, Salesforce.

Auth0.js is a client-side library for [Auth0](http://auth0.com). It allows you to trigger the authentication process and parse the [JWT](http://openid.net/specs/draft-jones-json-web-token-07.html) (JSON web token) with just the Auth0 `clientID`. Once you have the JWT you can use it to authenticate requests to your http API and validate the JWT in your server-side logic with the `clientSecret`.

## Example

The example directory has a ready-to-go app. If you want to run it, you need [node](http://nodejs.org/) installed, then run `npm run example` from the root of this project.

## Usage

> Note: I use jQuery in these examples but auth0.js doesn't need jquery and you can use anything.

### Initialize:

Construct a new instance of the Auth0 client as follows:

~~~javascript
  var auth0 = new Auth0({
    domain:       'mine.auth0.com',
    clientID:     'dsa7d77dsa7d7',
    callbackURL:  'http://my-app.com/callback',
  });
~~~

### Login:

~~~html
<script src="auth0.min.js"></script>
<script type="text/javascript">
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
</script>
~~~

### Parsing JWT profile

Once you have succesfully authenticated, auth0 will redirect to your `callbackURL` with a hash containing an access_token and the jwt. You can parse the hash as follows:

~~~javascript
  $(function () {
    auth0.parseHash(function (profile, id_token, access_token, state) {
      alert('hello ' + profile.name);
      //use id_token to call your rest api
    });
  });
~~~

If there is no hash or the hash doesn't contain the jwt the callback function will not be called. So, it is safe to put this in the same page where you trigger the login.  

### Sign up (database connections):

~~~html
<script src="auth0.min.js"></script>
<script type="text/javascript">
  $('.login-google').click(function () {
    auth0.signup({
      connection: 'google-oauth2',
      username:   'foo@bar.com',
      password:   'blabla'
    }, function (err) {
      console.log(err.message); ///this could be something like "email is required"
    });
  });
</script>
~~~

After a succesful login it will auto login the user. If you do not want to automatically login the user use

~~~js
auth0.signup({
  connection: 'google-oauth2',
  username:   'foo@bar.com',
  password:   'blabla',
  auto_login: false
}, function (err) {
  if (err) return alert('something went wrong: ' + err.message);
  alert('congrats!')
});
~~~

## Develop

Run `npm run dev` and point your browser to `http://localhost:9999/` to run the test suite.

## License 

MIT - 2013 - AUTH10 LLC