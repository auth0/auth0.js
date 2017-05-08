var urljoin = require('url-join');

var windowHelper = require('../helper/window');
var objectHelper = require('../helper/object');
var RequestBuilder = require('../helper/request-builder');

function CrossOriginAuthentication(webAuth, options) {
  this.webAuth = webAuth;
  this.baseOptions = options;
  this.request = new RequestBuilder(options);
}

function getFragment(name) {
  var theWindow = windowHelper.getWindow();
  var value = '&' + theWindow.location.hash.substring(1);
  var parts = value.split('&' + name + '=');
  if (parts.length === 2) {
    return parts.pop().split('&').shift();
  }
}

function createKey(origin, coId) {
  return [
    'co/verifier',
    encodeURIComponent(origin),
    encodeURIComponent(coId)
  ].join('/');
}

/**
 * Logs in the user with username and password using the cross origin authentication flow. You can use `username` or `email` as the actual username.
 *
 * @method login
 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
 * @param {String} options.username username
 * @param {String} options.email email
 * @param {String} options.password user password
 * @param {String} options.realm realm
 */
CrossOriginAuthentication.prototype.login = function (options) {
  var _this = this;
  var theWindow = windowHelper.getWindow();
  var url = urljoin(this.baseOptions.rootUrl, '/co/authenticate');
  var authenticateBody = {
    client_id: options.clientID || this.baseOptions.clientID,
    credential_type: 'password',
    username: options.username || options.email,
    password: options.password
  };
  var realm = options.realm || this.baseOptions.realm;
  if (realm) {
    authenticateBody.realm = realm;
    authenticateBody.credential_type = 'http://auth0.com/oauth/grant-type/password-realm';
  }
  this.request.post(url).withCredentials().send(authenticateBody).end(function (err, data) {
    if (err) {
      var errorObject = (err.response && err.response.body) || {
        error: 'Request Error',
        error_description: JSON.stringify(err)
      };
      var redirectUrl = _this.baseOptions.redirectUri || options.redirectUri;
      var errorHash = '#error=' + encodeURI(errorObject.error) + '&error_description=' + encodeURI(errorObject.error_description);
      return windowHelper.redirect(redirectUrl + errorHash);
    }
    // data.body
    // {login_ticket: 'Sny4Pny9I1wf4xSVYxDnqEnJSR5vvLDF', co_verifier: 'fk8WQOAPmbZ8LDlQ7xPlH_xMJ1l8Eofd', co_id: 'Q3L1rsKoUXHq'}
    options = objectHelper.blacklist(options, ['username', 'password']);
    var authorizeOptions = objectHelper.merge(options).with({ loginTicket: data.body.login_ticket });
    var key = createKey(_this.baseOptions.rootUrl, data.body.co_id);
    theWindow.sessionStorage[key] = data.body.co_verifier;
    _this.webAuth.authorize(authorizeOptions);
  });
};

/**
 * Runs the callback code for the cross origin authentication call. This method is meant to be called by the cross origin authentication callback url.
 *
 * @method callback
 */
CrossOriginAuthentication.prototype.callback = function () {
  var targetOrigin = decodeURIComponent(getFragment('origin'));
  var theWindow = windowHelper.getWindow();

  theWindow.addEventListener('message', function (evt) {
    if (evt.data.type !== 'co_verifier_request') {
      return;
    }
    var key = createKey(evt.origin, evt.data.request.id);
    var verifier = theWindow.sessionStorage[key];
    theWindow.sessionStorage.removeItem(key);

    evt.source.postMessage({
      type: 'co_verifier_response',
      response: {
        verifier: verifier
      }
    }, evt.origin);
  });

  theWindow.parent.postMessage({ type: 'ready' }, targetOrigin);
};

module.exports = CrossOriginAuthentication;
