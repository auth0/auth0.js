[![browser support](https://ci.testling.com/auth0/auth0.js.png)](https://ci.testling.com/auth0/auth0.js)

## Usage

### Login:

~~~html
<script src="auth0.min.js"></script>
<script type="text/javascript">
	var auth0 = new Auth0({
		domain:       'mine.auth0.com',
		clientID:     'dsa7d77dsa7d7',
		redirect_uri  'http://my-app.com/callback',
	});

	$('.login-google').click(function () {
		auth0.login({
			connection: 'google-oauth2'
		});
	});	

	$('.login-github').click(function () {
		auth0.login({
			connection: 'github'
		});
	});

	$('.login-dbconn').click(function () {
		auth0.login({
			connection: 'github',
			username:   $('.username').val(),
			password:   $('.password').val(),
		});
	});
</script>
~~~

### Sign up (database connections):

~~~html
<script src="auth0.min.js"></script>
<script type="text/javascript">
	var auth0 = new Auth0({
		domain:       'mine.auth0.com',
		clientID:     'dsa7d77dsa7d7',
		redirect_uri  'http://my-app.com/callback',
	});

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

## Run the example

run `make test-interactive` and open http://localhost:3000:

~~~
make test-interactive
~~~

## License 

MIT - 2013 - AUTH10 LLC