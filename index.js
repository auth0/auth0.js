/**
 * Module dependencies.
 */

var assert_required   = require('./lib/assert_required');
var base64_url_decode = require('./lib/base64_url_decode');
var is_array          = require('./lib/is-array');

var qs                = require('qs');
var xtend             = require('xtend');
var trim              = require('trim');
var reqwest           = require('reqwest');
var WinChan           = require('winchan');

var jsonp             = require('jsonp');
var jsonpOpts         = { param: 'cbx', timeout: 8000, prefix: '__auth0jp' };

var use_jsonp         = require('./lib/use_jsonp');
var LoginError        = require('./lib/LoginError');
var json_parse        = require('./lib/json-parse');

/**
 * Check if running in IE.
 *
 * @returns {Number} -1 if not IE, IE version otherwise.
 */
function isInternetExplorer() {
  var rv = -1; // Return value assumes failure.
  var ua = navigator.userAgent;
  var re;
  if (navigator.appName === 'Microsoft Internet Explorer') {
    re = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})');
    if (re.exec(ua) != null) {
      rv = parseFloat(RegExp.$1);
    }
  }
  // IE > 11
  else if (ua.indexOf('Trident') > -1) {
    re = new RegExp('rv:([0-9]{2,2}[\.0-9]{0,})');
    if (re.exec(ua) !== null) {
      rv = parseFloat(RegExp.$1);
    }
  }

  return rv;
}

/**
 * Stringify popup options object into
 * `window.open` string options format
 *
 * @param {Object} popupOptions
 * @private
 */

function stringifyPopupSettings(popupOptions) {
  var settings = '';

  for (var key in popupOptions) {
    settings += key + '=' + popupOptions[key] + ',';
  }

  return settings.slice(0, -1);
}


/**
 * Check that a key has been set to something different than null
 * or undefined.
 *
 * @param {Object} obj
 * @param {String} key
 */
function checkIfSet(obj, key) {
  /*
   * false      != null -> true
   * true       != null -> true
   * undefined  != null -> false
   * null       != null -> false
   */
  return !!(obj && obj[key] != null);
}

function handleRequestError(err, callback) {
  var er = err;
  var isAffectedIEVersion = isInternetExplorer() === 10 || isInternetExplorer() === 11;
  var zeroStatus = (!er.status || er.status === 0);

  var onLine = !!window.navigator.onLine;

  // Request failed because we are offline.
  if (zeroStatus && !onLine ) {
    er = {};
    er.status = 0;
    er.responseText = {
      code: 'offline'
    };
  // http://stackoverflow.com/questions/23229723/ie-10-11-cors-status-0
  // XXX IE10 when a request fails in CORS returns status code 0
  // See: http://caniuse.com/#search=navigator.onLine
  } else if (zeroStatus && isAffectedIEVersion) {
    er = {};
    er.status = 401;
    er.responseText = {
      code: 'invalid_user_password'
    };
  // If not IE10/11 and not offline it means that Auth0 host is unreachable:
  // Connection Timeout or Connection Refused.
  } else if (zeroStatus) {
    er = {};
    er.status = 0;
    er.responseText = {
      code: 'connection_refused_timeout'
    };
  } else {
    er.responseText = err;
  }
  var error = new LoginError(er.status, er.responseText);
  callback(error);
}

/**
 * Create an `Auth0` instance with `options`
 *
 * @class Auth0
 * @constructor
 */
function Auth0 (options) {
  // XXX Deprecated: We prefer new Auth0(...)
  if (!(this instanceof Auth0)) {
    return new Auth0(options);
  }

  assert_required(options, 'clientID');
  assert_required(options, 'domain');

  this._useJSONP = options.forceJSONP || use_jsonp();
  this._clientID = options.clientID;
  this._callbackURL = options.callbackURL || document.location.href;
  this._domain = options.domain;
  this._callbackOnLocationHash = false || options.callbackOnLocationHash;
  this._cordovaSocialPlugins = {
    facebook: this._phonegapFacebookLogin
  };
  this._useCordovaSocialPlugins = false || options.useCordovaSocialPlugins;
}

/**
 * Export version with `Auth0` constructor
 *
 * @property {String} version
 */

Auth0.version = require('package.version');

/**
 * Redirect current location to `url`
 *
 * @param {String} url
 * @private
 */

Auth0.prototype._redirect = function (url) {
  global.window.location = url;
};

Auth0.prototype._getCallbackOnLocationHash = function(options) {
  return (options && typeof options.callbackOnLocationHash !== 'undefined') ?
    options.callbackOnLocationHash : this._callbackOnLocationHash;
};

Auth0.prototype._getCallbackURL = function(options) {
  return (options && typeof options.callbackURL !== 'undefined') ?
    options.callbackURL : this._callbackURL;
};

/**
 * Renders and submits a WSFed form
 *
 * @param {Object} options
 * @param {Function} formHtml
 * @private
 */

Auth0.prototype._renderAndSubmitWSFedForm = function (options, formHtml) {
  var div = document.createElement('div');
  div.innerHTML = formHtml;
  var form = document.body.appendChild(div).children[0];

  if (options.popup && !this._getCallbackOnLocationHash(options)) {
    form.target = 'auth0_signup_popup';
  }

  form.submit();
};

