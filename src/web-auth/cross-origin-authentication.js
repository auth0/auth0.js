import urljoin from 'url-join';

import windowHelper from '../helper/window';
import objectHelper from '../helper/object';
import RequestBuilder from '../helper/request-builder';
import WebMessageHandler from './web-message-handler';
import responseHandler from '../helper/response-handler';
import Storage from '../helper/storage';
import * as times from '../helper/times';

function CrossOriginAuthentication(webAuth, options) {
  this.webAuth = webAuth;
  this.baseOptions = options;
  this.request = new RequestBuilder(options);
  this.webMessageHandler = new WebMessageHandler(webAuth);
  this.storage = new Storage(options);
}

function getFragment(name) {
  var theWindow = windowHelper.getWindow();
  var value = '&' + theWindow.location.hash.substring(1);
  var parts = value.split('&' + name + '=');
  if (parts.length === 2) {
    return parts
      .pop()
      .split('&')
      .shift();
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
 * @callback onRedirectingCallback
 * @param {function} done Must be called when finished so that authentication can be resumed
 * @ignore
 */

/**
 * Logs in the user with username and password using the cross origin authentication (/co/authenticate) flow. You can use either `username` or `email` to identify the user, but `username` will take precedence over `email`.
 * Some browsers might not be able to successfully authenticate if 3rd party cookies are disabled in your browser. [See here for more information.]{@link https://auth0.com/docs/cross-origin-authentication}.
 * After the /co/authenticate call, you'll have to use the {@link parseHash} function at the `redirectUri` specified in the constructor.
 *
 * @method login
 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
 * @param {String} [options.username] Username (mutually exclusive with email)
 * @param {String} [options.email] Email  (mutually exclusive with username)
 * @param {String} [options.password] Password
 * @param {String} [options.realm] Realm used to authenticate the user, it can be a realm name or a database connection name
 * @param {onRedirectingCallback} [options.onRedirecting] Hook function that is called before redirecting to /authorize, allowing you to handle custom code. You must call the `done` function to resume authentication.
 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
 * @ignore
 */
CrossOriginAuthentication.prototype.login = function(options, cb) {
  var _this = this;
  var url = urljoin(this.baseOptions.rootUrl, '/co/authenticate');

  options.username = options.username || options.email;
  delete options.email;

  var authenticateBody = {
    client_id: options.clientID || this.baseOptions.clientID,
    username: options.username
  };

  if (options.password) {
    authenticateBody.password = options.password;
  }

  if (options.otp) {
    authenticateBody.otp = options.otp;
  }

  var realm = options.realm || this.baseOptions.realm;

  if (realm) {
    var credentialType =
      options.credentialType ||
      this.baseOptions.credentialType ||
      'http://auth0.com/oauth/grant-type/password-realm';

    authenticateBody.realm = realm;
    authenticateBody.credential_type = credentialType;
  } else {
    authenticateBody.credential_type = 'password';
  }

  this.request
    .post(url)
    .withCredentials()
    .send(authenticateBody)
    .end(function(err, data) {
      if (err) {
        var errorObject = (err.response && err.response.body) || {
          error: 'request_error',
          error_description: JSON.stringify(err)
        };

        return responseHandler(cb, { forceLegacyError: true })(errorObject);
      }

      function doAuth() {
        var popupMode = options.popup === true;

        options = objectHelper.blacklist(options, [
          'password',
          'credentialType',
          'otp',
          'popup',
          'onRedirecting'
        ]);

        var authorizeOptions = objectHelper
          .merge(options)
          .with({ loginTicket: data.body.login_ticket });

        var key = createKey(_this.baseOptions.rootUrl, data.body.co_id);

        _this.storage.setItem(key, data.body.co_verifier, {
          expires: times.MINUTES_15
        });

        if (popupMode) {
          _this.webMessageHandler.run(
            authorizeOptions,
            responseHandler(cb, { forceLegacyError: true })
          );
        } else {
          _this.webAuth.authorize(authorizeOptions);
        }
      }

      // Handle pre-redirecting to login, then proceed with '/authorize' once that is complete
      if (typeof options.onRedirecting === 'function') {
        options.onRedirecting(doAuth);
      } else {
        // If not handling pre-redirect, just do the login as before
        doAuth();
      }
    });
};

function tryGetVerifier(storage, key) {
  try {
    var verifier = storage.getItem(key);
    storage.removeItem(key);
    return verifier || '';
  } catch (e) {
    return '';
  }
}

/**
 * Runs the callback code for the cross origin authentication call. This method is meant to be called by the cross origin authentication callback url.
 *
 * @method callback
 * @ignore
 */
CrossOriginAuthentication.prototype.callback = function() {
  var targetOrigin = decodeURIComponent(getFragment('origin'));
  var theWindow = windowHelper.getWindow();
  var _this = this;

  theWindow.addEventListener('message', function(evt) {
    if (evt.data.type !== 'co_verifier_request') {
      return;
    }
    var key = createKey(evt.origin, evt.data.request.id);
    var verifier = tryGetVerifier(_this.storage, key);

    evt.source.postMessage(
      {
        type: 'co_verifier_response',
        response: {
          verifier: verifier
        }
      },
      evt.origin
    );
  });

  theWindow.parent.postMessage({ type: 'ready' }, targetOrigin);
};

export default CrossOriginAuthentication;
