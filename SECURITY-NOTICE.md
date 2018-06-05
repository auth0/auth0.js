# Security vulnerability details for auth0.js < 9.3
A vulnerability has been discovered in the auth0.js library affecting versions < 9.3. This vulnerability allows an attacker to bypass the CSRF check from the `state` parameter if it's missing from the authorization response (`https://yourwebsite/#access_token={attacker_access_token}&expires_in=7200&token_type=Bearer`, leaving the client vulnerable to CSRF attacks.

Developers using the auth0.js library versions < 9.3 need to upgrade to the latest version.

Updated packages are available on npm. To ensure delivery of additional bug fixes moving forward, please make sure your `package.json` file is updated to take patch and minor level updates of our libraries. For example:

{
  "dependencies": {
    "auth0-js": "^9.3.0"
  }
}

###  Upgrade Notes

This fix patches the library that your application runs, but will not impact your users, their current state, or any existing sessions.

You can read more details regarding the vulnerability [here](https://auth0.com/docs/security/bulletins/cve-2018-7307).



# Security vulnerability details for auth0.js < 8.12
A vulnerability has been discovered in the auth0.js library affecting versions < 8.12. This vulnerability allows an attacker to acquire authenticated users’ tokens and invoke services on the user’s behalf if the target site or application uses a popup callback page with `auth0.popup.callback()`.

Developers using the auth0.js library versions < 8.12 need to upgrade to the latest version.

Updated packages are available on npm. To ensure delivery of additional bug fixes moving forward, please make sure your `package.json` file is updated to take patch and minor level updates of our libraries. For example:

```
{
  "dependencies": {
    "auth0-js": "^9.0.0"
  }
}
```

###  Upgrade Notes

This fix patches the library that your application runs, but will not impact your users, their current state, or any existing sessions.

You can read more details regarding the vulnerability [here](https://auth0.com/docs/security/bulletins/cve-2017-17068).