/**
 * Resolve response type as `token` or `code`
 *
 * @return {Object} `scope` and `response_type` properties
 * @private
 */

Auth0.prototype._getMode = function (options) {
  return {
    scope: 'openid',
    response_type: this._getCallbackOnLocationHash(options) ? 'token' : 'code'
  };
};

Auth0.prototype._configureOfflineMode = function(options) {
  if (options.scope && options.scope.indexOf('offline_access') >= 0) {
    options.device = options.device || 'Browser';
  }
};

/**
 * Get user information from API
 *
 * @param {Object} profile
 * @param {String} id_token
 * @param {Function} callback
 * @private
 */

Auth0.prototype._getUserInfo = function (profile, id_token, callback) {

  if (profile && !profile.user_id) { // the scope was just openid
    var self = this;
    var url = 'https://' + self._domain + '/tokeninfo?';

    var fail = function (status, description) {
      var error = new Error(status + ': ' + (description || ''));

      // These two properties are added for compatibility with old versions (no Error instance was returned)
      error.error = status;
      error.error_description = description;

      callback(error);
    };

    if (this._useJSONP) {
      return jsonp(url + qs.stringify({id_token: id_token}), jsonpOpts, function (err, resp) {
        if (err) {
          return fail(0, err.toString());
        }

        return resp.status === 200 ?
          callback(null, resp.user) :
          fail(resp.status, resp.error);
      });
    }

    return reqwest({
      url:          url,
      method:       'post',
      type:         'json',
      crossOrigin:  true,
      data:         {id_token: id_token}
    }).fail(function (err) {
      fail(err.status, err.responseText);
    }).then(function (userinfo) {
      callback(null, userinfo);
    });
  }

  callback(null, profile);
};

/**
 * Get profile data by `id_token`
 *
 * @param {String} id_token
 * @param {Function} callback
 * @method getProfile
 */

Auth0.prototype.getProfile = function (id_token, callback) {
  if ('function' !== typeof callback) {
    throw new Error('A callback function is required');
  }
  if (!id_token || typeof id_token !== 'string') {
    return callback(new Error('Invalid token'));
  }

  this._getUserInfo(this.decodeJwt(id_token), id_token, callback);
};

/**
 * Validate a user
 *
 * @param {Object} options
 * @param {Function} callback
 * @method validateUser
 */

Auth0.prototype.validateUser = function (options, callback) {
  var endpoint = 'https://' + this._domain + '/public/api/users/validate_userpassword';
  var query = xtend(
    options,
    {
      client_id:    this._clientID,
      username:     trim(options.username || options.email || '')
    });

  if (this._useJSONP) {
    return jsonp(endpoint + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
      if (err) {
        return callback(err);
      }
      if('error' in resp && resp.status !== 404) {
        return callback(new Error(resp.error));
      }
      callback(null, resp.status === 200);
    });
  }

  reqwest({
    url:     endpoint,
    method:  'post',
    type:    'text',
    data:    query,
    crossOrigin: true,
    error: function (err) {
      if (err.status !== 404) { return callback(new Error(err.responseText)); }
      callback(null, false);
    },
    success: function (resp) {
      callback(null, resp.status === 200);
    }
  });
};

/**
 * Decode Json Web Token
 *
 * @param {String} jwt
 * @method decodeJwt
 */

Auth0.prototype.decodeJwt = function (jwt) {
  var encoded = jwt && jwt.split('.')[1];
  return json_parse(base64_url_decode(encoded));
};

/**
 * Given the hash (or a query) of an URL returns a dictionary with only relevant
 * authentication information. If succeeds it will return the following fields:
 * `profile`, `id_token`, `access_token` and `state`. In case of error, it will
 * return `error` and `error_description`.
 *
 * @method parseHash
 * @param {String} [hash=window.location.hash] URL to be parsed
 * @example
 *      var auth0 = new Auth0({...});
 *
 *      // Returns {profile: {** decoded id token **}, state: "good"}
 *      auth0.parseHash('#id_token=.....&state=good&foo=bar');
 *
 *      // Returns {error: "invalid_credentials", error_description: undefined}
 *      auth0.parseHash('#error=invalid_credentials');
 *
 *      // Returns {error: "invalid_credentials", error_description: undefined}
 *      auth0.parseHash('?error=invalid_credentials');
 *
 */

