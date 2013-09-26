## Usage

~~~html
<script src="auth0.min.js"></script>
<script type="text/javascript">
	var auth0 = new Auth0({
		domain:       'mine.auth0.com',
		clientID:     'dsa7d77dsa7d7',
		redirect_uri  'http://my-app.com/callback'
	});

	$('.login-google').click(function () {
		auth0.login({
			connection: 'google-oauth2'
		});
	});
</script>
~~~

## License 

MIT - 2013 - AUTH10 LLC