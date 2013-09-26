[![browser support](https://ci.testling.com/auth0/auth0.js.png)](https://ci.testling.com/auth0/auth0.js)

## Usage

~~~html
<script src="auth0.min.js"></script>
<script type="text/javascript">
	var auth0 = new Auth0({
		domain:       'mine.auth0.com',
		clientID:     'dsa7d77dsa7d7',
		redirect_uri  'http://my-app.com/callback',
		success: function (profile, access_token, id_token, state) { 
			//optional login callback
		}
	});

	$('.login-google').click(function () {
		auth0.login({
			connection: 'google-oauth2'
		});
	});
</script>
~~~

## Run the example

run `make test-interactive` and open http://localhost:3000:

~~~
make test-interactive
~~~

## License 

MIT - 2013 - AUTH10 LLC