Auth0.prototype.parseHash = function (hash) {
  hash = hash || window.location.hash;
  var parsed_qs;
  if (hash.match(/error/)) {
    hash = hash.substr(1).replace(/^\//, '');
    parsed_qs = qs.parse(hash);
    var err = {
      error: parsed_qs.error,
      error_description: parsed_qs.error_description
    };
    return err;
  }
  if(!hash.match(/access_token/)) {
    // Invalid hash URL
    return null;
  }
  hash = hash.substr(1).replace(/^\//, '');
  parsed_qs = qs.parse(hash);
  var id_token = parsed_qs.id_token;
  var refresh_token = parsed_qs.refresh_token;
  var prof = this.decodeJwt(id_token);
  var invalidJwt = function (error) {
    var err = {
      error: 'invalid_token',
      error_description: error
    };
    return err;
  };

  // aud should be the clientID
  if (prof.aud !== this._clientID) {
    return invalidJwt(
      'The clientID configured (' + this._clientID + ') does not match with the clientID set in the token (' + prof.aud + ').');
  }

  // iss should be the Auth0 domain (i.e.: https://contoso.auth0.com/)
  if (prof.iss && prof.iss !== 'https://' + this._domain + '/') {
    return invalidJwt(
      'The domain configured (https://' + this._domain + '/) does not match with the domain set in the token (' + prof.iss + ').');
  }

  return {
    profile: prof,
    id_token: id_token,
    access_token: parsed_qs.access_token,
    state: parsed_qs.state,
    refresh_token: refresh_token
  };
};

/**
 * Signup
 *
 * @param {Object} options Signup Options
 * @param {String} email New user email
 * @param {String} password New user password
 *
 * @param {Function} callback
 * @method signup
 */

Auth0.prototype.signup = function (options, callback) {
  var self = this;

  var query = xtend(
    this._getMode(options),
    options,
    {
      client_id: this._clientID,
      redirect_uri: this._getCallbackURL(options),
      username: trim(options.username || ''),
      email: trim(options.email || options.username || ''),
      tenant: this._domain.split('.')[0]
    });

  this._configureOfflineMode(query);

  // TODO Change this to a property named 'disableSSO' for consistency.
  // By default, options.sso is true
  if (!checkIfSet(options, 'sso')) {
    options.sso = true;
  }

  var popup;

  if (options.popup  && !this._getCallbackOnLocationHash(options)) {
    popup = this._buildPopupWindow(options);
  }

  if (options.popup  && options.sso) {
    popup = this._buildPopupWindow(options);
  }

  function success () {
    if ('auto_login' in options && !options.auto_login) {
      if (callback) {
        callback();
      }
      return;
    }
    self.login(options, callback);
  }

  function fail (status, resp) {
    var error = new LoginError(status, resp);
    if (popup && popup.kill) {
      popup.kill();
    }
    if (callback) {
      return callback(error);
    }
    throw error;
  }

  if (this._useJSONP) {
    return jsonp('https://' + this._domain + '/dbconnections/signup?' + qs.stringify(query), jsonpOpts, function (err, resp) {
      if (err) {
        return fail(0, err);
      }
      return resp.status == 200 ?
              success() :
              fail(resp.status, resp.err);
    });
  }

  reqwest({
    url:     'https://' + this._domain + '/dbconnections/signup',
    method:  'post',
    type:    'html',
    data:    query,
    success: success,
    crossOrigin: true,
    error: function (err) {
      fail(err.status, err.responseText);
    }
  });
};

/**
 * Change password
 *
 * @param {Object} options
 * @param {Function} callback
 * @method changePassword
 */

Auth0.prototype.changePassword = function (options, callback) {
  var query = {
    tenant:         this._domain.split('.')[0],
    client_id:      this._clientID,
    connection:     options.connection,
    username:       trim(options.username || ''),
    email:          trim(options.email || options.username || ''),
    password:       options.password
  };


  function fail (status, resp) {
    var error = new LoginError(status, resp);
    if (callback) {
      return callback(error);
    }
  }

  if (this._useJSONP) {
    return jsonp('https://' + this._domain + '/dbconnections/change_password?' + qs.stringify(query), jsonpOpts, function (err, resp) {
      if (err) {
        return fail(0, err);
      }
      return resp.status == 200 ?
              callback(null, resp.message) :
              fail(resp.status, resp.err);
    });
  }

  reqwest({
    url:     'https://' + this._domain + '/dbconnections/change_password',
    method:  'post',
    type:    'html',
    data:    query,
    crossOrigin: true,
    error: function (err) {
      fail(err.status, err.responseText);
    },
    success: function (r) {
      callback(null, r);
    }
  });
};

/**
 * Builds query string to be passed to /authorize based on dict key and values.
 *
 * @param {Array} args
 * @param {Array} blacklist
 * @private
 */

Auth0.prototype._buildAuthorizeQueryString = function (args, blacklist) {
  var query = this._buildAuthorizationParameters(args, blacklist);
  return qs.stringify(query);
};

/**
 * Builds parameter dictionary to be passed to /authorize based on dict key and values.
 *
 * @param {Array} args
 * @param {Array} blacklist
 * @private
 */

Auth0.prototype._buildAuthorizationParameters = function(args, blacklist) {
  var query = xtend.apply(null, args);

  // Adds offline mode to the query
  this._configureOfflineMode(query);

  // Elements to filter from query string
  blacklist = blacklist || ['popup', 'popupOptions'];

  var i, key;

  for (i = 0; i < blacklist.length; i++) {
    key = blacklist[i];
    delete query[key];
  }

  if (query.connection_scope && is_array(query.connection_scope)){
    query.connection_scope = query.connection_scope.join(',');
  }

  return query;
};

/**
 * Login user
 *
 * @param {Object} options
 * @param {Function} callback
 * @method login
 */

Auth0.prototype.login = Auth0.prototype.signin = function (options, callback) {

  // TODO Change this to a property named 'disableSSO' for consistency.
  // By default, options.sso is true
  if (!checkIfSet(options, 'sso')) {
    options.sso = true;
  }

  if (typeof options.phone !== 'undefined' ||
      typeof options.passcode !== 'undefined') {
    return this.loginWithPhoneNumber(options, callback);
  }

  if (typeof options.username !== 'undefined' ||
      typeof options.email !== 'undefined') {
    return this.loginWithUsernamePassword(options, callback);
  }

  if (!!window.cordova) {
    return this.loginPhonegap(options, callback);
  }

  if (!!options.popup && this._getCallbackOnLocationHash(options)) {
    return this.loginWithPopup(options, callback);
  }

  var query = this._buildAuthorizeQueryString([
    this._getMode(options),
    options,
    { client_id: this._clientID, redirect_uri: this._getCallbackURL(options) }
  ]);

  var url = 'https://' + this._domain + '/authorize?' + query;

  if (options.popup) {
    this._buildPopupWindow(options, url);
  } else {
    this._redirect(url);
  }
};

/**
 * Compute `options.width` and `options.height` for the popup to
 * open and return and extended object with optimal `top` and `left`
 * position arguments for the popup windows
 *
 * @param {Object} options
 * @private
 */

Auth0.prototype._computePopupPosition = function (options) {
  var width = options.width;
  var height = options.height;

  var screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft;
  var screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop;
  var outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.body.clientWidth;
  var outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : (document.body.clientHeight - 22);
  // XXX: what is the 22?

  // Use `outerWidth - width` and `outerHeight - height` for help in
  // positioning the popup centered relative to the current window
  var left = screenX + (outerWidth - width) / 2;
  var top = screenY + (outerHeight - height) / 2;

  return { width: width, height: height, left: left, top: top };
};

/**
 * loginPhonegap method is triggered when !!window.cordova is true.
 *
 * @method loginPhonegap
 * @private
 * @param {Object}    options   Login options.
 * @param {Function}  callback  To be called after login happened. Callback arguments
 *                              should be:
 *                              function (err, profile, idToken, accessToken, state)
 *
 * @example
 *      var auth0 = new Auth0({ clientId: '...', domain: '...'});
 *
 *      auth0.signin({}, function (err, profile, idToken, accessToken, state) {
 *        if (err) {
 *         alert(err);
 *         return;
 *        }
 *
 *        alert('Welcome ' + profile.name);
 *      });
 */

Auth0.prototype.loginPhonegap = function (options, callback) {
  if (this._shouldAuthenticateWithCordovaPlugin(options.connection)) {
    this._socialPhonegapLogin(options, callback);
    return;
  }

  var mobileCallbackURL = 'https://' + this._domain + '/mobile';
  var self = this;
  var query = this._buildAuthorizeQueryString([
    this._getMode(options),
    options,
    { client_id: this._clientID, redirect_uri: mobileCallbackURL}]);

    var popupUrl = 'https://' + this._domain + '/authorize?' + query;

    var popupOptions = xtend({location: 'yes'} ,
      options.popupOptions);

    // This wasn't send before so we don't send it now either
    delete popupOptions.width;
    delete popupOptions.height;



    var ref = window.open(popupUrl, '_blank', stringifyPopupSettings(popupOptions));
    var answered = false;

    function errorHandler(event) {
      if (answered) { return; }
      callback(new Error(event.message), null, null, null, null);
      answered = true;
      return ref.close();
    }

    function startHandler(event) {
      if (answered) { return; }

      if ( event.url && !(event.url.indexOf(mobileCallbackURL + '#') === 0 ||
                         event.url.indexOf(mobileCallbackURL + '?') === 0)) { return; }

      var result = self.parseHash(event.url.slice(mobileCallbackURL.length));

      if (!result) {
        callback(new Error('Error parsing hash'), null, null, null, null);
        answered = true;
        return ref.close();
      }

      if (result.id_token) {
        self.getProfile(result.id_token, function (err, profile) {
          callback(err, profile, result.id_token, result.access_token, result.state, result.refresh_token);
        });
        answered = true;
        return ref.close();
      }

      // Case where we've found an error
      callback(new Error(result.err || result.error || 'Something went wrong'), null, null, null, null);
      answered = true;
      return ref.close();
    }

    function exitHandler() {
      if (answered) { return; }

      callback(new Error('Browser window closed'), null, null, null, null);

      ref.removeEventListener('loaderror', errorHandler);
      ref.removeEventListener('loadstart', startHandler);
      ref.removeEventListener('exit', exitHandler);
    }

    ref.addEventListener('loaderror', errorHandler);
    ref.addEventListener('loadstart', startHandler);
    ref.addEventListener('exit', exitHandler);

};

/**
 * loginWithPopup method is triggered when login method receives a {popup: true} in
 * the login options.
 *
 * @method loginWithPopup
 * @param {Object}   options    Login options.
 * @param {function} callback   To be called after login happened (whether
 *                              success or failure). This parameter is mandatory when
 *                              option callbackOnLocationHash is truthy but should not
 *                              be used when falsy.
 * @example
 *       var auth0 = new Auth0({ clientId: '...', domain: '...', callbackOnLocationHash: true });
 *
 *       // Error! No callback
 *       auth0.login({popup: true});
 *
 *       // Ok!
 *       auth0.login({popup: true}, function () { });
 *
 * @example
 *       var auth0 = new Auth0({ clientId: '...', domain: '...'});
 *
 *       // Ok!
 *       auth0.login({popup: true});
 *
 *       // Error! No callback will be executed on response_type=code
 *       auth0.login({popup: true}, function () { });
 * @private
 */

Auth0.prototype.loginWithPopup = function(options, callback) {
  var self = this;
  if (!callback) {
    throw new Error('popup mode should receive a mandatory callback');
  }

  var query = this._buildAuthorizeQueryString([
    this._getMode(options),
    options,
    { client_id: this._clientID, owp: true }]);


  var popupUrl = 'https://' + this._domain + '/authorize?' + query;

  var popupOptions = xtend(
    self._computePopupPosition({
      width: (options.popupOptions && options.popupOptions.width) || 500,
      height: (options.popupOptions && options.popupOptions.height) || 600
  }),
    options.popupOptions);


  // TODO Errors should be LoginError for consistency
  var popup = WinChan.open({
    url: popupUrl,
    relay_url: 'https://' + this._domain + '/relay.html',
    window_features: stringifyPopupSettings(popupOptions)
  }, function (err, result) {
    if (err) {
      // Winchan always returns string errors, we wrap them inside Error objects
      return callback(new Error(err), null, null, null, null, null);
    }

    if (result && result.id_token) {
      return self.getProfile(result.id_token, function (err, profile) {
        callback(err, profile, result.id_token, result.access_token, result.state, result.refresh_token);
      });
    }

    // Case where we've found an error
    return callback(new Error(result ? result.err : 'Something went wrong'), null, null, null, null, null);
  });

  popup.focus();
};

/**
 * _shouldAuthenticateWithCordovaPlugin method checks whether Auth0 is properly configured to
 * handle authentication of a social connnection using a phonegap plugin.
 *
 * @param {String}   connection    Name of the connection.
 * @private
 */

Auth0.prototype._shouldAuthenticateWithCordovaPlugin = function(connection) {
  var socialPlugin = this._cordovaSocialPlugins[connection];
  return this._useCordovaSocialPlugins && !!socialPlugin;
};

/**
 * _socialPhonegapLogin performs social authentication using a phonegap plugin
 *
 * @param {String}   connection   Name of the connection.
 * @param {function} callback     To be called after login happened (whether
 *                                success or failure).
 * @private
 */

Auth0.prototype._socialPhonegapLogin = function(options, callback) {
  var socialAuthentication = this._cordovaSocialPlugins[options.connection];
  var self = this;
  socialAuthentication(options.connection_scope, function(error, accessToken, extras) {
    if (error) {
      callback(error, null, null, null, null);
      return;
    }
    var loginOptions = xtend({ access_token: accessToken }, options, extras);
    self.loginWithSocialAccessToken(loginOptions, callback);
  });
};

/**
 * _phonegapFacebookLogin performs social authentication with Facebook using phonegap-facebook-plugin
 *
 * @param {Object}   scopes     FB scopes used to login. It can be an Array of String or a single String.
 *                              By default is ["public_profile"]
 * @param {function} callback   To be called after login happened (whether success or failure). It will
 *                              yield the accessToken and any extra information neeeded by Auth0 API
 *                              or an Error if the authentication fails. Callback should be:
 *                              function (err, accessToken, extras) { }
 * @private
 */

Auth0.prototype._phonegapFacebookLogin = function(scopes, callback) {
  if (!window.facebookConnectPlugin || !window.facebookConnectPlugin.login) {
    callback(new Error('missing plugin phonegap-facebook-plugin'), null, null);
    return;
  }

  var fbScopes;
  if (scopes && is_array(scopes)){
    fbScopes = scopes;
  } else if (scopes) {
    fbScopes = [scopes];
  } else {
    fbScopes = ['public_profile'];
  }
  window.facebookConnectPlugin.login(fbScopes, function (state) {
    callback(null, state.authResponse.accessToken, {});
  }, function(error) {
    callback(new Error(error), null, null);
  });
};

/**
 * This method handles the scenario where a db connection is used with
 * popup: true and sso: true.
 *
 * @private
 */
Auth0.prototype.loginWithUsernamePasswordAndSSO = function (options, callback) {
  var self = this;
  var popupOptions = xtend(
    self._computePopupPosition({
      width: (options.popupOptions && options.popupOptions.width) || 500,
      height: (options.popupOptions && options.popupOptions.height) || 600
  }),
    options.popupOptions);

  // TODO Refactor this with the other winchan logic for loginWithPopup.
  var popup = WinChan.open({
    url: 'https://' + this._domain + '/sso_dbconnection_popup/' + this._clientID,
    relay_url: 'https://' + this._domain + '/relay.html',
    window_features: stringifyPopupSettings(popupOptions),
    popup: this._current_popup,
    params: {
      domain:                 this._domain,
      clientID:               this._clientID,
      options: {
        // TODO What happens with i18n?
        username:   options.username,
        password:   options.password,
        connection: options.connection,
        state:      options.state,
        scope:      options.scope
      }
    }
  }, function (err, result) {
    if (err) {
      // Winchan always returns string errors, we wrap them inside Error objects
      return callback(new LoginError(err), null, null, null, null, null);
    }

    if (result && result.id_token) {
      return self.getProfile(result.id_token, function (err, profile) {
        callback(err, profile, result.id_token, result.access_token, result.state, result.refresh_token);
      });
    }

    // Case we've found an error
    return callback(result && result.err ?
                    new LoginError(result.err.status,
                                   result.err && result.err.details ?
                                     result.err.details :
                                     result.err) :
                    new LoginError('Something went wrong'),
            null, null, null, null, null);
  });

  popup.focus();
};

/**
 * Login with Resource Owner (RO)
 *
 * @param {Object} options
 * @param {Function} callback
 * @method loginWithResourceOwner
 */

Auth0.prototype.loginWithResourceOwner = function (options, callback) {
  var self = this;
  var query = xtend(
    this._getMode(options),
    options,
    {
      client_id:    this._clientID,
      username:     trim(options.username || options.email || ''),
      grant_type:   'password'
    });

  this._configureOfflineMode(query);

  var endpoint = '/oauth/ro';

  function enrichGetProfile(resp, callback) {
    self.getProfile(resp.id_token, function (err, profile) {
      callback(err, profile, resp.id_token, resp.access_token, resp.state, resp.refresh_token);
    });
  }

  if (this._useJSONP) {
    return jsonp('https://' + this._domain + endpoint + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
      if (err) {
        return callback(err);
      }
      if('error' in resp) {
        var error = new LoginError(resp.status, resp.error);
        return callback(error);
      }
      enrichGetProfile(resp, callback);
    });
  }

  reqwest({
    url:     'https://' + this._domain + endpoint,
    method:  'post',
    type:    'json',
    data:    query,
    crossOrigin: true,
    success: function (resp) {
      enrichGetProfile(resp, callback);
    },
    error: function (err) {
      handleRequestError(err, callback);
    }
  });
};

/**
 * Login with Social Access Token
 *
 * @param {Object} options
 * @param {Function} callback
 * @method loginWithSocialAccessToken
 */

Auth0.prototype.loginWithSocialAccessToken = function (options, callback) {
  var self = this;
  var query = this._buildAuthorizationParameters([
      { scope: 'openid' },
      options,
      { client_id: this._clientID }
    ]);

  var endpoint = '/oauth/access_token';

  function enrichGetProfile(resp, callback) {
    self.getProfile(resp.id_token, function (err, profile) {
      callback(err, profile, resp.id_token, resp.access_token, resp.state, resp.refresh_token);
    });
  }

  if (this._useJSONP) {
    return jsonp('https://' + this._domain + endpoint + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
      if (err) {
        return callback(err);
      }
      if('error' in resp) {
        var error = new LoginError(resp.status, resp.error);
        return callback(error);
      }
      enrichGetProfile(resp, callback);
    });
  }

  reqwest({
    url:     'https://' + this._domain + endpoint,
    method:  'post',
    type:    'json',
    data:    query,
    crossOrigin: true,
    success: function (resp) {
      enrichGetProfile(resp, callback);
    },
    error: function (err) {
      handleRequestError(err, callback);
    }
  });
};

