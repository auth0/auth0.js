(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("auth0-js", [], factory);
	else if(typeof exports === 'object')
		exports["auth0-js"] = factory();
	else
		root["auth0"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Authentication = __webpack_require__(12);
	var Management = __webpack_require__(33);
	var WebAuth = __webpack_require__(34);
	var version = __webpack_require__(14);
	
	module.exports = {
	  Authentication: Authentication,
	  Management: Management,
	  WebAuth: WebAuth,
	  version: version.raw
	};


/***/ },
/* 1 */
/***/ function(module, exports) {

	/* eslint-disable no-param-reassign */
	
	function pick(object, keys) {
	  return keys.reduce(function (prev, key) {
	    if (object[key]) {
	      prev[key] = object[key];
	    }
	    return prev;
	  }, {});
	}
	
	function extend() {
	  var params = Array.from(arguments);
	  params.unshift({});
	  return Object.assign.apply(undefined, params);
	}
	
	function merge(object, keys) {
	  return {
	    base: keys ? pick(object, keys) : object,
	    with: function (object2, keys2) {
	      object2 = keys2 ? pick(object2, keys2) : object2;
	      return extend(this.base, object2);
	    }
	  };
	}
	
	function blacklist(object, blacklistedKeys) {
	  return Object.keys(object).reduce(function (p, key) {
	    if (blacklistedKeys.indexOf(key) === -1) {
	      p[key] = object[key];
	    }
	    return p;
	  }, {});
	}
	
	function camelToSnake(str) {
	  var newKey = '';
	  var index = 0;
	  var code;
	  var wasPrevNumber = true;
	  var wasPrevUppercase = true;
	
	  while (index < str.length) {
	    code = str.charCodeAt(index);
	    if ((!wasPrevUppercase && code >= 65 && code <= 90) || (!wasPrevNumber && code >= 48 && code <= 57)) {
	      newKey += '_';
	      newKey += str[index].toLowerCase();
	    } else {
	      newKey += str[index].toLowerCase();
	    }
	    wasPrevNumber = (code >= 48 && code <= 57);
	    wasPrevUppercase = (code >= 65 && code <= 90);
	    index++;
	  }
	
	  return newKey;
	}
	
	function snakeToCamel(str) {
	  var parts = str.split('_');
	  return parts.reduce(function (p, c) {
	    return p + c.charAt(0).toUpperCase() + c.slice(1);
	  }, parts.shift());
	}
	
	function toSnakeCase(object, exceptions) {
	  exceptions = exceptions || [];
	
	  return Object.keys(object).reduce(function (p, key) {
	    var newKey = exceptions.indexOf(key) === -1 ? camelToSnake(key) : key;
	    p[newKey] = typeof(object[key]) === 'object' ? toSnakeCase(object[key]) : object[key];
	    return p;
	  }, {});
	}
	
	function toCamelCase(object, exceptions) {
	  exceptions = exceptions || [];
	
	  return Object.keys(object).reduce(function (p, key) {
	    var newKey = exceptions.indexOf(key) === -1 ? snakeToCamel(key) : key;
	    p[newKey] = typeof(object[key]) === 'object' ? toCamelCase(object[key]) : object[key];
	    return p;
	  }, {});
	}
	
	module.exports = {
	  toSnakeCase: toSnakeCase,
	  toCamelCase: toCamelCase,
	  blacklist: blacklist,
	  merge: merge,
	  pick: pick,
	  extend: extend
	};


/***/ },
/* 2 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {function redirect(url) {
	  global.window.location = url;
	}
	
	function getDocument() {
	  return global.window.document;
	}
	
	function getWindow() {
	  return global.window;
	}
	
	module.exports = {
	  redirect: redirect,
	  getDocument: getDocument,
	  getWindow: getWindow
	};
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 3 */
/***/ function(module, exports) {

	var toString = Object.prototype.toString;
	
	function attribute(o, attr, type, text) {
	  if (o && typeof o[attr] !== type) {
	    throw new Error(text);
	  }
	}
	
	function variable(o, type, text) {
	  if (typeof o !== type) {
	    throw new Error(text);
	  }
	}
	
	function value(o, values, text) {
	  if (values.indexOf(o) === -1) {
	    throw new Error(text);
	  }
	}
	
	function check(o, config, attributes) {
	  if (!config.optional || o) {
	    variable(o, config.type, config.message);
	  }
	  if (config.type === 'object' && attributes) {
	    Object.keys(attributes).forEach(function (a) { // eslint-disable-line
	      if (!attributes[a].optional || o[a]) {
	        if (!attributes[a].condition || attributes[a].condition(o)) {
	          attribute(o, a, attributes[a].type, attributes[a].message);
	          if (attributes[a].values) {
	            value(o[a], attributes[a].values, attributes[a].value_message);
	          }
	        }
	      }
	    });
	  }
	}
	
	/**
	 * Wrap `Array.isArray` Polyfill for IE9
	 * source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
	 *
	 * @param {Array} array
	 * @public
	 */
	function isArray(array) {
	  if (this.supportsIsArray()) {
	    return Array.isArray(array);
	  }
	
	  return toString.call(array) === '[object Array]';
	}
	
	function supportsIsArray() {
	  return (Array.isArray != null);
	}
	
	module.exports = {
	  check: check,
	  attribute: attribute,
	  variable: variable,
	  value: value,
	  isArray: isArray,
	  supportsIsArray: supportsIsArray
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (name, context, definition) {
	  if (typeof module !== 'undefined' && module.exports) module.exports = definition();
	  else if (true) !(__WEBPACK_AMD_DEFINE_FACTORY__ = (definition), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  else context[name] = definition();
	})('urljoin', this, function () {
	
	  function normalize (str, options) {
	
	    // make sure protocol is followed by two slashes
	    str = str.replace(/:\//g, '://');
	
	    // remove consecutive slashes
	    str = str.replace(/([^:\s])\/+/g, '$1/');
	
	    // remove trailing slash before parameters or hash
	    str = str.replace(/\/(\?|&|#[^!])/g, '$1');
	
	    // replace ? in parameters with &
	    str = str.replace(/(\?.+)\?/g, '$1&');
	
	    return str;
	  }
	
	  return function () {
	    var input = arguments;
	    var options = {};
	
	    if (typeof arguments[0] === 'object') {
	      // new syntax with array and options
	      input = arguments[0];
	      options = arguments[1] || {};
	    }
	
	    var joined = [].slice.call(input, 0).join('/');
	    return normalize(joined, options);
	  };
	
	});


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var error = __webpack_require__(13);
	var objectHelper = __webpack_require__(1);
	
	function wrapCallback(cb) {
	  return function (err, data) {
	    var errObj;
	
	    if (!err && !data) {
	      return cb(error.buildResponse('generic_error', 'Something went wrong'));
	    }
	
	    if (!err && data.err) {
	      err = data.err;
	      data = null;
	    }
	
	    if (err) {
	      errObj = {
	        original: err
	      };
	
	      if (err.response && err.response.statusCode) {
	        errObj.statusCode = err.response.statusCode;
	      }
	
	      if (err.response && err.response.statusText) {
	        errObj.statusText = err.response.statusText;
	      }
	
	      if (err.response && err.response.body) {
	        err = err.response.body;
	      }
	
	      if (err.err) {
	        err = err.err;
	      }
	
	      errObj.code = err.error || err.code || err.error_code || err.status || null;
	      errObj.description = err.error_description || err.description || err.error || err.details || err.err || null;
	
	      if (err.name) {
	        errObj.name = err.name;
	      }
	
	      if (err.policy) {
	        errObj.policy = err.policy;
	      }
	
	      return cb(errObj);
	    }
	
	    return cb(null, ((data.type && data.type === 'text/html') ? data.text : objectHelper.toCamelCase(data.body || data)));
	  };
	}
	
	module.exports = wrapCallback;


/***/ },
/* 6 */
/***/ function(module, exports) {

	function Warn(options) {
	  this.disableWarnings = options.disableWarnings;
	}
	
	Warn.prototype.warning = function (message) {
	  if (this.disableWarnings) {
	    return;
	  }
	
	  console.warn(message);
	};
	
	module.exports = Warn;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var Base64 = __webpack_require__(15);
	
	function encode(str) {
	  return Base64.btoa(str)
	      .replace(/\+/g, '-') // Convert '+' to '-'
	      .replace(/\//g, '_') // Convert '/' to '_'
	      .replace(/=+$/, ''); // Remove ending '='
	}
	
	
	function decode(str) {
	  // Add removed at end '='
	  str += Array(5 - str.length % 4).join('=');
	
	  str = str
	    .replace(/\-/g, '+') // Convert '-' to '+'
	    .replace(/_/g, '/'); // Convert '_' to '/'
	
	  return Base64.atob(str);
	}
	
	module.exports = {
	  encode: encode,
	  decode: decode
	};


/***/ },
/* 8 */
/***/ function(module, exports) {

	function build(params) {
	  return Object.keys(params).reduce(function (arr, key) {
	    if (typeof params[key] !== 'undefined') {
	      arr.push(key + '=' + encodeURIComponent(params[key]));
	    }
	    return arr;
	  }, []).join('&');
	}
	
	function parse(qs) {
	  return qs.split('&').reduce(function (prev, curr) {
	    var param = curr.split('=');
	    prev[param[0]] = param[1];
	    return prev;
	  }, {});
	}
	
	module.exports = {
	  build: build,
	  parse: parse
	};


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/* eslint-disable no-param-reassign */
	var request = __webpack_require__(16);
	var base64Url = __webpack_require__(7);
	var version = __webpack_require__(14);
	
	// ------------------------------------------------ RequestWrapper
	
	function RequestWrapper(req) {
	  this.request = req;
	  this.method = req.method;
	  this.url = req.url;
	  this.body = req._data;
	  this.headers = req._header;
	}
	
	RequestWrapper.prototype.abort = function () {
	  this.request.abort();
	};
	
	RequestWrapper.prototype.getMethod = function () {
	  return this.method;
	};
	
	RequestWrapper.prototype.getBody = function () {
	  return this.body;
	};
	
	RequestWrapper.prototype.getUrl = function () {
	  return this.url;
	};
	
	RequestWrapper.prototype.getHeaders = function () {
	  return this.headers;
	};
	
	// ------------------------------------------------ RequestObj
	
	function RequestObj(req) {
	  this.request = req;
	}
	
	RequestObj.prototype.set = function (key, value) {
	  this.request = this.request.set(key, value);
	  return this;
	};
	
	RequestObj.prototype.send = function (body) {
	  this.request = this.request.send(body);
	  return this;
	};
	
	RequestObj.prototype.withCredentials = function () {
	  this.request = this.request.withCredentials();
	  return this;
	};
	
	RequestObj.prototype.end = function (cb) {
	  this.request = this.request.end(cb);
	  return new RequestWrapper(this.request);
	};
	
	// ------------------------------------------------ RequestBuilder
	
	function RequestBuilder(options) {
	  this._sendTelemetry = options._sendTelemetry === false ? options._sendTelemetry : true;
	  this._telemetryInfo = options._telemetryInfo || null;
	  this.headers = options.headers || {};
	}
	
	RequestBuilder.prototype.setCommonConfiguration = function (ongoingRequest) {
	  var headers = this.headers;
	  ongoingRequest = ongoingRequest.set('Content-Type', 'application/json');
	  Object.keys(this.headers).forEach(function (header) {
	    ongoingRequest = ongoingRequest.set(header, headers[header]);
	  });
	  if (this._sendTelemetry) {
	    ongoingRequest = ongoingRequest.set('Auth0-Client', this.getTelemetryData());
	  }
	  return ongoingRequest;
	};
	
	RequestBuilder.prototype.getTelemetryData = function () {
	  var clientInfo = this._telemetryInfo || { name: 'auth0.js', version: version.raw };
	  var jsonClientInfo = JSON.stringify(clientInfo);
	  return base64Url.encode(jsonClientInfo);
	};
	
	RequestBuilder.prototype.get = function (url) {
	  return new RequestObj(this.setCommonConfiguration(request.get(url)));
	};
	
	RequestBuilder.prototype.post = function (url) {
	  return new RequestObj(this.setCommonConfiguration(request.post(url)));
	};
	
	RequestBuilder.prototype.patch = function (url) {
	  return new RequestObj(this.setCommonConfiguration(request.patch(url)));
	};
	
	module.exports = RequestBuilder;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var random = __webpack_require__(28);
	var storage = __webpack_require__(29);
	
	var DEFAULT_NAMESPACE = 'com.auth0.auth.';
	
	function TransactionManager(options) {
	  options = options || {};
	  this.namespace = options.namespace || DEFAULT_NAMESPACE;
	  this.keyLength = options.keyLength || 32;
	}
	
	TransactionManager.prototype.process = function (options) {
	  var transaction;
	
	  if (options.responseType.indexOf('code') !== -1) {
	    return options;
	  }
	
	  if (options.responseType.indexOf('id_token') !== -1 && !!options.nonce) {
	    return options;
	  }
	
	  transaction = this.generateTransaction(options.appState, options.state);
	
	  options.state = transaction.state;
	
	  if (options.responseType.indexOf('id_token') !== -1) {
	    options.nonce = transaction.nonce;
	  }
	
	  return options;
	};
	
	TransactionManager.prototype.generateTransaction = function (appState, state) {
	  var transaction;
	  var nonce;
	
	  transaction = state || random.randomString(this.keyLength);
	  nonce = random.randomString(this.keyLength);
	
	  storage.setItem(this.namespace + transaction, {
	    nonce:nonce,
	    appState: appState
	  });
	
	  return {
	    state: transaction,
	    nonce: nonce
	  };
	};
	
	TransactionManager.prototype.getStoredTransaction = function (transaction) {
	  var transactionData;
	
	  transactionData = storage.getItem(this.namespace + transaction);
	  storage.removeItem(this.namespace + transaction);
	  return transactionData;
	};
	
	module.exports = TransactionManager;


/***/ },
/* 11 */
/***/ function(module, exports) {

	/**
	 * Check if `obj` is an object.
	 *
	 * @param {Object} obj
	 * @return {Boolean}
	 * @api private
	 */
	
	function isObject(obj) {
	  return null !== obj && 'object' === typeof obj;
	}
	
	module.exports = isObject;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(4);
	
	var RequestBuilder = __webpack_require__(9);
	var qs = __webpack_require__(8);
	var objectHelper = __webpack_require__(1);
	var assert = __webpack_require__(3);
	var responseHandler = __webpack_require__(5);
	var parametersWhitelist = __webpack_require__(26);
	var Warn = __webpack_require__(6);
	
	var PasswordlessAuthentication = __webpack_require__(22);
	var DBConnection = __webpack_require__(21);
	
	/**
	 * Auth0 Authentication API client
	 * @constructor
	 * @param {Object} options
	 * @param {Object} options.domain
	 * @param {Object} options.clienID
	 * @param {Object} options.responseType
	 * @param {Object} options.responseMode
	 * @param {Object} options.scope
	 * @param {Object} options.audience
	 * @param {Object} options._disableDeprecationWarnings
	 */
	function Authentication(options) {
	  /* eslint-disable */
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    domain: { type: 'string', message: 'domain option is required' },
	    clientID: { type: 'string', message: 'clientID option is required' },
	    responseType: { optional: true, type: 'string', message: 'responseType is not valid' },
	    responseMode: { optional: true, type: 'string', message: 'responseMode is not valid' },
	    redirectUri: { optional: true, type: 'string', message: 'redirectUri is not valid' },
	    scope: { optional: true, type: 'string', message: 'scope is not valid' },
	    audience: { optional: true, type: 'string', message: 'audience is not valid' },
	    _disableDeprecationWarnings: { optional: true, type: 'boolean', message: '_disableDeprecationWarnings option is not valid' },
	    _sendTelemetry: { optional: true, type: 'boolean', message: '_sendTelemetry option is not valid' },
	    _telemetryInfo: { optional: true, type: 'object', message: '_telemetryInfo option is not valid' }
	  });
	  /* eslint-enable */
	
	  this.baseOptions = options;
	
	  this.baseOptions._sendTelemetry = this.baseOptions._sendTelemetry === false ?
	                                        this.baseOptions._sendTelemetry : true;
	
	  this.baseOptions.rootUrl = 'https://' + this.baseOptions.domain;
	
	  this.request = new RequestBuilder(this.baseOptions);
	
	  this.passwordless = new PasswordlessAuthentication(this.request, this.baseOptions);
	  this.dbConnection = new DBConnection(this.request, this.baseOptions);
	
	  this.warn = new Warn({
	    disableWarnings: !!options._disableDeprecationWarnings
	  });
	}
	
	/**
	 * Builds and returns the `/authorize` url in order to initialize a new authN/authZ transaction
	 *
	 * @method buildAuthorizeUrl
	 * @param {Object} options: https://auth0.com/docs/api/authentication#!#get--authorize_db
	 * @param {Function} cb
	 */
	Authentication.prototype.buildAuthorizeUrl = function (options) {
	  var params;
	  var qString;
	
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' });
	
	  params = objectHelper.merge(this.baseOptions, [
	    'clientID',
	    'responseType',
	    'responseMode',
	    'redirectUri',
	    'scope',
	    'audience'
	  ]).with(options);
	
	  /* eslint-disable */
	  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
	    clientID: { type: 'string', message: 'clientID option is required' },
	    redirectUri: { type: 'string', message: 'redirectUri option is required' },
	    responseType: { type: 'string', message: 'responseType option is required' },
	    nonce: { type: 'string', message: 'nonce option is required', condition: function(o) {
	      return o.responseType.indexOf('code') === -1 && o.responseType.indexOf('id_token') !== -1;
	    } },
	    state: { type: 'string', message: 'state option is required', condition: function(o) {
	      return o.responseType.indexOf('code') === -1;
	    } },
	    scope: { optional: true, type: 'string', message: 'scope option is required' },
	    audience: { optional: true, type: 'string', message: 'audience option is required' }
	  });
	  /* eslint-enable */
	
	  // eslint-disable-next-line
	  if (this.baseOptions._sendTelemetry) {
	    params.auth0Client = this.request.getTelemetryData();
	  }
	
	  if (params.connection_scope && assert.isArray(params.connection_scope)) {
	    params.connection_scope = params.connection_scope.join(',');
	  }
	
	  params = objectHelper.toSnakeCase(params, ['auth0Client']);
	  params = parametersWhitelist.oauthAuthorizeParams(params);
	
	  qString = qs.build(params);
	
	  return urljoin(this.baseOptions.rootUrl, 'authorize', '?' + qString);
	};
	
	/**
	 * Builds and returns the Logout url in order to initialize a new authN/authZ transaction
	 *
	 * @method buildLogoutUrl
	 * @param {Object} options: https://auth0.com/docs/api/authentication#!#get--v2-logout
	 */
	Authentication.prototype.buildLogoutUrl = function (options) {
	  var params;
	  var qString;
	
	  assert.check(options, {
	    optional: true,
	    type: 'object',
	    message: 'options parameter is not valid'
	  });
	
	  params = objectHelper.merge(this.baseOptions, ['clientID'])
	                .with(options || {});
	
	  // eslint-disable-next-line
	  if (this.baseOptions._sendTelemetry) {
	    params.auth0Client = this.request.getTelemetryData();
	  }
	
	  params = objectHelper.toSnakeCase(params, ['auth0Client', 'returnTo']);
	
	  qString = qs.build(params);
	
	  return urljoin(this.baseOptions.rootUrl, 'v2', 'logout', '?' + qString);
	};
	
	/**
	 * Makes a call to the `oauth/token` endpoint with `password` grant type
	 *
	 * @method loginWithDefaultDirectory
	 * @param {Object} options: https://auth0.com/docs/api-auth/grant/password
	 * @param {Function} cb
	 */
	Authentication.prototype.loginWithDefaultDirectory = function (options, cb) {
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    username: { type: 'string', message: 'username option is required' },
	    password: { type: 'string', message: 'password option is required' },
	    scope: { optional: true, type: 'string', message: 'scope option is required' },
	    audience: { optional: true, type: 'string', message: 'audience option is required' }
	  });
	
	  options.grantType = 'password';
	
	  return this.oauthToken(options, cb);
	};
	
	/**
	 * Makes a call to the `oauth/token` endpoint with `password-realm` grant type
	 *
	 * @method login
	 * @param {Object} options:
	 * @param {Object} options.username
	 * @param {Object} options.password
	 * @param {Object} options.scope
	 * @param {Object} options.audience
	 * @param {Object} options.realm: the HRD domain or the connection name
	 * @param {Function} cb
	 */
	Authentication.prototype.login = function (options, cb) {
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    username: { type: 'string', message: 'username option is required' },
	    password: { type: 'string', message: 'password option is required' },
	    realm: { type: 'string', message: 'realm option is required' },
	    scope: { optional: true, type: 'string', message: 'scope option is required' },
	    audience: { optional: true, type: 'string', message: 'audience option is required' }
	  });
	
	  options.grantType = 'http://auth0.com/oauth/grant-type/password-realm';
	
	  return this.oauthToken(options, cb);
	};
	
	/**
	 * Makes a call to the `oauth/token` endpoint
	 *
	 * @method oauthToken
	 * @param {Object} options:
	 * @param {Object} options.username
	 * @param {Object} options.password
	 * @param {Object} options.scope
	 * @param {Object} options.audience
	 * @param {Object} options.grantType
	 * @param {Function} cb
	 */
	Authentication.prototype.oauthToken = function (options, cb) {
	  var url;
	  var body;
	
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'oauth', 'token');
	
	  body = objectHelper.merge(this.baseOptions, [
	    'clientID',
	    'scope',
	    'audience'
	  ]).with(options);
	
	  assert.check(body, { type: 'object', message: 'options parameter is not valid' }, {
	    clientID: { type: 'string', message: 'clientID option is required' },
	    grantType: { type: 'string', message: 'grantType option is required' },
	    scope: { optional: true, type: 'string', message: 'scope option is required' },
	    audience: { optional: true, type: 'string', message: 'audience option is required' }
	  });
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	  body = parametersWhitelist.oauthTokenParams(body);
	
	  body.grant_type = body.grant_type;
	
	  return this.request
	    .post(url)
	    .send(body)
	    .end(responseHandler(cb));
	};
	
	/**
	 * Makes a call to the `/ro` endpoint
	 *
	 * @method loginWithResourceOwner
	 * @param {Object} options:
	 * @param {Object} options.username
	 * @param {Object} options.password
	 * @param {Object} options.connection
	 * @param {Object} options.scope
	 * @param {Object} options.audience
	 * @param {Function} cb
	 * @deprecated `loginWithResourceOwner` will be soon deprecated, user `login` instead.
	 */
	Authentication.prototype.loginWithResourceOwner = function (options, cb) {
	  var url;
	  var body;
	
	  this.warn.warning('`loginWithResourceOwner` will be soon deprecated, user `login` instead.');
	
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    username: { type: 'string', message: 'username option is required' },
	    password: { type: 'string', message: 'password option is required' },
	    connection: { type: 'string', message: 'connection option is required' },
	    scope: { optional: true, type: 'string', message: 'scope option is required' },
	    audience: { optional: true, type: 'string', message: 'audience option is required' }
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'oauth', 'ro');
	
	  body = objectHelper.merge(this.baseOptions, [
	    'clientID',
	    'scope',
	    'audience'
	  ]).with(options);
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	
	  body.grant_type = body.grant_type || 'password';
	
	  return this.request
	    .post(url)
	    .send(body)
	    .end(responseHandler(cb));
	};
	
	/**
	 * Makes a call to the `/ssodata` endpoint
	 *
	 * @method getSSOData
	 * @param {Boolean} withActiveDirectories
	 * @param {Function} cb
	 * @deprecated `getSSOData` will be soon deprecated.
	 */
	Authentication.prototype.getSSOData = function (withActiveDirectories, cb) {
	  var url;
	  var params = '';
	
	  this.warn.warning('`getSSOData` will be soon deprecated.');
	
	  if (typeof withActiveDirectories === 'function') {
	    cb = withActiveDirectories;
	    withActiveDirectories = false;
	  }
	
	  assert.check(withActiveDirectories, { type: 'boolean', message: 'withActiveDirectories parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  if (withActiveDirectories) {
	    params = '?' + qs.build({
	      ldaps: 1,
	      client_id: this.baseOptions.clientID
	    });
	  }
	
	  url = urljoin(this.baseOptions.rootUrl, 'user', 'ssodata', params);
	
	  return this.request
	    .get(url)
	    .withCredentials()
	    .end(responseHandler(cb));
	};
	
	/**
	 * Makes a call to the `/userinfo` endpoint and returns the user profile
	 *
	 * @method userInfo
	 * @param {String} accessToken
	 * @param {Function} cb
	 */
	Authentication.prototype.userInfo = function (accessToken, cb) {
	  var url;
	
	  assert.check(accessToken, { type: 'string', message: 'accessToken parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'userinfo');
	
	  return this.request
	    .get(url)
	    .set('Authorization', 'Bearer ' + accessToken)
	    .end(responseHandler(cb));
	};
	
	/**
	 * Makes a call to the `/delegation` endpoint
	 *
	 * @method delegation
	 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--delegation
	 * @param {Function} cb
	 * @deprecated `delegation` will be soon deprecated.
	 */
	Authentication.prototype.delegation = function (options, cb) {
	  var url;
	  var body;
	
	  this.warn.warning('`delegation` will be soon deprecated.');
	
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    grant_type: { type: 'string', message: 'grant_type option is required' }
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'delegation');
	
	  body = objectHelper.merge(this.baseOptions, ['clientID'])
	                .with(options);
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	
	  return this.request
	    .post(url)
	    .send(body)
	    .end(responseHandler(cb));
	};
	
	/**
	 * Fetches the user country based on the ip.
	 *
	 * @method getUserCountry
	 * @param {Function} cb
	 */
	Authentication.prototype.getUserCountry = function (cb) {
	  var url;
	
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'user', 'geoloc', 'country');
	
	  return this.request
	    .get(url)
	    .end(responseHandler(cb));
	};
	
	module.exports = Authentication;


/***/ },
/* 13 */
/***/ function(module, exports) {

	function buildResponse(error, description) {
	  return {
	    error: error,
	    errorDescription: description
	  };
	}
	
	function invalidJwt(description) {
	  return buildResponse('invalid_token', description);
	}
	
	module.exports = {
	  buildResponse: buildResponse,
	  invalidJwt: invalidJwt
	};


/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = {raw:"8.0.0-beta.3"};


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	;(function () {
	
	  var
	    object =  true ? exports : this, // #8: web workers
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


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Root reference for iframes.
	 */
	
	var root;
	if (typeof window !== 'undefined') { // Browser window
	  root = window;
	} else if (typeof self !== 'undefined') { // Web Worker
	  root = self;
	} else { // Other environments
	  console.warn("Using browser-only version of superagent in non-browser environment");
	  root = this;
	}
	
	var Emitter = __webpack_require__(19);
	var requestBase = __webpack_require__(17);
	var isObject = __webpack_require__(11);
	
	/**
	 * Noop.
	 */
	
	function noop(){};
	
	/**
	 * Expose `request`.
	 */
	
	var request = module.exports = __webpack_require__(18).bind(null, Request);
	
	/**
	 * Determine XHR.
	 */
	
	request.getXHR = function () {
	  if (root.XMLHttpRequest
	      && (!root.location || 'file:' != root.location.protocol
	          || !root.ActiveXObject)) {
	    return new XMLHttpRequest;
	  } else {
	    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
	  }
	  throw Error("Browser-only verison of superagent could not find XHR");
	};
	
	/**
	 * Removes leading and trailing whitespace, added to support IE.
	 *
	 * @param {String} s
	 * @return {String}
	 * @api private
	 */
	
	var trim = ''.trim
	  ? function(s) { return s.trim(); }
	  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };
	
	/**
	 * Serialize the given `obj`.
	 *
	 * @param {Object} obj
	 * @return {String}
	 * @api private
	 */
	
	function serialize(obj) {
	  if (!isObject(obj)) return obj;
	  var pairs = [];
	  for (var key in obj) {
	    pushEncodedKeyValuePair(pairs, key, obj[key]);
	  }
	  return pairs.join('&');
	}
	
	/**
	 * Helps 'serialize' with serializing arrays.
	 * Mutates the pairs array.
	 *
	 * @param {Array} pairs
	 * @param {String} key
	 * @param {Mixed} val
	 */
	
	function pushEncodedKeyValuePair(pairs, key, val) {
	  if (val != null) {
	    if (Array.isArray(val)) {
	      val.forEach(function(v) {
	        pushEncodedKeyValuePair(pairs, key, v);
	      });
	    } else if (isObject(val)) {
	      for(var subkey in val) {
	        pushEncodedKeyValuePair(pairs, key + '[' + subkey + ']', val[subkey]);
	      }
	    } else {
	      pairs.push(encodeURIComponent(key)
	        + '=' + encodeURIComponent(val));
	    }
	  } else if (val === null) {
	    pairs.push(encodeURIComponent(key));
	  }
	}
	
	/**
	 * Expose serialization method.
	 */
	
	 request.serializeObject = serialize;
	
	 /**
	  * Parse the given x-www-form-urlencoded `str`.
	  *
	  * @param {String} str
	  * @return {Object}
	  * @api private
	  */
	
	function parseString(str) {
	  var obj = {};
	  var pairs = str.split('&');
	  var pair;
	  var pos;
	
	  for (var i = 0, len = pairs.length; i < len; ++i) {
	    pair = pairs[i];
	    pos = pair.indexOf('=');
	    if (pos == -1) {
	      obj[decodeURIComponent(pair)] = '';
	    } else {
	      obj[decodeURIComponent(pair.slice(0, pos))] =
	        decodeURIComponent(pair.slice(pos + 1));
	    }
	  }
	
	  return obj;
	}
	
	/**
	 * Expose parser.
	 */
	
	request.parseString = parseString;
	
	/**
	 * Default MIME type map.
	 *
	 *     superagent.types.xml = 'application/xml';
	 *
	 */
	
	request.types = {
	  html: 'text/html',
	  json: 'application/json',
	  xml: 'application/xml',
	  urlencoded: 'application/x-www-form-urlencoded',
	  'form': 'application/x-www-form-urlencoded',
	  'form-data': 'application/x-www-form-urlencoded'
	};
	
	/**
	 * Default serialization map.
	 *
	 *     superagent.serialize['application/xml'] = function(obj){
	 *       return 'generated xml here';
	 *     };
	 *
	 */
	
	 request.serialize = {
	   'application/x-www-form-urlencoded': serialize,
	   'application/json': JSON.stringify
	 };
	
	 /**
	  * Default parsers.
	  *
	  *     superagent.parse['application/xml'] = function(str){
	  *       return { object parsed from str };
	  *     };
	  *
	  */
	
	request.parse = {
	  'application/x-www-form-urlencoded': parseString,
	  'application/json': JSON.parse
	};
	
	/**
	 * Parse the given header `str` into
	 * an object containing the mapped fields.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */
	
	function parseHeader(str) {
	  var lines = str.split(/\r?\n/);
	  var fields = {};
	  var index;
	  var line;
	  var field;
	  var val;
	
	  lines.pop(); // trailing CRLF
	
	  for (var i = 0, len = lines.length; i < len; ++i) {
	    line = lines[i];
	    index = line.indexOf(':');
	    field = line.slice(0, index).toLowerCase();
	    val = trim(line.slice(index + 1));
	    fields[field] = val;
	  }
	
	  return fields;
	}
	
	/**
	 * Check if `mime` is json or has +json structured syntax suffix.
	 *
	 * @param {String} mime
	 * @return {Boolean}
	 * @api private
	 */
	
	function isJSON(mime) {
	  return /[\/+]json\b/.test(mime);
	}
	
	/**
	 * Return the mime type for the given `str`.
	 *
	 * @param {String} str
	 * @return {String}
	 * @api private
	 */
	
	function type(str){
	  return str.split(/ *; */).shift();
	};
	
	/**
	 * Return header field parameters.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */
	
	function params(str){
	  return str.split(/ *; */).reduce(function(obj, str){
	    var parts = str.split(/ *= */),
	        key = parts.shift(),
	        val = parts.shift();
	
	    if (key && val) obj[key] = val;
	    return obj;
	  }, {});
	};
	
	/**
	 * Initialize a new `Response` with the given `xhr`.
	 *
	 *  - set flags (.ok, .error, etc)
	 *  - parse header
	 *
	 * Examples:
	 *
	 *  Aliasing `superagent` as `request` is nice:
	 *
	 *      request = superagent;
	 *
	 *  We can use the promise-like API, or pass callbacks:
	 *
	 *      request.get('/').end(function(res){});
	 *      request.get('/', function(res){});
	 *
	 *  Sending data can be chained:
	 *
	 *      request
	 *        .post('/user')
	 *        .send({ name: 'tj' })
	 *        .end(function(res){});
	 *
	 *  Or passed to `.send()`:
	 *
	 *      request
	 *        .post('/user')
	 *        .send({ name: 'tj' }, function(res){});
	 *
	 *  Or passed to `.post()`:
	 *
	 *      request
	 *        .post('/user', { name: 'tj' })
	 *        .end(function(res){});
	 *
	 * Or further reduced to a single call for simple cases:
	 *
	 *      request
	 *        .post('/user', { name: 'tj' }, function(res){});
	 *
	 * @param {XMLHTTPRequest} xhr
	 * @param {Object} options
	 * @api private
	 */
	
	function Response(req, options) {
	  options = options || {};
	  this.req = req;
	  this.xhr = this.req.xhr;
	  // responseText is accessible only if responseType is '' or 'text' and on older browsers
	  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
	     ? this.xhr.responseText
	     : null;
	  this.statusText = this.req.xhr.statusText;
	  this._setStatusProperties(this.xhr.status);
	  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
	  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
	  // getResponseHeader still works. so we get content-type even if getting
	  // other headers fails.
	  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
	  this._setHeaderProperties(this.header);
	  this.body = this.req.method != 'HEAD'
	    ? this._parseBody(this.text ? this.text : this.xhr.response)
	    : null;
	}
	
	/**
	 * Get case-insensitive `field` value.
	 *
	 * @param {String} field
	 * @return {String}
	 * @api public
	 */
	
	Response.prototype.get = function(field){
	  return this.header[field.toLowerCase()];
	};
	
	/**
	 * Set header related properties:
	 *
	 *   - `.type` the content type without params
	 *
	 * A response of "Content-Type: text/plain; charset=utf-8"
	 * will provide you with a `.type` of "text/plain".
	 *
	 * @param {Object} header
	 * @api private
	 */
	
	Response.prototype._setHeaderProperties = function(header){
	  // content-type
	  var ct = this.header['content-type'] || '';
	  this.type = type(ct);
	
	  // params
	  var obj = params(ct);
	  for (var key in obj) this[key] = obj[key];
	};
	
	/**
	 * Parse the given body `str`.
	 *
	 * Used for auto-parsing of bodies. Parsers
	 * are defined on the `superagent.parse` object.
	 *
	 * @param {String} str
	 * @return {Mixed}
	 * @api private
	 */
	
	Response.prototype._parseBody = function(str){
	  var parse = request.parse[this.type];
	  if (!parse && isJSON(this.type)) {
	    parse = request.parse['application/json'];
	  }
	  return parse && str && (str.length || str instanceof Object)
	    ? parse(str)
	    : null;
	};
	
	/**
	 * Set flags such as `.ok` based on `status`.
	 *
	 * For example a 2xx response will give you a `.ok` of __true__
	 * whereas 5xx will be __false__ and `.error` will be __true__. The
	 * `.clientError` and `.serverError` are also available to be more
	 * specific, and `.statusType` is the class of error ranging from 1..5
	 * sometimes useful for mapping respond colors etc.
	 *
	 * "sugar" properties are also defined for common cases. Currently providing:
	 *
	 *   - .noContent
	 *   - .badRequest
	 *   - .unauthorized
	 *   - .notAcceptable
	 *   - .notFound
	 *
	 * @param {Number} status
	 * @api private
	 */
	
	Response.prototype._setStatusProperties = function(status){
	  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
	  if (status === 1223) {
	    status = 204;
	  }
	
	  var type = status / 100 | 0;
	
	  // status / class
	  this.status = this.statusCode = status;
	  this.statusType = type;
	
	  // basics
	  this.info = 1 == type;
	  this.ok = 2 == type;
	  this.clientError = 4 == type;
	  this.serverError = 5 == type;
	  this.error = (4 == type || 5 == type)
	    ? this.toError()
	    : false;
	
	  // sugar
	  this.accepted = 202 == status;
	  this.noContent = 204 == status;
	  this.badRequest = 400 == status;
	  this.unauthorized = 401 == status;
	  this.notAcceptable = 406 == status;
	  this.notFound = 404 == status;
	  this.forbidden = 403 == status;
	};
	
	/**
	 * Return an `Error` representative of this response.
	 *
	 * @return {Error}
	 * @api public
	 */
	
	Response.prototype.toError = function(){
	  var req = this.req;
	  var method = req.method;
	  var url = req.url;
	
	  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
	  var err = new Error(msg);
	  err.status = this.status;
	  err.method = method;
	  err.url = url;
	
	  return err;
	};
	
	/**
	 * Expose `Response`.
	 */
	
	request.Response = Response;
	
	/**
	 * Initialize a new `Request` with the given `method` and `url`.
	 *
	 * @param {String} method
	 * @param {String} url
	 * @api public
	 */
	
	function Request(method, url) {
	  var self = this;
	  this._query = this._query || [];
	  this.method = method;
	  this.url = url;
	  this.header = {}; // preserves header name case
	  this._header = {}; // coerces header names to lowercase
	  this.on('end', function(){
	    var err = null;
	    var res = null;
	
	    try {
	      res = new Response(self);
	    } catch(e) {
	      err = new Error('Parser is unable to parse the response');
	      err.parse = true;
	      err.original = e;
	      // issue #675: return the raw response if the response parsing fails
	      err.rawResponse = self.xhr && self.xhr.responseText ? self.xhr.responseText : null;
	      // issue #876: return the http status code if the response parsing fails
	      err.statusCode = self.xhr && self.xhr.status ? self.xhr.status : null;
	      return self.callback(err);
	    }
	
	    self.emit('response', res);
	
	    var new_err;
	    try {
	      if (res.status < 200 || res.status >= 300) {
	        new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
	        new_err.original = err;
	        new_err.response = res;
	        new_err.status = res.status;
	      }
	    } catch(e) {
	      new_err = e; // #985 touching res may cause INVALID_STATE_ERR on old Android
	    }
	
	    // #1000 don't catch errors from the callback to avoid double calling it
	    if (new_err) {
	      self.callback(new_err, res);
	    } else {
	      self.callback(null, res);
	    }
	  });
	}
	
	/**
	 * Mixin `Emitter` and `requestBase`.
	 */
	
	Emitter(Request.prototype);
	for (var key in requestBase) {
	  Request.prototype[key] = requestBase[key];
	}
	
	/**
	 * Set Content-Type to `type`, mapping values from `request.types`.
	 *
	 * Examples:
	 *
	 *      superagent.types.xml = 'application/xml';
	 *
	 *      request.post('/')
	 *        .type('xml')
	 *        .send(xmlstring)
	 *        .end(callback);
	 *
	 *      request.post('/')
	 *        .type('application/xml')
	 *        .send(xmlstring)
	 *        .end(callback);
	 *
	 * @param {String} type
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.type = function(type){
	  this.set('Content-Type', request.types[type] || type);
	  return this;
	};
	
	/**
	 * Set responseType to `val`. Presently valid responseTypes are 'blob' and
	 * 'arraybuffer'.
	 *
	 * Examples:
	 *
	 *      req.get('/')
	 *        .responseType('blob')
	 *        .end(callback);
	 *
	 * @param {String} val
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.responseType = function(val){
	  this._responseType = val;
	  return this;
	};
	
	/**
	 * Set Accept to `type`, mapping values from `request.types`.
	 *
	 * Examples:
	 *
	 *      superagent.types.json = 'application/json';
	 *
	 *      request.get('/agent')
	 *        .accept('json')
	 *        .end(callback);
	 *
	 *      request.get('/agent')
	 *        .accept('application/json')
	 *        .end(callback);
	 *
	 * @param {String} accept
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.accept = function(type){
	  this.set('Accept', request.types[type] || type);
	  return this;
	};
	
	/**
	 * Set Authorization field value with `user` and `pass`.
	 *
	 * @param {String} user
	 * @param {String} pass
	 * @param {Object} options with 'type' property 'auto' or 'basic' (default 'basic')
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.auth = function(user, pass, options){
	  if (!options) {
	    options = {
	      type: 'basic'
	    }
	  }
	
	  switch (options.type) {
	    case 'basic':
	      var str = btoa(user + ':' + pass);
	      this.set('Authorization', 'Basic ' + str);
	    break;
	
	    case 'auto':
	      this.username = user;
	      this.password = pass;
	    break;
	  }
	  return this;
	};
	
	/**
	* Add query-string `val`.
	*
	* Examples:
	*
	*   request.get('/shoes')
	*     .query('size=10')
	*     .query({ color: 'blue' })
	*
	* @param {Object|String} val
	* @return {Request} for chaining
	* @api public
	*/
	
	Request.prototype.query = function(val){
	  if ('string' != typeof val) val = serialize(val);
	  if (val) this._query.push(val);
	  return this;
	};
	
	/**
	 * Queue the given `file` as an attachment to the specified `field`,
	 * with optional `filename`.
	 *
	 * ``` js
	 * request.post('/upload')
	 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
	 *   .end(callback);
	 * ```
	 *
	 * @param {String} field
	 * @param {Blob|File} file
	 * @param {String} filename
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.attach = function(field, file, filename){
	  this._getFormData().append(field, file, filename || file.name);
	  return this;
	};
	
	Request.prototype._getFormData = function(){
	  if (!this._formData) {
	    this._formData = new root.FormData();
	  }
	  return this._formData;
	};
	
	/**
	 * Invoke the callback with `err` and `res`
	 * and handle arity check.
	 *
	 * @param {Error} err
	 * @param {Response} res
	 * @api private
	 */
	
	Request.prototype.callback = function(err, res){
	  var fn = this._callback;
	  this.clearTimeout();
	  fn(err, res);
	};
	
	/**
	 * Invoke callback with x-domain error.
	 *
	 * @api private
	 */
	
	Request.prototype.crossDomainError = function(){
	  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
	  err.crossDomain = true;
	
	  err.status = this.status;
	  err.method = this.method;
	  err.url = this.url;
	
	  this.callback(err);
	};
	
	/**
	 * Invoke callback with timeout error.
	 *
	 * @api private
	 */
	
	Request.prototype._timeoutError = function(){
	  var timeout = this._timeout;
	  var err = new Error('timeout of ' + timeout + 'ms exceeded');
	  err.timeout = timeout;
	  this.callback(err);
	};
	
	/**
	 * Compose querystring to append to req.url
	 *
	 * @api private
	 */
	
	Request.prototype._appendQueryString = function(){
	  var query = this._query.join('&');
	  if (query) {
	    this.url += ~this.url.indexOf('?')
	      ? '&' + query
	      : '?' + query;
	  }
	};
	
	/**
	 * Initiate request, invoking callback `fn(res)`
	 * with an instanceof `Response`.
	 *
	 * @param {Function} fn
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.end = function(fn){
	  var self = this;
	  var xhr = this.xhr = request.getXHR();
	  var timeout = this._timeout;
	  var data = this._formData || this._data;
	
	  // store callback
	  this._callback = fn || noop;
	
	  // state change
	  xhr.onreadystatechange = function(){
	    if (4 != xhr.readyState) return;
	
	    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
	    // result in the error "Could not complete the operation due to error c00c023f"
	    var status;
	    try { status = xhr.status } catch(e) { status = 0; }
	
	    if (0 == status) {
	      if (self.timedout) return self._timeoutError();
	      if (self._aborted) return;
	      return self.crossDomainError();
	    }
	    self.emit('end');
	  };
	
	  // progress
	  var handleProgress = function(direction, e) {
	    if (e.total > 0) {
	      e.percent = e.loaded / e.total * 100;
	    }
	    e.direction = direction;
	    self.emit('progress', e);
	  }
	  if (this.hasListeners('progress')) {
	    try {
	      xhr.onprogress = handleProgress.bind(null, 'download');
	      if (xhr.upload) {
	        xhr.upload.onprogress = handleProgress.bind(null, 'upload');
	      }
	    } catch(e) {
	      // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
	      // Reported here:
	      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
	    }
	  }
	
	  // timeout
	  if (timeout && !this._timer) {
	    this._timer = setTimeout(function(){
	      self.timedout = true;
	      self.abort();
	    }, timeout);
	  }
	
	  // querystring
	  this._appendQueryString();
	
	  // initiate request
	  if (this.username && this.password) {
	    xhr.open(this.method, this.url, true, this.username, this.password);
	  } else {
	    xhr.open(this.method, this.url, true);
	  }
	
	  // CORS
	  if (this._withCredentials) xhr.withCredentials = true;
	
	  // body
	  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
	    // serialize stuff
	    var contentType = this._header['content-type'];
	    var serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
	    if (!serialize && isJSON(contentType)) serialize = request.serialize['application/json'];
	    if (serialize) data = serialize(data);
	  }
	
	  // set header fields
	  for (var field in this.header) {
	    if (null == this.header[field]) continue;
	    xhr.setRequestHeader(field, this.header[field]);
	  }
	
	  if (this._responseType) {
	    xhr.responseType = this._responseType;
	  }
	
	  // send stuff
	  this.emit('request', this);
	
	  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
	  // We need null here if data is undefined
	  xhr.send(typeof data !== 'undefined' ? data : null);
	  return this;
	};
	
	
	/**
	 * Expose `Request`.
	 */
	
	request.Request = Request;
	
	/**
	 * GET `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} [data] or fn
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.get = function(url, data, fn){
	  var req = request('GET', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.query(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * HEAD `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} [data] or fn
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.head = function(url, data, fn){
	  var req = request('HEAD', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * OPTIONS query to `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} [data] or fn
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.options = function(url, data, fn){
	  var req = request('OPTIONS', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * DELETE `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	function del(url, fn){
	  var req = request('DELETE', url);
	  if (fn) req.end(fn);
	  return req;
	};
	
	request['del'] = del;
	request['delete'] = del;
	
	/**
	 * PATCH `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed} [data]
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.patch = function(url, data, fn){
	  var req = request('PATCH', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * POST `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed} [data]
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.post = function(url, data, fn){
	  var req = request('POST', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * PUT `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} [data] or fn
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.put = function(url, data, fn){
	  var req = request('PUT', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module of mixed-in functions shared between node and client code
	 */
	var isObject = __webpack_require__(11);
	
	/**
	 * Clear previous timeout.
	 *
	 * @return {Request} for chaining
	 * @api public
	 */
	
	exports.clearTimeout = function _clearTimeout(){
	  this._timeout = 0;
	  clearTimeout(this._timer);
	  return this;
	};
	
	/**
	 * Override default response body parser
	 *
	 * This function will be called to convert incoming data into request.body
	 *
	 * @param {Function}
	 * @api public
	 */
	
	exports.parse = function parse(fn){
	  this._parser = fn;
	  return this;
	};
	
	/**
	 * Override default request body serializer
	 *
	 * This function will be called to convert data set via .send or .attach into payload to send
	 *
	 * @param {Function}
	 * @api public
	 */
	
	exports.serialize = function serialize(fn){
	  this._serializer = fn;
	  return this;
	};
	
	/**
	 * Set timeout to `ms`.
	 *
	 * @param {Number} ms
	 * @return {Request} for chaining
	 * @api public
	 */
	
	exports.timeout = function timeout(ms){
	  this._timeout = ms;
	  return this;
	};
	
	/**
	 * Promise support
	 *
	 * @param {Function} resolve
	 * @param {Function} reject
	 * @return {Request}
	 */
	
	exports.then = function then(resolve, reject) {
	  if (!this._fullfilledPromise) {
	    var self = this;
	    this._fullfilledPromise = new Promise(function(innerResolve, innerReject){
	      self.end(function(err, res){
	        if (err) innerReject(err); else innerResolve(res);
	      });
	    });
	  }
	  return this._fullfilledPromise.then(resolve, reject);
	}
	
	exports.catch = function(cb) {
	  return this.then(undefined, cb);
	};
	
	/**
	 * Allow for extension
	 */
	
	exports.use = function use(fn) {
	  fn(this);
	  return this;
	}
	
	
	/**
	 * Get request header `field`.
	 * Case-insensitive.
	 *
	 * @param {String} field
	 * @return {String}
	 * @api public
	 */
	
	exports.get = function(field){
	  return this._header[field.toLowerCase()];
	};
	
	/**
	 * Get case-insensitive header `field` value.
	 * This is a deprecated internal API. Use `.get(field)` instead.
	 *
	 * (getHeader is no longer used internally by the superagent code base)
	 *
	 * @param {String} field
	 * @return {String}
	 * @api private
	 * @deprecated
	 */
	
	exports.getHeader = exports.get;
	
	/**
	 * Set header `field` to `val`, or multiple fields with one object.
	 * Case-insensitive.
	 *
	 * Examples:
	 *
	 *      req.get('/')
	 *        .set('Accept', 'application/json')
	 *        .set('X-API-Key', 'foobar')
	 *        .end(callback);
	 *
	 *      req.get('/')
	 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
	 *        .end(callback);
	 *
	 * @param {String|Object} field
	 * @param {String} val
	 * @return {Request} for chaining
	 * @api public
	 */
	
	exports.set = function(field, val){
	  if (isObject(field)) {
	    for (var key in field) {
	      this.set(key, field[key]);
	    }
	    return this;
	  }
	  this._header[field.toLowerCase()] = val;
	  this.header[field] = val;
	  return this;
	};
	
	/**
	 * Remove header `field`.
	 * Case-insensitive.
	 *
	 * Example:
	 *
	 *      req.get('/')
	 *        .unset('User-Agent')
	 *        .end(callback);
	 *
	 * @param {String} field
	 */
	exports.unset = function(field){
	  delete this._header[field.toLowerCase()];
	  delete this.header[field];
	  return this;
	};
	
	/**
	 * Write the field `name` and `val`, or multiple fields with one object
	 * for "multipart/form-data" request bodies.
	 *
	 * ``` js
	 * request.post('/upload')
	 *   .field('foo', 'bar')
	 *   .end(callback);
	 *
	 * request.post('/upload')
	 *   .field({ foo: 'bar', baz: 'qux' })
	 *   .end(callback);
	 * ```
	 *
	 * @param {String|Object} name
	 * @param {String|Blob|File|Buffer|fs.ReadStream} val
	 * @return {Request} for chaining
	 * @api public
	 */
	exports.field = function(name, val) {
	
	  // name should be either a string or an object.
	  if (null === name ||  undefined === name) {
	    throw new Error('.field(name, val) name can not be empty');
	  }
	
	  if (isObject(name)) {
	    for (var key in name) {
	      this.field(key, name[key]);
	    }
	    return this;
	  }
	
	  // val should be defined now
	  if (null === val || undefined === val) {
	    throw new Error('.field(name, val) val can not be empty');
	  }
	  this._getFormData().append(name, val);
	  return this;
	};
	
	/**
	 * Abort the request, and clear potential timeout.
	 *
	 * @return {Request}
	 * @api public
	 */
	exports.abort = function(){
	  if (this._aborted) {
	    return this;
	  }
	  this._aborted = true;
	  this.xhr && this.xhr.abort(); // browser
	  this.req && this.req.abort(); // node
	  this.clearTimeout();
	  this.emit('abort');
	  return this;
	};
	
	/**
	 * Enable transmission of cookies with x-domain requests.
	 *
	 * Note that for this to work the origin must not be
	 * using "Access-Control-Allow-Origin" with a wildcard,
	 * and also must set "Access-Control-Allow-Credentials"
	 * to "true".
	 *
	 * @api public
	 */
	
	exports.withCredentials = function(){
	  // This is browser-only functionality. Node side is no-op.
	  this._withCredentials = true;
	  return this;
	};
	
	/**
	 * Set the max redirects to `n`. Does noting in browser XHR implementation.
	 *
	 * @param {Number} n
	 * @return {Request} for chaining
	 * @api public
	 */
	
	exports.redirects = function(n){
	  this._maxRedirects = n;
	  return this;
	};
	
	/**
	 * Convert to a plain javascript object (not JSON string) of scalar properties.
	 * Note as this method is designed to return a useful non-this value,
	 * it cannot be chained.
	 *
	 * @return {Object} describing method, url, and data of this request
	 * @api public
	 */
	
	exports.toJSON = function(){
	  return {
	    method: this.method,
	    url: this.url,
	    data: this._data,
	    headers: this._header
	  };
	};
	
	/**
	 * Check if `obj` is a host object,
	 * we don't want to serialize these :)
	 *
	 * TODO: future proof, move to compoent land
	 *
	 * @param {Object} obj
	 * @return {Boolean}
	 * @api private
	 */
	
	exports._isHost = function _isHost(obj) {
	  var str = {}.toString.call(obj);
	
	  switch (str) {
	    case '[object File]':
	    case '[object Blob]':
	    case '[object FormData]':
	      return true;
	    default:
	      return false;
	  }
	}
	
	/**
	 * Send `data` as the request body, defaulting the `.type()` to "json" when
	 * an object is given.
	 *
	 * Examples:
	 *
	 *       // manual json
	 *       request.post('/user')
	 *         .type('json')
	 *         .send('{"name":"tj"}')
	 *         .end(callback)
	 *
	 *       // auto json
	 *       request.post('/user')
	 *         .send({ name: 'tj' })
	 *         .end(callback)
	 *
	 *       // manual x-www-form-urlencoded
	 *       request.post('/user')
	 *         .type('form')
	 *         .send('name=tj')
	 *         .end(callback)
	 *
	 *       // auto x-www-form-urlencoded
	 *       request.post('/user')
	 *         .type('form')
	 *         .send({ name: 'tj' })
	 *         .end(callback)
	 *
	 *       // defaults to x-www-form-urlencoded
	 *      request.post('/user')
	 *        .send('name=tobi')
	 *        .send('species=ferret')
	 *        .end(callback)
	 *
	 * @param {String|Object} data
	 * @return {Request} for chaining
	 * @api public
	 */
	
	exports.send = function(data){
	  var obj = isObject(data);
	  var type = this._header['content-type'];
	
	  // merge
	  if (obj && isObject(this._data)) {
	    for (var key in data) {
	      this._data[key] = data[key];
	    }
	  } else if ('string' == typeof data) {
	    // default to x-www-form-urlencoded
	    if (!type) this.type('form');
	    type = this._header['content-type'];
	    if ('application/x-www-form-urlencoded' == type) {
	      this._data = this._data
	        ? this._data + '&' + data
	        : data;
	    } else {
	      this._data = (this._data || '') + data;
	    }
	  } else {
	    this._data = data;
	  }
	
	  if (!obj || this._isHost(data)) return this;
	
	  // default to json
	  if (!type) this.type('json');
	  return this;
	};


/***/ },
/* 18 */
/***/ function(module, exports) {

	// The node and browser modules expose versions of this with the
	// appropriate constructor function bound as first argument
	/**
	 * Issue a request:
	 *
	 * Examples:
	 *
	 *    request('GET', '/users').end(callback)
	 *    request('/users').end(callback)
	 *    request('/users', callback)
	 *
	 * @param {String} method
	 * @param {String|Function} url or callback
	 * @return {Request}
	 * @api public
	 */
	
	function request(RequestConstructor, method, url) {
	  // callback
	  if ('function' == typeof url) {
	    return new RequestConstructor('GET', method).end(url);
	  }
	
	  // url first
	  if (2 == arguments.length) {
	    return new RequestConstructor('GET', method);
	  }
	
	  return new RequestConstructor(method, url);
	}
	
	module.exports = request;


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Expose `Emitter`.
	 */
	
	if (true) {
	  module.exports = Emitter;
	}
	
	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */
	
	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};
	
	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */
	
	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}
	
	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
	    .push(fn);
	  return this;
	};
	
	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.once = function(event, fn){
	  function on() {
	    this.off(event, on);
	    fn.apply(this, arguments);
	  }
	
	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};
	
	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */
	
	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	
	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }
	
	  // specific event
	  var callbacks = this._callbacks['$' + event];
	  if (!callbacks) return this;
	
	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks['$' + event];
	    return this;
	  }
	
	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};
	
	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */
	
	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks['$' + event];
	
	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }
	
	  return this;
	};
	
	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */
	
	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks['$' + event] || [];
	};
	
	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */
	
	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};


