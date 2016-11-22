;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};/**
 * Module dependencies.
 */

var Base64Url         = require('./lib/base64_url');
var assert_required   = require('./lib/assert_required');
var is_array          = require('./lib/is-array');
var index_of          = require('./lib/index-of');
var nonceGenerator    = require('./lib/nonce-generator');

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

var SilentAuthenticationHandler = require('./lib/SilentAuthenticationHandler');

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
  var status = err.status;
  var responseText = 'string' === typeof err.responseText ? err.responseText : err;

  var isAffectedIEVersion = isInternetExplorer() === 10 || isInternetExplorer() === 11;
  var zeroStatus = (!status || status === 0);

  var onLine = !!window.navigator.onLine;

  // Request failed because we are offline.
  if (zeroStatus && !onLine ) {
    status = 0;
    responseText = {
      code: 'offline'
    };
  // http://stackoverflow.com/questions/23229723/ie-10-11-cors-status-0
  // XXX IE10 when a request fails in CORS returns status code 0
  // See: http://caniuse.com/#search=navigator.onLine
  } else if (zeroStatus && isAffectedIEVersion) {
    status = 401;
    responseText = {
      code: 'invalid_user_password'
    };
  // If not IE10/11 and not offline it means that Auth0 host is unreachable:
  // Connection Timeout or Connection Refused.
  } else if (zeroStatus) {
    status = 0;
    responseText = {
      code: 'connection_refused_timeout'
    };
  }

  var error = new LoginError(status, responseText);
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
  this._responseType = this._parseResponseType(options, true) || "code";
  this._responseMode = this._parseResponseMode(options, true);
  this._cordovaSocialPlugins = {
    facebook: this._phonegapFacebookLogin
  };
  this._useCordovaSocialPlugins = false || options.useCordovaSocialPlugins;
  this._sendClientInfo = null != options.sendSDKClientInfo ? options.sendSDKClientInfo : true;

  this._scope = options.scope || null;
  this._audience = options.audience || null;
}

/**
 * Export version with `Auth0` constructor
 *
 * @property {String} version
 */

Auth0.version = require('./version').str;

/**
 * Export client info object
 *
 *
 * @property {Hash}
 */

Auth0.clientInfo = { name: 'auth0.js', version: Auth0.version };


/**
 * Wraps calls to window.open so it can be overriden in Electron.
 *
 * In Electron, window.open returns an object which provides limited control
 * over the opened window (see
 * http://electron.atom.io/docs/v0.36.0/api/window-open/).
 */
Auth0.prototype.openWindow = function(url, name, options) {
  return window.open(url, name, stringifyPopupSettings(options));
}

/**
 * Redirect current location to `url`
 *
 * @param {String} url
 * @private
 */

Auth0.prototype._redirect = function (url) {
  global.window.location = url;
};

Auth0.prototype._getResponseType = function(opts) {
  return this._parseResponseType(opts) || this._responseType;
};

Auth0.prototype._getCallbackOnLocationHash = function(options) {
  return this._getResponseMode(options) !== "form_post"
    && this._getResponseType(options) !== "code";
};

Auth0.prototype._getResponseMode = function(opts) {
  var result = this._parseResponseMode(opts) || this._responseMode;
  return result === "form_post"
    ? "form_post"
    : null;
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
  return this._sendClientInfo
    ? { 'Auth0-Client': this._getClientInfoString() }
    : {};
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
  var result = {
    scope: 'openid',
    response_type: this._getResponseType(options)
  };

  var responseMode = this._getResponseMode(options);
  if (responseMode) {
    result.response_mode = responseMode;
  }

  return result;
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

  console.warn("DEPRECATION NOTICE: This method will be soon deprecated, use `getUserInfo` instead.")

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
 * Get user information from API
 *
 * @param {Object} profile
 * @param {String} id_token
 * @param {Function} callback
 * @private
 */

Auth0.prototype.getUserInfo = function (access_token, callback) {

  if ('function' !== typeof callback) {
    throw new Error('A callback function is required');
  }
  if (!access_token || typeof access_token !== 'string') {
    return callback(new Error('Invalid token'));
  }

  var _this = this;
  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = '/userinfo';
  var url = joinUrl(protocol, domain, endpoint);

  var fail = function (status, description) {
    var error = new Error(status + ': ' + (description || ''));

    // These two properties are added for compatibility with old versions (no Error instance was returned)
    error.error = status;
    error.error_description = description;

    callback(error);
  };

  return reqwest({
    url:          same_origin(protocol, domain) ? endpoint : url,
    method:       'post',
    type:         'json',
    crossOrigin:  !same_origin(protocol, domain),
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
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

Auth0.prototype.parseHash = function (hash, options) {
  options = options || {};
  hash = hash || window.location.hash;
  hash = hash.replace(/^#?\/?/, '');
  var parsed_qs = qs.parse(hash);

  if (parsed_qs.hasOwnProperty('error')) {
    var err = {
      error: parsed_qs.error,
      error_description: parsed_qs.error_description
    };

    if (parsed_qs.state) {
      err.state = parsed_qs.state;
    }

    return err;
  }

  if (!parsed_qs.hasOwnProperty('access_token')
       && !parsed_qs.hasOwnProperty('id_token')
       && !parsed_qs.hasOwnProperty('refresh_token')) {
    return null;
  }

  var prof;

  if (parsed_qs.id_token) {
    var invalidJwt = function (error) {
      var err = {
        error: 'invalid_token',
        error_description: error
      };
      return err;
    };

    prof = this.decodeJwt(parsed_qs.id_token);

    // aud should be the clientID
    var audiences = is_array(prof.aud) ? prof.aud : [ prof.aud ];
    if (index_of(audiences, this._clientID) === -1) {
      return invalidJwt(
        'The clientID configured (' + this._clientID + ') does not match with the clientID set in the token (' + audiences.join(', ') + ').');
    }

    // iss should be the Auth0 domain (i.e.: https://contoso.auth0.com/)
    if (prof.iss && prof.iss !== 'https://' + this._domain + '/') {
      return invalidJwt(
        'The domain configured (https://' + this._domain + '/) does not match with the domain set in the token (' + prof.iss + ').');
    }

    var nonce = options.nonce || window.localStorage.getItem('com.auth0.auth.nonce');
    window.localStorage.removeItem('com.auth0.auth.nonce');

    if ((nonce || prof.nonce) && prof.nonce !== nonce) {
      return invalidJwt('The nonce does not match.');
    }
  }

  return {
    accessToken: parsed_qs.access_token,
    idToken: parsed_qs.id_token,
    idTokenPayload: prof,
    refreshToken: parsed_qs.refresh_token,
    state: parsed_qs.state
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
    email: trim(options.email || options.username || ''),
    tenant: this._domain.split('.')[0]
  };

  if (typeof options.username === 'string') {
     opts.username = trim(options.username);
   }

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
    email:          trim(options.email || '')
  };

  if (typeof options.password === "string") {
    query.password = options.password;
  }

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

Auth0.prototype._buildAuthorizeUrl = function(options) {
  var constructorOptions = {};

  if (this._scope) {
    constructorOptions.scope = this._scope;
  }

  if (this._audience) {
    constructorOptions.audience = this._audience;
  }


  var qs = [
    this._getMode(options),
    constructorOptions,
    options,
    {
      client_id: this._clientID,
      redirect_uri: this._getCallbackURL(options)
    }
  ];

  var query = this._buildAuthorizeQueryString(qs);

  return joinUrl('https:', this._domain, '/authorize?' + query);
}

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

  if (this._responseType.indexOf('id_token') > -1 && !options.nonce) {
    if (typeof options.passcode === 'undefined' && (
        ((typeof options.username !== 'undefined' || typeof options.email !== 'undefined') && !callback) ||
        (typeof options.username === 'undefined' && typeof options.email === 'undefined')
        ) ) {
      var nonce = nonceGenerator.randomString(16);
      if (nonce) {
        options.nonce = nonce;
        window.localStorage.setItem('com.auth0.auth.nonce', nonce);
      }
    }
  }

  if (typeof options.passcode !== 'undefined') {
    return this.loginWithPasscode(options, callback);
  }

  if (typeof options.username !== 'undefined' ||
      typeof options.email !== 'undefined') {
    return this.loginWithUsernamePassword(options, callback);
  }

  if (!!window.cordova || !!window.electron) {
    return this.loginPhonegap(options, callback);
  }

  if (!!options.popup && this._getCallbackOnLocationHash(options)) {
    return this.loginWithPopup(options, callback);
  }

  if (!options.nonce && this._responseType.indexOf('id_token') > -1) {
    throw new Error('nonce is mandatory');
  }

  this._authorize(options);
};

Auth0.prototype._authorize = function(options) {
  var url = this._buildAuthorizeUrl(options);

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

  var ref = this.openWindow(popupUrl, '_blank', popupOptions);
  var answered = false;

  function errorHandler(event) {
    if (answered) { return; }
    answered = true;
    ref.close();
    callback(new Error(event.message), null);
  }

  function startHandler(event) {
    if (answered) { return; }

    if ( event.url && !(event.url.indexOf(mobileCallbackURL + '#') === 0 ||
                       event.url.indexOf(mobileCallbackURL + '?') === 0)) { return; }

    var result = _this.parseHash(event.url.slice(mobileCallbackURL.length));

    if (!result) {
      answered = true;
      ref.close();
      callback(new Error('Error parsing hash'), null);
      return;
    }

    if (result.idToken) {
      answered = true;
      ref.close();
      callback(null, result);
      return;
    }


    // Case where we've found an error
    answered = true;
    ref.close();
    callback(new Error(result.err || result.error || 'Something went wrong'), null);
  }

  function exitHandler() {
    if (answered) { return; }

    ref.removeEventListener('loaderror', errorHandler);
    ref.removeEventListener('loadstart', startHandler);
    ref.removeEventListener('exit', exitHandler);

    callback(new Error('Browser window closed'), null);
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

  if (!options.nonce && this._responseType.indexOf('id_token') > -1) {
    throw new Error('nonce is mandatory');
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
    if (result.access_token || result.id_token) {
      return callback(null, _this._prepareResult(result));
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

  if (!options.nonce && this._responseType.indexOf('id_token') > -1) {
    throw new Error('nonce is mandatory');
  }

  var winchanOptions = {
    url: 'https://' + this._domain + '/sso_dbconnection_popup/' + this._clientID,
    relay_url: 'https://' + this._domain + '/relay.html',
    window_features: stringifyPopupSettings(popupOptions),
    popup: this._current_popup,
    params: {
      domain:                 this._domain,
      clientID:               this._clientID,
      options: {
        // TODO What happens with i18n?
        username:   trim(options.username || options.email || ''),
        password:   options.password,
        connection: options.connection,
        state:      options.state,
        scope:      options.scope
      }
    }
  };

  if (options._csrf) {
    winchanOptions.params.options._csrf = options._csrf;
  }

  if (options.device) {
    winchanOptions.params.options.device = options.device;
  }

  var popup = WinChan.open(winchanOptions, function (err, result) {
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
      return callback(null, _this._prepareResult(result));
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

  if (this._useJSONP) {
    return jsonp(url + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
      if (err) {
        return callback(err);
      }
      if('error' in resp) {
        var error = new LoginError(resp.status, resp.error);
        return callback(error);
      }
      callback(null, _this._prepareResult(resp));
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
      callback(null, _this._prepareResult(resp));
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

  if (this._useJSONP) {
    return jsonp(url + '?' + qs.stringify(query), jsonpOpts, function (err, resp) {
      if (err) {
        return callback(err);
      }
      if('error' in resp) {
        var error = new LoginError(resp.status, resp.error);
        return callback(error);
      }
      callback(null, _this._prepareResult(resp));
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
      callback(null, _this._prepareResult(resp));
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

  if (!options.nonce && this._responseType.indexOf('id_token') > -1) {
    throw new Error('nonce is mandatory');
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
 * Fetches a new id_token/access_token from Auth0
 *
 * @example
 *
 *     auth0.silentAuthentication({}, function(error, result) {
 *        if (error) {
 *          console.log(error);
 *        }
 *        // result.id_token
 *     });
 *
 * @example
 *
 *     auth0.silentAuthentication({callbackUrl: "https://site.com/silentCallback"}, function(error, result) {
 *        if (error) {
 *          console.log(error);
 *        }
 *        // result.id_token
 *     });
 *
 * @method silentAutnetication
 * @param {Object} options
 * @param {function} callback
 */
Auth0.prototype.silentAuthentication = function (options, callback) {
  var usePostMessage = options.usePostMessage || false;

  delete options.usePostMessage;

  options = xtend(options, {prompt:'none'});
  var handler = new SilentAuthenticationHandler(this, this._buildAuthorizeUrl(options));
  handler.login(callback, usePostMessage);
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
 * @example
 *
 *     auth0.logout(null, {version: 'v2'});
 *     // redirects to -> 'https://yourapp.auth0.com/v2/logout'
 *
 * @example
 *
 *     auth0.logout({returnTo: 'http://logout'}, {version: 2});
 *     // redirects to -> 'https://yourapp.auth0.com/v2/logout?returnTo=http://logout'
 *
 * @method logout
 * @param {Object} query
 */

Auth0.prototype.logout = function (query, options) {
  var pathName = '/logout';
  options = options || {};

  if (options.version == 'v2') {
    pathName = '/v2' + pathName
  }

  var url = joinUrl('https:', this._domain, pathName);

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
 * @param {Function} cb
 */

Auth0.prototype.getSSOData = function (withActiveDirectories, cb) {
  if (typeof withActiveDirectories === 'function') {
    cb = withActiveDirectories;
    withActiveDirectories = false;
  }

  var noResult = {sso: false};

  if (this._useJSONP) {
    var error = new Error("The SSO data can't be obtained using JSONP");
    setTimeout(function() { cb(error, noResult) }, 0);
    return;
  }

  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = '/user/ssodata';
  var url = joinUrl(protocol, domain, endpoint);
  var sameOrigin = same_origin(protocol, domain);
  var data = {};

  if (withActiveDirectories) {
    data = {ldaps: 1, client_id: this._clientID};
  }

  return reqwest({
    url:             sameOrigin ? endpoint : url,
    method:          'get',
    type:            'json',
    data:            data,
    crossOrigin:     !sameOrigin,
    withCredentials: !sameOrigin,
    timeout:         3000
  }).fail(function(err) {
    var error = new Error("There was an error in the request that obtains the user's SSO data.");
    error.cause = err;
    cb(error, noResult);
  }).then(function(resp) {
    cb(null, resp);
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

      data.authParams.redirect_uri = options.callbackURL || this._callbackURL;
      data.authParams.response_type = this._getResponseType(options);
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
 * Returns the ISO 3166-1 code for the country where the request is
 * originating.
 *
 * Fails if the request has to be made using JSONP.
 *
 * @private
 */
Auth0.prototype.getUserCountry = function(cb) {
  var protocol = 'https:';
  var domain = this._domain;
  var endpoint = "/user/geoloc/country";
  var url = joinUrl(protocol, domain, endpoint);

  if (this._useJSONP) {
    var error = new Error("The user's country can't be obtained using JSONP");
    setTimeout(function() { cb(error) }, 0);
    return;
  }

  reqwest({
    url: same_origin(protocol, domain) ? endpoint : url,
    method: "get",
    type: "json",
    headers: this._getClientInfoHeader(),
    crossOrigin: !same_origin(protocol, domain),
    success: function(resp) {
      cb(null, resp.country_code)
    },
    error: function(err) {
      var error = new Error("There was an error in the request that obtains the user's country");
      error.cause = err;
      cb(error);
    }
  });
}

Auth0.prototype._prepareResult = function(result) {
  if (!result || typeof result !== "object") {
    return;
  }

  var decodedIdToken = result.id_token ? this.decodeJwt(result.id_token) : undefined;

  return {
    accessToken: result.access_token,
    idToken: result.id_token,
    idTokenPayload: result.profile || decodedIdToken,
    refreshToken: result.refresh_token,
    state: result.state
  };
}

Auth0.prototype._parseResponseType = function(opts, setFlags) {
  if (!opts) opts = {};

  if (setFlags
       && !this._providedResponseOptions
       && opts.hasOwnProperty("callbackOnLocationHash")) {
    this._providedCallbackOnLocationHash = true;
  }

  if (setFlags
       && !this._providedCallbackOnLocationHash
       && opts.hasOwnProperty("responseType")) {
    this._providedResponseOptions = true;
  }

  if (!this._providedCallbackOnLocationHash
       && !this._providedResponseOptions
       && opts.hasOwnProperty("callbackOnLocationHash")
       && opts.hasOwnProperty("responseType")) {
    warn("The responseType option will be ignored. Both callbackOnLocationHash and responseType options were provided and they can't be used together.");
  }

  if (this._providedCallbackOnLocationHash
       && opts.hasOwnProperty("responseType")) {
    warn("The responseType option will be ignored. The callbackOnLocationHash option was provided to the constructor and they can't be mixed.");
  }

  if (this._providedResponseOptions
       && opts.hasOwnProperty("callbackOnLocationHash")) {
    warn("The callbackOnLocationHash option will be ignored. The responseType option was provided to the constructor and they can't be mixed.");
  }

  if (!this._providedCallbackOnLocationHash
       && !opts.hasOwnProperty("callbackOnLocationHash")
       && opts.responseType
       && !validResponseType(opts.responseType)) {
    warn("The responseType option will be ignored. Its valid values are \"code\", \"id_token\", \"token\" or any combination of them.");
  }

  var result = undefined;

  if (!this._providedResponseOptions
       && null != opts.callbackOnLocationHash) {
    result = callbackOnLocationHashToResponseType(opts.callbackOnLocationHash);
  }

  if (!this._providedCallbackOnLocationHash
       && !opts.hasOwnProperty("callbackOnLocationHash")
       && opts.responseType
       && validResponseType(opts.responseType)) {
    result = opts.responseType;
  }

  return result;
}

Auth0.prototype._parseResponseMode = function(opts, setFlags) {
  if (!opts) opts = {};

  if (setFlags
       && !this._providedCallbackOnLocationHash
       && opts.hasOwnProperty("responseMode")) {
    this._providedResponseOptions = true;
  }

  if (this._providedCallbackOnLocationHash
       && opts.hasOwnProperty("responseMode")) {
    warn("The responseMode option will be ignored. The callbackOnLocationHash option was provided to the constructor and they can't be mixed.");
  }

  if (!this._providedCallbackOnLocationHash
       && !this._providedResponseOptions
       && opts.hasOwnProperty("callbackOnLocationHash")
       && opts.hasOwnProperty("responseMode")) {
    warn("The responseMode option will be ignored. Both callbackOnLocationHash and responseMode options were provided and they can't be used together.");
  }

  var result = undefined;

  if (!this._providedCallbackOnLocationHash
       && opts.responseMode
       && !validResponseMode(opts.responseMode)) {
    warn("The responseMode option will be ignored. Its only valid value is \"form_post\".");
  }

  if (!this._providedCallbackOnLocationHash
       && validResponseMode(opts.responseMode)) {
    result = opts.responseMode;
  }

  return result;
}

function callbackOnLocationHashToResponseType(x) {
  return x ? "token" : "code";
}

function validResponseType(str) {
  if (typeof str !== "string") return false;

  var RESPONSE_TYPES = ["code", "id_token", "token"];
  var parts = str.split(" ");

  for (var i = 0; i < parts.length; i++) {
    if (RESPONSE_TYPES.indexOf(parts[i]) === -1) return false;
  }

  return parts.length >= 1;
}

function validResponseMode(str) {
  return str === "form_post";
}


function warn(str) {
  if (console && console.warn) {
    console.warn(str);
  }
}

/**
 * Expose `Auth0` constructor
 */

module.exports = Auth0;

},{"./lib/LoginError":3,"./lib/SilentAuthenticationHandler":4,"./lib/assert_required":5,"./lib/base64_url":6,"./lib/index-of":7,"./lib/is-array":8,"./lib/json-parse":9,"./lib/nonce-generator":10,"./lib/same-origin":11,"./lib/use_jsonp":12,"./version":36,"jsonp":17,"qs":22,"reqwest":26,"trim":27,"winchan":28,"xtend":30}],2:[function(require,module,exports){
var IframeHandler = function (options) {
  this.auth0 = options.auth0;
  this.url = options.url;
  this.callback = options.callback;
  this.timeout = options.timeout || 60 * 1000;
  this.timeoutCallback = options.timeoutCallback || null;
  this.usePostMessage = options.usePostMessage || false;
  this.iframe = null;
  this.timeoutHandle = null;
  this._destroyTimeout = null;
  this.transientMessageEventListener = null;
  this.transientEventListener = null;
}

IframeHandler.prototype.init = function (url) {
  this.iframe = document.createElement('iframe');
  this.iframe.style.display = "none";
  this.iframe.src = this.url;

  var _this = this; 

  if (this.usePostMessage) {

    // Workaround to avoid using bind that does not work in IE8
    this.transientMessageEventListener = function(e) {
      _this.messageEventListener(e);
    };

    window.addEventListener("message", this.transientMessageEventListener, false);
  } 
  else {

    // Workaround to avoid using bind that does not work in IE8
    this.transientEventListener = function() {
      _this.loadEventListener();
    };

    this.iframe.addEventListener("load", this.transientEventListener, false);
  }

  document.body.appendChild(this.iframe);

  this.timeoutHandle = setTimeout(function() {
    _this.timeoutHandler();
  }, this.timeout);
}

IframeHandler.prototype.messageEventListener = function (e) { 
  this.callbackHandler(e.data);

  this.destroy()
}

IframeHandler.prototype.loadEventListener = function () { 
  var result = this.auth0.parseHash(this.iframe.contentWindow.location.hash);

  if (!result) return;

  this.callbackHandler(result);
  
  this.destroy();
}

IframeHandler.prototype.callbackHandler = function (result) {
  var error = null;

  if (result.error) {
    error = result;
    result = null;
  }

  this.callback(error, result);
}

IframeHandler.prototype.timeoutHandler = function () {
  if (this.timeoutCallback) {
    this.timeoutCallback();
  }
  this.destroy();
}
IframeHandler.prototype.destroy = function () {
  var _this = this;

  if (this.timeoutHandle) {
    clearTimeout(this.timeoutHandle);
  }

  this._destroyTimeout = setTimeout(function () {
    if (_this.usePostMessage) {
      window.removeEventListener("message", _this.transientMessageEventListener, false);
    }
    else {
      _this.iframe.removeEventListener("load", _this.transientEventListener, false);
    }
    document.body.removeChild(_this.iframe)
  }, 0);
} 


module.exports = IframeHandler;
},{}],3:[function(require,module,exports){
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

  var message = obj.description || obj.message || obj.error;

  if ('PasswordStrengthError' === obj.name) {
    message = "Password is not strong enough.";
  }

  var err = Error.call(this, message);

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

},{"./json-parse":9}],4:[function(require,module,exports){
var IframeHandler = require('./IframeHandler');

var SilentAuthenticationHandler = function (auth0, authenticationUrl, timeout) {
  
  this.auth0 = auth0;
  this.authenticationUrl = authenticationUrl;
  this.timeout = timeout || 60 * 1000;
  this.handler = null;

}

SilentAuthenticationHandler.prototype.timeoutCallback = function () {

  console.error('Timeout during silent authentication.')

}

SilentAuthenticationHandler.prototype.login = function (callback, usePostMessage) {

  this.handler = new IframeHandler({
    auth0:this.auth0,
    url: this.authenticationUrl, 
    callback: callback, 
    timeout: this.timeout, 
    timeoutCallback: this.timeoutCallback,
    usePostMessage: usePostMessage || false
  });

  this.handler.init();

}


module.exports = SilentAuthenticationHandler;
},{"./IframeHandler":2}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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
},{"Base64":13}],7:[function(require,module,exports){
/**
 * Resolve `isArray` as native or fallback
 */

module.exports = Array.prototype.indexOf
  ? nativeIndexOf
  : polyfillIndexOf;


function nativeIndexOf(array, searchElement, fromIndex) {
  return array.indexOf(searchElement, fromIndex);
}


function polyfillIndexOf(array, searchElement, fromIndex) {
  // Production steps of ECMA-262, Edition 5, 15.4.4.14
  // Reference: http://es5.github.io/#x15.4.4.14

  var k;

  // 1. Let O be the result of calling ToObject passing
  //    the array value as the argument.
  if (array == null) {
    throw new TypeError('"array" is null or not defined');
  }

  var O = Object(array);

  // 2. Let lenValue be the result of calling the Get
  //    internal method of O with the argument "length".
  // 3. Let len be ToUint32(lenValue).
  var len = O.length >>> 0;

  // 4. If len is 0, return -1.
  if (len === 0) {
    return -1;
  }

  // 5. If argument fromIndex was passed let n be
  //    ToInteger(fromIndex); else let n be 0.
  var n = +fromIndex || 0;

  if (Math.abs(n) === Infinity) {
    n = 0;
  }

  // 6. If n >= len, return -1.
  if (n >= len) {
    return -1;
  }

  // 7. If n >= 0, then Let k be n.
  // 8. Else, n<0, Let k be len - abs(n).
  //    If k is less than 0, then let k be 0.
  k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

  // 9. Repeat, while k < len
  while (k < len) {
    // a. Let Pk be ToString(k).
    //   This is implicit for LHS operands of the in operator
    // b. Let kPresent be the result of calling the
    //    HasProperty internal method of O with argument Pk.
    //   This step can be combined with c
    // c. If kPresent is true, then
    //    i.  Let elementK be the result of calling the Get
    //        internal method of O with the argument ToString(k).
    //   ii.  Let same be the result of applying the
    //        Strict Equality Comparison Algorithm to
    //        searchElement and elementK.
    //  iii.  If same is true, return k.
    if (k in O && O[k] === searchElement) {
      return k;
    }
    k++;
  }
  return -1;
};

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
/**
 * Expose `JSON.parse` method or fallback if not
 * exists on `window`
 */

module.exports = 'undefined' === typeof JSON
  ? require('json-fallback').parse
  : JSON.parse;

},{"json-fallback":16}],10:[function(require,module,exports){
function randomString(length) {
    var bytes = new Uint8Array(length);
    var cryptoObj = window.crypto || window.msCrypto;

    if (!cryptoObj) {
      return null;
    }

    var random = cryptoObj.getRandomValues(bytes);
    var result = [];
    var charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';
    random.forEach(function (c) {
        result.push(charset[c % charset.length]);
    });
    return result.join('');
}

module.exports = {
  randomString: randomString
};
},{}],11:[function(require,module,exports){
/**
 * Check for same origin policy
 */

module.exports = same_origin;

function same_origin (tprotocol, tdomain, tport) {
  var protocol = window.location.protocol;
  var domain = window.location.hostname;
  var port = window.location.port;

  tport = tport || '';
  return protocol === tprotocol && domain === tdomain && port === tport;
}

},{}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){

},{}],15:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],16:[function(require,module,exports){
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
},{}],17:[function(require,module,exports){
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

},{"debug":18}],18:[function(require,module,exports){
var process=require("__browserify_process");
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
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

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
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && 'WebkitAppearance' in document.documentElement.style) ||
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
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
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
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
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
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
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
    return exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (typeof process !== 'undefined' && 'env' in process) {
    return process.env.DEBUG;
  }
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":19,"__browserify_process":15}],19:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug.debug = debug;
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

    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

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

    // apply env-specific formatting
    args = exports.formatArgs.apply(self, args);

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
    namespaces = split[i].replace(/[\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*?');
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

},{"ms":20}],20:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000
var m = s * 60
var h = m * 60
var d = h * 24
var y = d * 365.25

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {}
  var type = typeof val
  if (type === 'string' && val.length > 0) {
    return parse(val)
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ?
			fmtLong(val) :
			fmtShort(val)
  }
  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val))
}

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str)
  if (str.length > 10000) {
    return
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str)
  if (!match) {
    return
  }
  var n = parseFloat(match[1])
  var type = (match[2] || 'ms').toLowerCase()
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y
    case 'days':
    case 'day':
    case 'd':
      return n * d
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n
    default:
      return undefined
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd'
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h'
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm'
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's'
  }
  return ms + 'ms'
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms'
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name
  }
  return Math.ceil(ms / n) + ' ' + name + 's'
}

},{}],21:[function(require,module,exports){
'use strict';

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

module.exports = {
    'default': 'RFC3986',
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return value;
        }
    },
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

},{}],22:[function(require,module,exports){
'use strict';

var stringify = require('./stringify');
var parse = require('./parse');
var formats = require('./formats');

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};

},{"./formats":21,"./parse":23,"./stringify":24}],23:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var has = Object.prototype.hasOwnProperty;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    arrayLimit: 20,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    parameterLimit: 1000,
    plainObjects: false,
    strictNullHandling: false
};

var parseValues = function parseValues(str, options) {
    var obj = {};
    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

    for (var i = 0; i < parts.length; ++i) {
        var part = parts[i];
        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part);
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos));
            val = options.decoder(part.slice(pos + 1));
        }
        if (has.call(obj, key)) {
            obj[key] = [].concat(obj[key]).concat(val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function parseObject(chain, val, options) {
    if (!chain.length) {
        return val;
    }

    var root = chain.shift();

    var obj;
    if (root === '[]') {
        obj = [];
        obj = obj.concat(parseObject(chain, val, options));
    } else {
        obj = options.plainObjects ? Object.create(null) : {};
        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
        var index = parseInt(cleanRoot, 10);
        if (
            !isNaN(index) &&
            root !== cleanRoot &&
            String(index) === cleanRoot &&
            index >= 0 &&
            (options.parseArrays && index <= options.arrayLimit)
        ) {
            obj = [];
            obj[index] = parseObject(chain, val, options);
        } else {
            obj[cleanRoot] = parseObject(chain, val, options);
        }
    }

    return obj;
};

var parseKeys = function parseKeys(givenKey, val, options) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^\.\[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var parent = /^([^\[\]]*)/;
    var child = /(\[[^\[\]]*\])/g;

    // Get the parent

    var segment = parent.exec(key);

    // Stash the parent if it exists

    var keys = [];
    if (segment[1]) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, segment[1])) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(segment[1]);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].replace(/\[|\]/g, ''))) {
            if (!options.allowPrototypes) {
                continue;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options);
};

module.exports = function (str, opts) {
    var options = opts || {};

    if (options.decoder !== null && options.decoder !== undefined && typeof options.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    options.delimiter = typeof options.delimiter === 'string' || utils.isRegExp(options.delimiter) ? options.delimiter : defaults.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : defaults.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : defaults.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.decoder = typeof options.decoder === 'function' ? options.decoder : defaults.decoder;
    options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : defaults.allowDots;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : defaults.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : defaults.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : defaults.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options);
        obj = utils.merge(obj, newObj, options);
    }

    return utils.compact(obj);
};

},{"./utils":25}],24:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var formats = require('./formats');

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var toISO = Date.prototype.toISOString;

var defaults = {
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var stringify = function stringify(object, prefix, generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots, serializeDate, formatter) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (obj === null) {
        if (strictNullHandling) {
            return encoder ? encoder(prefix) : prefix;
        }

        obj = '';
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || utils.isBuffer(obj)) {
        if (encoder) {
            return [formatter(encoder(prefix)) + '=' + formatter(encoder(obj))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (Array.isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        if (Array.isArray(obj)) {
            values = values.concat(stringify(
                obj[key],
                generateArrayPrefix(prefix, key),
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter
            ));
        } else {
            values = values.concat(stringify(
                obj[key],
                prefix + (allowDots ? '.' + key : '[' + key + ']'),
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter
            ));
        }
    }

    return values;
};

module.exports = function (object, opts) {
    var obj = object;
    var options = opts || {};
    var delimiter = typeof options.delimiter === 'undefined' ? defaults.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;
    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : defaults.skipNulls;
    var encode = typeof options.encode === 'boolean' ? options.encode : defaults.encode;
    var encoder = encode ? (typeof options.encoder === 'function' ? options.encoder : defaults.encoder) : null;
    var sort = typeof options.sort === 'function' ? options.sort : null;
    var allowDots = typeof options.allowDots === 'undefined' ? false : options.allowDots;
    var serializeDate = typeof options.serializeDate === 'function' ? options.serializeDate : defaults.serializeDate;
    if (typeof options.format === 'undefined') {
        options.format = formats.default;
    } else if (!Object.prototype.hasOwnProperty.call(formats.formatters, options.format)) {
        throw new TypeError('Unknown format option provided.');
    }
    var formatter = formats.formatters[options.format];
    var objKeys;
    var filter;

    if (options.encoder !== null && options.encoder !== undefined && typeof options.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (Array.isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    } else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (sort) {
        objKeys.sort(sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        keys = keys.concat(stringify(
            obj[key],
            key,
            generateArrayPrefix,
            strictNullHandling,
            skipNulls,
            encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            formatter
        ));
    }

    return keys.join(delimiter);
};

},{"./formats":21,"./utils":25}],25:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

exports.arrayToObject = function (source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

exports.merge = function (target, source, options) {
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        } else if (typeof target === 'object') {
            target[source] = true;
        } else {
            return [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (Array.isArray(target) && !Array.isArray(source)) {
        mergeTarget = exports.arrayToObject(target, options);
    }

    if (Array.isArray(target) && Array.isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                if (target[i] && typeof target[i] === 'object') {
                    target[i] = exports.merge(target[i], item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (Object.prototype.hasOwnProperty.call(acc, key)) {
            acc[key] = exports.merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

exports.decode = function (str) {
    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

exports.encode = function (str) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = typeof str === 'string' ? str : String(str);

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D || // -
            c === 0x2E || // .
            c === 0x5F || // _
            c === 0x7E || // ~
            (c >= 0x30 && c <= 0x39) || // 0-9
            (c >= 0x41 && c <= 0x5A) || // a-z
            (c >= 0x61 && c <= 0x7A) // A-Z
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += hexTable[0xF0 | (c >> 18)] + hexTable[0x80 | ((c >> 12) & 0x3F)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

exports.compact = function (obj, references) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    var refs = references || [];
    var lookup = refs.indexOf(obj);
    if (lookup !== -1) {
        return refs[lookup];
    }

    refs.push(obj);

    if (Array.isArray(obj)) {
        var compacted = [];

        for (var i = 0; i < obj.length; ++i) {
            if (obj[i] && typeof obj[i] === 'object') {
                compacted.push(exports.compact(obj[i], refs));
            } else if (typeof obj[i] !== 'undefined') {
                compacted.push(obj[i]);
            }
        }

        return compacted;
    }

    var keys = Object.keys(obj);
    keys.forEach(function (key) {
        obj[key] = exports.compact(obj[key], refs);
    });

    return obj;
};

exports.isRegExp = function (obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

exports.isBuffer = function (obj) {
    if (obj === null || typeof obj === 'undefined') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

},{}],26:[function(require,module,exports){
/*!
  * Reqwest! A general purpose XHR connection manager
  * license MIT (c) Dustin Diaz 2015
  * https://github.com/ded/reqwest
  */

!function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else context[name] = definition()
}('reqwest', this, function () {

  var context = this

  if ('window' in context) {
    var doc = document
      , byTag = 'getElementsByTagName'
      , head = doc[byTag]('head')[0]
  } else {
    var XHR2
    try {
      XHR2 = require('xhr2')
    } catch (ex) {
      throw new Error('Peer dependency `xhr2` required! Please npm install xhr2')
    }
  }


  var httpsRe = /^http/
    , protocolRe = /(^\w+):\/\//
    , twoHundo = /^(20\d|1223)$/ //http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
    , readyState = 'readyState'
    , contentType = 'Content-Type'
    , requestedWith = 'X-Requested-With'
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
          var xhr = context[xmlHttpRequest] ? new XMLHttpRequest() : null
          if (xhr && 'withCredentials' in xhr) {
            return xhr
          } else if (context[xDomainRequest]) {
            return new XDomainRequest()
          } else {
            throw new Error('Browser does not support cross-origin requests')
          }
        } else if (context[xmlHttpRequest]) {
          return new XMLHttpRequest()
        } else if (XHR2) {
          return new XHR2()
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
    var protocol = protocolRe.exec(r.url)
    protocol = (protocol && protocol[1]) || context.location.protocol
    return httpsRe.test(protocol) ? twoHundo.test(r.request.status) : !!r.request.response
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

    var isAFormData = typeof FormData !== 'undefined' && (o['data'] instanceof FormData);
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

    context[cbval] = generalCallback

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
    if (context[xDomainRequest] && http instanceof context[xDomainRequest]) {
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
    if (header === null) return undefined; //In case of no content-type.
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
            resp = context.JSON ? context.JSON.parse(r) : eval('(' + r + ')')
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

},{"xhr2":14}],27:[function(require,module,exports){

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

},{}],28:[function(require,module,exports){
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
    if (typeof navigator === 'undefined') {
      return false;
    }

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
    return (typeof window !== 'undefined' && window.JSON && window.JSON.stringify &&
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

},{}],29:[function(require,module,exports){
module.exports = hasKeys

function hasKeys(source) {
    return source !== null &&
        (typeof source === "object" ||
        typeof source === "function")
}

},{}],30:[function(require,module,exports){
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

},{"./has-keys":29,"object-keys":32}],31:[function(require,module,exports){
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


},{}],32:[function(require,module,exports){
module.exports = Object.keys || require('./shim');


},{"./shim":34}],33:[function(require,module,exports){
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


},{}],34:[function(require,module,exports){
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


},{"./foreach":31,"./isArguments":33}],35:[function(require,module,exports){
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

},{"./index":1}],36:[function(require,module,exports){
module.exports = { str: "7.5.0" };

},{}]},{},[35])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvbGliL2plbmtpbnMvd29ya3NwYWNlL2F1dGgwLWpzL2luZGV4LmpzIiwiL3Zhci9saWIvamVua2lucy93b3Jrc3BhY2UvYXV0aDAtanMvbGliL0lmcmFtZUhhbmRsZXIuanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9saWIvTG9naW5FcnJvci5qcyIsIi92YXIvbGliL2plbmtpbnMvd29ya3NwYWNlL2F1dGgwLWpzL2xpYi9TaWxlbnRBdXRoZW50aWNhdGlvbkhhbmRsZXIuanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9saWIvYXNzZXJ0X3JlcXVpcmVkLmpzIiwiL3Zhci9saWIvamVua2lucy93b3Jrc3BhY2UvYXV0aDAtanMvbGliL2Jhc2U2NF91cmwuanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9saWIvaW5kZXgtb2YuanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9saWIvaXMtYXJyYXkuanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9saWIvanNvbi1wYXJzZS5qcyIsIi92YXIvbGliL2plbmtpbnMvd29ya3NwYWNlL2F1dGgwLWpzL2xpYi9ub25jZS1nZW5lcmF0b3IuanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9saWIvc2FtZS1vcmlnaW4uanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9saWIvdXNlX2pzb25wLmpzIiwiL3Zhci9saWIvamVua2lucy93b3Jrc3BhY2UvYXV0aDAtanMvbm9kZV9tb2R1bGVzL0Jhc2U2NC9iYXNlNjQuanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwiL3Zhci9saWIvamVua2lucy93b3Jrc3BhY2UvYXV0aDAtanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL3Zhci9saWIvamVua2lucy93b3Jrc3BhY2UvYXV0aDAtanMvbm9kZV9tb2R1bGVzL2pzb24tZmFsbGJhY2svaW5kZXguanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9ub2RlX21vZHVsZXMvanNvbnAvaW5kZXguanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9ub2RlX21vZHVsZXMvanNvbnAvbm9kZV9tb2R1bGVzL2RlYnVnL2Jyb3dzZXIuanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9ub2RlX21vZHVsZXMvanNvbnAvbm9kZV9tb2R1bGVzL2RlYnVnL2RlYnVnLmpzIiwiL3Zhci9saWIvamVua2lucy93b3Jrc3BhY2UvYXV0aDAtanMvbm9kZV9tb2R1bGVzL2pzb25wL25vZGVfbW9kdWxlcy9kZWJ1Zy9ub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9ub2RlX21vZHVsZXMvcXMvbGliL2Zvcm1hdHMuanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9ub2RlX21vZHVsZXMvcXMvbGliL2luZGV4LmpzIiwiL3Zhci9saWIvamVua2lucy93b3Jrc3BhY2UvYXV0aDAtanMvbm9kZV9tb2R1bGVzL3FzL2xpYi9wYXJzZS5qcyIsIi92YXIvbGliL2plbmtpbnMvd29ya3NwYWNlL2F1dGgwLWpzL25vZGVfbW9kdWxlcy9xcy9saWIvc3RyaW5naWZ5LmpzIiwiL3Zhci9saWIvamVua2lucy93b3Jrc3BhY2UvYXV0aDAtanMvbm9kZV9tb2R1bGVzL3FzL2xpYi91dGlscy5qcyIsIi92YXIvbGliL2plbmtpbnMvd29ya3NwYWNlL2F1dGgwLWpzL25vZGVfbW9kdWxlcy9yZXF3ZXN0L3JlcXdlc3QuanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9ub2RlX21vZHVsZXMvdHJpbS9pbmRleC5qcyIsIi92YXIvbGliL2plbmtpbnMvd29ya3NwYWNlL2F1dGgwLWpzL25vZGVfbW9kdWxlcy93aW5jaGFuL3dpbmNoYW4uanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9ub2RlX21vZHVsZXMveHRlbmQvaGFzLWtleXMuanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9ub2RlX21vZHVsZXMveHRlbmQvaW5kZXguanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9ub2RlX21vZHVsZXMveHRlbmQvbm9kZV9tb2R1bGVzL29iamVjdC1rZXlzL2ZvcmVhY2guanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy9ub2RlX21vZHVsZXMveHRlbmQvbm9kZV9tb2R1bGVzL29iamVjdC1rZXlzL2luZGV4LmpzIiwiL3Zhci9saWIvamVua2lucy93b3Jrc3BhY2UvYXV0aDAtanMvbm9kZV9tb2R1bGVzL3h0ZW5kL25vZGVfbW9kdWxlcy9vYmplY3Qta2V5cy9pc0FyZ3VtZW50cy5qcyIsIi92YXIvbGliL2plbmtpbnMvd29ya3NwYWNlL2F1dGgwLWpzL25vZGVfbW9kdWxlcy94dGVuZC9ub2RlX21vZHVsZXMvb2JqZWN0LWtleXMvc2hpbS5qcyIsIi92YXIvbGliL2plbmtpbnMvd29ya3NwYWNlL2F1dGgwLWpzL3N0YW5kYWxvbmUuanMiLCIvdmFyL2xpYi9qZW5raW5zL3dvcmtzcGFjZS9hdXRoMC1qcy92ZXJzaW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1cUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsvKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIEJhc2U2NFVybCAgICAgICAgID0gcmVxdWlyZSgnLi9saWIvYmFzZTY0X3VybCcpO1xudmFyIGFzc2VydF9yZXF1aXJlZCAgID0gcmVxdWlyZSgnLi9saWIvYXNzZXJ0X3JlcXVpcmVkJyk7XG52YXIgaXNfYXJyYXkgICAgICAgICAgPSByZXF1aXJlKCcuL2xpYi9pcy1hcnJheScpO1xudmFyIGluZGV4X29mICAgICAgICAgID0gcmVxdWlyZSgnLi9saWIvaW5kZXgtb2YnKTtcbnZhciBub25jZUdlbmVyYXRvciAgICA9IHJlcXVpcmUoJy4vbGliL25vbmNlLWdlbmVyYXRvcicpO1xuXG52YXIgcXMgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdxcycpO1xudmFyIHh0ZW5kICAgICAgICAgICAgID0gcmVxdWlyZSgneHRlbmQnKTtcbnZhciB0cmltICAgICAgICAgICAgICA9IHJlcXVpcmUoJ3RyaW0nKTtcbnZhciByZXF3ZXN0ICAgICAgICAgICA9IHJlcXVpcmUoJ3JlcXdlc3QnKTtcbnZhciBXaW5DaGFuICAgICAgICAgICA9IHJlcXVpcmUoJ3dpbmNoYW4nKTtcblxudmFyIGpzb25wICAgICAgICAgICAgID0gcmVxdWlyZSgnanNvbnAnKTtcbnZhciBqc29ucE9wdHMgICAgICAgICA9IHsgcGFyYW06ICdjYngnLCB0aW1lb3V0OiA4MDAwLCBwcmVmaXg6ICdfX2F1dGgwanAnIH07XG5cbnZhciBzYW1lX29yaWdpbiAgICAgICA9IHJlcXVpcmUoJy4vbGliL3NhbWUtb3JpZ2luJyk7XG52YXIganNvbl9wYXJzZSAgICAgICAgPSByZXF1aXJlKCcuL2xpYi9qc29uLXBhcnNlJyk7XG52YXIgTG9naW5FcnJvciAgICAgICAgPSByZXF1aXJlKCcuL2xpYi9Mb2dpbkVycm9yJyk7XG52YXIgdXNlX2pzb25wICAgICAgICAgPSByZXF1aXJlKCcuL2xpYi91c2VfanNvbnAnKTtcblxudmFyIFNpbGVudEF1dGhlbnRpY2F0aW9uSGFuZGxlciA9IHJlcXVpcmUoJy4vbGliL1NpbGVudEF1dGhlbnRpY2F0aW9uSGFuZGxlcicpO1xuXG4vKipcbiAqIENoZWNrIGlmIHJ1bm5pbmcgaW4gSUUuXG4gKlxuICogQHJldHVybnMge051bWJlcn0gLTEgaWYgbm90IElFLCBJRSB2ZXJzaW9uIG90aGVyd2lzZS5cbiAqL1xuZnVuY3Rpb24gaXNJbnRlcm5ldEV4cGxvcmVyKCkge1xuICB2YXIgcnYgPSAtMTsgLy8gUmV0dXJuIHZhbHVlIGFzc3VtZXMgZmFpbHVyZS5cbiAgdmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgdmFyIHJlO1xuICBpZiAobmF2aWdhdG9yLmFwcE5hbWUgPT09ICdNaWNyb3NvZnQgSW50ZXJuZXQgRXhwbG9yZXInKSB7XG4gICAgcmUgPSBuZXcgUmVnRXhwKCdNU0lFIChbMC05XXsxLH1bXFwuMC05XXswLH0pJyk7XG4gICAgaWYgKHJlLmV4ZWModWEpICE9IG51bGwpIHtcbiAgICAgIHJ2ID0gcGFyc2VGbG9hdChSZWdFeHAuJDEpO1xuICAgIH1cbiAgfVxuICAvLyBJRSA+IDExXG4gIGVsc2UgaWYgKHVhLmluZGV4T2YoJ1RyaWRlbnQnKSA+IC0xKSB7XG4gICAgcmUgPSBuZXcgUmVnRXhwKCdydjooWzAtOV17MiwyfVtcXC4wLTldezAsfSknKTtcbiAgICBpZiAocmUuZXhlYyh1YSkgIT09IG51bGwpIHtcbiAgICAgIHJ2ID0gcGFyc2VGbG9hdChSZWdFeHAuJDEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBydjtcbn1cblxuLyoqXG4gKiBTdHJpbmdpZnkgcG9wdXAgb3B0aW9ucyBvYmplY3QgaW50b1xuICogYHdpbmRvdy5vcGVuYCBzdHJpbmcgb3B0aW9ucyBmb3JtYXRcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcG9wdXBPcHRpb25zXG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHN0cmluZ2lmeVBvcHVwU2V0dGluZ3MocG9wdXBPcHRpb25zKSB7XG4gIHZhciBzZXR0aW5ncyA9ICcnO1xuXG4gIGZvciAodmFyIGtleSBpbiBwb3B1cE9wdGlvbnMpIHtcbiAgICBzZXR0aW5ncyArPSBrZXkgKyAnPScgKyBwb3B1cE9wdGlvbnNba2V5XSArICcsJztcbiAgfVxuXG4gIHJldHVybiBzZXR0aW5ncy5zbGljZSgwLCAtMSk7XG59XG5cblxuLyoqXG4gKiBDaGVjayB0aGF0IGEga2V5IGhhcyBiZWVuIHNldCB0byBzb21ldGhpbmcgZGlmZmVyZW50IHRoYW4gbnVsbFxuICogb3IgdW5kZWZpbmVkLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqL1xuZnVuY3Rpb24gY2hlY2tJZlNldChvYmosIGtleSkge1xuICAvKlxuICAgKiBmYWxzZSAgICAgICE9IG51bGwgLT4gdHJ1ZVxuICAgKiB0cnVlICAgICAgICE9IG51bGwgLT4gdHJ1ZVxuICAgKiB1bmRlZmluZWQgICE9IG51bGwgLT4gZmFsc2VcbiAgICogbnVsbCAgICAgICAhPSBudWxsIC0+IGZhbHNlXG4gICAqL1xuICByZXR1cm4gISEob2JqICYmIG9ialtrZXldICE9IG51bGwpO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVSZXF1ZXN0RXJyb3IoZXJyLCBjYWxsYmFjaykge1xuICB2YXIgc3RhdHVzID0gZXJyLnN0YXR1cztcbiAgdmFyIHJlc3BvbnNlVGV4dCA9ICdzdHJpbmcnID09PSB0eXBlb2YgZXJyLnJlc3BvbnNlVGV4dCA/IGVyci5yZXNwb25zZVRleHQgOiBlcnI7XG5cbiAgdmFyIGlzQWZmZWN0ZWRJRVZlcnNpb24gPSBpc0ludGVybmV0RXhwbG9yZXIoKSA9PT0gMTAgfHwgaXNJbnRlcm5ldEV4cGxvcmVyKCkgPT09IDExO1xuICB2YXIgemVyb1N0YXR1cyA9ICghc3RhdHVzIHx8IHN0YXR1cyA9PT0gMCk7XG5cbiAgdmFyIG9uTGluZSA9ICEhd2luZG93Lm5hdmlnYXRvci5vbkxpbmU7XG5cbiAgLy8gUmVxdWVzdCBmYWlsZWQgYmVjYXVzZSB3ZSBhcmUgb2ZmbGluZS5cbiAgaWYgKHplcm9TdGF0dXMgJiYgIW9uTGluZSApIHtcbiAgICBzdGF0dXMgPSAwO1xuICAgIHJlc3BvbnNlVGV4dCA9IHtcbiAgICAgIGNvZGU6ICdvZmZsaW5lJ1xuICAgIH07XG4gIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjMyMjk3MjMvaWUtMTAtMTEtY29ycy1zdGF0dXMtMFxuICAvLyBYWFggSUUxMCB3aGVuIGEgcmVxdWVzdCBmYWlscyBpbiBDT1JTIHJldHVybnMgc3RhdHVzIGNvZGUgMFxuICAvLyBTZWU6IGh0dHA6Ly9jYW5pdXNlLmNvbS8jc2VhcmNoPW5hdmlnYXRvci5vbkxpbmVcbiAgfSBlbHNlIGlmICh6ZXJvU3RhdHVzICYmIGlzQWZmZWN0ZWRJRVZlcnNpb24pIHtcbiAgICBzdGF0dXMgPSA0MDE7XG4gICAgcmVzcG9uc2VUZXh0ID0ge1xuICAgICAgY29kZTogJ2ludmFsaWRfdXNlcl9wYXNzd29yZCdcbiAgICB9O1xuICAvLyBJZiBub3QgSUUxMC8xMSBhbmQgbm90IG9mZmxpbmUgaXQgbWVhbnMgdGhhdCBBdXRoMCBob3N0IGlzIHVucmVhY2hhYmxlOlxuICAvLyBDb25uZWN0aW9uIFRpbWVvdXQgb3IgQ29ubmVjdGlvbiBSZWZ1c2VkLlxuICB9IGVsc2UgaWYgKHplcm9TdGF0dXMpIHtcbiAgICBzdGF0dXMgPSAwO1xuICAgIHJlc3BvbnNlVGV4dCA9IHtcbiAgICAgIGNvZGU6ICdjb25uZWN0aW9uX3JlZnVzZWRfdGltZW91dCdcbiAgICB9O1xuICB9XG5cbiAgdmFyIGVycm9yID0gbmV3IExvZ2luRXJyb3Ioc3RhdHVzLCByZXNwb25zZVRleHQpO1xuICBjYWxsYmFjayhlcnJvcik7XG59XG5cbi8qKlxuICogam9pbiB1cmwgZnJvbSBwcm90b2NvbFxuICovXG5cbmZ1bmN0aW9uIGpvaW5VcmwocHJvdG9jb2wsIGRvbWFpbiwgZW5kcG9pbnQpIHtcbiAgcmV0dXJuIHByb3RvY29sICsgJy8vJyArIGRvbWFpbiArIGVuZHBvaW50O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBgQXV0aDBgIGluc3RhbmNlIHdpdGggYG9wdGlvbnNgXG4gKlxuICogQGNsYXNzIEF1dGgwXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQXV0aDAgKG9wdGlvbnMpIHtcbiAgLy8gWFhYIERlcHJlY2F0ZWQ6IFdlIHByZWZlciBuZXcgQXV0aDAoLi4uKVxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQXV0aDApKSB7XG4gICAgcmV0dXJuIG5ldyBBdXRoMChvcHRpb25zKTtcbiAgfVxuXG4gIGFzc2VydF9yZXF1aXJlZChvcHRpb25zLCAnY2xpZW50SUQnKTtcbiAgYXNzZXJ0X3JlcXVpcmVkKG9wdGlvbnMsICdkb21haW4nKTtcblxuICB0aGlzLl91c2VKU09OUCA9IG51bGwgIT0gb3B0aW9ucy5mb3JjZUpTT05QID9cbiAgICAgICAgICAgICAgICAgICAgISFvcHRpb25zLmZvcmNlSlNPTlAgOlxuICAgICAgICAgICAgICAgICAgICB1c2VfanNvbnAoKSAmJiAhc2FtZV9vcmlnaW4oJ2h0dHBzOicsIG9wdGlvbnMuZG9tYWluKTtcblxuICB0aGlzLl9jbGllbnRJRCA9IG9wdGlvbnMuY2xpZW50SUQ7XG4gIHRoaXMuX2NhbGxiYWNrVVJMID0gb3B0aW9ucy5jYWxsYmFja1VSTCB8fCBkb2N1bWVudC5sb2NhdGlvbi5ocmVmO1xuICB0aGlzLl9zaG91bGRSZWRpcmVjdCA9ICEhb3B0aW9ucy5jYWxsYmFja1VSTDtcbiAgdGhpcy5fZG9tYWluID0gb3B0aW9ucy5kb21haW47XG4gIHRoaXMuX3Jlc3BvbnNlVHlwZSA9IHRoaXMuX3BhcnNlUmVzcG9uc2VUeXBlKG9wdGlvbnMsIHRydWUpIHx8IFwiY29kZVwiO1xuICB0aGlzLl9yZXNwb25zZU1vZGUgPSB0aGlzLl9wYXJzZVJlc3BvbnNlTW9kZShvcHRpb25zLCB0cnVlKTtcbiAgdGhpcy5fY29yZG92YVNvY2lhbFBsdWdpbnMgPSB7XG4gICAgZmFjZWJvb2s6IHRoaXMuX3Bob25lZ2FwRmFjZWJvb2tMb2dpblxuICB9O1xuICB0aGlzLl91c2VDb3Jkb3ZhU29jaWFsUGx1Z2lucyA9IGZhbHNlIHx8IG9wdGlvbnMudXNlQ29yZG92YVNvY2lhbFBsdWdpbnM7XG4gIHRoaXMuX3NlbmRDbGllbnRJbmZvID0gbnVsbCAhPSBvcHRpb25zLnNlbmRTREtDbGllbnRJbmZvID8gb3B0aW9ucy5zZW5kU0RLQ2xpZW50SW5mbyA6IHRydWU7XG5cbiAgdGhpcy5fc2NvcGUgPSBvcHRpb25zLnNjb3BlIHx8IG51bGw7XG4gIHRoaXMuX2F1ZGllbmNlID0gb3B0aW9ucy5hdWRpZW5jZSB8fCBudWxsO1xufVxuXG4vKipcbiAqIEV4cG9ydCB2ZXJzaW9uIHdpdGggYEF1dGgwYCBjb25zdHJ1Y3RvclxuICpcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSB2ZXJzaW9uXG4gKi9cblxuQXV0aDAudmVyc2lvbiA9IHJlcXVpcmUoJy4vdmVyc2lvbicpLnN0cjtcblxuLyoqXG4gKiBFeHBvcnQgY2xpZW50IGluZm8gb2JqZWN0XG4gKlxuICpcbiAqIEBwcm9wZXJ0eSB7SGFzaH1cbiAqL1xuXG5BdXRoMC5jbGllbnRJbmZvID0geyBuYW1lOiAnYXV0aDAuanMnLCB2ZXJzaW9uOiBBdXRoMC52ZXJzaW9uIH07XG5cblxuLyoqXG4gKiBXcmFwcyBjYWxscyB0byB3aW5kb3cub3BlbiBzbyBpdCBjYW4gYmUgb3ZlcnJpZGVuIGluIEVsZWN0cm9uLlxuICpcbiAqIEluIEVsZWN0cm9uLCB3aW5kb3cub3BlbiByZXR1cm5zIGFuIG9iamVjdCB3aGljaCBwcm92aWRlcyBsaW1pdGVkIGNvbnRyb2xcbiAqIG92ZXIgdGhlIG9wZW5lZCB3aW5kb3cgKHNlZVxuICogaHR0cDovL2VsZWN0cm9uLmF0b20uaW8vZG9jcy92MC4zNi4wL2FwaS93aW5kb3ctb3Blbi8pLlxuICovXG5BdXRoMC5wcm90b3R5cGUub3BlbldpbmRvdyA9IGZ1bmN0aW9uKHVybCwgbmFtZSwgb3B0aW9ucykge1xuICByZXR1cm4gd2luZG93Lm9wZW4odXJsLCBuYW1lLCBzdHJpbmdpZnlQb3B1cFNldHRpbmdzKG9wdGlvbnMpKTtcbn1cblxuLyoqXG4gKiBSZWRpcmVjdCBjdXJyZW50IGxvY2F0aW9uIHRvIGB1cmxgXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHByaXZhdGVcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUuX3JlZGlyZWN0ID0gZnVuY3Rpb24gKHVybCkge1xuICBnbG9iYWwud2luZG93LmxvY2F0aW9uID0gdXJsO1xufTtcblxuQXV0aDAucHJvdG90eXBlLl9nZXRSZXNwb25zZVR5cGUgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHJldHVybiB0aGlzLl9wYXJzZVJlc3BvbnNlVHlwZShvcHRzKSB8fCB0aGlzLl9yZXNwb25zZVR5cGU7XG59O1xuXG5BdXRoMC5wcm90b3R5cGUuX2dldENhbGxiYWNrT25Mb2NhdGlvbkhhc2ggPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHJldHVybiB0aGlzLl9nZXRSZXNwb25zZU1vZGUob3B0aW9ucykgIT09IFwiZm9ybV9wb3N0XCJcbiAgICAmJiB0aGlzLl9nZXRSZXNwb25zZVR5cGUob3B0aW9ucykgIT09IFwiY29kZVwiO1xufTtcblxuQXV0aDAucHJvdG90eXBlLl9nZXRSZXNwb25zZU1vZGUgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHZhciByZXN1bHQgPSB0aGlzLl9wYXJzZVJlc3BvbnNlTW9kZShvcHRzKSB8fCB0aGlzLl9yZXNwb25zZU1vZGU7XG4gIHJldHVybiByZXN1bHQgPT09IFwiZm9ybV9wb3N0XCJcbiAgICA/IFwiZm9ybV9wb3N0XCJcbiAgICA6IG51bGw7XG59O1xuXG5BdXRoMC5wcm90b3R5cGUuX2dldENhbGxiYWNrVVJMID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICByZXR1cm4gKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMuY2FsbGJhY2tVUkwgIT09ICd1bmRlZmluZWQnKSA/XG4gICAgb3B0aW9ucy5jYWxsYmFja1VSTCA6IHRoaXMuX2NhbGxiYWNrVVJMO1xufTtcblxuQXV0aDAucHJvdG90eXBlLl9nZXRDbGllbnRJbmZvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICB2YXIgY2xpZW50SW5mbyA9IEpTT04uc3RyaW5naWZ5KEF1dGgwLmNsaWVudEluZm8pO1xuICByZXR1cm4gQmFzZTY0VXJsLmVuY29kZShjbGllbnRJbmZvKTtcbn07XG5cbkF1dGgwLnByb3RvdHlwZS5fZ2V0Q2xpZW50SW5mb0hlYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX3NlbmRDbGllbnRJbmZvXG4gICAgPyB7ICdBdXRoMC1DbGllbnQnOiB0aGlzLl9nZXRDbGllbnRJbmZvU3RyaW5nKCkgfVxuICAgIDoge307XG59O1xuXG4vKipcbiAqIFJlbmRlcnMgYW5kIHN1Ym1pdHMgYSBXU0ZlZCBmb3JtXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZvcm1IdG1sXG4gKiBAcHJpdmF0ZVxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5fcmVuZGVyQW5kU3VibWl0V1NGZWRGb3JtID0gZnVuY3Rpb24gKG9wdGlvbnMsIGZvcm1IdG1sKSB7XG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LmlubmVySFRNTCA9IGZvcm1IdG1sO1xuICB2YXIgZm9ybSA9IGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZGl2KS5jaGlsZHJlblswXTtcblxuICBpZiAob3B0aW9ucy5wb3B1cCAmJiAhdGhpcy5fZ2V0Q2FsbGJhY2tPbkxvY2F0aW9uSGFzaChvcHRpb25zKSkge1xuICAgIGZvcm0udGFyZ2V0ID0gJ2F1dGgwX3NpZ251cF9wb3B1cCc7XG4gIH1cblxuICBmb3JtLnN1Ym1pdCgpO1xufTtcblxuLyoqXG4gKiBSZXNvbHZlIHJlc3BvbnNlIHR5cGUgYXMgYHRva2VuYCBvciBgY29kZWBcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IGBzY29wZWAgYW5kIGByZXNwb25zZV90eXBlYCBwcm9wZXJ0aWVzXG4gKiBAcHJpdmF0ZVxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5fZ2V0TW9kZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIHZhciByZXN1bHQgPSB7XG4gICAgc2NvcGU6ICdvcGVuaWQnLFxuICAgIHJlc3BvbnNlX3R5cGU6IHRoaXMuX2dldFJlc3BvbnNlVHlwZShvcHRpb25zKVxuICB9O1xuXG4gIHZhciByZXNwb25zZU1vZGUgPSB0aGlzLl9nZXRSZXNwb25zZU1vZGUob3B0aW9ucyk7XG4gIGlmIChyZXNwb25zZU1vZGUpIHtcbiAgICByZXN1bHQucmVzcG9uc2VfbW9kZSA9IHJlc3BvbnNlTW9kZTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5BdXRoMC5wcm90b3R5cGUuX2NvbmZpZ3VyZU9mZmxpbmVNb2RlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBpZiAob3B0aW9ucy5zY29wZSAmJiBvcHRpb25zLnNjb3BlLmluZGV4T2YoJ29mZmxpbmVfYWNjZXNzJykgPj0gMCkge1xuICAgIG9wdGlvbnMuZGV2aWNlID0gb3B0aW9ucy5kZXZpY2UgfHwgJ0Jyb3dzZXInO1xuICB9XG59O1xuXG4vKipcbiAqIEdldCB1c2VyIGluZm9ybWF0aW9uIGZyb20gQVBJXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHByb2ZpbGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBpZF90b2tlblxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEBwcml2YXRlXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLl9nZXRVc2VySW5mbyA9IGZ1bmN0aW9uIChwcm9maWxlLCBpZF90b2tlbiwgY2FsbGJhY2spIHtcblxuICBjb25zb2xlLndhcm4oXCJERVBSRUNBVElPTiBOT1RJQ0U6IFRoaXMgbWV0aG9kIHdpbGwgYmUgc29vbiBkZXByZWNhdGVkLCB1c2UgYGdldFVzZXJJbmZvYCBpbnN0ZWFkLlwiKVxuXG4gIGlmICghKHByb2ZpbGUgJiYgIXByb2ZpbGUudXNlcl9pZCkpIHtcbiAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgcHJvZmlsZSk7XG4gIH1cblxuICAvLyB0aGUgc2NvcGUgd2FzIGp1c3Qgb3BlbmlkXG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHZhciBwcm90b2NvbCA9ICdodHRwczonO1xuICB2YXIgZG9tYWluID0gdGhpcy5fZG9tYWluO1xuICB2YXIgZW5kcG9pbnQgPSAnL3Rva2VuaW5mbyc7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICB2YXIgZmFpbCA9IGZ1bmN0aW9uIChzdGF0dXMsIGRlc2NyaXB0aW9uKSB7XG4gICAgdmFyIGVycm9yID0gbmV3IEVycm9yKHN0YXR1cyArICc6ICcgKyAoZGVzY3JpcHRpb24gfHwgJycpKTtcblxuICAgIC8vIFRoZXNlIHR3byBwcm9wZXJ0aWVzIGFyZSBhZGRlZCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG9sZCB2ZXJzaW9ucyAobm8gRXJyb3IgaW5zdGFuY2Ugd2FzIHJldHVybmVkKVxuICAgIGVycm9yLmVycm9yID0gc3RhdHVzO1xuICAgIGVycm9yLmVycm9yX2Rlc2NyaXB0aW9uID0gZGVzY3JpcHRpb247XG5cbiAgICBjYWxsYmFjayhlcnJvcik7XG4gIH07XG5cbiAgaWYgKHRoaXMuX3VzZUpTT05QKSB7XG4gICAgcmV0dXJuIGpzb25wKHVybCArICc/JyArIHFzLnN0cmluZ2lmeSh7aWRfdG9rZW46IGlkX3Rva2VufSksIGpzb25wT3B0cywgZnVuY3Rpb24gKGVyciwgcmVzcCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gZmFpbCgwLCBlcnIudG9TdHJpbmcoKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXNwLnN0YXR1cyA9PT0gMjAwID9cbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcC51c2VyKSA6XG4gICAgICAgIGZhaWwocmVzcC5zdGF0dXMsIHJlc3AuZXJyIHx8IHJlc3AuZXJyb3IpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHJlcXdlc3Qoe1xuICAgIHVybDogICAgICAgICAgc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbikgPyBlbmRwb2ludCA6IHVybCxcbiAgICBtZXRob2Q6ICAgICAgICdwb3N0JyxcbiAgICB0eXBlOiAgICAgICAgICdqc29uJyxcbiAgICBjcm9zc09yaWdpbjogICFzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSxcbiAgICBkYXRhOiAgICAgICAgIHtpZF90b2tlbjogaWRfdG9rZW59XG4gIH0pLmZhaWwoZnVuY3Rpb24gKGVycikge1xuICAgIGZhaWwoZXJyLnN0YXR1cywgZXJyLnJlc3BvbnNlVGV4dCk7XG4gIH0pLnRoZW4oZnVuY3Rpb24gKHVzZXJpbmZvKSB7XG4gICAgY2FsbGJhY2sobnVsbCwgdXNlcmluZm8pO1xuICB9KTtcblxufTtcblxuLyoqXG4gKiBHZXQgdXNlciBpbmZvcm1hdGlvbiBmcm9tIEFQSVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9maWxlXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRfdG9rZW5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcHJpdmF0ZVxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5nZXRVc2VySW5mbyA9IGZ1bmN0aW9uIChhY2Nlc3NfdG9rZW4sIGNhbGxiYWNrKSB7XG5cbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBjYWxsYmFjaykge1xuICAgIHRocm93IG5ldyBFcnJvcignQSBjYWxsYmFjayBmdW5jdGlvbiBpcyByZXF1aXJlZCcpO1xuICB9XG4gIGlmICghYWNjZXNzX3Rva2VuIHx8IHR5cGVvZiBhY2Nlc3NfdG9rZW4gIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcignSW52YWxpZCB0b2tlbicpKTtcbiAgfVxuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHZhciBwcm90b2NvbCA9ICdodHRwczonO1xuICB2YXIgZG9tYWluID0gdGhpcy5fZG9tYWluO1xuICB2YXIgZW5kcG9pbnQgPSAnL3VzZXJpbmZvJztcbiAgdmFyIHVybCA9IGpvaW5VcmwocHJvdG9jb2wsIGRvbWFpbiwgZW5kcG9pbnQpO1xuXG4gIHZhciBmYWlsID0gZnVuY3Rpb24gKHN0YXR1cywgZGVzY3JpcHRpb24pIHtcbiAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3Ioc3RhdHVzICsgJzogJyArIChkZXNjcmlwdGlvbiB8fCAnJykpO1xuXG4gICAgLy8gVGhlc2UgdHdvIHByb3BlcnRpZXMgYXJlIGFkZGVkIGZvciBjb21wYXRpYmlsaXR5IHdpdGggb2xkIHZlcnNpb25zIChubyBFcnJvciBpbnN0YW5jZSB3YXMgcmV0dXJuZWQpXG4gICAgZXJyb3IuZXJyb3IgPSBzdGF0dXM7XG4gICAgZXJyb3IuZXJyb3JfZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbjtcblxuICAgIGNhbGxiYWNrKGVycm9yKTtcbiAgfTtcblxuICByZXR1cm4gcmVxd2VzdCh7XG4gICAgdXJsOiAgICAgICAgICBzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSA/IGVuZHBvaW50IDogdXJsLFxuICAgIG1ldGhvZDogICAgICAgJ3Bvc3QnLFxuICAgIHR5cGU6ICAgICAgICAgJ2pzb24nLFxuICAgIGNyb3NzT3JpZ2luOiAgIXNhbWVfb3JpZ2luKHByb3RvY29sLCBkb21haW4pLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgYWNjZXNzX3Rva2VuXG4gICAgfVxuICB9KS5mYWlsKGZ1bmN0aW9uIChlcnIpIHtcbiAgICBmYWlsKGVyci5zdGF0dXMsIGVyci5yZXNwb25zZVRleHQpO1xuICB9KS50aGVuKGZ1bmN0aW9uICh1c2VyaW5mbykge1xuICAgIGNhbGxiYWNrKG51bGwsIHVzZXJpbmZvKTtcbiAgfSk7XG5cbn07XG5cbi8qKlxuICogR2V0IHByb2ZpbGUgZGF0YSBieSBgaWRfdG9rZW5gXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGlkX3Rva2VuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQG1ldGhvZCBnZXRQcm9maWxlXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLmdldFByb2ZpbGUgPSBmdW5jdGlvbiAoaWRfdG9rZW4sIGNhbGxiYWNrKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgY2FsbGJhY2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgY2FsbGJhY2sgZnVuY3Rpb24gaXMgcmVxdWlyZWQnKTtcbiAgfVxuICBpZiAoIWlkX3Rva2VuIHx8IHR5cGVvZiBpZF90b2tlbiAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdJbnZhbGlkIHRva2VuJykpO1xuICB9XG5cbiAgdGhpcy5fZ2V0VXNlckluZm8odGhpcy5kZWNvZGVKd3QoaWRfdG9rZW4pLCBpZF90b2tlbiwgY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBWYWxpZGF0ZSBhIHVzZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEBtZXRob2QgdmFsaWRhdGVVc2VyXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLnZhbGlkYXRlVXNlciA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuICB2YXIgcHJvdG9jb2wgPSAnaHR0cHM6JztcbiAgdmFyIGRvbWFpbiA9IHRoaXMuX2RvbWFpbjtcbiAgdmFyIGVuZHBvaW50ID0gJy9wdWJsaWMvYXBpL3VzZXJzL3ZhbGlkYXRlX3VzZXJwYXNzd29yZCc7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICB2YXIgcXVlcnkgPSB4dGVuZChcbiAgICBvcHRpb25zLFxuICAgIHtcbiAgICAgIGNsaWVudF9pZDogICAgdGhpcy5fY2xpZW50SUQsXG4gICAgICB1c2VybmFtZTogICAgIHRyaW0ob3B0aW9ucy51c2VybmFtZSB8fCBvcHRpb25zLmVtYWlsIHx8ICcnKVxuICAgIH0pO1xuXG4gIGlmICh0aGlzLl91c2VKU09OUCkge1xuICAgIHJldHVybiBqc29ucCh1cmwgKyAnPycgKyBxcy5zdHJpbmdpZnkocXVlcnkpLCBqc29ucE9wdHMsIGZ1bmN0aW9uIChlcnIsIHJlc3ApIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICB9XG4gICAgICBpZignZXJyb3InIGluIHJlc3AgJiYgcmVzcC5zdGF0dXMgIT09IDQwNCkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKHJlc3AuZXJyb3IpKTtcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3Auc3RhdHVzID09PSAyMDApO1xuICAgIH0pO1xuICB9XG5cbiAgcmVxd2VzdCh7XG4gICAgdXJsOiAgICAgc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbikgPyBlbmRwb2ludCA6IHVybCxcbiAgICBtZXRob2Q6ICAncG9zdCcsXG4gICAgdHlwZTogICAgJ3RleHQnLFxuICAgIGRhdGE6ICAgIHF1ZXJ5LFxuICAgIGNyb3NzT3JpZ2luOiAhc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbiksXG4gICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGlmIChlcnIuc3RhdHVzICE9PSA0MDQpIHsgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihlcnIucmVzcG9uc2VUZXh0KSk7IH1cbiAgICAgIGNhbGxiYWNrKG51bGwsIGZhbHNlKTtcbiAgICB9LFxuICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwLnN0YXR1cyA9PT0gMjAwKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBEZWNvZGUgSnNvbiBXZWIgVG9rZW5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gand0XG4gKiBAbWV0aG9kIGRlY29kZUp3dFxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5kZWNvZGVKd3QgPSBmdW5jdGlvbiAoand0KSB7XG4gIHZhciBlbmNvZGVkID0gand0ICYmIGp3dC5zcGxpdCgnLicpWzFdO1xuICByZXR1cm4ganNvbl9wYXJzZShCYXNlNjRVcmwuZGVjb2RlKGVuY29kZWQpKTtcbn07XG5cbi8qKlxuICogR2l2ZW4gdGhlIGhhc2ggKG9yIGEgcXVlcnkpIG9mIGFuIFVSTCByZXR1cm5zIGEgZGljdGlvbmFyeSB3aXRoIG9ubHkgcmVsZXZhbnRcbiAqIGF1dGhlbnRpY2F0aW9uIGluZm9ybWF0aW9uLiBJZiBzdWNjZWVkcyBpdCB3aWxsIHJldHVybiB0aGUgZm9sbG93aW5nIGZpZWxkczpcbiAqIGBwcm9maWxlYCwgYGlkX3Rva2VuYCwgYGFjY2Vzc190b2tlbmAgYW5kIGBzdGF0ZWAuIEluIGNhc2Ugb2YgZXJyb3IsIGl0IHdpbGxcbiAqIHJldHVybiBgZXJyb3JgIGFuZCBgZXJyb3JfZGVzY3JpcHRpb25gLlxuICpcbiAqIEBtZXRob2QgcGFyc2VIYXNoXG4gKiBAcGFyYW0ge1N0cmluZ30gW2hhc2g9d2luZG93LmxvY2F0aW9uLmhhc2hdIFVSTCB0byBiZSBwYXJzZWRcbiAqIEBleGFtcGxlXG4gKiAgICAgIHZhciBhdXRoMCA9IG5ldyBBdXRoMCh7Li4ufSk7XG4gKlxuICogICAgICAvLyBSZXR1cm5zIHtwcm9maWxlOiB7KiogZGVjb2RlZCBpZCB0b2tlbiAqKn0sIHN0YXRlOiBcImdvb2RcIn1cbiAqICAgICAgYXV0aDAucGFyc2VIYXNoKCcjaWRfdG9rZW49Li4uLi4mc3RhdGU9Z29vZCZmb289YmFyJyk7XG4gKlxuICogICAgICAvLyBSZXR1cm5zIHtlcnJvcjogXCJpbnZhbGlkX2NyZWRlbnRpYWxzXCIsIGVycm9yX2Rlc2NyaXB0aW9uOiB1bmRlZmluZWR9XG4gKiAgICAgIGF1dGgwLnBhcnNlSGFzaCgnI2Vycm9yPWludmFsaWRfY3JlZGVudGlhbHMnKTtcbiAqXG4gKiAgICAgIC8vIFJldHVybnMge2Vycm9yOiBcImludmFsaWRfY3JlZGVudGlhbHNcIiwgZXJyb3JfZGVzY3JpcHRpb246IHVuZGVmaW5lZH1cbiAqICAgICAgYXV0aDAucGFyc2VIYXNoKCc/ZXJyb3I9aW52YWxpZF9jcmVkZW50aWFscycpO1xuICpcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUucGFyc2VIYXNoID0gZnVuY3Rpb24gKGhhc2gsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGhhc2ggPSBoYXNoIHx8IHdpbmRvdy5sb2NhdGlvbi5oYXNoO1xuICBoYXNoID0gaGFzaC5yZXBsYWNlKC9eIz9cXC8/LywgJycpO1xuICB2YXIgcGFyc2VkX3FzID0gcXMucGFyc2UoaGFzaCk7XG5cbiAgaWYgKHBhcnNlZF9xcy5oYXNPd25Qcm9wZXJ0eSgnZXJyb3InKSkge1xuICAgIHZhciBlcnIgPSB7XG4gICAgICBlcnJvcjogcGFyc2VkX3FzLmVycm9yLFxuICAgICAgZXJyb3JfZGVzY3JpcHRpb246IHBhcnNlZF9xcy5lcnJvcl9kZXNjcmlwdGlvblxuICAgIH07XG5cbiAgICBpZiAocGFyc2VkX3FzLnN0YXRlKSB7XG4gICAgICBlcnIuc3RhdGUgPSBwYXJzZWRfcXMuc3RhdGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVycjtcbiAgfVxuXG4gIGlmICghcGFyc2VkX3FzLmhhc093blByb3BlcnR5KCdhY2Nlc3NfdG9rZW4nKVxuICAgICAgICYmICFwYXJzZWRfcXMuaGFzT3duUHJvcGVydHkoJ2lkX3Rva2VuJylcbiAgICAgICAmJiAhcGFyc2VkX3FzLmhhc093blByb3BlcnR5KCdyZWZyZXNoX3Rva2VuJykpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZhciBwcm9mO1xuXG4gIGlmIChwYXJzZWRfcXMuaWRfdG9rZW4pIHtcbiAgICB2YXIgaW52YWxpZEp3dCA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgdmFyIGVyciA9IHtcbiAgICAgICAgZXJyb3I6ICdpbnZhbGlkX3Rva2VuJyxcbiAgICAgICAgZXJyb3JfZGVzY3JpcHRpb246IGVycm9yXG4gICAgICB9O1xuICAgICAgcmV0dXJuIGVycjtcbiAgICB9O1xuXG4gICAgcHJvZiA9IHRoaXMuZGVjb2RlSnd0KHBhcnNlZF9xcy5pZF90b2tlbik7XG5cbiAgICAvLyBhdWQgc2hvdWxkIGJlIHRoZSBjbGllbnRJRFxuICAgIHZhciBhdWRpZW5jZXMgPSBpc19hcnJheShwcm9mLmF1ZCkgPyBwcm9mLmF1ZCA6IFsgcHJvZi5hdWQgXTtcbiAgICBpZiAoaW5kZXhfb2YoYXVkaWVuY2VzLCB0aGlzLl9jbGllbnRJRCkgPT09IC0xKSB7XG4gICAgICByZXR1cm4gaW52YWxpZEp3dChcbiAgICAgICAgJ1RoZSBjbGllbnRJRCBjb25maWd1cmVkICgnICsgdGhpcy5fY2xpZW50SUQgKyAnKSBkb2VzIG5vdCBtYXRjaCB3aXRoIHRoZSBjbGllbnRJRCBzZXQgaW4gdGhlIHRva2VuICgnICsgYXVkaWVuY2VzLmpvaW4oJywgJykgKyAnKS4nKTtcbiAgICB9XG5cbiAgICAvLyBpc3Mgc2hvdWxkIGJlIHRoZSBBdXRoMCBkb21haW4gKGkuZS46IGh0dHBzOi8vY29udG9zby5hdXRoMC5jb20vKVxuICAgIGlmIChwcm9mLmlzcyAmJiBwcm9mLmlzcyAhPT0gJ2h0dHBzOi8vJyArIHRoaXMuX2RvbWFpbiArICcvJykge1xuICAgICAgcmV0dXJuIGludmFsaWRKd3QoXG4gICAgICAgICdUaGUgZG9tYWluIGNvbmZpZ3VyZWQgKGh0dHBzOi8vJyArIHRoaXMuX2RvbWFpbiArICcvKSBkb2VzIG5vdCBtYXRjaCB3aXRoIHRoZSBkb21haW4gc2V0IGluIHRoZSB0b2tlbiAoJyArIHByb2YuaXNzICsgJykuJyk7XG4gICAgfVxuXG4gICAgdmFyIG5vbmNlID0gb3B0aW9ucy5ub25jZSB8fCB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2NvbS5hdXRoMC5hdXRoLm5vbmNlJyk7XG4gICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdjb20uYXV0aDAuYXV0aC5ub25jZScpO1xuXG4gICAgaWYgKChub25jZSB8fCBwcm9mLm5vbmNlKSAmJiBwcm9mLm5vbmNlICE9PSBub25jZSkge1xuICAgICAgcmV0dXJuIGludmFsaWRKd3QoJ1RoZSBub25jZSBkb2VzIG5vdCBtYXRjaC4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFjY2Vzc1Rva2VuOiBwYXJzZWRfcXMuYWNjZXNzX3Rva2VuLFxuICAgIGlkVG9rZW46IHBhcnNlZF9xcy5pZF90b2tlbixcbiAgICBpZFRva2VuUGF5bG9hZDogcHJvZixcbiAgICByZWZyZXNoVG9rZW46IHBhcnNlZF9xcy5yZWZyZXNoX3Rva2VuLFxuICAgIHN0YXRlOiBwYXJzZWRfcXMuc3RhdGVcbiAgfTtcbn07XG5cbi8qKlxuICogU2lnbnVwXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgU2lnbnVwIE9wdGlvbnNcbiAqIEBwYXJhbSB7U3RyaW5nfSBlbWFpbCBOZXcgdXNlciBlbWFpbFxuICogQHBhcmFtIHtTdHJpbmd9IHBhc3N3b3JkIE5ldyB1c2VyIHBhc3N3b3JkXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEBtZXRob2Qgc2lnbnVwXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLnNpZ251cCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gIHZhciBvcHRzID0ge1xuICAgIGNsaWVudF9pZDogdGhpcy5fY2xpZW50SUQsXG4gICAgcmVkaXJlY3RfdXJpOiB0aGlzLl9nZXRDYWxsYmFja1VSTChvcHRpb25zKSxcbiAgICBlbWFpbDogdHJpbShvcHRpb25zLmVtYWlsIHx8IG9wdGlvbnMudXNlcm5hbWUgfHwgJycpLFxuICAgIHRlbmFudDogdGhpcy5fZG9tYWluLnNwbGl0KCcuJylbMF1cbiAgfTtcblxuICBpZiAodHlwZW9mIG9wdGlvbnMudXNlcm5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgIG9wdHMudXNlcm5hbWUgPSB0cmltKG9wdGlvbnMudXNlcm5hbWUpO1xuICAgfVxuXG4gIHZhciBxdWVyeSA9IHh0ZW5kKHRoaXMuX2dldE1vZGUob3B0aW9ucyksIG9wdGlvbnMsIG9wdHMpO1xuXG4gIHRoaXMuX2NvbmZpZ3VyZU9mZmxpbmVNb2RlKHF1ZXJ5KTtcblxuICAvLyBUT0RPIENoYW5nZSB0aGlzIHRvIGEgcHJvcGVydHkgbmFtZWQgJ2Rpc2FibGVTU08nIGZvciBjb25zaXN0ZW5jeS5cbiAgLy8gQnkgZGVmYXVsdCwgb3B0aW9ucy5zc28gaXMgdHJ1ZVxuICBpZiAoIWNoZWNrSWZTZXQob3B0aW9ucywgJ3NzbycpKSB7XG4gICAgb3B0aW9ucy5zc28gPSB0cnVlO1xuICB9XG5cbiAgaWYgKCFjaGVja0lmU2V0KG9wdGlvbnMsICdhdXRvX2xvZ2luJykpIHtcbiAgICBvcHRpb25zLmF1dG9fbG9naW4gPSB0cnVlO1xuICB9XG5cbiAgdmFyIHBvcHVwO1xuXG4gIHZhciB3aWxsX3BvcHVwID0gb3B0aW9ucy5hdXRvX2xvZ2luICYmIG9wdGlvbnMucG9wdXBcbiAgICAmJiAoIXRoaXMuX2dldENhbGxiYWNrT25Mb2NhdGlvbkhhc2gob3B0aW9ucykgfHwgb3B0aW9ucy5zc28pO1xuXG4gIGlmICh3aWxsX3BvcHVwKSB7XG4gICAgcG9wdXAgPSB0aGlzLl9idWlsZFBvcHVwV2luZG93KG9wdGlvbnMpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3VjY2VzcyAoKSB7XG4gICAgaWYgKG9wdGlvbnMuYXV0b19sb2dpbikge1xuICAgICAgcmV0dXJuIF90aGlzLmxvZ2luKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBmYWlsIChzdGF0dXMsIHJlc3ApIHtcbiAgICB2YXIgZXJyb3IgPSBuZXcgTG9naW5FcnJvcihzdGF0dXMsIHJlc3ApO1xuXG4gICAgLy8gd2hlbiBmYWlsZWQgd2Ugd2FudCB0aGUgcG9wdXAgY2xvc2VkIGlmIG9wZW5lZFxuICAgIGlmIChwb3B1cCAmJiAnZnVuY3Rpb24nID09PSB0eXBlb2YgcG9wdXAua2lsbCkge1xuICAgICAgcG9wdXAua2lsbCgpO1xuICAgIH1cblxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgY2FsbGJhY2spIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XG4gICAgfVxuXG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cblxuICB2YXIgcHJvdG9jb2wgPSAnaHR0cHM6JztcbiAgdmFyIGRvbWFpbiA9IHRoaXMuX2RvbWFpbjtcbiAgdmFyIGVuZHBvaW50ID0gJy9kYmNvbm5lY3Rpb25zL3NpZ251cCc7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICBpZiAodGhpcy5fdXNlSlNPTlApIHtcbiAgICByZXR1cm4ganNvbnAodXJsICsgJz8nICsgcXMuc3RyaW5naWZ5KHF1ZXJ5KSwganNvbnBPcHRzLCBmdW5jdGlvbiAoZXJyLCByZXNwKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBmYWlsKDAsIGVycik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXNwLnN0YXR1cyA9PSAyMDAgPyBzdWNjZXNzKCkgOlxuICAgICAgICAgICAgICBmYWlsKHJlc3Auc3RhdHVzLCByZXNwLmVyciB8fCByZXNwLmVycm9yKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlcXdlc3Qoe1xuICAgIHVybDogICAgIHNhbWVfb3JpZ2luKHByb3RvY29sLCBkb21haW4pID8gZW5kcG9pbnQgOiB1cmwsXG4gICAgbWV0aG9kOiAgJ3Bvc3QnLFxuICAgIHR5cGU6ICAgICdodG1sJyxcbiAgICBkYXRhOiAgICBxdWVyeSxcbiAgICBzdWNjZXNzOiBzdWNjZXNzLFxuICAgIGNyb3NzT3JpZ2luOiAhc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbiksXG4gICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGZhaWwoZXJyLnN0YXR1cywgZXJyLnJlc3BvbnNlVGV4dCk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuICogQ2hhbmdlIHBhc3N3b3JkXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAbWV0aG9kIGNoYW5nZVBhc3N3b3JkXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLmNoYW5nZVBhc3N3b3JkID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHZhciBxdWVyeSA9IHtcbiAgICB0ZW5hbnQ6ICAgICAgICAgdGhpcy5fZG9tYWluLnNwbGl0KCcuJylbMF0sXG4gICAgY2xpZW50X2lkOiAgICAgIHRoaXMuX2NsaWVudElELFxuICAgIGNvbm5lY3Rpb246ICAgICBvcHRpb25zLmNvbm5lY3Rpb24sXG4gICAgZW1haWw6ICAgICAgICAgIHRyaW0ob3B0aW9ucy5lbWFpbCB8fCAnJylcbiAgfTtcblxuICBpZiAodHlwZW9mIG9wdGlvbnMucGFzc3dvcmQgPT09IFwic3RyaW5nXCIpIHtcbiAgICBxdWVyeS5wYXNzd29yZCA9IG9wdGlvbnMucGFzc3dvcmQ7XG4gIH1cblxuICBmdW5jdGlvbiBmYWlsIChzdGF0dXMsIHJlc3ApIHtcbiAgICB2YXIgZXJyb3IgPSBuZXcgTG9naW5FcnJvcihzdGF0dXMsIHJlc3ApO1xuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICB2YXIgcHJvdG9jb2wgPSAnaHR0cHM6JztcbiAgdmFyIGRvbWFpbiA9IHRoaXMuX2RvbWFpbjtcbiAgdmFyIGVuZHBvaW50ID0gJy9kYmNvbm5lY3Rpb25zL2NoYW5nZV9wYXNzd29yZCc7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICBpZiAodGhpcy5fdXNlSlNPTlApIHtcbiAgICByZXR1cm4ganNvbnAodXJsICsgJz8nICsgcXMuc3RyaW5naWZ5KHF1ZXJ5KSwganNvbnBPcHRzLCBmdW5jdGlvbiAoZXJyLCByZXNwKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBmYWlsKDAsIGVycik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcC5zdGF0dXMgPT0gMjAwID9cbiAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcC5tZXNzYWdlKSA6XG4gICAgICAgICAgICAgIGZhaWwocmVzcC5zdGF0dXMsIHJlc3AuZXJyIHx8IHJlc3AuZXJyb3IpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVxd2VzdCh7XG4gICAgdXJsOiAgICAgc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbikgPyBlbmRwb2ludCA6IHVybCxcbiAgICBtZXRob2Q6ICAncG9zdCcsXG4gICAgdHlwZTogICAgJ2h0bWwnLFxuICAgIGRhdGE6ICAgIHF1ZXJ5LFxuICAgIGNyb3NzT3JpZ2luOiAhc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbiksXG4gICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGZhaWwoZXJyLnN0YXR1cywgZXJyLnJlc3BvbnNlVGV4dCk7XG4gICAgfSxcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAocikge1xuICAgICAgY2FsbGJhY2sobnVsbCwgcik7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuICogQnVpbGRzIHF1ZXJ5IHN0cmluZyB0byBiZSBwYXNzZWQgdG8gL2F1dGhvcml6ZSBiYXNlZCBvbiBkaWN0IGtleSBhbmQgdmFsdWVzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3NcbiAqIEBwYXJhbSB7QXJyYXl9IGJsYWNrbGlzdFxuICogQHByaXZhdGVcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUuX2J1aWxkQXV0aG9yaXplUXVlcnlTdHJpbmcgPSBmdW5jdGlvbiAoYXJncywgYmxhY2tsaXN0KSB7XG4gIHZhciBxdWVyeSA9IHRoaXMuX2J1aWxkQXV0aG9yaXphdGlvblBhcmFtZXRlcnMoYXJncywgYmxhY2tsaXN0KTtcbiAgcmV0dXJuIHFzLnN0cmluZ2lmeShxdWVyeSk7XG59O1xuXG4vKipcbiAqIEJ1aWxkcyBwYXJhbWV0ZXIgZGljdGlvbmFyeSB0byBiZSBwYXNzZWQgdG8gL2F1dGhvcml6ZSBiYXNlZCBvbiBkaWN0IGtleSBhbmQgdmFsdWVzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3NcbiAqIEBwYXJhbSB7QXJyYXl9IGJsYWNrbGlzdFxuICogQHByaXZhdGVcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUuX2J1aWxkQXV0aG9yaXphdGlvblBhcmFtZXRlcnMgPSBmdW5jdGlvbihhcmdzLCBibGFja2xpc3QpIHtcbiAgdmFyIHF1ZXJ5ID0geHRlbmQuYXBwbHkobnVsbCwgYXJncyk7XG5cbiAgLy8gQWRkcyBvZmZsaW5lIG1vZGUgdG8gdGhlIHF1ZXJ5XG4gIHRoaXMuX2NvbmZpZ3VyZU9mZmxpbmVNb2RlKHF1ZXJ5KTtcblxuICAvLyBBZGRzIGNsaWVudCBTREsgaW5mb3JtYXRpb24gKHdoZW4gZW5hYmxlZClcbiAgaWYgKCB0aGlzLl9zZW5kQ2xpZW50SW5mbyApIHF1ZXJ5WydhdXRoMENsaWVudCddID0gdGhpcy5fZ2V0Q2xpZW50SW5mb1N0cmluZygpO1xuXG4gIC8vIEVsZW1lbnRzIHRvIGZpbHRlciBmcm9tIHF1ZXJ5IHN0cmluZ1xuICBibGFja2xpc3QgPSBibGFja2xpc3QgfHwgWydwb3B1cCcsICdwb3B1cE9wdGlvbnMnXTtcblxuICB2YXIgaSwga2V5O1xuXG4gIGZvciAoaSA9IDA7IGkgPCBibGFja2xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBrZXkgPSBibGFja2xpc3RbaV07XG4gICAgZGVsZXRlIHF1ZXJ5W2tleV07XG4gIH1cblxuICBpZiAocXVlcnkuY29ubmVjdGlvbl9zY29wZSAmJiBpc19hcnJheShxdWVyeS5jb25uZWN0aW9uX3Njb3BlKSl7XG4gICAgcXVlcnkuY29ubmVjdGlvbl9zY29wZSA9IHF1ZXJ5LmNvbm5lY3Rpb25fc2NvcGUuam9pbignLCcpO1xuICB9XG5cbiAgcmV0dXJuIHF1ZXJ5O1xufTtcblxuQXV0aDAucHJvdG90eXBlLl9idWlsZEF1dGhvcml6ZVVybCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIGNvbnN0cnVjdG9yT3B0aW9ucyA9IHt9O1xuXG4gIGlmICh0aGlzLl9zY29wZSkge1xuICAgIGNvbnN0cnVjdG9yT3B0aW9ucy5zY29wZSA9IHRoaXMuX3Njb3BlO1xuICB9XG5cbiAgaWYgKHRoaXMuX2F1ZGllbmNlKSB7XG4gICAgY29uc3RydWN0b3JPcHRpb25zLmF1ZGllbmNlID0gdGhpcy5fYXVkaWVuY2U7XG4gIH1cblxuXG4gIHZhciBxcyA9IFtcbiAgICB0aGlzLl9nZXRNb2RlKG9wdGlvbnMpLFxuICAgIGNvbnN0cnVjdG9yT3B0aW9ucyxcbiAgICBvcHRpb25zLFxuICAgIHtcbiAgICAgIGNsaWVudF9pZDogdGhpcy5fY2xpZW50SUQsXG4gICAgICByZWRpcmVjdF91cmk6IHRoaXMuX2dldENhbGxiYWNrVVJMKG9wdGlvbnMpXG4gICAgfVxuICBdO1xuXG4gIHZhciBxdWVyeSA9IHRoaXMuX2J1aWxkQXV0aG9yaXplUXVlcnlTdHJpbmcocXMpO1xuXG4gIHJldHVybiBqb2luVXJsKCdodHRwczonLCB0aGlzLl9kb21haW4sICcvYXV0aG9yaXplPycgKyBxdWVyeSk7XG59XG5cbi8qKlxuICogTG9naW4gdXNlclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQG1ldGhvZCBsb2dpblxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5sb2dpbiA9IEF1dGgwLnByb3RvdHlwZS5zaWduaW4gPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgLy8gVE9ETyBDaGFuZ2UgdGhpcyB0byBhIHByb3BlcnR5IG5hbWVkICdkaXNhYmxlU1NPJyBmb3IgY29uc2lzdGVuY3kuXG4gIC8vIEJ5IGRlZmF1bHQsIG9wdGlvbnMuc3NvIGlzIHRydWVcbiAgaWYgKCFjaGVja0lmU2V0KG9wdGlvbnMsICdzc28nKSkge1xuICAgIG9wdGlvbnMuc3NvID0gdHJ1ZTtcbiAgfVxuXG4gIGlmICh0aGlzLl9yZXNwb25zZVR5cGUuaW5kZXhPZignaWRfdG9rZW4nKSA+IC0xICYmICFvcHRpb25zLm5vbmNlKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLnBhc3Njb2RlID09PSAndW5kZWZpbmVkJyAmJiAoXG4gICAgICAgICgodHlwZW9mIG9wdGlvbnMudXNlcm5hbWUgIT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBvcHRpb25zLmVtYWlsICE9PSAndW5kZWZpbmVkJykgJiYgIWNhbGxiYWNrKSB8fFxuICAgICAgICAodHlwZW9mIG9wdGlvbnMudXNlcm5hbWUgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBvcHRpb25zLmVtYWlsID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgKSApIHtcbiAgICAgIHZhciBub25jZSA9IG5vbmNlR2VuZXJhdG9yLnJhbmRvbVN0cmluZygxNik7XG4gICAgICBpZiAobm9uY2UpIHtcbiAgICAgICAgb3B0aW9ucy5ub25jZSA9IG5vbmNlO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2NvbS5hdXRoMC5hdXRoLm5vbmNlJywgbm9uY2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5wYXNzY29kZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gdGhpcy5sb2dpbldpdGhQYXNzY29kZShvcHRpb25zLCBjYWxsYmFjayk7XG4gIH1cblxuICBpZiAodHlwZW9mIG9wdGlvbnMudXNlcm5hbWUgIT09ICd1bmRlZmluZWQnIHx8XG4gICAgICB0eXBlb2Ygb3B0aW9ucy5lbWFpbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gdGhpcy5sb2dpbldpdGhVc2VybmFtZVBhc3N3b3JkKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIGlmICghIXdpbmRvdy5jb3Jkb3ZhIHx8ICEhd2luZG93LmVsZWN0cm9uKSB7XG4gICAgcmV0dXJuIHRoaXMubG9naW5QaG9uZWdhcChvcHRpb25zLCBjYWxsYmFjayk7XG4gIH1cblxuICBpZiAoISFvcHRpb25zLnBvcHVwICYmIHRoaXMuX2dldENhbGxiYWNrT25Mb2NhdGlvbkhhc2gob3B0aW9ucykpIHtcbiAgICByZXR1cm4gdGhpcy5sb2dpbldpdGhQb3B1cChvcHRpb25zLCBjYWxsYmFjayk7XG4gIH1cblxuICBpZiAoIW9wdGlvbnMubm9uY2UgJiYgdGhpcy5fcmVzcG9uc2VUeXBlLmluZGV4T2YoJ2lkX3Rva2VuJykgPiAtMSkge1xuICAgIHRocm93IG5ldyBFcnJvcignbm9uY2UgaXMgbWFuZGF0b3J5Jyk7XG4gIH1cblxuICB0aGlzLl9hdXRob3JpemUob3B0aW9ucyk7XG59O1xuXG5BdXRoMC5wcm90b3R5cGUuX2F1dGhvcml6ZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIHVybCA9IHRoaXMuX2J1aWxkQXV0aG9yaXplVXJsKG9wdGlvbnMpO1xuXG4gIGlmIChvcHRpb25zLnBvcHVwKSB7XG4gICAgdGhpcy5fYnVpbGRQb3B1cFdpbmRvdyhvcHRpb25zLCB1cmwpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuX3JlZGlyZWN0KHVybCk7XG4gIH1cbn07XG5cbi8qKlxuICogQ29tcHV0ZSBgb3B0aW9ucy53aWR0aGAgYW5kIGBvcHRpb25zLmhlaWdodGAgZm9yIHRoZSBwb3B1cCB0b1xuICogb3BlbiBhbmQgcmV0dXJuIGFuZCBleHRlbmRlZCBvYmplY3Qgd2l0aCBvcHRpbWFsIGB0b3BgIGFuZCBgbGVmdGBcbiAqIHBvc2l0aW9uIGFyZ3VtZW50cyBmb3IgdGhlIHBvcHVwIHdpbmRvd3NcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHByaXZhdGVcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUuX2NvbXB1dGVQb3B1cFBvc2l0aW9uID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciB3aWR0aCA9IG9wdGlvbnMud2lkdGggfHwgNTAwO1xuICB2YXIgaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgfHwgNjAwO1xuXG4gIHZhciBzY3JlZW5YID0gdHlwZW9mIHdpbmRvdy5zY3JlZW5YICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5zY3JlZW5YIDogd2luZG93LnNjcmVlbkxlZnQ7XG4gIHZhciBzY3JlZW5ZID0gdHlwZW9mIHdpbmRvdy5zY3JlZW5ZICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5zY3JlZW5ZIDogd2luZG93LnNjcmVlblRvcDtcbiAgdmFyIG91dGVyV2lkdGggPSB0eXBlb2Ygd2luZG93Lm91dGVyV2lkdGggIT09ICd1bmRlZmluZWQnID8gd2luZG93Lm91dGVyV2lkdGggOiBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoO1xuICB2YXIgb3V0ZXJIZWlnaHQgPSB0eXBlb2Ygd2luZG93Lm91dGVySGVpZ2h0ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5vdXRlckhlaWdodCA6IChkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodCAtIDIyKTtcbiAgLy8gWFhYOiB3aGF0IGlzIHRoZSAyMj9cblxuICAvLyBVc2UgYG91dGVyV2lkdGggLSB3aWR0aGAgYW5kIGBvdXRlckhlaWdodCAtIGhlaWdodGAgZm9yIGhlbHAgaW5cbiAgLy8gcG9zaXRpb25pbmcgdGhlIHBvcHVwIGNlbnRlcmVkIHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IHdpbmRvd1xuICB2YXIgbGVmdCA9IHNjcmVlblggKyAob3V0ZXJXaWR0aCAtIHdpZHRoKSAvIDI7XG4gIHZhciB0b3AgPSBzY3JlZW5ZICsgKG91dGVySGVpZ2h0IC0gaGVpZ2h0KSAvIDI7XG5cbiAgcmV0dXJuIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCwgbGVmdDogbGVmdCwgdG9wOiB0b3AgfTtcbn07XG5cbi8qKlxuICogbG9naW5QaG9uZWdhcCBtZXRob2QgaXMgdHJpZ2dlcmVkIHdoZW4gISF3aW5kb3cuY29yZG92YSBpcyB0cnVlLlxuICpcbiAqIEBtZXRob2QgbG9naW5QaG9uZWdhcFxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSAgICBvcHRpb25zICAgTG9naW4gb3B0aW9ucy5cbiAqIEBwYXJhbSB7RnVuY3Rpb259ICBjYWxsYmFjayAgVG8gYmUgY2FsbGVkIGFmdGVyIGxvZ2luIGhhcHBlbmVkLiBDYWxsYmFjayBhcmd1bWVudHNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkIGJlOlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZXJyLCBwcm9maWxlLCBpZFRva2VuLCBhY2Nlc3NUb2tlbiwgc3RhdGUpXG4gKlxuICogQGV4YW1wbGVcbiAqICAgICAgdmFyIGF1dGgwID0gbmV3IEF1dGgwKHsgY2xpZW50SWQ6ICcuLi4nLCBkb21haW46ICcuLi4nfSk7XG4gKlxuICogICAgICBhdXRoMC5zaWduaW4oe30sIGZ1bmN0aW9uIChlcnIsIHByb2ZpbGUsIGlkVG9rZW4sIGFjY2Vzc1Rva2VuLCBzdGF0ZSkge1xuICogICAgICAgIGlmIChlcnIpIHtcbiAqICAgICAgICAgYWxlcnQoZXJyKTtcbiAqICAgICAgICAgcmV0dXJuO1xuICogICAgICAgIH1cbiAqXG4gKiAgICAgICAgYWxlcnQoJ1dlbGNvbWUgJyArIHByb2ZpbGUubmFtZSk7XG4gKiAgICAgIH0pO1xuICovXG5cbkF1dGgwLnByb3RvdHlwZS5sb2dpblBob25lZ2FwID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIGlmICh0aGlzLl9zaG91bGRBdXRoZW50aWNhdGVXaXRoQ29yZG92YVBsdWdpbihvcHRpb25zLmNvbm5lY3Rpb24pKSB7XG4gICAgdGhpcy5fc29jaWFsUGhvbmVnYXBMb2dpbihvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIG1vYmlsZUNhbGxiYWNrVVJMID0gam9pblVybCgnaHR0cHM6JywgdGhpcy5fZG9tYWluLCAnL21vYmlsZScpO1xuICB2YXIgX3RoaXMgPSB0aGlzO1xuICB2YXIgcXMgPSBbXG4gICAgdGhpcy5fZ2V0TW9kZShvcHRpb25zKSxcbiAgICBvcHRpb25zLFxuICAgIHtcbiAgICAgIGNsaWVudF9pZDogdGhpcy5fY2xpZW50SUQsXG4gICAgICByZWRpcmVjdF91cmk6IG1vYmlsZUNhbGxiYWNrVVJMXG4gICAgfVxuICBdO1xuXG4gIGlmICggdGhpcy5fc2VuZENsaWVudEluZm8gKSB7XG4gICAgcXMucHVzaCh7IGF1dGgwQ2xpZW50OiB0aGlzLl9nZXRDbGllbnRJbmZvU3RyaW5nKCkgfSk7XG4gIH1cblxuICB2YXIgcXVlcnkgPSB0aGlzLl9idWlsZEF1dGhvcml6ZVF1ZXJ5U3RyaW5nKHFzKTtcblxuICB2YXIgcG9wdXBVcmwgPSBqb2luVXJsKCdodHRwczonLCB0aGlzLl9kb21haW4sICcvYXV0aG9yaXplPycgKyBxdWVyeSk7XG5cbiAgdmFyIHBvcHVwT3B0aW9ucyA9IHh0ZW5kKHtsb2NhdGlvbjogJ3llcyd9ICxcbiAgICBvcHRpb25zLnBvcHVwT3B0aW9ucyk7XG5cbiAgLy8gVGhpcyB3YXNuJ3Qgc2VuZCBiZWZvcmUgc28gd2UgZG9uJ3Qgc2VuZCBpdCBub3cgZWl0aGVyXG4gIGRlbGV0ZSBwb3B1cE9wdGlvbnMud2lkdGg7XG4gIGRlbGV0ZSBwb3B1cE9wdGlvbnMuaGVpZ2h0O1xuXG4gIHZhciByZWYgPSB0aGlzLm9wZW5XaW5kb3cocG9wdXBVcmwsICdfYmxhbmsnLCBwb3B1cE9wdGlvbnMpO1xuICB2YXIgYW5zd2VyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBlcnJvckhhbmRsZXIoZXZlbnQpIHtcbiAgICBpZiAoYW5zd2VyZWQpIHsgcmV0dXJuOyB9XG4gICAgYW5zd2VyZWQgPSB0cnVlO1xuICAgIHJlZi5jbG9zZSgpO1xuICAgIGNhbGxiYWNrKG5ldyBFcnJvcihldmVudC5tZXNzYWdlKSwgbnVsbCk7XG4gIH1cblxuICBmdW5jdGlvbiBzdGFydEhhbmRsZXIoZXZlbnQpIHtcbiAgICBpZiAoYW5zd2VyZWQpIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAoIGV2ZW50LnVybCAmJiAhKGV2ZW50LnVybC5pbmRleE9mKG1vYmlsZUNhbGxiYWNrVVJMICsgJyMnKSA9PT0gMCB8fFxuICAgICAgICAgICAgICAgICAgICAgICBldmVudC51cmwuaW5kZXhPZihtb2JpbGVDYWxsYmFja1VSTCArICc/JykgPT09IDApKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIHJlc3VsdCA9IF90aGlzLnBhcnNlSGFzaChldmVudC51cmwuc2xpY2UobW9iaWxlQ2FsbGJhY2tVUkwubGVuZ3RoKSk7XG5cbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgYW5zd2VyZWQgPSB0cnVlO1xuICAgICAgcmVmLmNsb3NlKCk7XG4gICAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ0Vycm9yIHBhcnNpbmcgaGFzaCcpLCBudWxsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0LmlkVG9rZW4pIHtcbiAgICAgIGFuc3dlcmVkID0gdHJ1ZTtcbiAgICAgIHJlZi5jbG9zZSgpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cblxuICAgIC8vIENhc2Ugd2hlcmUgd2UndmUgZm91bmQgYW4gZXJyb3JcbiAgICBhbnN3ZXJlZCA9IHRydWU7XG4gICAgcmVmLmNsb3NlKCk7XG4gICAgY2FsbGJhY2sobmV3IEVycm9yKHJlc3VsdC5lcnIgfHwgcmVzdWx0LmVycm9yIHx8ICdTb21ldGhpbmcgd2VudCB3cm9uZycpLCBudWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4aXRIYW5kbGVyKCkge1xuICAgIGlmIChhbnN3ZXJlZCkgeyByZXR1cm47IH1cblxuICAgIHJlZi5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkZXJyb3InLCBlcnJvckhhbmRsZXIpO1xuICAgIHJlZi5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2Fkc3RhcnQnLCBzdGFydEhhbmRsZXIpO1xuICAgIHJlZi5yZW1vdmVFdmVudExpc3RlbmVyKCdleGl0JywgZXhpdEhhbmRsZXIpO1xuXG4gICAgY2FsbGJhY2sobmV3IEVycm9yKCdCcm93c2VyIHdpbmRvdyBjbG9zZWQnKSwgbnVsbCk7XG4gIH1cblxuICByZWYuYWRkRXZlbnRMaXN0ZW5lcignbG9hZGVycm9yJywgZXJyb3JIYW5kbGVyKTtcbiAgcmVmLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWRzdGFydCcsIHN0YXJ0SGFuZGxlcik7XG4gIHJlZi5hZGRFdmVudExpc3RlbmVyKCdleGl0JywgZXhpdEhhbmRsZXIpO1xuXG59O1xuXG4vKipcbiAqIGxvZ2luV2l0aFBvcHVwIG1ldGhvZCBpcyB0cmlnZ2VyZWQgd2hlbiBsb2dpbiBtZXRob2QgcmVjZWl2ZXMgYSB7cG9wdXA6IHRydWV9IGluXG4gKiB0aGUgbG9naW4gb3B0aW9ucy5cbiAqXG4gKiBAbWV0aG9kIGxvZ2luV2l0aFBvcHVwXG4gKiBAcGFyYW0ge09iamVjdH0gICBvcHRpb25zICAgIExvZ2luIG9wdGlvbnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAgIFRvIGJlIGNhbGxlZCBhZnRlciBsb2dpbiBoYXBwZW5lZCAod2hldGhlclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzIG9yIGZhaWx1cmUpLiBUaGlzIHBhcmFtZXRlciBpcyBtYW5kYXRvcnkgd2hlblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb24gY2FsbGJhY2tPbkxvY2F0aW9uSGFzaCBpcyB0cnV0aHkgYnV0IHNob3VsZCBub3RcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmUgdXNlZCB3aGVuIGZhbHN5LlxuICogQGV4YW1wbGVcbiAqICAgICAgIHZhciBhdXRoMCA9IG5ldyBBdXRoMCh7IGNsaWVudElkOiAnLi4uJywgZG9tYWluOiAnLi4uJywgY2FsbGJhY2tPbkxvY2F0aW9uSGFzaDogdHJ1ZSB9KTtcbiAqXG4gKiAgICAgICAvLyBFcnJvciEgTm8gY2FsbGJhY2tcbiAqICAgICAgIGF1dGgwLmxvZ2luKHtwb3B1cDogdHJ1ZX0pO1xuICpcbiAqICAgICAgIC8vIE9rIVxuICogICAgICAgYXV0aDAubG9naW4oe3BvcHVwOiB0cnVlfSwgZnVuY3Rpb24gKCkgeyB9KTtcbiAqXG4gKiBAZXhhbXBsZVxuICogICAgICAgdmFyIGF1dGgwID0gbmV3IEF1dGgwKHsgY2xpZW50SWQ6ICcuLi4nLCBkb21haW46ICcuLi4nfSk7XG4gKlxuICogICAgICAgLy8gT2shXG4gKiAgICAgICBhdXRoMC5sb2dpbih7cG9wdXA6IHRydWV9KTtcbiAqXG4gKiAgICAgICAvLyBFcnJvciEgTm8gY2FsbGJhY2sgd2lsbCBiZSBleGVjdXRlZCBvbiByZXNwb25zZV90eXBlPWNvZGVcbiAqICAgICAgIGF1dGgwLmxvZ2luKHtwb3B1cDogdHJ1ZX0sIGZ1bmN0aW9uICgpIHsgfSk7XG4gKiBAcHJpdmF0ZVxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5sb2dpbldpdGhQb3B1cCA9IGZ1bmN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgaWYgKCFjYWxsYmFjaykge1xuICAgIHRocm93IG5ldyBFcnJvcigncG9wdXAgbW9kZSBzaG91bGQgcmVjZWl2ZSBhIG1hbmRhdG9yeSBjYWxsYmFjaycpO1xuICB9XG5cbiAgaWYgKCFvcHRpb25zLm5vbmNlICYmIHRoaXMuX3Jlc3BvbnNlVHlwZS5pbmRleE9mKCdpZF90b2tlbicpID4gLTEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ25vbmNlIGlzIG1hbmRhdG9yeScpO1xuICB9XG5cbiAgdmFyIHFzID0gW3RoaXMuX2dldE1vZGUob3B0aW9ucyksIG9wdGlvbnMsIHsgY2xpZW50X2lkOiB0aGlzLl9jbGllbnRJRCwgb3dwOiB0cnVlIH1dO1xuXG4gIGlmICh0aGlzLl9zZW5kQ2xpZW50SW5mbykge1xuICAgIHFzLnB1c2goeyBhdXRoMENsaWVudDogdGhpcy5fZ2V0Q2xpZW50SW5mb1N0cmluZygpIH0pO1xuICB9XG5cbiAgdmFyIHF1ZXJ5ID0gdGhpcy5fYnVpbGRBdXRob3JpemVRdWVyeVN0cmluZyhxcyk7XG4gIHZhciBwb3B1cFVybCA9IGpvaW5VcmwoJ2h0dHBzOicsIHRoaXMuX2RvbWFpbiwgJy9hdXRob3JpemU/JyArIHF1ZXJ5KTtcblxuICB2YXIgcG9wdXBQb3NpdGlvbiA9IHRoaXMuX2NvbXB1dGVQb3B1cFBvc2l0aW9uKG9wdGlvbnMucG9wdXBPcHRpb25zKTtcbiAgdmFyIHBvcHVwT3B0aW9ucyA9IHh0ZW5kKHBvcHVwUG9zaXRpb24sIG9wdGlvbnMucG9wdXBPcHRpb25zKTtcblxuICB2YXIgcG9wdXAgPSBXaW5DaGFuLm9wZW4oe1xuICAgIHVybDogcG9wdXBVcmwsXG4gICAgcmVsYXlfdXJsOiAnaHR0cHM6Ly8nICsgdGhpcy5fZG9tYWluICsgJy9yZWxheS5odG1sJyxcbiAgICB3aW5kb3dfZmVhdHVyZXM6IHN0cmluZ2lmeVBvcHVwU2V0dGluZ3MocG9wdXBPcHRpb25zKVxuICB9LCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcbiAgICAvLyBFbGltaW5hdGUgYF9jdXJyZW50X3BvcHVwYCByZWZlcmVuY2UgbWFudWFsbHkgYmVjYXVzZVxuICAgIC8vIFdpbmNoYW4gcmVtb3ZlcyBgLmtpbGwoKWAgbWV0aG9kIGZyb20gd2luZG93IGFuZCBhbHNvXG4gICAgLy8gZG9lc24ndCBjYWxsIGAua2lsbCgpYCBieSBpdHNlbGZcbiAgICBfdGhpcy5fY3VycmVudF9wb3B1cCA9IG51bGw7XG5cbiAgICAvLyBXaW5jaGFuIGFsd2F5cyByZXR1cm5zIHN0cmluZyBlcnJvcnMsIHdlIHdyYXAgdGhlbSBpbnNpZGUgRXJyb3Igb2JqZWN0c1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTG9naW5FcnJvcihlcnIpLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgZWRnZSBjYXNlIHdpdGggZ2VuZXJpYyBlcnJvclxuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobmV3IExvZ2luRXJyb3IoJ1NvbWV0aGluZyB3ZW50IHdyb25nJyksIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBwcm9maWxlIHJldHJpZXZhbCBmcm9tIGlkX3Rva2VuIGFuZCByZXNwb25kXG4gICAgaWYgKHJlc3VsdC5hY2Nlc3NfdG9rZW4gfHwgcmVzdWx0LmlkX3Rva2VuKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgX3RoaXMuX3ByZXBhcmVSZXN1bHQocmVzdWx0KSk7XG4gICAgfVxuXG4gICAgLy8gQ2FzZSB3aGVyZSB0aGUgZXJyb3IgaXMgcmV0dXJuZWQgYXQgYW4gYGVycmAgcHJvcGVydHkgZnJvbSB0aGUgcmVzdWx0XG4gICAgaWYgKHJlc3VsdC5lcnIpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTG9naW5FcnJvcihyZXN1bHQuZXJyLnN0YXR1cywgcmVzdWx0LmVyci5kZXRhaWxzIHx8IHJlc3VsdC5lcnIpLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICB9XG5cbiAgICAvLyBDYXNlIGZvciBzc29fZGJjb25uZWN0aW9uX3BvcHVwIHJldHVybmluZyBlcnJvciBhdCByZXN1bHQuZXJyb3IgaW5zdGVhZCBvZiByZXN1bHQuZXJyXG4gICAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBMb2dpbkVycm9yKHJlc3VsdC5zdGF0dXMsIHJlc3VsdC5kZXRhaWxzIHx8IHJlc3VsdCksIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIH1cblxuICAgIC8vIENhc2Ugd2UgY291bGRuJ3QgbWF0Y2ggYW55IGVycm9yLCB3ZSByZXR1cm4gYSBnZW5lcmljIG9uZVxuICAgIHJldHVybiBjYWxsYmFjayhuZXcgTG9naW5FcnJvcignU29tZXRoaW5nIHdlbnQgd3JvbmcnKSwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gIH0pO1xuXG4gIHBvcHVwLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIF9zaG91bGRBdXRoZW50aWNhdGVXaXRoQ29yZG92YVBsdWdpbiBtZXRob2QgY2hlY2tzIHdoZXRoZXIgQXV0aDAgaXMgcHJvcGVybHkgY29uZmlndXJlZCB0b1xuICogaGFuZGxlIGF1dGhlbnRpY2F0aW9uIG9mIGEgc29jaWFsIGNvbm5uZWN0aW9uIHVzaW5nIGEgcGhvbmVnYXAgcGx1Z2luLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSAgIGNvbm5lY3Rpb24gICAgTmFtZSBvZiB0aGUgY29ubmVjdGlvbi5cbiAqIEBwcml2YXRlXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLl9zaG91bGRBdXRoZW50aWNhdGVXaXRoQ29yZG92YVBsdWdpbiA9IGZ1bmN0aW9uKGNvbm5lY3Rpb24pIHtcbiAgdmFyIHNvY2lhbFBsdWdpbiA9IHRoaXMuX2NvcmRvdmFTb2NpYWxQbHVnaW5zW2Nvbm5lY3Rpb25dO1xuICByZXR1cm4gdGhpcy5fdXNlQ29yZG92YVNvY2lhbFBsdWdpbnMgJiYgISFzb2NpYWxQbHVnaW47XG59O1xuXG4vKipcbiAqIF9zb2NpYWxQaG9uZWdhcExvZ2luIHBlcmZvcm1zIHNvY2lhbCBhdXRoZW50aWNhdGlvbiB1c2luZyBhIHBob25lZ2FwIHBsdWdpblxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSAgIGNvbm5lY3Rpb24gICBOYW1lIG9mIHRoZSBjb25uZWN0aW9uLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgICAgIFRvIGJlIGNhbGxlZCBhZnRlciBsb2dpbiBoYXBwZW5lZCAod2hldGhlclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3Mgb3IgZmFpbHVyZSkuXG4gKiBAcHJpdmF0ZVxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5fc29jaWFsUGhvbmVnYXBMb2dpbiA9IGZ1bmN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHZhciBzb2NpYWxBdXRoZW50aWNhdGlvbiA9IHRoaXMuX2NvcmRvdmFTb2NpYWxQbHVnaW5zW29wdGlvbnMuY29ubmVjdGlvbl07XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHNvY2lhbEF1dGhlbnRpY2F0aW9uKG9wdGlvbnMuY29ubmVjdGlvbl9zY29wZSwgZnVuY3Rpb24oZXJyb3IsIGFjY2Vzc1Rva2VuLCBleHRyYXMpIHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGxvZ2luT3B0aW9ucyA9IHh0ZW5kKHsgYWNjZXNzX3Rva2VuOiBhY2Nlc3NUb2tlbiB9LCBvcHRpb25zLCBleHRyYXMpO1xuICAgIF90aGlzLmxvZ2luV2l0aFNvY2lhbEFjY2Vzc1Rva2VuKGxvZ2luT3B0aW9ucywgY2FsbGJhY2spO1xuICB9KTtcbn07XG5cbi8qKlxuICogX3Bob25lZ2FwRmFjZWJvb2tMb2dpbiBwZXJmb3JtcyBzb2NpYWwgYXV0aGVudGljYXRpb24gd2l0aCBGYWNlYm9vayB1c2luZyBwaG9uZWdhcC1mYWNlYm9vay1wbHVnaW5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBzY29wZXMgICAgIEZCIHNjb3BlcyB1c2VkIHRvIGxvZ2luLiBJdCBjYW4gYmUgYW4gQXJyYXkgb2YgU3RyaW5nIG9yIGEgc2luZ2xlIFN0cmluZy5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQnkgZGVmYXVsdCBpcyBbXCJwdWJsaWNfcHJvZmlsZVwiXVxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgICBUbyBiZSBjYWxsZWQgYWZ0ZXIgbG9naW4gaGFwcGVuZWQgKHdoZXRoZXIgc3VjY2VzcyBvciBmYWlsdXJlKS4gSXQgd2lsbFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5aWVsZCB0aGUgYWNjZXNzVG9rZW4gYW5kIGFueSBleHRyYSBpbmZvcm1hdGlvbiBuZWVlZGVkIGJ5IEF1dGgwIEFQSVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvciBhbiBFcnJvciBpZiB0aGUgYXV0aGVudGljYXRpb24gZmFpbHMuIENhbGxiYWNrIHNob3VsZCBiZTpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVyciwgYWNjZXNzVG9rZW4sIGV4dHJhcykgeyB9XG4gKiBAcHJpdmF0ZVxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5fcGhvbmVnYXBGYWNlYm9va0xvZ2luID0gZnVuY3Rpb24oc2NvcGVzLCBjYWxsYmFjaykge1xuICBpZiAoIXdpbmRvdy5mYWNlYm9va0Nvbm5lY3RQbHVnaW4gfHwgIXdpbmRvdy5mYWNlYm9va0Nvbm5lY3RQbHVnaW4ubG9naW4pIHtcbiAgICBjYWxsYmFjayhuZXcgRXJyb3IoJ21pc3NpbmcgcGx1Z2luIHBob25lZ2FwLWZhY2Vib29rLXBsdWdpbicpLCBudWxsLCBudWxsKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgZmJTY29wZXM7XG4gIGlmIChzY29wZXMgJiYgaXNfYXJyYXkoc2NvcGVzKSl7XG4gICAgZmJTY29wZXMgPSBzY29wZXM7XG4gIH0gZWxzZSBpZiAoc2NvcGVzKSB7XG4gICAgZmJTY29wZXMgPSBbc2NvcGVzXTtcbiAgfSBlbHNlIHtcbiAgICBmYlNjb3BlcyA9IFsncHVibGljX3Byb2ZpbGUnXTtcbiAgfVxuICB3aW5kb3cuZmFjZWJvb2tDb25uZWN0UGx1Z2luLmxvZ2luKGZiU2NvcGVzLCBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICBjYWxsYmFjayhudWxsLCBzdGF0ZS5hdXRoUmVzcG9uc2UuYWNjZXNzVG9rZW4sIHt9KTtcbiAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICBjYWxsYmFjayhuZXcgRXJyb3IoZXJyb3IpLCBudWxsLCBudWxsKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgdGhlIHNjZW5hcmlvIHdoZXJlIGEgZGIgY29ubmVjdGlvbiBpcyB1c2VkIHdpdGhcbiAqIHBvcHVwOiB0cnVlIGFuZCBzc286IHRydWUuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQXV0aDAucHJvdG90eXBlLmxvZ2luV2l0aFVzZXJuYW1lUGFzc3dvcmRBbmRTU08gPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdmFyIHBvcHVwUG9zaXRpb24gPSB0aGlzLl9jb21wdXRlUG9wdXBQb3NpdGlvbihvcHRpb25zLnBvcHVwT3B0aW9ucyk7XG4gIHZhciBwb3B1cE9wdGlvbnMgPSB4dGVuZChwb3B1cFBvc2l0aW9uLCBvcHRpb25zLnBvcHVwT3B0aW9ucyk7XG5cbiAgaWYgKCFvcHRpb25zLm5vbmNlICYmIHRoaXMuX3Jlc3BvbnNlVHlwZS5pbmRleE9mKCdpZF90b2tlbicpID4gLTEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ25vbmNlIGlzIG1hbmRhdG9yeScpO1xuICB9XG5cbiAgdmFyIHdpbmNoYW5PcHRpb25zID0ge1xuICAgIHVybDogJ2h0dHBzOi8vJyArIHRoaXMuX2RvbWFpbiArICcvc3NvX2RiY29ubmVjdGlvbl9wb3B1cC8nICsgdGhpcy5fY2xpZW50SUQsXG4gICAgcmVsYXlfdXJsOiAnaHR0cHM6Ly8nICsgdGhpcy5fZG9tYWluICsgJy9yZWxheS5odG1sJyxcbiAgICB3aW5kb3dfZmVhdHVyZXM6IHN0cmluZ2lmeVBvcHVwU2V0dGluZ3MocG9wdXBPcHRpb25zKSxcbiAgICBwb3B1cDogdGhpcy5fY3VycmVudF9wb3B1cCxcbiAgICBwYXJhbXM6IHtcbiAgICAgIGRvbWFpbjogICAgICAgICAgICAgICAgIHRoaXMuX2RvbWFpbixcbiAgICAgIGNsaWVudElEOiAgICAgICAgICAgICAgIHRoaXMuX2NsaWVudElELFxuICAgICAgb3B0aW9uczoge1xuICAgICAgICAvLyBUT0RPIFdoYXQgaGFwcGVucyB3aXRoIGkxOG4/XG4gICAgICAgIHVzZXJuYW1lOiAgIHRyaW0ob3B0aW9ucy51c2VybmFtZSB8fCBvcHRpb25zLmVtYWlsIHx8ICcnKSxcbiAgICAgICAgcGFzc3dvcmQ6ICAgb3B0aW9ucy5wYXNzd29yZCxcbiAgICAgICAgY29ubmVjdGlvbjogb3B0aW9ucy5jb25uZWN0aW9uLFxuICAgICAgICBzdGF0ZTogICAgICBvcHRpb25zLnN0YXRlLFxuICAgICAgICBzY29wZTogICAgICBvcHRpb25zLnNjb3BlXG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGlmIChvcHRpb25zLl9jc3JmKSB7XG4gICAgd2luY2hhbk9wdGlvbnMucGFyYW1zLm9wdGlvbnMuX2NzcmYgPSBvcHRpb25zLl9jc3JmO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuZGV2aWNlKSB7XG4gICAgd2luY2hhbk9wdGlvbnMucGFyYW1zLm9wdGlvbnMuZGV2aWNlID0gb3B0aW9ucy5kZXZpY2U7XG4gIH1cblxuICB2YXIgcG9wdXAgPSBXaW5DaGFuLm9wZW4od2luY2hhbk9wdGlvbnMsIGZ1bmN0aW9uIChlcnIsIHJlc3VsdCkge1xuICAgIC8vIEVsaW1pbmF0ZSBgX2N1cnJlbnRfcG9wdXBgIHJlZmVyZW5jZSBtYW51YWxseSBiZWNhdXNlXG4gICAgLy8gV2luY2hhbiByZW1vdmVzIGAua2lsbCgpYCBtZXRob2QgZnJvbSB3aW5kb3cgYW5kIGFsc29cbiAgICAvLyBkb2Vzbid0IGNhbGwgYC5raWxsKClgIGJ5IGl0c2VsZlxuICAgIF90aGlzLl9jdXJyZW50X3BvcHVwID0gbnVsbDtcblxuICAgIC8vIFdpbmNoYW4gYWx3YXlzIHJldHVybnMgc3RyaW5nIGVycm9ycywgd2Ugd3JhcCB0aGVtIGluc2lkZSBFcnJvciBvYmplY3RzXG4gICAgaWYgKGVycikge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBMb2dpbkVycm9yKGVyciksIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBlZGdlIGNhc2Ugd2l0aCBnZW5lcmljIGVycm9yXG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTG9naW5FcnJvcignU29tZXRoaW5nIHdlbnQgd3JvbmcnKSwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIHByb2ZpbGUgcmV0cmlldmFsIGZyb20gaWRfdG9rZW4gYW5kIHJlc3BvbmRcbiAgICBpZiAocmVzdWx0LmlkX3Rva2VuKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgX3RoaXMuX3ByZXBhcmVSZXN1bHQocmVzdWx0KSk7XG4gICAgfVxuXG4gICAgLy8gQ2FzZSB3aGVyZSB0aGUgZXJyb3IgaXMgcmV0dXJuZWQgYXQgYW4gYGVycmAgcHJvcGVydHkgZnJvbSB0aGUgcmVzdWx0XG4gICAgaWYgKHJlc3VsdC5lcnIpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgTG9naW5FcnJvcihyZXN1bHQuZXJyLnN0YXR1cywgcmVzdWx0LmVyci5kZXRhaWxzIHx8IHJlc3VsdC5lcnIpLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICB9XG5cbiAgICAvLyBDYXNlIGZvciBzc29fZGJjb25uZWN0aW9uX3BvcHVwIHJldHVybmluZyBlcnJvciBhdCByZXN1bHQuZXJyb3IgaW5zdGVhZCBvZiByZXN1bHQuZXJyXG4gICAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBMb2dpbkVycm9yKHJlc3VsdC5zdGF0dXMsIHJlc3VsdC5kZXRhaWxzIHx8IHJlc3VsdCksIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIH1cblxuICAgIC8vIENhc2Ugd2UgY291bGRuJ3QgbWF0Y2ggYW55IGVycm9yLCB3ZSByZXR1cm4gYSBnZW5lcmljIG9uZVxuICAgIHJldHVybiBjYWxsYmFjayhuZXcgTG9naW5FcnJvcignU29tZXRoaW5nIHdlbnQgd3JvbmcnKSwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gIH0pO1xuXG4gIHBvcHVwLmZvY3VzKCk7XG59O1xuXG4vKipcbiAqIExvZ2luIHdpdGggUmVzb3VyY2UgT3duZXIgKFJPKVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQG1ldGhvZCBsb2dpbldpdGhSZXNvdXJjZU93bmVyXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLmxvZ2luV2l0aFJlc291cmNlT3duZXIgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdmFyIHF1ZXJ5ID0geHRlbmQoXG4gICAgdGhpcy5fZ2V0TW9kZShvcHRpb25zKSxcbiAgICBvcHRpb25zLFxuICAgIHtcbiAgICAgIGNsaWVudF9pZDogICAgdGhpcy5fY2xpZW50SUQsXG4gICAgICB1c2VybmFtZTogICAgIHRyaW0ob3B0aW9ucy51c2VybmFtZSB8fCBvcHRpb25zLmVtYWlsIHx8ICcnKSxcbiAgICAgIGdyYW50X3R5cGU6ICAgJ3Bhc3N3b3JkJ1xuICAgIH0pO1xuXG4gIHRoaXMuX2NvbmZpZ3VyZU9mZmxpbmVNb2RlKHF1ZXJ5KTtcblxuICB2YXIgcHJvdG9jb2wgPSAnaHR0cHM6JztcbiAgdmFyIGRvbWFpbiA9IHRoaXMuX2RvbWFpbjtcbiAgdmFyIGVuZHBvaW50ID0gJy9vYXV0aC9ybyc7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICBpZiAoIHRoaXMuX3NlbmRDbGllbnRJbmZvICYmIHRoaXMuX3VzZUpTT05QICkge1xuICAgIHF1ZXJ5WydhdXRoMENsaWVudCddID0gdGhpcy5fZ2V0Q2xpZW50SW5mb1N0cmluZygpO1xuICB9XG5cbiAgaWYgKHRoaXMuX3VzZUpTT05QKSB7XG4gICAgcmV0dXJuIGpzb25wKHVybCArICc/JyArIHFzLnN0cmluZ2lmeShxdWVyeSksIGpzb25wT3B0cywgZnVuY3Rpb24gKGVyciwgcmVzcCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cbiAgICAgIGlmKCdlcnJvcicgaW4gcmVzcCkge1xuICAgICAgICB2YXIgZXJyb3IgPSBuZXcgTG9naW5FcnJvcihyZXNwLnN0YXR1cywgcmVzcC5lcnJvcik7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvcik7XG4gICAgICB9XG4gICAgICBjYWxsYmFjayhudWxsLCBfdGhpcy5fcHJlcGFyZVJlc3VsdChyZXNwKSk7XG4gICAgfSk7XG4gIH1cblxuICByZXF3ZXN0KHtcbiAgICB1cmw6ICAgICBzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSA/IGVuZHBvaW50IDogdXJsLFxuICAgIG1ldGhvZDogICdwb3N0JyxcbiAgICB0eXBlOiAgICAnanNvbicsXG4gICAgZGF0YTogICAgcXVlcnksXG4gICAgaGVhZGVyczogdGhpcy5fZ2V0Q2xpZW50SW5mb0hlYWRlcigpLFxuICAgIGNyb3NzT3JpZ2luOiAhc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbiksXG4gICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIF90aGlzLl9wcmVwYXJlUmVzdWx0KHJlc3ApKTtcbiAgICB9LFxuICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBoYW5kbGVSZXF1ZXN0RXJyb3IoZXJyLCBjYWxsYmFjayk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuICogTG9naW4gd2l0aCBTb2NpYWwgQWNjZXNzIFRva2VuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAbWV0aG9kIGxvZ2luV2l0aFNvY2lhbEFjY2Vzc1Rva2VuXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLmxvZ2luV2l0aFNvY2lhbEFjY2Vzc1Rva2VuID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHZhciBxdWVyeSA9IHRoaXMuX2J1aWxkQXV0aG9yaXphdGlvblBhcmFtZXRlcnMoW1xuICAgICAgeyBzY29wZTogJ29wZW5pZCcgfSxcbiAgICAgIG9wdGlvbnMsXG4gICAgICB7IGNsaWVudF9pZDogdGhpcy5fY2xpZW50SUQgfVxuICAgIF0pO1xuXG4gIHZhciBwcm90b2NvbCA9ICdodHRwczonO1xuICB2YXIgZG9tYWluID0gdGhpcy5fZG9tYWluO1xuICB2YXIgZW5kcG9pbnQgPSAnL29hdXRoL2FjY2Vzc190b2tlbic7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICBpZiAodGhpcy5fdXNlSlNPTlApIHtcbiAgICByZXR1cm4ganNvbnAodXJsICsgJz8nICsgcXMuc3RyaW5naWZ5KHF1ZXJ5KSwganNvbnBPcHRzLCBmdW5jdGlvbiAoZXJyLCByZXNwKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgfVxuICAgICAgaWYoJ2Vycm9yJyBpbiByZXNwKSB7XG4gICAgICAgIHZhciBlcnJvciA9IG5ldyBMb2dpbkVycm9yKHJlc3Auc3RhdHVzLCByZXNwLmVycm9yKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrKG51bGwsIF90aGlzLl9wcmVwYXJlUmVzdWx0KHJlc3ApKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlcXdlc3Qoe1xuICAgIHVybDogICAgIHNhbWVfb3JpZ2luKHByb3RvY29sLCBkb21haW4pID8gZW5kcG9pbnQgOiB1cmwsXG4gICAgbWV0aG9kOiAgJ3Bvc3QnLFxuICAgIHR5cGU6ICAgICdqc29uJyxcbiAgICBkYXRhOiAgICBxdWVyeSxcbiAgICBoZWFkZXJzOiB0aGlzLl9nZXRDbGllbnRJbmZvSGVhZGVyKCksXG4gICAgY3Jvc3NPcmlnaW46ICFzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSxcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgY2FsbGJhY2sobnVsbCwgX3RoaXMuX3ByZXBhcmVSZXN1bHQocmVzcCkpO1xuICAgIH0sXG4gICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGhhbmRsZVJlcXVlc3RFcnJvcihlcnIsIGNhbGxiYWNrKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBPcGVuIGEgcG9wdXAsIHN0b3JlIHRoZSB3aW5yZWYgaW4gdGhlIGluc3RhbmNlIGFuZCByZXR1cm4gaXQuXG4gKlxuICogV2UgdXN1YWxseSBuZWVkIHRvIGNhbGwgdGhpcyBtZXRob2QgYmVmb3JlIGFueSBhamF4IHRyYW5zYWN0aW9uIGluIG9yZGVyXG4gKiB0byBwcmV2ZW50IHRoZSBicm93c2VyIHRvIGJsb2NrIHRoZSBwb3B1cC5cbiAqXG4gKiBAcGFyYW0gIHtbdHlwZV19ICAgb3B0aW9ucyAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcHJpdmF0ZVxuICovXG5cbkF1dGgwLnByb3RvdHlwZS5fYnVpbGRQb3B1cFdpbmRvdyA9IGZ1bmN0aW9uIChvcHRpb25zLCB1cmwpIHtcbiAgaWYgKHRoaXMuX2N1cnJlbnRfcG9wdXAgJiYgIXRoaXMuX2N1cnJlbnRfcG9wdXAuY2xvc2VkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRfcG9wdXA7XG4gIH1cblxuICB1cmwgPSB1cmwgfHwgJ2Fib3V0OmJsYW5rJ1xuXG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHZhciBkZWZhdWx0cyA9IHsgd2lkdGg6IDUwMCwgaGVpZ2h0OiA2MDAgfTtcbiAgdmFyIG9wdHMgPSB4dGVuZChkZWZhdWx0cywgb3B0aW9ucy5wb3B1cE9wdGlvbnMgfHwge30pO1xuICB2YXIgcG9wdXBPcHRpb25zID0gc3RyaW5naWZ5UG9wdXBTZXR0aW5ncyhvcHRzKTtcblxuICB0aGlzLl9jdXJyZW50X3BvcHVwID0gd2luZG93Lm9wZW4odXJsLCAnYXV0aDBfc2lnbnVwX3BvcHVwJywgcG9wdXBPcHRpb25zKTtcblxuICBpZiAoIXRoaXMuX2N1cnJlbnRfcG9wdXApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1BvcHVwIHdpbmRvdyBjYW5ub3Qgbm90IGJlZW4gY3JlYXRlZC4gRGlzYWJsZSBwb3B1cCBibG9ja2VyIG9yIG1ha2Ugc3VyZSB0byBjYWxsIEF1dGgwIGxvZ2luIG9yIHNpbmd1cCBvbiBhbiBVSSBldmVudC4nKTtcbiAgfVxuXG4gIHRoaXMuX2N1cnJlbnRfcG9wdXAua2lsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmNsb3NlKCk7XG4gICAgX3RoaXMuX2N1cnJlbnRfcG9wdXAgPSBudWxsO1xuICB9O1xuXG4gIHJldHVybiB0aGlzLl9jdXJyZW50X3BvcHVwO1xufTtcblxuLyoqXG4gKiBMb2dpbiB3aXRoIFVzZXJuYW1lIGFuZCBQYXNzd29yZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQG1ldGhvZCBsb2dpbldpdGhVc2VybmFtZVBhc3N3b3JkXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLmxvZ2luV2l0aFVzZXJuYW1lUGFzc3dvcmQgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgLy8gWFhYOiBXYXJuaW5nOiBUaGlzIGNoZWNrIGlzIHdoZXRoZXIgY2FsbGJhY2sgYXJndW1lbnRzIGFyZVxuICAvLyBmbihlcnIpIGNhc2UgY2FsbGJhY2subGVuZ3RoID09PSAxIChhIHJlZGlyZWN0IHNob3VsZCBiZSBwZXJmb3JtZWQpIHZzLlxuICAvLyBmbihlcnIsIHByb2ZpbGUsIGlkX3Rva2VuLCBhY2Nlc3NfdG9rZW4sIHN0YXRlKSBjYWxsYmFjay5sZW5ndGggPiAxIChub1xuICAvLyByZWRpcmVjdCBzaG91bGQgYmUgcGVyZm9ybWVkKVxuICAvL1xuICAvLyBOb3RlOiBQaG9uZWdhcC9Db3Jkb3ZhOlxuICAvLyBBcyB0aGUgcG9wdXAgaXMgbGF1bmNoZWQgdXNpbmcgdGhlIEluQXBwQnJvd3NlciBwbHVnaW4gdGhlIFNTTyBjb29raWUgd2lsbFxuICAvLyBiZSBzZXQgb24gdGhlIEluQXBwQnJvd3NlciBicm93c2VyLiBUaGF0J3Mgd2h5IHRoZSBicm93c2VyIHdoZXJlIHRoZSBhcHAgcnVuc1xuICAvLyB3b24ndCBnZXQgdGhlIHNzbyBjb29raWUuIFRoZXJlZm9yZSwgd2UgZG9uJ3QgYWxsb3cgdXNlcm5hbWUgcGFzc3dvcmQgdXNpbmdcbiAgLy8gcG9wdXAgd2l0aCBzc286IHRydWUgaW4gQ29yZG92YS9QaG9uZWdhcCBhbmQgd2UgZGVmYXVsdCB0byByZXNvdXJjZSBvd25lciBhdXRoLlxuICBpZiAoY2FsbGJhY2sgJiYgY2FsbGJhY2subGVuZ3RoID4gMSAmJiAoIW9wdGlvbnMuc3NvIHx8IHdpbmRvdy5jb3Jkb3ZhKSkge1xuICAgIHJldHVybiB0aGlzLmxvZ2luV2l0aFJlc291cmNlT3duZXIob3B0aW9ucywgY2FsbGJhY2spO1xuICB9XG5cbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdmFyIHBvcHVwO1xuXG4gIC8vIFRPRE8gV2Ugc2hvdWxkIGRlcHJlY2F0ZSB0aGlzLCByZWFsbHkgaGFja3kgYW5kIGNvbmZ1c2VzIHBlb3BsZS5cbiAgaWYgKG9wdGlvbnMucG9wdXAgICYmICF0aGlzLl9nZXRDYWxsYmFja09uTG9jYXRpb25IYXNoKG9wdGlvbnMpKSB7XG4gICAgcG9wdXAgPSB0aGlzLl9idWlsZFBvcHVwV2luZG93KG9wdGlvbnMpO1xuICB9XG5cbiAgaWYgKCFvcHRpb25zLm5vbmNlICYmIHRoaXMuX3Jlc3BvbnNlVHlwZS5pbmRleE9mKCdpZF90b2tlbicpID4gLTEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ25vbmNlIGlzIG1hbmRhdG9yeScpO1xuICB9XG5cbiAgLy8gV2hlbiBhIGNhbGxiYWNrIHdpdGggbW9yZSB0aGFuIG9uZSBhcmd1bWVudCBpcyBzcGVjaWZpZWQgYW5kIHNzbzogdHJ1ZSB0aGVuXG4gIC8vIHdlIG9wZW4gYSBwb3B1cCBhbmQgZG8gYXV0aGVudGljYXRpb24gdGhlcmUuXG4gIGlmIChjYWxsYmFjayAmJiBjYWxsYmFjay5sZW5ndGggPiAxICYmIG9wdGlvbnMuc3NvICkge1xuICAgIHJldHVybiB0aGlzLmxvZ2luV2l0aFVzZXJuYW1lUGFzc3dvcmRBbmRTU08ob3B0aW9ucywgY2FsbGJhY2spO1xuICB9XG5cbiAgdmFyIHF1ZXJ5ID0geHRlbmQoXG4gICAgdGhpcy5fZ2V0TW9kZShvcHRpb25zKSxcbiAgICBvcHRpb25zLFxuICAgIHtcbiAgICAgIGNsaWVudF9pZDogdGhpcy5fY2xpZW50SUQsXG4gICAgICByZWRpcmVjdF91cmk6IHRoaXMuX2dldENhbGxiYWNrVVJMKG9wdGlvbnMpLFxuICAgICAgdXNlcm5hbWU6IHRyaW0ob3B0aW9ucy51c2VybmFtZSB8fCBvcHRpb25zLmVtYWlsIHx8ICcnKSxcbiAgICAgIHRlbmFudDogdGhpcy5fZG9tYWluLnNwbGl0KCcuJylbMF1cbiAgICB9KTtcblxuICB0aGlzLl9jb25maWd1cmVPZmZsaW5lTW9kZShxdWVyeSk7XG5cbiAgdmFyIHByb3RvY29sID0gJ2h0dHBzOic7XG4gIHZhciBkb21haW4gPSB0aGlzLl9kb21haW47XG4gIHZhciBlbmRwb2ludCA9ICcvdXNlcm5hbWVwYXNzd29yZC9sb2dpbic7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICBpZiAodGhpcy5fdXNlSlNPTlApIHtcbiAgICByZXR1cm4ganNvbnAodXJsICsgJz8nICsgcXMuc3RyaW5naWZ5KHF1ZXJ5KSwganNvbnBPcHRzLCBmdW5jdGlvbiAoZXJyLCByZXNwKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGlmIChwb3B1cCAmJiBwb3B1cC5raWxsKSB7IHBvcHVwLmtpbGwoKTsgfVxuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cbiAgICAgIGlmKCdlcnJvcicgaW4gcmVzcCkge1xuICAgICAgICBpZiAocG9wdXAgJiYgcG9wdXAua2lsbCkgeyBwb3B1cC5raWxsKCk7IH1cbiAgICAgICAgdmFyIGVycm9yID0gbmV3IExvZ2luRXJyb3IocmVzcC5zdGF0dXMsIHJlc3AuZXJyb3IpO1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpO1xuICAgICAgfVxuICAgICAgX3RoaXMuX3JlbmRlckFuZFN1Ym1pdFdTRmVkRm9ybShvcHRpb25zLCByZXNwLmZvcm0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmV0dXJuX2Vycm9yIChlcnJvcikge1xuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cblxuICByZXF3ZXN0KHtcbiAgICB1cmw6ICAgICBzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSA/IGVuZHBvaW50IDogdXJsLFxuICAgIG1ldGhvZDogICdwb3N0JyxcbiAgICB0eXBlOiAgICAnaHRtbCcsXG4gICAgZGF0YTogICAgcXVlcnksXG4gICAgaGVhZGVyczogdGhpcy5fZ2V0Q2xpZW50SW5mb0hlYWRlcigpLFxuICAgIGNyb3NzT3JpZ2luOiAhc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbiksXG4gICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgIF90aGlzLl9yZW5kZXJBbmRTdWJtaXRXU0ZlZEZvcm0ob3B0aW9ucywgcmVzcCk7XG4gICAgfSxcbiAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKHBvcHVwICYmIHBvcHVwLmtpbGwpIHtcbiAgICAgICAgcG9wdXAua2lsbCgpO1xuICAgICAgfVxuICAgICAgaGFuZGxlUmVxdWVzdEVycm9yKGVyciwgcmV0dXJuX2Vycm9yKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBMb2dpbiB3aXRoIHBob25lIG51bWJlciBhbmQgcGFzc2NvZGVcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEBtZXRob2QgbG9naW5XaXRoUGhvbmVOdW1iZXJcbiAqL1xuQXV0aDAucHJvdG90eXBlLmxvZ2luV2l0aFBhc3Njb2RlID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG5cbiAgaWYgKG9wdGlvbnMuZW1haWwgPT0gbnVsbCAmJiBvcHRpb25zLnBob25lTnVtYmVyID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2VtYWlsIG9yIHBob25lTnVtYmVyIGlzIHJlcXVpcmVkIGZvciBhdXRoZW50aWNhdGlvbicpO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMucGFzc2NvZGUgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBFcnJvcigncGFzc2NvZGUgaXMgcmVxdWlyZWQgZm9yIGF1dGhlbnRpY2F0aW9uJyk7XG4gIH1cblxuICBvcHRpb25zLmNvbm5lY3Rpb24gPSBvcHRpb25zLmVtYWlsID09IG51bGwgPyAnc21zJyA6ICdlbWFpbCc7XG5cbiAgaWYgKCF0aGlzLl9zaG91bGRSZWRpcmVjdCkge1xuICAgIG9wdGlvbnMgPSB4dGVuZChvcHRpb25zLCB7XG4gICAgICB1c2VybmFtZTogb3B0aW9ucy5lbWFpbCA9PSBudWxsID8gb3B0aW9ucy5waG9uZU51bWJlciA6IG9wdGlvbnMuZW1haWwsXG4gICAgICBwYXNzd29yZDogb3B0aW9ucy5wYXNzY29kZSxcbiAgICAgIHNzbzogZmFsc2VcbiAgICB9KTtcblxuICAgIGRlbGV0ZSBvcHRpb25zLmVtYWlsO1xuICAgIGRlbGV0ZSBvcHRpb25zLnBob25lTnVtYmVyO1xuICAgIGRlbGV0ZSBvcHRpb25zLnBhc3Njb2RlO1xuXG4gICAgcmV0dXJuIHRoaXMubG9naW5XaXRoUmVzb3VyY2VPd25lcihvcHRpb25zLCBjYWxsYmFjayk7XG4gIH1cblxuICB2YXIgdmVyaWZ5T3B0aW9ucyA9IHtjb25uZWN0aW9uOiBvcHRpb25zLmNvbm5lY3Rpb259O1xuXG4gIGlmIChvcHRpb25zLnBob25lTnVtYmVyKSB7XG4gICAgb3B0aW9ucy5waG9uZV9udW1iZXIgPSBvcHRpb25zLnBob25lTnVtYmVyO1xuICAgIGRlbGV0ZSBvcHRpb25zLnBob25lTnVtYmVyO1xuXG4gICAgdmVyaWZ5T3B0aW9ucy5waG9uZV9udW1iZXIgPSBvcHRpb25zLnBob25lX251bWJlcjtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmVtYWlsKSB7XG4gICAgdmVyaWZ5T3B0aW9ucy5lbWFpbCA9IG9wdGlvbnMuZW1haWw7XG4gIH1cblxuICBvcHRpb25zLnZlcmlmaWNhdGlvbl9jb2RlID0gb3B0aW9ucy5wYXNzY29kZTtcbiAgZGVsZXRlIG9wdGlvbnMucGFzc2NvZGU7XG5cbiAgdmVyaWZ5T3B0aW9ucy52ZXJpZmljYXRpb25fY29kZSA9IG9wdGlvbnMudmVyaWZpY2F0aW9uX2NvZGU7XG5cbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdGhpcy5fdmVyaWZ5KHZlcmlmeU9wdGlvbnMsIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyb3IpO1xuICAgIH1cbiAgICBfdGhpcy5fdmVyaWZ5X3JlZGlyZWN0KG9wdGlvbnMpO1xuICB9KTtcbn07XG5cbkF1dGgwLnByb3RvdHlwZS5fdmVyaWZ5ID0gZnVuY3Rpb24ob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgdmFyIHByb3RvY29sID0gJ2h0dHBzOic7XG4gIHZhciBkb21haW4gPSB0aGlzLl9kb21haW47XG4gIHZhciBlbmRwb2ludCA9ICcvcGFzc3dvcmRsZXNzL3ZlcmlmeSc7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICB2YXIgZGF0YSA9IG9wdGlvbnM7XG5cbiAgaWYgKHRoaXMuX3VzZUpTT05QKSB7XG4gICAgaWYgKHRoaXMuX3NlbmRDbGllbnRJbmZvKSB7XG4gICAgICBkYXRhWydhdXRoMENsaWVudCddID0gdGhpcy5fZ2V0Q2xpZW50SW5mb1N0cmluZygpO1xuICAgIH1cblxuICAgIHJldHVybiBqc29ucCh1cmwgKyAnPycgKyBxcy5zdHJpbmdpZnkoZGF0YSksIGpzb25wT3B0cywgZnVuY3Rpb24gKGVyciwgcmVzcCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKDAgKyAnOiAnICsgZXJyLnRvU3RyaW5nKCkpKTtcbiAgICAgIH1cbiAgICAgIC8vIC8qKi8gdHlwZW9mIF9fYXV0aDBqcDAgPT09ICdmdW5jdGlvbicgJiYgX19hdXRoMGpwMCh7XCJzdGF0dXNcIjo0MDB9KTtcbiAgICAgIHJldHVybiByZXNwLnN0YXR1cyA9PT0gMjAwID8gY2FsbGJhY2sobnVsbCwgdHJ1ZSkgOiBjYWxsYmFjayh7c3RhdHVzOiByZXNwLnN0YXR1c30pO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHJlcXdlc3Qoe1xuICAgIHVybDogICAgICAgICAgc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbikgPyBlbmRwb2ludCA6IHVybCxcbiAgICBtZXRob2Q6ICAgICAgICdwb3N0JyxcbiAgICBoZWFkZXJzOiAgICAgIHRoaXMuX2dldENsaWVudEluZm9IZWFkZXIoKSxcbiAgICBjcm9zc09yaWdpbjogICFzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKSxcbiAgICBkYXRhOiAgICAgICAgIGRhdGFcbiAgfSlcbiAgLmZhaWwoZnVuY3Rpb24gKGVycikge1xuICAgIHRyeSB7XG4gICAgICBjYWxsYmFjayhKU09OLnBhcnNlKGVyci5yZXNwb25zZVRleHQpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoZXJyLnN0YXR1cyArICcoJyArIGVyci5zdGF0dXNUZXh0ICsgJyk6ICcgKyBlcnIucmVzcG9uc2VUZXh0KTtcbiAgICAgIGVycm9yLnN0YXR1c0NvZGUgPSBlcnIuc3RhdHVzO1xuICAgICAgZXJyb3IuZXJyb3IgPSBlcnIuc3RhdHVzVGV4dDtcbiAgICAgIGVycm9yLm1lc3NhZ2UgPSBlcnIucmVzcG9uc2VUZXh0O1xuICAgICAgY2FsbGJhY2soZXJyb3IpO1xuICAgIH1cbiAgfSlcbiAgLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdCk7XG4gIH0pO1xufVxuXG5BdXRoMC5wcm90b3R5cGUuX3ZlcmlmeV9yZWRpcmVjdCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIHFzID0gW1xuICAgIHRoaXMuX2dldE1vZGUob3B0aW9ucyksXG4gICAgb3B0aW9ucyxcbiAgICB7XG4gICAgICBjbGllbnRfaWQ6IHRoaXMuX2NsaWVudElELFxuICAgICAgcmVkaXJlY3RfdXJpOiB0aGlzLl9nZXRDYWxsYmFja1VSTChvcHRpb25zKVxuICAgIH1cbiAgXTtcblxuICB2YXIgcXVlcnkgPSB0aGlzLl9idWlsZEF1dGhvcml6ZVF1ZXJ5U3RyaW5nKHFzKTtcbiAgdmFyIHVybCA9IGpvaW5VcmwoJ2h0dHBzOicsIHRoaXMuX2RvbWFpbiwgJy9wYXNzd29yZGxlc3MvdmVyaWZ5X3JlZGlyZWN0PycgKyBxdWVyeSk7XG5cbiAgdGhpcy5fcmVkaXJlY3QodXJsKTtcbn07XG5cbi8vIFRPRE8gRG9jdW1lbnQgbWVcbkF1dGgwLnByb3RvdHlwZS5yZW5ld0lkVG9rZW4gPSBmdW5jdGlvbiAoaWRfdG9rZW4sIGNhbGxiYWNrKSB7XG4gIHRoaXMuZ2V0RGVsZWdhdGlvblRva2VuKHtcbiAgICBpZF90b2tlbjogaWRfdG9rZW4sXG4gICAgc2NvcGU6ICdwYXNzdGhyb3VnaCcsXG4gICAgYXBpOiAnYXV0aDAnXG4gIH0sIGNhbGxiYWNrKTtcbn07XG5cbi8vIFRPRE8gRG9jdW1lbnQgbWVcbkF1dGgwLnByb3RvdHlwZS5yZWZyZXNoVG9rZW4gPSBmdW5jdGlvbiAocmVmcmVzaF90b2tlbiwgY2FsbGJhY2spIHtcbiAgdGhpcy5nZXREZWxlZ2F0aW9uVG9rZW4oe1xuICAgIHJlZnJlc2hfdG9rZW46IHJlZnJlc2hfdG9rZW4sXG4gICAgc2NvcGU6ICdwYXNzdGhyb3VnaCcsXG4gICAgYXBpOiAnYXV0aDAnXG4gIH0sIGNhbGxiYWNrKTtcbn07XG5cbi8qKlxuICogR2V0IGRlbGVnYXRpb24gdG9rZW4gZm9yIGNlcnRhaW4gYWRkb24gb3IgY2VydGFpbiBvdGhlciBjbGllbnRJZFxuICpcbiAqIEBleGFtcGxlXG4gKlxuICogICAgIGF1dGgwLmdldERlbGVnYXRpb25Ub2tlbih7XG4gKiAgICAgIGlkX3Rva2VuOiAgICc8dXNlci1pZC10b2tlbj4nLFxuICogICAgICB0YXJnZXQ6ICAgICAnPGFwcC1jbGllbnQtaWQ+J1xuICogICAgICBhcGlfdHlwZTogJ2F1dGgwJ1xuICogICAgIH0sIGZ1bmN0aW9uIChlcnIsIGRlbGVnYXRpb25SZXN1bHQpIHtcbiAqICAgICAgICBpZiAoZXJyKSByZXR1cm4gY29uc29sZS5sb2coZXJyLm1lc3NhZ2UpO1xuICogICAgICAgIC8vIERvIHN0dWZmIHdpdGggZGVsZWdhdGlvbiB0b2tlblxuICogICAgICAgIGV4cGVjdChkZWxlZ2F0aW9uUmVzdWx0LmlkX3Rva2VuKS50by5leGlzdDtcbiAqICAgICAgICBleHBlY3QoZGVsZWdhdGlvblJlc3VsdC50b2tlbl90eXBlKS50by5lcWwoJ0JlYXJlcicpO1xuICogICAgICAgIGV4cGVjdChkZWxlZ2F0aW9uUmVzdWx0LmV4cGlyZXNfaW4pLnRvLmVxbCgzNjAwMCk7XG4gKiAgICAgfSk7XG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIC8vIGdldCBhIGRlbGVnYXRpb24gdG9rZW4gZnJvbSBhIEZpcmViYXNlIEFQSSBBcHBcbiAgKiAgICAgYXV0aDAuZ2V0RGVsZWdhdGlvblRva2VuKHtcbiAqICAgICAgaWRfdG9rZW46ICAgJzx1c2VyLWlkLXRva2VuPicsXG4gKiAgICAgIHRhcmdldDogICAgICc8YXBwLWNsaWVudC1pZD4nXG4gKiAgICAgIGFwaV90eXBlOiAnZmlyZWJhc2UnXG4gKiAgICAgfSwgZnVuY3Rpb24gKGVyciwgZGVsZWdhdGlvblJlc3VsdCkge1xuICogICAgICAvLyBVc2UgeW91ciBmaXJlYmFzZSB0b2tlbiBoZXJlXG4gKiAgICB9KTtcbiAqXG4gKiBAbWV0aG9kIGdldERlbGVnYXRpb25Ub2tlblxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtTdHJpbmd9IFtpZF90b2tlbl1cbiAqIEBwYXJhbSB7U3RyaW5nfSBbdGFyZ2V0XVxuICogQHBhcmFtIHtTdHJpbmd9IFthcGlfdHlwZV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja11cbiAqL1xuQXV0aDAucHJvdG90eXBlLmdldERlbGVnYXRpb25Ub2tlbiA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICBpZiAoIW9wdGlvbnMuaWRfdG9rZW4gJiYgIW9wdGlvbnMucmVmcmVzaF90b2tlbiApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBtdXN0IHNlbmQgZWl0aGVyIGFuIGlkX3Rva2VuIG9yIGEgcmVmcmVzaF90b2tlbiB0byBnZXQgYSBkZWxlZ2F0aW9uIHRva2VuLicpO1xuICB9XG5cbiAgdmFyIHF1ZXJ5ID0geHRlbmQoe1xuICAgIGdyYW50X3R5cGU6ICd1cm46aWV0ZjpwYXJhbXM6b2F1dGg6Z3JhbnQtdHlwZTpqd3QtYmVhcmVyJyxcbiAgICBjbGllbnRfaWQ6ICB0aGlzLl9jbGllbnRJRCxcbiAgICB0YXJnZXQ6IG9wdGlvbnMudGFyZ2V0Q2xpZW50SWQgfHwgdGhpcy5fY2xpZW50SUQsXG4gICAgYXBpX3R5cGU6IG9wdGlvbnMuYXBpXG4gIH0sIG9wdGlvbnMpO1xuXG4gIGRlbGV0ZSBxdWVyeS5oYXNPd25Qcm9wZXJ0eTtcbiAgZGVsZXRlIHF1ZXJ5LnRhcmdldENsaWVudElkO1xuICBkZWxldGUgcXVlcnkuYXBpO1xuXG4gIHZhciBwcm90b2NvbCA9ICdodHRwczonO1xuICB2YXIgZG9tYWluID0gdGhpcy5fZG9tYWluO1xuICB2YXIgZW5kcG9pbnQgPSAnL2RlbGVnYXRpb24nO1xuICB2YXIgdXJsID0gam9pblVybChwcm90b2NvbCwgZG9tYWluLCBlbmRwb2ludCk7XG5cbiAgaWYgKHRoaXMuX3VzZUpTT05QKSB7XG4gICAgcmV0dXJuIGpzb25wKHVybCArICc/JyArIHFzLnN0cmluZ2lmeShxdWVyeSksIGpzb25wT3B0cywgZnVuY3Rpb24gKGVyciwgcmVzcCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cbiAgICAgIGlmKCdlcnJvcicgaW4gcmVzcCkge1xuICAgICAgICB2YXIgZXJyb3IgPSBuZXcgTG9naW5FcnJvcihyZXNwLnN0YXR1cywgcmVzcC5lcnJvcl9kZXNjcmlwdGlvbiB8fCByZXNwLmVycm9yKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3ApO1xuICAgIH0pO1xuICB9XG5cbiAgcmVxd2VzdCh7XG4gICAgdXJsOiAgICAgc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbikgPyBlbmRwb2ludCA6IHVybCxcbiAgICBtZXRob2Q6ICAncG9zdCcsXG4gICAgdHlwZTogICAgJ2pzb24nLFxuICAgIGRhdGE6ICAgIHF1ZXJ5LFxuICAgIGNyb3NzT3JpZ2luOiAhc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbiksXG4gICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3ApO1xuICAgIH0sXG4gICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNhbGxiYWNrKEpTT04ucGFyc2UoZXJyLnJlc3BvbnNlVGV4dCkpO1xuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgdmFyIGVyID0gZXJyO1xuICAgICAgICB2YXIgaXNBZmZlY3RlZElFVmVyc2lvbiA9IGlzSW50ZXJuZXRFeHBsb3JlcigpID09PSAxMCB8fCBpc0ludGVybmV0RXhwbG9yZXIoKSA9PT0gMTE7XG4gICAgICAgIHZhciB6ZXJvU3RhdHVzID0gKCFlci5zdGF0dXMgfHwgZXIuc3RhdHVzID09PSAwKTtcblxuICAgICAgICAvLyBSZXF1ZXN0IGZhaWxlZCBiZWNhdXNlIHdlIGFyZSBvZmZsaW5lLlxuICAgICAgICAvLyBTZWU6IGh0dHA6Ly9jYW5pdXNlLmNvbS8jc2VhcmNoPW5hdmlnYXRvci5vbkxpbmVcbiAgICAgICAgaWYgKHplcm9TdGF0dXMgJiYgIXdpbmRvdy5uYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICAgICAgZXIgPSB7fTtcbiAgICAgICAgICBlci5zdGF0dXMgPSAwO1xuICAgICAgICAgIGVyLnJlc3BvbnNlVGV4dCA9IHtcbiAgICAgICAgICAgIGNvZGU6ICdvZmZsaW5lJ1xuICAgICAgICAgIH07XG4gICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjMyMjk3MjMvaWUtMTAtMTEtY29ycy1zdGF0dXMtMFxuICAgICAgICAvLyBYWFggSUUxMCB3aGVuIGEgcmVxdWVzdCBmYWlscyBpbiBDT1JTIHJldHVybnMgc3RhdHVzIGNvZGUgMFxuICAgICAgICAvLyBYWFggVGhpcyBpcyBub3QgaGFuZGxlZCBieSBoYW5kbGVSZXF1ZXN0RXJyb3IgYXMgdGhlIGVycm9ycyBhcmUgZGlmZmVyZW50XG4gICAgICAgIH0gZWxzZSBpZiAoemVyb1N0YXR1cyAmJiBpc0FmZmVjdGVkSUVWZXJzaW9uKSB7XG4gICAgICAgICAgZXIgPSB7fTtcbiAgICAgICAgICBlci5zdGF0dXMgPSA0MDE7XG4gICAgICAgICAgZXIucmVzcG9uc2VUZXh0ID0ge1xuICAgICAgICAgICAgY29kZTogJ2ludmFsaWRfb3BlcmF0aW9uJ1xuICAgICAgICAgIH07XG4gICAgICAgIC8vIElmIG5vdCBJRTEwLzExIGFuZCBub3Qgb2ZmbGluZSBpdCBtZWFucyB0aGF0IEF1dGgwIGhvc3QgaXMgdW5yZWFjaGFibGU6XG4gICAgICAgIC8vIENvbm5lY3Rpb24gVGltZW91dCBvciBDb25uZWN0aW9uIFJlZnVzZWQuXG4gICAgICAgIH0gZWxzZSBpZiAoemVyb1N0YXR1cykge1xuICAgICAgICAgIGVyID0ge307XG4gICAgICAgICAgZXIuc3RhdHVzID0gMDtcbiAgICAgICAgICBlci5yZXNwb25zZVRleHQgPSB7XG4gICAgICAgICAgICBjb2RlOiAnY29ubmVjdGlvbl9yZWZ1c2VkX3RpbWVvdXQnXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlci5yZXNwb25zZVRleHQgPSBlcnI7XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2sobmV3IExvZ2luRXJyb3IoZXIuc3RhdHVzLCBlci5yZXNwb25zZVRleHQpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBGZXRjaGVzIGEgbmV3IGlkX3Rva2VuL2FjY2Vzc190b2tlbiBmcm9tIEF1dGgwXG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgYXV0aDAuc2lsZW50QXV0aGVudGljYXRpb24oe30sIGZ1bmN0aW9uKGVycm9yLCByZXN1bHQpIHtcbiAqICAgICAgICBpZiAoZXJyb3IpIHtcbiAqICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAqICAgICAgICB9XG4gKiAgICAgICAgLy8gcmVzdWx0LmlkX3Rva2VuXG4gKiAgICAgfSk7XG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgYXV0aDAuc2lsZW50QXV0aGVudGljYXRpb24oe2NhbGxiYWNrVXJsOiBcImh0dHBzOi8vc2l0ZS5jb20vc2lsZW50Q2FsbGJhY2tcIn0sIGZ1bmN0aW9uKGVycm9yLCByZXN1bHQpIHtcbiAqICAgICAgICBpZiAoZXJyb3IpIHtcbiAqICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAqICAgICAgICB9XG4gKiAgICAgICAgLy8gcmVzdWx0LmlkX3Rva2VuXG4gKiAgICAgfSk7XG4gKlxuICogQG1ldGhvZCBzaWxlbnRBdXRuZXRpY2F0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAqL1xuQXV0aDAucHJvdG90eXBlLnNpbGVudEF1dGhlbnRpY2F0aW9uID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHZhciB1c2VQb3N0TWVzc2FnZSA9IG9wdGlvbnMudXNlUG9zdE1lc3NhZ2UgfHwgZmFsc2U7XG5cbiAgZGVsZXRlIG9wdGlvbnMudXNlUG9zdE1lc3NhZ2U7XG5cbiAgb3B0aW9ucyA9IHh0ZW5kKG9wdGlvbnMsIHtwcm9tcHQ6J25vbmUnfSk7XG4gIHZhciBoYW5kbGVyID0gbmV3IFNpbGVudEF1dGhlbnRpY2F0aW9uSGFuZGxlcih0aGlzLCB0aGlzLl9idWlsZEF1dGhvcml6ZVVybChvcHRpb25zKSk7XG4gIGhhbmRsZXIubG9naW4oY2FsbGJhY2ssIHVzZVBvc3RNZXNzYWdlKTtcbn07XG5cbi8qKlxuICogVHJpZ2dlciBsb2dvdXQgcmVkaXJlY3Qgd2l0aFxuICogcGFyYW1zIGZyb20gYHF1ZXJ5YCBvYmplY3RcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICBhdXRoMC5sb2dvdXQoKTtcbiAqICAgICAvLyByZWRpcmVjdHMgdG8gLT4gJ2h0dHBzOi8veW91cmFwcC5hdXRoMC5jb20vbG9nb3V0J1xuICpcbiAqIEBleGFtcGxlXG4gKlxuICogICAgIGF1dGgwLmxvZ291dCh7cmV0dXJuVG86ICdodHRwOi8vbG9nb3V0J30pO1xuICogICAgIC8vIHJlZGlyZWN0cyB0byAtPiAnaHR0cHM6Ly95b3VyYXBwLmF1dGgwLmNvbS9sb2dvdXQ/cmV0dXJuVG89aHR0cDovL2xvZ291dCdcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICBhdXRoMC5sb2dvdXQobnVsbCwge3ZlcnNpb246ICd2Mid9KTtcbiAqICAgICAvLyByZWRpcmVjdHMgdG8gLT4gJ2h0dHBzOi8veW91cmFwcC5hdXRoMC5jb20vdjIvbG9nb3V0J1xuICpcbiAqIEBleGFtcGxlXG4gKlxuICogICAgIGF1dGgwLmxvZ291dCh7cmV0dXJuVG86ICdodHRwOi8vbG9nb3V0J30sIHt2ZXJzaW9uOiAyfSk7XG4gKiAgICAgLy8gcmVkaXJlY3RzIHRvIC0+ICdodHRwczovL3lvdXJhcHAuYXV0aDAuY29tL3YyL2xvZ291dD9yZXR1cm5Ubz1odHRwOi8vbG9nb3V0J1xuICpcbiAqIEBtZXRob2QgbG9nb3V0XG4gKiBAcGFyYW0ge09iamVjdH0gcXVlcnlcbiAqL1xuXG5BdXRoMC5wcm90b3R5cGUubG9nb3V0ID0gZnVuY3Rpb24gKHF1ZXJ5LCBvcHRpb25zKSB7XG4gIHZhciBwYXRoTmFtZSA9ICcvbG9nb3V0JztcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgaWYgKG9wdGlvbnMudmVyc2lvbiA9PSAndjInKSB7XG4gICAgcGF0aE5hbWUgPSAnL3YyJyArIHBhdGhOYW1lXG4gIH1cblxuICB2YXIgdXJsID0gam9pblVybCgnaHR0cHM6JywgdGhpcy5fZG9tYWluLCBwYXRoTmFtZSk7XG5cbiAgaWYgKHF1ZXJ5KSB7XG4gICAgdXJsICs9ICc/JyArIHFzLnN0cmluZ2lmeShxdWVyeSk7XG4gIH1cblxuICB0aGlzLl9yZWRpcmVjdCh1cmwpO1xufTtcblxuLyoqXG4gKiBHZXQgc2luZ2xlIHNpZ24gb24gRGF0YVxuICpcbiAqIEBleGFtcGxlXG4gKlxuICogICAgIGF1dGgwLmdldFNTT0RhdGEoZnVuY3Rpb24gKGVyciwgc3NvRGF0YSkge1xuICogICAgICAgaWYgKGVycikgcmV0dXJuIGNvbnNvbGUubG9nKGVyci5tZXNzYWdlKTtcbiAqICAgICAgIGV4cGVjdChzc29EYXRhLnNzbykudG8uZXhpc3Q7XG4gKiAgICAgfSk7XG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgYXV0aDAuZ2V0U1NPRGF0YShmYWxzZSwgZm4pO1xuICpcbiAqIEBtZXRob2QgZ2V0U1NPRGF0YVxuICogQHBhcmFtIHtCb29sZWFufSB3aXRoQWN0aXZlRGlyZWN0b3JpZXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gKi9cblxuQXV0aDAucHJvdG90eXBlLmdldFNTT0RhdGEgPSBmdW5jdGlvbiAod2l0aEFjdGl2ZURpcmVjdG9yaWVzLCBjYikge1xuICBpZiAodHlwZW9mIHdpdGhBY3RpdmVEaXJlY3RvcmllcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNiID0gd2l0aEFjdGl2ZURpcmVjdG9yaWVzO1xuICAgIHdpdGhBY3RpdmVEaXJlY3RvcmllcyA9IGZhbHNlO1xuICB9XG5cbiAgdmFyIG5vUmVzdWx0ID0ge3NzbzogZmFsc2V9O1xuXG4gIGlmICh0aGlzLl91c2VKU09OUCkge1xuICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcihcIlRoZSBTU08gZGF0YSBjYW4ndCBiZSBvYnRhaW5lZCB1c2luZyBKU09OUFwiKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYihlcnJvciwgbm9SZXN1bHQpIH0sIDApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBwcm90b2NvbCA9ICdodHRwczonO1xuICB2YXIgZG9tYWluID0gdGhpcy5fZG9tYWluO1xuICB2YXIgZW5kcG9pbnQgPSAnL3VzZXIvc3NvZGF0YSc7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcbiAgdmFyIHNhbWVPcmlnaW4gPSBzYW1lX29yaWdpbihwcm90b2NvbCwgZG9tYWluKTtcbiAgdmFyIGRhdGEgPSB7fTtcblxuICBpZiAod2l0aEFjdGl2ZURpcmVjdG9yaWVzKSB7XG4gICAgZGF0YSA9IHtsZGFwczogMSwgY2xpZW50X2lkOiB0aGlzLl9jbGllbnRJRH07XG4gIH1cblxuICByZXR1cm4gcmVxd2VzdCh7XG4gICAgdXJsOiAgICAgICAgICAgICBzYW1lT3JpZ2luID8gZW5kcG9pbnQgOiB1cmwsXG4gICAgbWV0aG9kOiAgICAgICAgICAnZ2V0JyxcbiAgICB0eXBlOiAgICAgICAgICAgICdqc29uJyxcbiAgICBkYXRhOiAgICAgICAgICAgIGRhdGEsXG4gICAgY3Jvc3NPcmlnaW46ICAgICAhc2FtZU9yaWdpbixcbiAgICB3aXRoQ3JlZGVudGlhbHM6ICFzYW1lT3JpZ2luLFxuICAgIHRpbWVvdXQ6ICAgICAgICAgMzAwMFxuICB9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcihcIlRoZXJlIHdhcyBhbiBlcnJvciBpbiB0aGUgcmVxdWVzdCB0aGF0IG9idGFpbnMgdGhlIHVzZXIncyBTU08gZGF0YS5cIik7XG4gICAgZXJyb3IuY2F1c2UgPSBlcnI7XG4gICAgY2IoZXJyb3IsIG5vUmVzdWx0KTtcbiAgfSkudGhlbihmdW5jdGlvbihyZXNwKSB7XG4gICAgY2IobnVsbCwgcmVzcCk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBHZXQgYWxsIGNvbmZpZ3VyZWQgY29ubmVjdGlvbnMgZm9yIGEgY2xpZW50XG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgYXV0aDAuZ2V0Q29ubmVjdGlvbnMoZnVuY3Rpb24gKGVyciwgY29ubnMpIHtcbiAqICAgICAgIGlmIChlcnIpIHJldHVybiBjb25zb2xlLmxvZyhlcnIubWVzc2FnZSk7XG4gKiAgICAgICBleHBlY3QoY29ubnMubGVuZ3RoKS50by5iZS5hYm92ZSgwKTtcbiAqICAgICAgIGV4cGVjdChjb25uc1swXS5uYW1lKS50by5lcWwoJ0FwcHJlbmRhLmNvbScpO1xuICogICAgICAgZXhwZWN0KGNvbm5zWzBdLnN0cmF0ZWd5KS50by5lcWwoJ2FkZnMnKTtcbiAqICAgICAgIGV4cGVjdChjb25uc1swXS5zdGF0dXMpLnRvLmVxbChmYWxzZSk7XG4gKiAgICAgICBleHBlY3QoY29ubnNbMF0uZG9tYWluKS50by5lcWwoJ0FwcHJlbmRhLmNvbScpO1xuICogICAgICAgZXhwZWN0KGNvbm5zWzBdLmRvbWFpbl9hbGlhc2VzKS50by5lcWwoWydBcHByZW5kYS5jb20nLCAnZm9vLmNvbScsICdiYXIuY29tJ10pO1xuICogICAgIH0pO1xuICpcbiAqIEBtZXRob2QgZ2V0Q29ubmVjdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKi9cbi8vIFhYWCBXZSBtYXkgY2hhbmdlIHRoZSB3YXkgdGhpcyBtZXRob2Qgd29ya3MgaW4gdGhlIGZ1dHVyZSB0byB1c2UgY2xpZW50J3MgczMgZmlsZS5cblxuQXV0aDAucHJvdG90eXBlLmdldENvbm5lY3Rpb25zID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIHJldHVybiBqc29ucCgnaHR0cHM6Ly8nICsgdGhpcy5fZG9tYWluICsgJy9wdWJsaWMvYXBpLycgKyB0aGlzLl9jbGllbnRJRCArICcvY29ubmVjdGlvbnMnLCBqc29ucE9wdHMsIGNhbGxiYWNrKTtcbn07XG5cbi8qKlxuICogU2VuZCBlbWFpbCBvciBTTVMgdG8gZG8gcGFzc3dvcmRsZXNzIGF1dGhlbnRpY2F0aW9uXG4gKlxuICogQGV4YW1wbGVcbiAqICAgICAvLyBUbyBzZW5kIGFuIGVtYWlsXG4gKiAgICAgYXV0aDAuc3RhcnRQYXNzd29yZGxlc3Moe2VtYWlsOiAnZm9vQGJhci5jb20nfSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XG4gKiAgICAgICBpZiAoZXJyKSByZXR1cm4gY29uc29sZS5sb2coZXJyLmVycm9yX2Rlc2NyaXB0aW9uKTtcbiAqICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gKiAgICAgfSk7XG4gKlxuICogQGV4YW1wbGVcbiAqICAgICAvLyBUbyBzZW5kIGEgU01TXG4gKiAgICAgYXV0aDAuc3RhcnRQYXNzd29yZGxlc3Moe3Bob25lTnVtYmVyOiAnKzE0MjUxMTEyMjIyJ30sIGZ1bmN0aW9uIChlcnIsIHJlc3VsdCkge1xuICogICAgICAgaWYgKGVycikgcmV0dXJuIGNvbnNvbGUubG9nKGVyci5lcnJvcl9kZXNjcmlwdGlvbik7XG4gKiAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICogICAgIH0pO1xuICpcbiAqIEBtZXRob2Qgc3RhcnRQYXNzd29yZGxlc3NcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5cbkF1dGgwLnByb3RvdHlwZS5zdGFydFBhc3N3b3JkbGVzcyA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYWxsYmFjaykge1xuICBpZiAoJ29iamVjdCcgIT09IHR5cGVvZiBvcHRpb25zKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbiBvcHRpb25zIG9iamVjdCBpcyByZXF1aXJlZCcpO1xuICB9XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgY2FsbGJhY2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgY2FsbGJhY2sgZnVuY3Rpb24gaXMgcmVxdWlyZWQnKTtcbiAgfVxuICBpZiAoIW9wdGlvbnMuZW1haWwgJiYgIW9wdGlvbnMucGhvbmVOdW1iZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FuIGBlbWFpbGAgb3IgYSBgcGhvbmVOdW1iZXJgIGlzIHJlcXVpcmVkLicpO1xuICB9XG5cbiAgdmFyIHByb3RvY29sID0gJ2h0dHBzOic7XG4gIHZhciBkb21haW4gPSB0aGlzLl9kb21haW47XG4gIHZhciBlbmRwb2ludCA9ICcvcGFzc3dvcmRsZXNzL3N0YXJ0JztcbiAgdmFyIHVybCA9IGpvaW5VcmwocHJvdG9jb2wsIGRvbWFpbiwgZW5kcG9pbnQpO1xuXG4gIHZhciBkYXRhID0ge2NsaWVudF9pZDogdGhpcy5fY2xpZW50SUR9O1xuICBpZiAob3B0aW9ucy5lbWFpbCkge1xuICAgIGRhdGEuZW1haWwgPSBvcHRpb25zLmVtYWlsO1xuICAgIGRhdGEuY29ubmVjdGlvbiA9ICdlbWFpbCc7XG4gICAgaWYgKG9wdGlvbnMuYXV0aFBhcmFtcykge1xuICAgICAgZGF0YS5hdXRoUGFyYW1zID0gb3B0aW9ucy5hdXRoUGFyYW1zO1xuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy5zZW5kIHx8IG9wdGlvbnMuc2VuZCA9PT0gXCJsaW5rXCIpIHtcbiAgICAgIGlmICghZGF0YS5hdXRoUGFyYW1zKSB7XG4gICAgICAgIGRhdGEuYXV0aFBhcmFtcyA9IHt9O1xuICAgICAgfVxuXG4gICAgICBkYXRhLmF1dGhQYXJhbXMucmVkaXJlY3RfdXJpID0gb3B0aW9ucy5jYWxsYmFja1VSTCB8fCB0aGlzLl9jYWxsYmFja1VSTDtcbiAgICAgIGRhdGEuYXV0aFBhcmFtcy5yZXNwb25zZV90eXBlID0gdGhpcy5fZ2V0UmVzcG9uc2VUeXBlKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNlbmQpIHtcbiAgICAgIGRhdGEuc2VuZCA9IG9wdGlvbnMuc2VuZDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZGF0YS5waG9uZV9udW1iZXIgPSBvcHRpb25zLnBob25lTnVtYmVyO1xuICAgIGRhdGEuY29ubmVjdGlvbiA9ICdzbXMnO1xuICB9XG5cbiAgaWYgKHRoaXMuX3VzZUpTT05QKSB7XG4gICAgaWYgKHRoaXMuX3NlbmRDbGllbnRJbmZvKSB7XG4gICAgICBkYXRhWydhdXRoMENsaWVudCddID0gdGhpcy5fZ2V0Q2xpZW50SW5mb1N0cmluZygpO1xuICAgIH1cblxuICAgIHJldHVybiBqc29ucCh1cmwgKyAnPycgKyBxcy5zdHJpbmdpZnkoZGF0YSksIGpzb25wT3B0cywgZnVuY3Rpb24gKGVyciwgcmVzcCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKDAgKyAnOiAnICsgZXJyLnRvU3RyaW5nKCkpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNwLnN0YXR1cyA9PT0gMjAwID8gY2FsbGJhY2sobnVsbCwgdHJ1ZSkgOiBjYWxsYmFjayhyZXNwLmVyciB8fCByZXNwLmVycm9yKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiByZXF3ZXN0KHtcbiAgICB1cmw6ICAgICAgICAgIHNhbWVfb3JpZ2luKHByb3RvY29sLCBkb21haW4pID8gZW5kcG9pbnQgOiB1cmwsXG4gICAgbWV0aG9kOiAgICAgICAncG9zdCcsXG4gICAgdHlwZTogICAgICAgICAnanNvbicsXG4gICAgaGVhZGVyczogICAgICB0aGlzLl9nZXRDbGllbnRJbmZvSGVhZGVyKCksXG4gICAgY3Jvc3NPcmlnaW46ICAhc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbiksXG4gICAgZGF0YTogICAgICAgICBkYXRhXG4gIH0pXG4gIC5mYWlsKGZ1bmN0aW9uIChlcnIpIHtcbiAgICB0cnkge1xuICAgICAgY2FsbGJhY2soSlNPTi5wYXJzZShlcnIucmVzcG9uc2VUZXh0KSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKGVyci5zdGF0dXMgKyAnKCcgKyBlcnIuc3RhdHVzVGV4dCArICcpOiAnICsgZXJyLnJlc3BvbnNlVGV4dCk7XG4gICAgICBlcnJvci5zdGF0dXNDb2RlID0gZXJyLnN0YXR1cztcbiAgICAgIGVycm9yLmVycm9yID0gZXJyLnN0YXR1c1RleHQ7XG4gICAgICBlcnJvci5tZXNzYWdlID0gZXJyLnJlc3BvbnNlVGV4dDtcbiAgICAgIGNhbGxiYWNrKGVycm9yKTtcbiAgICB9XG4gIH0pXG4gIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICB9KTtcbn07XG5cbkF1dGgwLnByb3RvdHlwZS5yZXF1ZXN0TWFnaWNMaW5rID0gZnVuY3Rpb24oYXR0cnMsIGNiKSB7XG4gIHJldHVybiB0aGlzLnN0YXJ0UGFzc3dvcmRsZXNzKGF0dHJzLCBjYik7XG59O1xuXG5BdXRoMC5wcm90b3R5cGUucmVxdWVzdEVtYWlsQ29kZSA9IGZ1bmN0aW9uKGF0dHJzLCBjYikge1xuICBhdHRycy5zZW5kID0gXCJjb2RlXCI7XG4gIHJldHVybiB0aGlzLnN0YXJ0UGFzc3dvcmRsZXNzKGF0dHJzLCBjYik7XG59O1xuXG5BdXRoMC5wcm90b3R5cGUudmVyaWZ5RW1haWxDb2RlID0gZnVuY3Rpb24oYXR0cnMsIGNiKSB7XG4gIGF0dHJzLnBhc3Njb2RlID0gYXR0cnMuY29kZTtcbiAgZGVsZXRlIGF0dHJzLmNvZGU7XG4gIHJldHVybiB0aGlzLmxvZ2luKGF0dHJzLCBjYik7XG59O1xuXG5BdXRoMC5wcm90b3R5cGUucmVxdWVzdFNNU0NvZGUgPSBmdW5jdGlvbihhdHRycywgY2IpIHtcbiAgcmV0dXJuIHRoaXMuc3RhcnRQYXNzd29yZGxlc3MoYXR0cnMsIGNiKTtcbn07XG5cbkF1dGgwLnByb3RvdHlwZS52ZXJpZnlTTVNDb2RlID0gZnVuY3Rpb24oYXR0cnMsIGNiKSB7XG4gIGF0dHJzLnBhc3Njb2RlID0gYXR0cnMuY29kZTtcbiAgZGVsZXRlIGF0dHJzLmNvZGU7XG4gIHJldHVybiB0aGlzLmxvZ2luKGF0dHJzLCBjYik7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIElTTyAzMTY2LTEgY29kZSBmb3IgdGhlIGNvdW50cnkgd2hlcmUgdGhlIHJlcXVlc3QgaXNcbiAqIG9yaWdpbmF0aW5nLlxuICpcbiAqIEZhaWxzIGlmIHRoZSByZXF1ZXN0IGhhcyB0byBiZSBtYWRlIHVzaW5nIEpTT05QLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbkF1dGgwLnByb3RvdHlwZS5nZXRVc2VyQ291bnRyeSA9IGZ1bmN0aW9uKGNiKSB7XG4gIHZhciBwcm90b2NvbCA9ICdodHRwczonO1xuICB2YXIgZG9tYWluID0gdGhpcy5fZG9tYWluO1xuICB2YXIgZW5kcG9pbnQgPSBcIi91c2VyL2dlb2xvYy9jb3VudHJ5XCI7XG4gIHZhciB1cmwgPSBqb2luVXJsKHByb3RvY29sLCBkb21haW4sIGVuZHBvaW50KTtcblxuICBpZiAodGhpcy5fdXNlSlNPTlApIHtcbiAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoXCJUaGUgdXNlcidzIGNvdW50cnkgY2FuJ3QgYmUgb2J0YWluZWQgdXNpbmcgSlNPTlBcIik7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2IoZXJyb3IpIH0sIDApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHJlcXdlc3Qoe1xuICAgIHVybDogc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbikgPyBlbmRwb2ludCA6IHVybCxcbiAgICBtZXRob2Q6IFwiZ2V0XCIsXG4gICAgdHlwZTogXCJqc29uXCIsXG4gICAgaGVhZGVyczogdGhpcy5fZ2V0Q2xpZW50SW5mb0hlYWRlcigpLFxuICAgIGNyb3NzT3JpZ2luOiAhc2FtZV9vcmlnaW4ocHJvdG9jb2wsIGRvbWFpbiksXG4gICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcCkge1xuICAgICAgY2IobnVsbCwgcmVzcC5jb3VudHJ5X2NvZGUpXG4gICAgfSxcbiAgICBlcnJvcjogZnVuY3Rpb24oZXJyKSB7XG4gICAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IoXCJUaGVyZSB3YXMgYW4gZXJyb3IgaW4gdGhlIHJlcXVlc3QgdGhhdCBvYnRhaW5zIHRoZSB1c2VyJ3MgY291bnRyeVwiKTtcbiAgICAgIGVycm9yLmNhdXNlID0gZXJyO1xuICAgICAgY2IoZXJyb3IpO1xuICAgIH1cbiAgfSk7XG59XG5cbkF1dGgwLnByb3RvdHlwZS5fcHJlcGFyZVJlc3VsdCA9IGZ1bmN0aW9uKHJlc3VsdCkge1xuICBpZiAoIXJlc3VsdCB8fCB0eXBlb2YgcmVzdWx0ICE9PSBcIm9iamVjdFwiKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGRlY29kZWRJZFRva2VuID0gcmVzdWx0LmlkX3Rva2VuID8gdGhpcy5kZWNvZGVKd3QocmVzdWx0LmlkX3Rva2VuKSA6IHVuZGVmaW5lZDtcblxuICByZXR1cm4ge1xuICAgIGFjY2Vzc1Rva2VuOiByZXN1bHQuYWNjZXNzX3Rva2VuLFxuICAgIGlkVG9rZW46IHJlc3VsdC5pZF90b2tlbixcbiAgICBpZFRva2VuUGF5bG9hZDogcmVzdWx0LnByb2ZpbGUgfHwgZGVjb2RlZElkVG9rZW4sXG4gICAgcmVmcmVzaFRva2VuOiByZXN1bHQucmVmcmVzaF90b2tlbixcbiAgICBzdGF0ZTogcmVzdWx0LnN0YXRlXG4gIH07XG59XG5cbkF1dGgwLnByb3RvdHlwZS5fcGFyc2VSZXNwb25zZVR5cGUgPSBmdW5jdGlvbihvcHRzLCBzZXRGbGFncykge1xuICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcblxuICBpZiAoc2V0RmxhZ3NcbiAgICAgICAmJiAhdGhpcy5fcHJvdmlkZWRSZXNwb25zZU9wdGlvbnNcbiAgICAgICAmJiBvcHRzLmhhc093blByb3BlcnR5KFwiY2FsbGJhY2tPbkxvY2F0aW9uSGFzaFwiKSkge1xuICAgIHRoaXMuX3Byb3ZpZGVkQ2FsbGJhY2tPbkxvY2F0aW9uSGFzaCA9IHRydWU7XG4gIH1cblxuICBpZiAoc2V0RmxhZ3NcbiAgICAgICAmJiAhdGhpcy5fcHJvdmlkZWRDYWxsYmFja09uTG9jYXRpb25IYXNoXG4gICAgICAgJiYgb3B0cy5oYXNPd25Qcm9wZXJ0eShcInJlc3BvbnNlVHlwZVwiKSkge1xuICAgIHRoaXMuX3Byb3ZpZGVkUmVzcG9uc2VPcHRpb25zID0gdHJ1ZTtcbiAgfVxuXG4gIGlmICghdGhpcy5fcHJvdmlkZWRDYWxsYmFja09uTG9jYXRpb25IYXNoXG4gICAgICAgJiYgIXRoaXMuX3Byb3ZpZGVkUmVzcG9uc2VPcHRpb25zXG4gICAgICAgJiYgb3B0cy5oYXNPd25Qcm9wZXJ0eShcImNhbGxiYWNrT25Mb2NhdGlvbkhhc2hcIilcbiAgICAgICAmJiBvcHRzLmhhc093blByb3BlcnR5KFwicmVzcG9uc2VUeXBlXCIpKSB7XG4gICAgd2FybihcIlRoZSByZXNwb25zZVR5cGUgb3B0aW9uIHdpbGwgYmUgaWdub3JlZC4gQm90aCBjYWxsYmFja09uTG9jYXRpb25IYXNoIGFuZCByZXNwb25zZVR5cGUgb3B0aW9ucyB3ZXJlIHByb3ZpZGVkIGFuZCB0aGV5IGNhbid0IGJlIHVzZWQgdG9nZXRoZXIuXCIpO1xuICB9XG5cbiAgaWYgKHRoaXMuX3Byb3ZpZGVkQ2FsbGJhY2tPbkxvY2F0aW9uSGFzaFxuICAgICAgICYmIG9wdHMuaGFzT3duUHJvcGVydHkoXCJyZXNwb25zZVR5cGVcIikpIHtcbiAgICB3YXJuKFwiVGhlIHJlc3BvbnNlVHlwZSBvcHRpb24gd2lsbCBiZSBpZ25vcmVkLiBUaGUgY2FsbGJhY2tPbkxvY2F0aW9uSGFzaCBvcHRpb24gd2FzIHByb3ZpZGVkIHRvIHRoZSBjb25zdHJ1Y3RvciBhbmQgdGhleSBjYW4ndCBiZSBtaXhlZC5cIik7XG4gIH1cblxuICBpZiAodGhpcy5fcHJvdmlkZWRSZXNwb25zZU9wdGlvbnNcbiAgICAgICAmJiBvcHRzLmhhc093blByb3BlcnR5KFwiY2FsbGJhY2tPbkxvY2F0aW9uSGFzaFwiKSkge1xuICAgIHdhcm4oXCJUaGUgY2FsbGJhY2tPbkxvY2F0aW9uSGFzaCBvcHRpb24gd2lsbCBiZSBpZ25vcmVkLiBUaGUgcmVzcG9uc2VUeXBlIG9wdGlvbiB3YXMgcHJvdmlkZWQgdG8gdGhlIGNvbnN0cnVjdG9yIGFuZCB0aGV5IGNhbid0IGJlIG1peGVkLlwiKTtcbiAgfVxuXG4gIGlmICghdGhpcy5fcHJvdmlkZWRDYWxsYmFja09uTG9jYXRpb25IYXNoXG4gICAgICAgJiYgIW9wdHMuaGFzT3duUHJvcGVydHkoXCJjYWxsYmFja09uTG9jYXRpb25IYXNoXCIpXG4gICAgICAgJiYgb3B0cy5yZXNwb25zZVR5cGVcbiAgICAgICAmJiAhdmFsaWRSZXNwb25zZVR5cGUob3B0cy5yZXNwb25zZVR5cGUpKSB7XG4gICAgd2FybihcIlRoZSByZXNwb25zZVR5cGUgb3B0aW9uIHdpbGwgYmUgaWdub3JlZC4gSXRzIHZhbGlkIHZhbHVlcyBhcmUgXFxcImNvZGVcXFwiLCBcXFwiaWRfdG9rZW5cXFwiLCBcXFwidG9rZW5cXFwiIG9yIGFueSBjb21iaW5hdGlvbiBvZiB0aGVtLlwiKTtcbiAgfVxuXG4gIHZhciByZXN1bHQgPSB1bmRlZmluZWQ7XG5cbiAgaWYgKCF0aGlzLl9wcm92aWRlZFJlc3BvbnNlT3B0aW9uc1xuICAgICAgICYmIG51bGwgIT0gb3B0cy5jYWxsYmFja09uTG9jYXRpb25IYXNoKSB7XG4gICAgcmVzdWx0ID0gY2FsbGJhY2tPbkxvY2F0aW9uSGFzaFRvUmVzcG9uc2VUeXBlKG9wdHMuY2FsbGJhY2tPbkxvY2F0aW9uSGFzaCk7XG4gIH1cblxuICBpZiAoIXRoaXMuX3Byb3ZpZGVkQ2FsbGJhY2tPbkxvY2F0aW9uSGFzaFxuICAgICAgICYmICFvcHRzLmhhc093blByb3BlcnR5KFwiY2FsbGJhY2tPbkxvY2F0aW9uSGFzaFwiKVxuICAgICAgICYmIG9wdHMucmVzcG9uc2VUeXBlXG4gICAgICAgJiYgdmFsaWRSZXNwb25zZVR5cGUob3B0cy5yZXNwb25zZVR5cGUpKSB7XG4gICAgcmVzdWx0ID0gb3B0cy5yZXNwb25zZVR5cGU7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5BdXRoMC5wcm90b3R5cGUuX3BhcnNlUmVzcG9uc2VNb2RlID0gZnVuY3Rpb24ob3B0cywgc2V0RmxhZ3MpIHtcbiAgaWYgKCFvcHRzKSBvcHRzID0ge307XG5cbiAgaWYgKHNldEZsYWdzXG4gICAgICAgJiYgIXRoaXMuX3Byb3ZpZGVkQ2FsbGJhY2tPbkxvY2F0aW9uSGFzaFxuICAgICAgICYmIG9wdHMuaGFzT3duUHJvcGVydHkoXCJyZXNwb25zZU1vZGVcIikpIHtcbiAgICB0aGlzLl9wcm92aWRlZFJlc3BvbnNlT3B0aW9ucyA9IHRydWU7XG4gIH1cblxuICBpZiAodGhpcy5fcHJvdmlkZWRDYWxsYmFja09uTG9jYXRpb25IYXNoXG4gICAgICAgJiYgb3B0cy5oYXNPd25Qcm9wZXJ0eShcInJlc3BvbnNlTW9kZVwiKSkge1xuICAgIHdhcm4oXCJUaGUgcmVzcG9uc2VNb2RlIG9wdGlvbiB3aWxsIGJlIGlnbm9yZWQuIFRoZSBjYWxsYmFja09uTG9jYXRpb25IYXNoIG9wdGlvbiB3YXMgcHJvdmlkZWQgdG8gdGhlIGNvbnN0cnVjdG9yIGFuZCB0aGV5IGNhbid0IGJlIG1peGVkLlwiKTtcbiAgfVxuXG4gIGlmICghdGhpcy5fcHJvdmlkZWRDYWxsYmFja09uTG9jYXRpb25IYXNoXG4gICAgICAgJiYgIXRoaXMuX3Byb3ZpZGVkUmVzcG9uc2VPcHRpb25zXG4gICAgICAgJiYgb3B0cy5oYXNPd25Qcm9wZXJ0eShcImNhbGxiYWNrT25Mb2NhdGlvbkhhc2hcIilcbiAgICAgICAmJiBvcHRzLmhhc093blByb3BlcnR5KFwicmVzcG9uc2VNb2RlXCIpKSB7XG4gICAgd2FybihcIlRoZSByZXNwb25zZU1vZGUgb3B0aW9uIHdpbGwgYmUgaWdub3JlZC4gQm90aCBjYWxsYmFja09uTG9jYXRpb25IYXNoIGFuZCByZXNwb25zZU1vZGUgb3B0aW9ucyB3ZXJlIHByb3ZpZGVkIGFuZCB0aGV5IGNhbid0IGJlIHVzZWQgdG9nZXRoZXIuXCIpO1xuICB9XG5cbiAgdmFyIHJlc3VsdCA9IHVuZGVmaW5lZDtcblxuICBpZiAoIXRoaXMuX3Byb3ZpZGVkQ2FsbGJhY2tPbkxvY2F0aW9uSGFzaFxuICAgICAgICYmIG9wdHMucmVzcG9uc2VNb2RlXG4gICAgICAgJiYgIXZhbGlkUmVzcG9uc2VNb2RlKG9wdHMucmVzcG9uc2VNb2RlKSkge1xuICAgIHdhcm4oXCJUaGUgcmVzcG9uc2VNb2RlIG9wdGlvbiB3aWxsIGJlIGlnbm9yZWQuIEl0cyBvbmx5IHZhbGlkIHZhbHVlIGlzIFxcXCJmb3JtX3Bvc3RcXFwiLlwiKTtcbiAgfVxuXG4gIGlmICghdGhpcy5fcHJvdmlkZWRDYWxsYmFja09uTG9jYXRpb25IYXNoXG4gICAgICAgJiYgdmFsaWRSZXNwb25zZU1vZGUob3B0cy5yZXNwb25zZU1vZGUpKSB7XG4gICAgcmVzdWx0ID0gb3B0cy5yZXNwb25zZU1vZGU7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjYWxsYmFja09uTG9jYXRpb25IYXNoVG9SZXNwb25zZVR5cGUoeCkge1xuICByZXR1cm4geCA/IFwidG9rZW5cIiA6IFwiY29kZVwiO1xufVxuXG5mdW5jdGlvbiB2YWxpZFJlc3BvbnNlVHlwZShzdHIpIHtcbiAgaWYgKHR5cGVvZiBzdHIgIT09IFwic3RyaW5nXCIpIHJldHVybiBmYWxzZTtcblxuICB2YXIgUkVTUE9OU0VfVFlQRVMgPSBbXCJjb2RlXCIsIFwiaWRfdG9rZW5cIiwgXCJ0b2tlblwiXTtcbiAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KFwiIFwiKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKFJFU1BPTlNFX1RZUEVTLmluZGV4T2YocGFydHNbaV0pID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmxlbmd0aCA+PSAxO1xufVxuXG5mdW5jdGlvbiB2YWxpZFJlc3BvbnNlTW9kZShzdHIpIHtcbiAgcmV0dXJuIHN0ciA9PT0gXCJmb3JtX3Bvc3RcIjtcbn1cblxuXG5mdW5jdGlvbiB3YXJuKHN0cikge1xuICBpZiAoY29uc29sZSAmJiBjb25zb2xlLndhcm4pIHtcbiAgICBjb25zb2xlLndhcm4oc3RyKTtcbiAgfVxufVxuXG4vKipcbiAqIEV4cG9zZSBgQXV0aDBgIGNvbnN0cnVjdG9yXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBBdXRoMDtcbiIsInZhciBJZnJhbWVIYW5kbGVyID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgdGhpcy5hdXRoMCA9IG9wdGlvbnMuYXV0aDA7XG4gIHRoaXMudXJsID0gb3B0aW9ucy51cmw7XG4gIHRoaXMuY2FsbGJhY2sgPSBvcHRpb25zLmNhbGxiYWNrO1xuICB0aGlzLnRpbWVvdXQgPSBvcHRpb25zLnRpbWVvdXQgfHwgNjAgKiAxMDAwO1xuICB0aGlzLnRpbWVvdXRDYWxsYmFjayA9IG9wdGlvbnMudGltZW91dENhbGxiYWNrIHx8IG51bGw7XG4gIHRoaXMudXNlUG9zdE1lc3NhZ2UgPSBvcHRpb25zLnVzZVBvc3RNZXNzYWdlIHx8IGZhbHNlO1xuICB0aGlzLmlmcmFtZSA9IG51bGw7XG4gIHRoaXMudGltZW91dEhhbmRsZSA9IG51bGw7XG4gIHRoaXMuX2Rlc3Ryb3lUaW1lb3V0ID0gbnVsbDtcbiAgdGhpcy50cmFuc2llbnRNZXNzYWdlRXZlbnRMaXN0ZW5lciA9IG51bGw7XG4gIHRoaXMudHJhbnNpZW50RXZlbnRMaXN0ZW5lciA9IG51bGw7XG59XG5cbklmcmFtZUhhbmRsZXIucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAodXJsKSB7XG4gIHRoaXMuaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gIHRoaXMuaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgdGhpcy5pZnJhbWUuc3JjID0gdGhpcy51cmw7XG5cbiAgdmFyIF90aGlzID0gdGhpczsgXG5cbiAgaWYgKHRoaXMudXNlUG9zdE1lc3NhZ2UpIHtcblxuICAgIC8vIFdvcmthcm91bmQgdG8gYXZvaWQgdXNpbmcgYmluZCB0aGF0IGRvZXMgbm90IHdvcmsgaW4gSUU4XG4gICAgdGhpcy50cmFuc2llbnRNZXNzYWdlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIF90aGlzLm1lc3NhZ2VFdmVudExpc3RlbmVyKGUpO1xuICAgIH07XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgdGhpcy50cmFuc2llbnRNZXNzYWdlRXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xuICB9IFxuICBlbHNlIHtcblxuICAgIC8vIFdvcmthcm91bmQgdG8gYXZvaWQgdXNpbmcgYmluZCB0aGF0IGRvZXMgbm90IHdvcmsgaW4gSUU4XG4gICAgdGhpcy50cmFuc2llbnRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5sb2FkRXZlbnRMaXN0ZW5lcigpO1xuICAgIH07XG5cbiAgICB0aGlzLmlmcmFtZS5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCB0aGlzLnRyYW5zaWVudEV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbiAgfVxuXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5pZnJhbWUpO1xuXG4gIHRoaXMudGltZW91dEhhbmRsZSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgX3RoaXMudGltZW91dEhhbmRsZXIoKTtcbiAgfSwgdGhpcy50aW1lb3V0KTtcbn1cblxuSWZyYW1lSGFuZGxlci5wcm90b3R5cGUubWVzc2FnZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAoZSkgeyBcbiAgdGhpcy5jYWxsYmFja0hhbmRsZXIoZS5kYXRhKTtcblxuICB0aGlzLmRlc3Ryb3koKVxufVxuXG5JZnJhbWVIYW5kbGVyLnByb3RvdHlwZS5sb2FkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICgpIHsgXG4gIHZhciByZXN1bHQgPSB0aGlzLmF1dGgwLnBhcnNlSGFzaCh0aGlzLmlmcmFtZS5jb250ZW50V2luZG93LmxvY2F0aW9uLmhhc2gpO1xuXG4gIGlmICghcmVzdWx0KSByZXR1cm47XG5cbiAgdGhpcy5jYWxsYmFja0hhbmRsZXIocmVzdWx0KTtcbiAgXG4gIHRoaXMuZGVzdHJveSgpO1xufVxuXG5JZnJhbWVIYW5kbGVyLnByb3RvdHlwZS5jYWxsYmFja0hhbmRsZXIgPSBmdW5jdGlvbiAocmVzdWx0KSB7XG4gIHZhciBlcnJvciA9IG51bGw7XG5cbiAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgIGVycm9yID0gcmVzdWx0O1xuICAgIHJlc3VsdCA9IG51bGw7XG4gIH1cblxuICB0aGlzLmNhbGxiYWNrKGVycm9yLCByZXN1bHQpO1xufVxuXG5JZnJhbWVIYW5kbGVyLnByb3RvdHlwZS50aW1lb3V0SGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMudGltZW91dENhbGxiYWNrKSB7XG4gICAgdGhpcy50aW1lb3V0Q2FsbGJhY2soKTtcbiAgfVxuICB0aGlzLmRlc3Ryb3koKTtcbn1cbklmcmFtZUhhbmRsZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgaWYgKHRoaXMudGltZW91dEhhbmRsZSkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRIYW5kbGUpO1xuICB9XG5cbiAgdGhpcy5fZGVzdHJveVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoX3RoaXMudXNlUG9zdE1lc3NhZ2UpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBfdGhpcy50cmFuc2llbnRNZXNzYWdlRXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIF90aGlzLmlmcmFtZS5yZW1vdmVFdmVudExpc3RlbmVyKFwibG9hZFwiLCBfdGhpcy50cmFuc2llbnRFdmVudExpc3RlbmVyLCBmYWxzZSk7XG4gICAgfVxuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoX3RoaXMuaWZyYW1lKVxuICB9LCAwKTtcbn0gXG5cblxubW9kdWxlLmV4cG9ydHMgPSBJZnJhbWVIYW5kbGVyOyIsIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIganNvbl9wYXJzZSA9IHJlcXVpcmUoJy4vanNvbi1wYXJzZScpO1xuXG4vKipcbiAqIEV4cG9zZSBgTG9naW5FcnJvcmBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IExvZ2luRXJyb3I7XG5cbi8qKlxuICogQ3JlYXRlIGEgYExvZ2luRXJyb3JgIGJ5IGV4dGVuZCBvZiBgRXJyb3JgXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHN0YXR1c1xuICogQHBhcmFtIHtTdHJpbmd9IGRldGFpbHNcbiAqIEBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBMb2dpbkVycm9yKHN0YXR1cywgZGV0YWlscykge1xuICB2YXIgb2JqO1xuXG4gIGlmICh0eXBlb2YgZGV0YWlscyA9PSAnc3RyaW5nJykge1xuICAgIHRyeSB7XG4gICAgICBvYmogPSBqc29uX3BhcnNlKGRldGFpbHMpO1xuICAgIH0gY2F0Y2ggKGVyKSB7XG4gICAgICBvYmogPSB7IG1lc3NhZ2U6IGRldGFpbHMgfTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgb2JqID0gZGV0YWlscyB8fCB7IGRlc2NyaXB0aW9uOiAnc2VydmVyIGVycm9yJyB9O1xuICB9XG5cbiAgaWYgKCFvYmouY29kZSkge1xuICAgIG9iai5jb2RlID0gb2JqLmVycm9yO1xuICB9XG5cbiAgaWYgKCd1bmF1dGhvcml6ZWQnID09PSBvYmouY29kZSkge1xuICAgIHN0YXR1cyA9IDQwMTtcbiAgfVxuXG4gIHZhciBtZXNzYWdlID0gb2JqLmRlc2NyaXB0aW9uIHx8IG9iai5tZXNzYWdlIHx8IG9iai5lcnJvcjtcblxuICBpZiAoJ1Bhc3N3b3JkU3RyZW5ndGhFcnJvcicgPT09IG9iai5uYW1lKSB7XG4gICAgbWVzc2FnZSA9IFwiUGFzc3dvcmQgaXMgbm90IHN0cm9uZyBlbm91Z2guXCI7XG4gIH1cblxuICB2YXIgZXJyID0gRXJyb3IuY2FsbCh0aGlzLCBtZXNzYWdlKTtcblxuICBlcnIuc3RhdHVzID0gc3RhdHVzO1xuICBlcnIubmFtZSA9IG9iai5jb2RlO1xuICBlcnIuY29kZSA9IG9iai5jb2RlO1xuICBlcnIuZGV0YWlscyA9IG9iajtcblxuICBpZiAoc3RhdHVzID09PSAwKSB7XG4gICAgaWYgKCFlcnIuY29kZSB8fCBlcnIuY29kZSAhPT0gJ29mZmxpbmUnKSB7XG4gICAgICBlcnIuY29kZSA9ICdVbmtub3duJztcbiAgICAgIGVyci5tZXNzYWdlID0gJ1Vua25vd24gZXJyb3IuJztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZXJyO1xufVxuXG4vKipcbiAqIEV4dGVuZCBgTG9naW5FcnJvci5wcm90b3R5cGVgIHdpdGggYEVycm9yLnByb3RvdHlwZWBcbiAqIGFuZCBgTG9naW5FcnJvcmAgYXMgY29uc3RydWN0b3JcbiAqL1xuXG5pZiAoT2JqZWN0ICYmIE9iamVjdC5jcmVhdGUpIHtcbiAgTG9naW5FcnJvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSwge1xuICAgIGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBMb2dpbkVycm9yIH1cbiAgfSk7XG59XG4iLCJ2YXIgSWZyYW1lSGFuZGxlciA9IHJlcXVpcmUoJy4vSWZyYW1lSGFuZGxlcicpO1xuXG52YXIgU2lsZW50QXV0aGVudGljYXRpb25IYW5kbGVyID0gZnVuY3Rpb24gKGF1dGgwLCBhdXRoZW50aWNhdGlvblVybCwgdGltZW91dCkge1xuICBcbiAgdGhpcy5hdXRoMCA9IGF1dGgwO1xuICB0aGlzLmF1dGhlbnRpY2F0aW9uVXJsID0gYXV0aGVudGljYXRpb25Vcmw7XG4gIHRoaXMudGltZW91dCA9IHRpbWVvdXQgfHwgNjAgKiAxMDAwO1xuICB0aGlzLmhhbmRsZXIgPSBudWxsO1xuXG59XG5cblNpbGVudEF1dGhlbnRpY2F0aW9uSGFuZGxlci5wcm90b3R5cGUudGltZW91dENhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuXG4gIGNvbnNvbGUuZXJyb3IoJ1RpbWVvdXQgZHVyaW5nIHNpbGVudCBhdXRoZW50aWNhdGlvbi4nKVxuXG59XG5cblNpbGVudEF1dGhlbnRpY2F0aW9uSGFuZGxlci5wcm90b3R5cGUubG9naW4gPSBmdW5jdGlvbiAoY2FsbGJhY2ssIHVzZVBvc3RNZXNzYWdlKSB7XG5cbiAgdGhpcy5oYW5kbGVyID0gbmV3IElmcmFtZUhhbmRsZXIoe1xuICAgIGF1dGgwOnRoaXMuYXV0aDAsXG4gICAgdXJsOiB0aGlzLmF1dGhlbnRpY2F0aW9uVXJsLCBcbiAgICBjYWxsYmFjazogY2FsbGJhY2ssIFxuICAgIHRpbWVvdXQ6IHRoaXMudGltZW91dCwgXG4gICAgdGltZW91dENhbGxiYWNrOiB0aGlzLnRpbWVvdXRDYWxsYmFjayxcbiAgICB1c2VQb3N0TWVzc2FnZTogdXNlUG9zdE1lc3NhZ2UgfHwgZmFsc2VcbiAgfSk7XG5cbiAgdGhpcy5oYW5kbGVyLmluaXQoKTtcblxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gU2lsZW50QXV0aGVudGljYXRpb25IYW5kbGVyOyIsIi8qKlxuICogRXhwb3NlIGByZXF1aXJlZGBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmVkO1xuXG4vKipcbiAqIEFzc2VydCBgcHJvcGAgYXMgcmVxdWlyZW1lbnQgb2YgYG9iamBcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge3Byb3B9IHByb3BcbiAqIEBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiByZXF1aXJlZCAob2JqLCBwcm9wKSB7XG4gIGlmICghb2JqW3Byb3BdKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHByb3AgKyAnIGlzIHJlcXVpcmVkLicpO1xuICB9XG59XG4iLCIvKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIEJhc2U2NCA9IHJlcXVpcmUoJ0Jhc2U2NCcpO1xuXG4vKipcbiAqIEV4cG9zZSBgYmFzZTY0X3VybF9kZWNvZGVgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGVuY29kZTogZW5jb2RlLFxuICBkZWNvZGU6IGRlY29kZVxufTtcblxuLyoqXG4gKiBFbmNvZGUgYSBgYmFzZTY0YCBgZW5jb2RlVVJJQ29tcG9uZW50YCBzdHJpbmdcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5jb2RlKHN0cikge1xuICByZXR1cm4gQmFzZTY0LmJ0b2Eoc3RyKVxuICAgICAgLnJlcGxhY2UoL1xcKy9nLCAnLScpIC8vIENvbnZlcnQgJysnIHRvICctJ1xuICAgICAgLnJlcGxhY2UoL1xcLy9nLCAnXycpIC8vIENvbnZlcnQgJy8nIHRvICdfJ1xuICAgICAgLnJlcGxhY2UoLz0rJC8sICcnKTsgLy8gUmVtb3ZlIGVuZGluZyAnPSdcbn1cblxuLyoqXG4gKiBEZWNvZGUgYSBgYmFzZTY0YCBgZW5jb2RlVVJJQ29tcG9uZW50YCBzdHJpbmdcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVjb2RlKHN0cikge1xuICAvLyBBZGQgcmVtb3ZlZCBhdCBlbmQgJz0nXG4gIHN0ciArPSBBcnJheSg1IC0gc3RyLmxlbmd0aCAlIDQpLmpvaW4oJz0nKTtcblxuICBzdHIgPSBzdHJcbiAgICAucmVwbGFjZSgvXFwtL2csICcrJykgLy8gQ29udmVydCAnLScgdG8gJysnXG4gICAgLnJlcGxhY2UoL1xcXy9nLCAnLycpOyAvLyBDb252ZXJ0ICdfJyB0byAnLydcblxuICByZXR1cm4gQmFzZTY0LmF0b2Ioc3RyKTtcbn0iLCIvKipcbiAqIFJlc29sdmUgYGlzQXJyYXlgIGFzIG5hdGl2ZSBvciBmYWxsYmFja1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2ZcbiAgPyBuYXRpdmVJbmRleE9mXG4gIDogcG9seWZpbGxJbmRleE9mO1xuXG5cbmZ1bmN0aW9uIG5hdGl2ZUluZGV4T2YoYXJyYXksIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuICByZXR1cm4gYXJyYXkuaW5kZXhPZihzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpO1xufVxuXG5cbmZ1bmN0aW9uIHBvbHlmaWxsSW5kZXhPZihhcnJheSwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XG4gIC8vIFByb2R1Y3Rpb24gc3RlcHMgb2YgRUNNQS0yNjIsIEVkaXRpb24gNSwgMTUuNC40LjE0XG4gIC8vIFJlZmVyZW5jZTogaHR0cDovL2VzNS5naXRodWIuaW8vI3gxNS40LjQuMTRcblxuICB2YXIgaztcblxuICAvLyAxLiBMZXQgTyBiZSB0aGUgcmVzdWx0IG9mIGNhbGxpbmcgVG9PYmplY3QgcGFzc2luZ1xuICAvLyAgICB0aGUgYXJyYXkgdmFsdWUgYXMgdGhlIGFyZ3VtZW50LlxuICBpZiAoYXJyYXkgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYXJyYXlcIiBpcyBudWxsIG9yIG5vdCBkZWZpbmVkJyk7XG4gIH1cblxuICB2YXIgTyA9IE9iamVjdChhcnJheSk7XG5cbiAgLy8gMi4gTGV0IGxlblZhbHVlIGJlIHRoZSByZXN1bHQgb2YgY2FsbGluZyB0aGUgR2V0XG4gIC8vICAgIGludGVybmFsIG1ldGhvZCBvZiBPIHdpdGggdGhlIGFyZ3VtZW50IFwibGVuZ3RoXCIuXG4gIC8vIDMuIExldCBsZW4gYmUgVG9VaW50MzIobGVuVmFsdWUpLlxuICB2YXIgbGVuID0gTy5sZW5ndGggPj4+IDA7XG5cbiAgLy8gNC4gSWYgbGVuIGlzIDAsIHJldHVybiAtMS5cbiAgaWYgKGxlbiA9PT0gMCkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gIC8vIDUuIElmIGFyZ3VtZW50IGZyb21JbmRleCB3YXMgcGFzc2VkIGxldCBuIGJlXG4gIC8vICAgIFRvSW50ZWdlcihmcm9tSW5kZXgpOyBlbHNlIGxldCBuIGJlIDAuXG4gIHZhciBuID0gK2Zyb21JbmRleCB8fCAwO1xuXG4gIGlmIChNYXRoLmFicyhuKSA9PT0gSW5maW5pdHkpIHtcbiAgICBuID0gMDtcbiAgfVxuXG4gIC8vIDYuIElmIG4gPj0gbGVuLCByZXR1cm4gLTEuXG4gIGlmIChuID49IGxlbikge1xuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gIC8vIDcuIElmIG4gPj0gMCwgdGhlbiBMZXQgayBiZSBuLlxuICAvLyA4LiBFbHNlLCBuPDAsIExldCBrIGJlIGxlbiAtIGFicyhuKS5cbiAgLy8gICAgSWYgayBpcyBsZXNzIHRoYW4gMCwgdGhlbiBsZXQgayBiZSAwLlxuICBrID0gTWF0aC5tYXgobiA+PSAwID8gbiA6IGxlbiAtIE1hdGguYWJzKG4pLCAwKTtcblxuICAvLyA5LiBSZXBlYXQsIHdoaWxlIGsgPCBsZW5cbiAgd2hpbGUgKGsgPCBsZW4pIHtcbiAgICAvLyBhLiBMZXQgUGsgYmUgVG9TdHJpbmcoaykuXG4gICAgLy8gICBUaGlzIGlzIGltcGxpY2l0IGZvciBMSFMgb3BlcmFuZHMgb2YgdGhlIGluIG9wZXJhdG9yXG4gICAgLy8gYi4gTGV0IGtQcmVzZW50IGJlIHRoZSByZXN1bHQgb2YgY2FsbGluZyB0aGVcbiAgICAvLyAgICBIYXNQcm9wZXJ0eSBpbnRlcm5hbCBtZXRob2Qgb2YgTyB3aXRoIGFyZ3VtZW50IFBrLlxuICAgIC8vICAgVGhpcyBzdGVwIGNhbiBiZSBjb21iaW5lZCB3aXRoIGNcbiAgICAvLyBjLiBJZiBrUHJlc2VudCBpcyB0cnVlLCB0aGVuXG4gICAgLy8gICAgaS4gIExldCBlbGVtZW50SyBiZSB0aGUgcmVzdWx0IG9mIGNhbGxpbmcgdGhlIEdldFxuICAgIC8vICAgICAgICBpbnRlcm5hbCBtZXRob2Qgb2YgTyB3aXRoIHRoZSBhcmd1bWVudCBUb1N0cmluZyhrKS5cbiAgICAvLyAgIGlpLiAgTGV0IHNhbWUgYmUgdGhlIHJlc3VsdCBvZiBhcHBseWluZyB0aGVcbiAgICAvLyAgICAgICAgU3RyaWN0IEVxdWFsaXR5IENvbXBhcmlzb24gQWxnb3JpdGhtIHRvXG4gICAgLy8gICAgICAgIHNlYXJjaEVsZW1lbnQgYW5kIGVsZW1lbnRLLlxuICAgIC8vICBpaWkuICBJZiBzYW1lIGlzIHRydWUsIHJldHVybiBrLlxuICAgIGlmIChrIGluIE8gJiYgT1trXSA9PT0gc2VhcmNoRWxlbWVudCkge1xuICAgICAgcmV0dXJuIGs7XG4gICAgfVxuICAgIGsrKztcbiAgfVxuICByZXR1cm4gLTE7XG59O1xuIiwiLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKlxuICogUmVzb2x2ZSBgaXNBcnJheWAgYXMgbmF0aXZlIG9yIGZhbGxiYWNrXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBudWxsICE9IEFycmF5LmlzQXJyYXlcbiAgPyBBcnJheS5pc0FycmF5XG4gIDogaXNBcnJheTtcblxuLyoqXG4gKiBXcmFwIGBBcnJheS5pc0FycmF5YCBQb2x5ZmlsbCBmb3IgSUU5XG4gKiBzb3VyY2U6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2lzQXJyYXlcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheVxuICogQHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGlzQXJyYXkgKGFycmF5KSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKGFycmF5KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIvKipcbiAqIEV4cG9zZSBgSlNPTi5wYXJzZWAgbWV0aG9kIG9yIGZhbGxiYWNrIGlmIG5vdFxuICogZXhpc3RzIG9uIGB3aW5kb3dgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSAndW5kZWZpbmVkJyA9PT0gdHlwZW9mIEpTT05cbiAgPyByZXF1aXJlKCdqc29uLWZhbGxiYWNrJykucGFyc2VcbiAgOiBKU09OLnBhcnNlO1xuIiwiZnVuY3Rpb24gcmFuZG9tU3RyaW5nKGxlbmd0aCkge1xuICAgIHZhciBieXRlcyA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gICAgdmFyIGNyeXB0b09iaiA9IHdpbmRvdy5jcnlwdG8gfHwgd2luZG93Lm1zQ3J5cHRvO1xuXG4gICAgaWYgKCFjcnlwdG9PYmopIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciByYW5kb20gPSBjcnlwdG9PYmouZ2V0UmFuZG9tVmFsdWVzKGJ5dGVzKTtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgdmFyIGNoYXJzZXQgPSAnMDEyMzQ1Njc4OUFCQ0RFRkdISUpLTE1OT1BRUlNUVVZYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ei0uX34nO1xuICAgIHJhbmRvbS5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGNoYXJzZXRbYyAlIGNoYXJzZXQubGVuZ3RoXSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdC5qb2luKCcnKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHJhbmRvbVN0cmluZzogcmFuZG9tU3RyaW5nXG59OyIsIi8qKlxuICogQ2hlY2sgZm9yIHNhbWUgb3JpZ2luIHBvbGljeVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gc2FtZV9vcmlnaW47XG5cbmZ1bmN0aW9uIHNhbWVfb3JpZ2luICh0cHJvdG9jb2wsIHRkb21haW4sIHRwb3J0KSB7XG4gIHZhciBwcm90b2NvbCA9IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbDtcbiAgdmFyIGRvbWFpbiA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZTtcbiAgdmFyIHBvcnQgPSB3aW5kb3cubG9jYXRpb24ucG9ydDtcblxuICB0cG9ydCA9IHRwb3J0IHx8ICcnO1xuICByZXR1cm4gcHJvdG9jb2wgPT09IHRwcm90b2NvbCAmJiBkb21haW4gPT09IHRkb21haW4gJiYgcG9ydCA9PT0gdHBvcnQ7XG59XG4iLCIvKipcbiAqIEV4cG9zZSBgdXNlX2pzb25wYFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gdXNlX2pzb25wO1xuXG4vKipcbiAqIFJldHVybiB0cnVlIGlmIGBqc29ucGAgaXMgcmVxdWlyZWRcbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIHVzZV9qc29ucCgpIHtcbiAgdmFyIHhociA9IHdpbmRvdy5YTUxIdHRwUmVxdWVzdCA/IG5ldyBYTUxIdHRwUmVxdWVzdCgpIDogbnVsbDtcblxuICBpZiAoeGhyICYmICd3aXRoQ3JlZGVudGlhbHMnIGluIHhocikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFdlIG5vIGxvbmdlciBzdXBwb3J0IFhEb21haW5SZXF1ZXN0IGZvciBJRTggYW5kIElFOSBmb3IgQ09SUyBiZWNhdXNlIGl0IGhhcyBtYW55IHF1aXJrcy5cbiAgLy8gaWYgKCdYRG9tYWluUmVxdWVzdCcgaW4gd2luZG93ICYmIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2h0dHBzOicpIHtcbiAgLy8gICByZXR1cm4gZmFsc2U7XG4gIC8vIH1cblxuICByZXR1cm4gdHJ1ZTtcbn0iLCI7KGZ1bmN0aW9uICgpIHtcblxuICB2YXJcbiAgICBvYmplY3QgPSB0eXBlb2YgZXhwb3J0cyAhPSAndW5kZWZpbmVkJyA/IGV4cG9ydHMgOiB0aGlzLCAvLyAjODogd2ViIHdvcmtlcnNcbiAgICBjaGFycyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPScsXG4gICAgSU5WQUxJRF9DSEFSQUNURVJfRVJSID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIGZhYnJpY2F0ZSBhIHN1aXRhYmxlIGVycm9yIG9iamVjdFxuICAgICAgdHJ5IHsgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnJCcpOyB9XG4gICAgICBjYXRjaCAoZXJyb3IpIHsgcmV0dXJuIGVycm9yOyB9fSgpKTtcblxuICAvLyBlbmNvZGVyXG4gIC8vIFtodHRwczovL2dpc3QuZ2l0aHViLmNvbS85OTkxNjZdIGJ5IFtodHRwczovL2dpdGh1Yi5jb20vbmlnbmFnXVxuICBvYmplY3QuYnRvYSB8fCAoXG4gIG9iamVjdC5idG9hID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgZm9yIChcbiAgICAgIC8vIGluaXRpYWxpemUgcmVzdWx0IGFuZCBjb3VudGVyXG4gICAgICB2YXIgYmxvY2ssIGNoYXJDb2RlLCBpZHggPSAwLCBtYXAgPSBjaGFycywgb3V0cHV0ID0gJyc7XG4gICAgICAvLyBpZiB0aGUgbmV4dCBpbnB1dCBpbmRleCBkb2VzIG5vdCBleGlzdDpcbiAgICAgIC8vICAgY2hhbmdlIHRoZSBtYXBwaW5nIHRhYmxlIHRvIFwiPVwiXG4gICAgICAvLyAgIGNoZWNrIGlmIGQgaGFzIG5vIGZyYWN0aW9uYWwgZGlnaXRzXG4gICAgICBpbnB1dC5jaGFyQXQoaWR4IHwgMCkgfHwgKG1hcCA9ICc9JywgaWR4ICUgMSk7XG4gICAgICAvLyBcIjggLSBpZHggJSAxICogOFwiIGdlbmVyYXRlcyB0aGUgc2VxdWVuY2UgMiwgNCwgNiwgOFxuICAgICAgb3V0cHV0ICs9IG1hcC5jaGFyQXQoNjMgJiBibG9jayA+PiA4IC0gaWR4ICUgMSAqIDgpXG4gICAgKSB7XG4gICAgICBjaGFyQ29kZSA9IGlucHV0LmNoYXJDb2RlQXQoaWR4ICs9IDMvNCk7XG4gICAgICBpZiAoY2hhckNvZGUgPiAweEZGKSB0aHJvdyBJTlZBTElEX0NIQVJBQ1RFUl9FUlI7XG4gICAgICBibG9jayA9IGJsb2NrIDw8IDggfCBjaGFyQ29kZTtcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfSk7XG5cbiAgLy8gZGVjb2RlclxuICAvLyBbaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vMTAyMDM5Nl0gYnkgW2h0dHBzOi8vZ2l0aHViLmNvbS9hdGtdXG4gIG9iamVjdC5hdG9iIHx8IChcbiAgb2JqZWN0LmF0b2IgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoLz0rJC8sICcnKVxuICAgIGlmIChpbnB1dC5sZW5ndGggJSA0ID09IDEpIHRocm93IElOVkFMSURfQ0hBUkFDVEVSX0VSUjtcbiAgICBmb3IgKFxuICAgICAgLy8gaW5pdGlhbGl6ZSByZXN1bHQgYW5kIGNvdW50ZXJzXG4gICAgICB2YXIgYmMgPSAwLCBicywgYnVmZmVyLCBpZHggPSAwLCBvdXRwdXQgPSAnJztcbiAgICAgIC8vIGdldCBuZXh0IGNoYXJhY3RlclxuICAgICAgYnVmZmVyID0gaW5wdXQuY2hhckF0KGlkeCsrKTtcbiAgICAgIC8vIGNoYXJhY3RlciBmb3VuZCBpbiB0YWJsZT8gaW5pdGlhbGl6ZSBiaXQgc3RvcmFnZSBhbmQgYWRkIGl0cyBhc2NpaSB2YWx1ZTtcbiAgICAgIH5idWZmZXIgJiYgKGJzID0gYmMgJSA0ID8gYnMgKiA2NCArIGJ1ZmZlciA6IGJ1ZmZlcixcbiAgICAgICAgLy8gYW5kIGlmIG5vdCBmaXJzdCBvZiBlYWNoIDQgY2hhcmFjdGVycyxcbiAgICAgICAgLy8gY29udmVydCB0aGUgZmlyc3QgOCBiaXRzIHRvIG9uZSBhc2NpaSBjaGFyYWN0ZXJcbiAgICAgICAgYmMrKyAlIDQpID8gb3V0cHV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoMjU1ICYgYnMgPj4gKC0yICogYmMgJiA2KSkgOiAwXG4gICAgKSB7XG4gICAgICAvLyB0cnkgdG8gZmluZCBjaGFyYWN0ZXIgaW4gdGFibGUgKDAtNjMsIG5vdCBmb3VuZCA9PiAtMSlcbiAgICAgIGJ1ZmZlciA9IGNoYXJzLmluZGV4T2YoYnVmZmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfSk7XG5cbn0oKSk7XG4iLG51bGwsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIi8qXG4gICAganNvbjIuanNcbiAgICAyMDExLTEwLTE5XG5cbiAgICBQdWJsaWMgRG9tYWluLlxuXG4gICAgTk8gV0FSUkFOVFkgRVhQUkVTU0VEIE9SIElNUExJRUQuIFVTRSBBVCBZT1VSIE9XTiBSSVNLLlxuXG4gICAgU2VlIGh0dHA6Ly93d3cuSlNPTi5vcmcvanMuaHRtbFxuXG5cbiAgICBUaGlzIGNvZGUgc2hvdWxkIGJlIG1pbmlmaWVkIGJlZm9yZSBkZXBsb3ltZW50LlxuICAgIFNlZSBodHRwOi8vamF2YXNjcmlwdC5jcm9ja2ZvcmQuY29tL2pzbWluLmh0bWxcblxuICAgIFVTRSBZT1VSIE9XTiBDT1BZLiBJVCBJUyBFWFRSRU1FTFkgVU5XSVNFIFRPIExPQUQgQ09ERSBGUk9NIFNFUlZFUlMgWU9VIERPXG4gICAgTk9UIENPTlRST0wuXG5cblxuICAgIFRoaXMgZmlsZSBjcmVhdGVzIGEgZ2xvYmFsIEpTT04gb2JqZWN0IGNvbnRhaW5pbmcgdHdvIG1ldGhvZHM6IHN0cmluZ2lmeVxuICAgIGFuZCBwYXJzZS5cblxuICAgICAgICBKU09OLnN0cmluZ2lmeSh2YWx1ZSwgcmVwbGFjZXIsIHNwYWNlKVxuICAgICAgICAgICAgdmFsdWUgICAgICAgYW55IEphdmFTY3JpcHQgdmFsdWUsIHVzdWFsbHkgYW4gb2JqZWN0IG9yIGFycmF5LlxuXG4gICAgICAgICAgICByZXBsYWNlciAgICBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdGhhdCBkZXRlcm1pbmVzIGhvdyBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcyBhcmUgc3RyaW5naWZpZWQgZm9yIG9iamVjdHMuIEl0IGNhbiBiZSBhXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBvciBhbiBhcnJheSBvZiBzdHJpbmdzLlxuXG4gICAgICAgICAgICBzcGFjZSAgICAgICBhbiBvcHRpb25hbCBwYXJhbWV0ZXIgdGhhdCBzcGVjaWZpZXMgdGhlIGluZGVudGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBvZiBuZXN0ZWQgc3RydWN0dXJlcy4gSWYgaXQgaXMgb21pdHRlZCwgdGhlIHRleHQgd2lsbFxuICAgICAgICAgICAgICAgICAgICAgICAgYmUgcGFja2VkIHdpdGhvdXQgZXh0cmEgd2hpdGVzcGFjZS4gSWYgaXQgaXMgYSBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBpdCB3aWxsIHNwZWNpZnkgdGhlIG51bWJlciBvZiBzcGFjZXMgdG8gaW5kZW50IGF0IGVhY2hcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldmVsLiBJZiBpdCBpcyBhIHN0cmluZyAoc3VjaCBhcyAnXFx0JyBvciAnJm5ic3A7JyksXG4gICAgICAgICAgICAgICAgICAgICAgICBpdCBjb250YWlucyB0aGUgY2hhcmFjdGVycyB1c2VkIHRvIGluZGVudCBhdCBlYWNoIGxldmVsLlxuXG4gICAgICAgICAgICBUaGlzIG1ldGhvZCBwcm9kdWNlcyBhIEpTT04gdGV4dCBmcm9tIGEgSmF2YVNjcmlwdCB2YWx1ZS5cblxuICAgICAgICAgICAgV2hlbiBhbiBvYmplY3QgdmFsdWUgaXMgZm91bmQsIGlmIHRoZSBvYmplY3QgY29udGFpbnMgYSB0b0pTT05cbiAgICAgICAgICAgIG1ldGhvZCwgaXRzIHRvSlNPTiBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgYW5kIHRoZSByZXN1bHQgd2lsbCBiZVxuICAgICAgICAgICAgc3RyaW5naWZpZWQuIEEgdG9KU09OIG1ldGhvZCBkb2VzIG5vdCBzZXJpYWxpemU6IGl0IHJldHVybnMgdGhlXG4gICAgICAgICAgICB2YWx1ZSByZXByZXNlbnRlZCBieSB0aGUgbmFtZS92YWx1ZSBwYWlyIHRoYXQgc2hvdWxkIGJlIHNlcmlhbGl6ZWQsXG4gICAgICAgICAgICBvciB1bmRlZmluZWQgaWYgbm90aGluZyBzaG91bGQgYmUgc2VyaWFsaXplZC4gVGhlIHRvSlNPTiBtZXRob2RcbiAgICAgICAgICAgIHdpbGwgYmUgcGFzc2VkIHRoZSBrZXkgYXNzb2NpYXRlZCB3aXRoIHRoZSB2YWx1ZSwgYW5kIHRoaXMgd2lsbCBiZVxuICAgICAgICAgICAgYm91bmQgdG8gdGhlIHZhbHVlXG5cbiAgICAgICAgICAgIEZvciBleGFtcGxlLCB0aGlzIHdvdWxkIHNlcmlhbGl6ZSBEYXRlcyBhcyBJU08gc3RyaW5ncy5cblxuICAgICAgICAgICAgICAgIERhdGUucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZihuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3JtYXQgaW50ZWdlcnMgdG8gaGF2ZSBhdCBsZWFzdCB0d28gZGlnaXRzLlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4gOiBuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VVRDRnVsbFllYXIoKSAgICsgJy0nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDTW9udGgoKSArIDEpICsgJy0nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDRGF0ZSgpKSAgICAgICsgJ1QnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDSG91cnMoKSkgICAgICsgJzonICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDTWludXRlcygpKSAgICsgJzonICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDU2Vjb25kcygpKSAgICsgJ1onO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIFlvdSBjYW4gcHJvdmlkZSBhbiBvcHRpb25hbCByZXBsYWNlciBtZXRob2QuIEl0IHdpbGwgYmUgcGFzc2VkIHRoZVxuICAgICAgICAgICAga2V5IGFuZCB2YWx1ZSBvZiBlYWNoIG1lbWJlciwgd2l0aCB0aGlzIGJvdW5kIHRvIHRoZSBjb250YWluaW5nXG4gICAgICAgICAgICBvYmplY3QuIFRoZSB2YWx1ZSB0aGF0IGlzIHJldHVybmVkIGZyb20geW91ciBtZXRob2Qgd2lsbCBiZVxuICAgICAgICAgICAgc2VyaWFsaXplZC4gSWYgeW91ciBtZXRob2QgcmV0dXJucyB1bmRlZmluZWQsIHRoZW4gdGhlIG1lbWJlciB3aWxsXG4gICAgICAgICAgICBiZSBleGNsdWRlZCBmcm9tIHRoZSBzZXJpYWxpemF0aW9uLlxuXG4gICAgICAgICAgICBJZiB0aGUgcmVwbGFjZXIgcGFyYW1ldGVyIGlzIGFuIGFycmF5IG9mIHN0cmluZ3MsIHRoZW4gaXQgd2lsbCBiZVxuICAgICAgICAgICAgdXNlZCB0byBzZWxlY3QgdGhlIG1lbWJlcnMgdG8gYmUgc2VyaWFsaXplZC4gSXQgZmlsdGVycyB0aGUgcmVzdWx0c1xuICAgICAgICAgICAgc3VjaCB0aGF0IG9ubHkgbWVtYmVycyB3aXRoIGtleXMgbGlzdGVkIGluIHRoZSByZXBsYWNlciBhcnJheSBhcmVcbiAgICAgICAgICAgIHN0cmluZ2lmaWVkLlxuXG4gICAgICAgICAgICBWYWx1ZXMgdGhhdCBkbyBub3QgaGF2ZSBKU09OIHJlcHJlc2VudGF0aW9ucywgc3VjaCBhcyB1bmRlZmluZWQgb3JcbiAgICAgICAgICAgIGZ1bmN0aW9ucywgd2lsbCBub3QgYmUgc2VyaWFsaXplZC4gU3VjaCB2YWx1ZXMgaW4gb2JqZWN0cyB3aWxsIGJlXG4gICAgICAgICAgICBkcm9wcGVkOyBpbiBhcnJheXMgdGhleSB3aWxsIGJlIHJlcGxhY2VkIHdpdGggbnVsbC4gWW91IGNhbiB1c2VcbiAgICAgICAgICAgIGEgcmVwbGFjZXIgZnVuY3Rpb24gdG8gcmVwbGFjZSB0aG9zZSB3aXRoIEpTT04gdmFsdWVzLlxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkodW5kZWZpbmVkKSByZXR1cm5zIHVuZGVmaW5lZC5cblxuICAgICAgICAgICAgVGhlIG9wdGlvbmFsIHNwYWNlIHBhcmFtZXRlciBwcm9kdWNlcyBhIHN0cmluZ2lmaWNhdGlvbiBvZiB0aGVcbiAgICAgICAgICAgIHZhbHVlIHRoYXQgaXMgZmlsbGVkIHdpdGggbGluZSBicmVha3MgYW5kIGluZGVudGF0aW9uIHRvIG1ha2UgaXRcbiAgICAgICAgICAgIGVhc2llciB0byByZWFkLlxuXG4gICAgICAgICAgICBJZiB0aGUgc3BhY2UgcGFyYW1ldGVyIGlzIGEgbm9uLWVtcHR5IHN0cmluZywgdGhlbiB0aGF0IHN0cmluZyB3aWxsXG4gICAgICAgICAgICBiZSB1c2VkIGZvciBpbmRlbnRhdGlvbi4gSWYgdGhlIHNwYWNlIHBhcmFtZXRlciBpcyBhIG51bWJlciwgdGhlblxuICAgICAgICAgICAgdGhlIGluZGVudGF0aW9uIHdpbGwgYmUgdGhhdCBtYW55IHNwYWNlcy5cblxuICAgICAgICAgICAgRXhhbXBsZTpcblxuICAgICAgICAgICAgdGV4dCA9IEpTT04uc3RyaW5naWZ5KFsnZScsIHtwbHVyaWJ1czogJ3VudW0nfV0pO1xuICAgICAgICAgICAgLy8gdGV4dCBpcyAnW1wiZVwiLHtcInBsdXJpYnVzXCI6XCJ1bnVtXCJ9XSdcblxuXG4gICAgICAgICAgICB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkoWydlJywge3BsdXJpYnVzOiAndW51bSd9XSwgbnVsbCwgJ1xcdCcpO1xuICAgICAgICAgICAgLy8gdGV4dCBpcyAnW1xcblxcdFwiZVwiLFxcblxcdHtcXG5cXHRcXHRcInBsdXJpYnVzXCI6IFwidW51bVwiXFxuXFx0fVxcbl0nXG5cbiAgICAgICAgICAgIHRleHQgPSBKU09OLnN0cmluZ2lmeShbbmV3IERhdGUoKV0sIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNba2V5XSBpbnN0YW5jZW9mIERhdGUgP1xuICAgICAgICAgICAgICAgICAgICAnRGF0ZSgnICsgdGhpc1trZXldICsgJyknIDogdmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIHRleHQgaXMgJ1tcIkRhdGUoLS0tY3VycmVudCB0aW1lLS0tKVwiXSdcblxuXG4gICAgICAgIEpTT04ucGFyc2UodGV4dCwgcmV2aXZlcilcbiAgICAgICAgICAgIFRoaXMgbWV0aG9kIHBhcnNlcyBhIEpTT04gdGV4dCB0byBwcm9kdWNlIGFuIG9iamVjdCBvciBhcnJheS5cbiAgICAgICAgICAgIEl0IGNhbiB0aHJvdyBhIFN5bnRheEVycm9yIGV4Y2VwdGlvbi5cblxuICAgICAgICAgICAgVGhlIG9wdGlvbmFsIHJldml2ZXIgcGFyYW1ldGVyIGlzIGEgZnVuY3Rpb24gdGhhdCBjYW4gZmlsdGVyIGFuZFxuICAgICAgICAgICAgdHJhbnNmb3JtIHRoZSByZXN1bHRzLiBJdCByZWNlaXZlcyBlYWNoIG9mIHRoZSBrZXlzIGFuZCB2YWx1ZXMsXG4gICAgICAgICAgICBhbmQgaXRzIHJldHVybiB2YWx1ZSBpcyB1c2VkIGluc3RlYWQgb2YgdGhlIG9yaWdpbmFsIHZhbHVlLlxuICAgICAgICAgICAgSWYgaXQgcmV0dXJucyB3aGF0IGl0IHJlY2VpdmVkLCB0aGVuIHRoZSBzdHJ1Y3R1cmUgaXMgbm90IG1vZGlmaWVkLlxuICAgICAgICAgICAgSWYgaXQgcmV0dXJucyB1bmRlZmluZWQgdGhlbiB0aGUgbWVtYmVyIGlzIGRlbGV0ZWQuXG5cbiAgICAgICAgICAgIEV4YW1wbGU6XG5cbiAgICAgICAgICAgIC8vIFBhcnNlIHRoZSB0ZXh0LiBWYWx1ZXMgdGhhdCBsb29rIGxpa2UgSVNPIGRhdGUgc3RyaW5ncyB3aWxsXG4gICAgICAgICAgICAvLyBiZSBjb252ZXJ0ZWQgdG8gRGF0ZSBvYmplY3RzLlxuXG4gICAgICAgICAgICBteURhdGEgPSBKU09OLnBhcnNlKHRleHQsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGE7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgYSA9XG4vXihcXGR7NH0pLShcXGR7Mn0pLShcXGR7Mn0pVChcXGR7Mn0pOihcXGR7Mn0pOihcXGR7Mn0oPzpcXC5cXGQqKT8pWiQvLmV4ZWModmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKERhdGUuVVRDKCthWzFdLCArYVsyXSAtIDEsICthWzNdLCArYVs0XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArYVs1XSwgK2FbNl0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbXlEYXRhID0gSlNPTi5wYXJzZSgnW1wiRGF0ZSgwOS8wOS8yMDAxKVwiXScsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGQ7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlLnNsaWNlKDAsIDUpID09PSAnRGF0ZSgnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZS5zbGljZSgtMSkgPT09ICcpJykge1xuICAgICAgICAgICAgICAgICAgICBkID0gbmV3IERhdGUodmFsdWUuc2xpY2UoNSwgLTEpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICBUaGlzIGlzIGEgcmVmZXJlbmNlIGltcGxlbWVudGF0aW9uLiBZb3UgYXJlIGZyZWUgdG8gY29weSwgbW9kaWZ5LCBvclxuICAgIHJlZGlzdHJpYnV0ZS5cbiovXG5cbi8qanNsaW50IGV2aWw6IHRydWUsIHJlZ2V4cDogdHJ1ZSAqL1xuXG4vKm1lbWJlcnMgXCJcIiwgXCJcXGJcIiwgXCJcXHRcIiwgXCJcXG5cIiwgXCJcXGZcIiwgXCJcXHJcIiwgXCJcXFwiXCIsIEpTT04sIFwiXFxcXFwiLCBhcHBseSxcbiAgICBjYWxsLCBjaGFyQ29kZUF0LCBnZXRVVENEYXRlLCBnZXRVVENGdWxsWWVhciwgZ2V0VVRDSG91cnMsXG4gICAgZ2V0VVRDTWludXRlcywgZ2V0VVRDTW9udGgsIGdldFVUQ1NlY29uZHMsIGhhc093blByb3BlcnR5LCBqb2luLFxuICAgIGxhc3RJbmRleCwgbGVuZ3RoLCBwYXJzZSwgcHJvdG90eXBlLCBwdXNoLCByZXBsYWNlLCBzbGljZSwgc3RyaW5naWZ5LFxuICAgIHRlc3QsIHRvSlNPTiwgdG9TdHJpbmcsIHZhbHVlT2ZcbiovXG5cblxuLy8gQ3JlYXRlIGEgSlNPTiBvYmplY3Qgb25seSBpZiBvbmUgZG9lcyBub3QgYWxyZWFkeSBleGlzdC4gV2UgY3JlYXRlIHRoZVxuLy8gbWV0aG9kcyBpbiBhIGNsb3N1cmUgdG8gYXZvaWQgY3JlYXRpbmcgZ2xvYmFsIHZhcmlhYmxlcy5cblxudmFyIEpTT04gPSB7fTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBmdW5jdGlvbiBmKG4pIHtcbiAgICAgICAgLy8gRm9ybWF0IGludGVnZXJzIHRvIGhhdmUgYXQgbGVhc3QgdHdvIGRpZ2l0cy5cbiAgICAgICAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4gOiBuO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgRGF0ZS5wcm90b3R5cGUudG9KU09OICE9PSAnZnVuY3Rpb24nKSB7XG5cbiAgICAgICAgRGF0ZS5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKGtleSkge1xuXG4gICAgICAgICAgICByZXR1cm4gaXNGaW5pdGUodGhpcy52YWx1ZU9mKCkpXG4gICAgICAgICAgICAgICAgPyB0aGlzLmdldFVUQ0Z1bGxZZWFyKCkgICAgICsgJy0nICtcbiAgICAgICAgICAgICAgICAgICAgZih0aGlzLmdldFVUQ01vbnRoKCkgKyAxKSArICctJyArXG4gICAgICAgICAgICAgICAgICAgIGYodGhpcy5nZXRVVENEYXRlKCkpICAgICAgKyAnVCcgK1xuICAgICAgICAgICAgICAgICAgICBmKHRoaXMuZ2V0VVRDSG91cnMoKSkgICAgICsgJzonICtcbiAgICAgICAgICAgICAgICAgICAgZih0aGlzLmdldFVUQ01pbnV0ZXMoKSkgICArICc6JyArXG4gICAgICAgICAgICAgICAgICAgIGYodGhpcy5nZXRVVENTZWNvbmRzKCkpICAgKyAnWidcbiAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgIH07XG5cbiAgICAgICAgU3RyaW5nLnByb3RvdHlwZS50b0pTT04gICAgICA9XG4gICAgICAgICAgICBOdW1iZXIucHJvdG90eXBlLnRvSlNPTiAgPVxuICAgICAgICAgICAgQm9vbGVhbi5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKTtcbiAgICAgICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGN4ID0gL1tcXHUwMDAwXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csXG4gICAgICAgIGVzY2FwYWJsZSA9IC9bXFxcXFxcXCJcXHgwMC1cXHgxZlxceDdmLVxceDlmXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csXG4gICAgICAgIGdhcCxcbiAgICAgICAgaW5kZW50LFxuICAgICAgICBtZXRhID0geyAgICAvLyB0YWJsZSBvZiBjaGFyYWN0ZXIgc3Vic3RpdHV0aW9uc1xuICAgICAgICAgICAgJ1xcYic6ICdcXFxcYicsXG4gICAgICAgICAgICAnXFx0JzogJ1xcXFx0JyxcbiAgICAgICAgICAgICdcXG4nOiAnXFxcXG4nLFxuICAgICAgICAgICAgJ1xcZic6ICdcXFxcZicsXG4gICAgICAgICAgICAnXFxyJzogJ1xcXFxyJyxcbiAgICAgICAgICAgICdcIicgOiAnXFxcXFwiJyxcbiAgICAgICAgICAgICdcXFxcJzogJ1xcXFxcXFxcJ1xuICAgICAgICB9LFxuICAgICAgICByZXA7XG5cblxuICAgIGZ1bmN0aW9uIHF1b3RlKHN0cmluZykge1xuXG4vLyBJZiB0aGUgc3RyaW5nIGNvbnRhaW5zIG5vIGNvbnRyb2wgY2hhcmFjdGVycywgbm8gcXVvdGUgY2hhcmFjdGVycywgYW5kIG5vXG4vLyBiYWNrc2xhc2ggY2hhcmFjdGVycywgdGhlbiB3ZSBjYW4gc2FmZWx5IHNsYXAgc29tZSBxdW90ZXMgYXJvdW5kIGl0LlxuLy8gT3RoZXJ3aXNlIHdlIG11c3QgYWxzbyByZXBsYWNlIHRoZSBvZmZlbmRpbmcgY2hhcmFjdGVycyB3aXRoIHNhZmUgZXNjYXBlXG4vLyBzZXF1ZW5jZXMuXG5cbiAgICAgICAgZXNjYXBhYmxlLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIHJldHVybiBlc2NhcGFibGUudGVzdChzdHJpbmcpID8gJ1wiJyArIHN0cmluZy5yZXBsYWNlKGVzY2FwYWJsZSwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgIHZhciBjID0gbWV0YVthXTtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgYyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICA/IGNcbiAgICAgICAgICAgICAgICA6ICdcXFxcdScgKyAoJzAwMDAnICsgYS5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTQpO1xuICAgICAgICB9KSArICdcIicgOiAnXCInICsgc3RyaW5nICsgJ1wiJztcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIHN0cihrZXksIGhvbGRlcikge1xuXG4vLyBQcm9kdWNlIGEgc3RyaW5nIGZyb20gaG9sZGVyW2tleV0uXG5cbiAgICAgICAgdmFyIGksICAgICAgICAgIC8vIFRoZSBsb29wIGNvdW50ZXIuXG4gICAgICAgICAgICBrLCAgICAgICAgICAvLyBUaGUgbWVtYmVyIGtleS5cbiAgICAgICAgICAgIHYsICAgICAgICAgIC8vIFRoZSBtZW1iZXIgdmFsdWUuXG4gICAgICAgICAgICBsZW5ndGgsXG4gICAgICAgICAgICBtaW5kID0gZ2FwLFxuICAgICAgICAgICAgcGFydGlhbCxcbiAgICAgICAgICAgIHZhbHVlID0gaG9sZGVyW2tleV07XG5cbi8vIElmIHRoZSB2YWx1ZSBoYXMgYSB0b0pTT04gbWV0aG9kLCBjYWxsIGl0IHRvIG9idGFpbiBhIHJlcGxhY2VtZW50IHZhbHVlLlxuXG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICAgICAgdHlwZW9mIHZhbHVlLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b0pTT04oa2V5KTtcbiAgICAgICAgfVxuXG4vLyBJZiB3ZSB3ZXJlIGNhbGxlZCB3aXRoIGEgcmVwbGFjZXIgZnVuY3Rpb24sIHRoZW4gY2FsbCB0aGUgcmVwbGFjZXIgdG9cbi8vIG9idGFpbiBhIHJlcGxhY2VtZW50IHZhbHVlLlxuXG4gICAgICAgIGlmICh0eXBlb2YgcmVwID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHJlcC5jYWxsKGhvbGRlciwga2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cblxuLy8gV2hhdCBoYXBwZW5zIG5leHQgZGVwZW5kcyBvbiB0aGUgdmFsdWUncyB0eXBlLlxuXG4gICAgICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICByZXR1cm4gcXVvdGUodmFsdWUpO1xuXG4gICAgICAgIGNhc2UgJ251bWJlcic6XG5cbi8vIEpTT04gbnVtYmVycyBtdXN0IGJlIGZpbml0ZS4gRW5jb2RlIG5vbi1maW5pdGUgbnVtYmVycyBhcyBudWxsLlxuXG4gICAgICAgICAgICByZXR1cm4gaXNGaW5pdGUodmFsdWUpID8gU3RyaW5nKHZhbHVlKSA6ICdudWxsJztcblxuICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgY2FzZSAnbnVsbCc6XG5cbi8vIElmIHRoZSB2YWx1ZSBpcyBhIGJvb2xlYW4gb3IgbnVsbCwgY29udmVydCBpdCB0byBhIHN0cmluZy4gTm90ZTpcbi8vIHR5cGVvZiBudWxsIGRvZXMgbm90IHByb2R1Y2UgJ251bGwnLiBUaGUgY2FzZSBpcyBpbmNsdWRlZCBoZXJlIGluXG4vLyB0aGUgcmVtb3RlIGNoYW5jZSB0aGF0IHRoaXMgZ2V0cyBmaXhlZCBzb21lZGF5LlxuXG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcblxuLy8gSWYgdGhlIHR5cGUgaXMgJ29iamVjdCcsIHdlIG1pZ2h0IGJlIGRlYWxpbmcgd2l0aCBhbiBvYmplY3Qgb3IgYW4gYXJyYXkgb3Jcbi8vIG51bGwuXG5cbiAgICAgICAgY2FzZSAnb2JqZWN0JzpcblxuLy8gRHVlIHRvIGEgc3BlY2lmaWNhdGlvbiBibHVuZGVyIGluIEVDTUFTY3JpcHQsIHR5cGVvZiBudWxsIGlzICdvYmplY3QnLFxuLy8gc28gd2F0Y2ggb3V0IGZvciB0aGF0IGNhc2UuXG5cbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ251bGwnO1xuICAgICAgICAgICAgfVxuXG4vLyBNYWtlIGFuIGFycmF5IHRvIGhvbGQgdGhlIHBhcnRpYWwgcmVzdWx0cyBvZiBzdHJpbmdpZnlpbmcgdGhpcyBvYmplY3QgdmFsdWUuXG5cbiAgICAgICAgICAgIGdhcCArPSBpbmRlbnQ7XG4gICAgICAgICAgICBwYXJ0aWFsID0gW107XG5cbi8vIElzIHRoZSB2YWx1ZSBhbiBhcnJheT9cblxuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkodmFsdWUpID09PSAnW29iamVjdCBBcnJheV0nKSB7XG5cbi8vIFRoZSB2YWx1ZSBpcyBhbiBhcnJheS4gU3RyaW5naWZ5IGV2ZXJ5IGVsZW1lbnQuIFVzZSBudWxsIGFzIGEgcGxhY2Vob2xkZXJcbi8vIGZvciBub24tSlNPTiB2YWx1ZXMuXG5cbiAgICAgICAgICAgICAgICBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnRpYWxbaV0gPSBzdHIoaSwgdmFsdWUpIHx8ICdudWxsJztcbiAgICAgICAgICAgICAgICB9XG5cbi8vIEpvaW4gYWxsIG9mIHRoZSBlbGVtZW50cyB0b2dldGhlciwgc2VwYXJhdGVkIHdpdGggY29tbWFzLCBhbmQgd3JhcCB0aGVtIGluXG4vLyBicmFja2V0cy5cblxuICAgICAgICAgICAgICAgIHYgPSBwYXJ0aWFsLmxlbmd0aCA9PT0gMFxuICAgICAgICAgICAgICAgICAgICA/ICdbXSdcbiAgICAgICAgICAgICAgICAgICAgOiBnYXBcbiAgICAgICAgICAgICAgICAgICAgPyAnW1xcbicgKyBnYXAgKyBwYXJ0aWFsLmpvaW4oJyxcXG4nICsgZ2FwKSArICdcXG4nICsgbWluZCArICddJ1xuICAgICAgICAgICAgICAgICAgICA6ICdbJyArIHBhcnRpYWwuam9pbignLCcpICsgJ10nO1xuICAgICAgICAgICAgICAgIGdhcCA9IG1pbmQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgICAgICB9XG5cbi8vIElmIHRoZSByZXBsYWNlciBpcyBhbiBhcnJheSwgdXNlIGl0IHRvIHNlbGVjdCB0aGUgbWVtYmVycyB0byBiZSBzdHJpbmdpZmllZC5cblxuICAgICAgICAgICAgaWYgKHJlcCAmJiB0eXBlb2YgcmVwID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGxlbmd0aCA9IHJlcC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVwW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgayA9IHJlcFtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHYgPSBzdHIoaywgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0aWFsLnB1c2gocXVvdGUoaykgKyAoZ2FwID8gJzogJyA6ICc6JykgKyB2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbi8vIE90aGVyd2lzZSwgaXRlcmF0ZSB0aHJvdWdoIGFsbCBvZiB0aGUga2V5cyBpbiB0aGUgb2JqZWN0LlxuXG4gICAgICAgICAgICAgICAgZm9yIChrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGspKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gc3RyKGssIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFydGlhbC5wdXNoKHF1b3RlKGspICsgKGdhcCA/ICc6ICcgOiAnOicpICsgdik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbi8vIEpvaW4gYWxsIG9mIHRoZSBtZW1iZXIgdGV4dHMgdG9nZXRoZXIsIHNlcGFyYXRlZCB3aXRoIGNvbW1hcyxcbi8vIGFuZCB3cmFwIHRoZW0gaW4gYnJhY2VzLlxuXG4gICAgICAgICAgICB2ID0gcGFydGlhbC5sZW5ndGggPT09IDBcbiAgICAgICAgICAgICAgICA/ICd7fSdcbiAgICAgICAgICAgICAgICA6IGdhcFxuICAgICAgICAgICAgICAgID8gJ3tcXG4nICsgZ2FwICsgcGFydGlhbC5qb2luKCcsXFxuJyArIGdhcCkgKyAnXFxuJyArIG1pbmQgKyAnfSdcbiAgICAgICAgICAgICAgICA6ICd7JyArIHBhcnRpYWwuam9pbignLCcpICsgJ30nO1xuICAgICAgICAgICAgZ2FwID0gbWluZDtcbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9XG4gICAgfVxuXG4vLyBJZiB0aGUgSlNPTiBvYmplY3QgZG9lcyBub3QgeWV0IGhhdmUgYSBzdHJpbmdpZnkgbWV0aG9kLCBnaXZlIGl0IG9uZS5cblxuICAgIGlmICh0eXBlb2YgSlNPTi5zdHJpbmdpZnkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgSlNPTi5zdHJpbmdpZnkgPSBmdW5jdGlvbiAodmFsdWUsIHJlcGxhY2VyLCBzcGFjZSkge1xuXG4vLyBUaGUgc3RyaW5naWZ5IG1ldGhvZCB0YWtlcyBhIHZhbHVlIGFuZCBhbiBvcHRpb25hbCByZXBsYWNlciwgYW5kIGFuIG9wdGlvbmFsXG4vLyBzcGFjZSBwYXJhbWV0ZXIsIGFuZCByZXR1cm5zIGEgSlNPTiB0ZXh0LiBUaGUgcmVwbGFjZXIgY2FuIGJlIGEgZnVuY3Rpb25cbi8vIHRoYXQgY2FuIHJlcGxhY2UgdmFsdWVzLCBvciBhbiBhcnJheSBvZiBzdHJpbmdzIHRoYXQgd2lsbCBzZWxlY3QgdGhlIGtleXMuXG4vLyBBIGRlZmF1bHQgcmVwbGFjZXIgbWV0aG9kIGNhbiBiZSBwcm92aWRlZC4gVXNlIG9mIHRoZSBzcGFjZSBwYXJhbWV0ZXIgY2FuXG4vLyBwcm9kdWNlIHRleHQgdGhhdCBpcyBtb3JlIGVhc2lseSByZWFkYWJsZS5cblxuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICBnYXAgPSAnJztcbiAgICAgICAgICAgIGluZGVudCA9ICcnO1xuXG4vLyBJZiB0aGUgc3BhY2UgcGFyYW1ldGVyIGlzIGEgbnVtYmVyLCBtYWtlIGFuIGluZGVudCBzdHJpbmcgY29udGFpbmluZyB0aGF0XG4vLyBtYW55IHNwYWNlcy5cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzcGFjZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc3BhY2U7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBpbmRlbnQgKz0gJyAnO1xuICAgICAgICAgICAgICAgIH1cblxuLy8gSWYgdGhlIHNwYWNlIHBhcmFtZXRlciBpcyBhIHN0cmluZywgaXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBpbmRlbnQgc3RyaW5nLlxuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzcGFjZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpbmRlbnQgPSBzcGFjZTtcbiAgICAgICAgICAgIH1cblxuLy8gSWYgdGhlcmUgaXMgYSByZXBsYWNlciwgaXQgbXVzdCBiZSBhIGZ1bmN0aW9uIG9yIGFuIGFycmF5LlxuLy8gT3RoZXJ3aXNlLCB0aHJvdyBhbiBlcnJvci5cblxuICAgICAgICAgICAgcmVwID0gcmVwbGFjZXI7XG4gICAgICAgICAgICBpZiAocmVwbGFjZXIgJiYgdHlwZW9mIHJlcGxhY2VyICE9PSAnZnVuY3Rpb24nICYmXG4gICAgICAgICAgICAgICAgICAgICh0eXBlb2YgcmVwbGFjZXIgIT09ICdvYmplY3QnIHx8XG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiByZXBsYWNlci5sZW5ndGggIT09ICdudW1iZXInKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSlNPTi5zdHJpbmdpZnknKTtcbiAgICAgICAgICAgIH1cblxuLy8gTWFrZSBhIGZha2Ugcm9vdCBvYmplY3QgY29udGFpbmluZyBvdXIgdmFsdWUgdW5kZXIgdGhlIGtleSBvZiAnJy5cbi8vIFJldHVybiB0aGUgcmVzdWx0IG9mIHN0cmluZ2lmeWluZyB0aGUgdmFsdWUuXG5cbiAgICAgICAgICAgIHJldHVybiBzdHIoJycsIHsnJzogdmFsdWV9KTtcbiAgICAgICAgfTtcbiAgICB9XG5cblxuLy8gSWYgdGhlIEpTT04gb2JqZWN0IGRvZXMgbm90IHlldCBoYXZlIGEgcGFyc2UgbWV0aG9kLCBnaXZlIGl0IG9uZS5cblxuICAgIGlmICh0eXBlb2YgSlNPTi5wYXJzZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBKU09OLnBhcnNlID0gZnVuY3Rpb24gKHRleHQsIHJldml2ZXIpIHtcblxuLy8gVGhlIHBhcnNlIG1ldGhvZCB0YWtlcyBhIHRleHQgYW5kIGFuIG9wdGlvbmFsIHJldml2ZXIgZnVuY3Rpb24sIGFuZCByZXR1cm5zXG4vLyBhIEphdmFTY3JpcHQgdmFsdWUgaWYgdGhlIHRleHQgaXMgYSB2YWxpZCBKU09OIHRleHQuXG5cbiAgICAgICAgICAgIHZhciBqO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiB3YWxrKGhvbGRlciwga2V5KSB7XG5cbi8vIFRoZSB3YWxrIG1ldGhvZCBpcyB1c2VkIHRvIHJlY3Vyc2l2ZWx5IHdhbGsgdGhlIHJlc3VsdGluZyBzdHJ1Y3R1cmUgc29cbi8vIHRoYXQgbW9kaWZpY2F0aW9ucyBjYW4gYmUgbWFkZS5cblxuICAgICAgICAgICAgICAgIHZhciBrLCB2LCB2YWx1ZSA9IGhvbGRlcltrZXldO1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoayBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgaykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ID0gd2Fsayh2YWx1ZSwgayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtrXSA9IHY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHZhbHVlW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmV2aXZlci5jYWxsKGhvbGRlciwga2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG5cblxuLy8gUGFyc2luZyBoYXBwZW5zIGluIGZvdXIgc3RhZ2VzLiBJbiB0aGUgZmlyc3Qgc3RhZ2UsIHdlIHJlcGxhY2UgY2VydGFpblxuLy8gVW5pY29kZSBjaGFyYWN0ZXJzIHdpdGggZXNjYXBlIHNlcXVlbmNlcy4gSmF2YVNjcmlwdCBoYW5kbGVzIG1hbnkgY2hhcmFjdGVyc1xuLy8gaW5jb3JyZWN0bHksIGVpdGhlciBzaWxlbnRseSBkZWxldGluZyB0aGVtLCBvciB0cmVhdGluZyB0aGVtIGFzIGxpbmUgZW5kaW5ncy5cblxuICAgICAgICAgICAgdGV4dCA9IFN0cmluZyh0ZXh0KTtcbiAgICAgICAgICAgIGN4Lmxhc3RJbmRleCA9IDA7XG4gICAgICAgICAgICBpZiAoY3gudGVzdCh0ZXh0KSkge1xuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoY3gsIGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnXFxcXHUnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICgnMDAwMCcgKyBhLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbi8vIEluIHRoZSBzZWNvbmQgc3RhZ2UsIHdlIHJ1biB0aGUgdGV4dCBhZ2FpbnN0IHJlZ3VsYXIgZXhwcmVzc2lvbnMgdGhhdCBsb29rXG4vLyBmb3Igbm9uLUpTT04gcGF0dGVybnMuIFdlIGFyZSBlc3BlY2lhbGx5IGNvbmNlcm5lZCB3aXRoICcoKScgYW5kICduZXcnXG4vLyBiZWNhdXNlIHRoZXkgY2FuIGNhdXNlIGludm9jYXRpb24sIGFuZCAnPScgYmVjYXVzZSBpdCBjYW4gY2F1c2UgbXV0YXRpb24uXG4vLyBCdXQganVzdCB0byBiZSBzYWZlLCB3ZSB3YW50IHRvIHJlamVjdCBhbGwgdW5leHBlY3RlZCBmb3Jtcy5cblxuLy8gV2Ugc3BsaXQgdGhlIHNlY29uZCBzdGFnZSBpbnRvIDQgcmVnZXhwIG9wZXJhdGlvbnMgaW4gb3JkZXIgdG8gd29yayBhcm91bmRcbi8vIGNyaXBwbGluZyBpbmVmZmljaWVuY2llcyBpbiBJRSdzIGFuZCBTYWZhcmkncyByZWdleHAgZW5naW5lcy4gRmlyc3Qgd2Vcbi8vIHJlcGxhY2UgdGhlIEpTT04gYmFja3NsYXNoIHBhaXJzIHdpdGggJ0AnIChhIG5vbi1KU09OIGNoYXJhY3RlcikuIFNlY29uZCwgd2Vcbi8vIHJlcGxhY2UgYWxsIHNpbXBsZSB2YWx1ZSB0b2tlbnMgd2l0aCAnXScgY2hhcmFjdGVycy4gVGhpcmQsIHdlIGRlbGV0ZSBhbGxcbi8vIG9wZW4gYnJhY2tldHMgdGhhdCBmb2xsb3cgYSBjb2xvbiBvciBjb21tYSBvciB0aGF0IGJlZ2luIHRoZSB0ZXh0LiBGaW5hbGx5LFxuLy8gd2UgbG9vayB0byBzZWUgdGhhdCB0aGUgcmVtYWluaW5nIGNoYXJhY3RlcnMgYXJlIG9ubHkgd2hpdGVzcGFjZSBvciAnXScgb3Jcbi8vICcsJyBvciAnOicgb3IgJ3snIG9yICd9Jy4gSWYgdGhhdCBpcyBzbywgdGhlbiB0aGUgdGV4dCBpcyBzYWZlIGZvciBldmFsLlxuXG4gICAgICAgICAgICBpZiAoL15bXFxdLDp7fVxcc10qJC9cbiAgICAgICAgICAgICAgICAgICAgLnRlc3QodGV4dC5yZXBsYWNlKC9cXFxcKD86W1wiXFxcXFxcL2JmbnJ0XXx1WzAtOWEtZkEtRl17NH0pL2csICdAJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cIlteXCJcXFxcXFxuXFxyXSpcInx0cnVlfGZhbHNlfG51bGx8LT9cXGQrKD86XFwuXFxkKik/KD86W2VFXVsrXFwtXT9cXGQrKT8vZywgJ10nKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyg/Ol58OnwsKSg/OlxccypcXFspKy9nLCAnJykpKSB7XG5cbi8vIEluIHRoZSB0aGlyZCBzdGFnZSB3ZSB1c2UgdGhlIGV2YWwgZnVuY3Rpb24gdG8gY29tcGlsZSB0aGUgdGV4dCBpbnRvIGFcbi8vIEphdmFTY3JpcHQgc3RydWN0dXJlLiBUaGUgJ3snIG9wZXJhdG9yIGlzIHN1YmplY3QgdG8gYSBzeW50YWN0aWMgYW1iaWd1aXR5XG4vLyBpbiBKYXZhU2NyaXB0OiBpdCBjYW4gYmVnaW4gYSBibG9jayBvciBhbiBvYmplY3QgbGl0ZXJhbC4gV2Ugd3JhcCB0aGUgdGV4dFxuLy8gaW4gcGFyZW5zIHRvIGVsaW1pbmF0ZSB0aGUgYW1iaWd1aXR5LlxuXG4gICAgICAgICAgICAgICAgaiA9IGV2YWwoJygnICsgdGV4dCArICcpJyk7XG5cbi8vIEluIHRoZSBvcHRpb25hbCBmb3VydGggc3RhZ2UsIHdlIHJlY3Vyc2l2ZWx5IHdhbGsgdGhlIG5ldyBzdHJ1Y3R1cmUsIHBhc3Npbmdcbi8vIGVhY2ggbmFtZS92YWx1ZSBwYWlyIHRvIGEgcmV2aXZlciBmdW5jdGlvbiBmb3IgcG9zc2libGUgdHJhbnNmb3JtYXRpb24uXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHJldml2ZXIgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgICAgICAgPyB3YWxrKHsnJzogan0sICcnKVxuICAgICAgICAgICAgICAgICAgICA6IGo7XG4gICAgICAgICAgICB9XG5cbi8vIElmIHRoZSB0ZXh0IGlzIG5vdCBKU09OIHBhcnNlYWJsZSwgdGhlbiBhIFN5bnRheEVycm9yIGlzIHRocm93bi5cblxuICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKCdKU09OLnBhcnNlJyk7XG4gICAgICAgIH07XG4gICAgfVxufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBKU09OIiwiLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzXG4gKi9cblxudmFyIGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgnanNvbnAnKTtcblxuLyoqXG4gKiBNb2R1bGUgZXhwb3J0cy5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGpzb25wO1xuXG4vKipcbiAqIENhbGxiYWNrIGluZGV4LlxuICovXG5cbnZhciBjb3VudCA9IDA7XG5cbi8qKlxuICogTm9vcCBmdW5jdGlvbi5cbiAqL1xuXG5mdW5jdGlvbiBub29wKCl7fVxuXG4vKipcbiAqIEpTT05QIGhhbmRsZXJcbiAqXG4gKiBPcHRpb25zOlxuICogIC0gcGFyYW0ge1N0cmluZ30gcXMgcGFyYW1ldGVyIChgY2FsbGJhY2tgKVxuICogIC0gdGltZW91dCB7TnVtYmVyfSBob3cgbG9uZyBhZnRlciBhIHRpbWVvdXQgZXJyb3IgaXMgZW1pdHRlZCAoYDYwMDAwYClcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge09iamVjdHxGdW5jdGlvbn0gb3B0aW9uYWwgb3B0aW9ucyAvIGNhbGxiYWNrXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvcHRpb25hbCBjYWxsYmFja1xuICovXG5cbmZ1bmN0aW9uIGpzb25wKHVybCwgb3B0cywgZm4pe1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygb3B0cykge1xuICAgIGZuID0gb3B0cztcbiAgICBvcHRzID0ge307XG4gIH1cbiAgaWYgKCFvcHRzKSBvcHRzID0ge307XG5cbiAgdmFyIHByZWZpeCA9IG9wdHMucHJlZml4IHx8ICdfX2pwJztcbiAgdmFyIHBhcmFtID0gb3B0cy5wYXJhbSB8fCAnY2FsbGJhY2snO1xuICB2YXIgdGltZW91dCA9IG51bGwgIT0gb3B0cy50aW1lb3V0ID8gb3B0cy50aW1lb3V0IDogNjAwMDA7XG4gIHZhciBlbmMgPSBlbmNvZGVVUklDb21wb25lbnQ7XG4gIHZhciB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF0gfHwgZG9jdW1lbnQuaGVhZDtcbiAgdmFyIHNjcmlwdDtcbiAgdmFyIHRpbWVyO1xuXG4gIC8vIGdlbmVyYXRlIGEgdW5pcXVlIGlkIGZvciB0aGlzIHJlcXVlc3RcbiAgdmFyIGlkID0gcHJlZml4ICsgKGNvdW50KyspO1xuXG4gIGlmICh0aW1lb3V0KSB7XG4gICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICBpZiAoZm4pIGZuKG5ldyBFcnJvcignVGltZW91dCcpKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFudXAoKXtcbiAgICBzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xuICAgIHdpbmRvd1tpZF0gPSBub29wO1xuICB9XG5cbiAgd2luZG93W2lkXSA9IGZ1bmN0aW9uKGRhdGEpe1xuICAgIGRlYnVnKCdqc29ucCBnb3QnLCBkYXRhKTtcbiAgICBpZiAodGltZXIpIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgY2xlYW51cCgpO1xuICAgIGlmIChmbikgZm4obnVsbCwgZGF0YSk7XG4gIH07XG5cbiAgLy8gYWRkIHFzIGNvbXBvbmVudFxuICB1cmwgKz0gKH51cmwuaW5kZXhPZignPycpID8gJyYnIDogJz8nKSArIHBhcmFtICsgJz0nICsgZW5jKGlkKTtcbiAgdXJsID0gdXJsLnJlcGxhY2UoJz8mJywgJz8nKTtcblxuICBkZWJ1ZygnanNvbnAgcmVxIFwiJXNcIicsIHVybCk7XG5cbiAgLy8gY3JlYXRlIHNjcmlwdFxuICBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgc2NyaXB0LnNyYyA9IHVybDtcbiAgdGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHNjcmlwdCwgdGFyZ2V0KTtcbn1cbiIsInZhciBwcm9jZXNzPXJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKTtcbi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZVxuICAgICAgICAgICAgICAgJiYgJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZS5zdG9yYWdlXG4gICAgICAgICAgICAgICAgICA/IGNocm9tZS5zdG9yYWdlLmxvY2FsXG4gICAgICAgICAgICAgICAgICA6IGxvY2Fsc3RvcmFnZSgpO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG5leHBvcnRzLmNvbG9ycyA9IFtcbiAgJ2xpZ2h0c2VhZ3JlZW4nLFxuICAnZm9yZXN0Z3JlZW4nLFxuICAnZ29sZGVucm9kJyxcbiAgJ2RvZGdlcmJsdWUnLFxuICAnZGFya29yY2hpZCcsXG4gICdjcmltc29uJ1xuXTtcblxuLyoqXG4gKiBDdXJyZW50bHkgb25seSBXZWJLaXQtYmFzZWQgV2ViIEluc3BlY3RvcnMsIEZpcmVmb3ggPj0gdjMxLFxuICogYW5kIHRoZSBGaXJlYnVnIGV4dGVuc2lvbiAoYW55IEZpcmVmb3ggdmVyc2lvbikgYXJlIGtub3duXG4gKiB0byBzdXBwb3J0IFwiJWNcIiBDU1MgY3VzdG9taXphdGlvbnMuXG4gKlxuICogVE9ETzogYWRkIGEgYGxvY2FsU3RvcmFnZWAgdmFyaWFibGUgdG8gZXhwbGljaXRseSBlbmFibGUvZGlzYWJsZSBjb2xvcnNcbiAqL1xuXG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG4gIC8vIGlzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG4gIC8vIGRvY3VtZW50IGlzIHVuZGVmaW5lZCBpbiByZWFjdC1uYXRpdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC1uYXRpdmUvcHVsbC8xNjMyXG4gIHJldHVybiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiAnV2Via2l0QXBwZWFyYW5jZScgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlKSB8fFxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcbiAgICAod2luZG93LmNvbnNvbGUgJiYgKGNvbnNvbGUuZmlyZWJ1ZyB8fCAoY29uc29sZS5leGNlcHRpb24gJiYgY29uc29sZS50YWJsZSkpKSB8fFxuICAgIC8vIGlzIGZpcmVmb3ggPj0gdjMxP1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuICAgIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuICdbVW5leHBlY3RlZEpTT05QYXJzZUVycm9yXTogJyArIGVyci5tZXNzYWdlO1xuICB9XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncygpIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybiBhcmdzO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncyA9IFthcmdzWzBdLCBjLCAnY29sb3I6IGluaGVyaXQnXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgMSkpO1xuXG4gIC8vIHRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cbiAgLy8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0QyA9IDA7XG4gIGFyZ3NbMF0ucmVwbGFjZSgvJVthLXolXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmICgnJSUnID09PSBtYXRjaCkgcmV0dXJuO1xuICAgIGluZGV4Kys7XG4gICAgaWYgKCclYycgPT09IG1hdGNoKSB7XG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcbiAgICAgIC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG4gICAgICBsYXN0QyA9IGluZGV4O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIHRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LzksIHdoZXJlXG4gIC8vIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5zdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZXhwb3J0cy5zdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG5cbiAgLy8gSWYgZGVidWcgaXNuJ3Qgc2V0IGluIExTLCBhbmQgd2UncmUgaW4gRWxlY3Ryb24sIHRyeSB0byBsb2FkICRERUJVR1xuICBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICdlbnYnIGluIHByb2Nlc3MpIHtcbiAgICByZXR1cm4gcHJvY2Vzcy5lbnYuREVCVUc7XG4gIH1cbn1cblxuLyoqXG4gKiBFbmFibGUgbmFtZXNwYWNlcyBsaXN0ZWQgaW4gYGxvY2FsU3RvcmFnZS5kZWJ1Z2AgaW5pdGlhbGx5LlxuICovXG5cbmV4cG9ydHMuZW5hYmxlKGxvYWQoKSk7XG5cbi8qKlxuICogTG9jYWxzdG9yYWdlIGF0dGVtcHRzIHRvIHJldHVybiB0aGUgbG9jYWxzdG9yYWdlLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugc2FmYXJpIHRocm93c1xuICogd2hlbiBhIHVzZXIgZGlzYWJsZXMgY29va2llcy9sb2NhbHN0b3JhZ2VcbiAqIGFuZCB5b3UgYXR0ZW1wdCB0byBhY2Nlc3MgaXQuXG4gKlxuICogQHJldHVybiB7TG9jYWxTdG9yYWdlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9jYWxzdG9yYWdlKCl7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2U7XG4gIH0gY2F0Y2ggKGUpIHt9XG59XG4iLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgY29tbW9uIGxvZ2ljIGZvciBib3RoIHRoZSBOb2RlLmpzIGFuZCB3ZWIgYnJvd3NlclxuICogaW1wbGVtZW50YXRpb25zIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZGVidWcuZGVidWcgPSBkZWJ1ZztcbmV4cG9ydHMuY29lcmNlID0gY29lcmNlO1xuZXhwb3J0cy5kaXNhYmxlID0gZGlzYWJsZTtcbmV4cG9ydHMuZW5hYmxlID0gZW5hYmxlO1xuZXhwb3J0cy5lbmFibGVkID0gZW5hYmxlZDtcbmV4cG9ydHMuaHVtYW5pemUgPSByZXF1aXJlKCdtcycpO1xuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuICovXG5cbmV4cG9ydHMubmFtZXMgPSBbXTtcbmV4cG9ydHMuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG4gKlxuICogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXJjYXNlZCBsZXR0ZXIsIGkuZS4gXCJuXCIuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzID0ge307XG5cbi8qKlxuICogUHJldmlvdXNseSBhc3NpZ25lZCBjb2xvci5cbiAqL1xuXG52YXIgcHJldkNvbG9yID0gMDtcblxuLyoqXG4gKiBQcmV2aW91cyBsb2cgdGltZXN0YW1wLlxuICovXG5cbnZhciBwcmV2VGltZTtcblxuLyoqXG4gKiBTZWxlY3QgYSBjb2xvci5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZWxlY3RDb2xvcigpIHtcbiAgcmV0dXJuIGV4cG9ydHMuY29sb3JzW3ByZXZDb2xvcisrICUgZXhwb3J0cy5jb2xvcnMubGVuZ3RoXTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVidWcobmFtZXNwYWNlKSB7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZGlzYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZGlzYWJsZWQoKSB7XG4gIH1cbiAgZGlzYWJsZWQuZW5hYmxlZCA9IGZhbHNlO1xuXG4gIC8vIGRlZmluZSB0aGUgYGVuYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZW5hYmxlZCgpIHtcblxuICAgIHZhciBzZWxmID0gZW5hYmxlZDtcblxuICAgIC8vIHNldCBgZGlmZmAgdGltZXN0YW1wXG4gICAgdmFyIGN1cnIgPSArbmV3IERhdGUoKTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuICAgIHNlbGYuZGlmZiA9IG1zO1xuICAgIHNlbGYucHJldiA9IHByZXZUaW1lO1xuICAgIHNlbGYuY3VyciA9IGN1cnI7XG4gICAgcHJldlRpbWUgPSBjdXJyO1xuXG4gICAgLy8gYWRkIHRoZSBgY29sb3JgIGlmIG5vdCBzZXRcbiAgICBpZiAobnVsbCA9PSBzZWxmLnVzZUNvbG9ycykgc2VsZi51c2VDb2xvcnMgPSBleHBvcnRzLnVzZUNvbG9ycygpO1xuICAgIGlmIChudWxsID09IHNlbGYuY29sb3IgJiYgc2VsZi51c2VDb2xvcnMpIHNlbGYuY29sb3IgPSBzZWxlY3RDb2xvcigpO1xuXG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGFyZ3NbMF0gPSBleHBvcnRzLmNvZXJjZShhcmdzWzBdKTtcblxuICAgIGlmICgnc3RyaW5nJyAhPT0gdHlwZW9mIGFyZ3NbMF0pIHtcbiAgICAgIC8vIGFueXRoaW5nIGVsc2UgbGV0J3MgaW5zcGVjdCB3aXRoICVvXG4gICAgICBhcmdzID0gWyclbyddLmNvbmNhdChhcmdzKTtcbiAgICB9XG5cbiAgICAvLyBhcHBseSBhbnkgYGZvcm1hdHRlcnNgIHRyYW5zZm9ybWF0aW9uc1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgYXJnc1swXSA9IGFyZ3NbMF0ucmVwbGFjZSgvJShbYS16JV0pL2csIGZ1bmN0aW9uKG1hdGNoLCBmb3JtYXQpIHtcbiAgICAgIC8vIGlmIHdlIGVuY291bnRlciBhbiBlc2NhcGVkICUgdGhlbiBkb24ndCBpbmNyZWFzZSB0aGUgYXJyYXkgaW5kZXhcbiAgICAgIGlmIChtYXRjaCA9PT0gJyUlJykgcmV0dXJuIG1hdGNoO1xuICAgICAgaW5kZXgrKztcbiAgICAgIHZhciBmb3JtYXR0ZXIgPSBleHBvcnRzLmZvcm1hdHRlcnNbZm9ybWF0XTtcbiAgICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZm9ybWF0dGVyKSB7XG4gICAgICAgIHZhciB2YWwgPSBhcmdzW2luZGV4XTtcbiAgICAgICAgbWF0Y2ggPSBmb3JtYXR0ZXIuY2FsbChzZWxmLCB2YWwpO1xuXG4gICAgICAgIC8vIG5vdyB3ZSBuZWVkIHRvIHJlbW92ZSBgYXJnc1tpbmRleF1gIHNpbmNlIGl0J3MgaW5saW5lZCBpbiB0aGUgYGZvcm1hdGBcbiAgICAgICAgYXJncy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBpbmRleC0tO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuXG4gICAgLy8gYXBwbHkgZW52LXNwZWNpZmljIGZvcm1hdHRpbmdcbiAgICBhcmdzID0gZXhwb3J0cy5mb3JtYXRBcmdzLmFwcGx5KHNlbGYsIGFyZ3MpO1xuXG4gICAgdmFyIGxvZ0ZuID0gZW5hYmxlZC5sb2cgfHwgZXhwb3J0cy5sb2cgfHwgY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbiAgICBsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxuICBlbmFibGVkLmVuYWJsZWQgPSB0cnVlO1xuXG4gIHZhciBmbiA9IGV4cG9ydHMuZW5hYmxlZChuYW1lc3BhY2UpID8gZW5hYmxlZCA6IGRpc2FibGVkO1xuXG4gIGZuLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblxuICByZXR1cm4gZm47XG59XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuICBleHBvcnRzLnNhdmUobmFtZXNwYWNlcyk7XG5cbiAgdmFyIHNwbGl0ID0gKG5hbWVzcGFjZXMgfHwgJycpLnNwbGl0KC9bXFxzLF0rLyk7XG4gIHZhciBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICghc3BsaXRbaV0pIGNvbnRpbnVlOyAvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuICAgIG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9bXFxcXF4kKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJykucmVwbGFjZSgvXFwqL2csICcuKj8nKTtcbiAgICBpZiAobmFtZXNwYWNlc1swXSA9PT0gJy0nKSB7XG4gICAgICBleHBvcnRzLnNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzLnN1YnN0cigxKSArICckJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBvcnRzLm5hbWVzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzICsgJyQnKSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGlzYWJsZSBkZWJ1ZyBvdXRwdXQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkaXNhYmxlKCkge1xuICBleHBvcnRzLmVuYWJsZSgnJyk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBtb2RlIG5hbWUgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGVkKG5hbWUpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLnNraXBzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ29lcmNlIGB2YWxgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XG4gIGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcbiAgcmV0dXJuIHZhbDtcbn1cbiIsIi8qKlxuICogSGVscGVycy5cbiAqL1xuXG52YXIgcyA9IDEwMDBcbnZhciBtID0gcyAqIDYwXG52YXIgaCA9IG0gKiA2MFxudmFyIGQgPSBoICogMjRcbnZhciB5ID0gZCAqIDM2NS4yNVxuXG4vKipcbiAqIFBhcnNlIG9yIGZvcm1hdCB0aGUgZ2l2ZW4gYHZhbGAuXG4gKlxuICogT3B0aW9uczpcbiAqXG4gKiAgLSBgbG9uZ2AgdmVyYm9zZSBmb3JtYXR0aW5nIFtmYWxzZV1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IHZhbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEB0aHJvd3Mge0Vycm9yfSB0aHJvdyBhbiBlcnJvciBpZiB2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIG51bWJlclxuICogQHJldHVybiB7U3RyaW5nfE51bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbFxuICBpZiAodHlwZSA9PT0gJ3N0cmluZycgJiYgdmFsLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gcGFyc2UodmFsKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzTmFOKHZhbCkgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMubG9uZyA/XG5cdFx0XHRmbXRMb25nKHZhbCkgOlxuXHRcdFx0Zm10U2hvcnQodmFsKVxuICB9XG4gIHRocm93IG5ldyBFcnJvcigndmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSB2YWxpZCBudW1iZXIuIHZhbD0nICsgSlNPTi5zdHJpbmdpZnkodmFsKSlcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHN0ciA9IFN0cmluZyhzdHIpXG4gIGlmIChzdHIubGVuZ3RoID4gMTAwMDApIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtaWxsaXNlY29uZHM/fG1zZWNzP3xtc3xzZWNvbmRzP3xzZWNzP3xzfG1pbnV0ZXM/fG1pbnM/fG18aG91cnM/fGhycz98aHxkYXlzP3xkfHllYXJzP3x5cnM/fHkpPyQvaS5leGVjKHN0cilcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVyblxuICB9XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSlcbiAgdmFyIHR5cGUgPSAobWF0Y2hbMl0gfHwgJ21zJykudG9Mb3dlckNhc2UoKVxuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHlcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkXG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoXG4gICAgY2FzZSAnbWludXRlcyc6XG4gICAgY2FzZSAnbWludXRlJzpcbiAgICBjYXNlICdtaW5zJzpcbiAgICBjYXNlICdtaW4nOlxuICAgIGNhc2UgJ20nOlxuICAgICAgcmV0dXJuIG4gKiBtXG4gICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgY2FzZSAnc2Vjb25kJzpcbiAgICBjYXNlICdzZWNzJzpcbiAgICBjYXNlICdzZWMnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzXG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgfVxufVxuXG4vKipcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdFNob3J0KG1zKSB7XG4gIGlmIChtcyA+PSBkKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJ1xuICB9XG4gIGlmIChtcyA+PSBoKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBoKSArICdoJ1xuICB9XG4gIGlmIChtcyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJ1xuICB9XG4gIGlmIChtcyA+PSBzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJ1xuICB9XG4gIHJldHVybiBtcyArICdtcydcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgcmV0dXJuIHBsdXJhbChtcywgZCwgJ2RheScpIHx8XG4gICAgcGx1cmFsKG1zLCBoLCAnaG91cicpIHx8XG4gICAgcGx1cmFsKG1zLCBtLCAnbWludXRlJykgfHxcbiAgICBwbHVyYWwobXMsIHMsICdzZWNvbmQnKSB8fFxuICAgIG1zICsgJyBtcydcbn1cblxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqL1xuXG5mdW5jdGlvbiBwbHVyYWwobXMsIG4sIG5hbWUpIHtcbiAgaWYgKG1zIDwgbikge1xuICAgIHJldHVyblxuICB9XG4gIGlmIChtcyA8IG4gKiAxLjUpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihtcyAvIG4pICsgJyAnICsgbmFtZVxuICB9XG4gIHJldHVybiBNYXRoLmNlaWwobXMgLyBuKSArICcgJyArIG5hbWUgKyAncydcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJlcGxhY2UgPSBTdHJpbmcucHJvdG90eXBlLnJlcGxhY2U7XG52YXIgcGVyY2VudFR3ZW50aWVzID0gLyUyMC9nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnZGVmYXVsdCc6ICdSRkMzOTg2JyxcbiAgICBmb3JtYXR0ZXJzOiB7XG4gICAgICAgIFJGQzE3Mzg6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcGxhY2UuY2FsbCh2YWx1ZSwgcGVyY2VudFR3ZW50aWVzLCAnKycpO1xuICAgICAgICB9LFxuICAgICAgICBSRkMzOTg2OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgUkZDMTczODogJ1JGQzE3MzgnLFxuICAgIFJGQzM5ODY6ICdSRkMzOTg2J1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHN0cmluZ2lmeSA9IHJlcXVpcmUoJy4vc3RyaW5naWZ5Jyk7XG52YXIgcGFyc2UgPSByZXF1aXJlKCcuL3BhcnNlJyk7XG52YXIgZm9ybWF0cyA9IHJlcXVpcmUoJy4vZm9ybWF0cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBmb3JtYXRzOiBmb3JtYXRzLFxuICAgIHBhcnNlOiBwYXJzZSxcbiAgICBzdHJpbmdpZnk6IHN0cmluZ2lmeVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIGFsbG93RG90czogZmFsc2UsXG4gICAgYWxsb3dQcm90b3R5cGVzOiBmYWxzZSxcbiAgICBhcnJheUxpbWl0OiAyMCxcbiAgICBkZWNvZGVyOiB1dGlscy5kZWNvZGUsXG4gICAgZGVsaW1pdGVyOiAnJicsXG4gICAgZGVwdGg6IDUsXG4gICAgcGFyYW1ldGVyTGltaXQ6IDEwMDAsXG4gICAgcGxhaW5PYmplY3RzOiBmYWxzZSxcbiAgICBzdHJpY3ROdWxsSGFuZGxpbmc6IGZhbHNlXG59O1xuXG52YXIgcGFyc2VWYWx1ZXMgPSBmdW5jdGlvbiBwYXJzZVZhbHVlcyhzdHIsIG9wdGlvbnMpIHtcbiAgICB2YXIgb2JqID0ge307XG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KG9wdGlvbnMuZGVsaW1pdGVyLCBvcHRpb25zLnBhcmFtZXRlckxpbWl0ID09PSBJbmZpbml0eSA/IHVuZGVmaW5lZCA6IG9wdGlvbnMucGFyYW1ldGVyTGltaXQpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICB2YXIgcG9zID0gcGFydC5pbmRleE9mKCddPScpID09PSAtMSA/IHBhcnQuaW5kZXhPZignPScpIDogcGFydC5pbmRleE9mKCddPScpICsgMTtcblxuICAgICAgICB2YXIga2V5LCB2YWw7XG4gICAgICAgIGlmIChwb3MgPT09IC0xKSB7XG4gICAgICAgICAgICBrZXkgPSBvcHRpb25zLmRlY29kZXIocGFydCk7XG4gICAgICAgICAgICB2YWwgPSBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyA/IG51bGwgOiAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGtleSA9IG9wdGlvbnMuZGVjb2RlcihwYXJ0LnNsaWNlKDAsIHBvcykpO1xuICAgICAgICAgICAgdmFsID0gb3B0aW9ucy5kZWNvZGVyKHBhcnQuc2xpY2UocG9zICsgMSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChoYXMuY2FsbChvYmosIGtleSkpIHtcbiAgICAgICAgICAgIG9ialtrZXldID0gW10uY29uY2F0KG9ialtrZXldKS5jb25jYXQodmFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9ialtrZXldID0gdmFsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbnZhciBwYXJzZU9iamVjdCA9IGZ1bmN0aW9uIHBhcnNlT2JqZWN0KGNoYWluLCB2YWwsIG9wdGlvbnMpIHtcbiAgICBpZiAoIWNoYWluLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cblxuICAgIHZhciByb290ID0gY2hhaW4uc2hpZnQoKTtcblxuICAgIHZhciBvYmo7XG4gICAgaWYgKHJvb3QgPT09ICdbXScpIHtcbiAgICAgICAgb2JqID0gW107XG4gICAgICAgIG9iaiA9IG9iai5jb25jYXQocGFyc2VPYmplY3QoY2hhaW4sIHZhbCwgb3B0aW9ucykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG9iaiA9IG9wdGlvbnMucGxhaW5PYmplY3RzID8gT2JqZWN0LmNyZWF0ZShudWxsKSA6IHt9O1xuICAgICAgICB2YXIgY2xlYW5Sb290ID0gcm9vdFswXSA9PT0gJ1snICYmIHJvb3Rbcm9vdC5sZW5ndGggLSAxXSA9PT0gJ10nID8gcm9vdC5zbGljZSgxLCByb290Lmxlbmd0aCAtIDEpIDogcm9vdDtcbiAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoY2xlYW5Sb290LCAxMCk7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICFpc05hTihpbmRleCkgJiZcbiAgICAgICAgICAgIHJvb3QgIT09IGNsZWFuUm9vdCAmJlxuICAgICAgICAgICAgU3RyaW5nKGluZGV4KSA9PT0gY2xlYW5Sb290ICYmXG4gICAgICAgICAgICBpbmRleCA+PSAwICYmXG4gICAgICAgICAgICAob3B0aW9ucy5wYXJzZUFycmF5cyAmJiBpbmRleCA8PSBvcHRpb25zLmFycmF5TGltaXQpXG4gICAgICAgICkge1xuICAgICAgICAgICAgb2JqID0gW107XG4gICAgICAgICAgICBvYmpbaW5kZXhdID0gcGFyc2VPYmplY3QoY2hhaW4sIHZhbCwgb3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvYmpbY2xlYW5Sb290XSA9IHBhcnNlT2JqZWN0KGNoYWluLCB2YWwsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbnZhciBwYXJzZUtleXMgPSBmdW5jdGlvbiBwYXJzZUtleXMoZ2l2ZW5LZXksIHZhbCwgb3B0aW9ucykge1xuICAgIGlmICghZ2l2ZW5LZXkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRyYW5zZm9ybSBkb3Qgbm90YXRpb24gdG8gYnJhY2tldCBub3RhdGlvblxuICAgIHZhciBrZXkgPSBvcHRpb25zLmFsbG93RG90cyA/IGdpdmVuS2V5LnJlcGxhY2UoL1xcLihbXlxcLlxcW10rKS9nLCAnWyQxXScpIDogZ2l2ZW5LZXk7XG5cbiAgICAvLyBUaGUgcmVnZXggY2h1bmtzXG5cbiAgICB2YXIgcGFyZW50ID0gL14oW15cXFtcXF1dKikvO1xuICAgIHZhciBjaGlsZCA9IC8oXFxbW15cXFtcXF1dKlxcXSkvZztcblxuICAgIC8vIEdldCB0aGUgcGFyZW50XG5cbiAgICB2YXIgc2VnbWVudCA9IHBhcmVudC5leGVjKGtleSk7XG5cbiAgICAvLyBTdGFzaCB0aGUgcGFyZW50IGlmIGl0IGV4aXN0c1xuXG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBpZiAoc2VnbWVudFsxXSkge1xuICAgICAgICAvLyBJZiB3ZSBhcmVuJ3QgdXNpbmcgcGxhaW4gb2JqZWN0cywgb3B0aW9uYWxseSBwcmVmaXgga2V5c1xuICAgICAgICAvLyB0aGF0IHdvdWxkIG92ZXJ3cml0ZSBvYmplY3QgcHJvdG90eXBlIHByb3BlcnRpZXNcbiAgICAgICAgaWYgKCFvcHRpb25zLnBsYWluT2JqZWN0cyAmJiBoYXMuY2FsbChPYmplY3QucHJvdG90eXBlLCBzZWdtZW50WzFdKSkge1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLmFsbG93UHJvdG90eXBlcykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGtleXMucHVzaChzZWdtZW50WzFdKTtcbiAgICB9XG5cbiAgICAvLyBMb29wIHRocm91Z2ggY2hpbGRyZW4gYXBwZW5kaW5nIHRvIHRoZSBhcnJheSB1bnRpbCB3ZSBoaXQgZGVwdGhcblxuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAoKHNlZ21lbnQgPSBjaGlsZC5leGVjKGtleSkpICE9PSBudWxsICYmIGkgPCBvcHRpb25zLmRlcHRoKSB7XG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgaWYgKCFvcHRpb25zLnBsYWluT2JqZWN0cyAmJiBoYXMuY2FsbChPYmplY3QucHJvdG90eXBlLCBzZWdtZW50WzFdLnJlcGxhY2UoL1xcW3xcXF0vZywgJycpKSkge1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLmFsbG93UHJvdG90eXBlcykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGtleXMucHVzaChzZWdtZW50WzFdKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSdzIGEgcmVtYWluZGVyLCBqdXN0IGFkZCB3aGF0ZXZlciBpcyBsZWZ0XG5cbiAgICBpZiAoc2VnbWVudCkge1xuICAgICAgICBrZXlzLnB1c2goJ1snICsga2V5LnNsaWNlKHNlZ21lbnQuaW5kZXgpICsgJ10nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyc2VPYmplY3Qoa2V5cywgdmFsLCBvcHRpb25zKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0ciwgb3B0cykge1xuICAgIHZhciBvcHRpb25zID0gb3B0cyB8fCB7fTtcblxuICAgIGlmIChvcHRpb25zLmRlY29kZXIgIT09IG51bGwgJiYgb3B0aW9ucy5kZWNvZGVyICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMuZGVjb2RlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdEZWNvZGVyIGhhcyB0byBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIG9wdGlvbnMuZGVsaW1pdGVyID0gdHlwZW9mIG9wdGlvbnMuZGVsaW1pdGVyID09PSAnc3RyaW5nJyB8fCB1dGlscy5pc1JlZ0V4cChvcHRpb25zLmRlbGltaXRlcikgPyBvcHRpb25zLmRlbGltaXRlciA6IGRlZmF1bHRzLmRlbGltaXRlcjtcbiAgICBvcHRpb25zLmRlcHRoID0gdHlwZW9mIG9wdGlvbnMuZGVwdGggPT09ICdudW1iZXInID8gb3B0aW9ucy5kZXB0aCA6IGRlZmF1bHRzLmRlcHRoO1xuICAgIG9wdGlvbnMuYXJyYXlMaW1pdCA9IHR5cGVvZiBvcHRpb25zLmFycmF5TGltaXQgPT09ICdudW1iZXInID8gb3B0aW9ucy5hcnJheUxpbWl0IDogZGVmYXVsdHMuYXJyYXlMaW1pdDtcbiAgICBvcHRpb25zLnBhcnNlQXJyYXlzID0gb3B0aW9ucy5wYXJzZUFycmF5cyAhPT0gZmFsc2U7XG4gICAgb3B0aW9ucy5kZWNvZGVyID0gdHlwZW9mIG9wdGlvbnMuZGVjb2RlciA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMuZGVjb2RlciA6IGRlZmF1bHRzLmRlY29kZXI7XG4gICAgb3B0aW9ucy5hbGxvd0RvdHMgPSB0eXBlb2Ygb3B0aW9ucy5hbGxvd0RvdHMgPT09ICdib29sZWFuJyA/IG9wdGlvbnMuYWxsb3dEb3RzIDogZGVmYXVsdHMuYWxsb3dEb3RzO1xuICAgIG9wdGlvbnMucGxhaW5PYmplY3RzID0gdHlwZW9mIG9wdGlvbnMucGxhaW5PYmplY3RzID09PSAnYm9vbGVhbicgPyBvcHRpb25zLnBsYWluT2JqZWN0cyA6IGRlZmF1bHRzLnBsYWluT2JqZWN0cztcbiAgICBvcHRpb25zLmFsbG93UHJvdG90eXBlcyA9IHR5cGVvZiBvcHRpb25zLmFsbG93UHJvdG90eXBlcyA9PT0gJ2Jvb2xlYW4nID8gb3B0aW9ucy5hbGxvd1Byb3RvdHlwZXMgOiBkZWZhdWx0cy5hbGxvd1Byb3RvdHlwZXM7XG4gICAgb3B0aW9ucy5wYXJhbWV0ZXJMaW1pdCA9IHR5cGVvZiBvcHRpb25zLnBhcmFtZXRlckxpbWl0ID09PSAnbnVtYmVyJyA/IG9wdGlvbnMucGFyYW1ldGVyTGltaXQgOiBkZWZhdWx0cy5wYXJhbWV0ZXJMaW1pdDtcbiAgICBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyA9IHR5cGVvZiBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyA9PT0gJ2Jvb2xlYW4nID8gb3B0aW9ucy5zdHJpY3ROdWxsSGFuZGxpbmcgOiBkZWZhdWx0cy5zdHJpY3ROdWxsSGFuZGxpbmc7XG5cbiAgICBpZiAoc3RyID09PSAnJyB8fCBzdHIgPT09IG51bGwgfHwgdHlwZW9mIHN0ciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMucGxhaW5PYmplY3RzID8gT2JqZWN0LmNyZWF0ZShudWxsKSA6IHt9O1xuICAgIH1cblxuICAgIHZhciB0ZW1wT2JqID0gdHlwZW9mIHN0ciA9PT0gJ3N0cmluZycgPyBwYXJzZVZhbHVlcyhzdHIsIG9wdGlvbnMpIDogc3RyO1xuICAgIHZhciBvYmogPSBvcHRpb25zLnBsYWluT2JqZWN0cyA/IE9iamVjdC5jcmVhdGUobnVsbCkgOiB7fTtcblxuICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUga2V5cyBhbmQgc2V0dXAgdGhlIG5ldyBvYmplY3RcblxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGVtcE9iaik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICB2YXIgbmV3T2JqID0gcGFyc2VLZXlzKGtleSwgdGVtcE9ialtrZXldLCBvcHRpb25zKTtcbiAgICAgICAgb2JqID0gdXRpbHMubWVyZ2Uob2JqLCBuZXdPYmosIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiB1dGlscy5jb21wYWN0KG9iaik7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgZm9ybWF0cyA9IHJlcXVpcmUoJy4vZm9ybWF0cycpO1xuXG52YXIgYXJyYXlQcmVmaXhHZW5lcmF0b3JzID0ge1xuICAgIGJyYWNrZXRzOiBmdW5jdGlvbiBicmFja2V0cyhwcmVmaXgpIHtcbiAgICAgICAgcmV0dXJuIHByZWZpeCArICdbXSc7XG4gICAgfSxcbiAgICBpbmRpY2VzOiBmdW5jdGlvbiBpbmRpY2VzKHByZWZpeCwga2V5KSB7XG4gICAgICAgIHJldHVybiBwcmVmaXggKyAnWycgKyBrZXkgKyAnXSc7XG4gICAgfSxcbiAgICByZXBlYXQ6IGZ1bmN0aW9uIHJlcGVhdChwcmVmaXgpIHtcbiAgICAgICAgcmV0dXJuIHByZWZpeDtcbiAgICB9XG59O1xuXG52YXIgdG9JU08gPSBEYXRlLnByb3RvdHlwZS50b0lTT1N0cmluZztcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIGRlbGltaXRlcjogJyYnLFxuICAgIGVuY29kZTogdHJ1ZSxcbiAgICBlbmNvZGVyOiB1dGlscy5lbmNvZGUsXG4gICAgc2VyaWFsaXplRGF0ZTogZnVuY3Rpb24gc2VyaWFsaXplRGF0ZShkYXRlKSB7XG4gICAgICAgIHJldHVybiB0b0lTTy5jYWxsKGRhdGUpO1xuICAgIH0sXG4gICAgc2tpcE51bGxzOiBmYWxzZSxcbiAgICBzdHJpY3ROdWxsSGFuZGxpbmc6IGZhbHNlXG59O1xuXG52YXIgc3RyaW5naWZ5ID0gZnVuY3Rpb24gc3RyaW5naWZ5KG9iamVjdCwgcHJlZml4LCBnZW5lcmF0ZUFycmF5UHJlZml4LCBzdHJpY3ROdWxsSGFuZGxpbmcsIHNraXBOdWxscywgZW5jb2RlciwgZmlsdGVyLCBzb3J0LCBhbGxvd0RvdHMsIHNlcmlhbGl6ZURhdGUsIGZvcm1hdHRlcikge1xuICAgIHZhciBvYmogPSBvYmplY3Q7XG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgb2JqID0gZmlsdGVyKHByZWZpeCwgb2JqKTtcbiAgICB9IGVsc2UgaWYgKG9iaiBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgb2JqID0gc2VyaWFsaXplRGF0ZShvYmopO1xuICAgIH0gZWxzZSBpZiAob2JqID09PSBudWxsKSB7XG4gICAgICAgIGlmIChzdHJpY3ROdWxsSGFuZGxpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVyID8gZW5jb2RlcihwcmVmaXgpIDogcHJlZml4O1xuICAgICAgICB9XG5cbiAgICAgICAgb2JqID0gJyc7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBvYmogPT09ICdudW1iZXInIHx8IHR5cGVvZiBvYmogPT09ICdib29sZWFuJyB8fCB1dGlscy5pc0J1ZmZlcihvYmopKSB7XG4gICAgICAgIGlmIChlbmNvZGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gW2Zvcm1hdHRlcihlbmNvZGVyKHByZWZpeCkpICsgJz0nICsgZm9ybWF0dGVyKGVuY29kZXIob2JqKSldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbZm9ybWF0dGVyKHByZWZpeCkgKyAnPScgKyBmb3JtYXR0ZXIoU3RyaW5nKG9iaikpXTtcbiAgICB9XG5cbiAgICB2YXIgdmFsdWVzID0gW107XG5cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9XG5cbiAgICB2YXIgb2JqS2V5cztcbiAgICBpZiAoQXJyYXkuaXNBcnJheShmaWx0ZXIpKSB7XG4gICAgICAgIG9iaktleXMgPSBmaWx0ZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgICAgICBvYmpLZXlzID0gc29ydCA/IGtleXMuc29ydChzb3J0KSA6IGtleXM7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmpLZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBrZXkgPSBvYmpLZXlzW2ldO1xuXG4gICAgICAgIGlmIChza2lwTnVsbHMgJiYgb2JqW2tleV0gPT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgICAgICAgICAgdmFsdWVzID0gdmFsdWVzLmNvbmNhdChzdHJpbmdpZnkoXG4gICAgICAgICAgICAgICAgb2JqW2tleV0sXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVBcnJheVByZWZpeChwcmVmaXgsIGtleSksXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVBcnJheVByZWZpeCxcbiAgICAgICAgICAgICAgICBzdHJpY3ROdWxsSGFuZGxpbmcsXG4gICAgICAgICAgICAgICAgc2tpcE51bGxzLFxuICAgICAgICAgICAgICAgIGVuY29kZXIsXG4gICAgICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgICAgIHNvcnQsXG4gICAgICAgICAgICAgICAgYWxsb3dEb3RzLFxuICAgICAgICAgICAgICAgIHNlcmlhbGl6ZURhdGUsXG4gICAgICAgICAgICAgICAgZm9ybWF0dGVyXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlcyA9IHZhbHVlcy5jb25jYXQoc3RyaW5naWZ5KFxuICAgICAgICAgICAgICAgIG9ialtrZXldLFxuICAgICAgICAgICAgICAgIHByZWZpeCArIChhbGxvd0RvdHMgPyAnLicgKyBrZXkgOiAnWycgKyBrZXkgKyAnXScpLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRlQXJyYXlQcmVmaXgsXG4gICAgICAgICAgICAgICAgc3RyaWN0TnVsbEhhbmRsaW5nLFxuICAgICAgICAgICAgICAgIHNraXBOdWxscyxcbiAgICAgICAgICAgICAgICBlbmNvZGVyLFxuICAgICAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgICAgICBzb3J0LFxuICAgICAgICAgICAgICAgIGFsbG93RG90cyxcbiAgICAgICAgICAgICAgICBzZXJpYWxpemVEYXRlLFxuICAgICAgICAgICAgICAgIGZvcm1hdHRlclxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWVzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqZWN0LCBvcHRzKSB7XG4gICAgdmFyIG9iaiA9IG9iamVjdDtcbiAgICB2YXIgb3B0aW9ucyA9IG9wdHMgfHwge307XG4gICAgdmFyIGRlbGltaXRlciA9IHR5cGVvZiBvcHRpb25zLmRlbGltaXRlciA9PT0gJ3VuZGVmaW5lZCcgPyBkZWZhdWx0cy5kZWxpbWl0ZXIgOiBvcHRpb25zLmRlbGltaXRlcjtcbiAgICB2YXIgc3RyaWN0TnVsbEhhbmRsaW5nID0gdHlwZW9mIG9wdGlvbnMuc3RyaWN0TnVsbEhhbmRsaW5nID09PSAnYm9vbGVhbicgPyBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyA6IGRlZmF1bHRzLnN0cmljdE51bGxIYW5kbGluZztcbiAgICB2YXIgc2tpcE51bGxzID0gdHlwZW9mIG9wdGlvbnMuc2tpcE51bGxzID09PSAnYm9vbGVhbicgPyBvcHRpb25zLnNraXBOdWxscyA6IGRlZmF1bHRzLnNraXBOdWxscztcbiAgICB2YXIgZW5jb2RlID0gdHlwZW9mIG9wdGlvbnMuZW5jb2RlID09PSAnYm9vbGVhbicgPyBvcHRpb25zLmVuY29kZSA6IGRlZmF1bHRzLmVuY29kZTtcbiAgICB2YXIgZW5jb2RlciA9IGVuY29kZSA/ICh0eXBlb2Ygb3B0aW9ucy5lbmNvZGVyID09PSAnZnVuY3Rpb24nID8gb3B0aW9ucy5lbmNvZGVyIDogZGVmYXVsdHMuZW5jb2RlcikgOiBudWxsO1xuICAgIHZhciBzb3J0ID0gdHlwZW9mIG9wdGlvbnMuc29ydCA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMuc29ydCA6IG51bGw7XG4gICAgdmFyIGFsbG93RG90cyA9IHR5cGVvZiBvcHRpb25zLmFsbG93RG90cyA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IG9wdGlvbnMuYWxsb3dEb3RzO1xuICAgIHZhciBzZXJpYWxpemVEYXRlID0gdHlwZW9mIG9wdGlvbnMuc2VyaWFsaXplRGF0ZSA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMuc2VyaWFsaXplRGF0ZSA6IGRlZmF1bHRzLnNlcmlhbGl6ZURhdGU7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLmZvcm1hdCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgb3B0aW9ucy5mb3JtYXQgPSBmb3JtYXRzLmRlZmF1bHQ7XG4gICAgfSBlbHNlIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGZvcm1hdHMuZm9ybWF0dGVycywgb3B0aW9ucy5mb3JtYXQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZm9ybWF0IG9wdGlvbiBwcm92aWRlZC4nKTtcbiAgICB9XG4gICAgdmFyIGZvcm1hdHRlciA9IGZvcm1hdHMuZm9ybWF0dGVyc1tvcHRpb25zLmZvcm1hdF07XG4gICAgdmFyIG9iaktleXM7XG4gICAgdmFyIGZpbHRlcjtcblxuICAgIGlmIChvcHRpb25zLmVuY29kZXIgIT09IG51bGwgJiYgb3B0aW9ucy5lbmNvZGVyICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMuZW5jb2RlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFbmNvZGVyIGhhcyB0byBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5maWx0ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgICAgIG9iaiA9IGZpbHRlcignJywgb2JqKTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5maWx0ZXIpKSB7XG4gICAgICAgIGZpbHRlciA9IG9wdGlvbnMuZmlsdGVyO1xuICAgICAgICBvYmpLZXlzID0gZmlsdGVyO1xuICAgIH1cblxuICAgIHZhciBrZXlzID0gW107XG5cbiAgICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcgfHwgb2JqID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICB2YXIgYXJyYXlGb3JtYXQ7XG4gICAgaWYgKG9wdGlvbnMuYXJyYXlGb3JtYXQgaW4gYXJyYXlQcmVmaXhHZW5lcmF0b3JzKSB7XG4gICAgICAgIGFycmF5Rm9ybWF0ID0gb3B0aW9ucy5hcnJheUZvcm1hdDtcbiAgICB9IGVsc2UgaWYgKCdpbmRpY2VzJyBpbiBvcHRpb25zKSB7XG4gICAgICAgIGFycmF5Rm9ybWF0ID0gb3B0aW9ucy5pbmRpY2VzID8gJ2luZGljZXMnIDogJ3JlcGVhdCc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYXJyYXlGb3JtYXQgPSAnaW5kaWNlcyc7XG4gICAgfVxuXG4gICAgdmFyIGdlbmVyYXRlQXJyYXlQcmVmaXggPSBhcnJheVByZWZpeEdlbmVyYXRvcnNbYXJyYXlGb3JtYXRdO1xuXG4gICAgaWYgKCFvYmpLZXlzKSB7XG4gICAgICAgIG9iaktleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgIH1cblxuICAgIGlmIChzb3J0KSB7XG4gICAgICAgIG9iaktleXMuc29ydChzb3J0KTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iaktleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGtleSA9IG9iaktleXNbaV07XG5cbiAgICAgICAgaWYgKHNraXBOdWxscyAmJiBvYmpba2V5XSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBrZXlzID0ga2V5cy5jb25jYXQoc3RyaW5naWZ5KFxuICAgICAgICAgICAgb2JqW2tleV0sXG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBnZW5lcmF0ZUFycmF5UHJlZml4LFxuICAgICAgICAgICAgc3RyaWN0TnVsbEhhbmRsaW5nLFxuICAgICAgICAgICAgc2tpcE51bGxzLFxuICAgICAgICAgICAgZW5jb2RlcixcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNvcnQsXG4gICAgICAgICAgICBhbGxvd0RvdHMsXG4gICAgICAgICAgICBzZXJpYWxpemVEYXRlLFxuICAgICAgICAgICAgZm9ybWF0dGVyXG4gICAgICAgICkpO1xuICAgIH1cblxuICAgIHJldHVybiBrZXlzLmpvaW4oZGVsaW1pdGVyKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgaGV4VGFibGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcnJheSA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjU2OyArK2kpIHtcbiAgICAgICAgYXJyYXkucHVzaCgnJScgKyAoKGkgPCAxNiA/ICcwJyA6ICcnKSArIGkudG9TdHJpbmcoMTYpKS50b1VwcGVyQ2FzZSgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJyYXk7XG59KCkpO1xuXG5leHBvcnRzLmFycmF5VG9PYmplY3QgPSBmdW5jdGlvbiAoc291cmNlLCBvcHRpb25zKSB7XG4gICAgdmFyIG9iaiA9IG9wdGlvbnMgJiYgb3B0aW9ucy5wbGFpbk9iamVjdHMgPyBPYmplY3QuY3JlYXRlKG51bGwpIDoge307XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2UubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VbaV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBvYmpbaV0gPSBzb3VyY2VbaV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb2JqO1xufTtcblxuZXhwb3J0cy5tZXJnZSA9IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSwgb3B0aW9ucykge1xuICAgIGlmICghc291cmNlKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRhcmdldCkpIHtcbiAgICAgICAgICAgIHRhcmdldC5wdXNoKHNvdXJjZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRhcmdldFtzb3VyY2VdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBbdGFyZ2V0LCBzb3VyY2VdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIFt0YXJnZXRdLmNvbmNhdChzb3VyY2UpO1xuICAgIH1cblxuICAgIHZhciBtZXJnZVRhcmdldCA9IHRhcmdldDtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0YXJnZXQpICYmICFBcnJheS5pc0FycmF5KHNvdXJjZSkpIHtcbiAgICAgICAgbWVyZ2VUYXJnZXQgPSBleHBvcnRzLmFycmF5VG9PYmplY3QodGFyZ2V0LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0YXJnZXQpICYmIEFycmF5LmlzQXJyYXkoc291cmNlKSkge1xuICAgICAgICBzb3VyY2UuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSwgaSkge1xuICAgICAgICAgICAgaWYgKGhhcy5jYWxsKHRhcmdldCwgaSkpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0W2ldICYmIHR5cGVvZiB0YXJnZXRbaV0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFtpXSA9IGV4cG9ydHMubWVyZ2UodGFyZ2V0W2ldLCBpdGVtLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRhcmdldFtpXSA9IGl0ZW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cblxuICAgIHJldHVybiBPYmplY3Qua2V5cyhzb3VyY2UpLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gc291cmNlW2tleV07XG5cbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChhY2MsIGtleSkpIHtcbiAgICAgICAgICAgIGFjY1trZXldID0gZXhwb3J0cy5tZXJnZShhY2Nba2V5XSwgdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWNjW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgIH0sIG1lcmdlVGFyZ2V0KTtcbn07XG5cbmV4cG9ydHMuZGVjb2RlID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxufTtcblxuZXhwb3J0cy5lbmNvZGUgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgLy8gVGhpcyBjb2RlIHdhcyBvcmlnaW5hbGx5IHdyaXR0ZW4gYnkgQnJpYW4gV2hpdGUgKG1zY2RleCkgZm9yIHRoZSBpby5qcyBjb3JlIHF1ZXJ5c3RyaW5nIGxpYnJhcnkuXG4gICAgLy8gSXQgaGFzIGJlZW4gYWRhcHRlZCBoZXJlIGZvciBzdHJpY3RlciBhZGhlcmVuY2UgdG8gUkZDIDM5ODZcbiAgICBpZiAoc3RyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH1cblxuICAgIHZhciBzdHJpbmcgPSB0eXBlb2Ygc3RyID09PSAnc3RyaW5nJyA/IHN0ciA6IFN0cmluZyhzdHIpO1xuXG4gICAgdmFyIG91dCA9ICcnO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBjID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgYyA9PT0gMHgyRCB8fCAvLyAtXG4gICAgICAgICAgICBjID09PSAweDJFIHx8IC8vIC5cbiAgICAgICAgICAgIGMgPT09IDB4NUYgfHwgLy8gX1xuICAgICAgICAgICAgYyA9PT0gMHg3RSB8fCAvLyB+XG4gICAgICAgICAgICAoYyA+PSAweDMwICYmIGMgPD0gMHgzOSkgfHwgLy8gMC05XG4gICAgICAgICAgICAoYyA+PSAweDQxICYmIGMgPD0gMHg1QSkgfHwgLy8gYS16XG4gICAgICAgICAgICAoYyA+PSAweDYxICYmIGMgPD0gMHg3QSkgLy8gQS1aXG4gICAgICAgICkge1xuICAgICAgICAgICAgb3V0ICs9IHN0cmluZy5jaGFyQXQoaSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjIDwgMHg4MCkge1xuICAgICAgICAgICAgb3V0ID0gb3V0ICsgaGV4VGFibGVbY107XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjIDwgMHg4MDApIHtcbiAgICAgICAgICAgIG91dCA9IG91dCArIChoZXhUYWJsZVsweEMwIHwgKGMgPj4gNildICsgaGV4VGFibGVbMHg4MCB8IChjICYgMHgzRildKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGMgPCAweEQ4MDAgfHwgYyA+PSAweEUwMDApIHtcbiAgICAgICAgICAgIG91dCA9IG91dCArIChoZXhUYWJsZVsweEUwIHwgKGMgPj4gMTIpXSArIGhleFRhYmxlWzB4ODAgfCAoKGMgPj4gNikgJiAweDNGKV0gKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNGKV0pO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpICs9IDE7XG4gICAgICAgIGMgPSAweDEwMDAwICsgKCgoYyAmIDB4M0ZGKSA8PCAxMCkgfCAoc3RyaW5nLmNoYXJDb2RlQXQoaSkgJiAweDNGRikpO1xuICAgICAgICBvdXQgKz0gaGV4VGFibGVbMHhGMCB8IChjID4+IDE4KV0gKyBoZXhUYWJsZVsweDgwIHwgKChjID4+IDEyKSAmIDB4M0YpXSArIGhleFRhYmxlWzB4ODAgfCAoKGMgPj4gNikgJiAweDNGKV0gKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNGKV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbmV4cG9ydHMuY29tcGFjdCA9IGZ1bmN0aW9uIChvYmosIHJlZmVyZW5jZXMpIHtcbiAgICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcgfHwgb2JqID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG4gICAgdmFyIHJlZnMgPSByZWZlcmVuY2VzIHx8IFtdO1xuICAgIHZhciBsb29rdXAgPSByZWZzLmluZGV4T2Yob2JqKTtcbiAgICBpZiAobG9va3VwICE9PSAtMSkge1xuICAgICAgICByZXR1cm4gcmVmc1tsb29rdXBdO1xuICAgIH1cblxuICAgIHJlZnMucHVzaChvYmopO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgICAgICB2YXIgY29tcGFjdGVkID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChvYmpbaV0gJiYgdHlwZW9mIG9ialtpXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBjb21wYWN0ZWQucHVzaChleHBvcnRzLmNvbXBhY3Qob2JqW2ldLCByZWZzKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmpbaV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgY29tcGFjdGVkLnB1c2gob2JqW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb21wYWN0ZWQ7XG4gICAgfVxuXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIG9ialtrZXldID0gZXhwb3J0cy5jb21wYWN0KG9ialtrZXldLCByZWZzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBvYmo7XG59O1xuXG5leHBvcnRzLmlzUmVnRXhwID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59O1xuXG5leHBvcnRzLmlzQnVmZmVyID0gZnVuY3Rpb24gKG9iaikge1xuICAgIGlmIChvYmogPT09IG51bGwgfHwgdHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiAhIShvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyICYmIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlcihvYmopKTtcbn07XG4iLCIvKiFcbiAgKiBSZXF3ZXN0ISBBIGdlbmVyYWwgcHVycG9zZSBYSFIgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICogbGljZW5zZSBNSVQgKGMpIER1c3RpbiBEaWF6IDIwMTVcbiAgKiBodHRwczovL2dpdGh1Yi5jb20vZGVkL3JlcXdlc3RcbiAgKi9cblxuIWZ1bmN0aW9uIChuYW1lLCBjb250ZXh0LCBkZWZpbml0aW9uKSB7XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKVxuICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGRlZmluaXRpb24pXG4gIGVsc2UgY29udGV4dFtuYW1lXSA9IGRlZmluaXRpb24oKVxufSgncmVxd2VzdCcsIHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuICB2YXIgY29udGV4dCA9IHRoaXNcblxuICBpZiAoJ3dpbmRvdycgaW4gY29udGV4dCkge1xuICAgIHZhciBkb2MgPSBkb2N1bWVudFxuICAgICAgLCBieVRhZyA9ICdnZXRFbGVtZW50c0J5VGFnTmFtZSdcbiAgICAgICwgaGVhZCA9IGRvY1tieVRhZ10oJ2hlYWQnKVswXVxuICB9IGVsc2Uge1xuICAgIHZhciBYSFIyXG4gICAgdHJ5IHtcbiAgICAgIFhIUjIgPSByZXF1aXJlKCd4aHIyJylcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQZWVyIGRlcGVuZGVuY3kgYHhocjJgIHJlcXVpcmVkISBQbGVhc2UgbnBtIGluc3RhbGwgeGhyMicpXG4gICAgfVxuICB9XG5cblxuICB2YXIgaHR0cHNSZSA9IC9eaHR0cC9cbiAgICAsIHByb3RvY29sUmUgPSAvKF5cXHcrKTpcXC9cXC8vXG4gICAgLCB0d29IdW5kbyA9IC9eKDIwXFxkfDEyMjMpJC8gLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwMDQ2OTcyL21zaWUtcmV0dXJucy1zdGF0dXMtY29kZS1vZi0xMjIzLWZvci1hamF4LXJlcXVlc3RcbiAgICAsIHJlYWR5U3RhdGUgPSAncmVhZHlTdGF0ZSdcbiAgICAsIGNvbnRlbnRUeXBlID0gJ0NvbnRlbnQtVHlwZSdcbiAgICAsIHJlcXVlc3RlZFdpdGggPSAnWC1SZXF1ZXN0ZWQtV2l0aCdcbiAgICAsIHVuaXFpZCA9IDBcbiAgICAsIGNhbGxiYWNrUHJlZml4ID0gJ3JlcXdlc3RfJyArICgrbmV3IERhdGUoKSlcbiAgICAsIGxhc3RWYWx1ZSAvLyBkYXRhIHN0b3JlZCBieSB0aGUgbW9zdCByZWNlbnQgSlNPTlAgY2FsbGJhY2tcbiAgICAsIHhtbEh0dHBSZXF1ZXN0ID0gJ1hNTEh0dHBSZXF1ZXN0J1xuICAgICwgeERvbWFpblJlcXVlc3QgPSAnWERvbWFpblJlcXVlc3QnXG4gICAgLCBub29wID0gZnVuY3Rpb24gKCkge31cblxuICAgICwgaXNBcnJheSA9IHR5cGVvZiBBcnJheS5pc0FycmF5ID09ICdmdW5jdGlvbidcbiAgICAgICAgPyBBcnJheS5pc0FycmF5XG4gICAgICAgIDogZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgIHJldHVybiBhIGluc3RhbmNlb2YgQXJyYXlcbiAgICAgICAgICB9XG5cbiAgICAsIGRlZmF1bHRIZWFkZXJzID0ge1xuICAgICAgICAgICdjb250ZW50VHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXG4gICAgICAgICwgJ3JlcXVlc3RlZFdpdGgnOiB4bWxIdHRwUmVxdWVzdFxuICAgICAgICAsICdhY2NlcHQnOiB7XG4gICAgICAgICAgICAgICcqJzogICd0ZXh0L2phdmFzY3JpcHQsIHRleHQvaHRtbCwgYXBwbGljYXRpb24veG1sLCB0ZXh0L3htbCwgKi8qJ1xuICAgICAgICAgICAgLCAneG1sJzogICdhcHBsaWNhdGlvbi94bWwsIHRleHQveG1sJ1xuICAgICAgICAgICAgLCAnaHRtbCc6ICd0ZXh0L2h0bWwnXG4gICAgICAgICAgICAsICd0ZXh0JzogJ3RleHQvcGxhaW4nXG4gICAgICAgICAgICAsICdqc29uJzogJ2FwcGxpY2F0aW9uL2pzb24sIHRleHQvamF2YXNjcmlwdCdcbiAgICAgICAgICAgICwgJ2pzJzogICAnYXBwbGljYXRpb24vamF2YXNjcmlwdCwgdGV4dC9qYXZhc2NyaXB0J1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICwgeGhyID0gZnVuY3Rpb24obykge1xuICAgICAgICAvLyBpcyBpdCB4LWRvbWFpblxuICAgICAgICBpZiAob1snY3Jvc3NPcmlnaW4nXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHZhciB4aHIgPSBjb250ZXh0W3htbEh0dHBSZXF1ZXN0XSA/IG5ldyBYTUxIdHRwUmVxdWVzdCgpIDogbnVsbFxuICAgICAgICAgIGlmICh4aHIgJiYgJ3dpdGhDcmVkZW50aWFscycgaW4geGhyKSB7XG4gICAgICAgICAgICByZXR1cm4geGhyXG4gICAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0W3hEb21haW5SZXF1ZXN0XSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYRG9tYWluUmVxdWVzdCgpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGNyb3NzLW9yaWdpbiByZXF1ZXN0cycpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHRbeG1sSHR0cFJlcXVlc3RdKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBYTUxIdHRwUmVxdWVzdCgpXG4gICAgICAgIH0gZWxzZSBpZiAoWEhSMikge1xuICAgICAgICAgIHJldHVybiBuZXcgWEhSMigpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MSFRUUCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAsIGdsb2JhbFNldHVwT3B0aW9ucyA9IHtcbiAgICAgICAgZGF0YUZpbHRlcjogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgZnVuY3Rpb24gc3VjY2VlZChyKSB7XG4gICAgdmFyIHByb3RvY29sID0gcHJvdG9jb2xSZS5leGVjKHIudXJsKVxuICAgIHByb3RvY29sID0gKHByb3RvY29sICYmIHByb3RvY29sWzFdKSB8fCBjb250ZXh0LmxvY2F0aW9uLnByb3RvY29sXG4gICAgcmV0dXJuIGh0dHBzUmUudGVzdChwcm90b2NvbCkgPyB0d29IdW5kby50ZXN0KHIucmVxdWVzdC5zdGF0dXMpIDogISFyLnJlcXVlc3QucmVzcG9uc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVJlYWR5U3RhdGUociwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgLy8gdXNlIF9hYm9ydGVkIHRvIG1pdGlnYXRlIGFnYWluc3QgSUUgZXJyIGMwMGMwMjNmXG4gICAgICAvLyAoY2FuJ3QgcmVhZCBwcm9wcyBvbiBhYm9ydGVkIHJlcXVlc3Qgb2JqZWN0cylcbiAgICAgIGlmIChyLl9hYm9ydGVkKSByZXR1cm4gZXJyb3Ioci5yZXF1ZXN0KVxuICAgICAgaWYgKHIuX3RpbWVkT3V0KSByZXR1cm4gZXJyb3Ioci5yZXF1ZXN0LCAnUmVxdWVzdCBpcyBhYm9ydGVkOiB0aW1lb3V0JylcbiAgICAgIGlmIChyLnJlcXVlc3QgJiYgci5yZXF1ZXN0W3JlYWR5U3RhdGVdID09IDQpIHtcbiAgICAgICAgci5yZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG5vb3BcbiAgICAgICAgaWYgKHN1Y2NlZWQocikpIHN1Y2Nlc3Moci5yZXF1ZXN0KVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZXJyb3Ioci5yZXF1ZXN0KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEhlYWRlcnMoaHR0cCwgbykge1xuICAgIHZhciBoZWFkZXJzID0gb1snaGVhZGVycyddIHx8IHt9XG4gICAgICAsIGhcblxuICAgIGhlYWRlcnNbJ0FjY2VwdCddID0gaGVhZGVyc1snQWNjZXB0J11cbiAgICAgIHx8IGRlZmF1bHRIZWFkZXJzWydhY2NlcHQnXVtvWyd0eXBlJ11dXG4gICAgICB8fCBkZWZhdWx0SGVhZGVyc1snYWNjZXB0J11bJyonXVxuXG4gICAgdmFyIGlzQUZvcm1EYXRhID0gdHlwZW9mIEZvcm1EYXRhICE9PSAndW5kZWZpbmVkJyAmJiAob1snZGF0YSddIGluc3RhbmNlb2YgRm9ybURhdGEpO1xuICAgIC8vIGJyZWFrcyBjcm9zcy1vcmlnaW4gcmVxdWVzdHMgd2l0aCBsZWdhY3kgYnJvd3NlcnNcbiAgICBpZiAoIW9bJ2Nyb3NzT3JpZ2luJ10gJiYgIWhlYWRlcnNbcmVxdWVzdGVkV2l0aF0pIGhlYWRlcnNbcmVxdWVzdGVkV2l0aF0gPSBkZWZhdWx0SGVhZGVyc1sncmVxdWVzdGVkV2l0aCddXG4gICAgaWYgKCFoZWFkZXJzW2NvbnRlbnRUeXBlXSAmJiAhaXNBRm9ybURhdGEpIGhlYWRlcnNbY29udGVudFR5cGVdID0gb1snY29udGVudFR5cGUnXSB8fCBkZWZhdWx0SGVhZGVyc1snY29udGVudFR5cGUnXVxuICAgIGZvciAoaCBpbiBoZWFkZXJzKVxuICAgICAgaGVhZGVycy5oYXNPd25Qcm9wZXJ0eShoKSAmJiAnc2V0UmVxdWVzdEhlYWRlcicgaW4gaHR0cCAmJiBodHRwLnNldFJlcXVlc3RIZWFkZXIoaCwgaGVhZGVyc1toXSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldENyZWRlbnRpYWxzKGh0dHAsIG8pIHtcbiAgICBpZiAodHlwZW9mIG9bJ3dpdGhDcmVkZW50aWFscyddICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgaHR0cC53aXRoQ3JlZGVudGlhbHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBodHRwLndpdGhDcmVkZW50aWFscyA9ICEhb1snd2l0aENyZWRlbnRpYWxzJ11cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZW5lcmFsQ2FsbGJhY2soZGF0YSkge1xuICAgIGxhc3RWYWx1ZSA9IGRhdGFcbiAgfVxuXG4gIGZ1bmN0aW9uIHVybGFwcGVuZCAodXJsLCBzKSB7XG4gICAgcmV0dXJuIHVybCArICgvXFw/Ly50ZXN0KHVybCkgPyAnJicgOiAnPycpICsgc1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlSnNvbnAobywgZm4sIGVyciwgdXJsKSB7XG4gICAgdmFyIHJlcUlkID0gdW5pcWlkKytcbiAgICAgICwgY2JrZXkgPSBvWydqc29ucENhbGxiYWNrJ10gfHwgJ2NhbGxiYWNrJyAvLyB0aGUgJ2NhbGxiYWNrJyBrZXlcbiAgICAgICwgY2J2YWwgPSBvWydqc29ucENhbGxiYWNrTmFtZSddIHx8IHJlcXdlc3QuZ2V0Y2FsbGJhY2tQcmVmaXgocmVxSWQpXG4gICAgICAsIGNicmVnID0gbmV3IFJlZ0V4cCgnKChefFxcXFw/fCYpJyArIGNia2V5ICsgJyk9KFteJl0rKScpXG4gICAgICAsIG1hdGNoID0gdXJsLm1hdGNoKGNicmVnKVxuICAgICAgLCBzY3JpcHQgPSBkb2MuY3JlYXRlRWxlbWVudCgnc2NyaXB0JylcbiAgICAgICwgbG9hZGVkID0gMFxuICAgICAgLCBpc0lFMTAgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ01TSUUgMTAuMCcpICE9PSAtMVxuXG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICBpZiAobWF0Y2hbM10gPT09ICc/Jykge1xuICAgICAgICB1cmwgPSB1cmwucmVwbGFjZShjYnJlZywgJyQxPScgKyBjYnZhbCkgLy8gd2lsZGNhcmQgY2FsbGJhY2sgZnVuYyBuYW1lXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYnZhbCA9IG1hdGNoWzNdIC8vIHByb3ZpZGVkIGNhbGxiYWNrIGZ1bmMgbmFtZVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB1cmwgPSB1cmxhcHBlbmQodXJsLCBjYmtleSArICc9JyArIGNidmFsKSAvLyBubyBjYWxsYmFjayBkZXRhaWxzLCBhZGQgJ2VtXG4gICAgfVxuXG4gICAgY29udGV4dFtjYnZhbF0gPSBnZW5lcmFsQ2FsbGJhY2tcblxuICAgIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCdcbiAgICBzY3JpcHQuc3JjID0gdXJsXG4gICAgc2NyaXB0LmFzeW5jID0gdHJ1ZVxuICAgIGlmICh0eXBlb2Ygc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSAhPT0gJ3VuZGVmaW5lZCcgJiYgIWlzSUUxMCkge1xuICAgICAgLy8gbmVlZCB0aGlzIGZvciBJRSBkdWUgdG8gb3V0LW9mLW9yZGVyIG9ucmVhZHlzdGF0ZWNoYW5nZSgpLCBiaW5kaW5nIHNjcmlwdFxuICAgICAgLy8gZXhlY3V0aW9uIHRvIGFuIGV2ZW50IGxpc3RlbmVyIGdpdmVzIHVzIGNvbnRyb2wgb3ZlciB3aGVuIHRoZSBzY3JpcHRcbiAgICAgIC8vIGlzIGV4ZWN1dGVkLiBTZWUgaHR0cDovL2phdWJvdXJnLm5ldC8yMDEwLzA3L2xvYWRpbmctc2NyaXB0LWFzLW9uY2xpY2staGFuZGxlci1vZi5odG1sXG4gICAgICBzY3JpcHQuaHRtbEZvciA9IHNjcmlwdC5pZCA9ICdfcmVxd2VzdF8nICsgcmVxSWRcbiAgICB9XG5cbiAgICBzY3JpcHQub25sb2FkID0gc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgoc2NyaXB0W3JlYWR5U3RhdGVdICYmIHNjcmlwdFtyZWFkeVN0YXRlXSAhPT0gJ2NvbXBsZXRlJyAmJiBzY3JpcHRbcmVhZHlTdGF0ZV0gIT09ICdsb2FkZWQnKSB8fCBsb2FkZWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBzY3JpcHQub25sb2FkID0gc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGxcbiAgICAgIHNjcmlwdC5vbmNsaWNrICYmIHNjcmlwdC5vbmNsaWNrKClcbiAgICAgIC8vIENhbGwgdGhlIHVzZXIgY2FsbGJhY2sgd2l0aCB0aGUgbGFzdCB2YWx1ZSBzdG9yZWQgYW5kIGNsZWFuIHVwIHZhbHVlcyBhbmQgc2NyaXB0cy5cbiAgICAgIGZuKGxhc3RWYWx1ZSlcbiAgICAgIGxhc3RWYWx1ZSA9IHVuZGVmaW5lZFxuICAgICAgaGVhZC5yZW1vdmVDaGlsZChzY3JpcHQpXG4gICAgICBsb2FkZWQgPSAxXG4gICAgfVxuXG4gICAgLy8gQWRkIHRoZSBzY3JpcHQgdG8gdGhlIERPTSBoZWFkXG4gICAgaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpXG5cbiAgICAvLyBFbmFibGUgSlNPTlAgdGltZW91dFxuICAgIHJldHVybiB7XG4gICAgICBhYm9ydDogZnVuY3Rpb24gKCkge1xuICAgICAgICBzY3JpcHQub25sb2FkID0gc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGxcbiAgICAgICAgZXJyKHt9LCAnUmVxdWVzdCBpcyBhYm9ydGVkOiB0aW1lb3V0Jywge30pXG4gICAgICAgIGxhc3RWYWx1ZSA9IHVuZGVmaW5lZFxuICAgICAgICBoZWFkLnJlbW92ZUNoaWxkKHNjcmlwdClcbiAgICAgICAgbG9hZGVkID0gMVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJlcXVlc3QoZm4sIGVycikge1xuICAgIHZhciBvID0gdGhpcy5vXG4gICAgICAsIG1ldGhvZCA9IChvWydtZXRob2QnXSB8fCAnR0VUJykudG9VcHBlckNhc2UoKVxuICAgICAgLCB1cmwgPSB0eXBlb2YgbyA9PT0gJ3N0cmluZycgPyBvIDogb1sndXJsJ11cbiAgICAgIC8vIGNvbnZlcnQgbm9uLXN0cmluZyBvYmplY3RzIHRvIHF1ZXJ5LXN0cmluZyBmb3JtIHVubGVzcyBvWydwcm9jZXNzRGF0YSddIGlzIGZhbHNlXG4gICAgICAsIGRhdGEgPSAob1sncHJvY2Vzc0RhdGEnXSAhPT0gZmFsc2UgJiYgb1snZGF0YSddICYmIHR5cGVvZiBvWydkYXRhJ10gIT09ICdzdHJpbmcnKVxuICAgICAgICA/IHJlcXdlc3QudG9RdWVyeVN0cmluZyhvWydkYXRhJ10pXG4gICAgICAgIDogKG9bJ2RhdGEnXSB8fCBudWxsKVxuICAgICAgLCBodHRwXG4gICAgICAsIHNlbmRXYWl0ID0gZmFsc2VcblxuICAgIC8vIGlmIHdlJ3JlIHdvcmtpbmcgb24gYSBHRVQgcmVxdWVzdCBhbmQgd2UgaGF2ZSBkYXRhIHRoZW4gd2Ugc2hvdWxkIGFwcGVuZFxuICAgIC8vIHF1ZXJ5IHN0cmluZyB0byBlbmQgb2YgVVJMIGFuZCBub3QgcG9zdCBkYXRhXG4gICAgaWYgKChvWyd0eXBlJ10gPT0gJ2pzb25wJyB8fCBtZXRob2QgPT0gJ0dFVCcpICYmIGRhdGEpIHtcbiAgICAgIHVybCA9IHVybGFwcGVuZCh1cmwsIGRhdGEpXG4gICAgICBkYXRhID0gbnVsbFxuICAgIH1cblxuICAgIGlmIChvWyd0eXBlJ10gPT0gJ2pzb25wJykgcmV0dXJuIGhhbmRsZUpzb25wKG8sIGZuLCBlcnIsIHVybClcblxuICAgIC8vIGdldCB0aGUgeGhyIGZyb20gdGhlIGZhY3RvcnkgaWYgcGFzc2VkXG4gICAgLy8gaWYgdGhlIGZhY3RvcnkgcmV0dXJucyBudWxsLCBmYWxsLWJhY2sgdG8gb3Vyc1xuICAgIGh0dHAgPSAoby54aHIgJiYgby54aHIobykpIHx8IHhocihvKVxuXG4gICAgaHR0cC5vcGVuKG1ldGhvZCwgdXJsLCBvWydhc3luYyddID09PSBmYWxzZSA/IGZhbHNlIDogdHJ1ZSlcbiAgICBzZXRIZWFkZXJzKGh0dHAsIG8pXG4gICAgc2V0Q3JlZGVudGlhbHMoaHR0cCwgbylcbiAgICBpZiAoY29udGV4dFt4RG9tYWluUmVxdWVzdF0gJiYgaHR0cCBpbnN0YW5jZW9mIGNvbnRleHRbeERvbWFpblJlcXVlc3RdKSB7XG4gICAgICAgIGh0dHAub25sb2FkID0gZm5cbiAgICAgICAgaHR0cC5vbmVycm9yID0gZXJyXG4gICAgICAgIC8vIE5PVEU6IHNlZVxuICAgICAgICAvLyBodHRwOi8vc29jaWFsLm1zZG4ubWljcm9zb2Z0LmNvbS9Gb3J1bXMvZW4tVVMvaWV3ZWJkZXZlbG9wbWVudC90aHJlYWQvMzBlZjNhZGQtNzY3Yy00NDM2LWI4YTktZjFjYTE5YjQ4MTJlXG4gICAgICAgIGh0dHAub25wcm9ncmVzcyA9IGZ1bmN0aW9uKCkge31cbiAgICAgICAgc2VuZFdhaXQgPSB0cnVlXG4gICAgfSBlbHNlIHtcbiAgICAgIGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gaGFuZGxlUmVhZHlTdGF0ZSh0aGlzLCBmbiwgZXJyKVxuICAgIH1cbiAgICBvWydiZWZvcmUnXSAmJiBvWydiZWZvcmUnXShodHRwKVxuICAgIGlmIChzZW5kV2FpdCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGh0dHAuc2VuZChkYXRhKVxuICAgICAgfSwgMjAwKVxuICAgIH0gZWxzZSB7XG4gICAgICBodHRwLnNlbmQoZGF0YSlcbiAgICB9XG4gICAgcmV0dXJuIGh0dHBcbiAgfVxuXG4gIGZ1bmN0aW9uIFJlcXdlc3QobywgZm4pIHtcbiAgICB0aGlzLm8gPSBvXG4gICAgdGhpcy5mbiA9IGZuXG5cbiAgICBpbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFR5cGUoaGVhZGVyKSB7XG4gICAgLy8ganNvbiwgamF2YXNjcmlwdCwgdGV4dC9wbGFpbiwgdGV4dC9odG1sLCB4bWxcbiAgICBpZiAoaGVhZGVyID09PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkOyAvL0luIGNhc2Ugb2Ygbm8gY29udGVudC10eXBlLlxuICAgIGlmIChoZWFkZXIubWF0Y2goJ2pzb24nKSkgcmV0dXJuICdqc29uJ1xuICAgIGlmIChoZWFkZXIubWF0Y2goJ2phdmFzY3JpcHQnKSkgcmV0dXJuICdqcydcbiAgICBpZiAoaGVhZGVyLm1hdGNoKCd0ZXh0JykpIHJldHVybiAnaHRtbCdcbiAgICBpZiAoaGVhZGVyLm1hdGNoKCd4bWwnKSkgcmV0dXJuICd4bWwnXG4gIH1cblxuICBmdW5jdGlvbiBpbml0KG8sIGZuKSB7XG5cbiAgICB0aGlzLnVybCA9IHR5cGVvZiBvID09ICdzdHJpbmcnID8gbyA6IG9bJ3VybCddXG4gICAgdGhpcy50aW1lb3V0ID0gbnVsbFxuXG4gICAgLy8gd2hldGhlciByZXF1ZXN0IGhhcyBiZWVuIGZ1bGZpbGxlZCBmb3IgcHVycG9zZVxuICAgIC8vIG9mIHRyYWNraW5nIHRoZSBQcm9taXNlc1xuICAgIHRoaXMuX2Z1bGZpbGxlZCA9IGZhbHNlXG4gICAgLy8gc3VjY2VzcyBoYW5kbGVyc1xuICAgIHRoaXMuX3N1Y2Nlc3NIYW5kbGVyID0gZnVuY3Rpb24oKXt9XG4gICAgdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVycyA9IFtdXG4gICAgLy8gZXJyb3IgaGFuZGxlcnNcbiAgICB0aGlzLl9lcnJvckhhbmRsZXJzID0gW11cbiAgICAvLyBjb21wbGV0ZSAoYm90aCBzdWNjZXNzIGFuZCBmYWlsKSBoYW5kbGVyc1xuICAgIHRoaXMuX2NvbXBsZXRlSGFuZGxlcnMgPSBbXVxuICAgIHRoaXMuX2VycmVkID0gZmFsc2VcbiAgICB0aGlzLl9yZXNwb25zZUFyZ3MgPSB7fVxuXG4gICAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgICBmbiA9IGZuIHx8IGZ1bmN0aW9uICgpIHt9XG5cbiAgICBpZiAob1sndGltZW91dCddKSB7XG4gICAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGltZWRPdXQoKVxuICAgICAgfSwgb1sndGltZW91dCddKVxuICAgIH1cblxuICAgIGlmIChvWydzdWNjZXNzJ10pIHtcbiAgICAgIHRoaXMuX3N1Y2Nlc3NIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBvWydzdWNjZXNzJ10uYXBwbHkobywgYXJndW1lbnRzKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvWydlcnJvciddKSB7XG4gICAgICB0aGlzLl9lcnJvckhhbmRsZXJzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICBvWydlcnJvciddLmFwcGx5KG8sIGFyZ3VtZW50cylcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKG9bJ2NvbXBsZXRlJ10pIHtcbiAgICAgIHRoaXMuX2NvbXBsZXRlSGFuZGxlcnMucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9bJ2NvbXBsZXRlJ10uYXBwbHkobywgYXJndW1lbnRzKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wbGV0ZSAocmVzcCkge1xuICAgICAgb1sndGltZW91dCddICYmIGNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpXG4gICAgICBzZWxmLnRpbWVvdXQgPSBudWxsXG4gICAgICB3aGlsZSAoc2VsZi5fY29tcGxldGVIYW5kbGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNlbGYuX2NvbXBsZXRlSGFuZGxlcnMuc2hpZnQoKShyZXNwKVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MgKHJlc3ApIHtcbiAgICAgIHZhciB0eXBlID0gb1sndHlwZSddIHx8IHJlc3AgJiYgc2V0VHlwZShyZXNwLmdldFJlc3BvbnNlSGVhZGVyKCdDb250ZW50LVR5cGUnKSkgLy8gcmVzcCBjYW4gYmUgdW5kZWZpbmVkIGluIElFXG4gICAgICByZXNwID0gKHR5cGUgIT09ICdqc29ucCcpID8gc2VsZi5yZXF1ZXN0IDogcmVzcFxuICAgICAgLy8gdXNlIGdsb2JhbCBkYXRhIGZpbHRlciBvbiByZXNwb25zZSB0ZXh0XG4gICAgICB2YXIgZmlsdGVyZWRSZXNwb25zZSA9IGdsb2JhbFNldHVwT3B0aW9ucy5kYXRhRmlsdGVyKHJlc3AucmVzcG9uc2VUZXh0LCB0eXBlKVxuICAgICAgICAsIHIgPSBmaWx0ZXJlZFJlc3BvbnNlXG4gICAgICB0cnkge1xuICAgICAgICByZXNwLnJlc3BvbnNlVGV4dCA9IHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gY2FuJ3QgYXNzaWduIHRoaXMgaW4gSUU8PTgsIGp1c3QgaWdub3JlXG4gICAgICB9XG4gICAgICBpZiAocikge1xuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnanNvbic6XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3AgPSBjb250ZXh0LkpTT04gPyBjb250ZXh0LkpTT04ucGFyc2UocikgOiBldmFsKCcoJyArIHIgKyAnKScpXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3IocmVzcCwgJ0NvdWxkIG5vdCBwYXJzZSBKU09OIGluIHJlc3BvbnNlJywgZXJyKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdqcyc6XG4gICAgICAgICAgcmVzcCA9IGV2YWwocilcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdodG1sJzpcbiAgICAgICAgICByZXNwID0gclxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ3htbCc6XG4gICAgICAgICAgcmVzcCA9IHJlc3AucmVzcG9uc2VYTUxcbiAgICAgICAgICAgICAgJiYgcmVzcC5yZXNwb25zZVhNTC5wYXJzZUVycm9yIC8vIElFIHRyb2xvbG9cbiAgICAgICAgICAgICAgJiYgcmVzcC5yZXNwb25zZVhNTC5wYXJzZUVycm9yLmVycm9yQ29kZVxuICAgICAgICAgICAgICAmJiByZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3IucmVhc29uXG4gICAgICAgICAgICA/IG51bGxcbiAgICAgICAgICAgIDogcmVzcC5yZXNwb25zZVhNTFxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5fcmVzcG9uc2VBcmdzLnJlc3AgPSByZXNwXG4gICAgICBzZWxmLl9mdWxmaWxsZWQgPSB0cnVlXG4gICAgICBmbihyZXNwKVxuICAgICAgc2VsZi5fc3VjY2Vzc0hhbmRsZXIocmVzcClcbiAgICAgIHdoaWxlIChzZWxmLl9mdWxmaWxsbWVudEhhbmRsZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVzcCA9IHNlbGYuX2Z1bGZpbGxtZW50SGFuZGxlcnMuc2hpZnQoKShyZXNwKVxuICAgICAgfVxuXG4gICAgICBjb21wbGV0ZShyZXNwKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRpbWVkT3V0KCkge1xuICAgICAgc2VsZi5fdGltZWRPdXQgPSB0cnVlXG4gICAgICBzZWxmLnJlcXVlc3QuYWJvcnQoKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKHJlc3AsIG1zZywgdCkge1xuICAgICAgcmVzcCA9IHNlbGYucmVxdWVzdFxuICAgICAgc2VsZi5fcmVzcG9uc2VBcmdzLnJlc3AgPSByZXNwXG4gICAgICBzZWxmLl9yZXNwb25zZUFyZ3MubXNnID0gbXNnXG4gICAgICBzZWxmLl9yZXNwb25zZUFyZ3MudCA9IHRcbiAgICAgIHNlbGYuX2VycmVkID0gdHJ1ZVxuICAgICAgd2hpbGUgKHNlbGYuX2Vycm9ySGFuZGxlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBzZWxmLl9lcnJvckhhbmRsZXJzLnNoaWZ0KCkocmVzcCwgbXNnLCB0KVxuICAgICAgfVxuICAgICAgY29tcGxldGUocmVzcClcbiAgICB9XG5cbiAgICB0aGlzLnJlcXVlc3QgPSBnZXRSZXF1ZXN0LmNhbGwodGhpcywgc3VjY2VzcywgZXJyb3IpXG4gIH1cblxuICBSZXF3ZXN0LnByb3RvdHlwZSA9IHtcbiAgICBhYm9ydDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5fYWJvcnRlZCA9IHRydWVcbiAgICAgIHRoaXMucmVxdWVzdC5hYm9ydCgpXG4gICAgfVxuXG4gICwgcmV0cnk6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGluaXQuY2FsbCh0aGlzLCB0aGlzLm8sIHRoaXMuZm4pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU21hbGwgZGV2aWF0aW9uIGZyb20gdGhlIFByb21pc2VzIEEgQ29tbW9uSnMgc3BlY2lmaWNhdGlvblxuICAgICAqIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1Byb21pc2VzL0FcbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIGB0aGVuYCB3aWxsIGV4ZWN1dGUgdXBvbiBzdWNjZXNzZnVsIHJlcXVlc3RzXG4gICAgICovXG4gICwgdGhlbjogZnVuY3Rpb24gKHN1Y2Nlc3MsIGZhaWwpIHtcbiAgICAgIHN1Y2Nlc3MgPSBzdWNjZXNzIHx8IGZ1bmN0aW9uICgpIHt9XG4gICAgICBmYWlsID0gZmFpbCB8fCBmdW5jdGlvbiAoKSB7fVxuICAgICAgaWYgKHRoaXMuX2Z1bGZpbGxlZCkge1xuICAgICAgICB0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCA9IHN1Y2Nlc3ModGhpcy5fcmVzcG9uc2VBcmdzLnJlc3ApXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2VycmVkKSB7XG4gICAgICAgIGZhaWwodGhpcy5fcmVzcG9uc2VBcmdzLnJlc3AsIHRoaXMuX3Jlc3BvbnNlQXJncy5tc2csIHRoaXMuX3Jlc3BvbnNlQXJncy50KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVycy5wdXNoKHN1Y2Nlc3MpXG4gICAgICAgIHRoaXMuX2Vycm9ySGFuZGxlcnMucHVzaChmYWlsKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBgYWx3YXlzYCB3aWxsIGV4ZWN1dGUgd2hldGhlciB0aGUgcmVxdWVzdCBzdWNjZWVkcyBvciBmYWlsc1xuICAgICAqL1xuICAsIGFsd2F5czogZnVuY3Rpb24gKGZuKSB7XG4gICAgICBpZiAodGhpcy5fZnVsZmlsbGVkIHx8IHRoaXMuX2VycmVkKSB7XG4gICAgICAgIGZuKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fY29tcGxldGVIYW5kbGVycy5wdXNoKGZuKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBgZmFpbGAgd2lsbCBleGVjdXRlIHdoZW4gdGhlIHJlcXVlc3QgZmFpbHNcbiAgICAgKi9cbiAgLCBmYWlsOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIGlmICh0aGlzLl9lcnJlZCkge1xuICAgICAgICBmbih0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCwgdGhpcy5fcmVzcG9uc2VBcmdzLm1zZywgdGhpcy5fcmVzcG9uc2VBcmdzLnQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9lcnJvckhhbmRsZXJzLnB1c2goZm4pXG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgLCAnY2F0Y2gnOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHJldHVybiB0aGlzLmZhaWwoZm4pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVxd2VzdChvLCBmbikge1xuICAgIHJldHVybiBuZXcgUmVxd2VzdChvLCBmbilcbiAgfVxuXG4gIC8vIG5vcm1hbGl6ZSBuZXdsaW5lIHZhcmlhbnRzIGFjY29yZGluZyB0byBzcGVjIC0+IENSTEZcbiAgZnVuY3Rpb24gbm9ybWFsaXplKHMpIHtcbiAgICByZXR1cm4gcyA/IHMucmVwbGFjZSgvXFxyP1xcbi9nLCAnXFxyXFxuJykgOiAnJ1xuICB9XG5cbiAgZnVuY3Rpb24gc2VyaWFsKGVsLCBjYikge1xuICAgIHZhciBuID0gZWwubmFtZVxuICAgICAgLCB0ID0gZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAsIG9wdENiID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICAvLyBJRSBnaXZlcyB2YWx1ZT1cIlwiIGV2ZW4gd2hlcmUgdGhlcmUgaXMgbm8gdmFsdWUgYXR0cmlidXRlXG4gICAgICAgICAgLy8gJ3NwZWNpZmllZCcgcmVmOiBodHRwOi8vd3d3LnczLm9yZy9UUi9ET00tTGV2ZWwtMy1Db3JlL2NvcmUuaHRtbCNJRC04NjI1MjkyNzNcbiAgICAgICAgICBpZiAobyAmJiAhb1snZGlzYWJsZWQnXSlcbiAgICAgICAgICAgIGNiKG4sIG5vcm1hbGl6ZShvWydhdHRyaWJ1dGVzJ11bJ3ZhbHVlJ10gJiYgb1snYXR0cmlidXRlcyddWyd2YWx1ZSddWydzcGVjaWZpZWQnXSA/IG9bJ3ZhbHVlJ10gOiBvWyd0ZXh0J10pKVxuICAgICAgICB9XG4gICAgICAsIGNoLCByYSwgdmFsLCBpXG5cbiAgICAvLyBkb24ndCBzZXJpYWxpemUgZWxlbWVudHMgdGhhdCBhcmUgZGlzYWJsZWQgb3Igd2l0aG91dCBhIG5hbWVcbiAgICBpZiAoZWwuZGlzYWJsZWQgfHwgIW4pIHJldHVyblxuXG4gICAgc3dpdGNoICh0KSB7XG4gICAgY2FzZSAnaW5wdXQnOlxuICAgICAgaWYgKCEvcmVzZXR8YnV0dG9ufGltYWdlfGZpbGUvaS50ZXN0KGVsLnR5cGUpKSB7XG4gICAgICAgIGNoID0gL2NoZWNrYm94L2kudGVzdChlbC50eXBlKVxuICAgICAgICByYSA9IC9yYWRpby9pLnRlc3QoZWwudHlwZSlcbiAgICAgICAgdmFsID0gZWwudmFsdWVcbiAgICAgICAgLy8gV2ViS2l0IGdpdmVzIHVzIFwiXCIgaW5zdGVhZCBvZiBcIm9uXCIgaWYgYSBjaGVja2JveCBoYXMgbm8gdmFsdWUsIHNvIGNvcnJlY3QgaXQgaGVyZVxuICAgICAgICA7KCEoY2ggfHwgcmEpIHx8IGVsLmNoZWNrZWQpICYmIGNiKG4sIG5vcm1hbGl6ZShjaCAmJiB2YWwgPT09ICcnID8gJ29uJyA6IHZhbCkpXG4gICAgICB9XG4gICAgICBicmVha1xuICAgIGNhc2UgJ3RleHRhcmVhJzpcbiAgICAgIGNiKG4sIG5vcm1hbGl6ZShlbC52YWx1ZSkpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICBpZiAoZWwudHlwZS50b0xvd2VyQ2FzZSgpID09PSAnc2VsZWN0LW9uZScpIHtcbiAgICAgICAgb3B0Q2IoZWwuc2VsZWN0ZWRJbmRleCA+PSAwID8gZWwub3B0aW9uc1tlbC5zZWxlY3RlZEluZGV4XSA6IG51bGwpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgPSAwOyBlbC5sZW5ndGggJiYgaSA8IGVsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZWwub3B0aW9uc1tpXS5zZWxlY3RlZCAmJiBvcHRDYihlbC5vcHRpb25zW2ldKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIC8vIGNvbGxlY3QgdXAgYWxsIGZvcm0gZWxlbWVudHMgZm91bmQgZnJvbSB0aGUgcGFzc2VkIGFyZ3VtZW50IGVsZW1lbnRzIGFsbFxuICAvLyB0aGUgd2F5IGRvd24gdG8gY2hpbGQgZWxlbWVudHM7IHBhc3MgYSAnPGZvcm0+JyBvciBmb3JtIGZpZWxkcy5cbiAgLy8gY2FsbGVkIHdpdGggJ3RoaXMnPWNhbGxiYWNrIHRvIHVzZSBmb3Igc2VyaWFsKCkgb24gZWFjaCBlbGVtZW50XG4gIGZ1bmN0aW9uIGVhY2hGb3JtRWxlbWVudCgpIHtcbiAgICB2YXIgY2IgPSB0aGlzXG4gICAgICAsIGUsIGlcbiAgICAgICwgc2VyaWFsaXplU3VidGFncyA9IGZ1bmN0aW9uIChlLCB0YWdzKSB7XG4gICAgICAgICAgdmFyIGksIGosIGZhXG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGZhID0gZVtieVRhZ10odGFnc1tpXSlcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBmYS5sZW5ndGg7IGorKykgc2VyaWFsKGZhW2pdLCBjYilcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGUgPSBhcmd1bWVudHNbaV1cbiAgICAgIGlmICgvaW5wdXR8c2VsZWN0fHRleHRhcmVhL2kudGVzdChlLnRhZ05hbWUpKSBzZXJpYWwoZSwgY2IpXG4gICAgICBzZXJpYWxpemVTdWJ0YWdzKGUsIFsgJ2lucHV0JywgJ3NlbGVjdCcsICd0ZXh0YXJlYScgXSlcbiAgICB9XG4gIH1cblxuICAvLyBzdGFuZGFyZCBxdWVyeSBzdHJpbmcgc3R5bGUgc2VyaWFsaXphdGlvblxuICBmdW5jdGlvbiBzZXJpYWxpemVRdWVyeVN0cmluZygpIHtcbiAgICByZXR1cm4gcmVxd2VzdC50b1F1ZXJ5U3RyaW5nKHJlcXdlc3Quc2VyaWFsaXplQXJyYXkuYXBwbHkobnVsbCwgYXJndW1lbnRzKSlcbiAgfVxuXG4gIC8vIHsgJ25hbWUnOiAndmFsdWUnLCAuLi4gfSBzdHlsZSBzZXJpYWxpemF0aW9uXG4gIGZ1bmN0aW9uIHNlcmlhbGl6ZUhhc2goKSB7XG4gICAgdmFyIGhhc2ggPSB7fVxuICAgIGVhY2hGb3JtRWxlbWVudC5hcHBseShmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgIGlmIChuYW1lIGluIGhhc2gpIHtcbiAgICAgICAgaGFzaFtuYW1lXSAmJiAhaXNBcnJheShoYXNoW25hbWVdKSAmJiAoaGFzaFtuYW1lXSA9IFtoYXNoW25hbWVdXSlcbiAgICAgICAgaGFzaFtuYW1lXS5wdXNoKHZhbHVlKVxuICAgICAgfSBlbHNlIGhhc2hbbmFtZV0gPSB2YWx1ZVxuICAgIH0sIGFyZ3VtZW50cylcbiAgICByZXR1cm4gaGFzaFxuICB9XG5cbiAgLy8gWyB7IG5hbWU6ICduYW1lJywgdmFsdWU6ICd2YWx1ZScgfSwgLi4uIF0gc3R5bGUgc2VyaWFsaXphdGlvblxuICByZXF3ZXN0LnNlcmlhbGl6ZUFycmF5ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcnIgPSBbXVxuICAgIGVhY2hGb3JtRWxlbWVudC5hcHBseShmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgIGFyci5wdXNoKHtuYW1lOiBuYW1lLCB2YWx1ZTogdmFsdWV9KVxuICAgIH0sIGFyZ3VtZW50cylcbiAgICByZXR1cm4gYXJyXG4gIH1cblxuICByZXF3ZXN0LnNlcmlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gICAgdmFyIG9wdCwgZm5cbiAgICAgICwgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMClcblxuICAgIG9wdCA9IGFyZ3MucG9wKClcbiAgICBvcHQgJiYgb3B0Lm5vZGVUeXBlICYmIGFyZ3MucHVzaChvcHQpICYmIChvcHQgPSBudWxsKVxuICAgIG9wdCAmJiAob3B0ID0gb3B0LnR5cGUpXG5cbiAgICBpZiAob3B0ID09ICdtYXAnKSBmbiA9IHNlcmlhbGl6ZUhhc2hcbiAgICBlbHNlIGlmIChvcHQgPT0gJ2FycmF5JykgZm4gPSByZXF3ZXN0LnNlcmlhbGl6ZUFycmF5XG4gICAgZWxzZSBmbiA9IHNlcmlhbGl6ZVF1ZXJ5U3RyaW5nXG5cbiAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncylcbiAgfVxuXG4gIHJlcXdlc3QudG9RdWVyeVN0cmluZyA9IGZ1bmN0aW9uIChvLCB0cmFkKSB7XG4gICAgdmFyIHByZWZpeCwgaVxuICAgICAgLCB0cmFkaXRpb25hbCA9IHRyYWQgfHwgZmFsc2VcbiAgICAgICwgcyA9IFtdXG4gICAgICAsIGVuYyA9IGVuY29kZVVSSUNvbXBvbmVudFxuICAgICAgLCBhZGQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgIC8vIElmIHZhbHVlIGlzIGEgZnVuY3Rpb24sIGludm9rZSBpdCBhbmQgcmV0dXJuIGl0cyB2YWx1ZVxuICAgICAgICAgIHZhbHVlID0gKCdmdW5jdGlvbicgPT09IHR5cGVvZiB2YWx1ZSkgPyB2YWx1ZSgpIDogKHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlKVxuICAgICAgICAgIHNbcy5sZW5ndGhdID0gZW5jKGtleSkgKyAnPScgKyBlbmModmFsdWUpXG4gICAgICAgIH1cbiAgICAvLyBJZiBhbiBhcnJheSB3YXMgcGFzc2VkIGluLCBhc3N1bWUgdGhhdCBpdCBpcyBhbiBhcnJheSBvZiBmb3JtIGVsZW1lbnRzLlxuICAgIGlmIChpc0FycmF5KG8pKSB7XG4gICAgICBmb3IgKGkgPSAwOyBvICYmIGkgPCBvLmxlbmd0aDsgaSsrKSBhZGQob1tpXVsnbmFtZSddLCBvW2ldWyd2YWx1ZSddKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0cmFkaXRpb25hbCwgZW5jb2RlIHRoZSBcIm9sZFwiIHdheSAodGhlIHdheSAxLjMuMiBvciBvbGRlclxuICAgICAgLy8gZGlkIGl0KSwgb3RoZXJ3aXNlIGVuY29kZSBwYXJhbXMgcmVjdXJzaXZlbHkuXG4gICAgICBmb3IgKHByZWZpeCBpbiBvKSB7XG4gICAgICAgIGlmIChvLmhhc093blByb3BlcnR5KHByZWZpeCkpIGJ1aWxkUGFyYW1zKHByZWZpeCwgb1twcmVmaXhdLCB0cmFkaXRpb25hbCwgYWRkKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNwYWNlcyBzaG91bGQgYmUgKyBhY2NvcmRpbmcgdG8gc3BlY1xuICAgIHJldHVybiBzLmpvaW4oJyYnKS5yZXBsYWNlKC8lMjAvZywgJysnKVxuICB9XG5cbiAgZnVuY3Rpb24gYnVpbGRQYXJhbXMocHJlZml4LCBvYmosIHRyYWRpdGlvbmFsLCBhZGQpIHtcbiAgICB2YXIgbmFtZSwgaSwgdlxuICAgICAgLCByYnJhY2tldCA9IC9cXFtcXF0kL1xuXG4gICAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgICAgLy8gU2VyaWFsaXplIGFycmF5IGl0ZW0uXG4gICAgICBmb3IgKGkgPSAwOyBvYmogJiYgaSA8IG9iai5sZW5ndGg7IGkrKykge1xuICAgICAgICB2ID0gb2JqW2ldXG4gICAgICAgIGlmICh0cmFkaXRpb25hbCB8fCByYnJhY2tldC50ZXN0KHByZWZpeCkpIHtcbiAgICAgICAgICAvLyBUcmVhdCBlYWNoIGFycmF5IGl0ZW0gYXMgYSBzY2FsYXIuXG4gICAgICAgICAgYWRkKHByZWZpeCwgdilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBidWlsZFBhcmFtcyhwcmVmaXggKyAnWycgKyAodHlwZW9mIHYgPT09ICdvYmplY3QnID8gaSA6ICcnKSArICddJywgdiwgdHJhZGl0aW9uYWwsIGFkZClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob2JqICYmIG9iai50b1N0cmluZygpID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgLy8gU2VyaWFsaXplIG9iamVjdCBpdGVtLlxuICAgICAgZm9yIChuYW1lIGluIG9iaikge1xuICAgICAgICBidWlsZFBhcmFtcyhwcmVmaXggKyAnWycgKyBuYW1lICsgJ10nLCBvYmpbbmFtZV0sIHRyYWRpdGlvbmFsLCBhZGQpXG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU2VyaWFsaXplIHNjYWxhciBpdGVtLlxuICAgICAgYWRkKHByZWZpeCwgb2JqKVxuICAgIH1cbiAgfVxuXG4gIHJlcXdlc3QuZ2V0Y2FsbGJhY2tQcmVmaXggPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrUHJlZml4XG4gIH1cblxuICAvLyBqUXVlcnkgYW5kIFplcHRvIGNvbXBhdGliaWxpdHksIGRpZmZlcmVuY2VzIGNhbiBiZSByZW1hcHBlZCBoZXJlIHNvIHlvdSBjYW4gY2FsbFxuICAvLyAuYWpheC5jb21wYXQob3B0aW9ucywgY2FsbGJhY2spXG4gIHJlcXdlc3QuY29tcGF0ID0gZnVuY3Rpb24gKG8sIGZuKSB7XG4gICAgaWYgKG8pIHtcbiAgICAgIG9bJ3R5cGUnXSAmJiAob1snbWV0aG9kJ10gPSBvWyd0eXBlJ10pICYmIGRlbGV0ZSBvWyd0eXBlJ11cbiAgICAgIG9bJ2RhdGFUeXBlJ10gJiYgKG9bJ3R5cGUnXSA9IG9bJ2RhdGFUeXBlJ10pXG4gICAgICBvWydqc29ucENhbGxiYWNrJ10gJiYgKG9bJ2pzb25wQ2FsbGJhY2tOYW1lJ10gPSBvWydqc29ucENhbGxiYWNrJ10pICYmIGRlbGV0ZSBvWydqc29ucENhbGxiYWNrJ11cbiAgICAgIG9bJ2pzb25wJ10gJiYgKG9bJ2pzb25wQ2FsbGJhY2snXSA9IG9bJ2pzb25wJ10pXG4gICAgfVxuICAgIHJldHVybiBuZXcgUmVxd2VzdChvLCBmbilcbiAgfVxuXG4gIHJlcXdlc3QuYWpheFNldHVwID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgIGZvciAodmFyIGsgaW4gb3B0aW9ucykge1xuICAgICAgZ2xvYmFsU2V0dXBPcHRpb25zW2tdID0gb3B0aW9uc1trXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXF3ZXN0XG59KTtcbiIsIlxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHJpbTtcblxuZnVuY3Rpb24gdHJpbShzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMqfFxccyokL2csICcnKTtcbn1cblxuZXhwb3J0cy5sZWZ0ID0gZnVuY3Rpb24oc3RyKXtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzKi8sICcnKTtcbn07XG5cbmV4cG9ydHMucmlnaHQgPSBmdW5jdGlvbihzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xccyokLywgJycpO1xufTtcbiIsInZhciBXaW5DaGFuID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgUkVMQVlfRlJBTUVfTkFNRSA9IFwiX193aW5jaGFuX3JlbGF5X2ZyYW1lXCI7XG4gIHZhciBDTE9TRV9DTUQgPSBcImRpZVwiO1xuXG4gIC8vIGEgcG9ydGFibGUgYWRkTGlzdGVuZXIgaW1wbGVtZW50YXRpb25cbiAgZnVuY3Rpb24gYWRkTGlzdGVuZXIodywgZXZlbnQsIGNiKSB7XG4gICAgaWYody5hdHRhY2hFdmVudCkgdy5hdHRhY2hFdmVudCgnb24nICsgZXZlbnQsIGNiKTtcbiAgICBlbHNlIGlmICh3LmFkZEV2ZW50TGlzdGVuZXIpIHcuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgY2IsIGZhbHNlKTtcbiAgfVxuXG4gIC8vIGEgcG9ydGFibGUgcmVtb3ZlTGlzdGVuZXIgaW1wbGVtZW50YXRpb25cbiAgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIodywgZXZlbnQsIGNiKSB7XG4gICAgaWYody5kZXRhY2hFdmVudCkgdy5kZXRhY2hFdmVudCgnb24nICsgZXZlbnQsIGNiKTtcbiAgICBlbHNlIGlmICh3LnJlbW92ZUV2ZW50TGlzdGVuZXIpIHcucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgY2IsIGZhbHNlKTtcbiAgfVxuXG5cbiAgLy8gY2hlY2tpbmcgZm9yIElFOCBvciBhYm92ZVxuICBmdW5jdGlvbiBpc0ludGVybmV0RXhwbG9yZXIoKSB7XG4gICAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIHJ2ID0gLTE7IC8vIFJldHVybiB2YWx1ZSBhc3N1bWVzIGZhaWx1cmUuXG4gICAgdmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgICBpZiAobmF2aWdhdG9yLmFwcE5hbWUgPT09ICdNaWNyb3NvZnQgSW50ZXJuZXQgRXhwbG9yZXInKSB7XG4gICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiTVNJRSAoWzAtOV17MSx9W1xcLjAtOV17MCx9KVwiKTtcbiAgICAgIGlmIChyZS5leGVjKHVhKSAhPSBudWxsKVxuICAgICAgICBydiA9IHBhcnNlRmxvYXQoUmVnRXhwLiQxKTtcbiAgICB9XG4gICAgLy8gSUUgPiAxMVxuICAgIGVsc2UgaWYgKHVhLmluZGV4T2YoXCJUcmlkZW50XCIpID4gLTEpIHtcbiAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCJydjooWzAtOV17MiwyfVtcXC4wLTldezAsfSlcIik7XG4gICAgICBpZiAocmUuZXhlYyh1YSkgIT09IG51bGwpIHtcbiAgICAgICAgcnYgPSBwYXJzZUZsb2F0KFJlZ0V4cC4kMSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJ2ID49IDg7XG4gIH1cblxuICAvLyBjaGVja2luZyBNb2JpbGUgRmlyZWZveCAoRmVubmVjKVxuICBmdW5jdGlvbiBpc0Zlbm5lYygpIHtcbiAgICB0cnkge1xuICAgICAgLy8gV2UgbXVzdCBjaGVjayBmb3IgYm90aCBYVUwgYW5kIEphdmEgdmVyc2lvbnMgb2YgRmVubmVjLiAgQm90aCBoYXZlXG4gICAgICAvLyBkaXN0aW5jdCBVQSBzdHJpbmdzLlxuICAgICAgdmFyIHVzZXJBZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgICByZXR1cm4gKHVzZXJBZ2VudC5pbmRleE9mKCdGZW5uZWMvJykgIT0gLTEpIHx8ICAvLyBYVUxcbiAgICAgICAgICAgICAodXNlckFnZW50LmluZGV4T2YoJ0ZpcmVmb3gvJykgIT0gLTEgJiYgdXNlckFnZW50LmluZGV4T2YoJ0FuZHJvaWQnKSAhPSAtMSk7ICAgLy8gSmF2YVxuICAgIH0gY2F0Y2goZSkge31cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBmZWF0dXJlIGNoZWNraW5nIHRvIHNlZSBpZiB0aGlzIHBsYXRmb3JtIGlzIHN1cHBvcnRlZCBhdCBhbGxcbiAgZnVuY3Rpb24gaXNTdXBwb3J0ZWQoKSB7XG4gICAgcmV0dXJuICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuSlNPTiAmJiB3aW5kb3cuSlNPTi5zdHJpbmdpZnkgJiZcbiAgICAgICAgICAgIHdpbmRvdy5KU09OLnBhcnNlICYmIHdpbmRvdy5wb3N0TWVzc2FnZSk7XG4gIH1cblxuICAvLyBnaXZlbiBhIFVSTCwgZXh0cmFjdCB0aGUgb3JpZ2luLiBUYWtlbiBmcm9tOiBodHRwczovL2dpdGh1Yi5jb20vZmlyZWJhc2UvZmlyZWJhc2Utc2ltcGxlLWxvZ2luL2Jsb2IvZDJjYjk1YjlmODEyZDg0ODhiZGJmYmE1MWMzYTdjMTUzYmExYTA3NC9qcy9zcmMvc2ltcGxlLWxvZ2luL3RyYW5zcG9ydHMvV2luQ2hhbi5qcyNMMjUtTDMwXG4gIGZ1bmN0aW9uIGV4dHJhY3RPcmlnaW4odXJsKSB7XG4gICAgaWYgKCEvXmh0dHBzPzpcXC9cXC8vLnRlc3QodXJsKSkgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgdmFyIG0gPSAvXihodHRwcz86XFwvXFwvW1xcLV9hLXpBLVpcXC4wLTk6XSspLy5leGVjKHVybCk7XG4gICAgaWYgKG0pIHJldHVybiBtWzFdO1xuICAgIHJldHVybiB1cmw7XG4gIH1cblxuICAvLyBmaW5kIHRoZSByZWxheSBpZnJhbWUgaW4gdGhlIG9wZW5lclxuICBmdW5jdGlvbiBmaW5kUmVsYXkoKSB7XG4gICAgdmFyIGxvYyA9IHdpbmRvdy5sb2NhdGlvbjtcbiAgICB2YXIgZnJhbWVzID0gd2luZG93Lm9wZW5lci5mcmFtZXM7XG4gICAgZm9yICh2YXIgaSA9IGZyYW1lcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKGZyYW1lc1tpXS5sb2NhdGlvbi5wcm90b2NvbCA9PT0gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICYmXG4gICAgICAgICAgICBmcmFtZXNbaV0ubG9jYXRpb24uaG9zdCA9PT0gd2luZG93LmxvY2F0aW9uLmhvc3QgJiZcbiAgICAgICAgICAgIGZyYW1lc1tpXS5uYW1lID09PSBSRUxBWV9GUkFNRV9OQU1FKVxuICAgICAgICB7XG4gICAgICAgICAgcmV0dXJuIGZyYW1lc1tpXTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaChlKSB7IH1cbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGlzSUUgPSBpc0ludGVybmV0RXhwbG9yZXIoKTtcblxuICBpZiAoaXNTdXBwb3J0ZWQoKSkge1xuICAgIC8qICBHZW5lcmFsIGZsb3c6XG4gICAgICogICAgICAgICAgICAgICAgICAwLiB1c2VyIGNsaWNrc1xuICAgICAqICAoSUUgU1BFQ0lGSUMpICAgMS4gY2FsbGVyIGFkZHMgcmVsYXkgaWZyYW1lIChzZXJ2ZWQgZnJvbSB0cnVzdGVkIGRvbWFpbikgdG8gRE9NXG4gICAgICogICAgICAgICAgICAgICAgICAyLiBjYWxsZXIgb3BlbnMgd2luZG93ICh3aXRoIGNvbnRlbnQgZnJvbSB0cnVzdGVkIGRvbWFpbilcbiAgICAgKiAgICAgICAgICAgICAgICAgIDMuIHdpbmRvdyBvbiBvcGVuaW5nIGFkZHMgYSBsaXN0ZW5lciB0byAnbWVzc2FnZSdcbiAgICAgKiAgKElFIFNQRUNJRklDKSAgIDQuIHdpbmRvdyBvbiBvcGVuaW5nIGZpbmRzIGlmcmFtZVxuICAgICAqICAgICAgICAgICAgICAgICAgNS4gd2luZG93IGNoZWNrcyBpZiBpZnJhbWUgaXMgXCJsb2FkZWRcIiAtIGhhcyBhICdkb1Bvc3QnIGZ1bmN0aW9uIHlldFxuICAgICAqICAoSUUgU1BFQ0lGSUM1KSAgNWEuIGlmIGlmcmFtZS5kb1Bvc3QgZXhpc3RzLCB3aW5kb3cgdXNlcyBpdCB0byBzZW5kIHJlYWR5IGV2ZW50IHRvIGNhbGxlclxuICAgICAqICAoSUUgU1BFQ0lGSUM1KSAgNWIuIGlmIGlmcmFtZS5kb1Bvc3QgZG9lc24ndCBleGlzdCwgd2luZG93IHdhaXRzIGZvciBmcmFtZSByZWFkeVxuICAgICAqICAoSUUgU1BFQ0lGSUM1KSAgNWJpLiBvbmNlIHJlYWR5LCB3aW5kb3cgY2FsbHMgaWZyYW1lLmRvUG9zdCB0byBzZW5kIHJlYWR5IGV2ZW50XG4gICAgICogICAgICAgICAgICAgICAgICA2LiBjYWxsZXIgdXBvbiByZWNpZXB0IG9mICdyZWFkeScsIHNlbmRzIGFyZ3NcbiAgICAgKi9cbiAgICByZXR1cm4ge1xuICAgICAgb3BlbjogZnVuY3Rpb24ob3B0cywgY2IpIHtcbiAgICAgICAgaWYgKCFjYikgdGhyb3cgXCJtaXNzaW5nIHJlcXVpcmVkIGNhbGxiYWNrIGFyZ3VtZW50XCI7XG5cbiAgICAgICAgLy8gdGVzdCByZXF1aXJlZCBvcHRpb25zXG4gICAgICAgIHZhciBlcnI7XG4gICAgICAgIGlmICghb3B0cy51cmwpIGVyciA9IFwibWlzc2luZyByZXF1aXJlZCAndXJsJyBwYXJhbWV0ZXJcIjtcbiAgICAgICAgaWYgKCFvcHRzLnJlbGF5X3VybCkgZXJyID0gXCJtaXNzaW5nIHJlcXVpcmVkICdyZWxheV91cmwnIHBhcmFtZXRlclwiO1xuICAgICAgICBpZiAoZXJyKSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYihlcnIpOyB9LCAwKTtcblxuICAgICAgICAvLyBzdXBwbHkgZGVmYXVsdCBvcHRpb25zXG4gICAgICAgIGlmICghb3B0cy53aW5kb3dfbmFtZSkgb3B0cy53aW5kb3dfbmFtZSA9IG51bGw7XG4gICAgICAgIGlmICghb3B0cy53aW5kb3dfZmVhdHVyZXMgfHwgaXNGZW5uZWMoKSkgb3B0cy53aW5kb3dfZmVhdHVyZXMgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgLy8gb3B0cy5wYXJhbXMgbWF5IGJlIHVuZGVmaW5lZFxuXG4gICAgICAgIHZhciBpZnJhbWU7XG5cbiAgICAgICAgLy8gc2FuaXR5IGNoZWNrLCBhcmUgdXJsIGFuZCByZWxheV91cmwgdGhlIHNhbWUgb3JpZ2luP1xuICAgICAgICB2YXIgb3JpZ2luID0gZXh0cmFjdE9yaWdpbihvcHRzLnVybCk7XG4gICAgICAgIGlmIChvcmlnaW4gIT09IGV4dHJhY3RPcmlnaW4ob3B0cy5yZWxheV91cmwpKSB7XG4gICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjYignaW52YWxpZCBhcmd1bWVudHM6IG9yaWdpbiBvZiB1cmwgYW5kIHJlbGF5X3VybCBtdXN0IG1hdGNoJyk7XG4gICAgICAgICAgfSwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbWVzc2FnZVRhcmdldDtcblxuICAgICAgICBpZiAoaXNJRSkge1xuICAgICAgICAgIC8vIGZpcnN0IHdlIG5lZWQgdG8gYWRkIGEgXCJyZWxheVwiIGlmcmFtZSB0byB0aGUgZG9jdW1lbnQgdGhhdCdzIHNlcnZlZFxuICAgICAgICAgIC8vIGZyb20gdGhlIHRhcmdldCBkb21haW4uICBXZSBjYW4gcG9zdG1lc3NhZ2UgaW50byBhIGlmcmFtZSwgYnV0IG5vdCBhXG4gICAgICAgICAgLy8gd2luZG93XG4gICAgICAgICAgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcbiAgICAgICAgICAvLyBpZnJhbWUuc2V0QXR0cmlidXRlKCduYW1lJywgZnJhbWVuYW1lKTtcbiAgICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzcmMnLCBvcHRzLnJlbGF5X3VybCk7XG4gICAgICAgICAgaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCduYW1lJywgUkVMQVlfRlJBTUVfTkFNRSk7XG4gICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgICAgICAgIG1lc3NhZ2VUYXJnZXQgPSBpZnJhbWUuY29udGVudFdpbmRvdztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3ID0gb3B0cy5wb3B1cCB8fCB3aW5kb3cub3BlbihvcHRzLnVybCwgb3B0cy53aW5kb3dfbmFtZSwgb3B0cy53aW5kb3dfZmVhdHVyZXMpO1xuICAgICAgICBpZiAob3B0cy5wb3B1cCkge1xuICAgICAgICAgIHcubG9jYXRpb24uaHJlZiA9IG9wdHMudXJsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFtZXNzYWdlVGFyZ2V0KSBtZXNzYWdlVGFyZ2V0ID0gdztcblxuICAgICAgICAvLyBsZXRzIGxpc3RlbiBpbiBjYXNlIHRoZSB3aW5kb3cgYmxvd3MgdXAgYmVmb3JlIHRlbGxpbmcgdXNcbiAgICAgICAgdmFyIGNsb3NlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAodyAmJiB3LmNsb3NlZCkge1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAgIGNiKCdVc2VyIGNsb3NlZCB0aGUgcG9wdXAgd2luZG93Jyk7XG4gICAgICAgICAgICAgIGNiID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIDUwMCk7XG5cbiAgICAgICAgdmFyIHJlcSA9IEpTT04uc3RyaW5naWZ5KHthOiAncmVxdWVzdCcsIGQ6IG9wdHMucGFyYW1zfSk7XG5cbiAgICAgICAgLy8gY2xlYW51cCBvbiB1bmxvYWRcbiAgICAgICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICAgICAgICBpZiAoaWZyYW1lKSBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGlmcmFtZSk7XG4gICAgICAgICAgaWZyYW1lID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChjbG9zZUludGVydmFsKSBjbG9zZUludGVydmFsID0gY2xlYXJJbnRlcnZhbChjbG9zZUludGVydmFsKTtcbiAgICAgICAgICByZW1vdmVMaXN0ZW5lcih3aW5kb3csICdtZXNzYWdlJywgb25NZXNzYWdlKTtcbiAgICAgICAgICByZW1vdmVMaXN0ZW5lcih3aW5kb3csICd1bmxvYWQnLCBjbGVhbnVwKTtcbiAgICAgICAgICBpZiAodykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgdy5jbG9zZSgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoc2VjdXJpdHlWaW9sYXRpb24pIHtcbiAgICAgICAgICAgICAgLy8gVGhpcyBoYXBwZW5zIGluIE9wZXJhIDEyIHNvbWV0aW1lc1xuICAgICAgICAgICAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL21vemlsbGEvYnJvd3NlcmlkL2lzc3Vlcy8xODQ0XG4gICAgICAgICAgICAgIG1lc3NhZ2VUYXJnZXQucG9zdE1lc3NhZ2UoQ0xPU0VfQ01ELCBvcmlnaW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICB3ID0gbWVzc2FnZVRhcmdldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZExpc3RlbmVyKHdpbmRvdywgJ3VubG9hZCcsIGNsZWFudXApO1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uTWVzc2FnZShlKSB7XG4gICAgICAgICAgaWYgKGUub3JpZ2luICE9PSBvcmlnaW4pIHsgcmV0dXJuOyB9XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBkID0gSlNPTi5wYXJzZShlLmRhdGEpO1xuICAgICAgICAgICAgaWYgKGQuYSA9PT0gJ3JlYWR5JykgbWVzc2FnZVRhcmdldC5wb3N0TWVzc2FnZShyZXEsIG9yaWdpbik7XG4gICAgICAgICAgICBlbHNlIGlmIChkLmEgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICBjYihkLmQpO1xuICAgICAgICAgICAgICAgIGNiID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChkLmEgPT09ICdyZXNwb25zZScpIHtcbiAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICAgICAgICBjYihudWxsLCBkLmQpO1xuICAgICAgICAgICAgICAgIGNiID0gbnVsbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2goZXJyKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFkZExpc3RlbmVyKHdpbmRvdywgJ21lc3NhZ2UnLCBvbk1lc3NhZ2UpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY2xvc2U6IGNsZWFudXAsXG4gICAgICAgICAgZm9jdXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHcpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB3LmZvY3VzKCk7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBJRTcgYmxvd3MgdXAgaGVyZSwgZG8gbm90aGluZ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICAgIG9uT3BlbjogZnVuY3Rpb24oY2IpIHtcbiAgICAgICAgdmFyIG8gPSBcIipcIjtcbiAgICAgICAgdmFyIG1zZ1RhcmdldCA9IGlzSUUgPyBmaW5kUmVsYXkoKSA6IHdpbmRvdy5vcGVuZXI7XG4gICAgICAgIGlmICghbXNnVGFyZ2V0KSB0aHJvdyBcImNhbid0IGZpbmQgcmVsYXkgZnJhbWVcIjtcbiAgICAgICAgZnVuY3Rpb24gZG9Qb3N0KG1zZykge1xuICAgICAgICAgIG1zZyA9IEpTT04uc3RyaW5naWZ5KG1zZyk7XG4gICAgICAgICAgaWYgKGlzSUUpIG1zZ1RhcmdldC5kb1Bvc3QobXNnLCBvKTtcbiAgICAgICAgICBlbHNlIG1zZ1RhcmdldC5wb3N0TWVzc2FnZShtc2csIG8pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb25NZXNzYWdlKGUpIHtcbiAgICAgICAgICAvLyBvbmx5IG9uZSBtZXNzYWdlIGdldHMgdGhyb3VnaCwgYnV0IGxldCdzIG1ha2Ugc3VyZSBpdCdzIGFjdHVhbGx5XG4gICAgICAgICAgLy8gdGhlIG1lc3NhZ2Ugd2UncmUgbG9va2luZyBmb3IgKG90aGVyIGNvZGUgbWF5IGJlIHVzaW5nXG4gICAgICAgICAgLy8gcG9zdG1lc3NhZ2UpIC0gd2UgZG8gdGhpcyBieSBlbnN1cmluZyB0aGUgcGF5bG9hZCBjYW5cbiAgICAgICAgICAvLyBiZSBwYXJzZWQsIGFuZCBpdCdzIGdvdCBhbiAnYScgKGFjdGlvbikgdmFsdWUgb2YgJ3JlcXVlc3QnLlxuICAgICAgICAgIHZhciBkO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkID0gSlNPTi5wYXJzZShlLmRhdGEpO1xuICAgICAgICAgIH0gY2F0Y2goZXJyKSB7IH1cbiAgICAgICAgICBpZiAoIWQgfHwgZC5hICE9PSAncmVxdWVzdCcpIHJldHVybjtcbiAgICAgICAgICByZW1vdmVMaXN0ZW5lcih3aW5kb3csICdtZXNzYWdlJywgb25NZXNzYWdlKTtcbiAgICAgICAgICBvID0gZS5vcmlnaW47XG4gICAgICAgICAgaWYgKGNiKSB7XG4gICAgICAgICAgICAvLyB0aGlzIHNldFRpbWVvdXQgaXMgY3JpdGljYWxseSBpbXBvcnRhbnQgZm9yIElFOCAtXG4gICAgICAgICAgICAvLyBpbiBpZTggc29tZXRpbWVzIGFkZExpc3RlbmVyIGZvciAnbWVzc2FnZScgY2FuIHN5bmNocm9ub3VzbHlcbiAgICAgICAgICAgIC8vIGNhdXNlIHlvdXIgY2FsbGJhY2sgdG8gYmUgaW52b2tlZC4gIGF3ZXNvbWUuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBjYihvLCBkLmQsIGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICAgICAgICBjYiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBkb1Bvc3Qoe2E6ICdyZXNwb25zZScsIGQ6IHJ9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvbkRpZShlKSB7XG4gICAgICAgICAgaWYgKGUuZGF0YSA9PT0gQ0xPU0VfQ01EKSB7XG4gICAgICAgICAgICB0cnkgeyB3aW5kb3cuY2xvc2UoKTsgfSBjYXRjaCAob19PKSB7fVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhZGRMaXN0ZW5lcihpc0lFID8gbXNnVGFyZ2V0IDogd2luZG93LCAnbWVzc2FnZScsIG9uTWVzc2FnZSk7XG4gICAgICAgIGFkZExpc3RlbmVyKGlzSUUgPyBtc2dUYXJnZXQgOiB3aW5kb3csICdtZXNzYWdlJywgb25EaWUpO1xuXG4gICAgICAgIC8vIHdlIGNhbm5vdCBwb3N0IHRvIG91ciBwYXJlbnQgdGhhdCB3ZSdyZSByZWFkeSBiZWZvcmUgdGhlIGlmcmFtZVxuICAgICAgICAvLyBpcyBsb2FkZWQuIChJRSBzcGVjaWZpYyBwb3NzaWJsZSBmYWlsdXJlKVxuICAgICAgICB0cnkge1xuICAgICAgICAgIGRvUG9zdCh7YTogXCJyZWFkeVwifSk7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgIC8vIHRoaXMgY29kZSBzaG91bGQgbmV2ZXIgYmUgZXhlY3R1ZWQgb3V0c2lkZSBJRVxuICAgICAgICAgIGFkZExpc3RlbmVyKG1zZ1RhcmdldCwgJ2xvYWQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBkb1Bvc3Qoe2E6IFwicmVhZHlcIn0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgd2luZG93IGlzIHVubG9hZGVkIGFuZCB0aGUgY2xpZW50IGhhc24ndCBjYWxsZWQgY2IsIGl0J3MgYW4gZXJyb3JcbiAgICAgICAgdmFyIG9uVW5sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIElFOCBkb2Vzbid0IGxpa2UgdGhpcy4uLlxuICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXIoaXNJRSA/IG1zZ1RhcmdldCA6IHdpbmRvdywgJ21lc3NhZ2UnLCBvbkRpZSk7XG4gICAgICAgICAgfSBjYXRjaCAob2hXZWxsKSB7IH1cbiAgICAgICAgICBpZiAoY2IpIGRvUG9zdCh7IGE6ICdlcnJvcicsIGQ6ICdjbGllbnQgY2xvc2VkIHdpbmRvdycgfSk7XG4gICAgICAgICAgY2IgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgLy8gZXhwbGljaXRseSBjbG9zZSB0aGUgd2luZG93LCBpbiBjYXNlIHRoZSBjbGllbnQgaXMgdHJ5aW5nIHRvIHJlbG9hZCBvciBuYXZcbiAgICAgICAgICB0cnkgeyB3aW5kb3cuY2xvc2UoKTsgfSBjYXRjaCAoZSkgeyB9XG4gICAgICAgIH07XG4gICAgICAgIGFkZExpc3RlbmVyKHdpbmRvdywgJ3VubG9hZCcsIG9uVW5sb2FkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkZXRhY2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXIod2luZG93LCAndW5sb2FkJywgb25VbmxvYWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB7XG4gICAgICBvcGVuOiBmdW5jdGlvbih1cmwsIHdpbm9wdHMsIGFyZywgY2IpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2IoXCJ1bnN1cHBvcnRlZCBicm93c2VyXCIpOyB9LCAwKTtcbiAgICAgIH0sXG4gICAgICBvbk9wZW46IGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNiKFwidW5zdXBwb3J0ZWQgYnJvd3NlclwiKTsgfSwgMCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufSkoKTtcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gV2luQ2hhbjtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gaGFzS2V5c1xuXG5mdW5jdGlvbiBoYXNLZXlzKHNvdXJjZSkge1xuICAgIHJldHVybiBzb3VyY2UgIT09IG51bGwgJiZcbiAgICAgICAgKHR5cGVvZiBzb3VyY2UgPT09IFwib2JqZWN0XCIgfHxcbiAgICAgICAgdHlwZW9mIHNvdXJjZSA9PT0gXCJmdW5jdGlvblwiKVxufVxuIiwidmFyIEtleXMgPSByZXF1aXJlKFwib2JqZWN0LWtleXNcIilcbnZhciBoYXNLZXlzID0gcmVxdWlyZShcIi4vaGFzLWtleXNcIilcblxubW9kdWxlLmV4cG9ydHMgPSBleHRlbmRcblxuZnVuY3Rpb24gZXh0ZW5kKCkge1xuICAgIHZhciB0YXJnZXQgPSB7fVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgIGlmICghaGFzS2V5cyhzb3VyY2UpKSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGtleXMgPSBLZXlzKHNvdXJjZSlcblxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGtleXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0ga2V5c1tqXVxuICAgICAgICAgICAgdGFyZ2V0W25hbWVdID0gc291cmNlW25hbWVdXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0XG59XG4iLCJ2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbnZhciBpc0Z1bmN0aW9uID0gZnVuY3Rpb24gKGZuKSB7XG5cdHZhciBpc0Z1bmMgPSAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nICYmICEoZm4gaW5zdGFuY2VvZiBSZWdFeHApKSB8fCB0b1N0cmluZy5jYWxsKGZuKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblx0aWYgKCFpc0Z1bmMgJiYgdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRpc0Z1bmMgPSBmbiA9PT0gd2luZG93LnNldFRpbWVvdXQgfHwgZm4gPT09IHdpbmRvdy5hbGVydCB8fCBmbiA9PT0gd2luZG93LmNvbmZpcm0gfHwgZm4gPT09IHdpbmRvdy5wcm9tcHQ7XG5cdH1cblx0cmV0dXJuIGlzRnVuYztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZm9yRWFjaChvYmosIGZuKSB7XG5cdGlmICghaXNGdW5jdGlvbihmbikpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdpdGVyYXRvciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblx0fVxuXHR2YXIgaSwgayxcblx0XHRpc1N0cmluZyA9IHR5cGVvZiBvYmogPT09ICdzdHJpbmcnLFxuXHRcdGwgPSBvYmoubGVuZ3RoLFxuXHRcdGNvbnRleHQgPSBhcmd1bWVudHMubGVuZ3RoID4gMiA/IGFyZ3VtZW50c1syXSA6IG51bGw7XG5cdGlmIChsID09PSArbCkge1xuXHRcdGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcblx0XHRcdGlmIChjb250ZXh0ID09PSBudWxsKSB7XG5cdFx0XHRcdGZuKGlzU3RyaW5nID8gb2JqLmNoYXJBdChpKSA6IG9ialtpXSwgaSwgb2JqKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZuLmNhbGwoY29udGV4dCwgaXNTdHJpbmcgPyBvYmouY2hhckF0KGkpIDogb2JqW2ldLCBpLCBvYmopO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRmb3IgKGsgaW4gb2JqKSB7XG5cdFx0XHRpZiAoaGFzT3duLmNhbGwob2JqLCBrKSkge1xuXHRcdFx0XHRpZiAoY29udGV4dCA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdGZuKG9ialtrXSwgaywgb2JqKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRmbi5jYWxsKGNvbnRleHQsIG9ialtrXSwgaywgb2JqKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBPYmplY3Qua2V5cyB8fCByZXF1aXJlKCcuL3NoaW0nKTtcblxuIiwidmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuXHR2YXIgc3RyID0gdG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG5cdHZhciBpc0FyZ3VtZW50cyA9IHN0ciA9PT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG5cdGlmICghaXNBcmd1bWVudHMpIHtcblx0XHRpc0FyZ3VtZW50cyA9IHN0ciAhPT0gJ1tvYmplY3QgQXJyYXldJ1xuXHRcdFx0JiYgdmFsdWUgIT09IG51bGxcblx0XHRcdCYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCdcblx0XHRcdCYmIHR5cGVvZiB2YWx1ZS5sZW5ndGggPT09ICdudW1iZXInXG5cdFx0XHQmJiB2YWx1ZS5sZW5ndGggPj0gMFxuXHRcdFx0JiYgdG9TdHJpbmcuY2FsbCh2YWx1ZS5jYWxsZWUpID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXHR9XG5cdHJldHVybiBpc0FyZ3VtZW50cztcbn07XG5cbiIsIihmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vIG1vZGlmaWVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9lczUtc2hpbVxuXHR2YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSxcblx0XHR0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG5cdFx0Zm9yRWFjaCA9IHJlcXVpcmUoJy4vZm9yZWFjaCcpLFxuXHRcdGlzQXJncyA9IHJlcXVpcmUoJy4vaXNBcmd1bWVudHMnKSxcblx0XHRoYXNEb250RW51bUJ1ZyA9ICEoeyd0b1N0cmluZyc6IG51bGx9KS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgndG9TdHJpbmcnKSxcblx0XHRoYXNQcm90b0VudW1CdWcgPSAoZnVuY3Rpb24gKCkge30pLnByb3BlcnR5SXNFbnVtZXJhYmxlKCdwcm90b3R5cGUnKSxcblx0XHRkb250RW51bXMgPSBbXG5cdFx0XHRcInRvU3RyaW5nXCIsXG5cdFx0XHRcInRvTG9jYWxlU3RyaW5nXCIsXG5cdFx0XHRcInZhbHVlT2ZcIixcblx0XHRcdFwiaGFzT3duUHJvcGVydHlcIixcblx0XHRcdFwiaXNQcm90b3R5cGVPZlwiLFxuXHRcdFx0XCJwcm9wZXJ0eUlzRW51bWVyYWJsZVwiLFxuXHRcdFx0XCJjb25zdHJ1Y3RvclwiXG5cdFx0XSxcblx0XHRrZXlzU2hpbTtcblxuXHRrZXlzU2hpbSA9IGZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG5cdFx0dmFyIGlzT2JqZWN0ID0gb2JqZWN0ICE9PSBudWxsICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnLFxuXHRcdFx0aXNGdW5jdGlvbiA9IHRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcblx0XHRcdGlzQXJndW1lbnRzID0gaXNBcmdzKG9iamVjdCksXG5cdFx0XHR0aGVLZXlzID0gW107XG5cblx0XHRpZiAoIWlzT2JqZWN0ICYmICFpc0Z1bmN0aW9uICYmICFpc0FyZ3VtZW50cykge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdC5rZXlzIGNhbGxlZCBvbiBhIG5vbi1vYmplY3RcIik7XG5cdFx0fVxuXG5cdFx0aWYgKGlzQXJndW1lbnRzKSB7XG5cdFx0XHRmb3JFYWNoKG9iamVjdCwgZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0XHRcdHRoZUtleXMucHVzaCh2YWx1ZSk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIG5hbWUsXG5cdFx0XHRcdHNraXBQcm90byA9IGhhc1Byb3RvRW51bUJ1ZyAmJiBpc0Z1bmN0aW9uO1xuXG5cdFx0XHRmb3IgKG5hbWUgaW4gb2JqZWN0KSB7XG5cdFx0XHRcdGlmICghKHNraXBQcm90byAmJiBuYW1lID09PSAncHJvdG90eXBlJykgJiYgaGFzLmNhbGwob2JqZWN0LCBuYW1lKSkge1xuXHRcdFx0XHRcdHRoZUtleXMucHVzaChuYW1lKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChoYXNEb250RW51bUJ1Zykge1xuXHRcdFx0dmFyIGN0b3IgPSBvYmplY3QuY29uc3RydWN0b3IsXG5cdFx0XHRcdHNraXBDb25zdHJ1Y3RvciA9IGN0b3IgJiYgY3Rvci5wcm90b3R5cGUgPT09IG9iamVjdDtcblxuXHRcdFx0Zm9yRWFjaChkb250RW51bXMsIGZ1bmN0aW9uIChkb250RW51bSkge1xuXHRcdFx0XHRpZiAoIShza2lwQ29uc3RydWN0b3IgJiYgZG9udEVudW0gPT09ICdjb25zdHJ1Y3RvcicpICYmIGhhcy5jYWxsKG9iamVjdCwgZG9udEVudW0pKSB7XG5cdFx0XHRcdFx0dGhlS2V5cy5wdXNoKGRvbnRFbnVtKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGVLZXlzO1xuXHR9O1xuXG5cdG1vZHVsZS5leHBvcnRzID0ga2V5c1NoaW07XG59KCkpO1xuXG4iLCJ2YXIgZ2xvYmFsPXR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fTsvKlxuICpcbiAqIFRoaXMgaXMgdXNlZCB0byBidWlsZCB0aGUgYnVuZGxlIHdpdGggYnJvd3NlcmlmeS5cbiAqXG4gKiBUaGUgYnVuZGxlIGlzIHVzZWQgYnkgcGVvcGxlIHdobyBkb2Vzbid0IHVzZSBicm93c2VyaWZ5LlxuICogVGhvc2Ugd2hvIHVzZSBicm93c2VyaWZ5IHdpbGwgaW5zdGFsbCB3aXRoIG5wbSBhbmQgcmVxdWlyZSB0aGUgbW9kdWxlLFxuICogdGhlIHBhY2thZ2UuanNvbiBmaWxlIHBvaW50cyB0byBpbmRleC5qcy5cbiAqL1xudmFyIEF1dGgwID0gcmVxdWlyZSgnLi9pbmRleCcpO1xuXG4vL3VzZSBhbWQgb3IganVzdCB0aHJvdWdodCB0byB3aW5kb3cgb2JqZWN0LlxuaWYgKHR5cGVvZiBnbG9iYWwud2luZG93LmRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGdsb2JhbC53aW5kb3cuZGVmaW5lLmFtZCkge1xuICBnbG9iYWwud2luZG93LmRlZmluZSgnYXV0aDAnLCBmdW5jdGlvbiAoKSB7IHJldHVybiBBdXRoMDsgfSk7XG59IGVsc2UgaWYgKGdsb2JhbC53aW5kb3cpIHtcbiAgZ2xvYmFsLndpbmRvdy5BdXRoMCA9IEF1dGgwO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7IHN0cjogXCI3LjUuMFwiIH07XG4iXX0=
;