/**
 * Open a popup, store the winref in the instance and return it.
 *
 * We usually need to call this method before any ajax transaction in order
 * to prevent the browser to block the popup.
 *
 * @param  {[type]}   options  [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 * @private
 */

Auth0.prototype._buildPopupWindow = function (options, url) {
  if (this._current_popup) {
    return this._current_popup;
  }

  var popupOptions = stringifyPopupSettings(xtend(
                          { width: 500, height: 600 },
                          (options.popupOptions || {})));

  this._current_popup = window.open(url || 'about:blank', 'auth0_signup_popup',popupOptions);

  var self = this;

  if (!this._current_popup) {
    throw new Error('Popup window cannot not been created. Disable popup blocker or make sure to call Auth0 login or singup on an UI event.');
  }

  this._current_popup.kill = function () {
    this.close();
    delete self._current_popup;
  };

  return this._current_popup;
};

/**
 * Login with Username and Password
 *
 * @param {Object} options
 * @param {Function} callback
 * @method loginWithUsernamePassword
 */

Auth0.prototype.loginWithUsernamePassword = function (options, callback) {
  // XXX: Warning: This check is whether callback arguments are
  // fn(err) case callback.length === 1 (a redirect should be performed) vs.
  // fn(err, profile, id_token, access_token, state) callback.length > 1 (no
  // redirect should be performed)
  //
  // Note: Phonegap/Cordova:
  // As the popup is launched using the InAppBrowser plugin the SSO cookie will
  // be set on the InAppBrowser browser. That's why the browser where the app runs
  // won't get the sso cookie. Therefore, we don't allow username password using
  // popup with sso: true in Cordova/Phonegap and we default to resource owner auth.
  if (callback && callback.length > 1 && (!options.sso || window.cordova)) {
    return this.loginWithResourceOwner(options, callback);
  }

  var self = this;
  var popup;

  // TODO We should deprecate this, really hacky and confuses people.
  if (options.popup  && !this._getCallbackOnLocationHash(options)) {
    popup = this._buildPopupWindow(options);
  }

  // When a callback with more than one argument is specified and sso: true then
  // we open a popup and do authentication there.
  if (callback && callback.length > 1 && options.sso ) {
    return this.loginWithUsernamePasswordAndSSO(options, callback);
  }

  var query = xtend(
    this._getMode(options),
    options,
    {
      client_id: this._clientID,
      redirect_uri: this._getCallbackURL(options),
      username: trim(options.username || options.email || ''),
      tenant: this._domain.split('.')[0]
    });

  this._configureOfflineMode(query);

  var endpoint = '/usernamepassword/login';

  if (this._useJSONP) {
    return jsonp('https://' + this._domain + endpoint + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
      if (err) {
        if (popup && popup.kill) { popup.kill(); }
        return callback(err);
      }
      if('error' in resp) {
        if (popup && popup.kill) { popup.kill(); }
        var error = new LoginError(resp.status, resp.error);
        return callback(error);
      }
      self._renderAndSubmitWSFedForm(options, resp.form);
    });
  }

  function return_error (error) {
    if (callback) {
      return callback(error);
    }
    throw error;
  }

  reqwest({
    url:     'https://' + this._domain + endpoint,
    method:  'post',
    type:    'html',
    data:    query,
    crossOrigin: true,
    success: function (resp) {
      self._renderAndSubmitWSFedForm(options, resp);
    },
    error: function (err) {
      if (popup && popup.kill) {
        popup.kill();
      }
      handleRequestError(err, return_error);
    }
  });
};