/***/ },
/* 20 */
/***/ function(module, exports) {

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


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(4);
	
	var objectHelper = __webpack_require__(1);
	var assert = __webpack_require__(3);
	var responseHandler = __webpack_require__(5);
	
	function DBConnection(request, options) {
	  this.baseOptions = options;
	  this.request = request;
	}
	
	/**
	 * Signup a new user
	 *
	 * @method signup
	 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-signup
	 * @param {Function} cb
	 */
	DBConnection.prototype.signup = function (options, cb) {
	  var url;
	  var body;
	
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    connection: { type: 'string', message: 'connection option is required' },
	    email: { type: 'string', message: 'email option is required' },
	    password: { type: 'string', message: 'password option is required' }
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'dbconnections', 'signup');
	
	  body = objectHelper.merge(this.baseOptions, ['clientID'])
	                .with(options);
	
	  body = objectHelper.blacklist(body, ['scope']);
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	
	  return this.request
	    .post(url)
	    .send(body)
	    .end(responseHandler(cb));
	};
	
	/**
	 * Initializes the change password flow
	 *
	 * @method signup
	 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-change_password
	 * @param {Function} cb
	 */
	DBConnection.prototype.changePassword = function (options, cb) {
	  var url;
	  var body;
	
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    connection: { type: 'string', message: 'connection option is required' },
	    email: { type: 'string', message: 'email option is required' }
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'dbconnections', 'change_password');
	
	  body = objectHelper.merge(this.baseOptions, ['clientID'])
	                .with(options, ['email', 'connection']);
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	
	  return this.request
	    .post(url)
	    .send(body)
	    .end(responseHandler(cb));
	};
	
	module.exports = DBConnection;


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(4);
	
	var objectHelper = __webpack_require__(1);
	var assert = __webpack_require__(3);
	var qs = __webpack_require__(8);
	var responseHandler = __webpack_require__(5);
	
	function PasswordlessAuthentication(request, options) {
	  this.baseOptions = options;
	  this.request = request;
	}
	
	/**
	 * Builds and returns the passwordless TOTP verify url in order to initialize a new authN/authZ transaction
	 *
	 * @method buildVerifyUrl
	 * @param {Object} options
	 * @param {Function} cb
	 */
	PasswordlessAuthentication.prototype.buildVerifyUrl = function (options) {
	  var params;
	  var qString;
	
	  /* eslint-disable */
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    connection: { type: 'string', message: 'connection option is required' },
	    type: { type: 'string', message: 'type option is required', values: ['sms', 'email'],
	            value_message: 'type is not valid ([email,sms])' },
	    verificationCode: { type: 'string', message: 'verificationCode option is required' },
	    phoneNumber: { required: true, type: 'string', message: 'phoneNumber option is required',
	            condition: function (o) { return o.type === 'sms'; } },
	    email: { required: true, type: 'string', message: 'email option is required',
	            condition: function (o) { return o.type === 'email'; } }
	  });
	  /* eslint-enable */
	
	  assert.check(options, {
	    optional: true,
	    type: 'object',
	    message: 'options parameter is not valid'
	  });
	
	  params = objectHelper.merge(this.baseOptions, [
	    'clientID',
	    'responseType',
	    'responseMode',
	    'redirectUri',
	    'scope',
	    'audience'
	  ]).with(options);
	
	  params = objectHelper.blacklist(params, ['type']);
	
	  // eslint-disable-next-line
	  if (this.baseOptions._sendTelemetry) {
	    params.auth0Client = this.request.getTelemetryData();
	  }
	
	  params = objectHelper.toSnakeCase(params, ['auth0Client']);
	
	  qString = qs.build(params);
	
	  return urljoin(this.baseOptions.rootUrl, 'passwordless', 'verify_redirect', '?' + qString);
	};
	
	/**
	 * Initializes a new passwordless authN/authZ transaction
	 *
	 * @method start
	 * @param {Object} options: https://auth0.com/docs/api/authentication#passwordless
	 * @param {Function} cb
	 */
	PasswordlessAuthentication.prototype.start = function (options, cb) {
	  var url;
	  var body;
	  var cleanOption;
	
	  /* eslint-disable */
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    connection: { type: 'string', message: 'connection option is required' },
	    type: { type: 'string', message: 'type option is required', values: ['sms', 'email'],
	            value_message: 'type is not valid ([email,sms])' },
	    phoneNumber: { required: true, type: 'string', message: 'phoneNumber option is required',
	            condition: function (o) { return o.type === 'sms'; } },
	    email: { required: true, type: 'string', message: 'email option is required',
	            condition: function (o) { return o.type === 'email'; } }
	  });
	  /* eslint-enable */
	
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  cleanOption = objectHelper.blacklist(options, ['type']);
	
	  url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'start');
	
	  body = objectHelper.merge(this.baseOptions, ['clientID'])
	                .with(cleanOption);
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	
	  return this.request
	    .post(url)
	    .send(body)
	    .end(responseHandler(cb));
	};
	
	/**
	 * Verifies the passwordless TOTP and returns an error if any.
	 *
	 * @method buildVerifyUrl
	 * @param {Object} options
	 * @param {Function} cb
	 */
	PasswordlessAuthentication.prototype.verify = function (options, cb) {
	  var url;
	  var cleanOption;
	
	  /* eslint-disable */
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    connection: { type: 'string', message: 'connection option is required' },
	    type: { type: 'string', message: 'type option is required', values: ['sms', 'email'],
	            value_message: 'type is not valid ([email,sms])' },
	    verificationCode: { type: 'string', message: 'verificationCode option is required' },
	    phoneNumber: { required: true, type: 'string', message: 'phoneNumber option is required',
	            condition: function (o) { return o.type === 'sms'; } },
	    email: { required: true, type: 'string', message: 'email option is required',
	            condition: function (o) { return o.type === 'email'; } }
	  });
	  /* eslint-enable */
	
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  cleanOption = objectHelper.blacklist(options, ['type']);
	
	  cleanOption = objectHelper.toSnakeCase(cleanOption, ['auth0Client']);
	
	  url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'verify');
	
	  return this.request
	    .post(url)
	    .send(cleanOption)
	    .end(responseHandler(cb));
	};
	
	module.exports = PasswordlessAuthentication;


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var windowHandler = __webpack_require__(2);
	var base64Url = __webpack_require__(7);
	
	function create(name, value, days) {
	  var date;
	  var expires;
	
	  if (windowHandler.getDocument().cookie === undefined
	      || windowHandler.getDocument().cookie === null) {
	    throw new Error('cookie storage not available');
	  }
	
	  if (days) {
	    date = new Date();
	    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
	    expires = '; expires=' + date.toGMTString();
	  } else {
	    expires = '';
	  }
	
	  windowHandler.getDocument().cookie = name + '=' + base64Url.encode(value) + expires + '; path=/';
	}
	
	function read(name) {
	  var i;
	  var cookie;
	  var cookies;
	  var nameEQ = name + '=';
	
	  if (windowHandler.getDocument().cookie === undefined
	      || windowHandler.getDocument().cookie === null) {
	    throw new Error('cookie storage not available');
	  }
	
	  cookies = windowHandler.getDocument().cookie.split(';');
	
	  for (i = 0; i < cookies.length; i++) {
	    cookie = cookies[i];
	    while (cookie.charAt(0) === ' ') {
	      cookie = cookie.substring(1, cookie.length);
	    }
	    if (cookie.indexOf(nameEQ) === 0) {
	      return base64Url.decode(cookie.substring(nameEQ.length, cookie.length));
	    }
	  }
	
	  return null;
	}
	
	function erase(name) {
	  create(name, '', -1);
	}
	
	module.exports = {
	  create: create,
	  read: read,
	  erase: erase
	};


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var windowHelper = __webpack_require__(2);
	
	function IframeHandler(options) {
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
	
	IframeHandler.prototype.init = function () {
	  var _this = this;
	  var _window = windowHelper.getWindow();
	
	  this.iframe = _window.document.createElement('iframe');
	  this.iframe.style.display = 'none';
	  this.iframe.src = this.url;
	
	  if (this.usePostMessage) {
	    // Workaround to avoid using bind that does not work in IE8
	    this.transientMessageEventListener = function (e) {
	      _this.messageEventListener(e);
	    };
	
	    _window.addEventListener('message', this.transientMessageEventListener, false);
	  } else {
	    // Workaround to avoid using bind that does not work in IE8
	    this.transientEventListener = function () {
	      _this.loadEventListener();
	    };
	
	    this.iframe.addEventListener('load', this.transientEventListener, false);
	  }
	
	  _window.document.body.appendChild(this.iframe);
	
	  this.timeoutHandle = setTimeout(function () {
	    _this.timeoutHandler();
	  }, this.timeout);
	};
	
	IframeHandler.prototype.messageEventListener = function (e) {
	  this.destroy();
	  this.callbackHandler(e.data);
	};
	
	IframeHandler.prototype.loadEventListener = function () {
	  var result = this.auth0.parseHash(this.iframe.contentWindow.location.hash);
	  if (!result) {
	    return;
	  }
	
	  this.destroy();
	  this.callbackHandler(result);
	};
	
	IframeHandler.prototype.callbackHandler = function (result) {
	  var error = null;
	
	  if (result.error) {
	    error = result;
	    result = null;
	  }
	
	  this.callback(error, result);
	};
	
	IframeHandler.prototype.timeoutHandler = function () {
	  this.destroy();
	  if (this.timeoutCallback) {
	    this.timeoutCallback();
	  }
	};
	
	IframeHandler.prototype.destroy = function () {
	  var _this = this;
	
	  clearTimeout(this.timeoutHandle);
	
	  this._destroyTimeout = setTimeout(function () {
	    var _window = windowHelper.getWindow();
	    if (_this.usePostMessage) {
	      _window.removeEventListener('message', _this.transientMessageEventListener, false);
	    } else {
	      _this.iframe.removeEventListener('load', _this.transientEventListener, false);
	    }
	    _window.document.body.removeChild(_this.iframe);
	  }, 0);
	};
	
	module.exports = IframeHandler;


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var base64Url = __webpack_require__(7);
	
	function getPayload(jwt) {
	  var encoded = jwt && jwt.split('.')[1];
	  return JSON.parse(base64Url.decode(encoded));
	}
	
	module.exports = {
	  getPayload: getPayload
	};


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var objectHelper = __webpack_require__(1);
	
	var token_params = [
	// auth0
	  'realm',
	  'audience',
	// oauth2
	  'client_id',
	  'client_secret',
	  'redirect_uri',
	  'scope',
	  'code',
	  'grant_type',
	  'username',
	  'password',
	  'refresh_token',
	  'assertion',
	  'client_assertion',
	  'client_assertion_type',
	  'code_verifier'
	];
	
	var authorize_params = [
	// auth0
	  'connection',
	  'connection_scope',
	  'auth0Client',
	  'owp',
	// oauth2
	  'client_id',
	  'response_type',
	  'response_mode',
	  'redirect_uri',
	  'audience',
	  'scope',
	  'state',
	  'nonce',
	  'display',
	  'prompt',
	  'max_age',
	  'ui_locales',
	  'claims_locales',
	  'id_token_hint',
	  'login_hint',
	  'acr_values',
	  'claims',
	  'registration',
	  'request',
	  'request_uri',
	  'code_challenge',
	  'code_challenge_method'
	];
	
	function oauthAuthorizeParams(params) {
	  return objectHelper.pick(params, authorize_params);
	}
	
	function oauthTokenParams(params) {
	  return objectHelper.pick(params, token_params);
	}
	
	module.exports = {
	  oauthTokenParams: oauthTokenParams,
	  oauthAuthorizeParams: oauthAuthorizeParams
	};


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var WinChan = __webpack_require__(20);
	
	var windowHandler = __webpack_require__(2);
	var objectHelper = __webpack_require__(1);
	
	function PopupHandler() {
	  this._current_popup = null;
	}
	
	PopupHandler.prototype.stringifyPopupSettings = function (options) {
	  var settings = '';
	
	  for (var key in options) {
	    settings += key + '=' + options[key] + ',';
	  }
	
	  return settings.slice(0, -1);
	};
	
	PopupHandler.prototype.calculatePosition = function (options) {
	  var width = options.width || 500;
	  var height = options.height || 600;
	  var _window = windowHandler.getWindow();
	
	  var screenX = typeof _window.screenX !== 'undefined' ? _window.screenX : _window.screenLeft;
	  var screenY = typeof _window.screenY !== 'undefined' ? _window.screenY : _window.screenTop;
	
	  var outerWidth = typeof _window.outerWidth !== 'undefined'
	    ? _window.outerWidth
	    : _window.document.body.clientWidth;
	
	  var outerHeight = typeof _window.outerHeight !== 'undefined'
	    ? _window.outerHeight
	    : _window.document.body.clientHeight;
	
	  var left = screenX + ((outerWidth - width) / 2);
	  var top = screenY + ((outerHeight - height) / 2);
	
	  return { width: width, height: height, left: left, top: top };
	};
	
	PopupHandler.prototype.preload = function (options) {
	  var _this = this;
	  var _window = windowHandler.getWindow();
	  var popupPosition = this.calculatePosition(options.popupOptions || {});
	  var popupOptions = objectHelper.merge(popupPosition).with(options.popupOptions);
	  var url = options.url || 'about:blank';
	  var windowFeatures = this.stringifyPopupSettings(popupOptions);
	
	  if (this._current_popup && !this._current_popup.closed) {
	    return this._current_popup;
	  }
	
	  this._current_popup = _window.open(url, 'auth0_signup_popup', windowFeatures);
	
	  this._current_popup.kill = function () {
	    this.close();
	    _this._current_popup = null;
	  };
	
	  return this._current_popup;
	};
	
	PopupHandler.prototype.load = function (url, relayUrl, options, cb) {
	  var _this = this;
	  var popupPosition = this.calculatePosition(options.popupOptions || {});
	  var popupOptions = objectHelper.merge(popupPosition).with(options.popupOptions);
	
	  var winchanOptions = {
	    url: url,
	    relay_url: relayUrl,
	    window_features: this.stringifyPopupSettings(popupOptions),
	    popup: this._current_popup,
	    params: options
	  };
	
	  var popup = WinChan.open(winchanOptions, function (err, data) {
	    _this._current_popup = null;
	    return cb(err, data);
	  });
	
	  popup.focus();
	
	  return popup;
	};
	
	module.exports = PopupHandler;


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var windowHelper = __webpack_require__(2);
	
	function randomString(length) {
	  var bytes = new Uint8Array(length);
	  var result = [];
	  var charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';
	
	  var cryptoObj = windowHelper.getWindow().crypto || windowHelper.getWindow().msCrypto;
	  if (!cryptoObj) {
	    return null;
	  }
	
	  var random = cryptoObj.getRandomValues(bytes);
	
	  random.forEach(function (c) {
	    result.push(charset[c % charset.length]);
	  });
	
	  return result.join('');
	}
	
	module.exports = {
	  randomString: randomString
	};


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	var StorageHandler = __webpack_require__(32);
	var storage;
	
	function getStorage(force) {
	  if (!storage || force) {
	    storage = new StorageHandler();
	  }
	  return storage;
	}
	
	module.exports = {
	  getItem: function (key) {
	    var value = getStorage().getItem(key);
	    return value ? JSON.parse(value) : value;
	  },
	  removeItem: function (key) {
	    return getStorage().removeItem(key);
	  },
	  setItem: function (key, value) {
	    var json = JSON.stringify(value);
	    return getStorage().setItem(key, json);
	  },
	  reload: function() {
	    getStorage(true);
	  }
	};


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var windowHandler = __webpack_require__(2);
	var cookies = __webpack_require__(23);
	
	function CookieStorage() {}
	
	CookieStorage.prototype.getItem = function (key) {
	  return cookies.read(key);
	};
	
	CookieStorage.prototype.removeItem = function (key) {
	  cookies.erase(key);
	};
	
	CookieStorage.prototype.setItem = function (key, value) {
	  cookies.create(key, value, 1);
	};
	
	module.exports = CookieStorage;

/***/ },
/* 31 */
/***/ function(module, exports) {

	function DummyStorage() {}
	
	DummyStorage.prototype.getItem = function (key) { return null; };
	
	DummyStorage.prototype.removeItem = function (key) {};
	
	DummyStorage.prototype.setItem = function (key, value) {};
	
	module.exports = DummyStorage;

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var windowHandler = __webpack_require__(2);
	var DummyStorage = __webpack_require__(31);
	var CookieStorage = __webpack_require__(30);
	var Warn = __webpack_require__(6);
	
	function StorageHandler() {
	  this.warn = new Warn({});
	  this.storage = windowHandler.getWindow().localStorage || new CookieStorage();
	}
	
	StorageHandler.prototype.failover = function () {
	  if (this.storage instanceof DummyStorage) {
	    this.warn.warning('DummyStorage: ignore failover');
	    return;
	  } else if (this.storage instanceof CookieStorage) {
	    this.warn.warning('CookieStorage: failing over DummyStorage');
	    this.storage = new DummyStorage();
	  } else {
	    this.warn.warning('LocalStorage: failing over CookieStorage');
	    this.storage = new CookieStorage();
	  }
	};
	
	StorageHandler.prototype.getItem = function (key) {
	  try {
	    return this.storage.getItem(key);
	  } catch (e) {
	    this.warn.warning(e);
	    this.failover();
	    return this.getItem(key);
	  }
	};
	
	StorageHandler.prototype.removeItem = function (key) {
	  try {
	    return this.storage.removeItem(key);
	  } catch (e) {
	    this.warn.warning(e);
	    this.failover();
	    return this.removeItem(key);
	  }
	};
	
	StorageHandler.prototype.setItem = function (key, value) {
	  try {
	    return this.storage.setItem(key, value);
	  } catch (e) {
	    this.warn.warning(e);
	    this.failover();
	    return this.setItem(key, value);
	  }
	};
	
	module.exports = StorageHandler;


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(4);
	
	var RequestBuilder = __webpack_require__(9);
	var assert = __webpack_require__(3);
	var responseHandler = __webpack_require__(5);
	
	/**
	 * Auth0 Management API Client (methods allowed to be called from the browser only)
	 * @constructor
	 * @param {Object} options
	 * @param {Object} options.domain
	 * @param {Object} options.token
	 */
	function Management(options) {
	  /* eslint-disable */
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    domain: { type: 'string', message: 'domain option is required' },
	    token: { type: 'string', message: 'token option is required' },
	    _sendTelemetry: { optional: true, type: 'boolean', message: '_sendTelemetry option is not valid' },
	    _telemetryInfo: { optional: true, type: 'object', message: '_telemetryInfo option is not valid' }
	  });
	  /* eslint-enable */
	
	  this.baseOptions = options;
	
	  this.baseOptions.headers = { Authorization: 'Bearer ' + this.baseOptions.token };
	
	  this.request = new RequestBuilder(this.baseOptions);
	  this.baseOptions.rootUrl = urljoin('https://' + this.baseOptions.domain, 'api', 'v2');
	}
	
	/**
	 * Returns the user profile. https://auth0.com/docs/api/management/v2#!/Users/get_users_by_id
	 *
	 * @method getUser
	 * @param {String} userId
	 * @param {Function} cb
	 */
	Management.prototype.getUser = function (userId, cb) {
	  var url;
	
	  assert.check(userId, { type: 'string', message: 'userId parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'users', userId);
	
	  return this.request
	    .get(url)
	    .end(responseHandler(cb));
	};
	
	/**
	 * Updates the user metdata. It will patch the user metdata with the attributes sent.
	 * https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id
	 *
	 * @method patchUserMetadata
	 * @param {String} userId
	 * @param {Object} userMetadata
	 * @param {Function} cb
	 */
	Management.prototype.patchUserMetadata = function (userId, userMetadata, cb) {
	  var url;
	
	  assert.check(userId, { type: 'string', message: 'userId parameter is not valid' });
	  assert.check(userMetadata, { type: 'object', message: 'userMetadata parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'users', userId);
	
	  return this.request
	    .patch(url)
	    .send({ user_metadata: userMetadata })
	    .end(responseHandler(cb));
	};
	
	/**
	 * Link two users. https://auth0.com/docs/api/management/v2#!/Users/post_identities
	 *
	 * @method linkUser
	 * @param {String} userId
	 * @param {Object} secondaryUserToken
	 * @param {Function} cb
	 */
	Management.prototype.linkUser = function (userId, secondaryUserToken, cb) {
	  var url;
	  /* eslint-disable */
	  assert.check(userId, { type: 'string', message: 'userId parameter is not valid' });
	  assert.check(secondaryUserToken, { type: 'string',
	    message: 'secondaryUserToken parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	  /* eslint-enable */
	
	  url = urljoin(this.baseOptions.rootUrl, 'users', userId, 'identities');
	
	  return this.request
	    .post(url)
	    .send({ link_with: secondaryUserToken })
	    .end(responseHandler(cb));
	};
	
	module.exports = Management;


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	var assert = __webpack_require__(3);
	var error = __webpack_require__(13);
	var jwt = __webpack_require__(25);
	var qs = __webpack_require__(8);
	var windowHelper = __webpack_require__(2);
	var objectHelper = __webpack_require__(1);
	var TransactionManager = __webpack_require__(10);
	var Authentication = __webpack_require__(12);
	var Redirect = __webpack_require__(36);
	var Popup = __webpack_require__(35);
	var SilentAuthenticationHandler = __webpack_require__(37);
	
	/**
	 * Handles all the browser's authentication flows
	 * @constructor
	 * @param {Object} options
	 * @param {Object} options.domain
	 * @param {Object} options.clienID
	 * @param {Object} options.responseType
	 * @param {Object} options.responseMode
	 * @param {Object} options.scope
	 * @param {Object} options.audience
	 * @param {Object} options._disableDeprecationWarnings
	 */
	function WebAuth(options) {
	  /* eslint-disable */
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    domain: { type: 'string', message: 'domain option is required' },
	    clientID: { type: 'string', message: 'clientID option is required' },
	    responseType: { optional: true, type: 'string', message: 'responseType is not valid' },
	    responseMode: { optional: true, type: 'string', message: 'responseMode is not valid' },
	    redirectUri: { optional: true, type: 'string', message: 'redirectUri is not valid' },
	    scope: { optional: true, type: 'string', message: 'audience is not valid' },
	    audience: { optional: true, type: 'string', message: 'scope is not valid' },
	    tenant: { optional: true, type: 'string', message: 'tenant option is not valid. Required when using custom domains.' },
	    _disableDeprecationWarnings: { optional: true, type: 'boolean', message: '_disableDeprecationWarnings option is not valid' },
	    _sendTelemetry: { optional: true, type: 'boolean', message: '_sendTelemetry option is not valid' },
	    _telemetryInfo: { optional: true, type: 'object', message: '_telemetryInfo option is not valid' }
	  });
	  /* eslint-enable */
	
	  this.baseOptions = options;
	
	  this.baseOptions._sendTelemetry = this.baseOptions._sendTelemetry === false ?
	                                        this.baseOptions._sendTelemetry : true;
	
	  this.baseOptions.tenant = this.baseOptions.domain.split('.')[0];
	
	  this.transactionManager = new TransactionManager(this.baseOptions.transaction);
	
	  this.client = new Authentication(this.baseOptions);
	  this.redirect = new Redirect(this.client, this.baseOptions);
	  this.popup = new Popup(this.client, this.baseOptions);
	}
	
	/**
	 * Parse the url hash and extract the access token or id token depending on the transaction.
	 *
	 * @method parseHash
	 * @param {String} hash: the url hash or null to automatically extract from window.location.hash
	 * @param {Object} options: state and nonce can be provided to verify the response
	 */
	WebAuth.prototype.parseHash = function (hash, options) {
	  var parsedQs;
	  var err;
	  var token;
	
	  var _window = windowHelper.getWindow();
	
	  var hashStr = hash || _window.location.hash;
	  hashStr = hashStr.replace(/^#?\/?/, '');
	
	  options = options || {};
	
	  parsedQs = qs.parse(hashStr);
	
	  if (parsedQs.hasOwnProperty('error')) {
	    err = error.buildResponse(parsedQs.error, parsedQs.error_description);
	
	    if (parsedQs.state) {
	      err.state = parsedQs.state;
	    }
	
	    return err;
	  }
	
	  if (!parsedQs.hasOwnProperty('access_token')
	       && !parsedQs.hasOwnProperty('id_token')
	       && !parsedQs.hasOwnProperty('refresh_token')) {
	    return null;
	  }
	
	  if (parsedQs.id_token) {
	    token = this.validateToken(parsedQs.id_token, parsedQs.state || options.state, options.nonce);
	    if (token.error) {
	      return token;
	    }
	  }
	
	  return {
	    accessToken: parsedQs.access_token || null,
	    idToken: parsedQs.id_token || null,
	    idTokenPayload: token && token.payload ? token.payload : null,
	    appStatus: token ? token.appStatus || null : null,
	    refreshToken: parsedQs.refresh_token || null,
	    state: parsedQs.state || null,
	    expiresIn: parsedQs.expires_in || null,
	    tokenType: parsedQs.token_type || null
	  };
	};
	
	/**
	 * Decodes the id_token and verifies  the nonce.
	 *
	 * @method validateToken
	 * @param {String} token
	 * @param {String} state
	 * @param {String} nonce
	 */
	WebAuth.prototype.validateToken = function (token, state, nonce) {
	  var audiences;
	  var transaction;
	  var transactionNonce;
	  var tokenNonce;
	  var prof = jwt.getPayload(token);
	
	  audiences = assert.isArray(prof.aud) ? prof.aud : [prof.aud];
	  if (audiences.indexOf(this.baseOptions.clientID) === -1) {
	    return error.invalidJwt(
	      'The clientID configured (' + this.baseOptions.clientID + ') does not match ' +
	      'with the clientID set in the token (' + audiences.join(', ') + ').');
	  }
	
	  transaction = this.transactionManager.getStoredTransaction(state);
	  transactionNonce = (transaction && transaction.nonce) || nonce;
	  tokenNonce = prof.nonce || null;
	
	  if (transactionNonce && tokenNonce && transactionNonce !== tokenNonce) {
	    return error.invalidJwt('Nonce does not match');
	  }
	
	  // iss should be the Auth0 domain (i.e.: https://contoso.auth0.com/)
	  if (prof.iss && prof.iss !== 'https://' + this.baseOptions.domain + '/') {
	    return error.invalidJwt(
	      'The domain configured (https://' + this.baseOptions.domain + '/) does not match ' +
	      'with the domain set in the token (' + prof.iss + ').');
	  }
	
	  return {
	    payload: prof,
	    transaction: transaction
	  };
	};
	
	/**
	 * Executes a silent authentication transaction under the hood in order to fetch a new token.
	 *
	 * @method renewAuth
	 * @param {Object} options: any valid oauth2 parameter to be sent to the `/authorize` endpoint
	 * @param {Function} cb
	 */
	WebAuth.prototype.renewAuth = function (options, cb) {
	  var handler;
	  var prof;
	  var usePostMessage = !!options.usePostMessage;
	  var _this = this;
	
	  var params = objectHelper.merge(this.baseOptions, [
	    'clientID',
	    'redirectUri',
	    'responseType',
	    'scope',
	    'audience'
	  ]).with(options);
	
	  params.responseType = params.responseType || 'token';
	  params.responseMode = params.responseMode || 'fragment';
	
	  params = this.transactionManager.process(params);
	
	  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
	    scope: { type: 'string', message: 'scope option is required' },
	    audience: { type: 'string', message: 'audience option is required' }
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  params.prompt = 'none';
	
	  params = objectHelper.blacklist(params, ['usePostMessage', 'tenant']);
	
	  handler = new SilentAuthenticationHandler(this, this.client.buildAuthorizeUrl(params));
	  handler.login(usePostMessage, function (err, data) {
	    if (err) {
	      return cb(err);
	    }
	
	    if (data.id_token) {
	      prof = _this.validateToken(data.id_token, options.state);
	      if (prof.error) {
	        cb(prof);
	      }
	      data.idTokenPayload = prof;
	    }
	
	    return cb(err, data);
	  });
	};
	
	/**
	 * Initialices a change password transaction
	 *
	 * @method changePassword
	 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-change_password
	 * @param {Function} cb
	 */
	WebAuth.prototype.changePassword = function (options, cb) {
	  return this.client.dbConnection.changePassword(options, cb);
	};
	
	/**
	 * Initialices a passwordless authentication transaction
	 *
	 * @method passwordlessStart
	 * @param {Object} options: https://auth0.com/docs/api/authentication#passwordless
	 * @param {Object} options.type: `sms` or `email`
	 * @param {Object} options.phoneNumber: only if type = sms
	 * @param {Object} options.email: only if type = email
	 * @param {Function} cb
	 */
	WebAuth.prototype.passwordlessStart = function (options, cb) {
	  return this.client.passwordless.start(options, cb);
	};
	
	/**
	 * Signs up a new user
	 *
	 * @method signup
	 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-signup
	 * @param {Function} cb
	 */
	WebAuth.prototype.signup = function (options, cb) {
	  return this.client.dbConnection.signup(options, cb);
	};
	
	/**
	 * Redirects to the hosted login page (`/authorize`) in order to initialize a new authN/authZ transaction
	 *
	 * @method login
	 * @param {Object} options: https://auth0.com/docs/api/authentication#!#get--authorize_db
	 * @param {Function} cb
	 */
	WebAuth.prototype.login = function (options) {
	  var params = objectHelper.merge(this.baseOptions, [
	    'clientID',
	    'responseType',
	    'responseMode',
	    'redirectUri',
	    'scope',
	    'audience'
	  ]).with(options);
	
	  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
	    responseType: { type: 'string', message: 'responseType option is required' }
	  });
	
	  params = this.transactionManager.process(params);
	
	  windowHelper.redirect(this.client.buildAuthorizeUrl(params));
	};
	
	/**
	 * Redirects to the auth0 logout page
	 *
	 * @method logout
	 * @param {Object} options: https://auth0.com/docs/api/authentication#!#get--v2-logout
	 */
	WebAuth.prototype.logout = function (options) {
	  windowHelper.redirect(this.client.buildLogoutUrl(options));
	};
	
	/**
	 * Verifies the passwordless TOTP and redirects to finish the passwordless transaction
	 *
	 * @method passwordlessVerify
	 * @param {Object} options:
	 * @param {Object} options.type: `sms` or `email`
	 * @param {Object} options.phoneNumber: only if type = sms
	 * @param {Object} options.email: only if type = email
	 * @param {Object} options.connection: the connection name
	 * @param {Object} options.verificationCode: the TOTP code
	 * @param {Function} cb
	 */
	WebAuth.prototype.passwordlessVerify = function (options, cb) {
	  var _this = this;
	  return this.client.passwordless.verify(options, function (err) {
	    if (err) {
	      return cb(err);
	    }
	    return windowHelper.redirect(_this.client.passwordless.buildVerifyUrl(options));
	  });
	};
	
	module.exports = WebAuth;


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(4);
	
	var assert = __webpack_require__(3);
	var responseHandler = __webpack_require__(5);
	var PopupHandler = __webpack_require__(27);
	var objectHelper = __webpack_require__(1);
	var Warn = __webpack_require__(6);
	var TransactionManager = __webpack_require__(10);
	
	function Popup(client, options) {
	  this.baseOptions = options;
	  this.client = client;
	
	  this.transactionManager = new TransactionManager(this.baseOptions.transaction);
	  this.warn = new Warn({
	    disableWarnings: !!options._disableDeprecationWarnings
	  });
	}
	
	/**
	 * Initializes the popup window and returns the instance to be used later in order to avoid being blocked by the browser.
	 *
	 * @method preload
	 * @param {Object} options: receives the window height and width and any other window feature to be sent to window.open
	 */
	Popup.prototype.preload = function (options) {
	  var popup = new PopupHandler();
	  popup.preload(options || {});
	  return popup;
	};
	
	/**
	 * Internal use.
	 *
	 * @method getPopupHandler
	 */
	Popup.prototype.getPopupHandler = function (options, preload) {
	  if (options.popupHandler) {
	    return options.popupHandler;
	  }
	  return !!preload ? this.preload(options) : new PopupHandler();
	};
	
	/**
	 * Opens in a popup the hosted login page (`/authorize`) in order to initialize a new authN/authZ transaction
	 *
	 * @method authorize
	 * @param {Object} options: https://auth0.com/docs/api/authentication#!#get--authorize_db
	 * @param {Function} cb
	 */
	Popup.prototype.authorize = function (options, cb) {
	  var popup;
	  var url;
	  var relayUrl;
	
	  var params = objectHelper.merge(this.baseOptions, [
	    'clientID',
	    'scope',
	    'audience',
	    'responseType'
	  ]).with(objectHelper.blacklist(options, ['popupHandler']));
	
	  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
	    responseType: { type: 'string', message: 'responseType option is required' }
	  });
	
	  // used by server to render the relay page instead of sending the chunk in the
	  // url to the callback
	  params.owp = true;
	
	  params = this.transactionManager.process(params);
	
	  url = this.client.buildAuthorizeUrl(params);
	
	  popup = this.getPopupHandler(options);
	
	  relayUrl = urljoin(this.baseOptions.rootUrl, 'relay.html');
	
	  return popup.load(url, relayUrl, {}, responseHandler(cb));
	};
	
	/**
	 * Initializes the legacy Lock login flow in a popup
	 *
	 * @method login
	 * @param {Object} options
	 * @param {Function} cb
	 * @deprecated `webauth.popup.login` will be soon deprecated, use `webauth.client.login` instead.
	 */
	Popup.prototype.login = function (options, cb) {
	  var params;
	  var popup;
	  var url;
	  var relayUrl;
	
	  this.warn.warning('`webauth.popup.login` will be soon deprecated, use `webauth.client.login` instead.');
	
	  /* eslint-disable */
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' }, {
	    clientID: { optional: true, type: 'string', message: 'clientID option is required' },
	    redirectUri: { optional: true, type: 'string', message: 'redirectUri option is required' },
	    responseType: { optional: true, type: 'string', message: 'responseType option is required' },
	    scope: { optional: true, type: 'string', message: 'scope option is required' },
	    audience: { optional: true, type: 'string', message: 'audience option is required' }
	  });
	  /* eslint-enable */
	
	  popup = this.getPopupHandler(options);
	
	  options = objectHelper.merge(this.baseOptions, [
	    'clientID',
	    'scope',
	    'domain',
	    'audience'
	  ]).with(objectHelper.blacklist(options, ['popupHandler']));
	
	  params = objectHelper.pick(options, ['clientID', 'domain']);
	  params.options = objectHelper.toSnakeCase(
	    objectHelper.blacklist(options, ['clientID', 'domain'])
	  );
	
	  url = urljoin(this.baseOptions.rootUrl, 'sso_dbconnection_popup', options.clientID);
	  relayUrl = urljoin(this.baseOptions.rootUrl, 'relay.html');
	
	  return popup.load(url, relayUrl, params, responseHandler(cb));
	};
	
	/**
	 * Verifies the passwordless TOTP and returns the requested token
	 *
	 * @method passwordlessVerify
	 * @param {Object} options:
	 * @param {Object} options.type: `sms` or `email`
	 * @param {Object} options.phoneNumber: only if type = sms
	 * @param {Object} options.email: only if type = email
	 * @param {Object} options.connection: the connection name
	 * @param {Object} options.verificationCode: the TOTP code
	 * @param {Function} cb
	 */
	Popup.prototype.passwordlessVerify = function (options, cb) {
	  var _this = this;
	  return this.client.passwordless.verify(objectHelper.blacklist(options, ['popupHandler']),
	    function (err) {
	      if (err) {
	        return cb(err);
	      }
	
	      options.username = options.phoneNumber || options.email;
	      options.password = options.verificationCode;
	
	      delete options.email;
	      delete options.phoneNumber;
	      delete options.verificationCode;
	      delete options.type;
	
	      _this.client.loginWithResourceOwner(options, cb);
	    });
	};
	
	/**
	 * Signs up a new user and automatically logs the user in after the signup.
	 *
	 * @method signupAndLogin
	 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-signup
	 * @param {Function} cb
	 */
	Popup.prototype.signupAndLogin = function (options, cb) {
	  var _this = this;
	
	  // Preload popup to avoid the browser to block it since the login happens later
	  var popupHandler = this.getPopupHandler(options, true);
	  options.popupHandler = popupHandler;
	
	  return this.client.dbConnection.signup(objectHelper.blacklist(options, ['popupHandler']),
	    function (err) {
	      if (err) {
	        if (popupHandler._current_popup) {
	          popupHandler._current_popup.kill();
	        }
	        return cb(err);
	      }
	      _this.login(options, cb);
	    });
	};
	
	module.exports = Popup;

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	var UsernamePassword = __webpack_require__(38);
	var TransactionManager = __webpack_require__(10);
	var objectHelper = __webpack_require__(1);
	var Warn = __webpack_require__(6);
	var assert = __webpack_require__(3);
	
	function Redirect(client, options) {
	  this.baseOptions = options;
	  this.client = client;
	
	  this.transactionManager = new TransactionManager(this.baseOptions.transaction);
	  this.warn = new Warn({
	    disableWarnings: !!options._disableDeprecationWarnings
	  });
	}
	
	/**
	 * Initializes the legacy Lock login flow in redirect mode
	 *
	 * @method login
	 * @param {Object} options
	 * @param {Function} cb
	 * @deprecated `webauth.redirect.login` will be soon deprecated, use `webauth.login` instead.
	 */
	Redirect.prototype.login = function (options, cb) {
	  var usernamePassword;
	
	  var params = objectHelper.merge(this.baseOptions, [
	    'clientID',
	    'redirectUri',
	    'tenant',
	    'responseType',
	    'responseMode',
	    'scope',
	    'audience'
	  ]).with(options);
	
	  this.warn.warning('`webauth.redirect.login` will be soon deprecated, use `webauth.login` instead.');
	
	  assert.check(params, { type: 'object', message: 'options parameter is not valid' }, {
	    responseType: { type: 'string', message: 'responseType option is required' }
	  });
	
	  params = this.transactionManager.process(params);
	
	  usernamePassword = new UsernamePassword(this.baseOptions);
	  return usernamePassword.login(params, function (err, data) {
	    if (err) {
	      return cb(err);
	    }
	    return usernamePassword.callback(data);
	  });
	};
	
	/**
	 * Signs up a new user and automatically logs the user in after the signup.
	 *
	 * @method signupAndLogin
	 * @param {Object} options: https://auth0.com/docs/api/authentication#!#post--dbconnections-signup
	 * @param {Function} cb
	 */
	Redirect.prototype.signupAndLogin = function (options, cb) {
	  var _this = this;
	  return this.client.dbConnection.signup(options, function (err) {
	    if (err) {
	      return cb(err);
	    }
	    return _this.login(options, cb);
	  });
	};
	
	module.exports = Redirect;


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	var IframeHandler = __webpack_require__(24);
	
	function SilentAuthenticationHandler(auth0, authenticationUrl, timeout) {
	  this.auth0 = auth0;
	  this.authenticationUrl = authenticationUrl;
	  this.timeout = timeout || 60 * 1000;
	  this.handler = null;
	}
	
	SilentAuthenticationHandler.prototype.login = function (usePostMessage, callback) {
	  this.handler = new IframeHandler({
	    auth0: this.auth0,
	    url: this.authenticationUrl,
	    callback: callback,
	    timeout: this.timeout,
	    timeoutCallback: function () {
	      callback({
	        error: 'timeout',
	        description: 'Timeout during authentication renew.'
	      });
	    },
	    usePostMessage: usePostMessage || false
	  });
	
	  this.handler.init();
	};
	
	module.exports = SilentAuthenticationHandler;


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(4);
	
	var objectHelper = __webpack_require__(1);
	var RequestBuilder = __webpack_require__(9);
	var responseHandler = __webpack_require__(5);
	var windowHelper = __webpack_require__(2);
	
	function UsernamePassword(options) {
	  this.baseOptions = options;
	  this.request = new RequestBuilder(options);
	}
	
	UsernamePassword.prototype.login = function (options, cb) {
	  var url;
	  var body;
	
	  url = urljoin(this.baseOptions.rootUrl, 'usernamepassword', 'login');
	
	  options.username = options.username || options.email; // eslint-disable-line
	
	  options = objectHelper.blacklist(options, ['email']); // eslint-disable-line
	
	  body = objectHelper.merge(this.baseOptions, [
	    'clientID',
	    'redirectUri',
	    'tenant',
	    'responseType',
	    'responseMode',
	    'scope',
	    'audience'
	  ]).with(options);
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	
	  return this.request
	    .post(url)
	    .send(body)
	    .end(responseHandler(cb));
	};
	
	UsernamePassword.prototype.callback = function (formHtml) {
	  var div;
	  var form;
	  var _document = windowHelper.getDocument();
	
	  div = _document.createElement('div');
	  div.innerHTML = formHtml;
	  form = _document.body.appendChild(div).children[0];
	
	  form.submit();
	};
	
	module.exports = UsernamePassword;


/***/ }
/******/ ])
});
;