;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};/**
 * Module dependencies.
 */

var Base64Url         = require('./lib/base64_url');
var assert_required   = require('./lib/assert_required');
var is_array          = require('./lib/is-array');

var qs                = require('qs');
var xtend             = require('xtend');
var trim              = require('trim');
var reqwest           = require('reqwest');
var WinChan           = require('winchan');

var jsonp             = require('jsonp');
var jsonpOpts         = { param: 'cbx', timeout: 8000, prefix: '__auth0jp' };

var same_origin       = require('./lib/same-origin');
var json_parse        = require('./lib/json-parse');
var LoginError        = require('./lib/LoginError');
var use_jsonp         = require('./lib/use_jsonp');

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
 * join url from protocol
 */

function joinUrl(protocol, domain, endpoint) {
  return protocol + '//' + domain + endpoint;
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

  this._useJSONP = null != options.forceJSONP ?
                    !!options.forceJSONP :
                    use_jsonp() && !same_origin('https:', options.domain);

  this._clientID = options.clientID;
  this._callbackURL = options.callbackURL || document.location.href;
  this._shouldRedirect = !!options.callbackURL;
  this._domain = options.domain;
  this._callbackOnLocationHash = false || options.callbackOnLocationHash;
  this._cordovaSocialPlugins = {
    facebook: this._phonegapFacebookLogin
  };
  this._useCordovaSocialPlugins = false || options.useCordovaSocialPlugins;
  this._sendClientInfo = null != options.sendSDKClientInfo ? options.sendSDKClientInfo : true;
}

/**
 * Export version with `Auth0` constructor
 *
 * @property {String} version
 */

Auth0.version = require('./version.json').version;

/**
 * Export client info object
 *
 *
 * @property {Hash}
 */

Auth0.clientInfo = { name: 'auth0.js', version: Auth0.version };


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

Auth0.prototype._getClientInfoString = function () {
  var clientInfo = JSON.stringify(Auth0.clientInfo);
  return Base64Url.encode(clientInfo);
};

Auth0.prototype._getClientInfoHeader = function () {
  return {
    'Auth0-Client': this._getClientInfoString()
  };
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

  if (!(profile && !profile.user_id)) {
    return callback(null, profile);
  }

  // the scope was just openid
  var _this = this;
  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = '/tokeninfo';
  var url = joinUrl(protocol, domain, endpoint);

  var fail = function (status, description) {
    var error = new Error(status + ': ' + (description || ''));

    // These two properties are added for compatibility with old versions (no Error instance was returned)
    error.error = status;
    error.error_description = description;

    callback(error);
  };

  if (this._useJSONP) {
    return jsonp(url + '?' + qs.stringify({id_token: id_token}), jsonpOpts, function (err, resp) {
      if (err) {
        return fail(0, err.toString());
      }

      return resp.status === 200 ?
        callback(null, resp.user) :
        fail(resp.status, resp.err || resp.error);
    });
  }

  return reqwest({
    url:          same_origin(protocol, domain) ? endpoint : url,
    method:       'post',
    type:         'json',
    crossOrigin:  !same_origin(protocol, domain),
    data:         {id_token: id_token}
  }).fail(function (err) {
    fail(err.status, err.responseText);
  }).then(function (userinfo) {
    callback(null, userinfo);
  });

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
  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = '/public/api/users/validate_userpassword';
  var url = joinUrl(protocol, domain, endpoint);

  var query = xtend(
    options,
    {
      client_id:    this._clientID,
      username:     trim(options.username || options.email || '')
    });

  if (this._useJSONP) {
    return jsonp(url + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
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
    url:     same_origin(protocol, domain) ? endpoint : url,
    method:  'post',
    type:    'text',
    data:    query,
    crossOrigin: !same_origin(protocol, domain),
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
  return json_parse(Base64Url.decode(encoded));
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
  var _this = this;

  var opts = {
    client_id: this._clientID,
    redirect_uri: this._getCallbackURL(options),
    username: trim(options.username || ''),
    email: trim(options.email || options.username || ''),
    tenant: this._domain.split('.')[0]
  };

  var query = xtend(this._getMode(options), options, opts);

  this._configureOfflineMode(query);

  // TODO Change this to a property named 'disableSSO' for consistency.
  // By default, options.sso is true
  if (!checkIfSet(options, 'sso')) {
    options.sso = true;
  }

  if (!checkIfSet(options, 'auto_login')) {
    options.auto_login = true;
  }

  var popup;

  var will_popup = options.auto_login && options.popup
    && (!this._getCallbackOnLocationHash(options) || options.sso);

  if (will_popup) {
    popup = this._buildPopupWindow(options);
  }

  function success () {
    if (options.auto_login) {
      return _this.login(options, callback);
    }

    if ('function' === typeof callback) {
      return callback();
    }
  }

  function fail (status, resp) {
    var error = new LoginError(status, resp);

    // when failed we want the popup closed if opened
    if (popup && 'function' === typeof popup.kill) {
      popup.kill();
    }

    if ('function' === typeof callback) {
      return callback(error);
    }

    throw error;
  }

  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = '/dbconnections/signup';
  var url = joinUrl(protocol, domain, endpoint);

  if (this._useJSONP) {
    return jsonp(url + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
      if (err) {
        return fail(0, err);
      }

      return resp.status == 200 ? success() :
              fail(resp.status, resp.err || resp.error);
    });
  }

  reqwest({
    url:     same_origin(protocol, domain) ? endpoint : url,
    method:  'post',
    type:    'html',
    data:    query,
    success: success,
    crossOrigin: !same_origin(protocol, domain),
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

  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = '/dbconnections/change_password';
  var url = joinUrl(protocol, domain, endpoint);

  if (this._useJSONP) {
    return jsonp(url + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
      if (err) {
        return fail(0, err);
      }
      return resp.status == 200 ?
              callback(null, resp.message) :
              fail(resp.status, resp.err || resp.error);
    });
  }

  reqwest({
    url:     same_origin(protocol, domain) ? endpoint : url,
    method:  'post',
    type:    'html',
    data:    query,
    crossOrigin: !same_origin(protocol, domain),
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

  // Adds client SDK information (when enabled)
  if ( this._sendClientInfo ) query['auth0Client'] = this._getClientInfoString();

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

  if (typeof options.passcode !== 'undefined') {
    return this.loginWithPasscode(options, callback);
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

  this._authorize(options);
};

Auth0.prototype._authorize = function(options) {
  var qs = [
    this._getMode(options),
    options,
    {
      client_id: this._clientID,
      redirect_uri: this._getCallbackURL(options)
    }
  ];

  var query = this._buildAuthorizeQueryString(qs);

  var url = joinUrl('https:', this._domain, '/authorize?' + query);

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
  options = options || {};
  var width = options.width || 500;
  var height = options.height || 600;

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

  var mobileCallbackURL = joinUrl('https:', this._domain, '/mobile');
  var _this = this;
  var qs = [
    this._getMode(options),
    options,
    {
      client_id: this._clientID,
      redirect_uri: mobileCallbackURL
    }
  ];

  if ( this._sendClientInfo ) {
    qs.push({ auth0Client: this._getClientInfoString() });
  }

  var query = this._buildAuthorizeQueryString(qs);

  var popupUrl = joinUrl('https:', this._domain, '/authorize?' + query);

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

    var result = _this.parseHash(event.url.slice(mobileCallbackURL.length));

    if (!result) {
      callback(new Error('Error parsing hash'), null, null, null, null);
      answered = true;
      return ref.close();
    }

    if (result.id_token) {
      _this.getProfile(result.id_token, function (err, profile) {
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
  var _this = this;

  if (!callback) {
    throw new Error('popup mode should receive a mandatory callback');
  }

  var qs = [this._getMode(options), options, { client_id: this._clientID, owp: true }];

  if (this._sendClientInfo) {
    qs.push({ auth0Client: this._getClientInfoString() });
  }

  var query = this._buildAuthorizeQueryString(qs);
  var popupUrl = joinUrl('https:', this._domain, '/authorize?' + query);

  var popupPosition = this._computePopupPosition(options.popupOptions);
  var popupOptions = xtend(popupPosition, options.popupOptions);

  var popup = WinChan.open({
    url: popupUrl,
    relay_url: 'https://' + this._domain + '/relay.html',
    window_features: stringifyPopupSettings(popupOptions)
  }, function (err, result) {
    // Eliminate `_current_popup` reference manually because
    // Winchan removes `.kill()` method from window and also
    // doesn't call `.kill()` by itself
    _this._current_popup = null;

    // Winchan always returns string errors, we wrap them inside Error objects
    if (err) {
      return callback(new LoginError(err), null, null, null, null, null);
    }

    // Handle edge case with generic error
    if (!result) {
      return callback(new LoginError('Something went wrong'), null, null, null, null, null);
    }

    // Handle profile retrieval from id_token and respond
    if (result.id_token) {
      return _this.getProfile(result.id_token, function (err, profile) {
        callback(err, profile, result.id_token, result.access_token, result.state, result.refresh_token);
      });
    }

    // Case where the error is returned at an `err` property from the result
    if (result.err) {
      return callback(new LoginError(result.err.status, result.err.details || result.err), null, null, null, null, null);
    }

    // Case for sso_dbconnection_popup returning error at result.error instead of result.err
    if (result.error) {
      return callback(new LoginError(result.status, result.details || result), null, null, null, null, null);
    }

    // Case we couldn't match any error, we return a generic one
    return callback(new LoginError('Something went wrong'), null, null, null, null, null);
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
  var _this = this;
  socialAuthentication(options.connection_scope, function(error, accessToken, extras) {
    if (error) {
      callback(error, null, null, null, null);
      return;
    }
    var loginOptions = xtend({ access_token: accessToken }, options, extras);
    _this.loginWithSocialAccessToken(loginOptions, callback);
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
  var _this = this;
  var popupPosition = this._computePopupPosition(options.popupOptions);
  var popupOptions = xtend(popupPosition, options.popupOptions);

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
    // Eliminate `_current_popup` reference manually because
    // Winchan removes `.kill()` method from window and also
    // doesn't call `.kill()` by itself
    _this._current_popup = null;

    // Winchan always returns string errors, we wrap them inside Error objects
    if (err) {
      return callback(new LoginError(err), null, null, null, null, null);
    }

    // Handle edge case with generic error
    if (!result) {
      return callback(new LoginError('Something went wrong'), null, null, null, null, null);
    }

    // Handle profile retrieval from id_token and respond
    if (result.id_token) {
      return _this.getProfile(result.id_token, function (err, profile) {
        callback(err, profile, result.id_token, result.access_token, result.state, result.refresh_token);
      });
    }

    // Case where the error is returned at an `err` property from the result
    if (result.err) {
      return callback(new LoginError(result.err.status, result.err.details || result.err), null, null, null, null, null);
    }

    // Case for sso_dbconnection_popup returning error at result.error instead of result.err
    if (result.error) {
      return callback(new LoginError(result.status, result.details || result), null, null, null, null, null);
    }

    // Case we couldn't match any error, we return a generic one
    return callback(new LoginError('Something went wrong'), null, null, null, null, null);
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
  var _this = this;
  var query = xtend(
    this._getMode(options),
    options,
    {
      client_id:    this._clientID,
      username:     trim(options.username || options.email || ''),
      grant_type:   'password'
    });

  this._configureOfflineMode(query);

  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = '/oauth/ro';
  var url = joinUrl(protocol, domain, endpoint);

  if ( this._sendClientInfo && this._useJSONP ) {
    query['auth0Client'] = this._getClientInfoString();
  }

  function enrichGetProfile(resp, callback) {
    _this.getProfile(resp.id_token, function (err, profile) {
      callback(err, profile, resp.id_token, resp.access_token, resp.state, resp.refresh_token);
    });
  }

  if (this._useJSONP) {
    return jsonp(url + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
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
    url:     same_origin(protocol, domain) ? endpoint : url,
    method:  'post',
    type:    'json',
    data:    query,
    headers: this._getClientInfoHeader(),
    crossOrigin: !same_origin(protocol, domain),
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
  var _this = this;
  var query = this._buildAuthorizationParameters([
      { scope: 'openid' },
      options,
      { client_id: this._clientID }
    ]);

  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = '/oauth/access_token';
  var url = joinUrl(protocol, domain, endpoint);

  function enrichGetProfile(resp, callback) {
    _this.getProfile(resp.id_token, function (err, profile) {
      callback(err, profile, resp.id_token, resp.access_token, resp.state, resp.refresh_token);
    });
  }

  if (this._useJSONP) {
    return jsonp(url + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
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
    url:     same_origin(protocol, domain) ? endpoint : url,
    method:  'post',
    type:    'json',
    data:    query,
    headers: this._getClientInfoHeader(),
    crossOrigin: !same_origin(protocol, domain),
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
  if (this._current_popup && !this._current_popup.closed) {
    return this._current_popup;
  }

  url = url || 'about:blank'

  var _this = this;
  var defaults = { width: 500, height: 600 };
  var opts = xtend(defaults, options.popupOptions || {});
  var popupOptions = stringifyPopupSettings(opts);

  this._current_popup = window.open(url, 'auth0_signup_popup', popupOptions);

  if (!this._current_popup) {
    throw new Error('Popup window cannot not been created. Disable popup blocker or make sure to call Auth0 login or singup on an UI event.');
  }

  this._current_popup.kill = function () {
    this.close();
    _this._current_popup = null;
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

  var _this = this;
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

  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = '/usernamepassword/login';
  var url = joinUrl(protocol, domain, endpoint);

  if (this._useJSONP) {
    return jsonp(url + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
      if (err) {
        if (popup && popup.kill) { popup.kill(); }
        return callback(err);
      }
      if('error' in resp) {
        if (popup && popup.kill) { popup.kill(); }
        var error = new LoginError(resp.status, resp.error);
        return callback(error);
      }
      _this._renderAndSubmitWSFedForm(options, resp.form);
    });
  }

  function return_error (error) {
    if (callback) {
      return callback(error);
    }
    throw error;
  }

  reqwest({
    url:     same_origin(protocol, domain) ? endpoint : url,
    method:  'post',
    type:    'html',
    data:    query,
    headers: this._getClientInfoHeader(),
    crossOrigin: !same_origin(protocol, domain),
    success: function (resp) {
      _this._renderAndSubmitWSFedForm(options, resp);
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
Auth0.prototype.loginWithPasscode = function (options, callback) {

  if (options.email == null && options.phoneNumber == null) {
    throw new Error('email or phoneNumber is required for authentication');
  }

  if (options.passcode == null) {
    throw new Error('passcode is required for authentication');
  }

  options.connection = options.email == null ? 'sms' : 'email';

  if (!this._shouldRedirect) {
    options = xtend(options, {
      username: options.email == null ? options.phoneNumber : options.email,
      password: options.passcode,
      sso: false
    });

    delete options.email;
    delete options.phoneNumber;
    delete options.passcode;

    return this.loginWithResourceOwner(options, callback);
  }

  var verifyOptions = {connection: options.connection};

  if (options.phoneNumber) {
    options.phone_number = options.phoneNumber;
    delete options.phoneNumber;

    verifyOptions.phone_number = options.phone_number;
  }

  if (options.email) {
    verifyOptions.email = options.email;
  }

  options.verification_code = options.passcode;
  delete options.passcode;

  verifyOptions.verification_code = options.verification_code;

  var _this = this;
  this._verify(verifyOptions, function(error) {
    if (error) {
      return callback(error);
    }
    _this._verify_redirect(options);
  });
};

Auth0.prototype._verify = function(options, callback) {
  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = '/passwordless/verify';
  var url = joinUrl(protocol, domain, endpoint);

  var data = options;

  if (this._useJSONP) {
    if (this._sendClientInfo) {
      data['auth0Client'] = this._getClientInfoString();
    }

    return jsonp(url + '?' + qs.stringify(data), jsonpOpts, function (err, resp) {
      if (err) {
        return callback(new Error(0 + ': ' + err.toString()));
      }
      // /**/ typeof __auth0jp0 === 'function' && __auth0jp0({"status":400});
      return resp.status === 200 ? callback(null, true) : callback({status: resp.status});
    });
  }

  return reqwest({
    url:          same_origin(protocol, domain) ? endpoint : url,
    method:       'post',
    headers:      this._getClientInfoHeader(),
    crossOrigin:  !same_origin(protocol, domain),
    data:         data
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
}

Auth0.prototype._verify_redirect = function(options) {
  var qs = [
    this._getMode(options),
    options,
    {
      client_id: this._clientID,
      redirect_uri: this._getCallbackURL(options)
    }
  ];

  var query = this._buildAuthorizeQueryString(qs);
  var url = joinUrl('https:', this._domain, '/passwordless/verify_redirect?' + query);

  this._redirect(url);
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

  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = '/delegation';
  var url = joinUrl(protocol, domain, endpoint);

  if (this._useJSONP) {
    return jsonp(url + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
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
    url:     same_origin(protocol, domain) ? endpoint : url,
    method:  'post',
    type:    'json',
    data:    query,
    crossOrigin: !same_origin(protocol, domain),
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
  var url = joinUrl('https:', this._domain, '/logout');
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

  var url = joinUrl('https:', this._domain, '/user/ssodata');

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
 * Send email or SMS to do passwordless authentication
 *
 * @example
 *     // To send an email
 *     auth0.startPasswordless({email: 'foo@bar.com'}, function (err, result) {
 *       if (err) return console.log(err.error_description);
 *       console.log(result);
 *     });
 *
 * @example
 *     // To send a SMS
 *     auth0.startPasswordless({phoneNumber: '+14251112222'}, function (err, result) {
 *       if (err) return console.log(err.error_description);
 *       console.log(result);
 *     });
 *
 * @method startPasswordless
 * @param {Object} options
 * @param {Function} callback
 */

Auth0.prototype.startPasswordless = function (options, callback) {
  if ('object' !== typeof options) {
    throw new Error('An options object is required');
  }
  if ('function' !== typeof callback) {
    throw new Error('A callback function is required');
  }
  if (!options.email && !options.phoneNumber) {
    throw new Error('An `email` or a `phoneNumber` is required.');
  }

  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = '/passwordless/start';
  var url = joinUrl(protocol, domain, endpoint);

  var data = {client_id: this._clientID};
  if (options.email) {
    data.email = options.email;
    data.connection = 'email';
    if (options.authParams) {
      data.authParams = options.authParams;
    }

    if (!options.send || options.send === "link") {
      if (!data.authParams) {
        data.authParams = {};
      }

      data.authParams.redirect_uri = this._callbackURL;
      data.authParams.response_type = this._shouldRedirect && !this._callbackOnLocationHash ?
        "code" : "token";
    }

    if (options.send) {
      data.send = options.send;
    }
  } else {
    data.phone_number = options.phoneNumber;
    data.connection = 'sms';
  }

  if (this._useJSONP) {
    if (this._sendClientInfo) {
      data['auth0Client'] = this._getClientInfoString();
    }

    return jsonp(url + '?' + qs.stringify(data), jsonpOpts, function (err, resp) {
      if (err) {
        return callback(new Error(0 + ': ' + err.toString()));
      }
      return resp.status === 200 ? callback(null, true) : callback(resp.err || resp.error);
    });
  }

  return reqwest({
    url:          same_origin(protocol, domain) ? endpoint : url,
    method:       'post',
    type:         'json',
    headers:      this._getClientInfoHeader(),
    crossOrigin:  !same_origin(protocol, domain),
    data:         data
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

Auth0.prototype.requestMagicLink = function(attrs, cb) {
  return this.startPasswordless(attrs, cb);
};

Auth0.prototype.requestEmailCode = function(attrs, cb) {
  attrs.send = "code";
  return this.startPasswordless(attrs, cb);
};

Auth0.prototype.verifyEmailCode = function(attrs, cb) {
  attrs.passcode = attrs.code;
  delete attrs.code;
  return this.login(attrs, cb);
};

Auth0.prototype.requestSMSCode = function(attrs, cb) {
  return this.startPasswordless(attrs, cb);
};

Auth0.prototype.verifySMSCode = function(attrs, cb) {
  attrs.passcode = attrs.code;
  delete attrs.code;
  return this.login(attrs, cb);
};

/**
 * Expose `Auth0` constructor
 */

module.exports = Auth0;

},{"./lib/LoginError":2,"./lib/assert_required":3,"./lib/base64_url":4,"./lib/is-array":5,"./lib/json-parse":6,"./lib/same-origin":7,"./lib/use_jsonp":8,"./version.json":26,"jsonp":14,"qs":15,"reqwest":16,"trim":17,"winchan":18,"xtend":20}],2:[function(require,module,exports){
/**
 * Module dependencies.
 */

var json_parse = require('./json-parse');

/**
 * Expose `LoginError`
 */

module.exports = LoginError;

/**
 * Create a `LoginError` by extend of `Error`
 *
 * @param {Number} status
 * @param {String} details
 * @public
 */

function LoginError(status, details) {
  var obj;

  if (typeof details == 'string') {
    try {
      obj = json_parse(details);
    } catch (er) {
      obj = { message: details };
    }
  } else {
    obj = details || { description: 'server error' };
  }

  if (!obj.code) {
    obj.code = obj.error;
  }

  if ('unauthorized' === obj.code) {
    status = 401;
  }

  var err = Error.call(this, obj.description || obj.message || obj.error);

  err.status = status;
  err.name = obj.code;
  err.code = obj.code;
  err.details = obj;

  if (status === 0) {
    if (!err.code || err.code !== 'offline') {
      err.code = 'Unknown';
      err.message = 'Unknown error.';
    }
  }

  return err;
}

/**
 * Extend `LoginError.prototype` with `Error.prototype`
 * and `LoginError` as constructor
 */

if (Object && Object.create) {
  LoginError.prototype = Object.create(Error.prototype, {
    constructor: { value: LoginError }
  });
}

},{"./json-parse":6}],3:[function(require,module,exports){
/**
 * Expose `required`
 */

module.exports = required;

/**
 * Assert `prop` as requirement of `obj`
 *
 * @param {Object} obj
 * @param {prop} prop
 * @public
 */

function required (obj, prop) {
  if (!obj[prop]) {
    throw new Error(prop + ' is required.');
  }
}

},{}],4:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Base64 = require('Base64');

/**
 * Expose `base64_url_decode`
 */

module.exports = {
  encode: encode,
  decode: decode
};

/**
 * Encode a `base64` `encodeURIComponent` string
 *
 * @param {string} str
 * @public
 */

function encode(str) {
  return Base64.btoa(str)
      .replace(/\+/g, '-') // Convert '+' to '-'
      .replace(/\//g, '_') // Convert '/' to '_'
      .replace(/=+$/, ''); // Remove ending '='
}

/**
 * Decode a `base64` `encodeURIComponent` string
 *
 * @param {string} str
 * @public
 */

function decode(str) {
  // Add removed at end '='
  str += Array(5 - str.length % 4).join('=');

  str = str
    .replace(/\-/g, '+') // Convert '-' to '+'
    .replace(/\_/g, '/'); // Convert '_' to '/'

  return Base64.atob(str);
}
},{"Base64":9}],5:[function(require,module,exports){
/**
 * Module dependencies.
 */

var toString = Object.prototype.toString;

/**
 * Resolve `isArray` as native or fallback
 */

module.exports = null != Array.isArray
  ? Array.isArray
  : isArray;

/**
 * Wrap `Array.isArray` Polyfill for IE9
 * source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
 *
 * @param {Array} array
 * @public
 */

function isArray (array) {
  return toString.call(array) === '[object Array]';
};

},{}],6:[function(require,module,exports){
/**
 * Expose `JSON.parse` method or fallback if not
 * exists on `window`
 */

module.exports = 'undefined' === typeof window.JSON
  ? require('json-fallback').parse
  : window.JSON.parse;

},{"json-fallback":13}],7:[function(require,module,exports){
/**
 * Check for same origin policy
 */

var protocol = window.location.protocol;
var domain = window.location.hostname;
var port = window.location.port;

module.exports = same_origin;

function same_origin (tprotocol, tdomain, tport) {
  tport = tport || '';
  return protocol === tprotocol && domain === tdomain && port === tport;
}

},{}],8:[function(require,module,exports){
/**
 * Expose `use_jsonp`
 */

module.exports = use_jsonp;

/**
 * Return true if `jsonp` is required
 *
 * @return {Boolean}
 * @public
 */

function use_jsonp() {
  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : null;

  if (xhr && 'withCredentials' in xhr) {
    return false;
  }

  // We no longer support XDomainRequest for IE8 and IE9 for CORS because it has many quirks.
  // if ('XDomainRequest' in window && window.location.protocol === 'https:') {
  //   return false;
  // }

  return true;
}
},{}],9:[function(require,module,exports){
;(function () {

  var
    object = typeof exports != 'undefined' ? exports : this, // #8: web workers
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    INVALID_CHARACTER_ERR = (function () {
      // fabricate a suitable error object
      try { document.createElement('$'); }
      catch (error) { return error; }}());

  // encoder
  // [https://gist.github.com/999166] by [https://github.com/nignag]
  object.btoa || (
  object.btoa = function (input) {
    for (
      // initialize result and counter
      var block, charCode, idx = 0, map = chars, output = '';
      // if the next input index does not exist:
      //   change the mapping table to "="
      //   check if d has no fractional digits
      input.charAt(idx | 0) || (map = '=', idx % 1);
      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
    ) {
      charCode = input.charCodeAt(idx += 3/4);
      if (charCode > 0xFF) throw INVALID_CHARACTER_ERR;
      block = block << 8 | charCode;
    }
    return output;
  });

  // decoder
  // [https://gist.github.com/1020396] by [https://github.com/atk]
  object.atob || (
  object.atob = function (input) {
    input = input.replace(/=+$/, '')
    if (input.length % 4 == 1) throw INVALID_CHARACTER_ERR;
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = input.charAt(idx++);
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  });

}());

},{}],10:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // This hackery is required for IE8,
  // where the `console.log` function doesn't have 'apply'
  return 'object' == typeof console
    && 'function' == typeof console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      localStorage.removeItem('debug');
    } else {
      localStorage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = localStorage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

},{"./debug":11}],11:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":12}],12:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 's':
      return n * s;
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],13:[function(require,module,exports){
/*
    json2.js
    2011-10-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON = {};

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

module.exports = JSON
},{}],14:[function(require,module,exports){
/**
 * Module dependencies
 */

var debug = require('debug')('jsonp');

/**
 * Module exports.
 */

module.exports = jsonp;

/**
 * Callback index.
 */

var count = 0;

/**
 * Noop function.
 */

function noop(){}

/**
 * JSONP handler
 *
 * Options:
 *  - param {String} qs parameter (`callback`)
 *  - timeout {Number} how long after a timeout error is emitted (`60000`)
 *
 * @param {String} url
 * @param {Object|Function} optional options / callback
 * @param {Function} optional callback
 */

function jsonp(url, opts, fn){
  if ('function' == typeof opts) {
    fn = opts;
    opts = {};
  }
  if (!opts) opts = {};

  var prefix = opts.prefix || '__jp';
  var param = opts.param || 'callback';
  var timeout = null != opts.timeout ? opts.timeout : 60000;
  var enc = encodeURIComponent;
  var target = document.getElementsByTagName('script')[0] || document.head;
  var script;
  var timer;

  // generate a unique id for this request
  var id = prefix + (count++);

  if (timeout) {
    timer = setTimeout(function(){
      cleanup();
      if (fn) fn(new Error('Timeout'));
    }, timeout);
  }

  function cleanup(){
    script.parentNode.removeChild(script);
    window[id] = noop;
  }

  window[id] = function(data){
    debug('jsonp got', data);
    if (timer) clearTimeout(timer);
    cleanup();
    if (fn) fn(null, data);
  };

  // add qs component
  url += (~url.indexOf('?') ? '&' : '?') + param + '=' + enc(id);
  url = url.replace('?&', '?');

  debug('jsonp req "%s"', url);

  // create script
  script = document.createElement('script');
  script.src = url;
  target.parentNode.insertBefore(script, target);
}

},{"debug":10}],15:[function(require,module,exports){
/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Object#hasOwnProperty ref
 */

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Array#indexOf shim.
 */

var indexOf = typeof Array.prototype.indexOf === 'function'
  ? function(arr, el) { return arr.indexOf(el); }
  : function(arr, el) {
      if (typeof arr == 'string' && typeof "a"[0] == 'undefined') {
        arr = arr.split('');
      }
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] === el) return i;
      }
      return -1;
    };

/**
 * Array.isArray shim.
 */

var isArray = Array.isArray || function(arr) {
  return toString.call(arr) == '[object Array]';
};

/**
 * Object.keys shim.
 */

var objectKeys = Object.keys || function(obj) {
  var ret = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret.push(key);
    }
  }
  return ret;
};

/**
 * Array#forEach shim.
 */

var forEach = typeof Array.prototype.forEach === 'function'
  ? function(arr, fn) { return arr.forEach(fn); }
  : function(arr, fn) {
      for (var i = 0; i < arr.length; i++) fn(arr[i]);
    };

/**
 * Array#reduce shim.
 */

var reduce = function(arr, fn, initial) {
  if (typeof arr.reduce === 'function') return arr.reduce(fn, initial);
  var res = initial;
  for (var i = 0; i < arr.length; i++) res = fn(res, arr[i]);
  return res;
};

/**
 * Cache non-integer test regexp.
 */

var isint = /^[0-9]+$/;

function promote(parent, key) {
  if (parent[key].length == 0) return parent[key] = {}
  var t = {};
  for (var i in parent[key]) {
    if (hasOwnProperty.call(parent[key], i)) {
      t[i] = parent[key][i];
    }
  }
  parent[key] = t;
  return t;
}

function parse(parts, parent, key, val) {
  var part = parts.shift();

  // illegal
  if (hasOwnProperty.call(Object.prototype, key)) return;

  // end
  if (!part) {
    if (isArray(parent[key])) {
      parent[key].push(val);
    } else if ('object' == typeof parent[key]) {
      parent[key] = val;
    } else if ('undefined' == typeof parent[key]) {
      parent[key] = val;
    } else {
      parent[key] = [parent[key], val];
    }
    // array
  } else {
    var obj = parent[key] = parent[key] || [];
    if (']' == part) {
      if (isArray(obj)) {
        if ('' != val) obj.push(val);
      } else if ('object' == typeof obj) {
        obj[objectKeys(obj).length] = val;
      } else {
        obj = parent[key] = [parent[key], val];
      }
      // prop
    } else if (~indexOf(part, ']')) {
      part = part.substr(0, part.length - 1);
      if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
      // key
    } else {
      if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
    }
  }
}

/**
 * Merge parent key/val pair.
 */

function merge(parent, key, val){
  if (~indexOf(key, ']')) {
    var parts = key.split('[')
      , len = parts.length
      , last = len - 1;
    parse(parts, parent, 'base', val);
    // optimize
  } else {
    if (!isint.test(key) && isArray(parent.base)) {
      var t = {};
      for (var k in parent.base) t[k] = parent.base[k];
      parent.base = t;
    }
    set(parent.base, key, val);
  }

  return parent;
}

/**
 * Compact sparse arrays.
 */

function compact(obj) {
  if ('object' != typeof obj) return obj;

  if (isArray(obj)) {
    var ret = [];

    for (var i in obj) {
      if (hasOwnProperty.call(obj, i)) {
        ret.push(obj[i]);
      }
    }

    return ret;
  }

  for (var key in obj) {
    obj[key] = compact(obj[key]);
  }

  return obj;
}

/**
 * Parse the given obj.
 */

function parseObject(obj){
  var ret = { base: {} };

  forEach(objectKeys(obj), function(name){
    merge(ret, name, obj[name]);
  });

  return compact(ret.base);
}

/**
 * Parse the given str.
 */

function parseString(str, options){
  var ret = reduce(String(str).split(options.separator), function(ret, pair){
    var eql = indexOf(pair, '=')
      , brace = lastBraceInKey(pair)
      , key = pair.substr(0, brace || eql)
      , val = pair.substr(brace || eql, pair.length)
      , val = val.substr(indexOf(val, '=') + 1, val.length);

    // ?foo
    if ('' == key) key = pair, val = '';
    if ('' == key) return ret;

    return merge(ret, decode(key), decode(val));
  }, { base: {} }).base;

  return compact(ret);
}

/**
 * Parse the given query `str` or `obj`, returning an object.
 *
 * @param {String} str | {Object} obj
 * @return {Object}
 * @api public
 */

exports.parse = function(str, options){
  if (null == str || '' == str) return {};
  options = options || {};
  options.separator = options.separator || '&';
  return 'object' == typeof str
    ? parseObject(str)
    : parseString(str, options);
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix + '=' + encodeURIComponent(String(obj));
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[' + i + ']'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = objectKeys(obj)
    , key;

  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    if ('' == key) continue;
    if (null == obj[key]) {
      ret.push(encodeURIComponent(key) + '=');
    } else {
      ret.push(stringify(obj[key], prefix
        ? prefix + '[' + encodeURIComponent(key) + ']'
        : encodeURIComponent(key)));
    }
  }

  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (hasOwnProperty.call(Object.prototype, key)) return;
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}

/**
 * Decode `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function decode(str) {
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch (err) {
    return str;
  }
}

},{}],16:[function(require,module,exports){
/*!
  * Reqwest! A general purpose XHR connection manager
  * license MIT (c) Dustin Diaz 2014
  * https://github.com/ded/reqwest
  */

!function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else context[name] = definition()
}('reqwest', this, function () {

  var win = window
    , doc = document
    , httpsRe = /^http/
    , protocolRe = /(^\w+):\/\//
    , twoHundo = /^(20\d|1223)$/ //http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
    , byTag = 'getElementsByTagName'
    , readyState = 'readyState'
    , contentType = 'Content-Type'
    , requestedWith = 'X-Requested-With'
    , head = doc[byTag]('head')[0]
    , uniqid = 0
    , callbackPrefix = 'reqwest_' + (+new Date())
    , lastValue // data stored by the most recent JSONP callback
    , xmlHttpRequest = 'XMLHttpRequest'
    , xDomainRequest = 'XDomainRequest'
    , noop = function () {}

    , isArray = typeof Array.isArray == 'function'
        ? Array.isArray
        : function (a) {
            return a instanceof Array
          }

    , defaultHeaders = {
          'contentType': 'application/x-www-form-urlencoded'
        , 'requestedWith': xmlHttpRequest
        , 'accept': {
              '*':  'text/javascript, text/html, application/xml, text/xml, */*'
            , 'xml':  'application/xml, text/xml'
            , 'html': 'text/html'
            , 'text': 'text/plain'
            , 'json': 'application/json, text/javascript'
            , 'js':   'application/javascript, text/javascript'
          }
      }

    , xhr = function(o) {
        // is it x-domain
        if (o['crossOrigin'] === true) {
          var xhr = win[xmlHttpRequest] ? new XMLHttpRequest() : null
          if (xhr && 'withCredentials' in xhr) {
            return xhr
          } else if (win[xDomainRequest]) {
            return new XDomainRequest()
          } else {
            throw new Error('Browser does not support cross-origin requests')
          }
        } else if (win[xmlHttpRequest]) {
          return new XMLHttpRequest()
        } else {
          return new ActiveXObject('Microsoft.XMLHTTP')
        }
      }
    , globalSetupOptions = {
        dataFilter: function (data) {
          return data
        }
      }

  function succeed(r) {
    var protocol = protocolRe.exec(r.url);
    protocol = (protocol && protocol[1]) || window.location.protocol;
    return httpsRe.test(protocol) ? twoHundo.test(r.request.status) : !!r.request.response;
  }

  function handleReadyState(r, success, error) {
    return function () {
      // use _aborted to mitigate against IE err c00c023f
      // (can't read props on aborted request objects)
      if (r._aborted) return error(r.request)
      if (r._timedOut) return error(r.request, 'Request is aborted: timeout')
      if (r.request && r.request[readyState] == 4) {
        r.request.onreadystatechange = noop
        if (succeed(r)) success(r.request)
        else
          error(r.request)
      }
    }
  }

  function setHeaders(http, o) {
    var headers = o['headers'] || {}
      , h

    headers['Accept'] = headers['Accept']
      || defaultHeaders['accept'][o['type']]
      || defaultHeaders['accept']['*']

    var isAFormData = typeof FormData === 'function' && (o['data'] instanceof FormData);
    // breaks cross-origin requests with legacy browsers
    if (!o['crossOrigin'] && !headers[requestedWith]) headers[requestedWith] = defaultHeaders['requestedWith']
    if (!headers[contentType] && !isAFormData) headers[contentType] = o['contentType'] || defaultHeaders['contentType']
    for (h in headers)
      headers.hasOwnProperty(h) && 'setRequestHeader' in http && http.setRequestHeader(h, headers[h])
  }

  function setCredentials(http, o) {
    if (typeof o['withCredentials'] !== 'undefined' && typeof http.withCredentials !== 'undefined') {
      http.withCredentials = !!o['withCredentials']
    }
  }

  function generalCallback(data) {
    lastValue = data
  }

  function urlappend (url, s) {
    return url + (/\?/.test(url) ? '&' : '?') + s
  }

  function handleJsonp(o, fn, err, url) {
    var reqId = uniqid++
      , cbkey = o['jsonpCallback'] || 'callback' // the 'callback' key
      , cbval = o['jsonpCallbackName'] || reqwest.getcallbackPrefix(reqId)
      , cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)')
      , match = url.match(cbreg)
      , script = doc.createElement('script')
      , loaded = 0
      , isIE10 = navigator.userAgent.indexOf('MSIE 10.0') !== -1

    if (match) {
      if (match[3] === '?') {
        url = url.replace(cbreg, '$1=' + cbval) // wildcard callback func name
      } else {
        cbval = match[3] // provided callback func name
      }
    } else {
      url = urlappend(url, cbkey + '=' + cbval) // no callback details, add 'em
    }

    win[cbval] = generalCallback

    script.type = 'text/javascript'
    script.src = url
    script.async = true
    if (typeof script.onreadystatechange !== 'undefined' && !isIE10) {
      // need this for IE due to out-of-order onreadystatechange(), binding script
      // execution to an event listener gives us control over when the script
      // is executed. See http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
      script.htmlFor = script.id = '_reqwest_' + reqId
    }

    script.onload = script.onreadystatechange = function () {
      if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
        return false
      }
      script.onload = script.onreadystatechange = null
      script.onclick && script.onclick()
      // Call the user callback with the last value stored and clean up values and scripts.
      fn(lastValue)
      lastValue = undefined
      head.removeChild(script)
      loaded = 1
    }

    // Add the script to the DOM head
    head.appendChild(script)

    // Enable JSONP timeout
    return {
      abort: function () {
        script.onload = script.onreadystatechange = null
        err({}, 'Request is aborted: timeout', {})
        lastValue = undefined
        head.removeChild(script)
        loaded = 1
      }
    }
  }

  function getRequest(fn, err) {
    var o = this.o
      , method = (o['method'] || 'GET').toUpperCase()
      , url = typeof o === 'string' ? o : o['url']
      // convert non-string objects to query-string form unless o['processData'] is false
      , data = (o['processData'] !== false && o['data'] && typeof o['data'] !== 'string')
        ? reqwest.toQueryString(o['data'])
        : (o['data'] || null)
      , http
      , sendWait = false

    // if we're working on a GET request and we have data then we should append
    // query string to end of URL and not post data
    if ((o['type'] == 'jsonp' || method == 'GET') && data) {
      url = urlappend(url, data)
      data = null
    }

    if (o['type'] == 'jsonp') return handleJsonp(o, fn, err, url)

    // get the xhr from the factory if passed
    // if the factory returns null, fall-back to ours
    http = (o.xhr && o.xhr(o)) || xhr(o)

    http.open(method, url, o['async'] === false ? false : true)
    setHeaders(http, o)
    setCredentials(http, o)
    if (win[xDomainRequest] && http instanceof win[xDomainRequest]) {
        http.onload = fn
        http.onerror = err
        // NOTE: see
        // http://social.msdn.microsoft.com/Forums/en-US/iewebdevelopment/thread/30ef3add-767c-4436-b8a9-f1ca19b4812e
        http.onprogress = function() {}
        sendWait = true
    } else {
      http.onreadystatechange = handleReadyState(this, fn, err)
    }
    o['before'] && o['before'](http)
    if (sendWait) {
      setTimeout(function () {
        http.send(data)
      }, 200)
    } else {
      http.send(data)
    }
    return http
  }

  function Reqwest(o, fn) {
    this.o = o
    this.fn = fn

    init.apply(this, arguments)
  }

  function setType(header) {
    // json, javascript, text/plain, text/html, xml
    if (header.match('json')) return 'json'
    if (header.match('javascript')) return 'js'
    if (header.match('text')) return 'html'
    if (header.match('xml')) return 'xml'
  }

  function init(o, fn) {

    this.url = typeof o == 'string' ? o : o['url']
    this.timeout = null

    // whether request has been fulfilled for purpose
    // of tracking the Promises
    this._fulfilled = false
    // success handlers
    this._successHandler = function(){}
    this._fulfillmentHandlers = []
    // error handlers
    this._errorHandlers = []
    // complete (both success and fail) handlers
    this._completeHandlers = []
    this._erred = false
    this._responseArgs = {}

    var self = this

    fn = fn || function () {}

    if (o['timeout']) {
      this.timeout = setTimeout(function () {
        timedOut()
      }, o['timeout'])
    }

    if (o['success']) {
      this._successHandler = function () {
        o['success'].apply(o, arguments)
      }
    }

    if (o['error']) {
      this._errorHandlers.push(function () {
        o['error'].apply(o, arguments)
      })
    }

    if (o['complete']) {
      this._completeHandlers.push(function () {
        o['complete'].apply(o, arguments)
      })
    }

    function complete (resp) {
      o['timeout'] && clearTimeout(self.timeout)
      self.timeout = null
      while (self._completeHandlers.length > 0) {
        self._completeHandlers.shift()(resp)
      }
    }

    function success (resp) {
      var type = o['type'] || resp && setType(resp.getResponseHeader('Content-Type')) // resp can be undefined in IE
      resp = (type !== 'jsonp') ? self.request : resp
      // use global data filter on response text
      var filteredResponse = globalSetupOptions.dataFilter(resp.responseText, type)
        , r = filteredResponse
      try {
        resp.responseText = r
      } catch (e) {
        // can't assign this in IE<=8, just ignore
      }
      if (r) {
        switch (type) {
        case 'json':
          try {
            resp = win.JSON ? win.JSON.parse(r) : eval('(' + r + ')')
          } catch (err) {
            return error(resp, 'Could not parse JSON in response', err)
          }
          break
        case 'js':
          resp = eval(r)
          break
        case 'html':
          resp = r
          break
        case 'xml':
          resp = resp.responseXML
              && resp.responseXML.parseError // IE trololo
              && resp.responseXML.parseError.errorCode
              && resp.responseXML.parseError.reason
            ? null
            : resp.responseXML
          break
        }
      }

      self._responseArgs.resp = resp
      self._fulfilled = true
      fn(resp)
      self._successHandler(resp)
      while (self._fulfillmentHandlers.length > 0) {
        resp = self._fulfillmentHandlers.shift()(resp)
      }

      complete(resp)
    }

    function timedOut() {
      self._timedOut = true
      self.request.abort()      
    }

    function error(resp, msg, t) {
      resp = self.request
      self._responseArgs.resp = resp
      self._responseArgs.msg = msg
      self._responseArgs.t = t
      self._erred = true
      while (self._errorHandlers.length > 0) {
        self._errorHandlers.shift()(resp, msg, t)
      }
      complete(resp)
    }

    this.request = getRequest.call(this, success, error)
  }

  Reqwest.prototype = {
    abort: function () {
      this._aborted = true
      this.request.abort()
    }

  , retry: function () {
      init.call(this, this.o, this.fn)
    }

    /**
     * Small deviation from the Promises A CommonJs specification
     * http://wiki.commonjs.org/wiki/Promises/A
     */

    /**
     * `then` will execute upon successful requests
     */
  , then: function (success, fail) {
      success = success || function () {}
      fail = fail || function () {}
      if (this._fulfilled) {
        this._responseArgs.resp = success(this._responseArgs.resp)
      } else if (this._erred) {
        fail(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t)
      } else {
        this._fulfillmentHandlers.push(success)
        this._errorHandlers.push(fail)
      }
      return this
    }

    /**
     * `always` will execute whether the request succeeds or fails
     */
  , always: function (fn) {
      if (this._fulfilled || this._erred) {
        fn(this._responseArgs.resp)
      } else {
        this._completeHandlers.push(fn)
      }
      return this
    }

    /**
     * `fail` will execute when the request fails
     */
  , fail: function (fn) {
      if (this._erred) {
        fn(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t)
      } else {
        this._errorHandlers.push(fn)
      }
      return this
    }
  , 'catch': function (fn) {
      return this.fail(fn)
    }
  }

  function reqwest(o, fn) {
    return new Reqwest(o, fn)
  }

  // normalize newline variants according to spec -> CRLF
  function normalize(s) {
    return s ? s.replace(/\r?\n/g, '\r\n') : ''
  }

  function serial(el, cb) {
    var n = el.name
      , t = el.tagName.toLowerCase()
      , optCb = function (o) {
          // IE gives value="" even where there is no value attribute
          // 'specified' ref: http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-862529273
          if (o && !o['disabled'])
            cb(n, normalize(o['attributes']['value'] && o['attributes']['value']['specified'] ? o['value'] : o['text']))
        }
      , ch, ra, val, i

    // don't serialize elements that are disabled or without a name
    if (el.disabled || !n) return

    switch (t) {
    case 'input':
      if (!/reset|button|image|file/i.test(el.type)) {
        ch = /checkbox/i.test(el.type)
        ra = /radio/i.test(el.type)
        val = el.value
        // WebKit gives us "" instead of "on" if a checkbox has no value, so correct it here
        ;(!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val))
      }
      break
    case 'textarea':
      cb(n, normalize(el.value))
      break
    case 'select':
      if (el.type.toLowerCase() === 'select-one') {
        optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null)
      } else {
        for (i = 0; el.length && i < el.length; i++) {
          el.options[i].selected && optCb(el.options[i])
        }
      }
      break
    }
  }

  // collect up all form elements found from the passed argument elements all
  // the way down to child elements; pass a '<form>' or form fields.
  // called with 'this'=callback to use for serial() on each element
  function eachFormElement() {
    var cb = this
      , e, i
      , serializeSubtags = function (e, tags) {
          var i, j, fa
          for (i = 0; i < tags.length; i++) {
            fa = e[byTag](tags[i])
            for (j = 0; j < fa.length; j++) serial(fa[j], cb)
          }
        }

    for (i = 0; i < arguments.length; i++) {
      e = arguments[i]
      if (/input|select|textarea/i.test(e.tagName)) serial(e, cb)
      serializeSubtags(e, [ 'input', 'select', 'textarea' ])
    }
  }

  // standard query string style serialization
  function serializeQueryString() {
    return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments))
  }

  // { 'name': 'value', ... } style serialization
  function serializeHash() {
    var hash = {}
    eachFormElement.apply(function (name, value) {
      if (name in hash) {
        hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]])
        hash[name].push(value)
      } else hash[name] = value
    }, arguments)
    return hash
  }

  // [ { name: 'name', value: 'value' }, ... ] style serialization
  reqwest.serializeArray = function () {
    var arr = []
    eachFormElement.apply(function (name, value) {
      arr.push({name: name, value: value})
    }, arguments)
    return arr
  }

  reqwest.serialize = function () {
    if (arguments.length === 0) return ''
    var opt, fn
      , args = Array.prototype.slice.call(arguments, 0)

    opt = args.pop()
    opt && opt.nodeType && args.push(opt) && (opt = null)
    opt && (opt = opt.type)

    if (opt == 'map') fn = serializeHash
    else if (opt == 'array') fn = reqwest.serializeArray
    else fn = serializeQueryString

    return fn.apply(null, args)
  }

  reqwest.toQueryString = function (o, trad) {
    var prefix, i
      , traditional = trad || false
      , s = []
      , enc = encodeURIComponent
      , add = function (key, value) {
          // If value is a function, invoke it and return its value
          value = ('function' === typeof value) ? value() : (value == null ? '' : value)
          s[s.length] = enc(key) + '=' + enc(value)
        }
    // If an array was passed in, assume that it is an array of form elements.
    if (isArray(o)) {
      for (i = 0; o && i < o.length; i++) add(o[i]['name'], o[i]['value'])
    } else {
      // If traditional, encode the "old" way (the way 1.3.2 or older
      // did it), otherwise encode params recursively.
      for (prefix in o) {
        if (o.hasOwnProperty(prefix)) buildParams(prefix, o[prefix], traditional, add)
      }
    }

    // spaces should be + according to spec
    return s.join('&').replace(/%20/g, '+')
  }

  function buildParams(prefix, obj, traditional, add) {
    var name, i, v
      , rbracket = /\[\]$/

    if (isArray(obj)) {
      // Serialize array item.
      for (i = 0; obj && i < obj.length; i++) {
        v = obj[i]
        if (traditional || rbracket.test(prefix)) {
          // Treat each array item as a scalar.
          add(prefix, v)
        } else {
          buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, traditional, add)
        }
      }
    } else if (obj && obj.toString() === '[object Object]') {
      // Serialize object item.
      for (name in obj) {
        buildParams(prefix + '[' + name + ']', obj[name], traditional, add)
      }

    } else {
      // Serialize scalar item.
      add(prefix, obj)
    }
  }

  reqwest.getcallbackPrefix = function () {
    return callbackPrefix
  }

  // jQuery and Zepto compatibility, differences can be remapped here so you can call
  // .ajax.compat(options, callback)
  reqwest.compat = function (o, fn) {
    if (o) {
      o['type'] && (o['method'] = o['type']) && delete o['type']
      o['dataType'] && (o['type'] = o['dataType'])
      o['jsonpCallback'] && (o['jsonpCallbackName'] = o['jsonpCallback']) && delete o['jsonpCallback']
      o['jsonp'] && (o['jsonpCallback'] = o['jsonp'])
    }
    return new Reqwest(o, fn)
  }

  reqwest.ajaxSetup = function (options) {
    options = options || {}
    for (var k in options) {
      globalSetupOptions[k] = options[k]
    }
  }

  return reqwest
});

},{}],17:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],18:[function(require,module,exports){
var WinChan = (function() {
  var RELAY_FRAME_NAME = "__winchan_relay_frame";
  var CLOSE_CMD = "die";

  // a portable addListener implementation
  function addListener(w, event, cb) {
    if(w.attachEvent) w.attachEvent('on' + event, cb);
    else if (w.addEventListener) w.addEventListener(event, cb, false);
  }

  // a portable removeListener implementation
  function removeListener(w, event, cb) {
    if(w.detachEvent) w.detachEvent('on' + event, cb);
    else if (w.removeEventListener) w.removeEventListener(event, cb, false);
  }


  // checking for IE8 or above
  function isInternetExplorer() {
    var rv = -1; // Return value assumes failure.
    var ua = navigator.userAgent;
    if (navigator.appName === 'Microsoft Internet Explorer') {
      var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
      if (re.exec(ua) != null)
        rv = parseFloat(RegExp.$1);
    }
    // IE > 11
    else if (ua.indexOf("Trident") > -1) {
      var re = new RegExp("rv:([0-9]{2,2}[\.0-9]{0,})");
      if (re.exec(ua) !== null) {
        rv = parseFloat(RegExp.$1);
      }
    }

    return rv >= 8;
  }

  // checking Mobile Firefox (Fennec)
  function isFennec() {
    try {
      // We must check for both XUL and Java versions of Fennec.  Both have
      // distinct UA strings.
      var userAgent = navigator.userAgent;
      return (userAgent.indexOf('Fennec/') != -1) ||  // XUL
             (userAgent.indexOf('Firefox/') != -1 && userAgent.indexOf('Android') != -1);   // Java
    } catch(e) {}
    return false;
  }

  // feature checking to see if this platform is supported at all
  function isSupported() {
    return (window.JSON && window.JSON.stringify &&
            window.JSON.parse && window.postMessage);
  }

  // given a URL, extract the origin. Taken from: https://github.com/firebase/firebase-simple-login/blob/d2cb95b9f812d8488bdbfba51c3a7c153ba1a074/js/src/simple-login/transports/WinChan.js#L25-L30
  function extractOrigin(url) {
    if (!/^https?:\/\//.test(url)) url = window.location.href;
    var m = /^(https?:\/\/[\-_a-zA-Z\.0-9:]+)/.exec(url);
    if (m) return m[1];
    return url;
  }

  // find the relay iframe in the opener
  function findRelay() {
    var loc = window.location;
    var frames = window.opener.frames;
    for (var i = frames.length - 1; i >= 0; i--) {
      try {
        if (frames[i].location.protocol === window.location.protocol &&
            frames[i].location.host === window.location.host &&
            frames[i].name === RELAY_FRAME_NAME)
        {
          return frames[i];
        }
      } catch(e) { }
    }
    return;
  }

  var isIE = isInternetExplorer();

  if (isSupported()) {
    /*  General flow:
     *                  0. user clicks
     *  (IE SPECIFIC)   1. caller adds relay iframe (served from trusted domain) to DOM
     *                  2. caller opens window (with content from trusted domain)
     *                  3. window on opening adds a listener to 'message'
     *  (IE SPECIFIC)   4. window on opening finds iframe
     *                  5. window checks if iframe is "loaded" - has a 'doPost' function yet
     *  (IE SPECIFIC5)  5a. if iframe.doPost exists, window uses it to send ready event to caller
     *  (IE SPECIFIC5)  5b. if iframe.doPost doesn't exist, window waits for frame ready
     *  (IE SPECIFIC5)  5bi. once ready, window calls iframe.doPost to send ready event
     *                  6. caller upon reciept of 'ready', sends args
     */
    return {
      open: function(opts, cb) {
        if (!cb) throw "missing required callback argument";

        // test required options
        var err;
        if (!opts.url) err = "missing required 'url' parameter";
        if (!opts.relay_url) err = "missing required 'relay_url' parameter";
        if (err) setTimeout(function() { cb(err); }, 0);

        // supply default options
        if (!opts.window_name) opts.window_name = null;
        if (!opts.window_features || isFennec()) opts.window_features = undefined;

        // opts.params may be undefined

        var iframe;

        // sanity check, are url and relay_url the same origin?
        var origin = extractOrigin(opts.url);
        if (origin !== extractOrigin(opts.relay_url)) {
          return setTimeout(function() {
            cb('invalid arguments: origin of url and relay_url must match');
          }, 0);
        }

        var messageTarget;

        if (isIE) {
          // first we need to add a "relay" iframe to the document that's served
          // from the target domain.  We can postmessage into a iframe, but not a
          // window
          iframe = document.createElement("iframe");
          // iframe.setAttribute('name', framename);
          iframe.setAttribute('src', opts.relay_url);
          iframe.style.display = "none";
          iframe.setAttribute('name', RELAY_FRAME_NAME);
          document.body.appendChild(iframe);
          messageTarget = iframe.contentWindow;
        }

        var w = opts.popup || window.open(opts.url, opts.window_name, opts.window_features);
        if (opts.popup) {
          w.location.href = opts.url;
        }

        if (!messageTarget) messageTarget = w;

        // lets listen in case the window blows up before telling us
        var closeInterval = setInterval(function() {
          if (w && w.closed) {
            cleanup();
            if (cb) {
              cb('User closed the popup window');
              cb = null;
            }
          }
        }, 500);

        var req = JSON.stringify({a: 'request', d: opts.params});

        // cleanup on unload
        function cleanup() {
          if (iframe) document.body.removeChild(iframe);
          iframe = undefined;
          if (closeInterval) closeInterval = clearInterval(closeInterval);
          removeListener(window, 'message', onMessage);
          removeListener(window, 'unload', cleanup);
          if (w) {
            try {
              w.close();
            } catch (securityViolation) {
              // This happens in Opera 12 sometimes
              // see https://github.com/mozilla/browserid/issues/1844
              messageTarget.postMessage(CLOSE_CMD, origin);
            }
          }
          w = messageTarget = undefined;
        }

        addListener(window, 'unload', cleanup);

        function onMessage(e) {
          if (e.origin !== origin) { return; }
          try {
            var d = JSON.parse(e.data);
            if (d.a === 'ready') messageTarget.postMessage(req, origin);
            else if (d.a === 'error') {
              cleanup();
              if (cb) {
                cb(d.d);
                cb = null;
              }
            } else if (d.a === 'response') {
              cleanup();
              if (cb) {
                cb(null, d.d);
                cb = null;
              }
            }
          } catch(err) { }
        }

        addListener(window, 'message', onMessage);

        return {
          close: cleanup,
          focus: function() {
            if (w) {
              try {
                w.focus();
              } catch (e) {
                // IE7 blows up here, do nothing
              }
            }
          }
        };
      },
      onOpen: function(cb) {
        var o = "*";
        var msgTarget = isIE ? findRelay() : window.opener;
        if (!msgTarget) throw "can't find relay frame";
        function doPost(msg) {
          msg = JSON.stringify(msg);
          if (isIE) msgTarget.doPost(msg, o);
          else msgTarget.postMessage(msg, o);
        }

        function onMessage(e) {
          // only one message gets through, but let's make sure it's actually
          // the message we're looking for (other code may be using
          // postmessage) - we do this by ensuring the payload can
          // be parsed, and it's got an 'a' (action) value of 'request'.
          var d;
          try {
            d = JSON.parse(e.data);
          } catch(err) { }
          if (!d || d.a !== 'request') return;
          removeListener(window, 'message', onMessage);
          o = e.origin;
          if (cb) {
            // this setTimeout is critically important for IE8 -
            // in ie8 sometimes addListener for 'message' can synchronously
            // cause your callback to be invoked.  awesome.
            setTimeout(function() {
              cb(o, d.d, function(r) {
                cb = undefined;
                doPost({a: 'response', d: r});
              });
            }, 0);
          }
        }

        function onDie(e) {
          if (e.data === CLOSE_CMD) {
            try { window.close(); } catch (o_O) {}
          }
        }
        addListener(isIE ? msgTarget : window, 'message', onMessage);
        addListener(isIE ? msgTarget : window, 'message', onDie);

        // we cannot post to our parent that we're ready before the iframe
        // is loaded. (IE specific possible failure)
        try {
          doPost({a: "ready"});
        } catch(e) {
          // this code should never be exectued outside IE
          addListener(msgTarget, 'load', function(e) {
            doPost({a: "ready"});
          });
        }

        // if window is unloaded and the client hasn't called cb, it's an error
        var onUnload = function() {
          try {
            // IE8 doesn't like this...
            removeListener(isIE ? msgTarget : window, 'message', onDie);
          } catch (ohWell) { }
          if (cb) doPost({ a: 'error', d: 'client closed window' });
          cb = undefined;
          // explicitly close the window, in case the client is trying to reload or nav
          try { window.close(); } catch (e) { }
        };
        addListener(window, 'unload', onUnload);
        return {
          detach: function() {
            removeListener(window, 'unload', onUnload);
          }
        };
      }
    };
  } else {
    return {
      open: function(url, winopts, arg, cb) {
        setTimeout(function() { cb("unsupported browser"); }, 0);
      },
      onOpen: function(cb) {
        setTimeout(function() { cb("unsupported browser"); }, 0);
      }
    };
  }
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WinChan;
}

},{}],19:[function(require,module,exports){
module.exports = hasKeys

function hasKeys(source) {
    return source !== null &&
        (typeof source === "object" ||
        typeof source === "function")
}

},{}],20:[function(require,module,exports){
var Keys = require("object-keys")
var hasKeys = require("./has-keys")

module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        if (!hasKeys(source)) {
            continue
        }

        var keys = Keys(source)

        for (var j = 0; j < keys.length; j++) {
            var name = keys[j]
            target[name] = source[name]
        }
    }

    return target
}

},{"./has-keys":19,"object-keys":22}],21:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

var isFunction = function (fn) {
	var isFunc = (typeof fn === 'function' && !(fn instanceof RegExp)) || toString.call(fn) === '[object Function]';
	if (!isFunc && typeof window !== 'undefined') {
		isFunc = fn === window.setTimeout || fn === window.alert || fn === window.confirm || fn === window.prompt;
	}
	return isFunc;
};

module.exports = function forEach(obj, fn) {
	if (!isFunction(fn)) {
		throw new TypeError('iterator must be a function');
	}
	var i, k,
		isString = typeof obj === 'string',
		l = obj.length,
		context = arguments.length > 2 ? arguments[2] : null;
	if (l === +l) {
		for (i = 0; i < l; i++) {
			if (context === null) {
				fn(isString ? obj.charAt(i) : obj[i], i, obj);
			} else {
				fn.call(context, isString ? obj.charAt(i) : obj[i], i, obj);
			}
		}
	} else {
		for (k in obj) {
			if (hasOwn.call(obj, k)) {
				if (context === null) {
					fn(obj[k], k, obj);
				} else {
					fn.call(context, obj[k], k, obj);
				}
			}
		}
	}
};


},{}],22:[function(require,module,exports){
module.exports = Object.keys || require('./shim');


},{"./shim":24}],23:[function(require,module,exports){
var toString = Object.prototype.toString;

module.exports = function isArguments(value) {
	var str = toString.call(value);
	var isArguments = str === '[object Arguments]';
	if (!isArguments) {
		isArguments = str !== '[object Array]'
			&& value !== null
			&& typeof value === 'object'
			&& typeof value.length === 'number'
			&& value.length >= 0
			&& toString.call(value.callee) === '[object Function]';
	}
	return isArguments;
};


},{}],24:[function(require,module,exports){
(function () {
	"use strict";

	// modified from https://github.com/kriskowal/es5-shim
	var has = Object.prototype.hasOwnProperty,
		toString = Object.prototype.toString,
		forEach = require('./foreach'),
		isArgs = require('./isArguments'),
		hasDontEnumBug = !({'toString': null}).propertyIsEnumerable('toString'),
		hasProtoEnumBug = (function () {}).propertyIsEnumerable('prototype'),
		dontEnums = [
			"toString",
			"toLocaleString",
			"valueOf",
			"hasOwnProperty",
			"isPrototypeOf",
			"propertyIsEnumerable",
			"constructor"
		],
		keysShim;

	keysShim = function keys(object) {
		var isObject = object !== null && typeof object === 'object',
			isFunction = toString.call(object) === '[object Function]',
			isArguments = isArgs(object),
			theKeys = [];

		if (!isObject && !isFunction && !isArguments) {
			throw new TypeError("Object.keys called on a non-object");
		}

		if (isArguments) {
			forEach(object, function (value) {
				theKeys.push(value);
			});
		} else {
			var name,
				skipProto = hasProtoEnumBug && isFunction;

			for (name in object) {
				if (!(skipProto && name === 'prototype') && has.call(object, name)) {
					theKeys.push(name);
				}
			}
		}

		if (hasDontEnumBug) {
			var ctor = object.constructor,
				skipConstructor = ctor && ctor.prototype === object;

			forEach(dontEnums, function (dontEnum) {
				if (!(skipConstructor && dontEnum === 'constructor') && has.call(object, dontEnum)) {
					theKeys.push(dontEnum);
				}
			});
		}
		return theKeys;
	};

	module.exports = keysShim;
}());


},{"./foreach":21,"./isArguments":23}],25:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};/*
 *
 * This is used to build the bundle with browserify.
 *
 * The bundle is used by people who doesn't use browserify.
 * Those who use browserify will install with npm and require the module,
 * the package.json file points to index.js.
 */
var Auth0 = require('./index');

//use amd or just throught to window object.
if (typeof global.window.define == 'function' && global.window.define.amd) {
  global.window.define('auth0', function () { return Auth0; });
} else if (global.window) {
  global.window.Auth0 = Auth0;
}

},{"./index":1}],26:[function(require,module,exports){
module.exports={"version":"6.7.2"}
},{}]},{},[25])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3VidW50dS8uc3RyaWRlci9kYXRhL2F1dGgwLWF1dGgwLmpzLTU2MGFjYWM2YzdiMzI3OGE1ZWM5NTc0Yi9pbmRleC5qcyIsIi9ob21lL3VidW50dS8uc3RyaWRlci9kYXRhL2F1dGgwLWF1dGgwLmpzLTU2MGFjYWM2YzdiMzI3OGE1ZWM5NTc0Yi9saWIvTG9naW5FcnJvci5qcyIsIi9ob21lL3VidW50dS8uc3RyaWRlci9kYXRhL2F1dGgwLWF1dGgwLmpzLTU2MGFjYWM2YzdiMzI3OGE1ZWM5NTc0Yi9saWIvYXNzZXJ0X3JlcXVpcmVkLmpzIiwiL2hvbWUvdWJ1bnR1Ly5zdHJpZGVyL2RhdGEvYXV0aDAtYXV0aDAuanMtNTYwYWNhYzZjN2IzMjc4YTVlYzk1NzRiL2xpYi9iYXNlNjRfdXJsLmpzIiwiL2hvbWUvdWJ1bnR1Ly5zdHJpZGVyL2RhdGEvYXV0aDAtYXV0aDAuanMtNTYwYWNhYzZjN2IzMjc4YTVlYzk1NzRiL2xpYi9pcy1hcnJheS5qcyIsIi9ob21lL3VidW50dS8uc3RyaWRlci9kYXRhL2F1dGgwLWF1dGgwLmpzLTU2MGFjYWM2YzdiMzI3OGE1ZWM5NTc0Yi9saWIvanNvbi1wYXJzZS5qcyIsIi9ob21lL3VidW50dS8uc3RyaWRlci9kYXRhL2F1dGgwLWF1dGgwLmpzLTU2MGFjYWM2YzdiMzI3OGE1ZWM5NTc0Yi9saWIvc2FtZS1vcmlnaW4uanMiLCIvaG9tZS91YnVudHUvLnN0cmlkZXIvZGF0YS9hdXRoMC1hdXRoMC5qcy01NjBhY2FjNmM3YjMyNzhhNWVjOTU3NGIvbGliL3VzZV9qc29ucC5qcyIsIi9ob21lL3VidW50dS8uc3RyaWRlci9kYXRhL2F1dGgwLWF1dGgwLmpzLTU2MGFjYWM2YzdiMzI3OGE1ZWM5NTc0Yi9ub2RlX21vZHVsZXMvQmFzZTY0L2Jhc2U2NC5qcyIsIi9ob21lL3VidW50dS8uc3RyaWRlci9kYXRhL2F1dGgwLWF1dGgwLmpzLTU2MGFjYWM2YzdiMzI3OGE1ZWM5NTc0Yi9ub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIi9ob21lL3VidW50dS8uc3RyaWRlci9kYXRhL2F1dGgwLWF1dGgwLmpzLTU2MGFjYWM2YzdiMzI3OGE1ZWM5NTc0Yi9ub2RlX21vZHVsZXMvZGVidWcvZGVidWcuanMiLCIvaG9tZS91YnVudHUvLnN0cmlkZXIvZGF0YS9hdXRoMC1hdXRoMC5qcy01NjBhY2FjNmM3YjMyNzhhNWVjOTU3NGIvbm9kZV9tb2R1bGVzL2RlYnVnL25vZGVfbW9kdWxlcy9tcy9pbmRleC5qcyIsIi9ob21lL3VidW50dS8uc3RyaWRlci9kYXRhL2F1dGgwLWF1dGgwLmpzLTU2MGFjYWM2YzdiMzI3OGE1ZWM5NTc0Yi9ub2RlX21vZHVsZXMvanNvbi1mYWxsYmFjay9pbmRleC5qcyIsIi9ob21lL3VidW50dS8uc3RyaWRlci9kYXRhL2F1dGgwLWF1dGgwLmpzLTU2MGFjYWM2YzdiMzI3OGE1ZWM5NTc0Yi9ub2RlX21vZHVsZXMvanNvbnAvaW5kZXguanMiLCIvaG9tZS91YnVudHUvLnN0cmlkZXIvZGF0YS9hdXRoMC1hdXRoMC5qcy01NjBhY2FjNmM3YjMyNzhhNWVjOTU3NGIvbm9kZV9tb2R1bGVzL3FzL2luZGV4LmpzIiwiL2hvbWUvdWJ1bnR1Ly5zdHJpZGVyL2RhdGEvYXV0aDAtYXV0aDAuanMtNTYwYWNhYzZjN2IzMjc4YTVlYzk1NzRiL25vZGVfbW9kdWxlcy9yZXF3ZXN0L3JlcXdlc3QuanMiLCIvaG9tZS91YnVudHUvLnN0cmlkZXIvZGF0YS9hdXRoMC1hdXRoMC5qcy01NjBhY2FjNmM3YjMyNzhhNWVjOTU3NGIvbm9kZV9tb2R1bGVzL3RyaW0vaW5kZXguanMiLCIvaG9tZS91YnVudHUvLnN0cmlkZXIvZGF0YS9hdXRoMC1hdXRoMC5qcy01NjBhY2FjNmM3YjMyNzhhNWVjOTU3NGIvbm9kZV9tb2R1bGVzL3dpbmNoYW4vd2luY2hhbi5qcyIsIi9ob21lL3VidW50dS8uc3RyaWRlci9kYXRhL2F1dGgwLWF1dGgwLmpzLTU2MGFjYWM2YzdiMzI3OGE1ZWM5NTc0Yi9ub2RlX21vZHVsZXMveHRlbmQvaGFzLWtleXMuanMiLCIvaG9tZS91YnVudHUvLnN0cmlkZXIvZGF0YS9hdXRoMC1hdXRoMC5qcy01NjBhY2FjNmM3YjMyNzhhNWVjOTU3NGIvbm9kZV9tb2R1bGVzL3h0ZW5kL2luZGV4LmpzIiwiL2hvbWUvdWJ1bnR1Ly5zdHJpZGVyL2RhdGEvYXV0aDAtYXV0aDAuanMtNTYwYWNhYzZjN2IzMjc4YTVlYzk1NzRiL25vZGVfbW9kdWxlcy94dGVuZC9ub2RlX21vZHVsZXMvb2JqZWN0LWtleXMvZm9yZWFjaC5qcyIsIi9ob21lL3VidW50dS8uc3RyaWRlci9kYXRhL2F1dGgwLWF1dGgwLmpzLTU2MGFjYWM2YzdiMzI3OGE1ZWM5NTc0Yi9ub2RlX21vZHVsZXMveHRlbmQvbm9kZV9tb2R1bGVzL29iamVjdC1rZXlzL2luZGV4LmpzIiwiL2hvbWUvdWJ1bnR1Ly5zdHJpZGVyL2RhdGEvYXV0aDAtYXV0aDAuanMtNTYwYWNhYzZjN2IzMjc4YTVlYzk1NzRiL25vZGVfbW9kdWxlcy94dGVuZC9ub2RlX21vZHVsZXMvb2JqZWN0LWtleXMvaXNBcmd1bWVudHMuanMiLCIvaG9tZS91YnVudHUvLnN0cmlkZXIvZGF0YS9hdXRoMC1hdXRoMC5qcy01NjBhY2FjNmM3YjMyNzhhNWVjOTU3NGIvbm9kZV9tb2R1bGVzL3h0ZW5kL25vZGVfbW9kdWxlcy9vYmplY3Qta2V5cy9zaGltLmpzIiwiL2hvbWUvdWJ1bnR1Ly5zdHJpZGVyL2RhdGEvYXV0aDAtYXV0aDAuanMtNTYwYWNhYzZjN2IzMjc4YTVlYzk1NzRiL3N0YW5kYWxvbmUuanMiLCIvaG9tZS91YnVudHUvLnN0cmlkZXIvZGF0YS9hdXRoMC1hdXRoMC5qcy01NjBhY2FjNmM3YjMyNzhhNWVjOTU3NGIvdmVyc2lvbi5qc29uIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoeURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25YQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2bUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsvKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIEJhc2U2NFVybCAgICAgICAgID0gcmVxdWlyZSgnLi9saWIvYmFzZTY0X3VybCcpO1xudmFyIGFzc2VydF9yZXF1aXJlZCAgID0gcmVxdWlyZSgnLi9saWIvYXNzZXJ0X3JlcXVpcmVkJyk7XG52YXIgaXNfYXJyYXkgICAgICAgICAgPSByZXF1aXJlKCcuL2xpYi9pcy1hcnJheScpO1xuXG52YXIgcXMgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdxcycpO1xudmFyIHh0ZW5kICAgICAgICAgICAgID0gcmVxdWlyZSgneHRlbmQnKTtcbnZhciB0cmltICAgICAgICAgICAgICA9IHJlcXVpcmUoJ3RyaW0nKTtcbnZhciByZXF3ZXN0ICAgICAgICAgICA9IHJlcXVpcmUoJ3JlcXdlc3QnKTtcbnZhciBXaW5DaGFuICAgICAgICAgICA9IHJlcXVpcmUoJ3dpbmNoYW4nKTtcblxudmFyIGpzb25wICAgICAgICAgICAgID0gcmVxdWlyZSgnanNvbnAnKTtcbnZhciBqc29ucE9wdHMgICAgICAgICA9IHsgcGFyYW06ICdjYngnLCB0aW1lb3V0OiA4MDAwLCBwcmVmaXg6ICdfX2F1dGgwanAnIH07XG5cbnZhciBzYW1lX29yaWdpbiAgICAgICA9IHJlcXVpcmUoJy4vbGliL3NhbWUtb3JpZ2luJyk7XG52YXIganNvbl9wYXJzZSAgICAgICAgPSByZXF1aXJlKCcuL2xpYi9qc29uLXBhcnNlJyk7XG52YXIgTG9naW5FcnJvciAgICAgICAgPSByZXF1aXJlKCcuL2xpYi9Mb2dpbkVycm9yJyk7XG52YXIgdXNlX2pzb25wICAgICAgICAgPSByZXF1aXJlKCcuL2xpYi91c2VfanNvbnAnKTtcblxuLyoqXG4gKiBDaGVjayBpZiBydW5uaW5nIGluIElFLlxuICpcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IC0xIGlmIG5vdCBJRSwgSUUgdmVyc2lvbiBvdGhlcndpc2UuXG4gKi9cbmZ1bmN0aW9uIGlzSW50ZXJuZXRFeHBsb3JlcigpIHtcbiAgdmFyIHJ2ID0gLTE7IC8vIFJldHVybiB2YWx1ZSBhc3N1bWVzIGZhaWx1cmUuXG4gIHZhciB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gIHZhciByZTtcbiAgaWYgKG5hdmlnYXRvci5hcHBOYW1lID09PSAnTWljcm9zb2Z0IEludGVybmV0IEV4cGxvcmVyJykge1xuICAgIHJlID0gbmV3IFJlZ0V4cCgnTVNJRSAoWzAtOV17MSx9W1xcLjAtOV17MCx9KScpO1xuICAgIGlmIChyZS5leGVjKHVhKSAhPSBudWxsKSB7XG4gICAgICBydiA9IHBhcnNlRmxvYXQoUmVnRXhwLiQxKTtcbiAgICB9XG4gIH1cbiAgLy8gSUUgPiAxMVxuICBlbHNlIGlmICh1YS5pbmRleE9mKCdUcmlkZW50JykgPiAtMSkge1xuICAgIHJlID0gbmV3IFJlZ0V4cCgncnY6KFswLTldezIsMn1bXFwuMC05XXswLH0pJyk7XG4gICAgaWYgKHJlLmV4ZWModWEpICE9PSBudWxsKSB7XG4gICAgICBydiA9IHBhcnNlRmxvYXQoUmVnRXhwLiQxKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcnY7XG59XG5cbi8qKlxuICogU3RyaW5naWZ5IHBvcHVwIG9wdGlvbnMgb2JqZWN0IGludG9cbiAqIGB3aW5kb3cub3BlbmAgc3RyaW5nIG9wdGlvbnMgZm9ybWF0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBvcHVwT3B0aW9uc1xuICogQHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzdHJpbmdpZnlQb3B1cFNldHRpbmdzKHBvcHVwT3B0aW9ucykge1xuICB2YXIgc2V0dGluZ3MgPSAnJztcblxuICBmb3IgKHZhciBrZXkgaW4gcG9wdXBPcHRpb25zKSB7XG4gICAgc2V0dGluZ3MgKz0ga2V5ICsgJz0nICsgcG9wdXBPcHRpb25zW2tleV0gKyAnLCc7XG4gIH1cblxuICByZXR1cm4gc2V0dGluZ3Muc2xpY2UoMCwgLTEpO1xufVxuXG5cbi8qKlxuICogQ2hlY2sgdGhhdCBhIGtleSBoYXMgYmVlbiBzZXQgdG8gc29tZXRoaW5nIGRpZmZlcmVudCB0aGFuIG51bGxcbiAqIG9yIHVuZGVmaW5lZC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKi9cbmZ1bmN0aW9uIGNoZWNrSWZTZXQob2JqLCBrZXkpIHtcbiAgLypcbiAgICogZmFsc2UgICAgICAhPSBudWxsIC0+IHRydWVcbiAgICogdHJ1ZSAgICAgICAhPSBudWxsIC0+IHRydWVcbiAgICogdW5kZWZpbmVkICAhPSBudWxsIC0+IGZhbHNlXG4gICAqIG51bGwgICAgICAgIT0gbnVsbCAtPiBmYWxzZVxuICAgKi9cbiAgcmV0dXJuICEhKG9iaiAmJiBvYmpba2V5XSAhPSBudWxsKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlUmVxdWVzdEVycm9yKGVyciwgY2FsbGJhY2spIHtcbiAgdmFyIGVyID0gZXJyO1xuICB2YXIgaXNBZmZlY3RlZElFVmVyc2lvbiA9IGlzSW50ZXJuZXRFeHBsb3JlcigpID09PSAxMCB8fCBpc0ludGVybmV0RXhwbG9yZXIoKSA9PT0gMTE7XG4gIHZhciB6ZXJvU3RhdHVzID0gKCFlci5zdGF0dXMgfHwgZXIuc3RhdHVzID09PSAwKTtcblxuICB2YXIgb25MaW5lID0gISF3aW5kb3cubmF2aWdhdG9yLm9uTGluZTtcblxuICAvLyBSZXF1ZXN0IGZhaWxlZCBiZWNhdXNlIHdlIGFyZSBvZmZsaW5lLlxuICBpZiAoemVyb1N0YXR1cyAmJiAhb25MaW5lICkge1xuICAgIGVyID0ge307XG4gICAgZXIuc3RhdHVzID0gMDtcbiAgICBlci5yZXNwb25zZVRleHQgPSB7XG4gICAgICBjb2RlOiAnb2ZmbGluZSdcbiAgICB9O1xuICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIzMjI5NzIzL2llLTEwLTExLWNvcnMtc3RhdHVzLTBcbiAgLy8gWFhYIElFMTAgd2hlbiBhIHJlcXVlc3QgZmFpbHMgaW4gQ09SUyByZXR1cm5zIHN0YXR1cyBjb2RlIDBcbiAgLy8gU2VlOiBodHRwOi8vY2FuaXVzZS5jb20vI3NlYXJjaD1uYXZpZ2F0b3Iub25MaW5lXG4gIH0gZWxzZSBpZiAoemVyb1N0YXR1cyAmJiBpc0FmZmVjdGVkSUVWZXJzaW9uKSB7XG4gICAgZXIgPSB7fTtcbiAgICBlci5zdGF0dXMgPSA0MDE7XG4gICAgZXIucmVzcG9uc2VUZXh0ID0ge1xuICAgICAgY29kZTogJ2ludmFsaWRfdXNlcl9wYXNzd29yZCdcbiAgICB9O1xuICAvLyBJZiBub3QgSUUxMC8xMSBhbmQgbm90IG9mZmxpbmUgaXQgbWVhbnMgdGhhdCBBdXRoMCBob3N0IGlzIHVucmVhY2hhYmxlOlxuICAvLyBDb25uZWN0aW9uIFRpbWVvdXQgb3IgQ29ubmVjdGlvbiBSZWZ1c2VkLlxuICB9IGVsc2UgaWYgKHplcm9TdGF0dXMpIHtcbiAgICBlciA9IHt9O1xuICAgIGVyLnN0YXR1cyA9IDA7XG4gICAgZXIucmVzcG9uc2VUZXh0ID0ge1xuICAgICAgY29kZTogJ2Nvbm5lY3Rpb25fcmVmdXNlZF90aW1lb3V0J1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgZXIucmVzcG9uc2VUZXh0ID0gZXJyO1xuICB9XG4gIHZhciBlcnJvciA9IG5ldyBMb2dpbkVycm9yKGVyLnN0YXR1cywgZXIucmVzcG9uc2VUZXh0KTtcbiAgY2FsbGJhY2soZXJyb3IpO1xufVxuXG4vKipcbiAqIGpvaW4gdXJsIGZyb20gcHJvdG9jb2xcbiAqL1xuXG5mdW5jdGlvbiBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KSB7XG4gIHJldHVybiBwcm90b2NvbCArICcvLycgKyBkb21haW4gKyBlbmRwb2ludDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW4gYEF1dGgwYCBpbnN0YW5jZSB3aXRoIGBvcHRpb25zYFxuICpcbiAqIEBjbGFzcyBBdXRoMFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEF1dGgwIChvcHRpb25zKSB7XG4gIC8vIFhYWCBEZXByZWNhdGVkOiBXZSBwcmVmZXIgbmV3IEF1dGgwKC4uLilcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEF1dGgwKSkge1xuICAgIHJldHVybiBuZXcgQXV0aDAob3B0aW9ucyk7XG4gIH1cblxuICBhc3NlcnRfcmVxdWlyZWQob3B0aW9ucywgJ2NsaWVudElEJyk7XG4gIGFzc2VydF9yZXF1aXJlZChvcHRpb25zLCAnZG9tYWluJyk7XG5cbiAgdGhpcy5fdXNlSlNPTlAgPSBudWxsICE9IG9wdGlvbnMuZm9yY2VKU09OUCA/XG4gICAgICAgICAgICAgICAgICAgICEhb3B0aW9ucy5mb3JjZUpTT05QIDpcbiAgICAgICAgICAgICAgICAgICAgdXNlX2pzb25wKCkgJiYgIXNhbWVfb3JpZ2luKCdodHRwczonLCBvcHRpb25zLmRvbWFpbik7XG5cbiAgdGhpcy5fY2xpZW50SUQgPSBvcHRpb25zLmNsaWVudElEO1xuICB0aGlzLl9jYWxsYmFja1VSTCA9IG9wdGlvbnMuY2FsbGJhY2tVUkwgfHwgZG9jdW1lbnQubG9jYXRpb24uaHJlZjtcbiAgdGhpcy5fc2hvdWxkUmVkaXJlY3QgPSAhIW9wdGlvbnMuY2FsbGJhY2tVUkw7XG4gIHRoaXMuX2RvbWFpbiA9IG9wdGlvbnMuZG9tYWluO1xuICB0aGlzLl9jYWxsYmFja09uTG9jYXRpb25IYXNoID0gZmFsc2UgfHwgb3B0aW9ucy5jYWxsYmFja09uTG9jYXRpb25IYXNoO1xuICB0aGlzLl9jb3Jkb3ZhU29jaWFsUGx1Z2lucyA9IHtcbiAgICBmYWNlYm9vazogdGhpcy5fcGhvbmVnYXBGYWNlYm9va0xvZ2luXG4gIH07XG4gIHRoaXMuX3VzZUNvcmRvdmFTb2NpYWxQbHVnaW5zID0gZmFsc2UgfHwgb3B0aW9ucy51c2VDb3Jkb3ZhU29jaWFsUGx1Z2lucztcbiAgdGhpcy5fc2VuZENsaWVudEluZm8gPSBudWxsICE9IG9wdGlvbnMuc2VuZFNES0NsaWVudEluZm8gPyBvcHRpb25zLnNlbmRTREtDbGllbnRJbmZvIDogdHJ1ZTtcbn1cblxuLyoqXG4gKiBFeHBvcnQgdmVyc2lvbiB3aXRoIGBBdXRoMGAgY29uc3RydWN0b3JcbiAqXG4gKiBAcHJvcGVydHkge1N0cmluZ30gdmVyc2lvblxuICovXG5cbkF1dGgwLnZlcnNpb24gPSByZXF1aXJlKCcuL3ZlcnNpb24uanNvbicpLnZlcnNpb247XG5cbi8qKlxuICogRXhwb3J0IGNsaWVudCBpbmZvIG9iamVjdFxuICpcbiAqXG4gKiBAcHJvcGVydHkge0hhc2h9XG4gKi9cblxuQXV0aDAuY2xpZW50SW5mbyA9IHsgbmFtZTogJ2F1dGgwLmpzJywgdmVyc2lvbjogQXV0aDAudmVyc2lvbiB9O1xuXG5cbi8qKlxuICogUmVkaXJlY3QgY3VycmVudCBsb2NhdGlvbiB0byBgdXJsYFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwcml2YXRlXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLl9yZWRpcmVjdCA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgZ2xvYmFsLndpbmRvdy5sb2NhdGlvbiA9IHVybDtcbn07XG5cbkF1dGgwLnByb3RvdHlwZS5fZ2V0Q2FsbGJhY2tPbkxvY2F0aW9uSGFzaCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgcmV0dXJuIChvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zLmNhbGxiYWNrT25Mb2NhdGlvbkhhc2ggIT09ICd1bmRlZmluZWQnKSA/XG4gICAgb3B0aW9ucy5jYWxsYmFja09uTG9jYXRpb25IYXNoIDogdGhpcy5fY2FsbGJhY2tPbkxvY2F0aW9uSGFzaDtcbn07XG5cbkF1dGgwLnByb3RvdHlwZS5fZ2V0Q2FsbGJhY2tVUkwgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHJldHVybiAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5jYWxsYmFja1VSTCAhPT0gJ3VuZGVmaW5lZCcpID9cbiAgICBvcHRpb25zLmNhbGxiYWNrVVJMIDogdGhpcy5fY2FsbGJhY2tVUkw7XG59O1xuXG5BdXRoMC5wcm90b3R5cGUuX2dldENsaWVudEluZm9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBjbGllbnRJbmZvID0gSlNPTi5zdHJpbmdpZnkoQXV0aDAuY2xpZW50SW5mbyk7XG4gIHJldHVybiBCYXNlNjRVcmwuZW5jb2RlKGNsaWVudEluZm8pO1xufTtcblxuQXV0aDAucHJvdG90eXBlLl9nZXRDbGllbnRJbmZvSGVhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgICdBdXRoMC1DbGllbnQnOiB0aGlzLl9nZXRDbGllbnRJbmZvU3RyaW5nKClcbiAgfTtcbn07XG5cbi8qKlxuICogUmVuZGVycyBhbmQgc3VibWl0cyBhIFdTRmVkIGZvcm1cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZm9ybUh0bWxcbiAqIEBwcml2YXRlXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLl9yZW5kZXJBbmRTdWJtaXRXU0ZlZEZvcm0gPSBmdW5jdGlvbiAob3B0aW9ucywgZm9ybUh0bWwpIHtcbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuaW5uZXJIVE1MID0gZm9ybUh0bWw7XG4gIHZhciBmb3JtID0gZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkaXYpLmNoaWxkcmVuWzBdO1xuXG4gIGlmIChvcHRpb25zLnBvcHVwICYmICF0aGlzLl9nZXRDYWxsYmFja09uTG9jYXRpb25IYXNoKG9wdGlvbnMpKSB7XG4gICAgZm9ybS50YXJnZXQgPSAnYXV0aDBfc2lnbnVwX3BvcHVwJztcbiAgfVxuXG4gIGZvcm0uc3VibWl0KCk7XG59O1xuXG4vKipcbiAqIFJlc29sdmUgcmVzcG9uc2UgdHlwZSBhcyBgdG9rZW5gIG9yIGBjb2RlYFxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gYHNjb3BlYCBhbmQgYHJlc3BvbnNlX3R5cGVgIHByb3BlcnRpZXNcbiAqIEBwcml2YXRlXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLl9nZXRNb2RlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgcmV0dXJuIHtcbiAgICBzY29wZTogJ29wZW5pZCcsXG4gICAgcmVzcG9uc2VfdHlwZTogdGhpcy5fZ2V0Q2FsbGJhY2tPbkxvY2F0aW9uSGFzaChvcHRpb25zKSA/ICd0b2tlbicgOiAnY29kZSdcbiAgfTtcbn07XG5cbkF1dGgwLnByb3RvdHlwZS5fY29uZmlndXJlT2ZmbGluZU1vZGUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zLnNjb3BlICYmIG9wdGlvbnMuc2NvcGUuaW5kZXhPZignb2ZmbGluZV9hY2Nlc3MnKSA+PSAwKSB7XG4gICAgb3B0aW9ucy5kZXZpY2UgPSBvcHRpb25zLmRldmljZSB8fCAnQnJvd3Nlcic7XG4gIH1cbn07XG5cbi8qKlxuICogR2V0IHVzZXIgaW5mb3JtYXRpb24gZnJvbSBBUElcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcHJvZmlsZVxuICogQHBhcmFtIHtTdHJpbmd9IGlkX3Rva2VuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHByaXZhdGVcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUuX2dldFVzZXJJbmZvID0gZnVuY3Rpb24gKHByb2ZpbGUsIGlkX3Rva2VuLCBjYWxsYmFjaykge1xuXG4gIGlmICghKHByb2ZpbGUgJiYgIXByb2ZpbGUudXNlcl9pZCkpIHtcbiAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgcHJvZmlsZSk7XG4gIH1cblxuICAvLyB0aGUgc2NvcGUgd2FzIGp1c3Qgb3BlbmlkXG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHZhciBwcm90b2NvbCA9ICdodHRwczonO1xuICB2YXIgZG9tYWluID0gdGhpcy5fZG9tYWluO1xuICB2YXIgZW5kcG9pbnQgPSAnL3Rva2VuaW5mbyc7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICB2YXIgZmFpbCA9IGZ1bmN0aW9uIChzdGF0dXMsIGRlc2NyaXB0aW9uKSB7XG4gICAgdmFyIGVycm9yID0gbmV3IEVycm9yKHN0YXR1cyArICc6ICcgKyAoZGVzY3JpcHRpb24gfHwgJycpKTtcblxuICAgIC8vIFRoZXNlIHR3byBwcm9wZXJ0aWVzIGFyZSBhZGRlZCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG9sZCB2ZXJzaW9ucyAobm8gRXJyb3IgaW5zdGFuY2Ugd2FzIHJldHVybmVkKVxuICAgIGVycm9yLmVycm9yID0gc3RhdHVzO1xuICAgIGVycm9yLmVycm9yX2Rlc2NyaXB0aW9uID0gZGVzY3JpcHRpb247XG5cbiAgICBjYWxsYmFjayhlcnJvcik7XG4gIH07XG5cbiAgaWYgKHRoaXMuX3VzZUpTT05QKSB7XG4gICAgcmV0dXJuIGpzb25wKHVybCArICc/JyArIHFzLnN0cmluZ2lmeSh7aWRfdG9rZW46IGlkX3Rva2VufSksIGpzb25wT3B0cywgZnVuY3Rpb24gKGVyciwgcmVzcCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gZmFpbCgwLCBlcnIudG9TdHJpbmcoKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXNwLnN0YXR1cyA9PT0gMjAwID9cbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcC51c2VyKSA6XG4gICAgICAgIGZhaWwocmVzcC5zdGF0dXMsIHJlc3AuZXJyIHx8IHJlc3AuZXJyb3IpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHJlcXdlc3Qoe1xuICAgIHVybDogICAgICAgICAgc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbikgPyBlbmRwb2ludCA6IHVybCxcbiAgICBtZXRob2Q6ICAgICAgICdwb3N0JyxcbiAgICB0eXBlOiAgICAgICAgICdqc29uJyxcbiAgICBjcm9zc09yaWdpbjogICFzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSxcbiAgICBkYXRhOiAgICAgICAgIHtpZF90b2tlbjogaWRfdG9rZW59XG4gIH0pLmZhaWwoZnVuY3Rpb24gKGVycikge1xuICAgIGZhaWwoZXJyLnN0YXR1cywgZXJyLnJlc3BvbnNlVGV4dCk7XG4gIH0pLnRoZW4oZnVuY3Rpb24gKHVzZXJpbmZvKSB7XG4gICAgY2FsbGJhY2sobnVsbCwgdXNlcmluZm8pO1xuICB9KTtcblxufTtcblxuLyoqXG4gKiBHZXQgcHJvZmlsZSBkYXRhIGJ5IGBpZF90b2tlbmBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRfdG9rZW5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAbWV0aG9kIGdldFByb2ZpbGVcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUuZ2V0UHJvZmlsZSA9IGZ1bmN0aW9uIChpZF90b2tlbiwgY2FsbGJhY2spIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBjYWxsYmFjaykge1xuICAgIHRocm93IG5ldyBFcnJvcignQSBjYWxsYmFjayBmdW5jdGlvbiBpcyByZXF1aXJlZCcpO1xuICB9XG4gIGlmICghaWRfdG9rZW4gfHwgdHlwZW9mIGlkX3Rva2VuICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ0ludmFsaWQgdG9rZW4nKSk7XG4gIH1cblxuICB0aGlzLl9nZXRVc2VySW5mbyh0aGlzLmRlY29kZUp3dChpZF90b2tlbiksIGlkX3Rva2VuLCBjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIFZhbGlkYXRlIGEgdXNlclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQG1ldGhvZCB2YWxpZGF0ZVVzZXJcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUudmFsaWRhdGVVc2VyID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHZhciBwcm90b2NvbCA9ICdodHRwczonO1xuICB2YXIgZG9tYWluID0gdGhpcy5fZG9tYWluO1xuICB2YXIgZW5kcG9pbnQgPSAnL3B1YmxpYy9hcGkvdXNlcnMvdmFsaWRhdGVfdXNlcnBhc3N3b3JkJztcbiAgdmFyIHVybCA9IGpvaW5VcmwocHJvdG9jb2wsIGRvbWFpbiwgZW5kcG9pbnQpO1xuXG4gIHZhciBxdWVyeSA9IHh0ZW5kKFxuICAgIG9wdGlvbnMsXG4gICAge1xuICAgICAgY2xpZW50X2lkOiAgICB0aGlzLl9jbGllbnRJRCxcbiAgICAgIHVzZXJuYW1lOiAgICAgdHJpbShvcHRpb25zLnVzZXJuYW1lIHx8IG9wdGlvbnMuZW1haWwgfHwgJycpXG4gICAgfSk7XG5cbiAgaWYgKHRoaXMuX3VzZUpTT05QKSB7XG4gICAgcmV0dXJuIGpzb25wKHVybCArICc/JyArIHFzLnN0cmluZ2lmeShxdWVyeSksIGpzb25wT3B0cywgZnVuY3Rpb24gKGVyciwgcmVzcCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cbiAgICAgIGlmKCdlcnJvcicgaW4gcmVzcCAmJiByZXNwLnN0YXR1cyAhPT0gNDA0KSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IocmVzcC5lcnJvcikpO1xuICAgICAgfVxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcC5zdGF0dXMgPT09IDIwMCk7XG4gICAgfSk7XG4gIH1cblxuICByZXF3ZXN0KHtcbiAgICB1cmw6ICAgICBzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSA/IGVuZHBvaW50IDogdXJsLFxuICAgIG1ldGhvZDogICdwb3N0JyxcbiAgICB0eXBlOiAgICAndGV4dCcsXG4gICAgZGF0YTogICAgcXVlcnksXG4gICAgY3Jvc3NPcmlnaW46ICFzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSxcbiAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVyci5zdGF0dXMgIT09IDQwNCkgeyByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKGVyci5yZXNwb25zZVRleHQpKTsgfVxuICAgICAgY2FsbGJhY2sobnVsbCwgZmFsc2UpO1xuICAgIH0sXG4gICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3Auc3RhdHVzID09PSAyMDApO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiAqIERlY29kZSBKc29uIFdlYiBUb2tlblxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBqd3RcbiAqIEBtZXRob2QgZGVjb2RlSnd0XG4gKi9cblxuQXV0aDAucHJvdG90eXBlLmRlY29kZUp3dCA9IGZ1bmN0aW9uIChqd3QpIHtcbiAgdmFyIGVuY29kZWQgPSBqd3QgJiYgand0LnNwbGl0KCcuJylbMV07XG4gIHJldHVybiBqc29uX3BhcnNlKEJhc2U2NFVybC5kZWNvZGUoZW5jb2RlZCkpO1xufTtcblxuLyoqXG4gKiBHaXZlbiB0aGUgaGFzaCAob3IgYSBxdWVyeSkgb2YgYW4gVVJMIHJldHVybnMgYSBkaWN0aW9uYXJ5IHdpdGggb25seSByZWxldmFudFxuICogYXV0aGVudGljYXRpb24gaW5mb3JtYXRpb24uIElmIHN1Y2NlZWRzIGl0IHdpbGwgcmV0dXJuIHRoZSBmb2xsb3dpbmcgZmllbGRzOlxuICogYHByb2ZpbGVgLCBgaWRfdG9rZW5gLCBgYWNjZXNzX3Rva2VuYCBhbmQgYHN0YXRlYC4gSW4gY2FzZSBvZiBlcnJvciwgaXQgd2lsbFxuICogcmV0dXJuIGBlcnJvcmAgYW5kIGBlcnJvcl9kZXNjcmlwdGlvbmAuXG4gKlxuICogQG1ldGhvZCBwYXJzZUhhc2hcbiAqIEBwYXJhbSB7U3RyaW5nfSBbaGFzaD13aW5kb3cubG9jYXRpb24uaGFzaF0gVVJMIHRvIGJlIHBhcnNlZFxuICogQGV4YW1wbGVcbiAqICAgICAgdmFyIGF1dGgwID0gbmV3IEF1dGgwKHsuLi59KTtcbiAqXG4gKiAgICAgIC8vIFJldHVybnMge3Byb2ZpbGU6IHsqKiBkZWNvZGVkIGlkIHRva2VuICoqfSwgc3RhdGU6IFwiZ29vZFwifVxuICogICAgICBhdXRoMC5wYXJzZUhhc2goJyNpZF90b2tlbj0uLi4uLiZzdGF0ZT1nb29kJmZvbz1iYXInKTtcbiAqXG4gKiAgICAgIC8vIFJldHVybnMge2Vycm9yOiBcImludmFsaWRfY3JlZGVudGlhbHNcIiwgZXJyb3JfZGVzY3JpcHRpb246IHVuZGVmaW5lZH1cbiAqICAgICAgYXV0aDAucGFyc2VIYXNoKCcjZXJyb3I9aW52YWxpZF9jcmVkZW50aWFscycpO1xuICpcbiAqICAgICAgLy8gUmV0dXJucyB7ZXJyb3I6IFwiaW52YWxpZF9jcmVkZW50aWFsc1wiLCBlcnJvcl9kZXNjcmlwdGlvbjogdW5kZWZpbmVkfVxuICogICAgICBhdXRoMC5wYXJzZUhhc2goJz9lcnJvcj1pbnZhbGlkX2NyZWRlbnRpYWxzJyk7XG4gKlxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5wYXJzZUhhc2ggPSBmdW5jdGlvbiAoaGFzaCkge1xuICBoYXNoID0gaGFzaCB8fCB3aW5kb3cubG9jYXRpb24uaGFzaDtcbiAgdmFyIHBhcnNlZF9xcztcbiAgaWYgKGhhc2gubWF0Y2goL2Vycm9yLykpIHtcbiAgICBoYXNoID0gaGFzaC5zdWJzdHIoMSkucmVwbGFjZSgvXlxcLy8sICcnKTtcbiAgICBwYXJzZWRfcXMgPSBxcy5wYXJzZShoYXNoKTtcbiAgICB2YXIgZXJyID0ge1xuICAgICAgZXJyb3I6IHBhcnNlZF9xcy5lcnJvcixcbiAgICAgIGVycm9yX2Rlc2NyaXB0aW9uOiBwYXJzZWRfcXMuZXJyb3JfZGVzY3JpcHRpb25cbiAgICB9O1xuICAgIHJldHVybiBlcnI7XG4gIH1cbiAgaWYoIWhhc2gubWF0Y2goL2FjY2Vzc190b2tlbi8pKSB7XG4gICAgLy8gSW52YWxpZCBoYXNoIFVSTFxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGhhc2ggPSBoYXNoLnN1YnN0cigxKS5yZXBsYWNlKC9eXFwvLywgJycpO1xuICBwYXJzZWRfcXMgPSBxcy5wYXJzZShoYXNoKTtcbiAgdmFyIGlkX3Rva2VuID0gcGFyc2VkX3FzLmlkX3Rva2VuO1xuICB2YXIgcmVmcmVzaF90b2tlbiA9IHBhcnNlZF9xcy5yZWZyZXNoX3Rva2VuO1xuICB2YXIgcHJvZiA9IHRoaXMuZGVjb2RlSnd0KGlkX3Rva2VuKTtcbiAgdmFyIGludmFsaWRKd3QgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICB2YXIgZXJyID0ge1xuICAgICAgZXJyb3I6ICdpbnZhbGlkX3Rva2VuJyxcbiAgICAgIGVycm9yX2Rlc2NyaXB0aW9uOiBlcnJvclxuICAgIH07XG4gICAgcmV0dXJuIGVycjtcbiAgfTtcblxuICAvLyBhdWQgc2hvdWxkIGJlIHRoZSBjbGllbnRJRFxuICBpZiAocHJvZi5hdWQgIT09IHRoaXMuX2NsaWVudElEKSB7XG4gICAgcmV0dXJuIGludmFsaWRKd3QoXG4gICAgICAnVGhlIGNsaWVudElEIGNvbmZpZ3VyZWQgKCcgKyB0aGlzLl9jbGllbnRJRCArICcpIGRvZXMgbm90IG1hdGNoIHdpdGggdGhlIGNsaWVudElEIHNldCBpbiB0aGUgdG9rZW4gKCcgKyBwcm9mLmF1ZCArICcpLicpO1xuICB9XG5cbiAgLy8gaXNzIHNob3VsZCBiZSB0aGUgQXV0aDAgZG9tYWluIChpLmUuOiBodHRwczovL2NvbnRvc28uYXV0aDAuY29tLylcbiAgaWYgKHByb2YuaXNzICYmIHByb2YuaXNzICE9PSAnaHR0cHM6Ly8nICsgdGhpcy5fZG9tYWluICsgJy8nKSB7XG4gICAgcmV0dXJuIGludmFsaWRKd3QoXG4gICAgICAnVGhlIGRvbWFpbiBjb25maWd1cmVkIChodHRwczovLycgKyB0aGlzLl9kb21haW4gKyAnLykgZG9lcyBub3QgbWF0Y2ggd2l0aCB0aGUgZG9tYWluIHNldCBpbiB0aGUgdG9rZW4gKCcgKyBwcm9mLmlzcyArICcpLicpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwcm9maWxlOiBwcm9mLFxuICAgIGlkX3Rva2VuOiBpZF90b2tlbixcbiAgICBhY2Nlc3NfdG9rZW46IHBhcnNlZF9xcy5hY2Nlc3NfdG9rZW4sXG4gICAgc3RhdGU6IHBhcnNlZF9xcy5zdGF0ZSxcbiAgICByZWZyZXNoX3Rva2VuOiByZWZyZXNoX3Rva2VuXG4gIH07XG59O1xuXG4vKipcbiAqIFNpZ251cFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFNpZ251cCBPcHRpb25zXG4gKiBAcGFyYW0ge1N0cmluZ30gZW1haWwgTmV3IHVzZXIgZW1haWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXNzd29yZCBOZXcgdXNlciBwYXNzd29yZFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAbWV0aG9kIHNpZ251cFxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5zaWdudXAgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgdmFyIF90aGlzID0gdGhpcztcblxuICB2YXIgb3B0cyA9IHtcbiAgICBjbGllbnRfaWQ6IHRoaXMuX2NsaWVudElELFxuICAgIHJlZGlyZWN0X3VyaTogdGhpcy5fZ2V0Q2FsbGJhY2tVUkwob3B0aW9ucyksXG4gICAgdXNlcm5hbWU6IHRyaW0ob3B0aW9ucy51c2VybmFtZSB8fCAnJyksXG4gICAgZW1haWw6IHRyaW0ob3B0aW9ucy5lbWFpbCB8fCBvcHRpb25zLnVzZXJuYW1lIHx8ICcnKSxcbiAgICB0ZW5hbnQ6IHRoaXMuX2RvbWFpbi5zcGxpdCgnLicpWzBdXG4gIH07XG5cbiAgdmFyIHF1ZXJ5ID0geHRlbmQodGhpcy5fZ2V0TW9kZShvcHRpb25zKSwgb3B0aW9ucywgb3B0cyk7XG5cbiAgdGhpcy5fY29uZmlndXJlT2ZmbGluZU1vZGUocXVlcnkpO1xuXG4gIC8vIFRPRE8gQ2hhbmdlIHRoaXMgdG8gYSBwcm9wZXJ0eSBuYW1lZCAnZGlzYWJsZVNTTycgZm9yIGNvbnNpc3RlbmN5LlxuICAvLyBCeSBkZWZhdWx0LCBvcHRpb25zLnNzbyBpcyB0cnVlXG4gIGlmICghY2hlY2tJZlNldChvcHRpb25zLCAnc3NvJykpIHtcbiAgICBvcHRpb25zLnNzbyA9IHRydWU7XG4gIH1cblxuICBpZiAoIWNoZWNrSWZTZXQob3B0aW9ucywgJ2F1dG9fbG9naW4nKSkge1xuICAgIG9wdGlvbnMuYXV0b19sb2dpbiA9IHRydWU7XG4gIH1cblxuICB2YXIgcG9wdXA7XG5cbiAgdmFyIHdpbGxfcG9wdXAgPSBvcHRpb25zLmF1dG9fbG9naW4gJiYgb3B0aW9ucy5wb3B1cFxuICAgICYmICghdGhpcy5fZ2V0Q2FsbGJhY2tPbkxvY2F0aW9uSGFzaChvcHRpb25zKSB8fCBvcHRpb25zLnNzbyk7XG5cbiAgaWYgKHdpbGxfcG9wdXApIHtcbiAgICBwb3B1cCA9IHRoaXMuX2J1aWxkUG9wdXBXaW5kb3cob3B0aW9ucyk7XG4gIH1cblxuICBmdW5jdGlvbiBzdWNjZXNzICgpIHtcbiAgICBpZiAob3B0aW9ucy5hdXRvX2xvZ2luKSB7XG4gICAgICByZXR1cm4gX3RoaXMubG9naW4ob3B0aW9ucywgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgY2FsbGJhY2spIHtcbiAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGZhaWwgKHN0YXR1cywgcmVzcCkge1xuICAgIHZhciBlcnJvciA9IG5ldyBMb2dpbkVycm9yKHN0YXR1cywgcmVzcCk7XG5cbiAgICAvLyB3aGVuIGZhaWxlZCB3ZSB3YW50IHRoZSBwb3B1cCBjbG9zZWQgaWYgb3BlbmVkXG4gICAgaWYgKHBvcHVwICYmICdmdW5jdGlvbicgPT09IHR5cGVvZiBwb3B1cC5raWxsKSB7XG4gICAgICBwb3B1cC5raWxsKCk7XG4gICAgfVxuXG4gICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBjYWxsYmFjaykge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICB9XG5cbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuXG4gIHZhciBwcm90b2NvbCA9ICdodHRwczonO1xuICB2YXIgZG9tYWluID0gdGhpcy5fZG9tYWluO1xuICB2YXIgZW5kcG9pbnQgPSAnL2RiY29ubmVjdGlvbnMvc2lnbnVwJztcbiAgdmFyIHVybCA9IGpvaW5VcmwocHJvdG9jb2wsIGRvbWFpbiwgZW5kcG9pbnQpO1xuXG4gIGlmICh0aGlzLl91c2VKU09OUCkge1xuICAgIHJldHVybiBqc29ucCh1cmwgKyAnPycgKyBxcy5zdHJpbmdpZnkocXVlcnkpLCBqc29ucE9wdHMsIGZ1bmN0aW9uIChlcnIsIHJlc3ApIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIGZhaWwoMCwgZXJyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3Auc3RhdHVzID09IDIwMCA/IHN1Y2Nlc3MoKSA6XG4gICAgICAgICAgICAgIGZhaWwocmVzcC5zdGF0dXMsIHJlc3AuZXJyIHx8IHJlc3AuZXJyb3IpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVxd2VzdCh7XG4gICAgdXJsOiAgICAgc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbikgPyBlbmRwb2ludCA6IHVybCxcbiAgICBtZXRob2Q6ICAncG9zdCcsXG4gICAgdHlwZTogICAgJ2h0bWwnLFxuICAgIGRhdGE6ICAgIHF1ZXJ5LFxuICAgIHN1Y2Nlc3M6IHN1Y2Nlc3MsXG4gICAgY3Jvc3NPcmlnaW46ICFzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSxcbiAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgZmFpbChlcnIuc3RhdHVzLCBlcnIucmVzcG9uc2VUZXh0KTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBDaGFuZ2UgcGFzc3dvcmRcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEBtZXRob2QgY2hhbmdlUGFzc3dvcmRcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUuY2hhbmdlUGFzc3dvcmQgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgdmFyIHF1ZXJ5ID0ge1xuICAgIHRlbmFudDogICAgICAgICB0aGlzLl9kb21haW4uc3BsaXQoJy4nKVswXSxcbiAgICBjbGllbnRfaWQ6ICAgICAgdGhpcy5fY2xpZW50SUQsXG4gICAgY29ubmVjdGlvbjogICAgIG9wdGlvbnMuY29ubmVjdGlvbixcbiAgICB1c2VybmFtZTogICAgICAgdHJpbShvcHRpb25zLnVzZXJuYW1lIHx8ICcnKSxcbiAgICBlbWFpbDogICAgICAgICAgdHJpbShvcHRpb25zLmVtYWlsIHx8IG9wdGlvbnMudXNlcm5hbWUgfHwgJycpLFxuICAgIHBhc3N3b3JkOiAgICAgICBvcHRpb25zLnBhc3N3b3JkXG4gIH07XG5cblxuICBmdW5jdGlvbiBmYWlsIChzdGF0dXMsIHJlc3ApIHtcbiAgICB2YXIgZXJyb3IgPSBuZXcgTG9naW5FcnJvcihzdGF0dXMsIHJlc3ApO1xuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICB2YXIgcHJvdG9jb2wgPSAnaHR0cHM6JztcbiAgdmFyIGRvbWFpbiA9IHRoaXMuX2RvbWFpbjtcbiAgdmFyIGVuZHBvaW50ID0gJy9kYmNvbm5lY3Rpb25zL2NoYW5nZV9wYXNzd29yZCc7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICBpZiAodGhpcy5fdXNlSlNPTlApIHtcbiAgICByZXR1cm4ganNvbnAodXJsICsgJz8nICsgcXMuc3RyaW5naWZ5KHF1ZXJ5KSwganNvbnBPcHRzLCBmdW5jdGlvbiAoZXJyLCByZXNwKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBmYWlsKDAsIGVycik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcC5zdGF0dXMgPT0gMjAwID9cbiAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcC5tZXNzYWdlKSA6XG4gICAgICAgICAgICAgIGZhaWwocmVzcC5zdGF0dXMsIHJlc3AuZXJyIHx8IHJlc3AuZXJyb3IpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVxd2VzdCh7XG4gICAgdXJsOiAgICAgc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbikgPyBlbmRwb2ludCA6IHVybCxcbiAgICBtZXRob2Q6ICAncG9zdCcsXG4gICAgdHlwZTogICAgJ2h0bWwnLFxuICAgIGRhdGE6ICAgIHF1ZXJ5LFxuICAgIGNyb3NzT3JpZ2luOiAhc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbiksXG4gICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGZhaWwoZXJyLnN0YXR1cywgZXJyLnJlc3BvbnNlVGV4dCk7XG4gICAgfSxcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAocikge1xuICAgICAgY2FsbGJhY2sobnVsbCwgcik7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuICogQnVpbGRzIHF1ZXJ5IHN0cmluZyB0byBiZSBwYXNzZWQgdG8gL2F1dGhvcml6ZSBiYXNlZCBvbiBkaWN0IGtleSBhbmQgdmFsdWVzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3NcbiAqIEBwYXJhbSB7QXJyYXl9IGJsYWNrbGlzdFxuICogQHByaXZhdGVcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUuX2J1aWxkQXV0aG9yaXplUXVlcnlTdHJpbmcgPSBmdW5jdGlvbiAoYXJncywgYmxhY2tsaXN0KSB7XG4gIHZhciBxdWVyeSA9IHRoaXMuX2J1aWxkQXV0aG9yaXphdGlvblBhcmFtZXRlcnMoYXJncywgYmxhY2tsaXN0KTtcbiAgcmV0dXJuIHFzLnN0cmluZ2lmeShxdWVyeSk7XG59O1xuXG4vKipcbiAqIEJ1aWxkcyBwYXJhbWV0ZXIgZGljdGlvbmFyeSB0byBiZSBwYXNzZWQgdG8gL2F1dGhvcml6ZSBiYXNlZCBvbiBkaWN0IGtleSBhbmQgdmFsdWVzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3NcbiAqIEBwYXJhbSB7QXJyYXl9IGJsYWNrbGlzdFxuICogQHByaXZhdGVcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUuX2J1aWxkQXV0aG9yaXphdGlvblBhcmFtZXRlcnMgPSBmdW5jdGlvbihhcmdzLCBibGFja2xpc3QpIHtcbiAgdmFyIHF1ZXJ5ID0geHRlbmQuYXBwbHkobnVsbCwgYXJncyk7XG5cbiAgLy8gQWRkcyBvZmZsaW5lIG1vZGUgdG8gdGhlIHF1ZXJ5XG4gIHRoaXMuX2NvbmZpZ3VyZU9mZmxpbmVNb2RlKHF1ZXJ5KTtcblxuICAvLyBBZGRzIGNsaWVudCBTREsgaW5mb3JtYXRpb24gKHdoZW4gZW5hYmxlZClcbiAgaWYgKCB0aGlzLl9zZW5kQ2xpZW50SW5mbyApIHF1ZXJ5WydhdXRoMENsaWVudCddID0gdGhpcy5fZ2V0Q2xpZW50SW5mb1N0cmluZygpO1xuXG4gIC8vIEVsZW1lbnRzIHRvIGZpbHRlciBmcm9tIHF1ZXJ5IHN0cmluZ1xuICBibGFja2xpc3QgPSBibGFja2xpc3QgfHwgWydwb3B1cCcsICdwb3B1cE9wdGlvbnMnXTtcblxuICB2YXIgaSwga2V5O1xuXG4gIGZvciAoaSA9IDA7IGkgPCBibGFja2xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBrZXkgPSBibGFja2xpc3RbaV07XG4gICAgZGVsZXRlIHF1ZXJ5W2tleV07XG4gIH1cblxuICBpZiAocXVlcnkuY29ubmVjdGlvbl9zY29wZSAmJiBpc19hcnJheShxdWVyeS5jb25uZWN0aW9uX3Njb3BlKSl7XG4gICAgcXVlcnkuY29ubmVjdGlvbl9zY29wZSA9IHF1ZXJ5LmNvbm5lY3Rpb25fc2NvcGUuam9pbignLCcpO1xuICB9XG5cbiAgcmV0dXJuIHF1ZXJ5O1xufTtcblxuLyoqXG4gKiBMb2dpbiB1c2VyXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAbWV0aG9kIGxvZ2luXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLmxvZ2luID0gQXV0aDAucHJvdG90eXBlLnNpZ25pbiA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuICAvLyBUT0RPIENoYW5nZSB0aGlzIHRvIGEgcHJvcGVydHkgbmFtZWQgJ2Rpc2FibGVTU08nIGZvciBjb25zaXN0ZW5jeS5cbiAgLy8gQnkgZGVmYXVsdCwgb3B0aW9ucy5zc28gaXMgdHJ1ZVxuICBpZiAoIWNoZWNrSWZTZXQob3B0aW9ucywgJ3NzbycpKSB7XG4gICAgb3B0aW9ucy5zc28gPSB0cnVlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBvcHRpb25zLnBhc3Njb2RlICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiB0aGlzLmxvZ2luV2l0aFBhc3Njb2RlKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb3B0aW9ucy51c2VybmFtZSAhPT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgIHR5cGVvZiBvcHRpb25zLmVtYWlsICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiB0aGlzLmxvZ2luV2l0aFVzZXJuYW1lUGFzc3dvcmQob3B0aW9ucywgY2FsbGJhY2spO1xuICB9XG5cbiAgaWYgKCEhd2luZG93LmNvcmRvdmEpIHtcbiAgICByZXR1cm4gdGhpcy5sb2dpblBob25lZ2FwKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIGlmICghIW9wdGlvbnMucG9wdXAgJiYgdGhpcy5fZ2V0Q2FsbGJhY2tPbkxvY2F0aW9uSGFzaChvcHRpb25zKSkge1xuICAgIHJldHVybiB0aGlzLmxvZ2luV2l0aFBvcHVwKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIHRoaXMuX2F1dGhvcml6ZShvcHRpb25zKTtcbn07XG5cbkF1dGgwLnByb3RvdHlwZS5fYXV0aG9yaXplID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgcXMgPSBbXG4gICAgdGhpcy5fZ2V0TW9kZShvcHRpb25zKSxcbiAgICBvcHRpb25zLFxuICAgIHtcbiAgICAgIGNsaWVudF9pZDogdGhpcy5fY2xpZW50SUQsXG4gICAgICByZWRpcmVjdF91cmk6IHRoaXMuX2dldENhbGxiYWNrVVJMKG9wdGlvbnMpXG4gICAgfVxuICBdO1xuXG4gIHZhciBxdWVyeSA9IHRoaXMuX2J1aWxkQXV0aG9yaXplUXVlcnlTdHJpbmcocXMpO1xuXG4gIHZhciB1cmwgPSBqb2luVXJsKCdodHRwczonLCB0aGlzLl9kb21haW4sICcvYXV0aG9yaXplPycgKyBxdWVyeSk7XG5cbiAgaWYgKG9wdGlvbnMucG9wdXApIHtcbiAgICB0aGlzLl9idWlsZFBvcHVwV2luZG93KG9wdGlvbnMsIHVybCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fcmVkaXJlY3QodXJsKTtcbiAgfVxufTtcblxuLyoqXG4gKiBDb21wdXRlIGBvcHRpb25zLndpZHRoYCBhbmQgYG9wdGlvbnMuaGVpZ2h0YCBmb3IgdGhlIHBvcHVwIHRvXG4gKiBvcGVuIGFuZCByZXR1cm4gYW5kIGV4dGVuZGVkIG9iamVjdCB3aXRoIG9wdGltYWwgYHRvcGAgYW5kIGBsZWZ0YFxuICogcG9zaXRpb24gYXJndW1lbnRzIGZvciB0aGUgcG9wdXAgd2luZG93c1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcHJpdmF0ZVxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5fY29tcHV0ZVBvcHVwUG9zaXRpb24gPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIHdpZHRoID0gb3B0aW9ucy53aWR0aCB8fCA1MDA7XG4gIHZhciBoZWlnaHQgPSBvcHRpb25zLmhlaWdodCB8fCA2MDA7XG5cbiAgdmFyIHNjcmVlblggPSB0eXBlb2Ygd2luZG93LnNjcmVlblggIT09ICd1bmRlZmluZWQnID8gd2luZG93LnNjcmVlblggOiB3aW5kb3cuc2NyZWVuTGVmdDtcbiAgdmFyIHNjcmVlblkgPSB0eXBlb2Ygd2luZG93LnNjcmVlblkgIT09ICd1bmRlZmluZWQnID8gd2luZG93LnNjcmVlblkgOiB3aW5kb3cuc2NyZWVuVG9wO1xuICB2YXIgb3V0ZXJXaWR0aCA9IHR5cGVvZiB3aW5kb3cub3V0ZXJXaWR0aCAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cub3V0ZXJXaWR0aCA6IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGg7XG4gIHZhciBvdXRlckhlaWdodCA9IHR5cGVvZiB3aW5kb3cub3V0ZXJIZWlnaHQgIT09ICd1bmRlZmluZWQnID8gd2luZG93Lm91dGVySGVpZ2h0IDogKGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0IC0gMjIpO1xuICAvLyBYWFg6IHdoYXQgaXMgdGhlIDIyP1xuXG4gIC8vIFVzZSBgb3V0ZXJXaWR0aCAtIHdpZHRoYCBhbmQgYG91dGVySGVpZ2h0IC0gaGVpZ2h0YCBmb3IgaGVscCBpblxuICAvLyBwb3NpdGlvbmluZyB0aGUgcG9wdXAgY2VudGVyZWQgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgd2luZG93XG4gIHZhciBsZWZ0ID0gc2NyZWVuWCArIChvdXRlcldpZHRoIC0gd2lkdGgpIC8gMjtcbiAgdmFyIHRvcCA9IHNjcmVlblkgKyAob3V0ZXJIZWlnaHQgLSBoZWlnaHQpIC8gMjtcblxuICByZXR1cm4geyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0LCBsZWZ0OiBsZWZ0LCB0b3A6IHRvcCB9O1xufTtcblxuLyoqXG4gKiBsb2dpblBob25lZ2FwIG1ldGhvZCBpcyB0cmlnZ2VyZWQgd2hlbiAhIXdpbmRvdy5jb3Jkb3ZhIGlzIHRydWUuXG4gKlxuICogQG1ldGhvZCBsb2dpblBob25lZ2FwXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9ICAgIG9wdGlvbnMgICBMb2dpbiBvcHRpb25zLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gIGNhbGxiYWNrICBUbyBiZSBjYWxsZWQgYWZ0ZXIgbG9naW4gaGFwcGVuZWQuIENhbGxiYWNrIGFyZ3VtZW50c1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG91bGQgYmU6XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlcnIsIHByb2ZpbGUsIGlkVG9rZW4sIGFjY2Vzc1Rva2VuLCBzdGF0ZSlcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgICB2YXIgYXV0aDAgPSBuZXcgQXV0aDAoeyBjbGllbnRJZDogJy4uLicsIGRvbWFpbjogJy4uLid9KTtcbiAqXG4gKiAgICAgIGF1dGgwLnNpZ25pbih7fSwgZnVuY3Rpb24gKGVyciwgcHJvZmlsZSwgaWRUb2tlbiwgYWNjZXNzVG9rZW4sIHN0YXRlKSB7XG4gKiAgICAgICAgaWYgKGVycikge1xuICogICAgICAgICBhbGVydChlcnIpO1xuICogICAgICAgICByZXR1cm47XG4gKiAgICAgICAgfVxuICpcbiAqICAgICAgICBhbGVydCgnV2VsY29tZSAnICsgcHJvZmlsZS5uYW1lKTtcbiAqICAgICAgfSk7XG4gKi9cblxuQXV0aDAucHJvdG90eXBlLmxvZ2luUGhvbmVnYXAgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgaWYgKHRoaXMuX3Nob3VsZEF1dGhlbnRpY2F0ZVdpdGhDb3Jkb3ZhUGx1Z2luKG9wdGlvbnMuY29ubmVjdGlvbikpIHtcbiAgICB0aGlzLl9zb2NpYWxQaG9uZWdhcExvZ2luKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgbW9iaWxlQ2FsbGJhY2tVUkwgPSBqb2luVXJsKCdodHRwczonLCB0aGlzLl9kb21haW4sICcvbW9iaWxlJyk7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHZhciBxcyA9IFtcbiAgICB0aGlzLl9nZXRNb2RlKG9wdGlvbnMpLFxuICAgIG9wdGlvbnMsXG4gICAge1xuICAgICAgY2xpZW50X2lkOiB0aGlzLl9jbGllbnRJRCxcbiAgICAgIHJlZGlyZWN0X3VyaTogbW9iaWxlQ2FsbGJhY2tVUkxcbiAgICB9XG4gIF07XG5cbiAgaWYgKCB0aGlzLl9zZW5kQ2xpZW50SW5mbyApIHtcbiAgICBxcy5wdXNoKHsgYXV0aDBDbGllbnQ6IHRoaXMuX2dldENsaWVudEluZm9TdHJpbmcoKSB9KTtcbiAgfVxuXG4gIHZhciBxdWVyeSA9IHRoaXMuX2J1aWxkQXV0aG9yaXplUXVlcnlTdHJpbmcocXMpO1xuXG4gIHZhciBwb3B1cFVybCA9IGpvaW5VcmwoJ2h0dHBzOicsIHRoaXMuX2RvbWFpbiwgJy9hdXRob3JpemU/JyArIHF1ZXJ5KTtcblxuICB2YXIgcG9wdXBPcHRpb25zID0geHRlbmQoe2xvY2F0aW9uOiAneWVzJ30gLFxuICAgIG9wdGlvbnMucG9wdXBPcHRpb25zKTtcblxuICAvLyBUaGlzIHdhc24ndCBzZW5kIGJlZm9yZSBzbyB3ZSBkb24ndCBzZW5kIGl0IG5vdyBlaXRoZXJcbiAgZGVsZXRlIHBvcHVwT3B0aW9ucy53aWR0aDtcbiAgZGVsZXRlIHBvcHVwT3B0aW9ucy5oZWlnaHQ7XG5cblxuXG4gIHZhciByZWYgPSB3aW5kb3cub3Blbihwb3B1cFVybCwgJ19ibGFuaycsIHN0cmluZ2lmeVBvcHVwU2V0dGluZ3MocG9wdXBPcHRpb25zKSk7XG4gIHZhciBhbnN3ZXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGVycm9ySGFuZGxlcihldmVudCkge1xuICAgIGlmIChhbnN3ZXJlZCkgeyByZXR1cm47IH1cbiAgICBjYWxsYmFjayhuZXcgRXJyb3IoZXZlbnQubWVzc2FnZSksIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIGFuc3dlcmVkID0gdHJ1ZTtcbiAgICByZXR1cm4gcmVmLmNsb3NlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBzdGFydEhhbmRsZXIoZXZlbnQpIHtcbiAgICBpZiAoYW5zd2VyZWQpIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAoIGV2ZW50LnVybCAmJiAhKGV2ZW50LnVybC5pbmRleE9mKG1vYmlsZUNhbGxiYWNrVVJMICsgJyMnKSA9PT0gMCB8fFxuICAgICAgICAgICAgICAgICAgICAgICBldmVudC51cmwuaW5kZXhPZihtb2JpbGVDYWxsYmFja1VSTCArICc/JykgPT09IDApKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHJlc3VsdCA9IF90aGlzLnBhcnNlSGFzaChldmVudC51cmwuc2xpY2UobW9iaWxlQ2FsbGJhY2tVUkwubGVuZ3RoKSk7XG5cbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgY2FsbGJhY2sobmV3IEVycm9yKCdFcnJvciBwYXJzaW5nIGhhc2gnKSwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgICBhbnN3ZXJlZCA9IHRydWU7XG4gICAgICByZXR1cm4gcmVmLmNsb3NlKCk7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdC5pZF90b2tlbikge1xuICAgICAgX3RoaXMuZ2V0UHJvZmlsZShyZXN1bHQuaWRfdG9rZW4sIGZ1bmN0aW9uIChlcnIsIHByb2ZpbGUpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyLCBwcm9maWxlLCByZXN1bHQuaWRfdG9rZW4sIHJlc3VsdC5hY2Nlc3NfdG9rZW4sIHJlc3VsdC5zdGF0ZSwgcmVzdWx0LnJlZnJlc2hfdG9rZW4pO1xuICAgICAgfSk7XG4gICAgICBhbnN3ZXJlZCA9IHRydWU7XG4gICAgICByZXR1cm4gcmVmLmNsb3NlKCk7XG4gICAgfVxuXG4gICAgLy8gQ2FzZSB3aGVyZSB3ZSd2ZSBmb3VuZCBhbiBlcnJvclxuICAgIGNhbGxiYWNrKG5ldyBFcnJvcihyZXN1bHQuZXJyIHx8IHJlc3VsdC5lcnJvciB8fCAnU29tZXRoaW5nIHdlbnQgd3JvbmcnKSwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgYW5zd2VyZWQgPSB0cnVlO1xuICAgIHJldHVybiByZWYuY2xvc2UoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4aXRIYW5kbGVyKCkge1xuICAgIGlmIChhbnN3ZXJlZCkgeyByZXR1cm47IH1cblxuICAgIGNhbGxiYWNrKG5ldyBFcnJvcignQnJvd3NlciB3aW5kb3cgY2xvc2VkJyksIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuXG4gICAgcmVmLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWRlcnJvcicsIGVycm9ySGFuZGxlcik7XG4gICAgcmVmLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWRzdGFydCcsIHN0YXJ0SGFuZGxlcik7XG4gICAgcmVmLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2V4aXQnLCBleGl0SGFuZGxlcik7XG4gIH1cblxuICByZWYuYWRkRXZlbnRMaXN0ZW5lcignbG9hZGVycm9yJywgZXJyb3JIYW5kbGVyKTtcbiAgcmVmLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWRzdGFydCcsIHN0YXJ0SGFuZGxlcik7XG4gIHJlZi5hZGRFdmVudExpc3RlbmVyKCdleGl0JywgZXhpdEhhbmRsZXIpO1xuXG59O1xuXG4vKipcbiAqIGxvZ2luV2l0aFBvcHVwIG1ldGhvZCBpcyB0cmlnZ2VyZWQgd2hlbiBsb2dpbiBtZXRob2QgcmVjZWl2ZXMgYSB7cG9wdXA6IHRydWV9IGluXG4gKiB0aGUgbG9naW4gb3B0aW9ucy5cbiAqXG4gKiBAbWV0aG9kIGxvZ2luV2l0aFBvcHVwXG4gKiBAcGFyYW0ge09iamVjdH0gICBvcHRpb25zICAgIExvZ2luIG9wdGlvbnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAgIFRvIGJlIGNhbGxlZCBhZnRlciBsb2dpbiBoYXBwZW5lZCAod2hldGhlclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzIG9yIGZhaWx1cmUpLiBUaGlzIHBhcmFtZXRlciBpcyBtYW5kYXRvcnkgd2hlblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb24gY2FsbGJhY2tPbkxvY2F0aW9uSGFzaCBpcyB0cnV0aHkgYnV0IHNob3VsZCBub3RcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmUgdXNlZCB3aGVuIGZhbHN5LlxuICogQGV4YW1wbGVcbiAqICAgICAgIHZhciBhdXRoMCA9IG5ldyBBdXRoMCh7IGNsaWVudElkOiAnLi4uJywgZG9tYWluOiAnLi4uJywgY2FsbGJhY2tPbkxvY2F0aW9uSGFzaDogdHJ1ZSB9KTtcbiAqXG4gKiAgICAgICAvLyBFcnJvciEgTm8gY2FsbGJhY2tcbiAqICAgICAgIGF1dGgwLmxvZ2luKHtwb3B1cDogdHJ1ZX0pO1xuICpcbiAqICAgICAgIC8vIE9rIVxuICogICAgICAgYXV0aDAubG9naW4oe3BvcHVwOiB0cnVlfSwgZnVuY3Rpb24gKCkgeyB9KTtcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgICAgdmFyIGF1dGgwID0gbmV3IEF1dGgwKHsgY2xpZW50SWQ6ICcuLi4nLCBkb21haW46ICcuLi4nfSk7XG4gKlxuICogICAgICAgLy8gT2shXG4gKiAgICAgICBhdXRoMC5sb2dpbih7cG9wdXA6IHRydWV9KTtcbiAqXG4gKiAgICAgICAvLyBFcnJvciEgTm8gY2FsbGJhY2sgd2lsbCBiZSBleGVjdXRlZCBvbiByZXNwb25zZV90eXBlPWNvZGVcbiAqICAgICAgIGF1dGgwLmxvZ2luKHtwb3B1cDogdHJ1ZX0sIGZ1bmN0aW9uICgpIHsgfSk7XG4gKiBAcHJpdmF0ZVxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5sb2dpbldpdGhQb3B1cCA9IGZ1bmN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgaWYgKCFjYWxsYmFjaykge1xuICAgIHRocm93IG5ldyBFcnJvcigncG9wdXAgbW9kZSBzaG91bGQgcmVjZWl2ZSBhIG1hbmRhdG9yeSBjYWxsYmFjaycpO1xuICB9XG5cbiAgdmFyIHFzID0gW3RoaXMuX2dldE1vZGUob3B0aW9ucyksIG9wdGlvbnMsIHsgY2xpZW50X2lkOiB0aGlzLl9jbGllbnRJRCwgb3dwOiB0cnVlIH1dO1xuXG4gIGlmICh0aGlzLl9zZW5kQ2xpZW50SW5mbykge1xuICAgIHFzLnB1c2goeyBhdXRoMENsaWVudDogdGhpcy5fZ2V0Q2xpZW50SW5mb1N0cmluZygpIH0pO1xuICB9XG5cbiAgdmFyIHF1ZXJ5ID0gdGhpcy5fYnVpbGRBdXRob3JpemVRdWVyeVN0cmluZyhxcyk7XG4gIHZhciBwb3B1cFVybCA9IGpvaW5VcmwoJ2h0dHBzOicsIHRoaXMuX2RvbWFpbiwgJy9hdXRob3JpemU/JyArIHF1ZXJ5KTtcblxuICB2YXIgcG9wdXBQb3NpdGlvbiA9IHRoaXMuX2NvbXB1dGVQb3B1cFBvc2l0aW9uKG9wdGlvbnMucG9wdXBPcHRpb25zKTtcbiAgdmFyIHBvcHVwT3B0aW9ucyA9IHh0ZW5kKHBvcHVwUG9zaXRpb24sIG9wdGlvbnMucG9wdXBPcHRpb25zKTtcblxuICB2YXIgcG9wdXAgPSBXaW5DaGFuLm9wZW4oe1xuICAgIHVybDogcG9wdXBVcmwsXG4gICAgcmVsYXlfdXJsOiAnaHR0cHM6Ly8nICsgdGhpcy5fZG9tYWluICsgJy9yZWxheS5odG1sJyxcbiAgICB3aW5kb3dfZmVhdHVyZXM6IHN0cmluZ2lmeVBvcHVwU2V0dGluZ3MocG9wdXBPcHRpb25zKVxuICB9LCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcbiAgICAvLyBFbGltaW5hdGUgYF9jdXJyZW50X3BvcHVwYCByZWZlcmVuY2UgbWFudWFsbHkgYmVjYXVzZVxuICAgIC8vIFdpbmNoYW4gcmVtb3ZlcyBgLmtpbGwoKWAgbWV0aG9kIGZyb20gd2luZG93IGFuZCBhbHNvXG4gICAgLy8gZG9lc24ndCBjYWxsIGAua2lsbCgpYCBieSBpdHNlbGZcbiAgICBfdGhpcy5fY3VycmVudF9wb3B1cCA9IG51bGw7XG5cbiAgICAvLyBXaW5jaGFuIGFsd2F5cyByZXR1cm5zIHN0cmluZyBlcnJvcnMsIHdlIHdyYXAgdGhlbSBpbnNpZGUgRXJyb3Igb2JqZWN0c1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTG9naW5FcnJvcihlcnIpLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgZWRnZSBjYXNlIHdpdGggZ2VuZXJpYyBlcnJvclxuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobmV3IExvZ2luRXJyb3IoJ1NvbWV0aGluZyB3ZW50IHdyb25nJyksIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBwcm9maWxlIHJldHJpZXZhbCBmcm9tIGlkX3Rva2VuIGFuZCByZXNwb25kXG4gICAgaWYgKHJlc3VsdC5pZF90b2tlbikge1xuICAgICAgcmV0dXJuIF90aGlzLmdldFByb2ZpbGUocmVzdWx0LmlkX3Rva2VuLCBmdW5jdGlvbiAoZXJyLCBwcm9maWxlKSB7XG4gICAgICAgIGNhbGxiYWNrKGVyciwgcHJvZmlsZSwgcmVzdWx0LmlkX3Rva2VuLCByZXN1bHQuYWNjZXNzX3Rva2VuLCByZXN1bHQuc3RhdGUsIHJlc3VsdC5yZWZyZXNoX3Rva2VuKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIENhc2Ugd2hlcmUgdGhlIGVycm9yIGlzIHJldHVybmVkIGF0IGFuIGBlcnJgIHByb3BlcnR5IGZyb20gdGhlIHJlc3VsdFxuICAgIGlmIChyZXN1bHQuZXJyKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobmV3IExvZ2luRXJyb3IocmVzdWx0LmVyci5zdGF0dXMsIHJlc3VsdC5lcnIuZGV0YWlscyB8fCByZXN1bHQuZXJyKSwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgfVxuXG4gICAgLy8gQ2FzZSBmb3Igc3NvX2RiY29ubmVjdGlvbl9wb3B1cCByZXR1cm5pbmcgZXJyb3IgYXQgcmVzdWx0LmVycm9yIGluc3RlYWQgb2YgcmVzdWx0LmVyclxuICAgIGlmIChyZXN1bHQuZXJyb3IpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTG9naW5FcnJvcihyZXN1bHQuc3RhdHVzLCByZXN1bHQuZGV0YWlscyB8fCByZXN1bHQpLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICB9XG5cbiAgICAvLyBDYXNlIHdlIGNvdWxkbid0IG1hdGNoIGFueSBlcnJvciwgd2UgcmV0dXJuIGEgZ2VuZXJpYyBvbmVcbiAgICByZXR1cm4gY2FsbGJhY2sobmV3IExvZ2luRXJyb3IoJ1NvbWV0aGluZyB3ZW50IHdyb25nJyksIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICB9KTtcblxuICBwb3B1cC5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBfc2hvdWxkQXV0aGVudGljYXRlV2l0aENvcmRvdmFQbHVnaW4gbWV0aG9kIGNoZWNrcyB3aGV0aGVyIEF1dGgwIGlzIHByb3Blcmx5IGNvbmZpZ3VyZWQgdG9cbiAqIGhhbmRsZSBhdXRoZW50aWNhdGlvbiBvZiBhIHNvY2lhbCBjb25ubmVjdGlvbiB1c2luZyBhIHBob25lZ2FwIHBsdWdpbi5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gICBjb25uZWN0aW9uICAgIE5hbWUgb2YgdGhlIGNvbm5lY3Rpb24uXG4gKiBAcHJpdmF0ZVxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5fc2hvdWxkQXV0aGVudGljYXRlV2l0aENvcmRvdmFQbHVnaW4gPSBmdW5jdGlvbihjb25uZWN0aW9uKSB7XG4gIHZhciBzb2NpYWxQbHVnaW4gPSB0aGlzLl9jb3Jkb3ZhU29jaWFsUGx1Z2luc1tjb25uZWN0aW9uXTtcbiAgcmV0dXJuIHRoaXMuX3VzZUNvcmRvdmFTb2NpYWxQbHVnaW5zICYmICEhc29jaWFsUGx1Z2luO1xufTtcblxuLyoqXG4gKiBfc29jaWFsUGhvbmVnYXBMb2dpbiBwZXJmb3JtcyBzb2NpYWwgYXV0aGVudGljYXRpb24gdXNpbmcgYSBwaG9uZWdhcCBwbHVnaW5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gICBjb25uZWN0aW9uICAgTmFtZSBvZiB0aGUgY29ubmVjdGlvbi5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrICAgICBUbyBiZSBjYWxsZWQgYWZ0ZXIgbG9naW4gaGFwcGVuZWQgKHdoZXRoZXJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzIG9yIGZhaWx1cmUpLlxuICogQHByaXZhdGVcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUuX3NvY2lhbFBob25lZ2FwTG9naW4gPSBmdW5jdGlvbihvcHRpb25zLCBjYWxsYmFjaykge1xuICB2YXIgc29jaWFsQXV0aGVudGljYXRpb24gPSB0aGlzLl9jb3Jkb3ZhU29jaWFsUGx1Z2luc1tvcHRpb25zLmNvbm5lY3Rpb25dO1xuICB2YXIgX3RoaXMgPSB0aGlzO1xuICBzb2NpYWxBdXRoZW50aWNhdGlvbihvcHRpb25zLmNvbm5lY3Rpb25fc2NvcGUsIGZ1bmN0aW9uKGVycm9yLCBhY2Nlc3NUb2tlbiwgZXh0cmFzKSB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBsb2dpbk9wdGlvbnMgPSB4dGVuZCh7IGFjY2Vzc190b2tlbjogYWNjZXNzVG9rZW4gfSwgb3B0aW9ucywgZXh0cmFzKTtcbiAgICBfdGhpcy5sb2dpbldpdGhTb2NpYWxBY2Nlc3NUb2tlbihsb2dpbk9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIF9waG9uZWdhcEZhY2Vib29rTG9naW4gcGVyZm9ybXMgc29jaWFsIGF1dGhlbnRpY2F0aW9uIHdpdGggRmFjZWJvb2sgdXNpbmcgcGhvbmVnYXAtZmFjZWJvb2stcGx1Z2luXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgc2NvcGVzICAgICBGQiBzY29wZXMgdXNlZCB0byBsb2dpbi4gSXQgY2FuIGJlIGFuIEFycmF5IG9mIFN0cmluZyBvciBhIHNpbmdsZSBTdHJpbmcuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJ5IGRlZmF1bHQgaXMgW1wicHVibGljX3Byb2ZpbGVcIl1cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrICAgVG8gYmUgY2FsbGVkIGFmdGVyIGxvZ2luIGhhcHBlbmVkICh3aGV0aGVyIHN1Y2Nlc3Mgb3IgZmFpbHVyZSkuIEl0IHdpbGxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeWllbGQgdGhlIGFjY2Vzc1Rva2VuIGFuZCBhbnkgZXh0cmEgaW5mb3JtYXRpb24gbmVlZWRlZCBieSBBdXRoMCBBUElcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3IgYW4gRXJyb3IgaWYgdGhlIGF1dGhlbnRpY2F0aW9uIGZhaWxzLiBDYWxsYmFjayBzaG91bGQgYmU6XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlcnIsIGFjY2Vzc1Rva2VuLCBleHRyYXMpIHsgfVxuICogQHByaXZhdGVcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUuX3Bob25lZ2FwRmFjZWJvb2tMb2dpbiA9IGZ1bmN0aW9uKHNjb3BlcywgY2FsbGJhY2spIHtcbiAgaWYgKCF3aW5kb3cuZmFjZWJvb2tDb25uZWN0UGx1Z2luIHx8ICF3aW5kb3cuZmFjZWJvb2tDb25uZWN0UGx1Z2luLmxvZ2luKSB7XG4gICAgY2FsbGJhY2sobmV3IEVycm9yKCdtaXNzaW5nIHBsdWdpbiBwaG9uZWdhcC1mYWNlYm9vay1wbHVnaW4nKSwgbnVsbCwgbnVsbCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGZiU2NvcGVzO1xuICBpZiAoc2NvcGVzICYmIGlzX2FycmF5KHNjb3Blcykpe1xuICAgIGZiU2NvcGVzID0gc2NvcGVzO1xuICB9IGVsc2UgaWYgKHNjb3Blcykge1xuICAgIGZiU2NvcGVzID0gW3Njb3Blc107XG4gIH0gZWxzZSB7XG4gICAgZmJTY29wZXMgPSBbJ3B1YmxpY19wcm9maWxlJ107XG4gIH1cbiAgd2luZG93LmZhY2Vib29rQ29ubmVjdFBsdWdpbi5sb2dpbihmYlNjb3BlcywgZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgY2FsbGJhY2sobnVsbCwgc3RhdGUuYXV0aFJlc3BvbnNlLmFjY2Vzc1Rva2VuLCB7fSk7XG4gIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgY2FsbGJhY2sobmV3IEVycm9yKGVycm9yKSwgbnVsbCwgbnVsbCk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBUaGlzIG1ldGhvZCBoYW5kbGVzIHRoZSBzY2VuYXJpbyB3aGVyZSBhIGRiIGNvbm5lY3Rpb24gaXMgdXNlZCB3aXRoXG4gKiBwb3B1cDogdHJ1ZSBhbmQgc3NvOiB0cnVlLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkF1dGgwLnByb3RvdHlwZS5sb2dpbldpdGhVc2VybmFtZVBhc3N3b3JkQW5kU1NPID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHZhciBwb3B1cFBvc2l0aW9uID0gdGhpcy5fY29tcHV0ZVBvcHVwUG9zaXRpb24ob3B0aW9ucy5wb3B1cE9wdGlvbnMpO1xuICB2YXIgcG9wdXBPcHRpb25zID0geHRlbmQocG9wdXBQb3NpdGlvbiwgb3B0aW9ucy5wb3B1cE9wdGlvbnMpO1xuXG4gIHZhciBwb3B1cCA9IFdpbkNoYW4ub3Blbih7XG4gICAgdXJsOiAnaHR0cHM6Ly8nICsgdGhpcy5fZG9tYWluICsgJy9zc29fZGJjb25uZWN0aW9uX3BvcHVwLycgKyB0aGlzLl9jbGllbnRJRCxcbiAgICByZWxheV91cmw6ICdodHRwczovLycgKyB0aGlzLl9kb21haW4gKyAnL3JlbGF5Lmh0bWwnLFxuICAgIHdpbmRvd19mZWF0dXJlczogc3RyaW5naWZ5UG9wdXBTZXR0aW5ncyhwb3B1cE9wdGlvbnMpLFxuICAgIHBvcHVwOiB0aGlzLl9jdXJyZW50X3BvcHVwLFxuICAgIHBhcmFtczoge1xuICAgICAgZG9tYWluOiAgICAgICAgICAgICAgICAgdGhpcy5fZG9tYWluLFxuICAgICAgY2xpZW50SUQ6ICAgICAgICAgICAgICAgdGhpcy5fY2xpZW50SUQsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIC8vIFRPRE8gV2hhdCBoYXBwZW5zIHdpdGggaTE4bj9cbiAgICAgICAgdXNlcm5hbWU6ICAgb3B0aW9ucy51c2VybmFtZSxcbiAgICAgICAgcGFzc3dvcmQ6ICAgb3B0aW9ucy5wYXNzd29yZCxcbiAgICAgICAgY29ubmVjdGlvbjogb3B0aW9ucy5jb25uZWN0aW9uLFxuICAgICAgICBzdGF0ZTogICAgICBvcHRpb25zLnN0YXRlLFxuICAgICAgICBzY29wZTogICAgICBvcHRpb25zLnNjb3BlXG4gICAgICB9XG4gICAgfVxuICB9LCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcbiAgICAvLyBFbGltaW5hdGUgYF9jdXJyZW50X3BvcHVwYCByZWZlcmVuY2UgbWFudWFsbHkgYmVjYXVzZVxuICAgIC8vIFdpbmNoYW4gcmVtb3ZlcyBgLmtpbGwoKWAgbWV0aG9kIGZyb20gd2luZG93IGFuZCBhbHNvXG4gICAgLy8gZG9lc24ndCBjYWxsIGAua2lsbCgpYCBieSBpdHNlbGZcbiAgICBfdGhpcy5fY3VycmVudF9wb3B1cCA9IG51bGw7XG5cbiAgICAvLyBXaW5jaGFuIGFsd2F5cyByZXR1cm5zIHN0cmluZyBlcnJvcnMsIHdlIHdyYXAgdGhlbSBpbnNpZGUgRXJyb3Igb2JqZWN0c1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTG9naW5FcnJvcihlcnIpLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgZWRnZSBjYXNlIHdpdGggZ2VuZXJpYyBlcnJvclxuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobmV3IExvZ2luRXJyb3IoJ1NvbWV0aGluZyB3ZW50IHdyb25nJyksIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBwcm9maWxlIHJldHJpZXZhbCBmcm9tIGlkX3Rva2VuIGFuZCByZXNwb25kXG4gICAgaWYgKHJlc3VsdC5pZF90b2tlbikge1xuICAgICAgcmV0dXJuIF90aGlzLmdldFByb2ZpbGUocmVzdWx0LmlkX3Rva2VuLCBmdW5jdGlvbiAoZXJyLCBwcm9maWxlKSB7XG4gICAgICAgIGNhbGxiYWNrKGVyciwgcHJvZmlsZSwgcmVzdWx0LmlkX3Rva2VuLCByZXN1bHQuYWNjZXNzX3Rva2VuLCByZXN1bHQuc3RhdGUsIHJlc3VsdC5yZWZyZXNoX3Rva2VuKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIENhc2Ugd2hlcmUgdGhlIGVycm9yIGlzIHJldHVybmVkIGF0IGFuIGBlcnJgIHByb3BlcnR5IGZyb20gdGhlIHJlc3VsdFxuICAgIGlmIChyZXN1bHQuZXJyKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobmV3IExvZ2luRXJyb3IocmVzdWx0LmVyci5zdGF0dXMsIHJlc3VsdC5lcnIuZGV0YWlscyB8fCByZXN1bHQuZXJyKSwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgfVxuXG4gICAgLy8gQ2FzZSBmb3Igc3NvX2RiY29ubmVjdGlvbl9wb3B1cCByZXR1cm5pbmcgZXJyb3IgYXQgcmVzdWx0LmVycm9yIGluc3RlYWQgb2YgcmVzdWx0LmVyclxuICAgIGlmIChyZXN1bHQuZXJyb3IpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTG9naW5FcnJvcihyZXN1bHQuc3RhdHVzLCByZXN1bHQuZGV0YWlscyB8fCByZXN1bHQpLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICB9XG5cbiAgICAvLyBDYXNlIHdlIGNvdWxkbid0IG1hdGNoIGFueSBlcnJvciwgd2UgcmV0dXJuIGEgZ2VuZXJpYyBvbmVcbiAgICByZXR1cm4gY2FsbGJhY2sobmV3IExvZ2luRXJyb3IoJ1NvbWV0aGluZyB3ZW50IHdyb25nJyksIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICB9KTtcblxuICBwb3B1cC5mb2N1cygpO1xufTtcblxuLyoqXG4gKiBMb2dpbiB3aXRoIFJlc291cmNlIE93bmVyIChSTylcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEBtZXRob2QgbG9naW5XaXRoUmVzb3VyY2VPd25lclxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5sb2dpbldpdGhSZXNvdXJjZU93bmVyID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHZhciBxdWVyeSA9IHh0ZW5kKFxuICAgIHRoaXMuX2dldE1vZGUob3B0aW9ucyksXG4gICAgb3B0aW9ucyxcbiAgICB7XG4gICAgICBjbGllbnRfaWQ6ICAgIHRoaXMuX2NsaWVudElELFxuICAgICAgdXNlcm5hbWU6ICAgICB0cmltKG9wdGlvbnMudXNlcm5hbWUgfHwgb3B0aW9ucy5lbWFpbCB8fCAnJyksXG4gICAgICBncmFudF90eXBlOiAgICdwYXNzd29yZCdcbiAgICB9KTtcblxuICB0aGlzLl9jb25maWd1cmVPZmZsaW5lTW9kZShxdWVyeSk7XG5cbiAgdmFyIHByb3RvY29sID0gJ2h0dHBzOic7XG4gIHZhciBkb21haW4gPSB0aGlzLl9kb21haW47XG4gIHZhciBlbmRwb2ludCA9ICcvb2F1dGgvcm8nO1xuICB2YXIgdXJsID0gam9pblVybChwcm90b2NvbCwgZG9tYWluLCBlbmRwb2ludCk7XG5cbiAgaWYgKCB0aGlzLl9zZW5kQ2xpZW50SW5mbyAmJiB0aGlzLl91c2VKU09OUCApIHtcbiAgICBxdWVyeVsnYXV0aDBDbGllbnQnXSA9IHRoaXMuX2dldENsaWVudEluZm9TdHJpbmcoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVucmljaEdldFByb2ZpbGUocmVzcCwgY2FsbGJhY2spIHtcbiAgICBfdGhpcy5nZXRQcm9maWxlKHJlc3AuaWRfdG9rZW4sIGZ1bmN0aW9uIChlcnIsIHByb2ZpbGUpIHtcbiAgICAgIGNhbGxiYWNrKGVyciwgcHJvZmlsZSwgcmVzcC5pZF90b2tlbiwgcmVzcC5hY2Nlc3NfdG9rZW4sIHJlc3Auc3RhdGUsIHJlc3AucmVmcmVzaF90b2tlbik7XG4gICAgfSk7XG4gIH1cblxuICBpZiAodGhpcy5fdXNlSlNPTlApIHtcbiAgICByZXR1cm4ganNvbnAodXJsICsgJz8nICsgcXMuc3RyaW5naWZ5KHF1ZXJ5KSwganNvbnBPcHRzLCBmdW5jdGlvbiAoZXJyLCByZXNwKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgfVxuICAgICAgaWYoJ2Vycm9yJyBpbiByZXNwKSB7XG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBMb2dpbkVycm9yKHJlc3Auc3RhdHVzLCByZXNwLmVycm9yKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICAgIH1cbiAgICAgIGVucmljaEdldFByb2ZpbGUocmVzcCwgY2FsbGJhY2spO1xuICAgIH0pO1xuICB9XG5cbiAgcmVxd2VzdCh7XG4gICAgdXJsOiAgICAgc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbikgPyBlbmRwb2ludCA6IHVybCxcbiAgICBtZXRob2Q6ICAncG9zdCcsXG4gICAgdHlwZTogICAgJ2pzb24nLFxuICAgIGRhdGE6ICAgIHF1ZXJ5LFxuICAgIGhlYWRlcnM6IHRoaXMuX2dldENsaWVudEluZm9IZWFkZXIoKSxcbiAgICBjcm9zc09yaWdpbjogIXNhbWVfb3JpZ2luKHByb3RvY29sLCBkb21haW4pLFxuICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICBlbnJpY2hHZXRQcm9maWxlKHJlc3AsIGNhbGxiYWNrKTtcbiAgICB9LFxuICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBoYW5kbGVSZXF1ZXN0RXJyb3IoZXJyLCBjYWxsYmFjayk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuICogTG9naW4gd2l0aCBTb2NpYWwgQWNjZXNzIFRva2VuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAbWV0aG9kIGxvZ2luV2l0aFNvY2lhbEFjY2Vzc1Rva2VuXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLmxvZ2luV2l0aFNvY2lhbEFjY2Vzc1Rva2VuID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHZhciBxdWVyeSA9IHRoaXMuX2J1aWxkQXV0aG9yaXphdGlvblBhcmFtZXRlcnMoW1xuICAgICAgeyBzY29wZTogJ29wZW5pZCcgfSxcbiAgICAgIG9wdGlvbnMsXG4gICAgICB7IGNsaWVudF9pZDogdGhpcy5fY2xpZW50SUQgfVxuICAgIF0pO1xuXG4gIHZhciBwcm90b2NvbCA9ICdodHRwczonO1xuICB2YXIgZG9tYWluID0gdGhpcy5fZG9tYWluO1xuICB2YXIgZW5kcG9pbnQgPSAnL29hdXRoL2FjY2Vzc190b2tlbic7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICBmdW5jdGlvbiBlbnJpY2hHZXRQcm9maWxlKHJlc3AsIGNhbGxiYWNrKSB7XG4gICAgX3RoaXMuZ2V0UHJvZmlsZShyZXNwLmlkX3Rva2VuLCBmdW5jdGlvbiAoZXJyLCBwcm9maWxlKSB7XG4gICAgICBjYWxsYmFjayhlcnIsIHByb2ZpbGUsIHJlc3AuaWRfdG9rZW4sIHJlc3AuYWNjZXNzX3Rva2VuLCByZXNwLnN0YXRlLCByZXNwLnJlZnJlc2hfdG9rZW4pO1xuICAgIH0pO1xuICB9XG5cbiAgaWYgKHRoaXMuX3VzZUpTT05QKSB7XG4gICAgcmV0dXJuIGpzb25wKHVybCArICc/JyArIHFzLnN0cmluZ2lmeShxdWVyeSksIGpzb25wT3B0cywgZnVuY3Rpb24gKGVyciwgcmVzcCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cbiAgICAgIGlmKCdlcnJvcicgaW4gcmVzcCkge1xuICAgICAgICB2YXIgZXJyb3IgPSBuZXcgTG9naW5FcnJvcihyZXNwLnN0YXR1cywgcmVzcC5lcnJvcik7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XG4gICAgICB9XG4gICAgICBlbnJpY2hHZXRQcm9maWxlKHJlc3AsIGNhbGxiYWNrKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlcXdlc3Qoe1xuICAgIHVybDogICAgIHNhbWVfb3JpZ2luKHByb3RvY29sLCBkb21haW4pID8gZW5kcG9pbnQgOiB1cmwsXG4gICAgbWV0aG9kOiAgJ3Bvc3QnLFxuICAgIHR5cGU6ICAgICdqc29uJyxcbiAgICBkYXRhOiAgICBxdWVyeSxcbiAgICBoZWFkZXJzOiB0aGlzLl9nZXRDbGllbnRJbmZvSGVhZGVyKCksXG4gICAgY3Jvc3NPcmlnaW46ICFzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSxcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgZW5yaWNoR2V0UHJvZmlsZShyZXNwLCBjYWxsYmFjayk7XG4gICAgfSxcbiAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgaGFuZGxlUmVxdWVzdEVycm9yKGVyciwgY2FsbGJhY2spO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiAqIE9wZW4gYSBwb3B1cCwgc3RvcmUgdGhlIHdpbnJlZiBpbiB0aGUgaW5zdGFuY2UgYW5kIHJldHVybiBpdC5cbiAqXG4gKiBXZSB1c3VhbGx5IG5lZWQgdG8gY2FsbCB0aGlzIG1ldGhvZCBiZWZvcmUgYW55IGFqYXggdHJhbnNhY3Rpb24gaW4gb3JkZXJcbiAqIHRvIHByZXZlbnQgdGhlIGJyb3dzZXIgdG8gYmxvY2sgdGhlIHBvcHVwLlxuICpcbiAqIEBwYXJhbSAge1t0eXBlXX0gICBvcHRpb25zICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwcml2YXRlXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLl9idWlsZFBvcHVwV2luZG93ID0gZnVuY3Rpb24gKG9wdGlvbnMsIHVybCkge1xuICBpZiAodGhpcy5fY3VycmVudF9wb3B1cCAmJiAhdGhpcy5fY3VycmVudF9wb3B1cC5jbG9zZWQpIHtcbiAgICByZXR1cm4gdGhpcy5fY3VycmVudF9wb3B1cDtcbiAgfVxuXG4gIHVybCA9IHVybCB8fCAnYWJvdXQ6YmxhbmsnXG5cbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdmFyIGRlZmF1bHRzID0geyB3aWR0aDogNTAwLCBoZWlnaHQ6IDYwMCB9O1xuICB2YXIgb3B0cyA9IHh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zLnBvcHVwT3B0aW9ucyB8fCB7fSk7XG4gIHZhciBwb3B1cE9wdGlvbnMgPSBzdHJpbmdpZnlQb3B1cFNldHRpbmdzKG9wdHMpO1xuXG4gIHRoaXMuX2N1cnJlbnRfcG9wdXAgPSB3aW5kb3cub3Blbih1cmwsICdhdXRoMF9zaWdudXBfcG9wdXAnLCBwb3B1cE9wdGlvbnMpO1xuXG4gIGlmICghdGhpcy5fY3VycmVudF9wb3B1cCkge1xuICAgIHRocm93IG5ldyBFcnJvcignUG9wdXAgd2luZG93IGNhbm5vdCBub3QgYmVlbiBjcmVhdGVkLiBEaXNhYmxlIHBvcHVwIGJsb2NrZXIgb3IgbWFrZSBzdXJlIHRvIGNhbGwgQXV0aDAgbG9naW4gb3Igc2luZ3VwIG9uIGFuIFVJIGV2ZW50LicpO1xuICB9XG5cbiAgdGhpcy5fY3VycmVudF9wb3B1cC5raWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgICBfdGhpcy5fY3VycmVudF9wb3B1cCA9IG51bGw7XG4gIH07XG5cbiAgcmV0dXJuIHRoaXMuX2N1cnJlbnRfcG9wdXA7XG59O1xuXG4vKipcbiAqIExvZ2luIHdpdGggVXNlcm5hbWUgYW5kIFBhc3N3b3JkXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAbWV0aG9kIGxvZ2luV2l0aFVzZXJuYW1lUGFzc3dvcmRcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUubG9naW5XaXRoVXNlcm5hbWVQYXNzd29yZCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuICAvLyBYWFg6IFdhcm5pbmc6IFRoaXMgY2hlY2sgaXMgd2hldGhlciBjYWxsYmFjayBhcmd1bWVudHMgYXJlXG4gIC8vIGZuKGVycikgY2FzZSBjYWxsYmFjay5sZW5ndGggPT09IDEgKGEgcmVkaXJlY3Qgc2hvdWxkIGJlIHBlcmZvcm1lZCkgdnMuXG4gIC8vIGZuKGVyciwgcHJvZmlsZSwgaWRfdG9rZW4sIGFjY2Vzc190b2tlbiwgc3RhdGUpIGNhbGxiYWNrLmxlbmd0aCA+IDEgKG5vXG4gIC8vIHJlZGlyZWN0IHNob3VsZCBiZSBwZXJmb3JtZWQpXG4gIC8vXG4gIC8vIE5vdGU6IFBob25lZ2FwL0NvcmRvdmE6XG4gIC8vIEFzIHRoZSBwb3B1cCBpcyBsYXVuY2hlZCB1c2luZyB0aGUgSW5BcHBCcm93c2VyIHBsdWdpbiB0aGUgU1NPIGNvb2tpZSB3aWxsXG4gIC8vIGJlIHNldCBvbiB0aGUgSW5BcHBCcm93c2VyIGJyb3dzZXIuIFRoYXQncyB3aHkgdGhlIGJyb3dzZXIgd2hlcmUgdGhlIGFwcCBydW5zXG4gIC8vIHdvbid0IGdldCB0aGUgc3NvIGNvb2tpZS4gVGhlcmVmb3JlLCB3ZSBkb24ndCBhbGxvdyB1c2VybmFtZSBwYXNzd29yZCB1c2luZ1xuICAvLyBwb3B1cCB3aXRoIHNzbzogdHJ1ZSBpbiBDb3Jkb3ZhL1Bob25lZ2FwIGFuZCB3ZSBkZWZhdWx0IHRvIHJlc291cmNlIG93bmVyIGF1dGguXG4gIGlmIChjYWxsYmFjayAmJiBjYWxsYmFjay5sZW5ndGggPiAxICYmICghb3B0aW9ucy5zc28gfHwgd2luZG93LmNvcmRvdmEpKSB7XG4gICAgcmV0dXJuIHRoaXMubG9naW5XaXRoUmVzb3VyY2VPd25lcihvcHRpb25zLCBjYWxsYmFjayk7XG4gIH1cblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuICB2YXIgcG9wdXA7XG5cbiAgLy8gVE9ETyBXZSBzaG91bGQgZGVwcmVjYXRlIHRoaXMsIHJlYWxseSBoYWNreSBhbmQgY29uZnVzZXMgcGVvcGxlLlxuICBpZiAob3B0aW9ucy5wb3B1cCAgJiYgIXRoaXMuX2dldENhbGxiYWNrT25Mb2NhdGlvbkhhc2gob3B0aW9ucykpIHtcbiAgICBwb3B1cCA9IHRoaXMuX2J1aWxkUG9wdXBXaW5kb3cob3B0aW9ucyk7XG4gIH1cblxuICAvLyBXaGVuIGEgY2FsbGJhY2sgd2l0aCBtb3JlIHRoYW4gb25lIGFyZ3VtZW50IGlzIHNwZWNpZmllZCBhbmQgc3NvOiB0cnVlIHRoZW5cbiAgLy8gd2Ugb3BlbiBhIHBvcHVwIGFuZCBkbyBhdXRoZW50aWNhdGlvbiB0aGVyZS5cbiAgaWYgKGNhbGxiYWNrICYmIGNhbGxiYWNrLmxlbmd0aCA+IDEgJiYgb3B0aW9ucy5zc28gKSB7XG4gICAgcmV0dXJuIHRoaXMubG9naW5XaXRoVXNlcm5hbWVQYXNzd29yZEFuZFNTTyhvcHRpb25zLCBjYWxsYmFjayk7XG4gIH1cblxuICB2YXIgcXVlcnkgPSB4dGVuZChcbiAgICB0aGlzLl9nZXRNb2RlKG9wdGlvbnMpLFxuICAgIG9wdGlvbnMsXG4gICAge1xuICAgICAgY2xpZW50X2lkOiB0aGlzLl9jbGllbnRJRCxcbiAgICAgIHJlZGlyZWN0X3VyaTogdGhpcy5fZ2V0Q2FsbGJhY2tVUkwob3B0aW9ucyksXG4gICAgICB1c2VybmFtZTogdHJpbShvcHRpb25zLnVzZXJuYW1lIHx8IG9wdGlvbnMuZW1haWwgfHwgJycpLFxuICAgICAgdGVuYW50OiB0aGlzLl9kb21haW4uc3BsaXQoJy4nKVswXVxuICAgIH0pO1xuXG4gIHRoaXMuX2NvbmZpZ3VyZU9mZmxpbmVNb2RlKHF1ZXJ5KTtcblxuICB2YXIgcHJvdG9jb2wgPSAnaHR0cHM6JztcbiAgdmFyIGRvbWFpbiA9IHRoaXMuX2RvbWFpbjtcbiAgdmFyIGVuZHBvaW50ID0gJy91c2VybmFtZXBhc3N3b3JkL2xvZ2luJztcbiAgdmFyIHVybCA9IGpvaW5VcmwocHJvdG9jb2wsIGRvbWFpbiwgZW5kcG9pbnQpO1xuXG4gIGlmICh0aGlzLl91c2VKU09OUCkge1xuICAgIHJldHVybiBqc29ucCh1cmwgKyAnPycgKyBxcy5zdHJpbmdpZnkocXVlcnkpLCBqc29ucE9wdHMsIGZ1bmN0aW9uIChlcnIsIHJlc3ApIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgaWYgKHBvcHVwICYmIHBvcHVwLmtpbGwpIHsgcG9wdXAua2lsbCgpOyB9XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgfVxuICAgICAgaWYoJ2Vycm9yJyBpbiByZXNwKSB7XG4gICAgICAgIGlmIChwb3B1cCAmJiBwb3B1cC5raWxsKSB7IHBvcHVwLmtpbGwoKTsgfVxuICAgICAgICB2YXIgZXJyb3IgPSBuZXcgTG9naW5FcnJvcihyZXNwLnN0YXR1cywgcmVzcC5lcnJvcik7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XG4gICAgICB9XG4gICAgICBfdGhpcy5fcmVuZGVyQW5kU3VibWl0V1NGZWRGb3JtKG9wdGlvbnMsIHJlc3AuZm9ybSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXR1cm5fZXJyb3IgKGVycm9yKSB7XG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpO1xuICAgIH1cbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuXG4gIHJlcXdlc3Qoe1xuICAgIHVybDogICAgIHNhbWVfb3JpZ2luKHByb3RvY29sLCBkb21haW4pID8gZW5kcG9pbnQgOiB1cmwsXG4gICAgbWV0aG9kOiAgJ3Bvc3QnLFxuICAgIHR5cGU6ICAgICdodG1sJyxcbiAgICBkYXRhOiAgICBxdWVyeSxcbiAgICBoZWFkZXJzOiB0aGlzLl9nZXRDbGllbnRJbmZvSGVhZGVyKCksXG4gICAgY3Jvc3NPcmlnaW46ICFzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSxcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgX3RoaXMuX3JlbmRlckFuZFN1Ym1pdFdTRmVkRm9ybShvcHRpb25zLCByZXNwKTtcbiAgICB9LFxuICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAocG9wdXAgJiYgcG9wdXAua2lsbCkge1xuICAgICAgICBwb3B1cC5raWxsKCk7XG4gICAgICB9XG4gICAgICBoYW5kbGVSZXF1ZXN0RXJyb3IoZXJyLCByZXR1cm5fZXJyb3IpO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiAqIExvZ2luIHdpdGggcGhvbmUgbnVtYmVyIGFuZCBwYXNzY29kZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQG1ldGhvZCBsb2dpbldpdGhQaG9uZU51bWJlclxuICovXG5BdXRoMC5wcm90b3R5cGUubG9naW5XaXRoUGFzc2NvZGUgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcblxuICBpZiAob3B0aW9ucy5lbWFpbCA9PSBudWxsICYmIG9wdGlvbnMucGhvbmVOdW1iZXIgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcignZW1haWwgb3IgcGhvbmVOdW1iZXIgaXMgcmVxdWlyZWQgZm9yIGF1dGhlbnRpY2F0aW9uJyk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5wYXNzY29kZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwYXNzY29kZSBpcyByZXF1aXJlZCBmb3IgYXV0aGVudGljYXRpb24nKTtcbiAgfVxuXG4gIG9wdGlvbnMuY29ubmVjdGlvbiA9IG9wdGlvbnMuZW1haWwgPT0gbnVsbCA/ICdzbXMnIDogJ2VtYWlsJztcblxuICBpZiAoIXRoaXMuX3Nob3VsZFJlZGlyZWN0KSB7XG4gICAgb3B0aW9ucyA9IHh0ZW5kKG9wdGlvbnMsIHtcbiAgICAgIHVzZXJuYW1lOiBvcHRpb25zLmVtYWlsID09IG51bGwgPyBvcHRpb25zLnBob25lTnVtYmVyIDogb3B0aW9ucy5lbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBvcHRpb25zLnBhc3Njb2RlLFxuICAgICAgc3NvOiBmYWxzZVxuICAgIH0pO1xuXG4gICAgZGVsZXRlIG9wdGlvbnMuZW1haWw7XG4gICAgZGVsZXRlIG9wdGlvbnMucGhvbmVOdW1iZXI7XG4gICAgZGVsZXRlIG9wdGlvbnMucGFzc2NvZGU7XG5cbiAgICByZXR1cm4gdGhpcy5sb2dpbldpdGhSZXNvdXJjZU93bmVyKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIHZhciB2ZXJpZnlPcHRpb25zID0ge2Nvbm5lY3Rpb246IG9wdGlvbnMuY29ubmVjdGlvbn07XG5cbiAgaWYgKG9wdGlvbnMucGhvbmVOdW1iZXIpIHtcbiAgICBvcHRpb25zLnBob25lX251bWJlciA9IG9wdGlvbnMucGhvbmVOdW1iZXI7XG4gICAgZGVsZXRlIG9wdGlvbnMucGhvbmVOdW1iZXI7XG5cbiAgICB2ZXJpZnlPcHRpb25zLnBob25lX251bWJlciA9IG9wdGlvbnMucGhvbmVfbnVtYmVyO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuZW1haWwpIHtcbiAgICB2ZXJpZnlPcHRpb25zLmVtYWlsID0gb3B0aW9ucy5lbWFpbDtcbiAgfVxuXG4gIG9wdGlvbnMudmVyaWZpY2F0aW9uX2NvZGUgPSBvcHRpb25zLnBhc3Njb2RlO1xuICBkZWxldGUgb3B0aW9ucy5wYXNzY29kZTtcblxuICB2ZXJpZnlPcHRpb25zLnZlcmlmaWNhdGlvbl9jb2RlID0gb3B0aW9ucy52ZXJpZmljYXRpb25fY29kZTtcblxuICB2YXIgX3RoaXMgPSB0aGlzO1xuICB0aGlzLl92ZXJpZnkodmVyaWZ5T3B0aW9ucywgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XG4gICAgfVxuICAgIF90aGlzLl92ZXJpZnlfcmVkaXJlY3Qob3B0aW9ucyk7XG4gIH0pO1xufTtcblxuQXV0aDAucHJvdG90eXBlLl92ZXJpZnkgPSBmdW5jdGlvbihvcHRpb25zLCBjYWxsYmFjaykge1xuICB2YXIgcHJvdG9jb2wgPSAnaHR0cHM6JztcbiAgdmFyIGRvbWFpbiA9IHRoaXMuX2RvbWFpbjtcbiAgdmFyIGVuZHBvaW50ID0gJy9wYXNzd29yZGxlc3MvdmVyaWZ5JztcbiAgdmFyIHVybCA9IGpvaW5VcmwocHJvdG9jb2wsIGRvbWFpbiwgZW5kcG9pbnQpO1xuXG4gIHZhciBkYXRhID0gb3B0aW9ucztcblxuICBpZiAodGhpcy5fdXNlSlNPTlApIHtcbiAgICBpZiAodGhpcy5fc2VuZENsaWVudEluZm8pIHtcbiAgICAgIGRhdGFbJ2F1dGgwQ2xpZW50J10gPSB0aGlzLl9nZXRDbGllbnRJbmZvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGpzb25wKHVybCArICc/JyArIHFzLnN0cmluZ2lmeShkYXRhKSwganNvbnBPcHRzLCBmdW5jdGlvbiAoZXJyLCByZXNwKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoMCArICc6ICcgKyBlcnIudG9TdHJpbmcoKSkpO1xuICAgICAgfVxuICAgICAgLy8gLyoqLyB0eXBlb2YgX19hdXRoMGpwMCA9PT0gJ2Z1bmN0aW9uJyAmJiBfX2F1dGgwanAwKHtcInN0YXR1c1wiOjQwMH0pO1xuICAgICAgcmV0dXJuIHJlc3Auc3RhdHVzID09PSAyMDAgPyBjYWxsYmFjayhudWxsLCB0cnVlKSA6IGNhbGxiYWNrKHtzdGF0dXM6IHJlc3Auc3RhdHVzfSk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gcmVxd2VzdCh7XG4gICAgdXJsOiAgICAgICAgICBzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSA/IGVuZHBvaW50IDogdXJsLFxuICAgIG1ldGhvZDogICAgICAgJ3Bvc3QnLFxuICAgIGhlYWRlcnM6ICAgICAgdGhpcy5fZ2V0Q2xpZW50SW5mb0hlYWRlcigpLFxuICAgIGNyb3NzT3JpZ2luOiAgIXNhbWVfb3JpZ2luKHByb3RvY29sLCBkb21haW4pLFxuICAgIGRhdGE6ICAgICAgICAgZGF0YVxuICB9KVxuICAuZmFpbChmdW5jdGlvbiAoZXJyKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNhbGxiYWNrKEpTT04ucGFyc2UoZXJyLnJlc3BvbnNlVGV4dCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcihlcnIuc3RhdHVzICsgJygnICsgZXJyLnN0YXR1c1RleHQgKyAnKTogJyArIGVyci5yZXNwb25zZVRleHQpO1xuICAgICAgZXJyb3Iuc3RhdHVzQ29kZSA9IGVyci5zdGF0dXM7XG4gICAgICBlcnJvci5lcnJvciA9IGVyci5zdGF0dXNUZXh0O1xuICAgICAgZXJyb3IubWVzc2FnZSA9IGVyci5yZXNwb25zZVRleHQ7XG4gICAgICBjYWxsYmFjayhlcnJvcik7XG4gICAgfVxuICB9KVxuICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0KTtcbiAgfSk7XG59XG5cbkF1dGgwLnByb3RvdHlwZS5fdmVyaWZ5X3JlZGlyZWN0ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgcXMgPSBbXG4gICAgdGhpcy5fZ2V0TW9kZShvcHRpb25zKSxcbiAgICBvcHRpb25zLFxuICAgIHtcbiAgICAgIGNsaWVudF9pZDogdGhpcy5fY2xpZW50SUQsXG4gICAgICByZWRpcmVjdF91cmk6IHRoaXMuX2dldENhbGxiYWNrVVJMKG9wdGlvbnMpXG4gICAgfVxuICBdO1xuXG4gIHZhciBxdWVyeSA9IHRoaXMuX2J1aWxkQXV0aG9yaXplUXVlcnlTdHJpbmcocXMpO1xuICB2YXIgdXJsID0gam9pblVybCgnaHR0cHM6JywgdGhpcy5fZG9tYWluLCAnL3Bhc3N3b3JkbGVzcy92ZXJpZnlfcmVkaXJlY3Q/JyArIHF1ZXJ5KTtcblxuICB0aGlzLl9yZWRpcmVjdCh1cmwpO1xufTtcblxuLy8gVE9ETyBEb2N1bWVudCBtZVxuQXV0aDAucHJvdG90eXBlLnJlbmV3SWRUb2tlbiA9IGZ1bmN0aW9uIChpZF90b2tlbiwgY2FsbGJhY2spIHtcbiAgdGhpcy5nZXREZWxlZ2F0aW9uVG9rZW4oe1xuICAgIGlkX3Rva2VuOiBpZF90b2tlbixcbiAgICBzY29wZTogJ3Bhc3N0aHJvdWdoJyxcbiAgICBhcGk6ICdhdXRoMCdcbiAgfSwgY2FsbGJhY2spO1xufTtcblxuLy8gVE9ETyBEb2N1bWVudCBtZVxuQXV0aDAucHJvdG90eXBlLnJlZnJlc2hUb2tlbiA9IGZ1bmN0aW9uIChyZWZyZXNoX3Rva2VuLCBjYWxsYmFjaykge1xuICB0aGlzLmdldERlbGVnYXRpb25Ub2tlbih7XG4gICAgcmVmcmVzaF90b2tlbjogcmVmcmVzaF90b2tlbixcbiAgICBzY29wZTogJ3Bhc3N0aHJvdWdoJyxcbiAgICBhcGk6ICdhdXRoMCdcbiAgfSwgY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBHZXQgZGVsZWdhdGlvbiB0b2tlbiBmb3IgY2VydGFpbiBhZGRvbiBvciBjZXJ0YWluIG90aGVyIGNsaWVudElkXG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgYXV0aDAuZ2V0RGVsZWdhdGlvblRva2VuKHtcbiAqICAgICAgaWRfdG9rZW46ICAgJzx1c2VyLWlkLXRva2VuPicsXG4gKiAgICAgIHRhcmdldDogICAgICc8YXBwLWNsaWVudC1pZD4nXG4gKiAgICAgIGFwaV90eXBlOiAnYXV0aDAnXG4gKiAgICAgfSwgZnVuY3Rpb24gKGVyciwgZGVsZWdhdGlvblJlc3VsdCkge1xuICogICAgICAgIGlmIChlcnIpIHJldHVybiBjb25zb2xlLmxvZyhlcnIubWVzc2FnZSk7XG4gKiAgICAgICAgLy8gRG8gc3R1ZmYgd2l0aCBkZWxlZ2F0aW9uIHRva2VuXG4gKiAgICAgICAgZXhwZWN0KGRlbGVnYXRpb25SZXN1bHQuaWRfdG9rZW4pLnRvLmV4aXN0O1xuICogICAgICAgIGV4cGVjdChkZWxlZ2F0aW9uUmVzdWx0LnRva2VuX3R5cGUpLnRvLmVxbCgnQmVhcmVyJyk7XG4gKiAgICAgICAgZXhwZWN0KGRlbGVnYXRpb25SZXN1bHQuZXhwaXJlc19pbikudG8uZXFsKDM2MDAwKTtcbiAqICAgICB9KTtcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgLy8gZ2V0IGEgZGVsZWdhdGlvbiB0b2tlbiBmcm9tIGEgRmlyZWJhc2UgQVBJIEFwcFxuICAqICAgICBhdXRoMC5nZXREZWxlZ2F0aW9uVG9rZW4oe1xuICogICAgICBpZF90b2tlbjogICAnPHVzZXItaWQtdG9rZW4+JyxcbiAqICAgICAgdGFyZ2V0OiAgICAgJzxhcHAtY2xpZW50LWlkPidcbiAqICAgICAgYXBpX3R5cGU6ICdmaXJlYmFzZSdcbiAqICAgICB9LCBmdW5jdGlvbiAoZXJyLCBkZWxlZ2F0aW9uUmVzdWx0KSB7XG4gKiAgICAgIC8vIFVzZSB5b3VyIGZpcmViYXNlIHRva2VuIGhlcmVcbiAqICAgIH0pO1xuICpcbiAqIEBtZXRob2QgZ2V0RGVsZWdhdGlvblRva2VuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge1N0cmluZ30gW2lkX3Rva2VuXVxuICogQHBhcmFtIHtTdHJpbmd9IFt0YXJnZXRdXG4gKiBAcGFyYW0ge1N0cmluZ30gW2FwaV90eXBlXVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXVxuICovXG5BdXRoMC5wcm90b3R5cGUuZ2V0RGVsZWdhdGlvblRva2VuID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIGlmICghb3B0aW9ucy5pZF90b2tlbiAmJiAhb3B0aW9ucy5yZWZyZXNoX3Rva2VuICkge1xuICAgIHRocm93IG5ldyBFcnJvcignWW91IG11c3Qgc2VuZCBlaXRoZXIgYW4gaWRfdG9rZW4gb3IgYSByZWZyZXNoX3Rva2VuIHRvIGdldCBhIGRlbGVnYXRpb24gdG9rZW4uJyk7XG4gIH1cblxuICB2YXIgcXVlcnkgPSB4dGVuZCh7XG4gICAgZ3JhbnRfdHlwZTogJ3VybjppZXRmOnBhcmFtczpvYXV0aDpncmFudC10eXBlOmp3dC1iZWFyZXInLFxuICAgIGNsaWVudF9pZDogIHRoaXMuX2NsaWVudElELFxuICAgIHRhcmdldDogb3B0aW9ucy50YXJnZXRDbGllbnRJZCB8fCB0aGlzLl9jbGllbnRJRCxcbiAgICBhcGlfdHlwZTogb3B0aW9ucy5hcGlcbiAgfSwgb3B0aW9ucyk7XG5cbiAgZGVsZXRlIHF1ZXJ5Lmhhc093blByb3BlcnR5O1xuICBkZWxldGUgcXVlcnkudGFyZ2V0Q2xpZW50SWQ7XG4gIGRlbGV0ZSBxdWVyeS5hcGk7XG5cbiAgdmFyIHByb3RvY29sID0gJ2h0dHBzOic7XG4gIHZhciBkb21haW4gPSB0aGlzLl9kb21haW47XG4gIHZhciBlbmRwb2ludCA9ICcvZGVsZWdhdGlvbic7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICBpZiAodGhpcy5fdXNlSlNPTlApIHtcbiAgICByZXR1cm4ganNvbnAodXJsICsgJz8nICsgcXMuc3RyaW5naWZ5KHF1ZXJ5KSwganNvbnBPcHRzLCBmdW5jdGlvbiAoZXJyLCByZXNwKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgfVxuICAgICAgaWYoJ2Vycm9yJyBpbiByZXNwKSB7XG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBMb2dpbkVycm9yKHJlc3Auc3RhdHVzLCByZXNwLmVycm9yX2Rlc2NyaXB0aW9uIHx8IHJlc3AuZXJyb3IpO1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpO1xuICAgICAgfVxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcCk7XG4gICAgfSk7XG4gIH1cblxuICByZXF3ZXN0KHtcbiAgICB1cmw6ICAgICBzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSA/IGVuZHBvaW50IDogdXJsLFxuICAgIG1ldGhvZDogICdwb3N0JyxcbiAgICB0eXBlOiAgICAnanNvbicsXG4gICAgZGF0YTogICAgcXVlcnksXG4gICAgY3Jvc3NPcmlnaW46ICFzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSxcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcCk7XG4gICAgfSxcbiAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY2FsbGJhY2soSlNPTi5wYXJzZShlcnIucmVzcG9uc2VUZXh0KSk7XG4gICAgICB9XG4gICAgICBjYXRjaCAoZSkge1xuICAgICAgICB2YXIgZXIgPSBlcnI7XG4gICAgICAgIHZhciBpc0FmZmVjdGVkSUVWZXJzaW9uID0gaXNJbnRlcm5ldEV4cGxvcmVyKCkgPT09IDEwIHx8IGlzSW50ZXJuZXRFeHBsb3JlcigpID09PSAxMTtcbiAgICAgICAgdmFyIHplcm9TdGF0dXMgPSAoIWVyLnN0YXR1cyB8fCBlci5zdGF0dXMgPT09IDApO1xuXG4gICAgICAgIC8vIFJlcXVlc3QgZmFpbGVkIGJlY2F1c2Ugd2UgYXJlIG9mZmxpbmUuXG4gICAgICAgIC8vIFNlZTogaHR0cDovL2Nhbml1c2UuY29tLyNzZWFyY2g9bmF2aWdhdG9yLm9uTGluZVxuICAgICAgICBpZiAoemVyb1N0YXR1cyAmJiAhd2luZG93Lm5hdmlnYXRvci5vbkxpbmUpIHtcbiAgICAgICAgICBlciA9IHt9O1xuICAgICAgICAgIGVyLnN0YXR1cyA9IDA7XG4gICAgICAgICAgZXIucmVzcG9uc2VUZXh0ID0ge1xuICAgICAgICAgICAgY29kZTogJ29mZmxpbmUnXG4gICAgICAgICAgfTtcbiAgICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yMzIyOTcyMy9pZS0xMC0xMS1jb3JzLXN0YXR1cy0wXG4gICAgICAgIC8vIFhYWCBJRTEwIHdoZW4gYSByZXF1ZXN0IGZhaWxzIGluIENPUlMgcmV0dXJucyBzdGF0dXMgY29kZSAwXG4gICAgICAgIC8vIFhYWCBUaGlzIGlzIG5vdCBoYW5kbGVkIGJ5IGhhbmRsZVJlcXVlc3RFcnJvciBhcyB0aGUgZXJyb3JzIGFyZSBkaWZmZXJlbnRcbiAgICAgICAgfSBlbHNlIGlmICh6ZXJvU3RhdHVzICYmIGlzQWZmZWN0ZWRJRVZlcnNpb24pIHtcbiAgICAgICAgICBlciA9IHt9O1xuICAgICAgICAgIGVyLnN0YXR1cyA9IDQwMTtcbiAgICAgICAgICBlci5yZXNwb25zZVRleHQgPSB7XG4gICAgICAgICAgICBjb2RlOiAnaW52YWxpZF9vcGVyYXRpb24nXG4gICAgICAgICAgfTtcbiAgICAgICAgLy8gSWYgbm90IElFMTAvMTEgYW5kIG5vdCBvZmZsaW5lIGl0IG1lYW5zIHRoYXQgQXV0aDAgaG9zdCBpcyB1bnJlYWNoYWJsZTpcbiAgICAgICAgLy8gQ29ubmVjdGlvbiBUaW1lb3V0IG9yIENvbm5lY3Rpb24gUmVmdXNlZC5cbiAgICAgICAgfSBlbHNlIGlmICh6ZXJvU3RhdHVzKSB7XG4gICAgICAgICAgZXIgPSB7fTtcbiAgICAgICAgICBlci5zdGF0dXMgPSAwO1xuICAgICAgICAgIGVyLnJlc3BvbnNlVGV4dCA9IHtcbiAgICAgICAgICAgIGNvZGU6ICdjb25uZWN0aW9uX3JlZnVzZWRfdGltZW91dCdcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVyLnJlc3BvbnNlVGV4dCA9IGVycjtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhuZXcgTG9naW5FcnJvcihlci5zdGF0dXMsIGVyLnJlc3BvbnNlVGV4dCkpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiAqIFRyaWdnZXIgbG9nb3V0IHJlZGlyZWN0IHdpdGhcbiAqIHBhcmFtcyBmcm9tIGBxdWVyeWAgb2JqZWN0XG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgYXV0aDAubG9nb3V0KCk7XG4gKiAgICAgLy8gcmVkaXJlY3RzIHRvIC0+ICdodHRwczovL3lvdXJhcHAuYXV0aDAuY29tL2xvZ291dCdcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICBhdXRoMC5sb2dvdXQoe3JldHVyblRvOiAnaHR0cDovL2xvZ291dCd9KTtcbiAqICAgICAvLyByZWRpcmVjdHMgdG8gLT4gJ2h0dHBzOi8veW91cmFwcC5hdXRoMC5jb20vbG9nb3V0P3JldHVyblRvPWh0dHA6Ly9sb2dvdXQnXG4gKlxuICogQG1ldGhvZCBsb2dvdXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBxdWVyeVxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5sb2dvdXQgPSBmdW5jdGlvbiAocXVlcnkpIHtcbiAgdmFyIHVybCA9IGpvaW5VcmwoJ2h0dHBzOicsIHRoaXMuX2RvbWFpbiwgJy9sb2dvdXQnKTtcbiAgaWYgKHF1ZXJ5KSB7XG4gICAgdXJsICs9ICc/JyArIHFzLnN0cmluZ2lmeShxdWVyeSk7XG4gIH1cbiAgdGhpcy5fcmVkaXJlY3QodXJsKTtcbn07XG5cbi8qKlxuICogR2V0IHNpbmdsZSBzaWduIG9uIERhdGFcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICBhdXRoMC5nZXRTU09EYXRhKGZ1bmN0aW9uIChlcnIsIHNzb0RhdGEpIHtcbiAqICAgICAgIGlmIChlcnIpIHJldHVybiBjb25zb2xlLmxvZyhlcnIubWVzc2FnZSk7XG4gKiAgICAgICBleHBlY3Qoc3NvRGF0YS5zc28pLnRvLmV4aXN0O1xuICogICAgIH0pO1xuICpcbiAqIEBleGFtcGxlXG4gKlxuICogICAgIGF1dGgwLmdldFNTT0RhdGEoZmFsc2UsIGZuKTtcbiAqXG4gKiBAbWV0aG9kIGdldFNTT0RhdGFcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gd2l0aEFjdGl2ZURpcmVjdG9yaWVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5cbkF1dGgwLnByb3RvdHlwZS5nZXRTU09EYXRhID0gZnVuY3Rpb24gKHdpdGhBY3RpdmVEaXJlY3RvcmllcywgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiB3aXRoQWN0aXZlRGlyZWN0b3JpZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYWxsYmFjayA9IHdpdGhBY3RpdmVEaXJlY3RvcmllcztcbiAgICB3aXRoQWN0aXZlRGlyZWN0b3JpZXMgPSBmYWxzZTtcbiAgfVxuXG4gIHZhciB1cmwgPSBqb2luVXJsKCdodHRwczonLCB0aGlzLl9kb21haW4sICcvdXNlci9zc29kYXRhJyk7XG5cbiAgaWYgKHdpdGhBY3RpdmVEaXJlY3Rvcmllcykge1xuICAgIHVybCArPSAnPycgKyBxcy5zdHJpbmdpZnkoe2xkYXBzOiAxLCBjbGllbnRfaWQ6IHRoaXMuX2NsaWVudElEfSk7XG4gIH1cblxuICAvLyBvdmVycmlkZSB0aW1lb3V0XG4gIHZhciBqc29ucE9wdGlvbnMgPSB4dGVuZCh7fSwganNvbnBPcHRzLCB7IHRpbWVvdXQ6IDMwMDAgfSk7XG5cbiAgcmV0dXJuIGpzb25wKHVybCwganNvbnBPcHRpb25zLCBmdW5jdGlvbiAoZXJyLCByZXNwKSB7XG4gICAgY2FsbGJhY2sobnVsbCwgZXJyID8ge3NzbzpmYWxzZX0gOiByZXNwKTsgLy8gQWx3YXlzIHJldHVybiBPSywgcmVnYXJkbGVzcyBvZiBhbnkgZXJyb3JzXG4gIH0pO1xufTtcblxuLyoqXG4gKiBHZXQgYWxsIGNvbmZpZ3VyZWQgY29ubmVjdGlvbnMgZm9yIGEgY2xpZW50XG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgYXV0aDAuZ2V0Q29ubmVjdGlvbnMoZnVuY3Rpb24gKGVyciwgY29ubnMpIHtcbiAqICAgICAgIGlmIChlcnIpIHJldHVybiBjb25zb2xlLmxvZyhlcnIubWVzc2FnZSk7XG4gKiAgICAgICBleHBlY3QoY29ubnMubGVuZ3RoKS50by5iZS5hYm92ZSgwKTtcbiAqICAgICAgIGV4cGVjdChjb25uc1swXS5uYW1lKS50by5lcWwoJ0FwcHJlbmRhLmNvbScpO1xuICogICAgICAgZXhwZWN0KGNvbm5zWzBdLnN0cmF0ZWd5KS50by5lcWwoJ2FkZnMnKTtcbiAqICAgICAgIGV4cGVjdChjb25uc1swXS5zdGF0dXMpLnRvLmVxbChmYWxzZSk7XG4gKiAgICAgICBleHBlY3QoY29ubnNbMF0uZG9tYWluKS50by5lcWwoJ0FwcHJlbmRhLmNvbScpO1xuICogICAgICAgZXhwZWN0KGNvbm5zWzBdLmRvbWFpbl9hbGlhc2VzKS50by5lcWwoWydBcHByZW5kYS5jb20nLCAnZm9vLmNvbScsICdiYXIuY29tJ10pO1xuICogICAgIH0pO1xuICpcbiAqIEBtZXRob2QgZ2V0Q29ubmVjdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKi9cbi8vIFhYWCBXZSBtYXkgY2hhbmdlIHRoZSB3YXkgdGhpcyBtZXRob2Qgd29ya3MgaW4gdGhlIGZ1dHVyZSB0byB1c2UgY2xpZW50J3MgczMgZmlsZS5cblxuQXV0aDAucHJvdG90eXBlLmdldENvbm5lY3Rpb25zID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIHJldHVybiBqc29ucCgnaHR0cHM6Ly8nICsgdGhpcy5fZG9tYWluICsgJy9wdWJsaWMvYXBpLycgKyB0aGlzLl9jbGllbnRJRCArICcvY29ubmVjdGlvbnMnLCBqc29ucE9wdHMsIGNhbGxiYWNrKTtcbn07XG5cbi8qKlxuICogU2VuZCBlbWFpbCBvciBTTVMgdG8gZG8gcGFzc3dvcmRsZXNzIGF1dGhlbnRpY2F0aW9uXG4gKlxuICogQGV4YW1wbGVcbiAqICAgICAvLyBUbyBzZW5kIGFuIGVtYWlsXG4gKiAgICAgYXV0aDAuc3RhcnRQYXNzd29yZGxlc3Moe2VtYWlsOiAnZm9vQGJhci5jb20nfSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XG4gKiAgICAgICBpZiAoZXJyKSByZXR1cm4gY29uc29sZS5sb2coZXJyLmVycm9yX2Rlc2NyaXB0aW9uKTtcbiAqICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gKiAgICAgfSk7XG4gKlxuICogQGV4YW1wbGVcbiAqICAgICAvLyBUbyBzZW5kIGEgU01TXG4gKiAgICAgYXV0aDAuc3RhcnRQYXNzd29yZGxlc3Moe3Bob25lTnVtYmVyOiAnKzE0MjUxMTEyMjIyJ30sIGZ1bmN0aW9uIChlcnIsIHJlc3VsdCkge1xuICogICAgICAgaWYgKGVycikgcmV0dXJuIGNvbnNvbGUubG9nKGVyci5lcnJvcl9kZXNjcmlwdGlvbik7XG4gKiAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICogICAgIH0pO1xuICpcbiAqIEBtZXRob2Qgc3RhcnRQYXNzd29yZGxlc3NcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5cbkF1dGgwLnByb3RvdHlwZS5zdGFydFBhc3N3b3JkbGVzcyA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuICBpZiAoJ29iamVjdCcgIT09IHR5cGVvZiBvcHRpb25zKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbiBvcHRpb25zIG9iamVjdCBpcyByZXF1aXJlZCcpO1xuICB9XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgY2FsbGJhY2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgY2FsbGJhY2sgZnVuY3Rpb24gaXMgcmVxdWlyZWQnKTtcbiAgfVxuICBpZiAoIW9wdGlvbnMuZW1haWwgJiYgIW9wdGlvbnMucGhvbmVOdW1iZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FuIGBlbWFpbGAgb3IgYSBgcGhvbmVOdW1iZXJgIGlzIHJlcXVpcmVkLicpO1xuICB9XG5cbiAgdmFyIHByb3RvY29sID0gJ2h0dHBzOic7XG4gIHZhciBkb21haW4gPSB0aGlzLl9kb21haW47XG4gIHZhciBlbmRwb2ludCA9ICcvcGFzc3dvcmRsZXNzL3N0YXJ0JztcbiAgdmFyIHVybCA9IGpvaW5VcmwocHJvdG9jb2wsIGRvbWFpbiwgZW5kcG9pbnQpO1xuXG4gIHZhciBkYXRhID0ge2NsaWVudF9pZDogdGhpcy5fY2xpZW50SUR9O1xuICBpZiAob3B0aW9ucy5lbWFpbCkge1xuICAgIGRhdGEuZW1haWwgPSBvcHRpb25zLmVtYWlsO1xuICAgIGRhdGEuY29ubmVjdGlvbiA9ICdlbWFpbCc7XG4gICAgaWYgKG9wdGlvbnMuYXV0aFBhcmFtcykge1xuICAgICAgZGF0YS5hdXRoUGFyYW1zID0gb3B0aW9ucy5hdXRoUGFyYW1zO1xuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy5zZW5kIHx8IG9wdGlvbnMuc2VuZCA9PT0gXCJsaW5rXCIpIHtcbiAgICAgIGlmICghZGF0YS5hdXRoUGFyYW1zKSB7XG4gICAgICAgIGRhdGEuYXV0aFBhcmFtcyA9IHt9O1xuICAgICAgfVxuXG4gICAgICBkYXRhLmF1dGhQYXJhbXMucmVkaXJlY3RfdXJpID0gdGhpcy5fY2FsbGJhY2tVUkw7XG4gICAgICBkYXRhLmF1dGhQYXJhbXMucmVzcG9uc2VfdHlwZSA9IHRoaXMuX3Nob3VsZFJlZGlyZWN0ICYmICF0aGlzLl9jYWxsYmFja09uTG9jYXRpb25IYXNoID9cbiAgICAgICAgXCJjb2RlXCIgOiBcInRva2VuXCI7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuc2VuZCkge1xuICAgICAgZGF0YS5zZW5kID0gb3B0aW9ucy5zZW5kO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBkYXRhLnBob25lX251bWJlciA9IG9wdGlvbnMucGhvbmVOdW1iZXI7XG4gICAgZGF0YS5jb25uZWN0aW9uID0gJ3Ntcyc7XG4gIH1cblxuICBpZiAodGhpcy5fdXNlSlNPTlApIHtcbiAgICBpZiAodGhpcy5fc2VuZENsaWVudEluZm8pIHtcbiAgICAgIGRhdGFbJ2F1dGgwQ2xpZW50J10gPSB0aGlzLl9nZXRDbGllbnRJbmZvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGpzb25wKHVybCArICc/JyArIHFzLnN0cmluZ2lmeShkYXRhKSwganNvbnBPcHRzLCBmdW5jdGlvbiAoZXJyLCByZXNwKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoMCArICc6ICcgKyBlcnIudG9TdHJpbmcoKSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3Auc3RhdHVzID09PSAyMDAgPyBjYWxsYmFjayhudWxsLCB0cnVlKSA6IGNhbGxiYWNrKHJlc3AuZXJyIHx8IHJlc3AuZXJyb3IpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHJlcXdlc3Qoe1xuICAgIHVybDogICAgICAgICAgc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbikgPyBlbmRwb2ludCA6IHVybCxcbiAgICBtZXRob2Q6ICAgICAgICdwb3N0JyxcbiAgICB0eXBlOiAgICAgICAgICdqc29uJyxcbiAgICBoZWFkZXJzOiAgICAgIHRoaXMuX2dldENsaWVudEluZm9IZWFkZXIoKSxcbiAgICBjcm9zc09yaWdpbjogICFzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSxcbiAgICBkYXRhOiAgICAgICAgIGRhdGFcbiAgfSlcbiAgLmZhaWwoZnVuY3Rpb24gKGVycikge1xuICAgIHRyeSB7XG4gICAgICBjYWxsYmFjayhKU09OLnBhcnNlKGVyci5yZXNwb25zZVRleHQpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoZXJyLnN0YXR1cyArICcoJyArIGVyci5zdGF0dXNUZXh0ICsgJyk6ICcgKyBlcnIucmVzcG9uc2VUZXh0KTtcbiAgICAgIGVycm9yLnN0YXR1c0NvZGUgPSBlcnIuc3RhdHVzO1xuICAgICAgZXJyb3IuZXJyb3IgPSBlcnIuc3RhdHVzVGV4dDtcbiAgICAgIGVycm9yLm1lc3NhZ2UgPSBlcnIucmVzcG9uc2VUZXh0O1xuICAgICAgY2FsbGJhY2soZXJyb3IpO1xuICAgIH1cbiAgfSlcbiAgLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdCk7XG4gIH0pO1xufTtcblxuQXV0aDAucHJvdG90eXBlLnJlcXVlc3RNYWdpY0xpbmsgPSBmdW5jdGlvbihhdHRycywgY2IpIHtcbiAgcmV0dXJuIHRoaXMuc3RhcnRQYXNzd29yZGxlc3MoYXR0cnMsIGNiKTtcbn07XG5cbkF1dGgwLnByb3RvdHlwZS5yZXF1ZXN0RW1haWxDb2RlID0gZnVuY3Rpb24oYXR0cnMsIGNiKSB7XG4gIGF0dHJzLnNlbmQgPSBcImNvZGVcIjtcbiAgcmV0dXJuIHRoaXMuc3RhcnRQYXNzd29yZGxlc3MoYXR0cnMsIGNiKTtcbn07XG5cbkF1dGgwLnByb3RvdHlwZS52ZXJpZnlFbWFpbENvZGUgPSBmdW5jdGlvbihhdHRycywgY2IpIHtcbiAgYXR0cnMucGFzc2NvZGUgPSBhdHRycy5jb2RlO1xuICBkZWxldGUgYXR0cnMuY29kZTtcbiAgcmV0dXJuIHRoaXMubG9naW4oYXR0cnMsIGNiKTtcbn07XG5cbkF1dGgwLnByb3RvdHlwZS5yZXF1ZXN0U01TQ29kZSA9IGZ1bmN0aW9uKGF0dHJzLCBjYikge1xuICByZXR1cm4gdGhpcy5zdGFydFBhc3N3b3JkbGVzcyhhdHRycywgY2IpO1xufTtcblxuQXV0aDAucHJvdG90eXBlLnZlcmlmeVNNU0NvZGUgPSBmdW5jdGlvbihhdHRycywgY2IpIHtcbiAgYXR0cnMucGFzc2NvZGUgPSBhdHRycy5jb2RlO1xuICBkZWxldGUgYXR0cnMuY29kZTtcbiAgcmV0dXJuIHRoaXMubG9naW4oYXR0cnMsIGNiKTtcbn07XG5cbi8qKlxuICogRXhwb3NlIGBBdXRoMGAgY29uc3RydWN0b3JcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF1dGgwO1xuIiwiLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBqc29uX3BhcnNlID0gcmVxdWlyZSgnLi9qc29uLXBhcnNlJyk7XG5cbi8qKlxuICogRXhwb3NlIGBMb2dpbkVycm9yYFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gTG9naW5FcnJvcjtcblxuLyoqXG4gKiBDcmVhdGUgYSBgTG9naW5FcnJvcmAgYnkgZXh0ZW5kIG9mIGBFcnJvcmBcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gc3RhdHVzXG4gKiBAcGFyYW0ge1N0cmluZ30gZGV0YWlsc1xuICogQHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIExvZ2luRXJyb3Ioc3RhdHVzLCBkZXRhaWxzKSB7XG4gIHZhciBvYmo7XG5cbiAgaWYgKHR5cGVvZiBkZXRhaWxzID09ICdzdHJpbmcnKSB7XG4gICAgdHJ5IHtcbiAgICAgIG9iaiA9IGpzb25fcGFyc2UoZGV0YWlscyk7XG4gICAgfSBjYXRjaCAoZXIpIHtcbiAgICAgIG9iaiA9IHsgbWVzc2FnZTogZGV0YWlscyB9O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBvYmogPSBkZXRhaWxzIHx8IHsgZGVzY3JpcHRpb246ICdzZXJ2ZXIgZXJyb3InIH07XG4gIH1cblxuICBpZiAoIW9iai5jb2RlKSB7XG4gICAgb2JqLmNvZGUgPSBvYmouZXJyb3I7XG4gIH1cblxuICBpZiAoJ3VuYXV0aG9yaXplZCcgPT09IG9iai5jb2RlKSB7XG4gICAgc3RhdHVzID0gNDAxO1xuICB9XG5cbiAgdmFyIGVyciA9IEVycm9yLmNhbGwodGhpcywgb2JqLmRlc2NyaXB0aW9uIHx8IG9iai5tZXNzYWdlIHx8IG9iai5lcnJvcik7XG5cbiAgZXJyLnN0YXR1cyA9IHN0YXR1cztcbiAgZXJyLm5hbWUgPSBvYmouY29kZTtcbiAgZXJyLmNvZGUgPSBvYmouY29kZTtcbiAgZXJyLmRldGFpbHMgPSBvYmo7XG5cbiAgaWYgKHN0YXR1cyA9PT0gMCkge1xuICAgIGlmICghZXJyLmNvZGUgfHwgZXJyLmNvZGUgIT09ICdvZmZsaW5lJykge1xuICAgICAgZXJyLmNvZGUgPSAnVW5rbm93bic7XG4gICAgICBlcnIubWVzc2FnZSA9ICdVbmtub3duIGVycm9yLic7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGVycjtcbn1cblxuLyoqXG4gKiBFeHRlbmQgYExvZ2luRXJyb3IucHJvdG90eXBlYCB3aXRoIGBFcnJvci5wcm90b3R5cGVgXG4gKiBhbmQgYExvZ2luRXJyb3JgIGFzIGNvbnN0cnVjdG9yXG4gKi9cblxuaWYgKE9iamVjdCAmJiBPYmplY3QuY3JlYXRlKSB7XG4gIExvZ2luRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUsIHtcbiAgICBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogTG9naW5FcnJvciB9XG4gIH0pO1xufVxuIiwiLyoqXG4gKiBFeHBvc2UgYHJlcXVpcmVkYFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZWQ7XG5cbi8qKlxuICogQXNzZXJ0IGBwcm9wYCBhcyByZXF1aXJlbWVudCBvZiBgb2JqYFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7cHJvcH0gcHJvcFxuICogQHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIHJlcXVpcmVkIChvYmosIHByb3ApIHtcbiAgaWYgKCFvYmpbcHJvcF0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IocHJvcCArICcgaXMgcmVxdWlyZWQuJyk7XG4gIH1cbn1cbiIsIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgQmFzZTY0ID0gcmVxdWlyZSgnQmFzZTY0Jyk7XG5cbi8qKlxuICogRXhwb3NlIGBiYXNlNjRfdXJsX2RlY29kZWBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZW5jb2RlOiBlbmNvZGUsXG4gIGRlY29kZTogZGVjb2RlXG59O1xuXG4vKipcbiAqIEVuY29kZSBhIGBiYXNlNjRgIGBlbmNvZGVVUklDb21wb25lbnRgIHN0cmluZ1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmNvZGUoc3RyKSB7XG4gIHJldHVybiBCYXNlNjQuYnRvYShzdHIpXG4gICAgICAucmVwbGFjZSgvXFwrL2csICctJykgLy8gQ29udmVydCAnKycgdG8gJy0nXG4gICAgICAucmVwbGFjZSgvXFwvL2csICdfJykgLy8gQ29udmVydCAnLycgdG8gJ18nXG4gICAgICAucmVwbGFjZSgvPSskLywgJycpOyAvLyBSZW1vdmUgZW5kaW5nICc9J1xufVxuXG4vKipcbiAqIERlY29kZSBhIGBiYXNlNjRgIGBlbmNvZGVVUklDb21wb25lbnRgIHN0cmluZ1xuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJcbiAqIEBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWNvZGUoc3RyKSB7XG4gIC8vIEFkZCByZW1vdmVkIGF0IGVuZCAnPSdcbiAgc3RyICs9IEFycmF5KDUgLSBzdHIubGVuZ3RoICUgNCkuam9pbignPScpO1xuXG4gIHN0ciA9IHN0clxuICAgIC5yZXBsYWNlKC9cXC0vZywgJysnKSAvLyBDb252ZXJ0ICctJyB0byAnKydcbiAgICAucmVwbGFjZSgvXFxfL2csICcvJyk7IC8vIENvbnZlcnQgJ18nIHRvICcvJ1xuXG4gIHJldHVybiBCYXNlNjQuYXRvYihzdHIpO1xufSIsIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFJlc29sdmUgYGlzQXJyYXlgIGFzIG5hdGl2ZSBvciBmYWxsYmFja1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gbnVsbCAhPSBBcnJheS5pc0FycmF5XG4gID8gQXJyYXkuaXNBcnJheVxuICA6IGlzQXJyYXk7XG5cbi8qKlxuICogV3JhcCBgQXJyYXkuaXNBcnJheWAgUG9seWZpbGwgZm9yIElFOVxuICogc291cmNlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9pc0FycmF5XG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyYXlcbiAqIEBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBpc0FycmF5IChhcnJheSkge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcnJheSkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiLyoqXG4gKiBFeHBvc2UgYEpTT04ucGFyc2VgIG1ldGhvZCBvciBmYWxsYmFjayBpZiBub3RcbiAqIGV4aXN0cyBvbiBgd2luZG93YFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiB3aW5kb3cuSlNPTlxuICA/IHJlcXVpcmUoJ2pzb24tZmFsbGJhY2snKS5wYXJzZVxuICA6IHdpbmRvdy5KU09OLnBhcnNlO1xuIiwiLyoqXG4gKiBDaGVjayBmb3Igc2FtZSBvcmlnaW4gcG9saWN5XG4gKi9cblxudmFyIHByb3RvY29sID0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sO1xudmFyIGRvbWFpbiA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZTtcbnZhciBwb3J0ID0gd2luZG93LmxvY2F0aW9uLnBvcnQ7XG5cbm1vZHVsZS5leHBvcnRzID0gc2FtZV9vcmlnaW47XG5cbmZ1bmN0aW9uIHNhbWVfb3JpZ2luICh0cHJvdG9jb2wsIHRkb21haW4sIHRwb3J0KSB7XG4gIHRwb3J0ID0gdHBvcnQgfHwgJyc7XG4gIHJldHVybiBwcm90b2NvbCA9PT0gdHByb3RvY29sICYmIGRvbWFpbiA9PT0gdGRvbWFpbiAmJiBwb3J0ID09PSB0cG9ydDtcbn1cbiIsIi8qKlxuICogRXhwb3NlIGB1c2VfanNvbnBgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB1c2VfanNvbnA7XG5cbi8qKlxuICogUmV0dXJuIHRydWUgaWYgYGpzb25wYCBpcyByZXF1aXJlZFxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAcHVibGljXG4gKi9cblxuZnVuY3Rpb24gdXNlX2pzb25wKCkge1xuICB2YXIgeGhyID0gd2luZG93LlhNTEh0dHBSZXF1ZXN0ID8gbmV3IFhNTEh0dHBSZXF1ZXN0KCkgOiBudWxsO1xuXG4gIGlmICh4aHIgJiYgJ3dpdGhDcmVkZW50aWFscycgaW4geGhyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gV2Ugbm8gbG9uZ2VyIHN1cHBvcnQgWERvbWFpblJlcXVlc3QgZm9yIElFOCBhbmQgSUU5IGZvciBDT1JTIGJlY2F1c2UgaXQgaGFzIG1hbnkgcXVpcmtzLlxuICAvLyBpZiAoJ1hEb21haW5SZXF1ZXN0JyBpbiB3aW5kb3cgJiYgd2luZG93LmxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6Jykge1xuICAvLyAgIHJldHVybiBmYWxzZTtcbiAgLy8gfVxuXG4gIHJldHVybiB0cnVlO1xufSIsIjsoZnVuY3Rpb24gKCkge1xuXG4gIHZhclxuICAgIG9iamVjdCA9IHR5cGVvZiBleHBvcnRzICE9ICd1bmRlZmluZWQnID8gZXhwb3J0cyA6IHRoaXMsIC8vICM4OiB3ZWIgd29ya2Vyc1xuICAgIGNoYXJzID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky89JyxcbiAgICBJTlZBTElEX0NIQVJBQ1RFUl9FUlIgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgLy8gZmFicmljYXRlIGEgc3VpdGFibGUgZXJyb3Igb2JqZWN0XG4gICAgICB0cnkgeyBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCckJyk7IH1cbiAgICAgIGNhdGNoIChlcnJvcikgeyByZXR1cm4gZXJyb3I7IH19KCkpO1xuXG4gIC8vIGVuY29kZXJcbiAgLy8gW2h0dHBzOi8vZ2lzdC5naXRodWIuY29tLzk5OTE2Nl0gYnkgW2h0dHBzOi8vZ2l0aHViLmNvbS9uaWduYWddXG4gIG9iamVjdC5idG9hIHx8IChcbiAgb2JqZWN0LmJ0b2EgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICBmb3IgKFxuICAgICAgLy8gaW5pdGlhbGl6ZSByZXN1bHQgYW5kIGNvdW50ZXJcbiAgICAgIHZhciBibG9jaywgY2hhckNvZGUsIGlkeCA9IDAsIG1hcCA9IGNoYXJzLCBvdXRwdXQgPSAnJztcbiAgICAgIC8vIGlmIHRoZSBuZXh0IGlucHV0IGluZGV4IGRvZXMgbm90IGV4aXN0OlxuICAgICAgLy8gICBjaGFuZ2UgdGhlIG1hcHBpbmcgdGFibGUgdG8gXCI9XCJcbiAgICAgIC8vICAgY2hlY2sgaWYgZCBoYXMgbm8gZnJhY3Rpb25hbCBkaWdpdHNcbiAgICAgIGlucHV0LmNoYXJBdChpZHggfCAwKSB8fCAobWFwID0gJz0nLCBpZHggJSAxKTtcbiAgICAgIC8vIFwiOCAtIGlkeCAlIDEgKiA4XCIgZ2VuZXJhdGVzIHRoZSBzZXF1ZW5jZSAyLCA0LCA2LCA4XG4gICAgICBvdXRwdXQgKz0gbWFwLmNoYXJBdCg2MyAmIGJsb2NrID4+IDggLSBpZHggJSAxICogOClcbiAgICApIHtcbiAgICAgIGNoYXJDb2RlID0gaW5wdXQuY2hhckNvZGVBdChpZHggKz0gMy80KTtcbiAgICAgIGlmIChjaGFyQ29kZSA+IDB4RkYpIHRocm93IElOVkFMSURfQ0hBUkFDVEVSX0VSUjtcbiAgICAgIGJsb2NrID0gYmxvY2sgPDwgOCB8IGNoYXJDb2RlO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9KTtcblxuICAvLyBkZWNvZGVyXG4gIC8vIFtodHRwczovL2dpc3QuZ2l0aHViLmNvbS8xMDIwMzk2XSBieSBbaHR0cHM6Ly9naXRodWIuY29tL2F0a11cbiAgb2JqZWN0LmF0b2IgfHwgKFxuICBvYmplY3QuYXRvYiA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgIGlucHV0ID0gaW5wdXQucmVwbGFjZSgvPSskLywgJycpXG4gICAgaWYgKGlucHV0Lmxlbmd0aCAlIDQgPT0gMSkgdGhyb3cgSU5WQUxJRF9DSEFSQUNURVJfRVJSO1xuICAgIGZvciAoXG4gICAgICAvLyBpbml0aWFsaXplIHJlc3VsdCBhbmQgY291bnRlcnNcbiAgICAgIHZhciBiYyA9IDAsIGJzLCBidWZmZXIsIGlkeCA9IDAsIG91dHB1dCA9ICcnO1xuICAgICAgLy8gZ2V0IG5leHQgY2hhcmFjdGVyXG4gICAgICBidWZmZXIgPSBpbnB1dC5jaGFyQXQoaWR4KyspO1xuICAgICAgLy8gY2hhcmFjdGVyIGZvdW5kIGluIHRhYmxlPyBpbml0aWFsaXplIGJpdCBzdG9yYWdlIGFuZCBhZGQgaXRzIGFzY2lpIHZhbHVlO1xuICAgICAgfmJ1ZmZlciAmJiAoYnMgPSBiYyAlIDQgPyBicyAqIDY0ICsgYnVmZmVyIDogYnVmZmVyLFxuICAgICAgICAvLyBhbmQgaWYgbm90IGZpcnN0IG9mIGVhY2ggNCBjaGFyYWN0ZXJzLFxuICAgICAgICAvLyBjb252ZXJ0IHRoZSBmaXJzdCA4IGJpdHMgdG8gb25lIGFzY2lpIGNoYXJhY3RlclxuICAgICAgICBiYysrICUgNCkgPyBvdXRwdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgyNTUgJiBicyA+PiAoLTIgKiBiYyAmIDYpKSA6IDBcbiAgICApIHtcbiAgICAgIC8vIHRyeSB0byBmaW5kIGNoYXJhY3RlciBpbiB0YWJsZSAoMC02Mywgbm90IGZvdW5kID0+IC0xKVxuICAgICAgYnVmZmVyID0gY2hhcnMuaW5kZXhPZihidWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9KTtcblxufSgpKTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSB3ZWIgYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuICAnbGlnaHRzZWFncmVlbicsXG4gICdmb3Jlc3RncmVlbicsXG4gICdnb2xkZW5yb2QnLFxuICAnZG9kZ2VyYmx1ZScsXG4gICdkYXJrb3JjaGlkJyxcbiAgJ2NyaW1zb24nXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcbiAgLy8gaXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcbiAgcmV0dXJuICgnV2Via2l0QXBwZWFyYW5jZScgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlKSB8fFxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcbiAgICAod2luZG93LmNvbnNvbGUgJiYgKGNvbnNvbGUuZmlyZWJ1ZyB8fCAoY29uc29sZS5leGNlcHRpb24gJiYgY29uc29sZS50YWJsZSkpKSB8fFxuICAgIC8vIGlzIGZpcmVmb3ggPj0gdjMxP1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuICAgIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncygpIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybiBhcmdzO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncyA9IFthcmdzWzBdLCBjLCAnY29sb3I6IGluaGVyaXQnXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgMSkpO1xuXG4gIC8vIHRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cbiAgLy8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0QyA9IDA7XG4gIGFyZ3NbMF0ucmVwbGFjZSgvJVthLXolXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmICgnJSUnID09PSBtYXRjaCkgcmV0dXJuO1xuICAgIGluZGV4Kys7XG4gICAgaWYgKCclYycgPT09IG1hdGNoKSB7XG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcbiAgICAgIC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG4gICAgICBsYXN0QyA9IGluZGV4O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LFxuICAvLyB3aGVyZSB0aGUgYGNvbnNvbGUubG9nYCBmdW5jdGlvbiBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICByZXR1cm4gJ29iamVjdCcgPT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiAnZnVuY3Rpb24nID09IHR5cGVvZiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gbG9jYWxTdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG4gIHJldHVybiByO1xufVxuXG4vKipcbiAqIEVuYWJsZSBuYW1lc3BhY2VzIGxpc3RlZCBpbiBgbG9jYWxTdG9yYWdlLmRlYnVnYCBpbml0aWFsbHkuXG4gKi9cblxuZXhwb3J0cy5lbmFibGUobG9hZCgpKTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBkZWJ1ZztcbmV4cG9ydHMuY29lcmNlID0gY29lcmNlO1xuZXhwb3J0cy5kaXNhYmxlID0gZGlzYWJsZTtcbmV4cG9ydHMuZW5hYmxlID0gZW5hYmxlO1xuZXhwb3J0cy5lbmFibGVkID0gZW5hYmxlZDtcbmV4cG9ydHMuaHVtYW5pemUgPSByZXF1aXJlKCdtcycpO1xuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuICovXG5cbmV4cG9ydHMubmFtZXMgPSBbXTtcbmV4cG9ydHMuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG4gKlxuICogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXJjYXNlZCBsZXR0ZXIsIGkuZS4gXCJuXCIuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzID0ge307XG5cbi8qKlxuICogUHJldmlvdXNseSBhc3NpZ25lZCBjb2xvci5cbiAqL1xuXG52YXIgcHJldkNvbG9yID0gMDtcblxuLyoqXG4gKiBQcmV2aW91cyBsb2cgdGltZXN0YW1wLlxuICovXG5cbnZhciBwcmV2VGltZTtcblxuLyoqXG4gKiBTZWxlY3QgYSBjb2xvci5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZWxlY3RDb2xvcigpIHtcbiAgcmV0dXJuIGV4cG9ydHMuY29sb3JzW3ByZXZDb2xvcisrICUgZXhwb3J0cy5jb2xvcnMubGVuZ3RoXTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVidWcobmFtZXNwYWNlKSB7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZGlzYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZGlzYWJsZWQoKSB7XG4gIH1cbiAgZGlzYWJsZWQuZW5hYmxlZCA9IGZhbHNlO1xuXG4gIC8vIGRlZmluZSB0aGUgYGVuYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZW5hYmxlZCgpIHtcblxuICAgIHZhciBzZWxmID0gZW5hYmxlZDtcblxuICAgIC8vIHNldCBgZGlmZmAgdGltZXN0YW1wXG4gICAgdmFyIGN1cnIgPSArbmV3IERhdGUoKTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuICAgIHNlbGYuZGlmZiA9IG1zO1xuICAgIHNlbGYucHJldiA9IHByZXZUaW1lO1xuICAgIHNlbGYuY3VyciA9IGN1cnI7XG4gICAgcHJldlRpbWUgPSBjdXJyO1xuXG4gICAgLy8gYWRkIHRoZSBgY29sb3JgIGlmIG5vdCBzZXRcbiAgICBpZiAobnVsbCA9PSBzZWxmLnVzZUNvbG9ycykgc2VsZi51c2VDb2xvcnMgPSBleHBvcnRzLnVzZUNvbG9ycygpO1xuICAgIGlmIChudWxsID09IHNlbGYuY29sb3IgJiYgc2VsZi51c2VDb2xvcnMpIHNlbGYuY29sb3IgPSBzZWxlY3RDb2xvcigpO1xuXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xuXG4gICAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgYXJnc1swXSkge1xuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJW9cbiAgICAgIGFyZ3MgPSBbJyVvJ10uY29uY2F0KGFyZ3MpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGV4cG9ydHMuZm9ybWF0QXJncykge1xuICAgICAgYXJncyA9IGV4cG9ydHMuZm9ybWF0QXJncy5hcHBseShzZWxmLCBhcmdzKTtcbiAgICB9XG4gICAgdmFyIGxvZ0ZuID0gZW5hYmxlZC5sb2cgfHwgZXhwb3J0cy5sb2cgfHwgY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbiAgICBsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxuICBlbmFibGVkLmVuYWJsZWQgPSB0cnVlO1xuXG4gIHZhciBmbiA9IGV4cG9ydHMuZW5hYmxlZChuYW1lc3BhY2UpID8gZW5hYmxlZCA6IGRpc2FibGVkO1xuXG4gIGZuLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblxuICByZXR1cm4gZm47XG59XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuICBleHBvcnRzLnNhdmUobmFtZXNwYWNlcyk7XG5cbiAgdmFyIHNwbGl0ID0gKG5hbWVzcGFjZXMgfHwgJycpLnNwbGl0KC9bXFxzLF0rLyk7XG4gIHZhciBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICghc3BsaXRbaV0pIGNvbnRpbnVlOyAvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuICAgIG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuICAgIGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcbiAgICAgIGV4cG9ydHMuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gIGV4cG9ydHMuZW5hYmxlKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB5ID0gZCAqIDM2NS4yNTtcblxuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtTdHJpbmd8TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbCwgb3B0aW9ucyl7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHZhbCkgcmV0dXJuIHBhcnNlKHZhbCk7XG4gIHJldHVybiBvcHRpb25zLmxvbmdcbiAgICA/IGxvbmcodmFsKVxuICAgIDogc2hvcnQodmFsKTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGBzdHJgIGFuZCByZXR1cm4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtc3xzZWNvbmRzP3xzfG1pbnV0ZXM/fG18aG91cnM/fGh8ZGF5cz98ZHx5ZWFycz98eSk/JC9pLmV4ZWMoc3RyKTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuO1xuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnZGF5cyc6XG4gICAgY2FzZSAnZGF5JzpcbiAgICBjYXNlICdkJzpcbiAgICAgIHJldHVybiBuICogZDtcbiAgICBjYXNlICdob3Vycyc6XG4gICAgY2FzZSAnaG91cic6XG4gICAgY2FzZSAnaCc6XG4gICAgICByZXR1cm4gbiAqIGg7XG4gICAgY2FzZSAnbWludXRlcyc6XG4gICAgY2FzZSAnbWludXRlJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2hvcnQobXMpIHtcbiAgaWYgKG1zID49IGQpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIGlmIChtcyA+PSBoKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICBpZiAobXMgPj0gbSkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgaWYgKG1zID49IHMpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb25nKG1zKSB7XG4gIHJldHVybiBwbHVyYWwobXMsIGQsICdkYXknKVxuICAgIHx8IHBsdXJhbChtcywgaCwgJ2hvdXInKVxuICAgIHx8IHBsdXJhbChtcywgbSwgJ21pbnV0ZScpXG4gICAgfHwgcGx1cmFsKG1zLCBzLCAnc2Vjb25kJylcbiAgICB8fCBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbiwgbmFtZSkge1xuICBpZiAobXMgPCBuKSByZXR1cm47XG4gIGlmIChtcyA8IG4gKiAxLjUpIHJldHVybiBNYXRoLmZsb29yKG1zIC8gbikgKyAnICcgKyBuYW1lO1xuICByZXR1cm4gTWF0aC5jZWlsKG1zIC8gbikgKyAnICcgKyBuYW1lICsgJ3MnO1xufVxuIiwiLypcbiAgICBqc29uMi5qc1xuICAgIDIwMTEtMTAtMTlcblxuICAgIFB1YmxpYyBEb21haW4uXG5cbiAgICBOTyBXQVJSQU5UWSBFWFBSRVNTRUQgT1IgSU1QTElFRC4gVVNFIEFUIFlPVVIgT1dOIFJJU0suXG5cbiAgICBTZWUgaHR0cDovL3d3dy5KU09OLm9yZy9qcy5odG1sXG5cblxuICAgIFRoaXMgY29kZSBzaG91bGQgYmUgbWluaWZpZWQgYmVmb3JlIGRlcGxveW1lbnQuXG4gICAgU2VlIGh0dHA6Ly9qYXZhc2NyaXB0LmNyb2NrZm9yZC5jb20vanNtaW4uaHRtbFxuXG4gICAgVVNFIFlPVVIgT1dOIENPUFkuIElUIElTIEVYVFJFTUVMWSBVTldJU0UgVE8gTE9BRCBDT0RFIEZST00gU0VSVkVSUyBZT1UgRE9cbiAgICBOT1QgQ09OVFJPTC5cblxuXG4gICAgVGhpcyBmaWxlIGNyZWF0ZXMgYSBnbG9iYWwgSlNPTiBvYmplY3QgY29udGFpbmluZyB0d28gbWV0aG9kczogc3RyaW5naWZ5XG4gICAgYW5kIHBhcnNlLlxuXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHZhbHVlLCByZXBsYWNlciwgc3BhY2UpXG4gICAgICAgICAgICB2YWx1ZSAgICAgICBhbnkgSmF2YVNjcmlwdCB2YWx1ZSwgdXN1YWxseSBhbiBvYmplY3Qgb3IgYXJyYXkuXG5cbiAgICAgICAgICAgIHJlcGxhY2VyICAgIGFuIG9wdGlvbmFsIHBhcmFtZXRlciB0aGF0IGRldGVybWluZXMgaG93IG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzIGFyZSBzdHJpbmdpZmllZCBmb3Igb2JqZWN0cy4gSXQgY2FuIGJlIGFcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIG9yIGFuIGFycmF5IG9mIHN0cmluZ3MuXG5cbiAgICAgICAgICAgIHNwYWNlICAgICAgIGFuIG9wdGlvbmFsIHBhcmFtZXRlciB0aGF0IHNwZWNpZmllcyB0aGUgaW5kZW50YXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIG9mIG5lc3RlZCBzdHJ1Y3R1cmVzLiBJZiBpdCBpcyBvbWl0dGVkLCB0aGUgdGV4dCB3aWxsXG4gICAgICAgICAgICAgICAgICAgICAgICBiZSBwYWNrZWQgd2l0aG91dCBleHRyYSB3aGl0ZXNwYWNlLiBJZiBpdCBpcyBhIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0IHdpbGwgc3BlY2lmeSB0aGUgbnVtYmVyIG9mIHNwYWNlcyB0byBpbmRlbnQgYXQgZWFjaFxuICAgICAgICAgICAgICAgICAgICAgICAgbGV2ZWwuIElmIGl0IGlzIGEgc3RyaW5nIChzdWNoIGFzICdcXHQnIG9yICcmbmJzcDsnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0IGNvbnRhaW5zIHRoZSBjaGFyYWN0ZXJzIHVzZWQgdG8gaW5kZW50IGF0IGVhY2ggbGV2ZWwuXG5cbiAgICAgICAgICAgIFRoaXMgbWV0aG9kIHByb2R1Y2VzIGEgSlNPTiB0ZXh0IGZyb20gYSBKYXZhU2NyaXB0IHZhbHVlLlxuXG4gICAgICAgICAgICBXaGVuIGFuIG9iamVjdCB2YWx1ZSBpcyBmb3VuZCwgaWYgdGhlIG9iamVjdCBjb250YWlucyBhIHRvSlNPTlxuICAgICAgICAgICAgbWV0aG9kLCBpdHMgdG9KU09OIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBhbmQgdGhlIHJlc3VsdCB3aWxsIGJlXG4gICAgICAgICAgICBzdHJpbmdpZmllZC4gQSB0b0pTT04gbWV0aG9kIGRvZXMgbm90IHNlcmlhbGl6ZTogaXQgcmV0dXJucyB0aGVcbiAgICAgICAgICAgIHZhbHVlIHJlcHJlc2VudGVkIGJ5IHRoZSBuYW1lL3ZhbHVlIHBhaXIgdGhhdCBzaG91bGQgYmUgc2VyaWFsaXplZCxcbiAgICAgICAgICAgIG9yIHVuZGVmaW5lZCBpZiBub3RoaW5nIHNob3VsZCBiZSBzZXJpYWxpemVkLiBUaGUgdG9KU09OIG1ldGhvZFxuICAgICAgICAgICAgd2lsbCBiZSBwYXNzZWQgdGhlIGtleSBhc3NvY2lhdGVkIHdpdGggdGhlIHZhbHVlLCBhbmQgdGhpcyB3aWxsIGJlXG4gICAgICAgICAgICBib3VuZCB0byB0aGUgdmFsdWVcblxuICAgICAgICAgICAgRm9yIGV4YW1wbGUsIHRoaXMgd291bGQgc2VyaWFsaXplIERhdGVzIGFzIElTTyBzdHJpbmdzLlxuXG4gICAgICAgICAgICAgICAgRGF0ZS5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBmKG4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvcm1hdCBpbnRlZ2VycyB0byBoYXZlIGF0IGxlYXN0IHR3byBkaWdpdHMuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbiA8IDEwID8gJzAnICsgbiA6IG47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRVVENGdWxsWWVhcigpICAgKyAnLScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgIGYodGhpcy5nZXRVVENNb250aCgpICsgMSkgKyAnLScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgIGYodGhpcy5nZXRVVENEYXRlKCkpICAgICAgKyAnVCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgIGYodGhpcy5nZXRVVENIb3VycygpKSAgICAgKyAnOicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgIGYodGhpcy5nZXRVVENNaW51dGVzKCkpICAgKyAnOicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgIGYodGhpcy5nZXRVVENTZWNvbmRzKCkpICAgKyAnWic7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgWW91IGNhbiBwcm92aWRlIGFuIG9wdGlvbmFsIHJlcGxhY2VyIG1ldGhvZC4gSXQgd2lsbCBiZSBwYXNzZWQgdGhlXG4gICAgICAgICAgICBrZXkgYW5kIHZhbHVlIG9mIGVhY2ggbWVtYmVyLCB3aXRoIHRoaXMgYm91bmQgdG8gdGhlIGNvbnRhaW5pbmdcbiAgICAgICAgICAgIG9iamVjdC4gVGhlIHZhbHVlIHRoYXQgaXMgcmV0dXJuZWQgZnJvbSB5b3VyIG1ldGhvZCB3aWxsIGJlXG4gICAgICAgICAgICBzZXJpYWxpemVkLiBJZiB5b3VyIG1ldGhvZCByZXR1cm5zIHVuZGVmaW5lZCwgdGhlbiB0aGUgbWVtYmVyIHdpbGxcbiAgICAgICAgICAgIGJlIGV4Y2x1ZGVkIGZyb20gdGhlIHNlcmlhbGl6YXRpb24uXG5cbiAgICAgICAgICAgIElmIHRoZSByZXBsYWNlciBwYXJhbWV0ZXIgaXMgYW4gYXJyYXkgb2Ygc3RyaW5ncywgdGhlbiBpdCB3aWxsIGJlXG4gICAgICAgICAgICB1c2VkIHRvIHNlbGVjdCB0aGUgbWVtYmVycyB0byBiZSBzZXJpYWxpemVkLiBJdCBmaWx0ZXJzIHRoZSByZXN1bHRzXG4gICAgICAgICAgICBzdWNoIHRoYXQgb25seSBtZW1iZXJzIHdpdGgga2V5cyBsaXN0ZWQgaW4gdGhlIHJlcGxhY2VyIGFycmF5IGFyZVxuICAgICAgICAgICAgc3RyaW5naWZpZWQuXG5cbiAgICAgICAgICAgIFZhbHVlcyB0aGF0IGRvIG5vdCBoYXZlIEpTT04gcmVwcmVzZW50YXRpb25zLCBzdWNoIGFzIHVuZGVmaW5lZCBvclxuICAgICAgICAgICAgZnVuY3Rpb25zLCB3aWxsIG5vdCBiZSBzZXJpYWxpemVkLiBTdWNoIHZhbHVlcyBpbiBvYmplY3RzIHdpbGwgYmVcbiAgICAgICAgICAgIGRyb3BwZWQ7IGluIGFycmF5cyB0aGV5IHdpbGwgYmUgcmVwbGFjZWQgd2l0aCBudWxsLiBZb3UgY2FuIHVzZVxuICAgICAgICAgICAgYSByZXBsYWNlciBmdW5jdGlvbiB0byByZXBsYWNlIHRob3NlIHdpdGggSlNPTiB2YWx1ZXMuXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh1bmRlZmluZWQpIHJldHVybnMgdW5kZWZpbmVkLlxuXG4gICAgICAgICAgICBUaGUgb3B0aW9uYWwgc3BhY2UgcGFyYW1ldGVyIHByb2R1Y2VzIGEgc3RyaW5naWZpY2F0aW9uIG9mIHRoZVxuICAgICAgICAgICAgdmFsdWUgdGhhdCBpcyBmaWxsZWQgd2l0aCBsaW5lIGJyZWFrcyBhbmQgaW5kZW50YXRpb24gdG8gbWFrZSBpdFxuICAgICAgICAgICAgZWFzaWVyIHRvIHJlYWQuXG5cbiAgICAgICAgICAgIElmIHRoZSBzcGFjZSBwYXJhbWV0ZXIgaXMgYSBub24tZW1wdHkgc3RyaW5nLCB0aGVuIHRoYXQgc3RyaW5nIHdpbGxcbiAgICAgICAgICAgIGJlIHVzZWQgZm9yIGluZGVudGF0aW9uLiBJZiB0aGUgc3BhY2UgcGFyYW1ldGVyIGlzIGEgbnVtYmVyLCB0aGVuXG4gICAgICAgICAgICB0aGUgaW5kZW50YXRpb24gd2lsbCBiZSB0aGF0IG1hbnkgc3BhY2VzLlxuXG4gICAgICAgICAgICBFeGFtcGxlOlxuXG4gICAgICAgICAgICB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkoWydlJywge3BsdXJpYnVzOiAndW51bSd9XSk7XG4gICAgICAgICAgICAvLyB0ZXh0IGlzICdbXCJlXCIse1wicGx1cmlidXNcIjpcInVudW1cIn1dJ1xuXG5cbiAgICAgICAgICAgIHRleHQgPSBKU09OLnN0cmluZ2lmeShbJ2UnLCB7cGx1cmlidXM6ICd1bnVtJ31dLCBudWxsLCAnXFx0Jyk7XG4gICAgICAgICAgICAvLyB0ZXh0IGlzICdbXFxuXFx0XCJlXCIsXFxuXFx0e1xcblxcdFxcdFwicGx1cmlidXNcIjogXCJ1bnVtXCJcXG5cXHR9XFxuXSdcblxuICAgICAgICAgICAgdGV4dCA9IEpTT04uc3RyaW5naWZ5KFtuZXcgRGF0ZSgpXSwgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1trZXldIGluc3RhbmNlb2YgRGF0ZSA/XG4gICAgICAgICAgICAgICAgICAgICdEYXRlKCcgKyB0aGlzW2tleV0gKyAnKScgOiB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gdGV4dCBpcyAnW1wiRGF0ZSgtLS1jdXJyZW50IHRpbWUtLS0pXCJdJ1xuXG5cbiAgICAgICAgSlNPTi5wYXJzZSh0ZXh0LCByZXZpdmVyKVxuICAgICAgICAgICAgVGhpcyBtZXRob2QgcGFyc2VzIGEgSlNPTiB0ZXh0IHRvIHByb2R1Y2UgYW4gb2JqZWN0IG9yIGFycmF5LlxuICAgICAgICAgICAgSXQgY2FuIHRocm93IGEgU3ludGF4RXJyb3IgZXhjZXB0aW9uLlxuXG4gICAgICAgICAgICBUaGUgb3B0aW9uYWwgcmV2aXZlciBwYXJhbWV0ZXIgaXMgYSBmdW5jdGlvbiB0aGF0IGNhbiBmaWx0ZXIgYW5kXG4gICAgICAgICAgICB0cmFuc2Zvcm0gdGhlIHJlc3VsdHMuIEl0IHJlY2VpdmVzIGVhY2ggb2YgdGhlIGtleXMgYW5kIHZhbHVlcyxcbiAgICAgICAgICAgIGFuZCBpdHMgcmV0dXJuIHZhbHVlIGlzIHVzZWQgaW5zdGVhZCBvZiB0aGUgb3JpZ2luYWwgdmFsdWUuXG4gICAgICAgICAgICBJZiBpdCByZXR1cm5zIHdoYXQgaXQgcmVjZWl2ZWQsIHRoZW4gdGhlIHN0cnVjdHVyZSBpcyBub3QgbW9kaWZpZWQuXG4gICAgICAgICAgICBJZiBpdCByZXR1cm5zIHVuZGVmaW5lZCB0aGVuIHRoZSBtZW1iZXIgaXMgZGVsZXRlZC5cblxuICAgICAgICAgICAgRXhhbXBsZTpcblxuICAgICAgICAgICAgLy8gUGFyc2UgdGhlIHRleHQuIFZhbHVlcyB0aGF0IGxvb2sgbGlrZSBJU08gZGF0ZSBzdHJpbmdzIHdpbGxcbiAgICAgICAgICAgIC8vIGJlIGNvbnZlcnRlZCB0byBEYXRlIG9iamVjdHMuXG5cbiAgICAgICAgICAgIG15RGF0YSA9IEpTT04ucGFyc2UodGV4dCwgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgYTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBhID1cbi9eKFxcZHs0fSktKFxcZHsyfSktKFxcZHsyfSlUKFxcZHsyfSk6KFxcZHsyfSk6KFxcZHsyfSg/OlxcLlxcZCopPylaJC8uZXhlYyh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoK2FbMV0sICthWzJdIC0gMSwgK2FbM10sICthWzRdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICthWzVdLCArYVs2XSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBteURhdGEgPSBKU09OLnBhcnNlKCdbXCJEYXRlKDA5LzA5LzIwMDEpXCJdJywgZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZDtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUuc2xpY2UoMCwgNSkgPT09ICdEYXRlKCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLnNsaWNlKC0xKSA9PT0gJyknKSB7XG4gICAgICAgICAgICAgICAgICAgIGQgPSBuZXcgRGF0ZSh2YWx1ZS5zbGljZSg1LCAtMSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfSk7XG5cblxuICAgIFRoaXMgaXMgYSByZWZlcmVuY2UgaW1wbGVtZW50YXRpb24uIFlvdSBhcmUgZnJlZSB0byBjb3B5LCBtb2RpZnksIG9yXG4gICAgcmVkaXN0cmlidXRlLlxuKi9cblxuLypqc2xpbnQgZXZpbDogdHJ1ZSwgcmVnZXhwOiB0cnVlICovXG5cbi8qbWVtYmVycyBcIlwiLCBcIlxcYlwiLCBcIlxcdFwiLCBcIlxcblwiLCBcIlxcZlwiLCBcIlxcclwiLCBcIlxcXCJcIiwgSlNPTiwgXCJcXFxcXCIsIGFwcGx5LFxuICAgIGNhbGwsIGNoYXJDb2RlQXQsIGdldFVUQ0RhdGUsIGdldFVUQ0Z1bGxZZWFyLCBnZXRVVENIb3VycyxcbiAgICBnZXRVVENNaW51dGVzLCBnZXRVVENNb250aCwgZ2V0VVRDU2Vjb25kcywgaGFzT3duUHJvcGVydHksIGpvaW4sXG4gICAgbGFzdEluZGV4LCBsZW5ndGgsIHBhcnNlLCBwcm90b3R5cGUsIHB1c2gsIHJlcGxhY2UsIHNsaWNlLCBzdHJpbmdpZnksXG4gICAgdGVzdCwgdG9KU09OLCB0b1N0cmluZywgdmFsdWVPZlxuKi9cblxuXG4vLyBDcmVhdGUgYSBKU09OIG9iamVjdCBvbmx5IGlmIG9uZSBkb2VzIG5vdCBhbHJlYWR5IGV4aXN0LiBXZSBjcmVhdGUgdGhlXG4vLyBtZXRob2RzIGluIGEgY2xvc3VyZSB0byBhdm9pZCBjcmVhdGluZyBnbG9iYWwgdmFyaWFibGVzLlxuXG52YXIgSlNPTiA9IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIGYobikge1xuICAgICAgICAvLyBGb3JtYXQgaW50ZWdlcnMgdG8gaGF2ZSBhdCBsZWFzdCB0d28gZGlnaXRzLlxuICAgICAgICByZXR1cm4gbiA8IDEwID8gJzAnICsgbiA6IG47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBEYXRlLnByb3RvdHlwZS50b0pTT04gIT09ICdmdW5jdGlvbicpIHtcblxuICAgICAgICBEYXRlLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoa2V5KSB7XG5cbiAgICAgICAgICAgIHJldHVybiBpc0Zpbml0ZSh0aGlzLnZhbHVlT2YoKSlcbiAgICAgICAgICAgICAgICA/IHRoaXMuZ2V0VVRDRnVsbFllYXIoKSAgICAgKyAnLScgK1xuICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDTW9udGgoKSArIDEpICsgJy0nICtcbiAgICAgICAgICAgICAgICAgICAgZih0aGlzLmdldFVUQ0RhdGUoKSkgICAgICArICdUJyArXG4gICAgICAgICAgICAgICAgICAgIGYodGhpcy5nZXRVVENIb3VycygpKSAgICAgKyAnOicgK1xuICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDTWludXRlcygpKSAgICsgJzonICtcbiAgICAgICAgICAgICAgICAgICAgZih0aGlzLmdldFVUQ1NlY29uZHMoKSkgICArICdaJ1xuICAgICAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICBTdHJpbmcucHJvdG90eXBlLnRvSlNPTiAgICAgID1cbiAgICAgICAgICAgIE51bWJlci5wcm90b3R5cGUudG9KU09OICA9XG4gICAgICAgICAgICBCb29sZWFuLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVPZigpO1xuICAgICAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgY3ggPSAvW1xcdTAwMDBcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZyxcbiAgICAgICAgZXNjYXBhYmxlID0gL1tcXFxcXFxcIlxceDAwLVxceDFmXFx4N2YtXFx4OWZcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZyxcbiAgICAgICAgZ2FwLFxuICAgICAgICBpbmRlbnQsXG4gICAgICAgIG1ldGEgPSB7ICAgIC8vIHRhYmxlIG9mIGNoYXJhY3RlciBzdWJzdGl0dXRpb25zXG4gICAgICAgICAgICAnXFxiJzogJ1xcXFxiJyxcbiAgICAgICAgICAgICdcXHQnOiAnXFxcXHQnLFxuICAgICAgICAgICAgJ1xcbic6ICdcXFxcbicsXG4gICAgICAgICAgICAnXFxmJzogJ1xcXFxmJyxcbiAgICAgICAgICAgICdcXHInOiAnXFxcXHInLFxuICAgICAgICAgICAgJ1wiJyA6ICdcXFxcXCInLFxuICAgICAgICAgICAgJ1xcXFwnOiAnXFxcXFxcXFwnXG4gICAgICAgIH0sXG4gICAgICAgIHJlcDtcblxuXG4gICAgZnVuY3Rpb24gcXVvdGUoc3RyaW5nKSB7XG5cbi8vIElmIHRoZSBzdHJpbmcgY29udGFpbnMgbm8gY29udHJvbCBjaGFyYWN0ZXJzLCBubyBxdW90ZSBjaGFyYWN0ZXJzLCBhbmQgbm9cbi8vIGJhY2tzbGFzaCBjaGFyYWN0ZXJzLCB0aGVuIHdlIGNhbiBzYWZlbHkgc2xhcCBzb21lIHF1b3RlcyBhcm91bmQgaXQuXG4vLyBPdGhlcndpc2Ugd2UgbXVzdCBhbHNvIHJlcGxhY2UgdGhlIG9mZmVuZGluZyBjaGFyYWN0ZXJzIHdpdGggc2FmZSBlc2NhcGVcbi8vIHNlcXVlbmNlcy5cblxuICAgICAgICBlc2NhcGFibGUubGFzdEluZGV4ID0gMDtcbiAgICAgICAgcmV0dXJuIGVzY2FwYWJsZS50ZXN0KHN0cmluZykgPyAnXCInICsgc3RyaW5nLnJlcGxhY2UoZXNjYXBhYmxlLCBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgdmFyIGMgPSBtZXRhW2FdO1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBjID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgID8gY1xuICAgICAgICAgICAgICAgIDogJ1xcXFx1JyArICgnMDAwMCcgKyBhLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCk7XG4gICAgICAgIH0pICsgJ1wiJyA6ICdcIicgKyBzdHJpbmcgKyAnXCInO1xuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gc3RyKGtleSwgaG9sZGVyKSB7XG5cbi8vIFByb2R1Y2UgYSBzdHJpbmcgZnJvbSBob2xkZXJba2V5XS5cblxuICAgICAgICB2YXIgaSwgICAgICAgICAgLy8gVGhlIGxvb3AgY291bnRlci5cbiAgICAgICAgICAgIGssICAgICAgICAgIC8vIFRoZSBtZW1iZXIga2V5LlxuICAgICAgICAgICAgdiwgICAgICAgICAgLy8gVGhlIG1lbWJlciB2YWx1ZS5cbiAgICAgICAgICAgIGxlbmd0aCxcbiAgICAgICAgICAgIG1pbmQgPSBnYXAsXG4gICAgICAgICAgICBwYXJ0aWFsLFxuICAgICAgICAgICAgdmFsdWUgPSBob2xkZXJba2V5XTtcblxuLy8gSWYgdGhlIHZhbHVlIGhhcyBhIHRvSlNPTiBtZXRob2QsIGNhbGwgaXQgdG8gb2J0YWluIGEgcmVwbGFjZW1lbnQgdmFsdWUuXG5cbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgICAgICAgICB0eXBlb2YgdmFsdWUudG9KU09OID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvSlNPTihrZXkpO1xuICAgICAgICB9XG5cbi8vIElmIHdlIHdlcmUgY2FsbGVkIHdpdGggYSByZXBsYWNlciBmdW5jdGlvbiwgdGhlbiBjYWxsIHRoZSByZXBsYWNlciB0b1xuLy8gb2J0YWluIGEgcmVwbGFjZW1lbnQgdmFsdWUuXG5cbiAgICAgICAgaWYgKHR5cGVvZiByZXAgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHZhbHVlID0gcmVwLmNhbGwoaG9sZGVyLCBrZXksIHZhbHVlKTtcbiAgICAgICAgfVxuXG4vLyBXaGF0IGhhcHBlbnMgbmV4dCBkZXBlbmRzIG9uIHRoZSB2YWx1ZSdzIHR5cGUuXG5cbiAgICAgICAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcbiAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgIHJldHVybiBxdW90ZSh2YWx1ZSk7XG5cbiAgICAgICAgY2FzZSAnbnVtYmVyJzpcblxuLy8gSlNPTiBudW1iZXJzIG11c3QgYmUgZmluaXRlLiBFbmNvZGUgbm9uLWZpbml0ZSBudW1iZXJzIGFzIG51bGwuXG5cbiAgICAgICAgICAgIHJldHVybiBpc0Zpbml0ZSh2YWx1ZSkgPyBTdHJpbmcodmFsdWUpIDogJ251bGwnO1xuXG4gICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICBjYXNlICdudWxsJzpcblxuLy8gSWYgdGhlIHZhbHVlIGlzIGEgYm9vbGVhbiBvciBudWxsLCBjb252ZXJ0IGl0IHRvIGEgc3RyaW5nLiBOb3RlOlxuLy8gdHlwZW9mIG51bGwgZG9lcyBub3QgcHJvZHVjZSAnbnVsbCcuIFRoZSBjYXNlIGlzIGluY2x1ZGVkIGhlcmUgaW5cbi8vIHRoZSByZW1vdGUgY2hhbmNlIHRoYXQgdGhpcyBnZXRzIGZpeGVkIHNvbWVkYXkuXG5cbiAgICAgICAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuXG4vLyBJZiB0aGUgdHlwZSBpcyAnb2JqZWN0Jywgd2UgbWlnaHQgYmUgZGVhbGluZyB3aXRoIGFuIG9iamVjdCBvciBhbiBhcnJheSBvclxuLy8gbnVsbC5cblxuICAgICAgICBjYXNlICdvYmplY3QnOlxuXG4vLyBEdWUgdG8gYSBzcGVjaWZpY2F0aW9uIGJsdW5kZXIgaW4gRUNNQVNjcmlwdCwgdHlwZW9mIG51bGwgaXMgJ29iamVjdCcsXG4vLyBzbyB3YXRjaCBvdXQgZm9yIHRoYXQgY2FzZS5cblxuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnbnVsbCc7XG4gICAgICAgICAgICB9XG5cbi8vIE1ha2UgYW4gYXJyYXkgdG8gaG9sZCB0aGUgcGFydGlhbCByZXN1bHRzIG9mIHN0cmluZ2lmeWluZyB0aGlzIG9iamVjdCB2YWx1ZS5cblxuICAgICAgICAgICAgZ2FwICs9IGluZGVudDtcbiAgICAgICAgICAgIHBhcnRpYWwgPSBbXTtcblxuLy8gSXMgdGhlIHZhbHVlIGFuIGFycmF5P1xuXG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5hcHBseSh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcblxuLy8gVGhlIHZhbHVlIGlzIGFuIGFycmF5LiBTdHJpbmdpZnkgZXZlcnkgZWxlbWVudC4gVXNlIG51bGwgYXMgYSBwbGFjZWhvbGRlclxuLy8gZm9yIG5vbi1KU09OIHZhbHVlcy5cblxuICAgICAgICAgICAgICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFydGlhbFtpXSA9IHN0cihpLCB2YWx1ZSkgfHwgJ251bGwnO1xuICAgICAgICAgICAgICAgIH1cblxuLy8gSm9pbiBhbGwgb2YgdGhlIGVsZW1lbnRzIHRvZ2V0aGVyLCBzZXBhcmF0ZWQgd2l0aCBjb21tYXMsIGFuZCB3cmFwIHRoZW0gaW5cbi8vIGJyYWNrZXRzLlxuXG4gICAgICAgICAgICAgICAgdiA9IHBhcnRpYWwubGVuZ3RoID09PSAwXG4gICAgICAgICAgICAgICAgICAgID8gJ1tdJ1xuICAgICAgICAgICAgICAgICAgICA6IGdhcFxuICAgICAgICAgICAgICAgICAgICA/ICdbXFxuJyArIGdhcCArIHBhcnRpYWwuam9pbignLFxcbicgKyBnYXApICsgJ1xcbicgKyBtaW5kICsgJ10nXG4gICAgICAgICAgICAgICAgICAgIDogJ1snICsgcGFydGlhbC5qb2luKCcsJykgKyAnXSc7XG4gICAgICAgICAgICAgICAgZ2FwID0gbWluZDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgICAgIH1cblxuLy8gSWYgdGhlIHJlcGxhY2VyIGlzIGFuIGFycmF5LCB1c2UgaXQgdG8gc2VsZWN0IHRoZSBtZW1iZXJzIHRvIGJlIHN0cmluZ2lmaWVkLlxuXG4gICAgICAgICAgICBpZiAocmVwICYmIHR5cGVvZiByZXAgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gcmVwLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXBbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrID0gcmVwW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgdiA9IHN0cihrLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRpYWwucHVzaChxdW90ZShrKSArIChnYXAgPyAnOiAnIDogJzonKSArIHYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcblxuLy8gT3RoZXJ3aXNlLCBpdGVyYXRlIHRocm91Z2ggYWxsIG9mIHRoZSBrZXlzIGluIHRoZSBvYmplY3QuXG5cbiAgICAgICAgICAgICAgICBmb3IgKGsgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgaykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHYgPSBzdHIoaywgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0aWFsLnB1c2gocXVvdGUoaykgKyAoZ2FwID8gJzogJyA6ICc6JykgKyB2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuLy8gSm9pbiBhbGwgb2YgdGhlIG1lbWJlciB0ZXh0cyB0b2dldGhlciwgc2VwYXJhdGVkIHdpdGggY29tbWFzLFxuLy8gYW5kIHdyYXAgdGhlbSBpbiBicmFjZXMuXG5cbiAgICAgICAgICAgIHYgPSBwYXJ0aWFsLmxlbmd0aCA9PT0gMFxuICAgICAgICAgICAgICAgID8gJ3t9J1xuICAgICAgICAgICAgICAgIDogZ2FwXG4gICAgICAgICAgICAgICAgPyAne1xcbicgKyBnYXAgKyBwYXJ0aWFsLmpvaW4oJyxcXG4nICsgZ2FwKSArICdcXG4nICsgbWluZCArICd9J1xuICAgICAgICAgICAgICAgIDogJ3snICsgcGFydGlhbC5qb2luKCcsJykgKyAnfSc7XG4gICAgICAgICAgICBnYXAgPSBtaW5kO1xuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH1cbiAgICB9XG5cbi8vIElmIHRoZSBKU09OIG9iamVjdCBkb2VzIG5vdCB5ZXQgaGF2ZSBhIHN0cmluZ2lmeSBtZXRob2QsIGdpdmUgaXQgb25lLlxuXG4gICAgaWYgKHR5cGVvZiBKU09OLnN0cmluZ2lmeSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBKU09OLnN0cmluZ2lmeSA9IGZ1bmN0aW9uICh2YWx1ZSwgcmVwbGFjZXIsIHNwYWNlKSB7XG5cbi8vIFRoZSBzdHJpbmdpZnkgbWV0aG9kIHRha2VzIGEgdmFsdWUgYW5kIGFuIG9wdGlvbmFsIHJlcGxhY2VyLCBhbmQgYW4gb3B0aW9uYWxcbi8vIHNwYWNlIHBhcmFtZXRlciwgYW5kIHJldHVybnMgYSBKU09OIHRleHQuIFRoZSByZXBsYWNlciBjYW4gYmUgYSBmdW5jdGlvblxuLy8gdGhhdCBjYW4gcmVwbGFjZSB2YWx1ZXMsIG9yIGFuIGFycmF5IG9mIHN0cmluZ3MgdGhhdCB3aWxsIHNlbGVjdCB0aGUga2V5cy5cbi8vIEEgZGVmYXVsdCByZXBsYWNlciBtZXRob2QgY2FuIGJlIHByb3ZpZGVkLiBVc2Ugb2YgdGhlIHNwYWNlIHBhcmFtZXRlciBjYW5cbi8vIHByb2R1Y2UgdGV4dCB0aGF0IGlzIG1vcmUgZWFzaWx5IHJlYWRhYmxlLlxuXG4gICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgIGdhcCA9ICcnO1xuICAgICAgICAgICAgaW5kZW50ID0gJyc7XG5cbi8vIElmIHRoZSBzcGFjZSBwYXJhbWV0ZXIgaXMgYSBudW1iZXIsIG1ha2UgYW4gaW5kZW50IHN0cmluZyBjb250YWluaW5nIHRoYXRcbi8vIG1hbnkgc3BhY2VzLlxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNwYWNlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzcGFjZTsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGVudCArPSAnICc7XG4gICAgICAgICAgICAgICAgfVxuXG4vLyBJZiB0aGUgc3BhY2UgcGFyYW1ldGVyIGlzIGEgc3RyaW5nLCBpdCB3aWxsIGJlIHVzZWQgYXMgdGhlIGluZGVudCBzdHJpbmcuXG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNwYWNlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGluZGVudCA9IHNwYWNlO1xuICAgICAgICAgICAgfVxuXG4vLyBJZiB0aGVyZSBpcyBhIHJlcGxhY2VyLCBpdCBtdXN0IGJlIGEgZnVuY3Rpb24gb3IgYW4gYXJyYXkuXG4vLyBPdGhlcndpc2UsIHRocm93IGFuIGVycm9yLlxuXG4gICAgICAgICAgICByZXAgPSByZXBsYWNlcjtcbiAgICAgICAgICAgIGlmIChyZXBsYWNlciAmJiB0eXBlb2YgcmVwbGFjZXIgIT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgICAgICAgICAgICAgKHR5cGVvZiByZXBsYWNlciAhPT0gJ29iamVjdCcgfHxcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHJlcGxhY2VyLmxlbmd0aCAhPT0gJ251bWJlcicpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdKU09OLnN0cmluZ2lmeScpO1xuICAgICAgICAgICAgfVxuXG4vLyBNYWtlIGEgZmFrZSByb290IG9iamVjdCBjb250YWluaW5nIG91ciB2YWx1ZSB1bmRlciB0aGUga2V5IG9mICcnLlxuLy8gUmV0dXJuIHRoZSByZXN1bHQgb2Ygc3RyaW5naWZ5aW5nIHRoZSB2YWx1ZS5cblxuICAgICAgICAgICAgcmV0dXJuIHN0cignJywgeycnOiB2YWx1ZX0pO1xuICAgICAgICB9O1xuICAgIH1cblxuXG4vLyBJZiB0aGUgSlNPTiBvYmplY3QgZG9lcyBub3QgeWV0IGhhdmUgYSBwYXJzZSBtZXRob2QsIGdpdmUgaXQgb25lLlxuXG4gICAgaWYgKHR5cGVvZiBKU09OLnBhcnNlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIEpTT04ucGFyc2UgPSBmdW5jdGlvbiAodGV4dCwgcmV2aXZlcikge1xuXG4vLyBUaGUgcGFyc2UgbWV0aG9kIHRha2VzIGEgdGV4dCBhbmQgYW4gb3B0aW9uYWwgcmV2aXZlciBmdW5jdGlvbiwgYW5kIHJldHVybnNcbi8vIGEgSmF2YVNjcmlwdCB2YWx1ZSBpZiB0aGUgdGV4dCBpcyBhIHZhbGlkIEpTT04gdGV4dC5cblxuICAgICAgICAgICAgdmFyIGo7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHdhbGsoaG9sZGVyLCBrZXkpIHtcblxuLy8gVGhlIHdhbGsgbWV0aG9kIGlzIHVzZWQgdG8gcmVjdXJzaXZlbHkgd2FsayB0aGUgcmVzdWx0aW5nIHN0cnVjdHVyZSBzb1xuLy8gdGhhdCBtb2RpZmljYXRpb25zIGNhbiBiZSBtYWRlLlxuXG4gICAgICAgICAgICAgICAgdmFyIGssIHYsIHZhbHVlID0gaG9sZGVyW2tleV07XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCBrKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYgPSB3YWxrKHZhbHVlLCBrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlW2tdID0gdjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdmFsdWVba107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXZpdmVyLmNhbGwoaG9sZGVyLCBrZXksIHZhbHVlKTtcbiAgICAgICAgICAgIH1cblxuXG4vLyBQYXJzaW5nIGhhcHBlbnMgaW4gZm91ciBzdGFnZXMuIEluIHRoZSBmaXJzdCBzdGFnZSwgd2UgcmVwbGFjZSBjZXJ0YWluXG4vLyBVbmljb2RlIGNoYXJhY3RlcnMgd2l0aCBlc2NhcGUgc2VxdWVuY2VzLiBKYXZhU2NyaXB0IGhhbmRsZXMgbWFueSBjaGFyYWN0ZXJzXG4vLyBpbmNvcnJlY3RseSwgZWl0aGVyIHNpbGVudGx5IGRlbGV0aW5nIHRoZW0sIG9yIHRyZWF0aW5nIHRoZW0gYXMgbGluZSBlbmRpbmdzLlxuXG4gICAgICAgICAgICB0ZXh0ID0gU3RyaW5nKHRleHQpO1xuICAgICAgICAgICAgY3gubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICAgIGlmIChjeC50ZXN0KHRleHQpKSB7XG4gICAgICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShjeCwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdcXFxcdScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgKCcwMDAwJyArIGEuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikpLnNsaWNlKC00KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuLy8gSW4gdGhlIHNlY29uZCBzdGFnZSwgd2UgcnVuIHRoZSB0ZXh0IGFnYWluc3QgcmVndWxhciBleHByZXNzaW9ucyB0aGF0IGxvb2tcbi8vIGZvciBub24tSlNPTiBwYXR0ZXJucy4gV2UgYXJlIGVzcGVjaWFsbHkgY29uY2VybmVkIHdpdGggJygpJyBhbmQgJ25ldydcbi8vIGJlY2F1c2UgdGhleSBjYW4gY2F1c2UgaW52b2NhdGlvbiwgYW5kICc9JyBiZWNhdXNlIGl0IGNhbiBjYXVzZSBtdXRhdGlvbi5cbi8vIEJ1dCBqdXN0IHRvIGJlIHNhZmUsIHdlIHdhbnQgdG8gcmVqZWN0IGFsbCB1bmV4cGVjdGVkIGZvcm1zLlxuXG4vLyBXZSBzcGxpdCB0aGUgc2Vjb25kIHN0YWdlIGludG8gNCByZWdleHAgb3BlcmF0aW9ucyBpbiBvcmRlciB0byB3b3JrIGFyb3VuZFxuLy8gY3JpcHBsaW5nIGluZWZmaWNpZW5jaWVzIGluIElFJ3MgYW5kIFNhZmFyaSdzIHJlZ2V4cCBlbmdpbmVzLiBGaXJzdCB3ZVxuLy8gcmVwbGFjZSB0aGUgSlNPTiBiYWNrc2xhc2ggcGFpcnMgd2l0aCAnQCcgKGEgbm9uLUpTT04gY2hhcmFjdGVyKS4gU2Vjb25kLCB3ZVxuLy8gcmVwbGFjZSBhbGwgc2ltcGxlIHZhbHVlIHRva2VucyB3aXRoICddJyBjaGFyYWN0ZXJzLiBUaGlyZCwgd2UgZGVsZXRlIGFsbFxuLy8gb3BlbiBicmFja2V0cyB0aGF0IGZvbGxvdyBhIGNvbG9uIG9yIGNvbW1hIG9yIHRoYXQgYmVnaW4gdGhlIHRleHQuIEZpbmFsbHksXG4vLyB3ZSBsb29rIHRvIHNlZSB0aGF0IHRoZSByZW1haW5pbmcgY2hhcmFjdGVycyBhcmUgb25seSB3aGl0ZXNwYWNlIG9yICddJyBvclxuLy8gJywnIG9yICc6JyBvciAneycgb3IgJ30nLiBJZiB0aGF0IGlzIHNvLCB0aGVuIHRoZSB0ZXh0IGlzIHNhZmUgZm9yIGV2YWwuXG5cbiAgICAgICAgICAgIGlmICgvXltcXF0sOnt9XFxzXSokL1xuICAgICAgICAgICAgICAgICAgICAudGVzdCh0ZXh0LnJlcGxhY2UoL1xcXFwoPzpbXCJcXFxcXFwvYmZucnRdfHVbMC05YS1mQS1GXXs0fSkvZywgJ0AnKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1wiW15cIlxcXFxcXG5cXHJdKlwifHRydWV8ZmFsc2V8bnVsbHwtP1xcZCsoPzpcXC5cXGQqKT8oPzpbZUVdWytcXC1dP1xcZCspPy9nLCAnXScpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKD86Xnw6fCwpKD86XFxzKlxcWykrL2csICcnKSkpIHtcblxuLy8gSW4gdGhlIHRoaXJkIHN0YWdlIHdlIHVzZSB0aGUgZXZhbCBmdW5jdGlvbiB0byBjb21waWxlIHRoZSB0ZXh0IGludG8gYVxuLy8gSmF2YVNjcmlwdCBzdHJ1Y3R1cmUuIFRoZSAneycgb3BlcmF0b3IgaXMgc3ViamVjdCB0byBhIHN5bnRhY3RpYyBhbWJpZ3VpdHlcbi8vIGluIEphdmFTY3JpcHQ6IGl0IGNhbiBiZWdpbiBhIGJsb2NrIG9yIGFuIG9iamVjdCBsaXRlcmFsLiBXZSB3cmFwIHRoZSB0ZXh0XG4vLyBpbiBwYXJlbnMgdG8gZWxpbWluYXRlIHRoZSBhbWJpZ3VpdHkuXG5cbiAgICAgICAgICAgICAgICBqID0gZXZhbCgnKCcgKyB0ZXh0ICsgJyknKTtcblxuLy8gSW4gdGhlIG9wdGlvbmFsIGZvdXJ0aCBzdGFnZSwgd2UgcmVjdXJzaXZlbHkgd2FsayB0aGUgbmV3IHN0cnVjdHVyZSwgcGFzc2luZ1xuLy8gZWFjaCBuYW1lL3ZhbHVlIHBhaXIgdG8gYSByZXZpdmVyIGZ1bmN0aW9uIGZvciBwb3NzaWJsZSB0cmFuc2Zvcm1hdGlvbi5cblxuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgcmV2aXZlciA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgICAgICAgICAgICA/IHdhbGsoeycnOiBqfSwgJycpXG4gICAgICAgICAgICAgICAgICAgIDogajtcbiAgICAgICAgICAgIH1cblxuLy8gSWYgdGhlIHRleHQgaXMgbm90IEpTT04gcGFyc2VhYmxlLCB0aGVuIGEgU3ludGF4RXJyb3IgaXMgdGhyb3duLlxuXG4gICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoJ0pTT04ucGFyc2UnKTtcbiAgICAgICAgfTtcbiAgICB9XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEpTT04iLCIvKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXNcbiAqL1xuXG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdqc29ucCcpO1xuXG4vKipcbiAqIE1vZHVsZSBleHBvcnRzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ganNvbnA7XG5cbi8qKlxuICogQ2FsbGJhY2sgaW5kZXguXG4gKi9cblxudmFyIGNvdW50ID0gMDtcblxuLyoqXG4gKiBOb29wIGZ1bmN0aW9uLlxuICovXG5cbmZ1bmN0aW9uIG5vb3AoKXt9XG5cbi8qKlxuICogSlNPTlAgaGFuZGxlclxuICpcbiAqIE9wdGlvbnM6XG4gKiAgLSBwYXJhbSB7U3RyaW5nfSBxcyBwYXJhbWV0ZXIgKGBjYWxsYmFja2ApXG4gKiAgLSB0aW1lb3V0IHtOdW1iZXJ9IGhvdyBsb25nIGFmdGVyIGEgdGltZW91dCBlcnJvciBpcyBlbWl0dGVkIChgNjAwMDBgKVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7T2JqZWN0fEZ1bmN0aW9ufSBvcHRpb25hbCBvcHRpb25zIC8gY2FsbGJhY2tcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdGlvbmFsIGNhbGxiYWNrXG4gKi9cblxuZnVuY3Rpb24ganNvbnAodXJsLCBvcHRzLCBmbil7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBvcHRzKSB7XG4gICAgZm4gPSBvcHRzO1xuICAgIG9wdHMgPSB7fTtcbiAgfVxuICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcblxuICB2YXIgcHJlZml4ID0gb3B0cy5wcmVmaXggfHwgJ19fanAnO1xuICB2YXIgcGFyYW0gPSBvcHRzLnBhcmFtIHx8ICdjYWxsYmFjayc7XG4gIHZhciB0aW1lb3V0ID0gbnVsbCAhPSBvcHRzLnRpbWVvdXQgPyBvcHRzLnRpbWVvdXQgOiA2MDAwMDtcbiAgdmFyIGVuYyA9IGVuY29kZVVSSUNvbXBvbmVudDtcbiAgdmFyIHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKVswXSB8fCBkb2N1bWVudC5oZWFkO1xuICB2YXIgc2NyaXB0O1xuICB2YXIgdGltZXI7XG5cbiAgLy8gZ2VuZXJhdGUgYSB1bmlxdWUgaWQgZm9yIHRoaXMgcmVxdWVzdFxuICB2YXIgaWQgPSBwcmVmaXggKyAoY291bnQrKyk7XG5cbiAgaWYgKHRpbWVvdXQpIHtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIGNsZWFudXAoKTtcbiAgICAgIGlmIChmbikgZm4obmV3IEVycm9yKCdUaW1lb3V0JykpO1xuICAgIH0sIHRpbWVvdXQpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYW51cCgpe1xuICAgIHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XG4gICAgd2luZG93W2lkXSA9IG5vb3A7XG4gIH1cblxuICB3aW5kb3dbaWRdID0gZnVuY3Rpb24oZGF0YSl7XG4gICAgZGVidWcoJ2pzb25wIGdvdCcsIGRhdGEpO1xuICAgIGlmICh0aW1lcikgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICBjbGVhbnVwKCk7XG4gICAgaWYgKGZuKSBmbihudWxsLCBkYXRhKTtcbiAgfTtcblxuICAvLyBhZGQgcXMgY29tcG9uZW50XG4gIHVybCArPSAofnVybC5pbmRleE9mKCc/JykgPyAnJicgOiAnPycpICsgcGFyYW0gKyAnPScgKyBlbmMoaWQpO1xuICB1cmwgPSB1cmwucmVwbGFjZSgnPyYnLCAnPycpO1xuXG4gIGRlYnVnKCdqc29ucCByZXEgXCIlc1wiJywgdXJsKTtcblxuICAvLyBjcmVhdGUgc2NyaXB0XG4gIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICBzY3JpcHQuc3JjID0gdXJsO1xuICB0YXJnZXQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc2NyaXB0LCB0YXJnZXQpO1xufVxuIiwiLyoqXG4gKiBPYmplY3QjdG9TdHJpbmcoKSByZWYgZm9yIHN0cmluZ2lmeSgpLlxuICovXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKlxuICogT2JqZWN0I2hhc093blByb3BlcnR5IHJlZlxuICovXG5cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQXJyYXkjaW5kZXhPZiBzaGltLlxuICovXG5cbnZhciBpbmRleE9mID0gdHlwZW9mIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nXG4gID8gZnVuY3Rpb24oYXJyLCBlbCkgeyByZXR1cm4gYXJyLmluZGV4T2YoZWwpOyB9XG4gIDogZnVuY3Rpb24oYXJyLCBlbCkge1xuICAgICAgaWYgKHR5cGVvZiBhcnIgPT0gJ3N0cmluZycgJiYgdHlwZW9mIFwiYVwiWzBdID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGFyciA9IGFyci5zcGxpdCgnJyk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYXJyW2ldID09PSBlbCkgcmV0dXJuIGk7XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfTtcblxuLyoqXG4gKiBBcnJheS5pc0FycmF5IHNoaW0uXG4gKi9cblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKGFycikge1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG4vKipcbiAqIE9iamVjdC5rZXlzIHNoaW0uXG4gKi9cblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbihvYmopIHtcbiAgdmFyIHJldCA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICByZXQucHVzaChrZXkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmV0O1xufTtcblxuLyoqXG4gKiBBcnJheSNmb3JFYWNoIHNoaW0uXG4gKi9cblxudmFyIGZvckVhY2ggPSB0eXBlb2YgQXJyYXkucHJvdG90eXBlLmZvckVhY2ggPT09ICdmdW5jdGlvbidcbiAgPyBmdW5jdGlvbihhcnIsIGZuKSB7IHJldHVybiBhcnIuZm9yRWFjaChmbik7IH1cbiAgOiBmdW5jdGlvbihhcnIsIGZuKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgZm4oYXJyW2ldKTtcbiAgICB9O1xuXG4vKipcbiAqIEFycmF5I3JlZHVjZSBzaGltLlxuICovXG5cbnZhciByZWR1Y2UgPSBmdW5jdGlvbihhcnIsIGZuLCBpbml0aWFsKSB7XG4gIGlmICh0eXBlb2YgYXJyLnJlZHVjZSA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGFyci5yZWR1Y2UoZm4sIGluaXRpYWwpO1xuICB2YXIgcmVzID0gaW5pdGlhbDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHJlcyA9IGZuKHJlcywgYXJyW2ldKTtcbiAgcmV0dXJuIHJlcztcbn07XG5cbi8qKlxuICogQ2FjaGUgbm9uLWludGVnZXIgdGVzdCByZWdleHAuXG4gKi9cblxudmFyIGlzaW50ID0gL15bMC05XSskLztcblxuZnVuY3Rpb24gcHJvbW90ZShwYXJlbnQsIGtleSkge1xuICBpZiAocGFyZW50W2tleV0ubGVuZ3RoID09IDApIHJldHVybiBwYXJlbnRba2V5XSA9IHt9XG4gIHZhciB0ID0ge307XG4gIGZvciAodmFyIGkgaW4gcGFyZW50W2tleV0pIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChwYXJlbnRba2V5XSwgaSkpIHtcbiAgICAgIHRbaV0gPSBwYXJlbnRba2V5XVtpXTtcbiAgICB9XG4gIH1cbiAgcGFyZW50W2tleV0gPSB0O1xuICByZXR1cm4gdDtcbn1cblxuZnVuY3Rpb24gcGFyc2UocGFydHMsIHBhcmVudCwga2V5LCB2YWwpIHtcbiAgdmFyIHBhcnQgPSBwYXJ0cy5zaGlmdCgpO1xuXG4gIC8vIGlsbGVnYWxcbiAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoT2JqZWN0LnByb3RvdHlwZSwga2V5KSkgcmV0dXJuO1xuXG4gIC8vIGVuZFxuICBpZiAoIXBhcnQpIHtcbiAgICBpZiAoaXNBcnJheShwYXJlbnRba2V5XSkpIHtcbiAgICAgIHBhcmVudFtrZXldLnB1c2godmFsKTtcbiAgICB9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuICAgICAgcGFyZW50W2tleV0gPSB2YWw7XG4gICAgfSBlbHNlIGlmICgndW5kZWZpbmVkJyA9PSB0eXBlb2YgcGFyZW50W2tleV0pIHtcbiAgICAgIHBhcmVudFtrZXldID0gdmFsO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJlbnRba2V5XSA9IFtwYXJlbnRba2V5XSwgdmFsXTtcbiAgICB9XG4gICAgLy8gYXJyYXlcbiAgfSBlbHNlIHtcbiAgICB2YXIgb2JqID0gcGFyZW50W2tleV0gPSBwYXJlbnRba2V5XSB8fCBbXTtcbiAgICBpZiAoJ10nID09IHBhcnQpIHtcbiAgICAgIGlmIChpc0FycmF5KG9iaikpIHtcbiAgICAgICAgaWYgKCcnICE9IHZhbCkgb2JqLnB1c2godmFsKTtcbiAgICAgIH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIG9iaikge1xuICAgICAgICBvYmpbb2JqZWN0S2V5cyhvYmopLmxlbmd0aF0gPSB2YWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvYmogPSBwYXJlbnRba2V5XSA9IFtwYXJlbnRba2V5XSwgdmFsXTtcbiAgICAgIH1cbiAgICAgIC8vIHByb3BcbiAgICB9IGVsc2UgaWYgKH5pbmRleE9mKHBhcnQsICddJykpIHtcbiAgICAgIHBhcnQgPSBwYXJ0LnN1YnN0cigwLCBwYXJ0Lmxlbmd0aCAtIDEpO1xuICAgICAgaWYgKCFpc2ludC50ZXN0KHBhcnQpICYmIGlzQXJyYXkob2JqKSkgb2JqID0gcHJvbW90ZShwYXJlbnQsIGtleSk7XG4gICAgICBwYXJzZShwYXJ0cywgb2JqLCBwYXJ0LCB2YWwpO1xuICAgICAgLy8ga2V5XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghaXNpbnQudGVzdChwYXJ0KSAmJiBpc0FycmF5KG9iaikpIG9iaiA9IHByb21vdGUocGFyZW50LCBrZXkpO1xuICAgICAgcGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBNZXJnZSBwYXJlbnQga2V5L3ZhbCBwYWlyLlxuICovXG5cbmZ1bmN0aW9uIG1lcmdlKHBhcmVudCwga2V5LCB2YWwpe1xuICBpZiAofmluZGV4T2Yoa2V5LCAnXScpKSB7XG4gICAgdmFyIHBhcnRzID0ga2V5LnNwbGl0KCdbJylcbiAgICAgICwgbGVuID0gcGFydHMubGVuZ3RoXG4gICAgICAsIGxhc3QgPSBsZW4gLSAxO1xuICAgIHBhcnNlKHBhcnRzLCBwYXJlbnQsICdiYXNlJywgdmFsKTtcbiAgICAvLyBvcHRpbWl6ZVxuICB9IGVsc2Uge1xuICAgIGlmICghaXNpbnQudGVzdChrZXkpICYmIGlzQXJyYXkocGFyZW50LmJhc2UpKSB7XG4gICAgICB2YXIgdCA9IHt9O1xuICAgICAgZm9yICh2YXIgayBpbiBwYXJlbnQuYmFzZSkgdFtrXSA9IHBhcmVudC5iYXNlW2tdO1xuICAgICAgcGFyZW50LmJhc2UgPSB0O1xuICAgIH1cbiAgICBzZXQocGFyZW50LmJhc2UsIGtleSwgdmFsKTtcbiAgfVxuXG4gIHJldHVybiBwYXJlbnQ7XG59XG5cbi8qKlxuICogQ29tcGFjdCBzcGFyc2UgYXJyYXlzLlxuICovXG5cbmZ1bmN0aW9uIGNvbXBhY3Qob2JqKSB7XG4gIGlmICgnb2JqZWN0JyAhPSB0eXBlb2Ygb2JqKSByZXR1cm4gb2JqO1xuXG4gIGlmIChpc0FycmF5KG9iaikpIHtcbiAgICB2YXIgcmV0ID0gW107XG5cbiAgICBmb3IgKHZhciBpIGluIG9iaikge1xuICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwob2JqLCBpKSkge1xuICAgICAgICByZXQucHVzaChvYmpbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgb2JqW2tleV0gPSBjb21wYWN0KG9ialtrZXldKTtcbiAgfVxuXG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIG9iai5cbiAqL1xuXG5mdW5jdGlvbiBwYXJzZU9iamVjdChvYmope1xuICB2YXIgcmV0ID0geyBiYXNlOiB7fSB9O1xuXG4gIGZvckVhY2gob2JqZWN0S2V5cyhvYmopLCBmdW5jdGlvbihuYW1lKXtcbiAgICBtZXJnZShyZXQsIG5hbWUsIG9ialtuYW1lXSk7XG4gIH0pO1xuXG4gIHJldHVybiBjb21wYWN0KHJldC5iYXNlKTtcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gc3RyLlxuICovXG5cbmZ1bmN0aW9uIHBhcnNlU3RyaW5nKHN0ciwgb3B0aW9ucyl7XG4gIHZhciByZXQgPSByZWR1Y2UoU3RyaW5nKHN0cikuc3BsaXQob3B0aW9ucy5zZXBhcmF0b3IpLCBmdW5jdGlvbihyZXQsIHBhaXIpe1xuICAgIHZhciBlcWwgPSBpbmRleE9mKHBhaXIsICc9JylcbiAgICAgICwgYnJhY2UgPSBsYXN0QnJhY2VJbktleShwYWlyKVxuICAgICAgLCBrZXkgPSBwYWlyLnN1YnN0cigwLCBicmFjZSB8fCBlcWwpXG4gICAgICAsIHZhbCA9IHBhaXIuc3Vic3RyKGJyYWNlIHx8IGVxbCwgcGFpci5sZW5ndGgpXG4gICAgICAsIHZhbCA9IHZhbC5zdWJzdHIoaW5kZXhPZih2YWwsICc9JykgKyAxLCB2YWwubGVuZ3RoKTtcblxuICAgIC8vID9mb29cbiAgICBpZiAoJycgPT0ga2V5KSBrZXkgPSBwYWlyLCB2YWwgPSAnJztcbiAgICBpZiAoJycgPT0ga2V5KSByZXR1cm4gcmV0O1xuXG4gICAgcmV0dXJuIG1lcmdlKHJldCwgZGVjb2RlKGtleSksIGRlY29kZSh2YWwpKTtcbiAgfSwgeyBiYXNlOiB7fSB9KS5iYXNlO1xuXG4gIHJldHVybiBjb21wYWN0KHJldCk7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIHF1ZXJ5IGBzdHJgIG9yIGBvYmpgLCByZXR1cm5pbmcgYW4gb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgfCB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uKHN0ciwgb3B0aW9ucyl7XG4gIGlmIChudWxsID09IHN0ciB8fCAnJyA9PSBzdHIpIHJldHVybiB7fTtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIG9wdGlvbnMuc2VwYXJhdG9yID0gb3B0aW9ucy5zZXBhcmF0b3IgfHwgJyYnO1xuICByZXR1cm4gJ29iamVjdCcgPT0gdHlwZW9mIHN0clxuICAgID8gcGFyc2VPYmplY3Qoc3RyKVxuICAgIDogcGFyc2VTdHJpbmcoc3RyLCBvcHRpb25zKTtcbn07XG5cbi8qKlxuICogVHVybiB0aGUgZ2l2ZW4gYG9iamAgaW50byBhIHF1ZXJ5IHN0cmluZ1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxudmFyIHN0cmluZ2lmeSA9IGV4cG9ydHMuc3RyaW5naWZ5ID0gZnVuY3Rpb24ob2JqLCBwcmVmaXgpIHtcbiAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgIHJldHVybiBzdHJpbmdpZnlBcnJheShvYmosIHByZWZpeCk7XG4gIH0gZWxzZSBpZiAoJ1tvYmplY3QgT2JqZWN0XScgPT0gdG9TdHJpbmcuY2FsbChvYmopKSB7XG4gICAgcmV0dXJuIHN0cmluZ2lmeU9iamVjdChvYmosIHByZWZpeCk7XG4gIH0gZWxzZSBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIG9iaikge1xuICAgIHJldHVybiBzdHJpbmdpZnlTdHJpbmcob2JqLCBwcmVmaXgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBwcmVmaXggKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQoU3RyaW5nKG9iaikpO1xuICB9XG59O1xuXG4vKipcbiAqIFN0cmluZ2lmeSB0aGUgZ2l2ZW4gYHN0cmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHBhcmFtIHtTdHJpbmd9IHByZWZpeFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc3RyaW5naWZ5U3RyaW5nKHN0ciwgcHJlZml4KSB7XG4gIGlmICghcHJlZml4KSB0aHJvdyBuZXcgVHlwZUVycm9yKCdzdHJpbmdpZnkgZXhwZWN0cyBhbiBvYmplY3QnKTtcbiAgcmV0dXJuIHByZWZpeCArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChzdHIpO1xufVxuXG4vKipcbiAqIFN0cmluZ2lmeSB0aGUgZ2l2ZW4gYGFycmAuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJlZml4XG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzdHJpbmdpZnlBcnJheShhcnIsIHByZWZpeCkge1xuICB2YXIgcmV0ID0gW107XG4gIGlmICghcHJlZml4KSB0aHJvdyBuZXcgVHlwZUVycm9yKCdzdHJpbmdpZnkgZXhwZWN0cyBhbiBvYmplY3QnKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICByZXQucHVzaChzdHJpbmdpZnkoYXJyW2ldLCBwcmVmaXggKyAnWycgKyBpICsgJ10nKSk7XG4gIH1cbiAgcmV0dXJuIHJldC5qb2luKCcmJyk7XG59XG5cbi8qKlxuICogU3RyaW5naWZ5IHRoZSBnaXZlbiBgb2JqYC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJlZml4XG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzdHJpbmdpZnlPYmplY3Qob2JqLCBwcmVmaXgpIHtcbiAgdmFyIHJldCA9IFtdXG4gICAgLCBrZXlzID0gb2JqZWN0S2V5cyhvYmopXG4gICAgLCBrZXk7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBrZXkgPSBrZXlzW2ldO1xuICAgIGlmICgnJyA9PSBrZXkpIGNvbnRpbnVlO1xuICAgIGlmIChudWxsID09IG9ialtrZXldKSB7XG4gICAgICByZXQucHVzaChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArICc9Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldC5wdXNoKHN0cmluZ2lmeShvYmpba2V5XSwgcHJlZml4XG4gICAgICAgID8gcHJlZml4ICsgJ1snICsgZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyAnXSdcbiAgICAgICAgOiBlbmNvZGVVUklDb21wb25lbnQoa2V5KSkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXQuam9pbignJicpO1xufVxuXG4vKipcbiAqIFNldCBgb2JqYCdzIGBrZXlgIHRvIGB2YWxgIHJlc3BlY3RpbmdcbiAqIHRoZSB3ZWlyZCBhbmQgd29uZGVyZnVsIHN5bnRheCBvZiBhIHFzLFxuICogd2hlcmUgXCJmb289YmFyJmZvbz1iYXpcIiBiZWNvbWVzIGFuIGFycmF5LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWxcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNldChvYmosIGtleSwgdmFsKSB7XG4gIHZhciB2ID0gb2JqW2tleV07XG4gIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKE9iamVjdC5wcm90b3R5cGUsIGtleSkpIHJldHVybjtcbiAgaWYgKHVuZGVmaW5lZCA9PT0gdikge1xuICAgIG9ialtrZXldID0gdmFsO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodikpIHtcbiAgICB2LnB1c2godmFsKTtcbiAgfSBlbHNlIHtcbiAgICBvYmpba2V5XSA9IFt2LCB2YWxdO1xuICB9XG59XG5cbi8qKlxuICogTG9jYXRlIGxhc3QgYnJhY2UgaW4gYHN0cmAgd2l0aGluIHRoZSBrZXkuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbGFzdEJyYWNlSW5LZXkoc3RyKSB7XG4gIHZhciBsZW4gPSBzdHIubGVuZ3RoXG4gICAgLCBicmFjZVxuICAgICwgYztcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIGMgPSBzdHJbaV07XG4gICAgaWYgKCddJyA9PSBjKSBicmFjZSA9IGZhbHNlO1xuICAgIGlmICgnWycgPT0gYykgYnJhY2UgPSB0cnVlO1xuICAgIGlmICgnPScgPT0gYyAmJiAhYnJhY2UpIHJldHVybiBpO1xuICB9XG59XG5cbi8qKlxuICogRGVjb2RlIGBzdHJgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGRlY29kZShzdHIpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHN0ci5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cbiIsIi8qIVxuICAqIFJlcXdlc3QhIEEgZ2VuZXJhbCBwdXJwb3NlIFhIUiBjb25uZWN0aW9uIG1hbmFnZXJcbiAgKiBsaWNlbnNlIE1JVCAoYykgRHVzdGluIERpYXogMjAxNFxuICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9kZWQvcmVxd2VzdFxuICAqL1xuXG4hZnVuY3Rpb24gKG5hbWUsIGNvbnRleHQsIGRlZmluaXRpb24pIHtcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpXG4gIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSBkZWZpbmUoZGVmaW5pdGlvbilcbiAgZWxzZSBjb250ZXh0W25hbWVdID0gZGVmaW5pdGlvbigpXG59KCdyZXF3ZXN0JywgdGhpcywgZnVuY3Rpb24gKCkge1xuXG4gIHZhciB3aW4gPSB3aW5kb3dcbiAgICAsIGRvYyA9IGRvY3VtZW50XG4gICAgLCBodHRwc1JlID0gL15odHRwL1xuICAgICwgcHJvdG9jb2xSZSA9IC8oXlxcdyspOlxcL1xcLy9cbiAgICAsIHR3b0h1bmRvID0gL14oMjBcXGR8MTIyMykkLyAvL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTAwNDY5NzIvbXNpZS1yZXR1cm5zLXN0YXR1cy1jb2RlLW9mLTEyMjMtZm9yLWFqYXgtcmVxdWVzdFxuICAgICwgYnlUYWcgPSAnZ2V0RWxlbWVudHNCeVRhZ05hbWUnXG4gICAgLCByZWFkeVN0YXRlID0gJ3JlYWR5U3RhdGUnXG4gICAgLCBjb250ZW50VHlwZSA9ICdDb250ZW50LVR5cGUnXG4gICAgLCByZXF1ZXN0ZWRXaXRoID0gJ1gtUmVxdWVzdGVkLVdpdGgnXG4gICAgLCBoZWFkID0gZG9jW2J5VGFnXSgnaGVhZCcpWzBdXG4gICAgLCB1bmlxaWQgPSAwXG4gICAgLCBjYWxsYmFja1ByZWZpeCA9ICdyZXF3ZXN0XycgKyAoK25ldyBEYXRlKCkpXG4gICAgLCBsYXN0VmFsdWUgLy8gZGF0YSBzdG9yZWQgYnkgdGhlIG1vc3QgcmVjZW50IEpTT05QIGNhbGxiYWNrXG4gICAgLCB4bWxIdHRwUmVxdWVzdCA9ICdYTUxIdHRwUmVxdWVzdCdcbiAgICAsIHhEb21haW5SZXF1ZXN0ID0gJ1hEb21haW5SZXF1ZXN0J1xuICAgICwgbm9vcCA9IGZ1bmN0aW9uICgpIHt9XG5cbiAgICAsIGlzQXJyYXkgPSB0eXBlb2YgQXJyYXkuaXNBcnJheSA9PSAnZnVuY3Rpb24nXG4gICAgICAgID8gQXJyYXkuaXNBcnJheVxuICAgICAgICA6IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICByZXR1cm4gYSBpbnN0YW5jZW9mIEFycmF5XG4gICAgICAgICAgfVxuXG4gICAgLCBkZWZhdWx0SGVhZGVycyA9IHtcbiAgICAgICAgICAnY29udGVudFR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ1xuICAgICAgICAsICdyZXF1ZXN0ZWRXaXRoJzogeG1sSHR0cFJlcXVlc3RcbiAgICAgICAgLCAnYWNjZXB0Jzoge1xuICAgICAgICAgICAgICAnKic6ICAndGV4dC9qYXZhc2NyaXB0LCB0ZXh0L2h0bWwsIGFwcGxpY2F0aW9uL3htbCwgdGV4dC94bWwsICovKidcbiAgICAgICAgICAgICwgJ3htbCc6ICAnYXBwbGljYXRpb24veG1sLCB0ZXh0L3htbCdcbiAgICAgICAgICAgICwgJ2h0bWwnOiAndGV4dC9odG1sJ1xuICAgICAgICAgICAgLCAndGV4dCc6ICd0ZXh0L3BsYWluJ1xuICAgICAgICAgICAgLCAnanNvbic6ICdhcHBsaWNhdGlvbi9qc29uLCB0ZXh0L2phdmFzY3JpcHQnXG4gICAgICAgICAgICAsICdqcyc6ICAgJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQsIHRleHQvamF2YXNjcmlwdCdcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAsIHhociA9IGZ1bmN0aW9uKG8pIHtcbiAgICAgICAgLy8gaXMgaXQgeC1kb21haW5cbiAgICAgICAgaWYgKG9bJ2Nyb3NzT3JpZ2luJ10gPT09IHRydWUpIHtcbiAgICAgICAgICB2YXIgeGhyID0gd2luW3htbEh0dHBSZXF1ZXN0XSA/IG5ldyBYTUxIdHRwUmVxdWVzdCgpIDogbnVsbFxuICAgICAgICAgIGlmICh4aHIgJiYgJ3dpdGhDcmVkZW50aWFscycgaW4geGhyKSB7XG4gICAgICAgICAgICByZXR1cm4geGhyXG4gICAgICAgICAgfSBlbHNlIGlmICh3aW5beERvbWFpblJlcXVlc3RdKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhEb21haW5SZXF1ZXN0KClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCcm93c2VyIGRvZXMgbm90IHN1cHBvcnQgY3Jvc3Mtb3JpZ2luIHJlcXVlc3RzJylcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAod2luW3htbEh0dHBSZXF1ZXN0XSkge1xuICAgICAgICAgIHJldHVybiBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgLCBnbG9iYWxTZXR1cE9wdGlvbnMgPSB7XG4gICAgICAgIGRhdGFGaWx0ZXI6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgcmV0dXJuIGRhdGFcbiAgICAgICAgfVxuICAgICAgfVxuXG4gIGZ1bmN0aW9uIHN1Y2NlZWQocikge1xuICAgIHZhciBwcm90b2NvbCA9IHByb3RvY29sUmUuZXhlYyhyLnVybCk7XG4gICAgcHJvdG9jb2wgPSAocHJvdG9jb2wgJiYgcHJvdG9jb2xbMV0pIHx8IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbDtcbiAgICByZXR1cm4gaHR0cHNSZS50ZXN0KHByb3RvY29sKSA/IHR3b0h1bmRvLnRlc3Qoci5yZXF1ZXN0LnN0YXR1cykgOiAhIXIucmVxdWVzdC5yZXNwb25zZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVJlYWR5U3RhdGUociwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgLy8gdXNlIF9hYm9ydGVkIHRvIG1pdGlnYXRlIGFnYWluc3QgSUUgZXJyIGMwMGMwMjNmXG4gICAgICAvLyAoY2FuJ3QgcmVhZCBwcm9wcyBvbiBhYm9ydGVkIHJlcXVlc3Qgb2JqZWN0cylcbiAgICAgIGlmIChyLl9hYm9ydGVkKSByZXR1cm4gZXJyb3Ioci5yZXF1ZXN0KVxuICAgICAgaWYgKHIuX3RpbWVkT3V0KSByZXR1cm4gZXJyb3Ioci5yZXF1ZXN0LCAnUmVxdWVzdCBpcyBhYm9ydGVkOiB0aW1lb3V0JylcbiAgICAgIGlmIChyLnJlcXVlc3QgJiYgci5yZXF1ZXN0W3JlYWR5U3RhdGVdID09IDQpIHtcbiAgICAgICAgci5yZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG5vb3BcbiAgICAgICAgaWYgKHN1Y2NlZWQocikpIHN1Y2Nlc3Moci5yZXF1ZXN0KVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZXJyb3Ioci5yZXF1ZXN0KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEhlYWRlcnMoaHR0cCwgbykge1xuICAgIHZhciBoZWFkZXJzID0gb1snaGVhZGVycyddIHx8IHt9XG4gICAgICAsIGhcblxuICAgIGhlYWRlcnNbJ0FjY2VwdCddID0gaGVhZGVyc1snQWNjZXB0J11cbiAgICAgIHx8IGRlZmF1bHRIZWFkZXJzWydhY2NlcHQnXVtvWyd0eXBlJ11dXG4gICAgICB8fCBkZWZhdWx0SGVhZGVyc1snYWNjZXB0J11bJyonXVxuXG4gICAgdmFyIGlzQUZvcm1EYXRhID0gdHlwZW9mIEZvcm1EYXRhID09PSAnZnVuY3Rpb24nICYmIChvWydkYXRhJ10gaW5zdGFuY2VvZiBGb3JtRGF0YSk7XG4gICAgLy8gYnJlYWtzIGNyb3NzLW9yaWdpbiByZXF1ZXN0cyB3aXRoIGxlZ2FjeSBicm93c2Vyc1xuICAgIGlmICghb1snY3Jvc3NPcmlnaW4nXSAmJiAhaGVhZGVyc1tyZXF1ZXN0ZWRXaXRoXSkgaGVhZGVyc1tyZXF1ZXN0ZWRXaXRoXSA9IGRlZmF1bHRIZWFkZXJzWydyZXF1ZXN0ZWRXaXRoJ11cbiAgICBpZiAoIWhlYWRlcnNbY29udGVudFR5cGVdICYmICFpc0FGb3JtRGF0YSkgaGVhZGVyc1tjb250ZW50VHlwZV0gPSBvWydjb250ZW50VHlwZSddIHx8IGRlZmF1bHRIZWFkZXJzWydjb250ZW50VHlwZSddXG4gICAgZm9yIChoIGluIGhlYWRlcnMpXG4gICAgICBoZWFkZXJzLmhhc093blByb3BlcnR5KGgpICYmICdzZXRSZXF1ZXN0SGVhZGVyJyBpbiBodHRwICYmIGh0dHAuc2V0UmVxdWVzdEhlYWRlcihoLCBoZWFkZXJzW2hdKVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0Q3JlZGVudGlhbHMoaHR0cCwgbykge1xuICAgIGlmICh0eXBlb2Ygb1snd2l0aENyZWRlbnRpYWxzJ10gIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBodHRwLndpdGhDcmVkZW50aWFscyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGh0dHAud2l0aENyZWRlbnRpYWxzID0gISFvWyd3aXRoQ3JlZGVudGlhbHMnXVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYWxDYWxsYmFjayhkYXRhKSB7XG4gICAgbGFzdFZhbHVlID0gZGF0YVxuICB9XG5cbiAgZnVuY3Rpb24gdXJsYXBwZW5kICh1cmwsIHMpIHtcbiAgICByZXR1cm4gdXJsICsgKC9cXD8vLnRlc3QodXJsKSA/ICcmJyA6ICc/JykgKyBzXG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVKc29ucChvLCBmbiwgZXJyLCB1cmwpIHtcbiAgICB2YXIgcmVxSWQgPSB1bmlxaWQrK1xuICAgICAgLCBjYmtleSA9IG9bJ2pzb25wQ2FsbGJhY2snXSB8fCAnY2FsbGJhY2snIC8vIHRoZSAnY2FsbGJhY2snIGtleVxuICAgICAgLCBjYnZhbCA9IG9bJ2pzb25wQ2FsbGJhY2tOYW1lJ10gfHwgcmVxd2VzdC5nZXRjYWxsYmFja1ByZWZpeChyZXFJZClcbiAgICAgICwgY2JyZWcgPSBuZXcgUmVnRXhwKCcoKF58XFxcXD98JiknICsgY2JrZXkgKyAnKT0oW14mXSspJylcbiAgICAgICwgbWF0Y2ggPSB1cmwubWF0Y2goY2JyZWcpXG4gICAgICAsIHNjcmlwdCA9IGRvYy5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuICAgICAgLCBsb2FkZWQgPSAwXG4gICAgICAsIGlzSUUxMCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignTVNJRSAxMC4wJykgIT09IC0xXG5cbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGlmIChtYXRjaFszXSA9PT0gJz8nKSB7XG4gICAgICAgIHVybCA9IHVybC5yZXBsYWNlKGNicmVnLCAnJDE9JyArIGNidmFsKSAvLyB3aWxkY2FyZCBjYWxsYmFjayBmdW5jIG5hbWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNidmFsID0gbWF0Y2hbM10gLy8gcHJvdmlkZWQgY2FsbGJhY2sgZnVuYyBuYW1lXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHVybCA9IHVybGFwcGVuZCh1cmwsIGNia2V5ICsgJz0nICsgY2J2YWwpIC8vIG5vIGNhbGxiYWNrIGRldGFpbHMsIGFkZCAnZW1cbiAgICB9XG5cbiAgICB3aW5bY2J2YWxdID0gZ2VuZXJhbENhbGxiYWNrXG5cbiAgICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnXG4gICAgc2NyaXB0LnNyYyA9IHVybFxuICAgIHNjcmlwdC5hc3luYyA9IHRydWVcbiAgICBpZiAodHlwZW9mIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgIT09ICd1bmRlZmluZWQnICYmICFpc0lFMTApIHtcbiAgICAgIC8vIG5lZWQgdGhpcyBmb3IgSUUgZHVlIHRvIG91dC1vZi1vcmRlciBvbnJlYWR5c3RhdGVjaGFuZ2UoKSwgYmluZGluZyBzY3JpcHRcbiAgICAgIC8vIGV4ZWN1dGlvbiB0byBhbiBldmVudCBsaXN0ZW5lciBnaXZlcyB1cyBjb250cm9sIG92ZXIgd2hlbiB0aGUgc2NyaXB0XG4gICAgICAvLyBpcyBleGVjdXRlZC4gU2VlIGh0dHA6Ly9qYXVib3VyZy5uZXQvMjAxMC8wNy9sb2FkaW5nLXNjcmlwdC1hcy1vbmNsaWNrLWhhbmRsZXItb2YuaHRtbFxuICAgICAgc2NyaXB0Lmh0bWxGb3IgPSBzY3JpcHQuaWQgPSAnX3JlcXdlc3RfJyArIHJlcUlkXG4gICAgfVxuXG4gICAgc2NyaXB0Lm9ubG9hZCA9IHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoKHNjcmlwdFtyZWFkeVN0YXRlXSAmJiBzY3JpcHRbcmVhZHlTdGF0ZV0gIT09ICdjb21wbGV0ZScgJiYgc2NyaXB0W3JlYWR5U3RhdGVdICE9PSAnbG9hZGVkJykgfHwgbG9hZGVkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgc2NyaXB0Lm9ubG9hZCA9IHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsXG4gICAgICBzY3JpcHQub25jbGljayAmJiBzY3JpcHQub25jbGljaygpXG4gICAgICAvLyBDYWxsIHRoZSB1c2VyIGNhbGxiYWNrIHdpdGggdGhlIGxhc3QgdmFsdWUgc3RvcmVkIGFuZCBjbGVhbiB1cCB2YWx1ZXMgYW5kIHNjcmlwdHMuXG4gICAgICBmbihsYXN0VmFsdWUpXG4gICAgICBsYXN0VmFsdWUgPSB1bmRlZmluZWRcbiAgICAgIGhlYWQucmVtb3ZlQ2hpbGQoc2NyaXB0KVxuICAgICAgbG9hZGVkID0gMVxuICAgIH1cblxuICAgIC8vIEFkZCB0aGUgc2NyaXB0IHRvIHRoZSBET00gaGVhZFxuICAgIGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KVxuXG4gICAgLy8gRW5hYmxlIEpTT05QIHRpbWVvdXRcbiAgICByZXR1cm4ge1xuICAgICAgYWJvcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsXG4gICAgICAgIGVycih7fSwgJ1JlcXVlc3QgaXMgYWJvcnRlZDogdGltZW91dCcsIHt9KVxuICAgICAgICBsYXN0VmFsdWUgPSB1bmRlZmluZWRcbiAgICAgICAgaGVhZC5yZW1vdmVDaGlsZChzY3JpcHQpXG4gICAgICAgIGxvYWRlZCA9IDFcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRSZXF1ZXN0KGZuLCBlcnIpIHtcbiAgICB2YXIgbyA9IHRoaXMub1xuICAgICAgLCBtZXRob2QgPSAob1snbWV0aG9kJ10gfHwgJ0dFVCcpLnRvVXBwZXJDYXNlKClcbiAgICAgICwgdXJsID0gdHlwZW9mIG8gPT09ICdzdHJpbmcnID8gbyA6IG9bJ3VybCddXG4gICAgICAvLyBjb252ZXJ0IG5vbi1zdHJpbmcgb2JqZWN0cyB0byBxdWVyeS1zdHJpbmcgZm9ybSB1bmxlc3Mgb1sncHJvY2Vzc0RhdGEnXSBpcyBmYWxzZVxuICAgICAgLCBkYXRhID0gKG9bJ3Byb2Nlc3NEYXRhJ10gIT09IGZhbHNlICYmIG9bJ2RhdGEnXSAmJiB0eXBlb2Ygb1snZGF0YSddICE9PSAnc3RyaW5nJylcbiAgICAgICAgPyByZXF3ZXN0LnRvUXVlcnlTdHJpbmcob1snZGF0YSddKVxuICAgICAgICA6IChvWydkYXRhJ10gfHwgbnVsbClcbiAgICAgICwgaHR0cFxuICAgICAgLCBzZW5kV2FpdCA9IGZhbHNlXG5cbiAgICAvLyBpZiB3ZSdyZSB3b3JraW5nIG9uIGEgR0VUIHJlcXVlc3QgYW5kIHdlIGhhdmUgZGF0YSB0aGVuIHdlIHNob3VsZCBhcHBlbmRcbiAgICAvLyBxdWVyeSBzdHJpbmcgdG8gZW5kIG9mIFVSTCBhbmQgbm90IHBvc3QgZGF0YVxuICAgIGlmICgob1sndHlwZSddID09ICdqc29ucCcgfHwgbWV0aG9kID09ICdHRVQnKSAmJiBkYXRhKSB7XG4gICAgICB1cmwgPSB1cmxhcHBlbmQodXJsLCBkYXRhKVxuICAgICAgZGF0YSA9IG51bGxcbiAgICB9XG5cbiAgICBpZiAob1sndHlwZSddID09ICdqc29ucCcpIHJldHVybiBoYW5kbGVKc29ucChvLCBmbiwgZXJyLCB1cmwpXG5cbiAgICAvLyBnZXQgdGhlIHhociBmcm9tIHRoZSBmYWN0b3J5IGlmIHBhc3NlZFxuICAgIC8vIGlmIHRoZSBmYWN0b3J5IHJldHVybnMgbnVsbCwgZmFsbC1iYWNrIHRvIG91cnNcbiAgICBodHRwID0gKG8ueGhyICYmIG8ueGhyKG8pKSB8fCB4aHIobylcblxuICAgIGh0dHAub3BlbihtZXRob2QsIHVybCwgb1snYXN5bmMnXSA9PT0gZmFsc2UgPyBmYWxzZSA6IHRydWUpXG4gICAgc2V0SGVhZGVycyhodHRwLCBvKVxuICAgIHNldENyZWRlbnRpYWxzKGh0dHAsIG8pXG4gICAgaWYgKHdpblt4RG9tYWluUmVxdWVzdF0gJiYgaHR0cCBpbnN0YW5jZW9mIHdpblt4RG9tYWluUmVxdWVzdF0pIHtcbiAgICAgICAgaHR0cC5vbmxvYWQgPSBmblxuICAgICAgICBodHRwLm9uZXJyb3IgPSBlcnJcbiAgICAgICAgLy8gTk9URTogc2VlXG4gICAgICAgIC8vIGh0dHA6Ly9zb2NpYWwubXNkbi5taWNyb3NvZnQuY29tL0ZvcnVtcy9lbi1VUy9pZXdlYmRldmVsb3BtZW50L3RocmVhZC8zMGVmM2FkZC03NjdjLTQ0MzYtYjhhOS1mMWNhMTliNDgxMmVcbiAgICAgICAgaHR0cC5vbnByb2dyZXNzID0gZnVuY3Rpb24oKSB7fVxuICAgICAgICBzZW5kV2FpdCA9IHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgaHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBoYW5kbGVSZWFkeVN0YXRlKHRoaXMsIGZuLCBlcnIpXG4gICAgfVxuICAgIG9bJ2JlZm9yZSddICYmIG9bJ2JlZm9yZSddKGh0dHApXG4gICAgaWYgKHNlbmRXYWl0KSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaHR0cC5zZW5kKGRhdGEpXG4gICAgICB9LCAyMDApXG4gICAgfSBlbHNlIHtcbiAgICAgIGh0dHAuc2VuZChkYXRhKVxuICAgIH1cbiAgICByZXR1cm4gaHR0cFxuICB9XG5cbiAgZnVuY3Rpb24gUmVxd2VzdChvLCBmbikge1xuICAgIHRoaXMubyA9IG9cbiAgICB0aGlzLmZuID0gZm5cblxuICAgIGluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0VHlwZShoZWFkZXIpIHtcbiAgICAvLyBqc29uLCBqYXZhc2NyaXB0LCB0ZXh0L3BsYWluLCB0ZXh0L2h0bWwsIHhtbFxuICAgIGlmIChoZWFkZXIubWF0Y2goJ2pzb24nKSkgcmV0dXJuICdqc29uJ1xuICAgIGlmIChoZWFkZXIubWF0Y2goJ2phdmFzY3JpcHQnKSkgcmV0dXJuICdqcydcbiAgICBpZiAoaGVhZGVyLm1hdGNoKCd0ZXh0JykpIHJldHVybiAnaHRtbCdcbiAgICBpZiAoaGVhZGVyLm1hdGNoKCd4bWwnKSkgcmV0dXJuICd4bWwnXG4gIH1cblxuICBmdW5jdGlvbiBpbml0KG8sIGZuKSB7XG5cbiAgICB0aGlzLnVybCA9IHR5cGVvZiBvID09ICdzdHJpbmcnID8gbyA6IG9bJ3VybCddXG4gICAgdGhpcy50aW1lb3V0ID0gbnVsbFxuXG4gICAgLy8gd2hldGhlciByZXF1ZXN0IGhhcyBiZWVuIGZ1bGZpbGxlZCBmb3IgcHVycG9zZVxuICAgIC8vIG9mIHRyYWNraW5nIHRoZSBQcm9taXNlc1xuICAgIHRoaXMuX2Z1bGZpbGxlZCA9IGZhbHNlXG4gICAgLy8gc3VjY2VzcyBoYW5kbGVyc1xuICAgIHRoaXMuX3N1Y2Nlc3NIYW5kbGVyID0gZnVuY3Rpb24oKXt9XG4gICAgdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVycyA9IFtdXG4gICAgLy8gZXJyb3IgaGFuZGxlcnNcbiAgICB0aGlzLl9lcnJvckhhbmRsZXJzID0gW11cbiAgICAvLyBjb21wbGV0ZSAoYm90aCBzdWNjZXNzIGFuZCBmYWlsKSBoYW5kbGVyc1xuICAgIHRoaXMuX2NvbXBsZXRlSGFuZGxlcnMgPSBbXVxuICAgIHRoaXMuX2VycmVkID0gZmFsc2VcbiAgICB0aGlzLl9yZXNwb25zZUFyZ3MgPSB7fVxuXG4gICAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgICBmbiA9IGZuIHx8IGZ1bmN0aW9uICgpIHt9XG5cbiAgICBpZiAob1sndGltZW91dCddKSB7XG4gICAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGltZWRPdXQoKVxuICAgICAgfSwgb1sndGltZW91dCddKVxuICAgIH1cblxuICAgIGlmIChvWydzdWNjZXNzJ10pIHtcbiAgICAgIHRoaXMuX3N1Y2Nlc3NIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBvWydzdWNjZXNzJ10uYXBwbHkobywgYXJndW1lbnRzKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvWydlcnJvciddKSB7XG4gICAgICB0aGlzLl9lcnJvckhhbmRsZXJzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICBvWydlcnJvciddLmFwcGx5KG8sIGFyZ3VtZW50cylcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKG9bJ2NvbXBsZXRlJ10pIHtcbiAgICAgIHRoaXMuX2NvbXBsZXRlSGFuZGxlcnMucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9bJ2NvbXBsZXRlJ10uYXBwbHkobywgYXJndW1lbnRzKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wbGV0ZSAocmVzcCkge1xuICAgICAgb1sndGltZW91dCddICYmIGNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpXG4gICAgICBzZWxmLnRpbWVvdXQgPSBudWxsXG4gICAgICB3aGlsZSAoc2VsZi5fY29tcGxldGVIYW5kbGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNlbGYuX2NvbXBsZXRlSGFuZGxlcnMuc2hpZnQoKShyZXNwKVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MgKHJlc3ApIHtcbiAgICAgIHZhciB0eXBlID0gb1sndHlwZSddIHx8IHJlc3AgJiYgc2V0VHlwZShyZXNwLmdldFJlc3BvbnNlSGVhZGVyKCdDb250ZW50LVR5cGUnKSkgLy8gcmVzcCBjYW4gYmUgdW5kZWZpbmVkIGluIElFXG4gICAgICByZXNwID0gKHR5cGUgIT09ICdqc29ucCcpID8gc2VsZi5yZXF1ZXN0IDogcmVzcFxuICAgICAgLy8gdXNlIGdsb2JhbCBkYXRhIGZpbHRlciBvbiByZXNwb25zZSB0ZXh0XG4gICAgICB2YXIgZmlsdGVyZWRSZXNwb25zZSA9IGdsb2JhbFNldHVwT3B0aW9ucy5kYXRhRmlsdGVyKHJlc3AucmVzcG9uc2VUZXh0LCB0eXBlKVxuICAgICAgICAsIHIgPSBmaWx0ZXJlZFJlc3BvbnNlXG4gICAgICB0cnkge1xuICAgICAgICByZXNwLnJlc3BvbnNlVGV4dCA9IHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gY2FuJ3QgYXNzaWduIHRoaXMgaW4gSUU8PTgsIGp1c3QgaWdub3JlXG4gICAgICB9XG4gICAgICBpZiAocikge1xuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnanNvbic6XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3AgPSB3aW4uSlNPTiA/IHdpbi5KU09OLnBhcnNlKHIpIDogZXZhbCgnKCcgKyByICsgJyknKVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yKHJlc3AsICdDb3VsZCBub3QgcGFyc2UgSlNPTiBpbiByZXNwb25zZScsIGVycilcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnanMnOlxuICAgICAgICAgIHJlc3AgPSBldmFsKHIpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnaHRtbCc6XG4gICAgICAgICAgcmVzcCA9IHJcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICd4bWwnOlxuICAgICAgICAgIHJlc3AgPSByZXNwLnJlc3BvbnNlWE1MXG4gICAgICAgICAgICAgICYmIHJlc3AucmVzcG9uc2VYTUwucGFyc2VFcnJvciAvLyBJRSB0cm9sb2xvXG4gICAgICAgICAgICAgICYmIHJlc3AucmVzcG9uc2VYTUwucGFyc2VFcnJvci5lcnJvckNvZGVcbiAgICAgICAgICAgICAgJiYgcmVzcC5yZXNwb25zZVhNTC5wYXJzZUVycm9yLnJlYXNvblxuICAgICAgICAgICAgPyBudWxsXG4gICAgICAgICAgICA6IHJlc3AucmVzcG9uc2VYTUxcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNlbGYuX3Jlc3BvbnNlQXJncy5yZXNwID0gcmVzcFxuICAgICAgc2VsZi5fZnVsZmlsbGVkID0gdHJ1ZVxuICAgICAgZm4ocmVzcClcbiAgICAgIHNlbGYuX3N1Y2Nlc3NIYW5kbGVyKHJlc3ApXG4gICAgICB3aGlsZSAoc2VsZi5fZnVsZmlsbG1lbnRIYW5kbGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJlc3AgPSBzZWxmLl9mdWxmaWxsbWVudEhhbmRsZXJzLnNoaWZ0KCkocmVzcClcbiAgICAgIH1cblxuICAgICAgY29tcGxldGUocmVzcClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0aW1lZE91dCgpIHtcbiAgICAgIHNlbGYuX3RpbWVkT3V0ID0gdHJ1ZVxuICAgICAgc2VsZi5yZXF1ZXN0LmFib3J0KCkgICAgICBcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihyZXNwLCBtc2csIHQpIHtcbiAgICAgIHJlc3AgPSBzZWxmLnJlcXVlc3RcbiAgICAgIHNlbGYuX3Jlc3BvbnNlQXJncy5yZXNwID0gcmVzcFxuICAgICAgc2VsZi5fcmVzcG9uc2VBcmdzLm1zZyA9IG1zZ1xuICAgICAgc2VsZi5fcmVzcG9uc2VBcmdzLnQgPSB0XG4gICAgICBzZWxmLl9lcnJlZCA9IHRydWVcbiAgICAgIHdoaWxlIChzZWxmLl9lcnJvckhhbmRsZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2VsZi5fZXJyb3JIYW5kbGVycy5zaGlmdCgpKHJlc3AsIG1zZywgdClcbiAgICAgIH1cbiAgICAgIGNvbXBsZXRlKHJlc3ApXG4gICAgfVxuXG4gICAgdGhpcy5yZXF1ZXN0ID0gZ2V0UmVxdWVzdC5jYWxsKHRoaXMsIHN1Y2Nlc3MsIGVycm9yKVxuICB9XG5cbiAgUmVxd2VzdC5wcm90b3R5cGUgPSB7XG4gICAgYWJvcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuX2Fib3J0ZWQgPSB0cnVlXG4gICAgICB0aGlzLnJlcXVlc3QuYWJvcnQoKVxuICAgIH1cblxuICAsIHJldHJ5OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpbml0LmNhbGwodGhpcywgdGhpcy5vLCB0aGlzLmZuKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNtYWxsIGRldmlhdGlvbiBmcm9tIHRoZSBQcm9taXNlcyBBIENvbW1vbkpzIHNwZWNpZmljYXRpb25cbiAgICAgKiBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Qcm9taXNlcy9BXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBgdGhlbmAgd2lsbCBleGVjdXRlIHVwb24gc3VjY2Vzc2Z1bCByZXF1ZXN0c1xuICAgICAqL1xuICAsIHRoZW46IGZ1bmN0aW9uIChzdWNjZXNzLCBmYWlsKSB7XG4gICAgICBzdWNjZXNzID0gc3VjY2VzcyB8fCBmdW5jdGlvbiAoKSB7fVxuICAgICAgZmFpbCA9IGZhaWwgfHwgZnVuY3Rpb24gKCkge31cbiAgICAgIGlmICh0aGlzLl9mdWxmaWxsZWQpIHtcbiAgICAgICAgdGhpcy5fcmVzcG9uc2VBcmdzLnJlc3AgPSBzdWNjZXNzKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwKVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9lcnJlZCkge1xuICAgICAgICBmYWlsKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwLCB0aGlzLl9yZXNwb25zZUFyZ3MubXNnLCB0aGlzLl9yZXNwb25zZUFyZ3MudClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2Z1bGZpbGxtZW50SGFuZGxlcnMucHVzaChzdWNjZXNzKVxuICAgICAgICB0aGlzLl9lcnJvckhhbmRsZXJzLnB1c2goZmFpbClcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYGFsd2F5c2Agd2lsbCBleGVjdXRlIHdoZXRoZXIgdGhlIHJlcXVlc3Qgc3VjY2VlZHMgb3IgZmFpbHNcbiAgICAgKi9cbiAgLCBhbHdheXM6IGZ1bmN0aW9uIChmbikge1xuICAgICAgaWYgKHRoaXMuX2Z1bGZpbGxlZCB8fCB0aGlzLl9lcnJlZCkge1xuICAgICAgICBmbih0aGlzLl9yZXNwb25zZUFyZ3MucmVzcClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2NvbXBsZXRlSGFuZGxlcnMucHVzaChmbilcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYGZhaWxgIHdpbGwgZXhlY3V0ZSB3aGVuIHRoZSByZXF1ZXN0IGZhaWxzXG4gICAgICovXG4gICwgZmFpbDogZnVuY3Rpb24gKGZuKSB7XG4gICAgICBpZiAodGhpcy5fZXJyZWQpIHtcbiAgICAgICAgZm4odGhpcy5fcmVzcG9uc2VBcmdzLnJlc3AsIHRoaXMuX3Jlc3BvbnNlQXJncy5tc2csIHRoaXMuX3Jlc3BvbnNlQXJncy50KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZXJyb3JIYW5kbGVycy5wdXNoKGZuKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICwgJ2NhdGNoJzogZnVuY3Rpb24gKGZuKSB7XG4gICAgICByZXR1cm4gdGhpcy5mYWlsKGZuKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlcXdlc3QobywgZm4pIHtcbiAgICByZXR1cm4gbmV3IFJlcXdlc3QobywgZm4pXG4gIH1cblxuICAvLyBub3JtYWxpemUgbmV3bGluZSB2YXJpYW50cyBhY2NvcmRpbmcgdG8gc3BlYyAtPiBDUkxGXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZShzKSB7XG4gICAgcmV0dXJuIHMgPyBzLnJlcGxhY2UoL1xccj9cXG4vZywgJ1xcclxcbicpIDogJydcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcmlhbChlbCwgY2IpIHtcbiAgICB2YXIgbiA9IGVsLm5hbWVcbiAgICAgICwgdCA9IGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgLCBvcHRDYiA9IGZ1bmN0aW9uIChvKSB7XG4gICAgICAgICAgLy8gSUUgZ2l2ZXMgdmFsdWU9XCJcIiBldmVuIHdoZXJlIHRoZXJlIGlzIG5vIHZhbHVlIGF0dHJpYnV0ZVxuICAgICAgICAgIC8vICdzcGVjaWZpZWQnIHJlZjogaHR0cDovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTMtQ29yZS9jb3JlLmh0bWwjSUQtODYyNTI5MjczXG4gICAgICAgICAgaWYgKG8gJiYgIW9bJ2Rpc2FibGVkJ10pXG4gICAgICAgICAgICBjYihuLCBub3JtYWxpemUob1snYXR0cmlidXRlcyddWyd2YWx1ZSddICYmIG9bJ2F0dHJpYnV0ZXMnXVsndmFsdWUnXVsnc3BlY2lmaWVkJ10gPyBvWyd2YWx1ZSddIDogb1sndGV4dCddKSlcbiAgICAgICAgfVxuICAgICAgLCBjaCwgcmEsIHZhbCwgaVxuXG4gICAgLy8gZG9uJ3Qgc2VyaWFsaXplIGVsZW1lbnRzIHRoYXQgYXJlIGRpc2FibGVkIG9yIHdpdGhvdXQgYSBuYW1lXG4gICAgaWYgKGVsLmRpc2FibGVkIHx8ICFuKSByZXR1cm5cblxuICAgIHN3aXRjaCAodCkge1xuICAgIGNhc2UgJ2lucHV0JzpcbiAgICAgIGlmICghL3Jlc2V0fGJ1dHRvbnxpbWFnZXxmaWxlL2kudGVzdChlbC50eXBlKSkge1xuICAgICAgICBjaCA9IC9jaGVja2JveC9pLnRlc3QoZWwudHlwZSlcbiAgICAgICAgcmEgPSAvcmFkaW8vaS50ZXN0KGVsLnR5cGUpXG4gICAgICAgIHZhbCA9IGVsLnZhbHVlXG4gICAgICAgIC8vIFdlYktpdCBnaXZlcyB1cyBcIlwiIGluc3RlYWQgb2YgXCJvblwiIGlmIGEgY2hlY2tib3ggaGFzIG5vIHZhbHVlLCBzbyBjb3JyZWN0IGl0IGhlcmVcbiAgICAgICAgOyghKGNoIHx8IHJhKSB8fCBlbC5jaGVja2VkKSAmJiBjYihuLCBub3JtYWxpemUoY2ggJiYgdmFsID09PSAnJyA/ICdvbicgOiB2YWwpKVxuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd0ZXh0YXJlYSc6XG4gICAgICBjYihuLCBub3JtYWxpemUoZWwudmFsdWUpKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdzZWxlY3QnOlxuICAgICAgaWYgKGVsLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3NlbGVjdC1vbmUnKSB7XG4gICAgICAgIG9wdENiKGVsLnNlbGVjdGVkSW5kZXggPj0gMCA/IGVsLm9wdGlvbnNbZWwuc2VsZWN0ZWRJbmRleF0gOiBudWxsKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChpID0gMDsgZWwubGVuZ3RoICYmIGkgPCBlbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGVsLm9wdGlvbnNbaV0uc2VsZWN0ZWQgJiYgb3B0Q2IoZWwub3B0aW9uc1tpXSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICAvLyBjb2xsZWN0IHVwIGFsbCBmb3JtIGVsZW1lbnRzIGZvdW5kIGZyb20gdGhlIHBhc3NlZCBhcmd1bWVudCBlbGVtZW50cyBhbGxcbiAgLy8gdGhlIHdheSBkb3duIHRvIGNoaWxkIGVsZW1lbnRzOyBwYXNzIGEgJzxmb3JtPicgb3IgZm9ybSBmaWVsZHMuXG4gIC8vIGNhbGxlZCB3aXRoICd0aGlzJz1jYWxsYmFjayB0byB1c2UgZm9yIHNlcmlhbCgpIG9uIGVhY2ggZWxlbWVudFxuICBmdW5jdGlvbiBlYWNoRm9ybUVsZW1lbnQoKSB7XG4gICAgdmFyIGNiID0gdGhpc1xuICAgICAgLCBlLCBpXG4gICAgICAsIHNlcmlhbGl6ZVN1YnRhZ3MgPSBmdW5jdGlvbiAoZSwgdGFncykge1xuICAgICAgICAgIHZhciBpLCBqLCBmYVxuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBmYSA9IGVbYnlUYWddKHRhZ3NbaV0pXG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZmEubGVuZ3RoOyBqKyspIHNlcmlhbChmYVtqXSwgY2IpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBlID0gYXJndW1lbnRzW2ldXG4gICAgICBpZiAoL2lucHV0fHNlbGVjdHx0ZXh0YXJlYS9pLnRlc3QoZS50YWdOYW1lKSkgc2VyaWFsKGUsIGNiKVxuICAgICAgc2VyaWFsaXplU3VidGFncyhlLCBbICdpbnB1dCcsICdzZWxlY3QnLCAndGV4dGFyZWEnIF0pXG4gICAgfVxuICB9XG5cbiAgLy8gc3RhbmRhcmQgcXVlcnkgc3RyaW5nIHN0eWxlIHNlcmlhbGl6YXRpb25cbiAgZnVuY3Rpb24gc2VyaWFsaXplUXVlcnlTdHJpbmcoKSB7XG4gICAgcmV0dXJuIHJlcXdlc3QudG9RdWVyeVN0cmluZyhyZXF3ZXN0LnNlcmlhbGl6ZUFycmF5LmFwcGx5KG51bGwsIGFyZ3VtZW50cykpXG4gIH1cblxuICAvLyB7ICduYW1lJzogJ3ZhbHVlJywgLi4uIH0gc3R5bGUgc2VyaWFsaXphdGlvblxuICBmdW5jdGlvbiBzZXJpYWxpemVIYXNoKCkge1xuICAgIHZhciBoYXNoID0ge31cbiAgICBlYWNoRm9ybUVsZW1lbnQuYXBwbHkoZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICBpZiAobmFtZSBpbiBoYXNoKSB7XG4gICAgICAgIGhhc2hbbmFtZV0gJiYgIWlzQXJyYXkoaGFzaFtuYW1lXSkgJiYgKGhhc2hbbmFtZV0gPSBbaGFzaFtuYW1lXV0pXG4gICAgICAgIGhhc2hbbmFtZV0ucHVzaCh2YWx1ZSlcbiAgICAgIH0gZWxzZSBoYXNoW25hbWVdID0gdmFsdWVcbiAgICB9LCBhcmd1bWVudHMpXG4gICAgcmV0dXJuIGhhc2hcbiAgfVxuXG4gIC8vIFsgeyBuYW1lOiAnbmFtZScsIHZhbHVlOiAndmFsdWUnIH0sIC4uLiBdIHN0eWxlIHNlcmlhbGl6YXRpb25cbiAgcmVxd2VzdC5zZXJpYWxpemVBcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJyID0gW11cbiAgICBlYWNoRm9ybUVsZW1lbnQuYXBwbHkoZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICBhcnIucHVzaCh7bmFtZTogbmFtZSwgdmFsdWU6IHZhbHVlfSlcbiAgICB9LCBhcmd1bWVudHMpXG4gICAgcmV0dXJuIGFyclxuICB9XG5cbiAgcmVxd2VzdC5zZXJpYWxpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiAnJ1xuICAgIHZhciBvcHQsIGZuXG4gICAgICAsIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApXG5cbiAgICBvcHQgPSBhcmdzLnBvcCgpXG4gICAgb3B0ICYmIG9wdC5ub2RlVHlwZSAmJiBhcmdzLnB1c2gob3B0KSAmJiAob3B0ID0gbnVsbClcbiAgICBvcHQgJiYgKG9wdCA9IG9wdC50eXBlKVxuXG4gICAgaWYgKG9wdCA9PSAnbWFwJykgZm4gPSBzZXJpYWxpemVIYXNoXG4gICAgZWxzZSBpZiAob3B0ID09ICdhcnJheScpIGZuID0gcmVxd2VzdC5zZXJpYWxpemVBcnJheVxuICAgIGVsc2UgZm4gPSBzZXJpYWxpemVRdWVyeVN0cmluZ1xuXG4gICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIGFyZ3MpXG4gIH1cblxuICByZXF3ZXN0LnRvUXVlcnlTdHJpbmcgPSBmdW5jdGlvbiAobywgdHJhZCkge1xuICAgIHZhciBwcmVmaXgsIGlcbiAgICAgICwgdHJhZGl0aW9uYWwgPSB0cmFkIHx8IGZhbHNlXG4gICAgICAsIHMgPSBbXVxuICAgICAgLCBlbmMgPSBlbmNvZGVVUklDb21wb25lbnRcbiAgICAgICwgYWRkID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAvLyBJZiB2YWx1ZSBpcyBhIGZ1bmN0aW9uLCBpbnZva2UgaXQgYW5kIHJldHVybiBpdHMgdmFsdWVcbiAgICAgICAgICB2YWx1ZSA9ICgnZnVuY3Rpb24nID09PSB0eXBlb2YgdmFsdWUpID8gdmFsdWUoKSA6ICh2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZSlcbiAgICAgICAgICBzW3MubGVuZ3RoXSA9IGVuYyhrZXkpICsgJz0nICsgZW5jKHZhbHVlKVxuICAgICAgICB9XG4gICAgLy8gSWYgYW4gYXJyYXkgd2FzIHBhc3NlZCBpbiwgYXNzdW1lIHRoYXQgaXQgaXMgYW4gYXJyYXkgb2YgZm9ybSBlbGVtZW50cy5cbiAgICBpZiAoaXNBcnJheShvKSkge1xuICAgICAgZm9yIChpID0gMDsgbyAmJiBpIDwgby5sZW5ndGg7IGkrKykgYWRkKG9baV1bJ25hbWUnXSwgb1tpXVsndmFsdWUnXSlcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdHJhZGl0aW9uYWwsIGVuY29kZSB0aGUgXCJvbGRcIiB3YXkgKHRoZSB3YXkgMS4zLjIgb3Igb2xkZXJcbiAgICAgIC8vIGRpZCBpdCksIG90aGVyd2lzZSBlbmNvZGUgcGFyYW1zIHJlY3Vyc2l2ZWx5LlxuICAgICAgZm9yIChwcmVmaXggaW4gbykge1xuICAgICAgICBpZiAoby5oYXNPd25Qcm9wZXJ0eShwcmVmaXgpKSBidWlsZFBhcmFtcyhwcmVmaXgsIG9bcHJlZml4XSwgdHJhZGl0aW9uYWwsIGFkZClcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzcGFjZXMgc2hvdWxkIGJlICsgYWNjb3JkaW5nIHRvIHNwZWNcbiAgICByZXR1cm4gcy5qb2luKCcmJykucmVwbGFjZSgvJTIwL2csICcrJylcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1aWxkUGFyYW1zKHByZWZpeCwgb2JqLCB0cmFkaXRpb25hbCwgYWRkKSB7XG4gICAgdmFyIG5hbWUsIGksIHZcbiAgICAgICwgcmJyYWNrZXQgPSAvXFxbXFxdJC9cblxuICAgIGlmIChpc0FycmF5KG9iaikpIHtcbiAgICAgIC8vIFNlcmlhbGl6ZSBhcnJheSBpdGVtLlxuICAgICAgZm9yIChpID0gMDsgb2JqICYmIGkgPCBvYmoubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdiA9IG9ialtpXVxuICAgICAgICBpZiAodHJhZGl0aW9uYWwgfHwgcmJyYWNrZXQudGVzdChwcmVmaXgpKSB7XG4gICAgICAgICAgLy8gVHJlYXQgZWFjaCBhcnJheSBpdGVtIGFzIGEgc2NhbGFyLlxuICAgICAgICAgIGFkZChwcmVmaXgsIHYpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVpbGRQYXJhbXMocHJlZml4ICsgJ1snICsgKHR5cGVvZiB2ID09PSAnb2JqZWN0JyA/IGkgOiAnJykgKyAnXScsIHYsIHRyYWRpdGlvbmFsLCBhZGQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9iaiAmJiBvYmoudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgIC8vIFNlcmlhbGl6ZSBvYmplY3QgaXRlbS5cbiAgICAgIGZvciAobmFtZSBpbiBvYmopIHtcbiAgICAgICAgYnVpbGRQYXJhbXMocHJlZml4ICsgJ1snICsgbmFtZSArICddJywgb2JqW25hbWVdLCB0cmFkaXRpb25hbCwgYWRkKVxuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNlcmlhbGl6ZSBzY2FsYXIgaXRlbS5cbiAgICAgIGFkZChwcmVmaXgsIG9iailcbiAgICB9XG4gIH1cblxuICByZXF3ZXN0LmdldGNhbGxiYWNrUHJlZml4ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjYWxsYmFja1ByZWZpeFxuICB9XG5cbiAgLy8galF1ZXJ5IGFuZCBaZXB0byBjb21wYXRpYmlsaXR5LCBkaWZmZXJlbmNlcyBjYW4gYmUgcmVtYXBwZWQgaGVyZSBzbyB5b3UgY2FuIGNhbGxcbiAgLy8gLmFqYXguY29tcGF0KG9wdGlvbnMsIGNhbGxiYWNrKVxuICByZXF3ZXN0LmNvbXBhdCA9IGZ1bmN0aW9uIChvLCBmbikge1xuICAgIGlmIChvKSB7XG4gICAgICBvWyd0eXBlJ10gJiYgKG9bJ21ldGhvZCddID0gb1sndHlwZSddKSAmJiBkZWxldGUgb1sndHlwZSddXG4gICAgICBvWydkYXRhVHlwZSddICYmIChvWyd0eXBlJ10gPSBvWydkYXRhVHlwZSddKVxuICAgICAgb1snanNvbnBDYWxsYmFjayddICYmIChvWydqc29ucENhbGxiYWNrTmFtZSddID0gb1snanNvbnBDYWxsYmFjayddKSAmJiBkZWxldGUgb1snanNvbnBDYWxsYmFjayddXG4gICAgICBvWydqc29ucCddICYmIChvWydqc29ucENhbGxiYWNrJ10gPSBvWydqc29ucCddKVxuICAgIH1cbiAgICByZXR1cm4gbmV3IFJlcXdlc3QobywgZm4pXG4gIH1cblxuICByZXF3ZXN0LmFqYXhTZXR1cCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgICBmb3IgKHZhciBrIGluIG9wdGlvbnMpIHtcbiAgICAgIGdsb2JhbFNldHVwT3B0aW9uc1trXSA9IG9wdGlvbnNba11cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVxd2VzdFxufSk7XG4iLCJcbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHRyaW07XG5cbmZ1bmN0aW9uIHRyaW0oc3RyKXtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzKnxcXHMqJC9nLCAnJyk7XG59XG5cbmV4cG9ydHMubGVmdCA9IGZ1bmN0aW9uKHN0cil7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyovLCAnJyk7XG59O1xuXG5leHBvcnRzLnJpZ2h0ID0gZnVuY3Rpb24oc3RyKXtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXHMqJC8sICcnKTtcbn07XG4iLCJ2YXIgV2luQ2hhbiA9IChmdW5jdGlvbigpIHtcbiAgdmFyIFJFTEFZX0ZSQU1FX05BTUUgPSBcIl9fd2luY2hhbl9yZWxheV9mcmFtZVwiO1xuICB2YXIgQ0xPU0VfQ01EID0gXCJkaWVcIjtcblxuICAvLyBhIHBvcnRhYmxlIGFkZExpc3RlbmVyIGltcGxlbWVudGF0aW9uXG4gIGZ1bmN0aW9uIGFkZExpc3RlbmVyKHcsIGV2ZW50LCBjYikge1xuICAgIGlmKHcuYXR0YWNoRXZlbnQpIHcuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBjYik7XG4gICAgZWxzZSBpZiAody5hZGRFdmVudExpc3RlbmVyKSB3LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGNiLCBmYWxzZSk7XG4gIH1cblxuICAvLyBhIHBvcnRhYmxlIHJlbW92ZUxpc3RlbmVyIGltcGxlbWVudGF0aW9uXG4gIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKHcsIGV2ZW50LCBjYikge1xuICAgIGlmKHcuZGV0YWNoRXZlbnQpIHcuZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBjYik7XG4gICAgZWxzZSBpZiAody5yZW1vdmVFdmVudExpc3RlbmVyKSB3LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGNiLCBmYWxzZSk7XG4gIH1cblxuXG4gIC8vIGNoZWNraW5nIGZvciBJRTggb3IgYWJvdmVcbiAgZnVuY3Rpb24gaXNJbnRlcm5ldEV4cGxvcmVyKCkge1xuICAgIHZhciBydiA9IC0xOyAvLyBSZXR1cm4gdmFsdWUgYXNzdW1lcyBmYWlsdXJlLlxuICAgIHZhciB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgaWYgKG5hdmlnYXRvci5hcHBOYW1lID09PSAnTWljcm9zb2Z0IEludGVybmV0IEV4cGxvcmVyJykge1xuICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChcIk1TSUUgKFswLTldezEsfVtcXC4wLTldezAsfSlcIik7XG4gICAgICBpZiAocmUuZXhlYyh1YSkgIT0gbnVsbClcbiAgICAgICAgcnYgPSBwYXJzZUZsb2F0KFJlZ0V4cC4kMSk7XG4gICAgfVxuICAgIC8vIElFID4gMTFcbiAgICBlbHNlIGlmICh1YS5pbmRleE9mKFwiVHJpZGVudFwiKSA+IC0xKSB7XG4gICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwicnY6KFswLTldezIsMn1bXFwuMC05XXswLH0pXCIpO1xuICAgICAgaWYgKHJlLmV4ZWModWEpICE9PSBudWxsKSB7XG4gICAgICAgIHJ2ID0gcGFyc2VGbG9hdChSZWdFeHAuJDEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBydiA+PSA4O1xuICB9XG5cbiAgLy8gY2hlY2tpbmcgTW9iaWxlIEZpcmVmb3ggKEZlbm5lYylcbiAgZnVuY3Rpb24gaXNGZW5uZWMoKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFdlIG11c3QgY2hlY2sgZm9yIGJvdGggWFVMIGFuZCBKYXZhIHZlcnNpb25zIG9mIEZlbm5lYy4gIEJvdGggaGF2ZVxuICAgICAgLy8gZGlzdGluY3QgVUEgc3RyaW5ncy5cbiAgICAgIHZhciB1c2VyQWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50O1xuICAgICAgcmV0dXJuICh1c2VyQWdlbnQuaW5kZXhPZignRmVubmVjLycpICE9IC0xKSB8fCAgLy8gWFVMXG4gICAgICAgICAgICAgKHVzZXJBZ2VudC5pbmRleE9mKCdGaXJlZm94LycpICE9IC0xICYmIHVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgIT0gLTEpOyAgIC8vIEphdmFcbiAgICB9IGNhdGNoKGUpIHt9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gZmVhdHVyZSBjaGVja2luZyB0byBzZWUgaWYgdGhpcyBwbGF0Zm9ybSBpcyBzdXBwb3J0ZWQgYXQgYWxsXG4gIGZ1bmN0aW9uIGlzU3VwcG9ydGVkKCkge1xuICAgIHJldHVybiAod2luZG93LkpTT04gJiYgd2luZG93LkpTT04uc3RyaW5naWZ5ICYmXG4gICAgICAgICAgICB3aW5kb3cuSlNPTi5wYXJzZSAmJiB3aW5kb3cucG9zdE1lc3NhZ2UpO1xuICB9XG5cbiAgLy8gZ2l2ZW4gYSBVUkwsIGV4dHJhY3QgdGhlIG9yaWdpbi4gVGFrZW4gZnJvbTogaHR0cHM6Ly9naXRodWIuY29tL2ZpcmViYXNlL2ZpcmViYXNlLXNpbXBsZS1sb2dpbi9ibG9iL2QyY2I5NWI5ZjgxMmQ4NDg4YmRiZmJhNTFjM2E3YzE1M2JhMWEwNzQvanMvc3JjL3NpbXBsZS1sb2dpbi90cmFuc3BvcnRzL1dpbkNoYW4uanMjTDI1LUwzMFxuICBmdW5jdGlvbiBleHRyYWN0T3JpZ2luKHVybCkge1xuICAgIGlmICghL15odHRwcz86XFwvXFwvLy50ZXN0KHVybCkpIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgIHZhciBtID0gL14oaHR0cHM/OlxcL1xcL1tcXC1fYS16QS1aXFwuMC05Ol0rKS8uZXhlYyh1cmwpO1xuICAgIGlmIChtKSByZXR1cm4gbVsxXTtcbiAgICByZXR1cm4gdXJsO1xuICB9XG5cbiAgLy8gZmluZCB0aGUgcmVsYXkgaWZyYW1lIGluIHRoZSBvcGVuZXJcbiAgZnVuY3Rpb24gZmluZFJlbGF5KCkge1xuICAgIHZhciBsb2MgPSB3aW5kb3cubG9jYXRpb247XG4gICAgdmFyIGZyYW1lcyA9IHdpbmRvdy5vcGVuZXIuZnJhbWVzO1xuICAgIGZvciAodmFyIGkgPSBmcmFtZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChmcmFtZXNbaV0ubG9jYXRpb24ucHJvdG9jb2wgPT09IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCAmJlxuICAgICAgICAgICAgZnJhbWVzW2ldLmxvY2F0aW9uLmhvc3QgPT09IHdpbmRvdy5sb2NhdGlvbi5ob3N0ICYmXG4gICAgICAgICAgICBmcmFtZXNbaV0ubmFtZSA9PT0gUkVMQVlfRlJBTUVfTkFNRSlcbiAgICAgICAge1xuICAgICAgICAgIHJldHVybiBmcmFtZXNbaV07XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2goZSkgeyB9XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBpc0lFID0gaXNJbnRlcm5ldEV4cGxvcmVyKCk7XG5cbiAgaWYgKGlzU3VwcG9ydGVkKCkpIHtcbiAgICAvKiAgR2VuZXJhbCBmbG93OlxuICAgICAqICAgICAgICAgICAgICAgICAgMC4gdXNlciBjbGlja3NcbiAgICAgKiAgKElFIFNQRUNJRklDKSAgIDEuIGNhbGxlciBhZGRzIHJlbGF5IGlmcmFtZSAoc2VydmVkIGZyb20gdHJ1c3RlZCBkb21haW4pIHRvIERPTVxuICAgICAqICAgICAgICAgICAgICAgICAgMi4gY2FsbGVyIG9wZW5zIHdpbmRvdyAod2l0aCBjb250ZW50IGZyb20gdHJ1c3RlZCBkb21haW4pXG4gICAgICogICAgICAgICAgICAgICAgICAzLiB3aW5kb3cgb24gb3BlbmluZyBhZGRzIGEgbGlzdGVuZXIgdG8gJ21lc3NhZ2UnXG4gICAgICogIChJRSBTUEVDSUZJQykgICA0LiB3aW5kb3cgb24gb3BlbmluZyBmaW5kcyBpZnJhbWVcbiAgICAgKiAgICAgICAgICAgICAgICAgIDUuIHdpbmRvdyBjaGVja3MgaWYgaWZyYW1lIGlzIFwibG9hZGVkXCIgLSBoYXMgYSAnZG9Qb3N0JyBmdW5jdGlvbiB5ZXRcbiAgICAgKiAgKElFIFNQRUNJRklDNSkgIDVhLiBpZiBpZnJhbWUuZG9Qb3N0IGV4aXN0cywgd2luZG93IHVzZXMgaXQgdG8gc2VuZCByZWFkeSBldmVudCB0byBjYWxsZXJcbiAgICAgKiAgKElFIFNQRUNJRklDNSkgIDViLiBpZiBpZnJhbWUuZG9Qb3N0IGRvZXNuJ3QgZXhpc3QsIHdpbmRvdyB3YWl0cyBmb3IgZnJhbWUgcmVhZHlcbiAgICAgKiAgKElFIFNQRUNJRklDNSkgIDViaS4gb25jZSByZWFkeSwgd2luZG93IGNhbGxzIGlmcmFtZS5kb1Bvc3QgdG8gc2VuZCByZWFkeSBldmVudFxuICAgICAqICAgICAgICAgICAgICAgICAgNi4gY2FsbGVyIHVwb24gcmVjaWVwdCBvZiAncmVhZHknLCBzZW5kcyBhcmdzXG4gICAgICovXG4gICAgcmV0dXJuIHtcbiAgICAgIG9wZW46IGZ1bmN0aW9uKG9wdHMsIGNiKSB7XG4gICAgICAgIGlmICghY2IpIHRocm93IFwibWlzc2luZyByZXF1aXJlZCBjYWxsYmFjayBhcmd1bWVudFwiO1xuXG4gICAgICAgIC8vIHRlc3QgcmVxdWlyZWQgb3B0aW9uc1xuICAgICAgICB2YXIgZXJyO1xuICAgICAgICBpZiAoIW9wdHMudXJsKSBlcnIgPSBcIm1pc3NpbmcgcmVxdWlyZWQgJ3VybCcgcGFyYW1ldGVyXCI7XG4gICAgICAgIGlmICghb3B0cy5yZWxheV91cmwpIGVyciA9IFwibWlzc2luZyByZXF1aXJlZCAncmVsYXlfdXJsJyBwYXJhbWV0ZXJcIjtcbiAgICAgICAgaWYgKGVycikgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2IoZXJyKTsgfSwgMCk7XG5cbiAgICAgICAgLy8gc3VwcGx5IGRlZmF1bHQgb3B0aW9uc1xuICAgICAgICBpZiAoIW9wdHMud2luZG93X25hbWUpIG9wdHMud2luZG93X25hbWUgPSBudWxsO1xuICAgICAgICBpZiAoIW9wdHMud2luZG93X2ZlYXR1cmVzIHx8IGlzRmVubmVjKCkpIG9wdHMud2luZG93X2ZlYXR1cmVzID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIC8vIG9wdHMucGFyYW1zIG1heSBiZSB1bmRlZmluZWRcblxuICAgICAgICB2YXIgaWZyYW1lO1xuXG4gICAgICAgIC8vIHNhbml0eSBjaGVjaywgYXJlIHVybCBhbmQgcmVsYXlfdXJsIHRoZSBzYW1lIG9yaWdpbj9cbiAgICAgICAgdmFyIG9yaWdpbiA9IGV4dHJhY3RPcmlnaW4ob3B0cy51cmwpO1xuICAgICAgICBpZiAob3JpZ2luICE9PSBleHRyYWN0T3JpZ2luKG9wdHMucmVsYXlfdXJsKSkge1xuICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2IoJ2ludmFsaWQgYXJndW1lbnRzOiBvcmlnaW4gb2YgdXJsIGFuZCByZWxheV91cmwgbXVzdCBtYXRjaCcpO1xuICAgICAgICAgIH0sIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1lc3NhZ2VUYXJnZXQ7XG5cbiAgICAgICAgaWYgKGlzSUUpIHtcbiAgICAgICAgICAvLyBmaXJzdCB3ZSBuZWVkIHRvIGFkZCBhIFwicmVsYXlcIiBpZnJhbWUgdG8gdGhlIGRvY3VtZW50IHRoYXQncyBzZXJ2ZWRcbiAgICAgICAgICAvLyBmcm9tIHRoZSB0YXJnZXQgZG9tYWluLiAgV2UgY2FuIHBvc3RtZXNzYWdlIGludG8gYSBpZnJhbWUsIGJ1dCBub3QgYVxuICAgICAgICAgIC8vIHdpbmRvd1xuICAgICAgICAgIGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XG4gICAgICAgICAgLy8gaWZyYW1lLnNldEF0dHJpYnV0ZSgnbmFtZScsIGZyYW1lbmFtZSk7XG4gICAgICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnc3JjJywgb3B0cy5yZWxheV91cmwpO1xuICAgICAgICAgIGlmcmFtZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnbmFtZScsIFJFTEFZX0ZSQU1FX05BTUUpO1xuICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICBtZXNzYWdlVGFyZ2V0ID0gaWZyYW1lLmNvbnRlbnRXaW5kb3c7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdyA9IG9wdHMucG9wdXAgfHwgd2luZG93Lm9wZW4ob3B0cy51cmwsIG9wdHMud2luZG93X25hbWUsIG9wdHMud2luZG93X2ZlYXR1cmVzKTtcbiAgICAgICAgaWYgKG9wdHMucG9wdXApIHtcbiAgICAgICAgICB3LmxvY2F0aW9uLmhyZWYgPSBvcHRzLnVybDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbWVzc2FnZVRhcmdldCkgbWVzc2FnZVRhcmdldCA9IHc7XG5cbiAgICAgICAgLy8gbGV0cyBsaXN0ZW4gaW4gY2FzZSB0aGUgd2luZG93IGJsb3dzIHVwIGJlZm9yZSB0ZWxsaW5nIHVzXG4gICAgICAgIHZhciBjbG9zZUludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKHcgJiYgdy5jbG9zZWQpIHtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgICBjYignVXNlciBjbG9zZWQgdGhlIHBvcHVwIHdpbmRvdycpO1xuICAgICAgICAgICAgICBjYiA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCA1MDApO1xuXG4gICAgICAgIHZhciByZXEgPSBKU09OLnN0cmluZ2lmeSh7YTogJ3JlcXVlc3QnLCBkOiBvcHRzLnBhcmFtc30pO1xuXG4gICAgICAgIC8vIGNsZWFudXAgb24gdW5sb2FkXG4gICAgICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICAgICAgaWYgKGlmcmFtZSkgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChpZnJhbWUpO1xuICAgICAgICAgIGlmcmFtZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAoY2xvc2VJbnRlcnZhbCkgY2xvc2VJbnRlcnZhbCA9IGNsZWFySW50ZXJ2YWwoY2xvc2VJbnRlcnZhbCk7XG4gICAgICAgICAgcmVtb3ZlTGlzdGVuZXIod2luZG93LCAnbWVzc2FnZScsIG9uTWVzc2FnZSk7XG4gICAgICAgICAgcmVtb3ZlTGlzdGVuZXIod2luZG93LCAndW5sb2FkJywgY2xlYW51cCk7XG4gICAgICAgICAgaWYgKHcpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHcuY2xvc2UoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKHNlY3VyaXR5VmlvbGF0aW9uKSB7XG4gICAgICAgICAgICAgIC8vIFRoaXMgaGFwcGVucyBpbiBPcGVyYSAxMiBzb21ldGltZXNcbiAgICAgICAgICAgICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL2Jyb3dzZXJpZC9pc3N1ZXMvMTg0NFxuICAgICAgICAgICAgICBtZXNzYWdlVGFyZ2V0LnBvc3RNZXNzYWdlKENMT1NFX0NNRCwgb3JpZ2luKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdyA9IG1lc3NhZ2VUYXJnZXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBhZGRMaXN0ZW5lcih3aW5kb3csICd1bmxvYWQnLCBjbGVhbnVwKTtcblxuICAgICAgICBmdW5jdGlvbiBvbk1lc3NhZ2UoZSkge1xuICAgICAgICAgIGlmIChlLm9yaWdpbiAhPT0gb3JpZ2luKSB7IHJldHVybjsgfVxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgZCA9IEpTT04ucGFyc2UoZS5kYXRhKTtcbiAgICAgICAgICAgIGlmIChkLmEgPT09ICdyZWFkeScpIG1lc3NhZ2VUYXJnZXQucG9zdE1lc3NhZ2UocmVxLCBvcmlnaW4pO1xuICAgICAgICAgICAgZWxzZSBpZiAoZC5hID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgY2IoZC5kKTtcbiAgICAgICAgICAgICAgICBjYiA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZC5hID09PSAncmVzcG9uc2UnKSB7XG4gICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgICAgY2IobnVsbCwgZC5kKTtcbiAgICAgICAgICAgICAgICBjYiA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoKGVycikgeyB9XG4gICAgICAgIH1cblxuICAgICAgICBhZGRMaXN0ZW5lcih3aW5kb3csICdtZXNzYWdlJywgb25NZXNzYWdlKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNsb3NlOiBjbGVhbnVwLFxuICAgICAgICAgIGZvY3VzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh3KSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdy5mb2N1cygpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gSUU3IGJsb3dzIHVwIGhlcmUsIGRvIG5vdGhpbmdcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICBvbk9wZW46IGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgIHZhciBvID0gXCIqXCI7XG4gICAgICAgIHZhciBtc2dUYXJnZXQgPSBpc0lFID8gZmluZFJlbGF5KCkgOiB3aW5kb3cub3BlbmVyO1xuICAgICAgICBpZiAoIW1zZ1RhcmdldCkgdGhyb3cgXCJjYW4ndCBmaW5kIHJlbGF5IGZyYW1lXCI7XG4gICAgICAgIGZ1bmN0aW9uIGRvUG9zdChtc2cpIHtcbiAgICAgICAgICBtc2cgPSBKU09OLnN0cmluZ2lmeShtc2cpO1xuICAgICAgICAgIGlmIChpc0lFKSBtc2dUYXJnZXQuZG9Qb3N0KG1zZywgbyk7XG4gICAgICAgICAgZWxzZSBtc2dUYXJnZXQucG9zdE1lc3NhZ2UobXNnLCBvKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG9uTWVzc2FnZShlKSB7XG4gICAgICAgICAgLy8gb25seSBvbmUgbWVzc2FnZSBnZXRzIHRocm91Z2gsIGJ1dCBsZXQncyBtYWtlIHN1cmUgaXQncyBhY3R1YWxseVxuICAgICAgICAgIC8vIHRoZSBtZXNzYWdlIHdlJ3JlIGxvb2tpbmcgZm9yIChvdGhlciBjb2RlIG1heSBiZSB1c2luZ1xuICAgICAgICAgIC8vIHBvc3RtZXNzYWdlKSAtIHdlIGRvIHRoaXMgYnkgZW5zdXJpbmcgdGhlIHBheWxvYWQgY2FuXG4gICAgICAgICAgLy8gYmUgcGFyc2VkLCBhbmQgaXQncyBnb3QgYW4gJ2EnIChhY3Rpb24pIHZhbHVlIG9mICdyZXF1ZXN0Jy5cbiAgICAgICAgICB2YXIgZDtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZCA9IEpTT04ucGFyc2UoZS5kYXRhKTtcbiAgICAgICAgICB9IGNhdGNoKGVycikgeyB9XG4gICAgICAgICAgaWYgKCFkIHx8IGQuYSAhPT0gJ3JlcXVlc3QnKSByZXR1cm47XG4gICAgICAgICAgcmVtb3ZlTGlzdGVuZXIod2luZG93LCAnbWVzc2FnZScsIG9uTWVzc2FnZSk7XG4gICAgICAgICAgbyA9IGUub3JpZ2luO1xuICAgICAgICAgIGlmIChjYikge1xuICAgICAgICAgICAgLy8gdGhpcyBzZXRUaW1lb3V0IGlzIGNyaXRpY2FsbHkgaW1wb3J0YW50IGZvciBJRTggLVxuICAgICAgICAgICAgLy8gaW4gaWU4IHNvbWV0aW1lcyBhZGRMaXN0ZW5lciBmb3IgJ21lc3NhZ2UnIGNhbiBzeW5jaHJvbm91c2x5XG4gICAgICAgICAgICAvLyBjYXVzZSB5b3VyIGNhbGxiYWNrIHRvIGJlIGludm9rZWQuICBhd2Vzb21lLlxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgY2IobywgZC5kLCBmdW5jdGlvbihyKSB7XG4gICAgICAgICAgICAgICAgY2IgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgZG9Qb3N0KHthOiAncmVzcG9uc2UnLCBkOiByfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb25EaWUoZSkge1xuICAgICAgICAgIGlmIChlLmRhdGEgPT09IENMT1NFX0NNRCkge1xuICAgICAgICAgICAgdHJ5IHsgd2luZG93LmNsb3NlKCk7IH0gY2F0Y2ggKG9fTykge31cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYWRkTGlzdGVuZXIoaXNJRSA/IG1zZ1RhcmdldCA6IHdpbmRvdywgJ21lc3NhZ2UnLCBvbk1lc3NhZ2UpO1xuICAgICAgICBhZGRMaXN0ZW5lcihpc0lFID8gbXNnVGFyZ2V0IDogd2luZG93LCAnbWVzc2FnZScsIG9uRGllKTtcblxuICAgICAgICAvLyB3ZSBjYW5ub3QgcG9zdCB0byBvdXIgcGFyZW50IHRoYXQgd2UncmUgcmVhZHkgYmVmb3JlIHRoZSBpZnJhbWVcbiAgICAgICAgLy8gaXMgbG9hZGVkLiAoSUUgc3BlY2lmaWMgcG9zc2libGUgZmFpbHVyZSlcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBkb1Bvc3Qoe2E6IFwicmVhZHlcIn0pO1xuICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAvLyB0aGlzIGNvZGUgc2hvdWxkIG5ldmVyIGJlIGV4ZWN0dWVkIG91dHNpZGUgSUVcbiAgICAgICAgICBhZGRMaXN0ZW5lcihtc2dUYXJnZXQsICdsb2FkJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZG9Qb3N0KHthOiBcInJlYWR5XCJ9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHdpbmRvdyBpcyB1bmxvYWRlZCBhbmQgdGhlIGNsaWVudCBoYXNuJ3QgY2FsbGVkIGNiLCBpdCdzIGFuIGVycm9yXG4gICAgICAgIHZhciBvblVubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBJRTggZG9lc24ndCBsaWtlIHRoaXMuLi5cbiAgICAgICAgICAgIHJlbW92ZUxpc3RlbmVyKGlzSUUgPyBtc2dUYXJnZXQgOiB3aW5kb3csICdtZXNzYWdlJywgb25EaWUpO1xuICAgICAgICAgIH0gY2F0Y2ggKG9oV2VsbCkgeyB9XG4gICAgICAgICAgaWYgKGNiKSBkb1Bvc3QoeyBhOiAnZXJyb3InLCBkOiAnY2xpZW50IGNsb3NlZCB3aW5kb3cnIH0pO1xuICAgICAgICAgIGNiID0gdW5kZWZpbmVkO1xuICAgICAgICAgIC8vIGV4cGxpY2l0bHkgY2xvc2UgdGhlIHdpbmRvdywgaW4gY2FzZSB0aGUgY2xpZW50IGlzIHRyeWluZyB0byByZWxvYWQgb3IgbmF2XG4gICAgICAgICAgdHJ5IHsgd2luZG93LmNsb3NlKCk7IH0gY2F0Y2ggKGUpIHsgfVxuICAgICAgICB9O1xuICAgICAgICBhZGRMaXN0ZW5lcih3aW5kb3csICd1bmxvYWQnLCBvblVubG9hZCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGV0YWNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJlbW92ZUxpc3RlbmVyKHdpbmRvdywgJ3VubG9hZCcsIG9uVW5sb2FkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4ge1xuICAgICAgb3BlbjogZnVuY3Rpb24odXJsLCB3aW5vcHRzLCBhcmcsIGNiKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNiKFwidW5zdXBwb3J0ZWQgYnJvd3NlclwiKTsgfSwgMCk7XG4gICAgICB9LFxuICAgICAgb25PcGVuOiBmdW5jdGlvbihjYikge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYihcInVuc3VwcG9ydGVkIGJyb3dzZXJcIik7IH0sIDApO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn0pKCk7XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICBtb2R1bGUuZXhwb3J0cyA9IFdpbkNoYW47XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGhhc0tleXNcblxuZnVuY3Rpb24gaGFzS2V5cyhzb3VyY2UpIHtcbiAgICByZXR1cm4gc291cmNlICE9PSBudWxsICYmXG4gICAgICAgICh0eXBlb2Ygc291cmNlID09PSBcIm9iamVjdFwiIHx8XG4gICAgICAgIHR5cGVvZiBzb3VyY2UgPT09IFwiZnVuY3Rpb25cIilcbn1cbiIsInZhciBLZXlzID0gcmVxdWlyZShcIm9iamVjdC1rZXlzXCIpXG52YXIgaGFzS2V5cyA9IHJlcXVpcmUoXCIuL2hhcy1rZXlzXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gZXh0ZW5kXG5cbmZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgICB2YXIgdGFyZ2V0ID0ge31cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV1cblxuICAgICAgICBpZiAoIWhhc0tleXMoc291cmNlKSkge1xuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBrZXlzID0gS2V5cyhzb3VyY2UpXG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBrZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IGtleXNbal1cbiAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IHNvdXJjZVtuYW1lXVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldFxufVxuIiwidmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG52YXIgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uIChmbikge1xuXHR2YXIgaXNGdW5jID0gKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyAmJiAhKGZuIGluc3RhbmNlb2YgUmVnRXhwKSkgfHwgdG9TdHJpbmcuY2FsbChmbikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG5cdGlmICghaXNGdW5jICYmIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0aXNGdW5jID0gZm4gPT09IHdpbmRvdy5zZXRUaW1lb3V0IHx8IGZuID09PSB3aW5kb3cuYWxlcnQgfHwgZm4gPT09IHdpbmRvdy5jb25maXJtIHx8IGZuID09PSB3aW5kb3cucHJvbXB0O1xuXHR9XG5cdHJldHVybiBpc0Z1bmM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvckVhY2gob2JqLCBmbikge1xuXHRpZiAoIWlzRnVuY3Rpb24oZm4pKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignaXRlcmF0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cdH1cblx0dmFyIGksIGssXG5cdFx0aXNTdHJpbmcgPSB0eXBlb2Ygb2JqID09PSAnc3RyaW5nJyxcblx0XHRsID0gb2JqLmxlbmd0aCxcblx0XHRjb250ZXh0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgPyBhcmd1bWVudHNbMl0gOiBudWxsO1xuXHRpZiAobCA9PT0gK2wpIHtcblx0XHRmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHRpZiAoY29udGV4dCA9PT0gbnVsbCkge1xuXHRcdFx0XHRmbihpc1N0cmluZyA/IG9iai5jaGFyQXQoaSkgOiBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmbi5jYWxsKGNvbnRleHQsIGlzU3RyaW5nID8gb2JqLmNoYXJBdChpKSA6IG9ialtpXSwgaSwgb2JqKTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Zm9yIChrIGluIG9iaikge1xuXHRcdFx0aWYgKGhhc093bi5jYWxsKG9iaiwgaykpIHtcblx0XHRcdFx0aWYgKGNvbnRleHQgPT09IG51bGwpIHtcblx0XHRcdFx0XHRmbihvYmpba10sIGssIG9iaik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Zm4uY2FsbChjb250ZXh0LCBvYmpba10sIGssIG9iaik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cbn07XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmtleXMgfHwgcmVxdWlyZSgnLi9zaGltJyk7XG5cbiIsInZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNBcmd1bWVudHModmFsdWUpIHtcblx0dmFyIHN0ciA9IHRvU3RyaW5nLmNhbGwodmFsdWUpO1xuXHR2YXIgaXNBcmd1bWVudHMgPSBzdHIgPT09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuXHRpZiAoIWlzQXJndW1lbnRzKSB7XG5cdFx0aXNBcmd1bWVudHMgPSBzdHIgIT09ICdbb2JqZWN0IEFycmF5XSdcblx0XHRcdCYmIHZhbHVlICE9PSBudWxsXG5cdFx0XHQmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnXG5cdFx0XHQmJiB0eXBlb2YgdmFsdWUubGVuZ3RoID09PSAnbnVtYmVyJ1xuXHRcdFx0JiYgdmFsdWUubGVuZ3RoID49IDBcblx0XHRcdCYmIHRvU3RyaW5nLmNhbGwodmFsdWUuY2FsbGVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblx0fVxuXHRyZXR1cm4gaXNBcmd1bWVudHM7XG59O1xuXG4iLCIoZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvLyBtb2RpZmllZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9rcmlza293YWwvZXM1LXNoaW1cblx0dmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG5cdFx0dG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuXHRcdGZvckVhY2ggPSByZXF1aXJlKCcuL2ZvcmVhY2gnKSxcblx0XHRpc0FyZ3MgPSByZXF1aXJlKCcuL2lzQXJndW1lbnRzJyksXG5cdFx0aGFzRG9udEVudW1CdWcgPSAhKHsndG9TdHJpbmcnOiBudWxsfSkucHJvcGVydHlJc0VudW1lcmFibGUoJ3RvU3RyaW5nJyksXG5cdFx0aGFzUHJvdG9FbnVtQnVnID0gKGZ1bmN0aW9uICgpIHt9KS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgncHJvdG90eXBlJyksXG5cdFx0ZG9udEVudW1zID0gW1xuXHRcdFx0XCJ0b1N0cmluZ1wiLFxuXHRcdFx0XCJ0b0xvY2FsZVN0cmluZ1wiLFxuXHRcdFx0XCJ2YWx1ZU9mXCIsXG5cdFx0XHRcImhhc093blByb3BlcnR5XCIsXG5cdFx0XHRcImlzUHJvdG90eXBlT2ZcIixcblx0XHRcdFwicHJvcGVydHlJc0VudW1lcmFibGVcIixcblx0XHRcdFwiY29uc3RydWN0b3JcIlxuXHRcdF0sXG5cdFx0a2V5c1NoaW07XG5cblx0a2V5c1NoaW0gPSBmdW5jdGlvbiBrZXlzKG9iamVjdCkge1xuXHRcdHZhciBpc09iamVjdCA9IG9iamVjdCAhPT0gbnVsbCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0Jyxcblx0XHRcdGlzRnVuY3Rpb24gPSB0b1N0cmluZy5jYWxsKG9iamVjdCkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXScsXG5cdFx0XHRpc0FyZ3VtZW50cyA9IGlzQXJncyhvYmplY3QpLFxuXHRcdFx0dGhlS2V5cyA9IFtdO1xuXG5cdFx0aWYgKCFpc09iamVjdCAmJiAhaXNGdW5jdGlvbiAmJiAhaXNBcmd1bWVudHMpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3Qua2V5cyBjYWxsZWQgb24gYSBub24tb2JqZWN0XCIpO1xuXHRcdH1cblxuXHRcdGlmIChpc0FyZ3VtZW50cykge1xuXHRcdFx0Zm9yRWFjaChvYmplY3QsIGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdFx0XHR0aGVLZXlzLnB1c2godmFsdWUpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBuYW1lLFxuXHRcdFx0XHRza2lwUHJvdG8gPSBoYXNQcm90b0VudW1CdWcgJiYgaXNGdW5jdGlvbjtcblxuXHRcdFx0Zm9yIChuYW1lIGluIG9iamVjdCkge1xuXHRcdFx0XHRpZiAoIShza2lwUHJvdG8gJiYgbmFtZSA9PT0gJ3Byb3RvdHlwZScpICYmIGhhcy5jYWxsKG9iamVjdCwgbmFtZSkpIHtcblx0XHRcdFx0XHR0aGVLZXlzLnB1c2gobmFtZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoaGFzRG9udEVudW1CdWcpIHtcblx0XHRcdHZhciBjdG9yID0gb2JqZWN0LmNvbnN0cnVjdG9yLFxuXHRcdFx0XHRza2lwQ29uc3RydWN0b3IgPSBjdG9yICYmIGN0b3IucHJvdG90eXBlID09PSBvYmplY3Q7XG5cblx0XHRcdGZvckVhY2goZG9udEVudW1zLCBmdW5jdGlvbiAoZG9udEVudW0pIHtcblx0XHRcdFx0aWYgKCEoc2tpcENvbnN0cnVjdG9yICYmIGRvbnRFbnVtID09PSAnY29uc3RydWN0b3InKSAmJiBoYXMuY2FsbChvYmplY3QsIGRvbnRFbnVtKSkge1xuXHRcdFx0XHRcdHRoZUtleXMucHVzaChkb250RW51bSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhlS2V5cztcblx0fTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IGtleXNTaGltO1xufSgpKTtcblxuIiwidmFyIGdsb2JhbD10eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge307LypcbiAqXG4gKiBUaGlzIGlzIHVzZWQgdG8gYnVpbGQgdGhlIGJ1bmRsZSB3aXRoIGJyb3dzZXJpZnkuXG4gKlxuICogVGhlIGJ1bmRsZSBpcyB1c2VkIGJ5IHBlb3BsZSB3aG8gZG9lc24ndCB1c2UgYnJvd3NlcmlmeS5cbiAqIFRob3NlIHdobyB1c2UgYnJvd3NlcmlmeSB3aWxsIGluc3RhbGwgd2l0aCBucG0gYW5kIHJlcXVpcmUgdGhlIG1vZHVsZSxcbiAqIHRoZSBwYWNrYWdlLmpzb24gZmlsZSBwb2ludHMgdG8gaW5kZXguanMuXG4gKi9cbnZhciBBdXRoMCA9IHJlcXVpcmUoJy4vaW5kZXgnKTtcblxuLy91c2UgYW1kIG9yIGp1c3QgdGhyb3VnaHQgdG8gd2luZG93IG9iamVjdC5cbmlmICh0eXBlb2YgZ2xvYmFsLndpbmRvdy5kZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBnbG9iYWwud2luZG93LmRlZmluZS5hbWQpIHtcbiAgZ2xvYmFsLndpbmRvdy5kZWZpbmUoJ2F1dGgwJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gQXV0aDA7IH0pO1xufSBlbHNlIGlmIChnbG9iYWwud2luZG93KSB7XG4gIGdsb2JhbC53aW5kb3cuQXV0aDAgPSBBdXRoMDtcbn1cbiIsIm1vZHVsZS5leHBvcnRzPXtcInZlcnNpb25cIjpcIjYuNy4yXCJ9Il19
;