/**
 * Login with phone number and passcode
 *
 * @param {Object} options
 * @param {Function} callback
 * @method loginWithPhoneNumber
 */
Auth0.prototype.loginWithPhoneNumber = function (options, callback) {

  if ('function' !== typeof callback) {
    throw new Error('callback is required for phone number authentication');
  }

  if (null == options.phone) {
    throw new Error('phone is required for authentication');
  }

  if (null == options.passcode) {
    throw new Error('passcode is required for authentication');
  }

  var opts = xtend({
    connection: 'sms',
    username: options.phone,
    password: options.passcode
  }, opts);

  opts.sso = false;
  delete opts.phone;
  delete opts.passcode;

  this.loginWithResourceOwner(opts, callback);
};

// TODO Document me
Auth0.prototype.renewIdToken = function (id_token, callback) {
  this.getDelegationToken({
    id_token: id_token,
    scope: 'passthrough',
    api: 'auth0'
  }, callback);
};

// TODO Document me
Auth0.prototype.refreshToken = function (refresh_token, callback) {
  this.getDelegationToken({
    refresh_token: refresh_token,
    scope: 'passthrough',
    api: 'auth0'
  }, callback);
};

/**
 * Get delegation token for certain addon or certain other clientId
 *
 * @example
 *
 *     auth0.getDelegationToken({
 *      id_token:   '<user-id-token>',
 *      target:     '<app-client-id>'
 *      api_type: 'auth0'
 *     }, function (err, delegationResult) {
 *        if (err) return console.log(err.message);
 *        // Do stuff with delegation token
 *        expect(delegationResult.id_token).to.exist;
 *        expect(delegationResult.token_type).to.eql('Bearer');
 *        expect(delegationResult.expires_in).to.eql(36000);
 *     });
 *
 * @example
 *
 *      // get a delegation token from a Firebase API App
  *     auth0.getDelegationToken({
 *      id_token:   '<user-id-token>',
 *      target:     '<app-client-id>'
 *      api_type: 'firebase'
 *     }, function (err, delegationResult) {
 *      // Use your firebase token here
 *    });
 *
 * @method getDelegationToken
 * @param {Object} [options]
 * @param {String} [id_token]
 * @param {String} [target]
 * @param {String} [api_type]
 * @param {Function} [callback]
 */
Auth0.prototype.getDelegationToken = function (options, callback) {
  options = options || {};

  if (!options.id_token && !options.refresh_token ) {
    throw new Error('You must send either an id_token or a refresh_token to get a delegation token.');
  }

  var query = xtend({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    client_id:  this._clientID,
    target: options.targetClientId || this._clientID,
    api_type: options.api
  }, options);

  delete query.hasOwnProperty;
  delete query.targetClientId;
  delete query.api;

  var endpoint = '/delegation';

  if (this._useJSONP) {
    return jsonp('https://' + this._domain + endpoint + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
      if (err) {
        return callback(err);
      }
      if('error' in resp) {
        var error = new LoginError(resp.status, resp.error_description || resp.error);
        return callback(error);
      }
      callback(null, resp);
    });
  }

  reqwest({
    url:     'https://' + this._domain + endpoint,
    method:  'post',
    type:    'json',
    data:    query,
    crossOrigin: true,
    success: function (resp) {
      callback(null, resp);
    },
    error: function (err) {
      try {
        callback(JSON.parse(err.responseText));
      }
      catch (e) {
        var er = err;
        var isAffectedIEVersion = isInternetExplorer() === 10 || isInternetExplorer() === 11;
        var zeroStatus = (!er.status || er.status === 0);

        // Request failed because we are offline.
        // See: http://caniuse.com/#search=navigator.onLine
        if (zeroStatus && !window.navigator.onLine) {
          er = {};
          er.status = 0;
          er.responseText = {
            code: 'offline'
          };
        // http://stackoverflow.com/questions/23229723/ie-10-11-cors-status-0
        // XXX IE10 when a request fails in CORS returns status code 0
        // XXX This is not handled by handleRequestError as the errors are different
        } else if (zeroStatus && isAffectedIEVersion) {
          er = {};
          er.status = 401;
          er.responseText = {
            code: 'invalid_operation'
          };
        // If not IE10/11 and not offline it means that Auth0 host is unreachable:
        // Connection Timeout or Connection Refused.
        } else if (zeroStatus) {
          er = {};
          er.status = 0;
          er.responseText = {
            code: 'connection_refused_timeout'
          };
        } else {
          er.responseText = err;
        }
        callback(new LoginError(er.status, er.responseText));
      }
    }
  });
};

/**
 * Trigger logout redirect with
 * params from `query` object
 *
 * @example
 *
 *     auth0.logout();
 *     // redirects to -> 'https://yourapp.auth0.com/logout'
 *
 * @example
 *
 *     auth0.logout({returnTo: 'http://logout'});
 *     // redirects to -> 'https://yourapp.auth0.com/logout?returnTo=http://logout'
 *
 * @method logout
 * @param {Object} query
 */

Auth0.prototype.logout = function (query) {
  var url = 'https://' + this._domain + '/logout';
  if (query) {
    url += '?' + qs.stringify(query);
  }
  this._redirect(url);
};

/**
 * Get single sign on Data
 *
 * @example
 *
 *     auth0.getSSOData(function (err, ssoData) {
 *       if (err) return console.log(err.message);
 *       expect(ssoData.sso).to.exist;
 *     });
 *
 * @example
 *
 *     auth0.getSSOData(false, fn);
 *
 * @method getSSOData
 * @param {Boolean} withActiveDirectories
 * @param {Function} callback
 */

Auth0.prototype.getSSOData = function (withActiveDirectories, callback) {
  if (typeof withActiveDirectories === 'function') {
    callback = withActiveDirectories;
    withActiveDirectories = false;
  }

  var url = 'https://' + this._domain + '/user/ssodata';

  if (withActiveDirectories) {
    url += '?' + qs.stringify({ldaps: 1, client_id: this._clientID});
  }

  // override timeout
  var jsonpOptions = xtend({}, jsonpOpts, { timeout: 3000 });

  return jsonp(url, jsonpOptions, function (err, resp) {
    callback(null, err ? {sso:false} : resp); // Always return OK, regardless of any errors
  });
};

/**
 * Get all configured connections for a client
 *
 * @example
 *
 *     auth0.getConnections(function (err, conns) {
 *       if (err) return console.log(err.message);
 *       expect(conns.length).to.be.above(0);
 *       expect(conns[0].name).to.eql('Apprenda.com');
 *       expect(conns[0].strategy).to.eql('adfs');
 *       expect(conns[0].status).to.eql(false);
 *       expect(conns[0].domain).to.eql('Apprenda.com');
 *       expect(conns[0].domain_aliases).to.eql(['Apprenda.com', 'foo.com', 'bar.com']);
 *     });
 *
 * @method getConnections
 * @param {Function} callback
 */
// XXX We may change the way this method works in the future to use client's s3 file.

Auth0.prototype.getConnections = function (callback) {
  return jsonp('https://' + this._domain + '/public/api/' + this._clientID + '/connections', jsonpOpts, callback);
};

/**
 * Send SMS to do passwordless authentication
 *
 * @example
 *
 *     auth0.requestSMSCode(apiToken, phoneNumber, function (err, result) {
 *       if (err) return console.log(err.message);
 *       console.log(result);
 *     });
 *
 * @method requestSMSCode
 * @param {Object} options
 * @param {Function} callback
 */

Auth0.prototype.requestSMSCode = function (options, callback) {
  if ('object' !== typeof options) {
    throw new Error('An options object is required');
  }
  if ('function' !== typeof callback) {
    throw new Error('A callback function is required');
  }

  assert_required(options, 'apiToken');
  assert_required(options, 'phone');

  var apiToken = options.apiToken;
  var phone = options.phone;

  return reqwest({
    url:          'https://' + this._domain + '/api/v2/users',
    method:       'post',
    type:         'json',
    crossOrigin:  true,
    headers:      {
      Authorization: 'Bearer ' + apiToken
    },
    data:         {
      phone_number:   phone,
      connection:     'sms',
      email_verified: false
    }
  })
  .fail(function (err) {
    try {
      callback(JSON.parse(err.responseText));
    } catch (e) {
      var error = new Error(err.status + '(' + err.statusText + '): ' + err.responseText);
      error.statusCode = err.status;
      error.error = err.statusText;
      error.message = err.responseText;
      callback(error);
    }
  })
  .then(function (result) {
    callback(null, result);
  });
};

/**
 * Expose `Auth0` constructor
 */

module.exports = Auth0;
