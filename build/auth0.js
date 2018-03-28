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

	module.exports = __webpack_require__(59);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* eslint-disable no-param-reassign */
	/* eslint-disable no-restricted-syntax */
	/* eslint-disable guard-for-in */
	
	var assert = __webpack_require__(4);
	var objectAssign = __webpack_require__(15);
	
	function pick(object, keys) {
	  return keys.reduce(function(prev, key) {
	    if (object[key]) {
	      prev[key] = object[key];
	    }
	    return prev;
	  }, {});
	}
	
	function getKeysNotIn(obj, allowedKeys) {
	  var notAllowed = [];
	  for (var key in obj) {
	    if (allowedKeys.indexOf(key) === -1) {
	      notAllowed.push(key);
	    }
	  }
	  return notAllowed;
	}
	
	function objectValues(obj) {
	  var values = [];
	  for (var key in obj) {
	    values.push(obj[key]);
	  }
	  return values;
	}
	
	function extend() {
	  var params = objectValues(arguments);
	  params.unshift({});
	  return objectAssign.get().apply(undefined, params);
	}
	
	function merge(object, keys) {
	  return {
	    base: keys ? pick(object, keys) : object,
	    with: function(object2, keys2) {
	      object2 = keys2 ? pick(object2, keys2) : object2;
	      return extend(this.base, object2);
	    }
	  };
	}
	
	function blacklist(object, blacklistedKeys) {
	  return Object.keys(object).reduce(function(p, key) {
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
	    if (
	      (!wasPrevUppercase && code >= 65 && code <= 90) ||
	      (!wasPrevNumber && code >= 48 && code <= 57)
	    ) {
	      newKey += '_';
	      newKey += str[index].toLowerCase();
	    } else {
	      newKey += str[index].toLowerCase();
	    }
	    wasPrevNumber = code >= 48 && code <= 57;
	    wasPrevUppercase = code >= 65 && code <= 90;
	    index++;
	  }
	
	  return newKey;
	}
	
	function snakeToCamel(str) {
	  var parts = str.split('_');
	  return parts.reduce(function(p, c) {
	    return p + c.charAt(0).toUpperCase() + c.slice(1);
	  }, parts.shift());
	}
	
	function toSnakeCase(object, exceptions) {
	  if (typeof object !== 'object' || assert.isArray(object) || object === null) {
	    return object;
	  }
	  exceptions = exceptions || [];
	
	  return Object.keys(object).reduce(function(p, key) {
	    var newKey = exceptions.indexOf(key) === -1 ? camelToSnake(key) : key;
	    p[newKey] = toSnakeCase(object[key]);
	    return p;
	  }, {});
	}
	
	function toCamelCase(object, exceptions) {
	  if (typeof object !== 'object' || assert.isArray(object) || object === null) {
	    return object;
	  }
	
	  exceptions = exceptions || [];
	
	  return Object.keys(object).reduce(function(p, key) {
	    var newKey = exceptions.indexOf(key) === -1 ? snakeToCamel(key) : key;
	    p[newKey] = toCamelCase(object[key]);
	    return p;
	  }, {});
	}
	
	function getLocationFromUrl(href) {
	  var match = href.match(
	    /^(https?:)\/\/(([^:/?#]*)(?::([0-9]+))?)([/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/
	  );
	  return (
	    match && {
	      href: href,
	      protocol: match[1],
	      host: match[2],
	      hostname: match[3],
	      port: match[4],
	      pathname: match[5],
	      search: match[6],
	      hash: match[7]
	    }
	  );
	}
	
	function getOriginFromUrl(url) {
	  if (!url) {
	    return undefined;
	  }
	  var parsed = getLocationFromUrl(url);
	  var origin = parsed.protocol + '//' + parsed.hostname;
	  if (parsed.port) {
	    origin += ':' + parsed.port;
	  }
	  return origin;
	}
	
	module.exports = {
	  toSnakeCase: toSnakeCase,
	  toCamelCase: toCamelCase,
	  blacklist: blacklist,
	  merge: merge,
	  pick: pick,
	  getKeysNotIn: getKeysNotIn,
	  extend: extend,
	  getOriginFromUrl: getOriginFromUrl,
	  getLocationFromUrl: getLocationFromUrl
	};


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {var objectHelper = __webpack_require__(1);
	
	function redirect(url) {
	  global.window.location = url;
	}
	
	function getDocument() {
	  return global.window.document;
	}
	
	function getWindow() {
	  return global.window;
	}
	
	function getOrigin() {
	  var location = global.window.location;
	  var origin = location.origin;
	  if (!origin) {
	    origin = objectHelper.getOriginFromUrl(location.href);
	  }
	  return origin;
	}
	
	module.exports = {
	  redirect: redirect,
	  getDocument: getDocument,
	  getWindow: getWindow,
	  getOrigin: getOrigin
	};
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 3 */
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
/* 4 */
/***/ function(module, exports) {

	var toString = Object.prototype.toString;
	
	function attribute(o, attr, type, text) {
	  type = type === 'array' ? 'object' : type;
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
	    var keys = Object.keys(attributes);
	
	    for (var index = 0; index < keys.length; index++) {
	      var a = keys[index];
	      if (!attributes[a].optional || o[a]) {
	        if (!attributes[a].condition || attributes[a].condition(o)) {
	          attribute(o, a, attributes[a].type, attributes[a].message);
	          if (attributes[a].values) {
	            value(o[a], attributes[a].values, attributes[a].value_message);
	          }
	        }
	      }
	    }
	  }
	}
	
	/**
	 * Wrap `Array.isArray` Polyfill for IE9
	 * source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
	 *
	 * @param {Array} array
	 * @private
	 */
	function isArray(array) {
	  if (this.supportsIsArray()) {
	    return Array.isArray(array);
	  }
	
	  return toString.call(array) === '[object Array]';
	}
	
	function supportsIsArray() {
	  return Array.isArray != null;
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
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var error = __webpack_require__(26);
	var objectHelper = __webpack_require__(1);
	
	function wrapCallback(cb, options) {
	  options = options || {};
	  options.ignoreCasing = options.ignoreCasing ? options.ignoreCasing : false;
	
	  return function(err, data) {
	    var errObj;
	
	    if (!err && !data) {
	      return cb(error.buildResponse('generic_error', 'Something went wrong'));
	    }
	
	    if (!err && data.err) {
	      err = data.err;
	      data = null;
	    }
	
	    if (!err && data.error) {
	      err = data;
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
	      errObj.description =
	        err.errorDescription ||
	        err.error_description ||
	        err.description ||
	        err.error ||
	        err.details ||
	        err.err ||
	        null;
	      if (options.forceLegacyError) {
	        errObj.error = errObj.code;
	        errObj.error_description = errObj.description;
	      }
	
	      if (err.name) {
	        errObj.name = err.name;
	      }
	
	      if (err.policy) {
	        errObj.policy = err.policy;
	      }
	
	      return cb(errObj);
	    }
	
	    if (data.type && (data.type === 'text/html' || data.type === 'text/plain')) {
	      return cb(null, data.text);
	    }
	
	    if (options.ignoreCasing) {
	      return cb(null, data.body || data);
	    }
	
	    return cb(null, objectHelper.toCamelCase(data.body || data));
	  };
	}
	
	module.exports = wrapCallback;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var stringify = __webpack_require__(14);
	var parse = __webpack_require__(13);
	var formats = __webpack_require__(8);
	
	module.exports = {
	    formats: formats,
	    parse: parse,
	    stringify: stringify
	};


/***/ },
/* 7 */
/***/ function(module, exports) {

	/* eslint-disable no-console */
	
	function Warn(options) {
	  this.disableWarnings = options.disableWarnings;
	}
	
	Warn.prototype.warning = function(message) {
	  if (this.disableWarnings) {
	    return;
	  }
	
	  console.warn(message);
	};
	
	module.exports = Warn;


/***/ },
/* 8 */
/***/ function(module, exports) {

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


/***/ },
/* 9 */
/***/ function(module, exports) {

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
	            if (options.plainObjects || options.allowPrototypes || !has.call(Object.prototype, source)) {
	                target[source] = true;
	            }
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
	        out += hexTable[0xF0 | (c >> 18)] + hexTable[0x80 | ((c >> 12) & 0x3F)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]; // eslint-disable-line max-len
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


/***/ },
/* 10 */
/***/ function(module, exports) {

	module.exports = { raw: '9.4.2' };


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/* eslint-disable no-param-reassign */
	var request = __webpack_require__(21);
	var base64Url = __webpack_require__(25);
	var version = __webpack_require__(10);
	
	// ------------------------------------------------ RequestWrapper
	
	function RequestWrapper(req) {
	  this.request = req;
	  this.method = req.method;
	  this.url = req.url;
	  this.body = req._data;
	  this.headers = req._header;
	}
	
	RequestWrapper.prototype.abort = function() {
	  this.request.abort();
	};
	
	RequestWrapper.prototype.getMethod = function() {
	  return this.method;
	};
	
	RequestWrapper.prototype.getBody = function() {
	  return this.body;
	};
	
	RequestWrapper.prototype.getUrl = function() {
	  return this.url;
	};
	
	RequestWrapper.prototype.getHeaders = function() {
	  return this.headers;
	};
	
	// ------------------------------------------------ RequestObj
	
	function RequestObj(req) {
	  this.request = req;
	}
	
	RequestObj.prototype.set = function(key, value) {
	  this.request = this.request.set(key, value);
	  return this;
	};
	
	RequestObj.prototype.send = function(body) {
	  this.request = this.request.send(body);
	  return this;
	};
	
	RequestObj.prototype.withCredentials = function() {
	  this.request = this.request.withCredentials();
	  return this;
	};
	
	RequestObj.prototype.end = function(cb) {
	  this.request = this.request.end(cb);
	  return new RequestWrapper(this.request);
	};
	
	// ------------------------------------------------ RequestBuilder
	
	function RequestBuilder(options) {
	  this._sendTelemetry = options._sendTelemetry === false ? options._sendTelemetry : true;
	  this._telemetryInfo = options._telemetryInfo || null;
	  this._timesToRetryFailedRequests = options._timesToRetryFailedRequests;
	  this.headers = options.headers || {};
	}
	
	RequestBuilder.prototype.setCommonConfiguration = function(ongoingRequest, options) {
	  options = options || {};
	
	  if (this._timesToRetryFailedRequests > 0) {
	    ongoingRequest = ongoingRequest.retry(this._timesToRetryFailedRequests);
	  }
	
	  if (options.noHeaders) {
	    return ongoingRequest;
	  }
	
	  var headers = this.headers;
	  ongoingRequest = ongoingRequest.set('Content-Type', 'application/json');
	
	  var keys = Object.keys(this.headers);
	
	  for (var a = 0; a < keys.length; a++) {
	    ongoingRequest = ongoingRequest.set(keys[a], headers[keys[a]]);
	  }
	
	  if (this._sendTelemetry) {
	    ongoingRequest = ongoingRequest.set('Auth0-Client', this.getTelemetryData());
	  }
	
	  return ongoingRequest;
	};
	
	RequestBuilder.prototype.getTelemetryData = function() {
	  var clientInfo = this._telemetryInfo || { name: 'auth0.js', version: version.raw };
	  var jsonClientInfo = JSON.stringify(clientInfo);
	  return base64Url.encode(jsonClientInfo);
	};
	
	RequestBuilder.prototype.get = function(url, options) {
	  return new RequestObj(this.setCommonConfiguration(request.get(url), options));
	};
	
	RequestBuilder.prototype.post = function(url, options) {
	  return new RequestObj(this.setCommonConfiguration(request.post(url), options));
	};
	
	RequestBuilder.prototype.patch = function(url, options) {
	  return new RequestObj(this.setCommonConfiguration(request.patch(url), options));
	};
	
	module.exports = RequestBuilder;


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	;(function (root, factory) {
		if (true) {
			// CommonJS
			module.exports = exports = factory();
		}
		else if (typeof define === "function" && define.amd) {
			// AMD
			define([], factory);
		}
		else {
			// Global (browser)
			root.CryptoJS = factory();
		}
	}(this, function () {
	
		/**
		 * CryptoJS core components.
		 */
		var CryptoJS = CryptoJS || (function (Math, undefined) {
		    /*
		     * Local polyfil of Object.create
		     */
		    var create = Object.create || (function () {
		        function F() {};
	
		        return function (obj) {
		            var subtype;
	
		            F.prototype = obj;
	
		            subtype = new F();
	
		            F.prototype = null;
	
		            return subtype;
		        };
		    }())
	
		    /**
		     * CryptoJS namespace.
		     */
		    var C = {};
	
		    /**
		     * Library namespace.
		     */
		    var C_lib = C.lib = {};
	
		    /**
		     * Base object for prototypal inheritance.
		     */
		    var Base = C_lib.Base = (function () {
	
	
		        return {
		            /**
		             * Creates a new object that inherits from this object.
		             *
		             * @param {Object} overrides Properties to copy into the new object.
		             *
		             * @return {Object} The new object.
		             *
		             * @static
		             *
		             * @example
		             *
		             *     var MyType = CryptoJS.lib.Base.extend({
		             *         field: 'value',
		             *
		             *         method: function () {
		             *         }
		             *     });
		             */
		            extend: function (overrides) {
		                // Spawn
		                var subtype = create(this);
	
		                // Augment
		                if (overrides) {
		                    subtype.mixIn(overrides);
		                }
	
		                // Create default initializer
		                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
		                    subtype.init = function () {
		                        subtype.$super.init.apply(this, arguments);
		                    };
		                }
	
		                // Initializer's prototype is the subtype object
		                subtype.init.prototype = subtype;
	
		                // Reference supertype
		                subtype.$super = this;
	
		                return subtype;
		            },
	
		            /**
		             * Extends this object and runs the init method.
		             * Arguments to create() will be passed to init().
		             *
		             * @return {Object} The new object.
		             *
		             * @static
		             *
		             * @example
		             *
		             *     var instance = MyType.create();
		             */
		            create: function () {
		                var instance = this.extend();
		                instance.init.apply(instance, arguments);
	
		                return instance;
		            },
	
		            /**
		             * Initializes a newly created object.
		             * Override this method to add some logic when your objects are created.
		             *
		             * @example
		             *
		             *     var MyType = CryptoJS.lib.Base.extend({
		             *         init: function () {
		             *             // ...
		             *         }
		             *     });
		             */
		            init: function () {
		            },
	
		            /**
		             * Copies properties into this object.
		             *
		             * @param {Object} properties The properties to mix in.
		             *
		             * @example
		             *
		             *     MyType.mixIn({
		             *         field: 'value'
		             *     });
		             */
		            mixIn: function (properties) {
		                for (var propertyName in properties) {
		                    if (properties.hasOwnProperty(propertyName)) {
		                        this[propertyName] = properties[propertyName];
		                    }
		                }
	
		                // IE won't copy toString using the loop above
		                if (properties.hasOwnProperty('toString')) {
		                    this.toString = properties.toString;
		                }
		            },
	
		            /**
		             * Creates a copy of this object.
		             *
		             * @return {Object} The clone.
		             *
		             * @example
		             *
		             *     var clone = instance.clone();
		             */
		            clone: function () {
		                return this.init.prototype.extend(this);
		            }
		        };
		    }());
	
		    /**
		     * An array of 32-bit words.
		     *
		     * @property {Array} words The array of 32-bit words.
		     * @property {number} sigBytes The number of significant bytes in this word array.
		     */
		    var WordArray = C_lib.WordArray = Base.extend({
		        /**
		         * Initializes a newly created word array.
		         *
		         * @param {Array} words (Optional) An array of 32-bit words.
		         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
		         *
		         * @example
		         *
		         *     var wordArray = CryptoJS.lib.WordArray.create();
		         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
		         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
		         */
		        init: function (words, sigBytes) {
		            words = this.words = words || [];
	
		            if (sigBytes != undefined) {
		                this.sigBytes = sigBytes;
		            } else {
		                this.sigBytes = words.length * 4;
		            }
		        },
	
		        /**
		         * Converts this word array to a string.
		         *
		         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
		         *
		         * @return {string} The stringified word array.
		         *
		         * @example
		         *
		         *     var string = wordArray + '';
		         *     var string = wordArray.toString();
		         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
		         */
		        toString: function (encoder) {
		            return (encoder || Hex).stringify(this);
		        },
	
		        /**
		         * Concatenates a word array to this word array.
		         *
		         * @param {WordArray} wordArray The word array to append.
		         *
		         * @return {WordArray} This word array.
		         *
		         * @example
		         *
		         *     wordArray1.concat(wordArray2);
		         */
		        concat: function (wordArray) {
		            // Shortcuts
		            var thisWords = this.words;
		            var thatWords = wordArray.words;
		            var thisSigBytes = this.sigBytes;
		            var thatSigBytes = wordArray.sigBytes;
	
		            // Clamp excess bits
		            this.clamp();
	
		            // Concat
		            if (thisSigBytes % 4) {
		                // Copy one byte at a time
		                for (var i = 0; i < thatSigBytes; i++) {
		                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
		                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
		                }
		            } else {
		                // Copy one word at a time
		                for (var i = 0; i < thatSigBytes; i += 4) {
		                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
		                }
		            }
		            this.sigBytes += thatSigBytes;
	
		            // Chainable
		            return this;
		        },
	
		        /**
		         * Removes insignificant bits.
		         *
		         * @example
		         *
		         *     wordArray.clamp();
		         */
		        clamp: function () {
		            // Shortcuts
		            var words = this.words;
		            var sigBytes = this.sigBytes;
	
		            // Clamp
		            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
		            words.length = Math.ceil(sigBytes / 4);
		        },
	
		        /**
		         * Creates a copy of this word array.
		         *
		         * @return {WordArray} The clone.
		         *
		         * @example
		         *
		         *     var clone = wordArray.clone();
		         */
		        clone: function () {
		            var clone = Base.clone.call(this);
		            clone.words = this.words.slice(0);
	
		            return clone;
		        },
	
		        /**
		         * Creates a word array filled with random bytes.
		         *
		         * @param {number} nBytes The number of random bytes to generate.
		         *
		         * @return {WordArray} The random word array.
		         *
		         * @static
		         *
		         * @example
		         *
		         *     var wordArray = CryptoJS.lib.WordArray.random(16);
		         */
		        random: function (nBytes) {
		            var words = [];
	
		            var r = (function (m_w) {
		                var m_w = m_w;
		                var m_z = 0x3ade68b1;
		                var mask = 0xffffffff;
	
		                return function () {
		                    m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
		                    m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
		                    var result = ((m_z << 0x10) + m_w) & mask;
		                    result /= 0x100000000;
		                    result += 0.5;
		                    return result * (Math.random() > .5 ? 1 : -1);
		                }
		            });
	
		            for (var i = 0, rcache; i < nBytes; i += 4) {
		                var _r = r((rcache || Math.random()) * 0x100000000);
	
		                rcache = _r() * 0x3ade67b7;
		                words.push((_r() * 0x100000000) | 0);
		            }
	
		            return new WordArray.init(words, nBytes);
		        }
		    });
	
		    /**
		     * Encoder namespace.
		     */
		    var C_enc = C.enc = {};
	
		    /**
		     * Hex encoding strategy.
		     */
		    var Hex = C_enc.Hex = {
		        /**
		         * Converts a word array to a hex string.
		         *
		         * @param {WordArray} wordArray The word array.
		         *
		         * @return {string} The hex string.
		         *
		         * @static
		         *
		         * @example
		         *
		         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
		         */
		        stringify: function (wordArray) {
		            // Shortcuts
		            var words = wordArray.words;
		            var sigBytes = wordArray.sigBytes;
	
		            // Convert
		            var hexChars = [];
		            for (var i = 0; i < sigBytes; i++) {
		                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
		                hexChars.push((bite >>> 4).toString(16));
		                hexChars.push((bite & 0x0f).toString(16));
		            }
	
		            return hexChars.join('');
		        },
	
		        /**
		         * Converts a hex string to a word array.
		         *
		         * @param {string} hexStr The hex string.
		         *
		         * @return {WordArray} The word array.
		         *
		         * @static
		         *
		         * @example
		         *
		         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
		         */
		        parse: function (hexStr) {
		            // Shortcut
		            var hexStrLength = hexStr.length;
	
		            // Convert
		            var words = [];
		            for (var i = 0; i < hexStrLength; i += 2) {
		                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
		            }
	
		            return new WordArray.init(words, hexStrLength / 2);
		        }
		    };
	
		    /**
		     * Latin1 encoding strategy.
		     */
		    var Latin1 = C_enc.Latin1 = {
		        /**
		         * Converts a word array to a Latin1 string.
		         *
		         * @param {WordArray} wordArray The word array.
		         *
		         * @return {string} The Latin1 string.
		         *
		         * @static
		         *
		         * @example
		         *
		         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
		         */
		        stringify: function (wordArray) {
		            // Shortcuts
		            var words = wordArray.words;
		            var sigBytes = wordArray.sigBytes;
	
		            // Convert
		            var latin1Chars = [];
		            for (var i = 0; i < sigBytes; i++) {
		                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
		                latin1Chars.push(String.fromCharCode(bite));
		            }
	
		            return latin1Chars.join('');
		        },
	
		        /**
		         * Converts a Latin1 string to a word array.
		         *
		         * @param {string} latin1Str The Latin1 string.
		         *
		         * @return {WordArray} The word array.
		         *
		         * @static
		         *
		         * @example
		         *
		         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
		         */
		        parse: function (latin1Str) {
		            // Shortcut
		            var latin1StrLength = latin1Str.length;
	
		            // Convert
		            var words = [];
		            for (var i = 0; i < latin1StrLength; i++) {
		                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
		            }
	
		            return new WordArray.init(words, latin1StrLength);
		        }
		    };
	
		    /**
		     * UTF-8 encoding strategy.
		     */
		    var Utf8 = C_enc.Utf8 = {
		        /**
		         * Converts a word array to a UTF-8 string.
		         *
		         * @param {WordArray} wordArray The word array.
		         *
		         * @return {string} The UTF-8 string.
		         *
		         * @static
		         *
		         * @example
		         *
		         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
		         */
		        stringify: function (wordArray) {
		            try {
		                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
		            } catch (e) {
		                throw new Error('Malformed UTF-8 data');
		            }
		        },
	
		        /**
		         * Converts a UTF-8 string to a word array.
		         *
		         * @param {string} utf8Str The UTF-8 string.
		         *
		         * @return {WordArray} The word array.
		         *
		         * @static
		         *
		         * @example
		         *
		         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
		         */
		        parse: function (utf8Str) {
		            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
		        }
		    };
	
		    /**
		     * Abstract buffered block algorithm template.
		     *
		     * The property blockSize must be implemented in a concrete subtype.
		     *
		     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
		     */
		    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
		        /**
		         * Resets this block algorithm's data buffer to its initial state.
		         *
		         * @example
		         *
		         *     bufferedBlockAlgorithm.reset();
		         */
		        reset: function () {
		            // Initial values
		            this._data = new WordArray.init();
		            this._nDataBytes = 0;
		        },
	
		        /**
		         * Adds new data to this block algorithm's buffer.
		         *
		         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
		         *
		         * @example
		         *
		         *     bufferedBlockAlgorithm._append('data');
		         *     bufferedBlockAlgorithm._append(wordArray);
		         */
		        _append: function (data) {
		            // Convert string to WordArray, else assume WordArray already
		            if (typeof data == 'string') {
		                data = Utf8.parse(data);
		            }
	
		            // Append
		            this._data.concat(data);
		            this._nDataBytes += data.sigBytes;
		        },
	
		        /**
		         * Processes available data blocks.
		         *
		         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
		         *
		         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
		         *
		         * @return {WordArray} The processed data.
		         *
		         * @example
		         *
		         *     var processedData = bufferedBlockAlgorithm._process();
		         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
		         */
		        _process: function (doFlush) {
		            // Shortcuts
		            var data = this._data;
		            var dataWords = data.words;
		            var dataSigBytes = data.sigBytes;
		            var blockSize = this.blockSize;
		            var blockSizeBytes = blockSize * 4;
	
		            // Count blocks ready
		            var nBlocksReady = dataSigBytes / blockSizeBytes;
		            if (doFlush) {
		                // Round up to include partial blocks
		                nBlocksReady = Math.ceil(nBlocksReady);
		            } else {
		                // Round down to include only full blocks,
		                // less the number of blocks that must remain in the buffer
		                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
		            }
	
		            // Count words ready
		            var nWordsReady = nBlocksReady * blockSize;
	
		            // Count bytes ready
		            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);
	
		            // Process blocks
		            if (nWordsReady) {
		                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
		                    // Perform concrete-algorithm logic
		                    this._doProcessBlock(dataWords, offset);
		                }
	
		                // Remove processed words
		                var processedWords = dataWords.splice(0, nWordsReady);
		                data.sigBytes -= nBytesReady;
		            }
	
		            // Return processed words
		            return new WordArray.init(processedWords, nBytesReady);
		        },
	
		        /**
		         * Creates a copy of this object.
		         *
		         * @return {Object} The clone.
		         *
		         * @example
		         *
		         *     var clone = bufferedBlockAlgorithm.clone();
		         */
		        clone: function () {
		            var clone = Base.clone.call(this);
		            clone._data = this._data.clone();
	
		            return clone;
		        },
	
		        _minBufferSize: 0
		    });
	
		    /**
		     * Abstract hasher template.
		     *
		     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
		     */
		    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
		        /**
		         * Configuration options.
		         */
		        cfg: Base.extend(),
	
		        /**
		         * Initializes a newly created hasher.
		         *
		         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
		         *
		         * @example
		         *
		         *     var hasher = CryptoJS.algo.SHA256.create();
		         */
		        init: function (cfg) {
		            // Apply config defaults
		            this.cfg = this.cfg.extend(cfg);
	
		            // Set initial values
		            this.reset();
		        },
	
		        /**
		         * Resets this hasher to its initial state.
		         *
		         * @example
		         *
		         *     hasher.reset();
		         */
		        reset: function () {
		            // Reset data buffer
		            BufferedBlockAlgorithm.reset.call(this);
	
		            // Perform concrete-hasher logic
		            this._doReset();
		        },
	
		        /**
		         * Updates this hasher with a message.
		         *
		         * @param {WordArray|string} messageUpdate The message to append.
		         *
		         * @return {Hasher} This hasher.
		         *
		         * @example
		         *
		         *     hasher.update('message');
		         *     hasher.update(wordArray);
		         */
		        update: function (messageUpdate) {
		            // Append
		            this._append(messageUpdate);
	
		            // Update the hash
		            this._process();
	
		            // Chainable
		            return this;
		        },
	
		        /**
		         * Finalizes the hash computation.
		         * Note that the finalize operation is effectively a destructive, read-once operation.
		         *
		         * @param {WordArray|string} messageUpdate (Optional) A final message update.
		         *
		         * @return {WordArray} The hash.
		         *
		         * @example
		         *
		         *     var hash = hasher.finalize();
		         *     var hash = hasher.finalize('message');
		         *     var hash = hasher.finalize(wordArray);
		         */
		        finalize: function (messageUpdate) {
		            // Final message update
		            if (messageUpdate) {
		                this._append(messageUpdate);
		            }
	
		            // Perform concrete-hasher logic
		            var hash = this._doFinalize();
	
		            return hash;
		        },
	
		        blockSize: 512/32,
	
		        /**
		         * Creates a shortcut function to a hasher's object interface.
		         *
		         * @param {Hasher} hasher The hasher to create a helper for.
		         *
		         * @return {Function} The shortcut function.
		         *
		         * @static
		         *
		         * @example
		         *
		         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
		         */
		        _createHelper: function (hasher) {
		            return function (message, cfg) {
		                return new hasher.init(cfg).finalize(message);
		            };
		        },
	
		        /**
		         * Creates a shortcut function to the HMAC's object interface.
		         *
		         * @param {Hasher} hasher The hasher to use in this HMAC helper.
		         *
		         * @return {Function} The shortcut function.
		         *
		         * @static
		         *
		         * @example
		         *
		         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
		         */
		        _createHmacHelper: function (hasher) {
		            return function (message, key) {
		                return new C_algo.HMAC.init(hasher, key).finalize(message);
		            };
		        }
		    });
	
		    /**
		     * Algorithm namespace.
		     */
		    var C_algo = C.algo = {};
	
		    return C;
		}(Math));
	
	
		return CryptoJS;
	
	}));

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(9);
	
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
	
	var parseValues = function parseQueryStringValues(str, options) {
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
	
	var parseObject = function parseObjectRecursive(chain, val, options) {
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
	        var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
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
	
	var parseKeys = function parseQueryStringKeys(givenKey, val, options) {
	    if (!givenKey) {
	        return;
	    }
	
	    // Transform dot notation to bracket notation
	    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;
	
	    // The regex chunks
	
	    var brackets = /(\[[^[\]]*])/;
	    var child = /(\[[^[\]]*])/g;
	
	    // Get the parent
	
	    var segment = brackets.exec(key);
	    var parent = segment ? key.slice(0, segment.index) : key;
	
	    // Stash the parent if it exists
	
	    var keys = [];
	    if (parent) {
	        // If we aren't using plain objects, optionally prefix keys
	        // that would overwrite object prototype properties
	        if (!options.plainObjects && has.call(Object.prototype, parent)) {
	            if (!options.allowPrototypes) {
	                return;
	            }
	        }
	
	        keys.push(parent);
	    }
	
	    // Loop through children appending to the array until we hit depth
	
	    var i = 0;
	    while ((segment = child.exec(key)) !== null && i < options.depth) {
	        i += 1;
	        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
	            if (!options.allowPrototypes) {
	                return;
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


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(9);
	var formats = __webpack_require__(8);
	
	var arrayPrefixGenerators = {
	    brackets: function brackets(prefix) { // eslint-disable-line func-name-matching
	        return prefix + '[]';
	    },
	    indices: function indices(prefix, key) { // eslint-disable-line func-name-matching
	        return prefix + '[' + key + ']';
	    },
	    repeat: function repeat(prefix) { // eslint-disable-line func-name-matching
	        return prefix;
	    }
	};
	
	var toISO = Date.prototype.toISOString;
	
	var defaults = {
	    delimiter: '&',
	    encode: true,
	    encoder: utils.encode,
	    encodeValuesOnly: false,
	    serializeDate: function serializeDate(date) { // eslint-disable-line func-name-matching
	        return toISO.call(date);
	    },
	    skipNulls: false,
	    strictNullHandling: false
	};
	
	var stringify = function stringify( // eslint-disable-line func-name-matching
	    object,
	    prefix,
	    generateArrayPrefix,
	    strictNullHandling,
	    skipNulls,
	    encoder,
	    filter,
	    sort,
	    allowDots,
	    serializeDate,
	    formatter,
	    encodeValuesOnly
	) {
	    var obj = object;
	    if (typeof filter === 'function') {
	        obj = filter(prefix, obj);
	    } else if (obj instanceof Date) {
	        obj = serializeDate(obj);
	    } else if (obj === null) {
	        if (strictNullHandling) {
	            return encoder && !encodeValuesOnly ? encoder(prefix) : prefix;
	        }
	
	        obj = '';
	    }
	
	    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || utils.isBuffer(obj)) {
	        if (encoder) {
	            var keyValue = encodeValuesOnly ? prefix : encoder(prefix);
	            return [formatter(keyValue) + '=' + formatter(encoder(obj))];
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
	                formatter,
	                encodeValuesOnly
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
	                formatter,
	                encodeValuesOnly
	            ));
	        }
	    }
	
	    return values;
	};
	
	module.exports = function (object, opts) {
	    var obj = object;
	    var options = opts || {};
	
	    if (options.encoder !== null && options.encoder !== undefined && typeof options.encoder !== 'function') {
	        throw new TypeError('Encoder has to be a function.');
	    }
	
	    var delimiter = typeof options.delimiter === 'undefined' ? defaults.delimiter : options.delimiter;
	    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;
	    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : defaults.skipNulls;
	    var encode = typeof options.encode === 'boolean' ? options.encode : defaults.encode;
	    var encoder = typeof options.encoder === 'function' ? options.encoder : defaults.encoder;
	    var sort = typeof options.sort === 'function' ? options.sort : null;
	    var allowDots = typeof options.allowDots === 'undefined' ? false : options.allowDots;
	    var serializeDate = typeof options.serializeDate === 'function' ? options.serializeDate : defaults.serializeDate;
	    var encodeValuesOnly = typeof options.encodeValuesOnly === 'boolean' ? options.encodeValuesOnly : defaults.encodeValuesOnly;
	    if (typeof options.format === 'undefined') {
	        options.format = formats.default;
	    } else if (!Object.prototype.hasOwnProperty.call(formats.formatters, options.format)) {
	        throw new TypeError('Unknown format option provided.');
	    }
	    var formatter = formats.formatters[options.format];
	    var objKeys;
	    var filter;
	
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
	            encode ? encoder : null,
	            filter,
	            sort,
	            allowDots,
	            serializeDate,
	            formatter,
	            encodeValuesOnly
	        ));
	    }
	
	    return keys.join(delimiter);
	};


/***/ },
/* 15 */
/***/ function(module, exports) {

	/* eslint-disable no-continue */
	
	function get() {
	  if (!Object.assign) {
	    return objectAssignPolyfill;
	  }
	
	  return Object.assign;
	}
	
	function objectAssignPolyfill(target) {
	  'use strict';
	  if (target === undefined || target === null) {
	    throw new TypeError('Cannot convert first argument to object');
	  }
	
	  var to = Object(target);
	  for (var i = 1; i < arguments.length; i++) {
	    var nextSource = arguments[i];
	    if (nextSource === undefined || nextSource === null) {
	      continue;
	    }
	
	    var keysArray = Object.keys(Object(nextSource));
	    for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
	      var nextKey = keysArray[nextIndex];
	      var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
	      if (desc !== undefined && desc.enumerable) {
	        to[nextKey] = nextSource[nextKey];
	      }
	    }
	  }
	  return to;
	}
	
	module.exports = {
	  get: get,
	  objectAssignPolyfill: objectAssignPolyfill
	};


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(3);
	
	var windowHelper = __webpack_require__(2);
	var objectHelper = __webpack_require__(1);
	var RequestBuilder = __webpack_require__(11);
	var WebMessageHandler = __webpack_require__(31);
	var responseHandler = __webpack_require__(5);
	
	function CrossOriginAuthentication(webAuth, options) {
	  this.webAuth = webAuth;
	  this.baseOptions = options;
	  this.request = new RequestBuilder(options);
	  this.webMessageHandler = new WebMessageHandler(webAuth);
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
	  return ['co/verifier', encodeURIComponent(origin), encodeURIComponent(coId)].join('/');
	}
	
	/**
	 * Logs in the user with username and password using the cross origin authentication (/co/authenticate) flow. You can use either `username` or `email` to identify the user, but `username` will take precedence over `email`.
	 * Some browsers might not be able to successfully authenticate if 3rd party cookies are disabled in your browser. [See here for more information.]{@link https://auth0.com/docs/cross-origin-authentication}.
	 * After the /co/authenticate call, you'll have to use the {@link parseHash} function at the `redirectUri` specified in the constructor.
	 *
	 * @method login
	 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
	 * @param {String} [options.username] Username (mutually exclusive with email)
	 * @param {String} [options.email] Email  (mutually exclusive with username)
	 * @param {String} options.password Password
	 * @param {String} [options.realm] Realm used to authenticate the user, it can be a realm name or a database connection name
	 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
	 */
	CrossOriginAuthentication.prototype.login = function(options, cb) {
	  var _this = this;
	  var theWindow = windowHelper.getWindow();
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
	  this.request.post(url).withCredentials().send(authenticateBody).end(function(err, data) {
	    if (err) {
	      var errorObject = (err.response && err.response.body) || {
	        error: 'request_error',
	        error_description: JSON.stringify(err)
	      };
	      return responseHandler(cb, { forceLegacyError: true })(errorObject);
	    }
	    var popupMode = options.popup === true;
	    options = objectHelper.blacklist(options, ['password', 'credentialType', 'otp', 'popup']);
	    var authorizeOptions = objectHelper
	      .merge(options)
	      .with({ loginTicket: data.body.login_ticket });
	    var key = createKey(_this.baseOptions.rootUrl, data.body.co_id);
	    theWindow.sessionStorage[key] = data.body.co_verifier;
	    if (popupMode) {
	      _this.webMessageHandler.run(
	        authorizeOptions,
	        responseHandler(cb, { forceLegacyError: true })
	      );
	    } else {
	      _this.webAuth.authorize(authorizeOptions);
	    }
	  });
	};
	
	function tryGetVerifier(theWindow, key) {
	  try {
	    var verifier = theWindow.sessionStorage[key];
	    theWindow.sessionStorage.removeItem(key);
	    return verifier;
	  } catch (e) {
	    return '';
	  }
	}
	
	/**
	 * Runs the callback code for the cross origin authentication call. This method is meant to be called by the cross origin authentication callback url.
	 *
	 * @method callback
	 */
	CrossOriginAuthentication.prototype.callback = function() {
	  var targetOrigin = decodeURIComponent(getFragment('origin'));
	  var theWindow = windowHelper.getWindow();
	
	  theWindow.addEventListener('message', function(evt) {
	    if (evt.data.type !== 'co_verifier_request') {
	      return;
	    }
	    var key = createKey(evt.origin, evt.data.request.id);
	    var verifier = tryGetVerifier(theWindow, key);
	
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
	
	module.exports = CrossOriginAuthentication;


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var random = __webpack_require__(54);
	var storage = __webpack_require__(29);
	
	var DEFAULT_NAMESPACE = 'com.auth0.auth.';
	
	function TransactionManager(options) {
	  options = options || {};
	  this.namespace = options.namespace || DEFAULT_NAMESPACE;
	  this.keyLength = options.keyLength || 32;
	}
	
	TransactionManager.prototype.process = function(options) {
	  if (!options.responseType) {
	    throw new Error('responseType is required');
	  }
	  var lastUsedConnection = options.realm || options.connection;
	  var responseTypeIncludesIdToken = options.responseType.indexOf('id_token') !== -1;
	
	  var transaction = this.generateTransaction(
	    options.appState,
	    options.state,
	    options.nonce,
	    lastUsedConnection,
	    responseTypeIncludesIdToken
	  );
	  if (!options.state) {
	    options.state = transaction.state;
	  }
	
	  if (responseTypeIncludesIdToken && !options.nonce) {
	    options.nonce = transaction.nonce;
	  }
	
	  return options;
	};
	
	TransactionManager.prototype.generateTransaction = function(
	  appState,
	  state,
	  nonce,
	  lastUsedConnection,
	  generateNonce
	) {
	  state = state || random.randomString(this.keyLength);
	  nonce = nonce || (generateNonce ? random.randomString(this.keyLength) : null);
	
	  storage.setItem(this.namespace + state, {
	    nonce: nonce,
	    appState: appState,
	    state: state,
	    lastUsedConnection: lastUsedConnection
	  });
	  return {
	    state: state,
	    nonce: nonce
	  };
	};
	
	TransactionManager.prototype.getStoredTransaction = function(state) {
	  var transactionData;
	
	  transactionData = storage.getItem(this.namespace + state);
	  storage.removeItem(this.namespace + state);
	  return transactionData;
	};
	
	module.exports = TransactionManager;


/***/ },
/* 18 */
/***/ function(module, exports) {

	'use strict'
	
	exports.byteLength = byteLength
	exports.toByteArray = toByteArray
	exports.fromByteArray = fromByteArray
	
	var lookup = []
	var revLookup = []
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array
	
	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	for (var i = 0, len = code.length; i < len; ++i) {
	  lookup[i] = code[i]
	  revLookup[code.charCodeAt(i)] = i
	}
	
	revLookup['-'.charCodeAt(0)] = 62
	revLookup['_'.charCodeAt(0)] = 63
	
	function placeHoldersCount (b64) {
	  var len = b64.length
	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }
	
	  // the number of equal signs (place holders)
	  // if there are two placeholders, than the two characters before it
	  // represent one byte
	  // if there is only one, then the three characters before it represent 2 bytes
	  // this is just a cheap hack to not do indexOf twice
	  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
	}
	
	function byteLength (b64) {
	  // base64 is 4/3 + up to two characters of the original data
	  return b64.length * 3 / 4 - placeHoldersCount(b64)
	}
	
	function toByteArray (b64) {
	  var i, j, l, tmp, placeHolders, arr
	  var len = b64.length
	  placeHolders = placeHoldersCount(b64)
	
	  arr = new Arr(len * 3 / 4 - placeHolders)
	
	  // if there are placeholders, only get up to the last complete 4 chars
	  l = placeHolders > 0 ? len - 4 : len
	
	  var L = 0
	
	  for (i = 0, j = 0; i < l; i += 4, j += 3) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
	    arr[L++] = (tmp >> 16) & 0xFF
	    arr[L++] = (tmp >> 8) & 0xFF
	    arr[L++] = tmp & 0xFF
	  }
	
	  if (placeHolders === 2) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
	    arr[L++] = tmp & 0xFF
	  } else if (placeHolders === 1) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
	    arr[L++] = (tmp >> 8) & 0xFF
	    arr[L++] = tmp & 0xFF
	  }
	
	  return arr
	}
	
	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
	}
	
	function encodeChunk (uint8, start, end) {
	  var tmp
	  var output = []
	  for (var i = start; i < end; i += 3) {
	    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
	    output.push(tripletToBase64(tmp))
	  }
	  return output.join('')
	}
	
	function fromByteArray (uint8) {
	  var tmp
	  var len = uint8.length
	  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
	  var output = ''
	  var parts = []
	  var maxChunkLength = 16383 // must be multiple of 3
	
	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
	  }
	
	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1]
	    output += lookup[tmp >> 2]
	    output += lookup[(tmp << 4) & 0x3F]
	    output += '=='
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
	    output += lookup[tmp >> 10]
	    output += lookup[(tmp >> 4) & 0x3F]
	    output += lookup[(tmp << 2) & 0x3F]
	    output += '='
	  }
	
	  parts.push(output)
	
	  return parts.join('')
	}


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	;(function (root, factory) {
		if (true) {
			// CommonJS
			module.exports = exports = factory(__webpack_require__(12));
		}
		else if (typeof define === "function" && define.amd) {
			// AMD
			define(["./core"], factory);
		}
		else {
			// Global (browser)
			factory(root.CryptoJS);
		}
	}(this, function (CryptoJS) {
	
		(function (Math) {
		    // Shortcuts
		    var C = CryptoJS;
		    var C_lib = C.lib;
		    var WordArray = C_lib.WordArray;
		    var Hasher = C_lib.Hasher;
		    var C_algo = C.algo;
	
		    // Initialization and round constants tables
		    var H = [];
		    var K = [];
	
		    // Compute constants
		    (function () {
		        function isPrime(n) {
		            var sqrtN = Math.sqrt(n);
		            for (var factor = 2; factor <= sqrtN; factor++) {
		                if (!(n % factor)) {
		                    return false;
		                }
		            }
	
		            return true;
		        }
	
		        function getFractionalBits(n) {
		            return ((n - (n | 0)) * 0x100000000) | 0;
		        }
	
		        var n = 2;
		        var nPrime = 0;
		        while (nPrime < 64) {
		            if (isPrime(n)) {
		                if (nPrime < 8) {
		                    H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
		                }
		                K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));
	
		                nPrime++;
		            }
	
		            n++;
		        }
		    }());
	
		    // Reusable object
		    var W = [];
	
		    /**
		     * SHA-256 hash algorithm.
		     */
		    var SHA256 = C_algo.SHA256 = Hasher.extend({
		        _doReset: function () {
		            this._hash = new WordArray.init(H.slice(0));
		        },
	
		        _doProcessBlock: function (M, offset) {
		            // Shortcut
		            var H = this._hash.words;
	
		            // Working variables
		            var a = H[0];
		            var b = H[1];
		            var c = H[2];
		            var d = H[3];
		            var e = H[4];
		            var f = H[5];
		            var g = H[6];
		            var h = H[7];
	
		            // Computation
		            for (var i = 0; i < 64; i++) {
		                if (i < 16) {
		                    W[i] = M[offset + i] | 0;
		                } else {
		                    var gamma0x = W[i - 15];
		                    var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
		                                  ((gamma0x << 14) | (gamma0x >>> 18)) ^
		                                   (gamma0x >>> 3);
	
		                    var gamma1x = W[i - 2];
		                    var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
		                                  ((gamma1x << 13) | (gamma1x >>> 19)) ^
		                                   (gamma1x >>> 10);
	
		                    W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
		                }
	
		                var ch  = (e & f) ^ (~e & g);
		                var maj = (a & b) ^ (a & c) ^ (b & c);
	
		                var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
		                var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));
	
		                var t1 = h + sigma1 + ch + K[i] + W[i];
		                var t2 = sigma0 + maj;
	
		                h = g;
		                g = f;
		                f = e;
		                e = (d + t1) | 0;
		                d = c;
		                c = b;
		                b = a;
		                a = (t1 + t2) | 0;
		            }
	
		            // Intermediate hash value
		            H[0] = (H[0] + a) | 0;
		            H[1] = (H[1] + b) | 0;
		            H[2] = (H[2] + c) | 0;
		            H[3] = (H[3] + d) | 0;
		            H[4] = (H[4] + e) | 0;
		            H[5] = (H[5] + f) | 0;
		            H[6] = (H[6] + g) | 0;
		            H[7] = (H[7] + h) | 0;
		        },
	
		        _doFinalize: function () {
		            // Shortcuts
		            var data = this._data;
		            var dataWords = data.words;
	
		            var nBitsTotal = this._nDataBytes * 8;
		            var nBitsLeft = data.sigBytes * 8;
	
		            // Add padding
		            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
		            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
		            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
		            data.sigBytes = dataWords.length * 4;
	
		            // Hash final blocks
		            this._process();
	
		            // Return final computed hash
		            return this._hash;
		        },
	
		        clone: function () {
		            var clone = Hasher.clone.call(this);
		            clone._hash = this._hash.clone();
	
		            return clone;
		        }
		    });
	
		    /**
		     * Shortcut function to the hasher's object interface.
		     *
		     * @param {WordArray|string} message The message to hash.
		     *
		     * @return {WordArray} The hash.
		     *
		     * @static
		     *
		     * @example
		     *
		     *     var hash = CryptoJS.SHA256('message');
		     *     var hash = CryptoJS.SHA256(wordArray);
		     */
		    C.SHA256 = Hasher._createHelper(SHA256);
	
		    /**
		     * Shortcut function to the HMAC's object interface.
		     *
		     * @param {WordArray|string} message The message to hash.
		     * @param {WordArray|string} key The secret key.
		     *
		     * @return {WordArray} The HMAC.
		     *
		     * @static
		     *
		     * @example
		     *
		     *     var hmac = CryptoJS.HmacSHA256(message, key);
		     */
		    C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
		}(Math));
	
	
		return CryptoJS.SHA256;
	
	}));

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var base64 = __webpack_require__(18);
	
	function padding(str) {
	  var mod = (str.length % 4);
	  var pad = 4 - mod;
	
	  if (mod === 0) {
	    return str;
	  }
	
	  return str + (new Array(1 + pad)).join('=');
	}
	
	function byteArrayToString(array) {
	  var result = "";
	  for (var i = 0; i < array.length; i++) {
	    result += String.fromCharCode(array[i]);
	  }
	  return result;
	}
	
	function stringToByteArray(str) {
	  var arr = new Array(str.length);
	  for (var a = 0; a < str.length; a++) {
	    arr[a] = str.charCodeAt(a);
	  }
	  return arr;
	}
	
	function byteArrayToHex(raw) {
	  var HEX = '';
	
	  for (var i = 0; i < raw.length; i++) {
	    var _hex = raw[i].toString(16);
	    HEX += (_hex.length === 2 ? _hex : '0' + _hex);
	  }
	
	  return HEX;
	}
	
	function encodeString(str) {
	  return base64.fromByteArray(stringToByteArray(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
	    return String.fromCharCode('0x' + p1);
	  })))
	  .replace(/\+/g, '-') // Convert '+' to '-'
	  .replace(/\//g, '_'); // Convert '/' to '_';
	}
	
	function decodeToString(str) {
	  str = padding(str)
	    .replace(/\-/g, '+') // Convert '-' to '+'
	    .replace(/_/g, '/'); // Convert '_' to '/'
	
	  return decodeURIComponent(byteArrayToString(base64.toByteArray(str)).split('').map(function (c) {
	    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
	  }).join(''));
	}
	
	function decodeToHEX(str) {
	  return byteArrayToHex(base64.toByteArray(padding(str)));
	}
	
	function base64ToBase64Url(base64String) {
	  var SAFE_URL_ENCODING_MAPPING = {
	    "+": "-",
	    "/": "_",
	    "=": ""
	  };
	
	  return base64String.replace(/[+/=]/g, function(m) {
	    return SAFE_URL_ENCODING_MAPPING[m];
	  });
	}
	
	module.exports = {
	  encodeString: encodeString,
	  decodeToString: decodeToString,
	  byteArrayToString: byteArrayToString,
	  stringToByteArray: stringToByteArray,
	  padding: padding,
	  byteArrayToHex: byteArrayToHex,
	  decodeToHEX: decodeToHEX,
	  base64ToBase64Url: base64ToBase64Url
	};


/***/ },
/* 21 */
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
	
	var Emitter = __webpack_require__(32);
	var RequestBase = __webpack_require__(42);
	var isObject = __webpack_require__(22);
	var ResponseBase = __webpack_require__(43);
	var Agent = __webpack_require__(41);
	
	/**
	 * Noop.
	 */
	
	function noop(){};
	
	/**
	 * Expose `request`.
	 */
	
	var request = exports = module.exports = function(method, url) {
	  // callback
	  if ('function' == typeof url) {
	    return new exports.Request('GET', method).end(url);
	  }
	
	  // url first
	  if (1 == arguments.length) {
	    return new exports.Request('GET', method);
	  }
	
	  return new exports.Request(method, url);
	}
	
	exports.Request = Request;
	
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
	  throw Error("Browser-only version of superagent could not find XHR");
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
	  xml: 'text/xml',
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
	  'application/json': JSON.stringify,
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
	  'application/json': JSON.parse,
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
	
	  for (var i = 0, len = lines.length; i < len; ++i) {
	    line = lines[i];
	    index = line.indexOf(':');
	    if (index === -1) { // could be empty line, just skip it
	      continue;
	    }
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
	  // should match /json or +json
	  // but not /json-seq
	  return /[\/+]json($|[^-\w])/.test(mime);
	}
	
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
	
	function Response(req) {
	  this.req = req;
	  this.xhr = this.req.xhr;
	  // responseText is accessible only if responseType is '' or 'text' and on older browsers
	  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
	     ? this.xhr.responseText
	     : null;
	  this.statusText = this.req.xhr.statusText;
	  var status = this.xhr.status;
	  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
	  if (status === 1223) {
	    status = 204;
	  }
	  this._setStatusProperties(status);
	  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
	  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
	  // getResponseHeader still works. so we get content-type even if getting
	  // other headers fails.
	  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
	  this._setHeaderProperties(this.header);
	
	  if (null === this.text && req._responseType) {
	    this.body = this.xhr.response;
	  } else {
	    this.body = this.req.method != 'HEAD'
	      ? this._parseBody(this.text ? this.text : this.xhr.response)
	      : null;
	  }
	}
	
	ResponseBase(Response.prototype);
	
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
	
	Response.prototype._parseBody = function(str) {
	  var parse = request.parse[this.type];
	  if (this.req._parser) {
	    return this.req._parser(this, str);
	  }
	  if (!parse && isJSON(this.type)) {
	    parse = request.parse['application/json'];
	  }
	  return parse && str && (str.length || str instanceof Object)
	    ? parse(str)
	    : null;
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
	      if (self.xhr) {
	        // ie9 doesn't have 'response' property
	        err.rawResponse = typeof self.xhr.responseType == 'undefined' ? self.xhr.responseText : self.xhr.response;
	        // issue #876: return the http status code if the response parsing fails
	        err.status = self.xhr.status ? self.xhr.status : null;
	        err.statusCode = err.status; // backwards-compat only
	      } else {
	        err.rawResponse = null;
	        err.status = null;
	      }
	
	      return self.callback(err);
	    }
	
	    self.emit('response', res);
	
	    var new_err;
	    try {
	      if (!self._isResponseOK(res)) {
	        new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
	      }
	    } catch(custom_err) {
	      new_err = custom_err; // ok() callback can throw
	    }
	
	    // #1000 don't catch errors from the callback to avoid double calling it
	    if (new_err) {
	      new_err.original = err;
	      new_err.response = res;
	      new_err.status = res.status;
	      self.callback(new_err, res);
	    } else {
	      self.callback(null, res);
	    }
	  });
	}
	
	/**
	 * Mixin `Emitter` and `RequestBase`.
	 */
	
	Emitter(Request.prototype);
	RequestBase(Request.prototype);
	
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
	 * @param {String} [pass] optional in case of using 'bearer' as type
	 * @param {Object} options with 'type' property 'auto', 'basic' or 'bearer' (default 'basic')
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.auth = function(user, pass, options){
	  if (1 === arguments.length) pass = '';
	  if (typeof pass === 'object' && pass !== null) { // pass is optional and can be replaced with options
	    options = pass;
	    pass = '';
	  }
	  if (!options) {
	    options = {
	      type: 'function' === typeof btoa ? 'basic' : 'auto',
	    };
	  }
	
	  var encoder = function(string) {
	    if ('function' === typeof btoa) {
	      return btoa(string);
	    }
	    throw new Error('Cannot use basic auth, btoa is not a function');
	  };
	
	  return this._auth(user, pass, options, encoder);
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
	 * with optional `options` (or filename).
	 *
	 * ``` js
	 * request.post('/upload')
	 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
	 *   .end(callback);
	 * ```
	 *
	 * @param {String} field
	 * @param {Blob|File} file
	 * @param {String|Object} options
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.attach = function(field, file, options){
	  if (file) {
	    if (this._data) {
	      throw Error("superagent can't mix .send() and .attach()");
	    }
	
	    this._getFormData().append(field, file, options || file.name);
	  }
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
	  if (this._shouldRetry(err, res)) {
	    return this._retry();
	  }
	
	  var fn = this._callback;
	  this.clearTimeout();
	
	  if (err) {
	    if (this._maxRetries) err.retries = this._retries - 1;
	    this.emit('error', err);
	  }
	
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
	
	// This only warns, because the request is still likely to work
	Request.prototype.buffer = Request.prototype.ca = Request.prototype.agent = function(){
	  console.warn("This is not supported in browser version of superagent");
	  return this;
	};
	
	// This throws, because it can't send/receive data as expected
	Request.prototype.pipe = Request.prototype.write = function(){
	  throw Error("Streaming is not supported in browser version of superagent");
	};
	
	/**
	 * Check if `obj` is a host object,
	 * we don't want to serialize these :)
	 *
	 * @param {Object} obj
	 * @return {Boolean}
	 * @api private
	 */
	Request.prototype._isHost = function _isHost(obj) {
	  // Native objects stringify to [object File], [object Blob], [object FormData], etc.
	  return obj && 'object' === typeof obj && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
	}
	
	/**
	 * Initiate request, invoking callback `fn(res)`
	 * with an instanceof `Response`.
	 *
	 * @param {Function} fn
	 * @return {Request} for chaining
	 * @api public
	 */
	
	Request.prototype.end = function(fn){
	  if (this._endCalled) {
	    console.warn("Warning: .end() was called twice. This is not supported in superagent");
	  }
	  this._endCalled = true;
	
	  // store callback
	  this._callback = fn || noop;
	
	  // querystring
	  this._finalizeQueryString();
	
	  return this._end();
	};
	
	Request.prototype._end = function() {
	  var self = this;
	  var xhr = (this.xhr = request.getXHR());
	  var data = this._formData || this._data;
	
	  this._setTimeouts();
	
	  // state change
	  xhr.onreadystatechange = function(){
	    var readyState = xhr.readyState;
	    if (readyState >= 2 && self._responseTimeoutTimer) {
	      clearTimeout(self._responseTimeoutTimer);
	    }
	    if (4 != readyState) {
	      return;
	    }
	
	    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
	    // result in the error "Could not complete the operation due to error c00c023f"
	    var status;
	    try { status = xhr.status } catch(e) { status = 0; }
	
	    if (!status) {
	      if (self.timedout || self._aborted) return;
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
	  };
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
	
	  // initiate request
	  try {
	    if (this.username && this.password) {
	      xhr.open(this.method, this.url, true, this.username, this.password);
	    } else {
	      xhr.open(this.method, this.url, true);
	    }
	  } catch (err) {
	    // see #1149
	    return this.callback(err);
	  }
	
	  // CORS
	  if (this._withCredentials) xhr.withCredentials = true;
	
	  // body
	  if (!this._formData && 'GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
	    // serialize stuff
	    var contentType = this._header['content-type'];
	    var serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
	    if (!serialize && isJSON(contentType)) {
	      serialize = request.serialize['application/json'];
	    }
	    if (serialize) data = serialize(data);
	  }
	
	  // set header fields
	  for (var field in this.header) {
	    if (null == this.header[field]) continue;
	
	    if (this.header.hasOwnProperty(field))
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
	
	request.agent = function() {
	  return new Agent();
	};
	
	["GET", "POST", "OPTIONS", "PATCH", "PUT", "DELETE"].forEach(function(method) {
	  Agent.prototype[method.toLowerCase()] = function(url, fn) {
	    var req = new request.Request(method, url);
	    this._setDefaults(req);
	    if (fn) {
	      req.end(fn);
	    }
	    return req;
	  };
	});
	
	Agent.prototype.del = Agent.prototype['delete'];
	
	/**
	 * GET `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} [data] or fn
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	request.get = function(url, data, fn) {
	  var req = request('GET', url);
	  if ('function' == typeof data) (fn = data), (data = null);
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
	
	request.head = function(url, data, fn) {
	  var req = request('HEAD', url);
	  if ('function' == typeof data) (fn = data), (data = null);
	  if (data) req.query(data);
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
	
	request.options = function(url, data, fn) {
	  var req = request('OPTIONS', url);
	  if ('function' == typeof data) (fn = data), (data = null);
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};
	
	/**
	 * DELETE `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed} [data]
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */
	
	function del(url, data, fn) {
	  var req = request('DELETE', url);
	  if ('function' == typeof data) (fn = data), (data = null);
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	}
	
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
	
	request.patch = function(url, data, fn) {
	  var req = request('PATCH', url);
	  if ('function' == typeof data) (fn = data), (data = null);
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
	
	request.post = function(url, data, fn) {
	  var req = request('POST', url);
	  if ('function' == typeof data) (fn = data), (data = null);
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
	
	request.put = function(url, data, fn) {
	  var req = request('PUT', url);
	  if ('function' == typeof data) (fn = data), (data = null);
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};


/***/ },
/* 22 */
/***/ function(module, exports) {

	'use strict';
	
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
/* 23 */
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
	        var origin = opts.origin || extractOrigin(opts.url);
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
	          } catch(err) {
	            if (cb) {
	              cb(err);
	            } else {
	              throw err;
	            }
	          }
	
	          if (d.a === 'ready') {
	            messageTarget.postMessage(req, origin);
	          } else if (d.a === 'error') {
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
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(3);
	
	var RequestBuilder = __webpack_require__(11);
	var qs = __webpack_require__(6);
	var objectHelper = __webpack_require__(1);
	var assert = __webpack_require__(4);
	var ssodata = __webpack_require__(28);
	var responseHandler = __webpack_require__(5);
	var parametersWhitelist = __webpack_require__(51);
	var Warn = __webpack_require__(7);
	
	var PasswordlessAuthentication = __webpack_require__(49);
	var DBConnection = __webpack_require__(48);
	
	/**
	 * Creates a new Auth0 Authentication API client
	 * @constructor
	 * @param {Object} options
	 * @param {String} options.domain your Auth0 domain
	 * @param {String} options.clientID your Auth0 client identifier obtained when creating the client in the Auth0 Dashboard
	 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0}
	 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @see {@link https://auth0.com/docs/api/authentication}
	 */
	function Authentication(auth0, options) {
	  // If we have two arguments, the first one is a WebAuth instance, so we assign that
	  // if not, it's an options object and then we should use that as options instead
	  // this is here because we don't want to break people coming from v8
	  if (arguments.length === 2) {
	    this.auth0 = auth0;
	  } else {
	    options = auth0;
	  }
	
	  /* eslint-disable */
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      domain: { type: 'string', message: 'domain option is required' },
	      clientID: { type: 'string', message: 'clientID option is required' },
	      responseType: { optional: true, type: 'string', message: 'responseType is not valid' },
	      responseMode: { optional: true, type: 'string', message: 'responseMode is not valid' },
	      redirectUri: { optional: true, type: 'string', message: 'redirectUri is not valid' },
	      scope: { optional: true, type: 'string', message: 'scope is not valid' },
	      audience: { optional: true, type: 'string', message: 'audience is not valid' },
	      _disableDeprecationWarnings: {
	        optional: true,
	        type: 'boolean',
	        message: '_disableDeprecationWarnings option is not valid'
	      },
	      _sendTelemetry: {
	        optional: true,
	        type: 'boolean',
	        message: '_sendTelemetry option is not valid'
	      },
	      _telemetryInfo: {
	        optional: true,
	        type: 'object',
	        message: '_telemetryInfo option is not valid'
	      }
	    }
	  );
	  /* eslint-enable */
	
	  this.baseOptions = options;
	  this.baseOptions._sendTelemetry = this.baseOptions._sendTelemetry === false
	    ? this.baseOptions._sendTelemetry
	    : true;
	
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
	 * @param {Object} options
	 * @param {String} [options.domain] your Auth0 domain
	 * @param {String} [options.clientID] your Auth0 client identifier obtained when creating the client in the Auth0 Dashboard
	 * @param {String} options.redirectUri url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} options.responseType type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0}
	 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
	 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
	 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
	 * @see {@link https://auth0.com/docs/api/authentication#social}
	 */
	Authentication.prototype.buildAuthorizeUrl = function(options) {
	  var params;
	  var qString;
	
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' });
	
	  params = objectHelper
	    .merge(this.baseOptions, [
	      'clientID',
	      'responseType',
	      'responseMode',
	      'redirectUri',
	      'scope',
	      'audience'
	    ])
	    .with(options);
	
	  /* eslint-disable */
	  assert.check(
	    params,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      clientID: { type: 'string', message: 'clientID option is required' },
	      redirectUri: { optional: true, type: 'string', message: 'redirectUri option is required' },
	      responseType: { type: 'string', message: 'responseType option is required' },
	      nonce: {
	        type: 'string',
	        message: 'nonce option is required',
	        condition: function(o) {
	          return o.responseType.indexOf('code') === -1 && o.responseType.indexOf('id_token') !== -1;
	        }
	      },
	      scope: { optional: true, type: 'string', message: 'scope option is required' },
	      audience: { optional: true, type: 'string', message: 'audience option is required' }
	    }
	  );
	  /* eslint-enable */
	
	  // eslint-disable-next-line
	  if (this.baseOptions._sendTelemetry) {
	    params.auth0Client = this.request.getTelemetryData();
	  }
	
	  if (params.connection_scope && assert.isArray(params.connection_scope)) {
	    params.connection_scope = params.connection_scope.join(',');
	  }
	
	  params = objectHelper.blacklist(params, [
	    'username',
	    'popupOptions',
	    'domain',
	    'tenant',
	    'timeout'
	  ]);
	  params = objectHelper.toSnakeCase(params, ['auth0Client']);
	  params = parametersWhitelist.oauthAuthorizeParams(this.warn, params);
	
	  qString = qs.stringify(params);
	
	  return urljoin(this.baseOptions.rootUrl, 'authorize', '?' + qString);
	};
	
	/**
	 * Builds and returns the Logout url in order to initialize a new authN/authZ transaction
	 *
	 * If you want to navigate the user to a specific URL after the logout, set that URL at the returnTo parameter. The URL should be included in any the appropriate Allowed Logout URLs list:
	 *
	 * - If the client_id parameter is included, the returnTo URL must be listed in the Allowed Logout URLs set at the client level (see Setting Allowed Logout URLs at the App Level).
	 * - If the client_id parameter is NOT included, the returnTo URL must be listed in the Allowed Logout URLs set at the account level (see Setting Allowed Logout URLs at the Account Level).
	 * @method buildLogoutUrl
	 * @param {Object} options
	 * @param {String} [options.clientID] identifier of your client
	 * @param {String} [options.returnTo] URL to be redirected after the logout
	 * @param {Boolean} [options.federated] tells Auth0 if it should logout the user also from the IdP.
	 * @see {@link https://auth0.com/docs/api/authentication#logout}
	 */
	Authentication.prototype.buildLogoutUrl = function(options) {
	  var params;
	  var qString;
	
	  assert.check(options, {
	    optional: true,
	    type: 'object',
	    message: 'options parameter is not valid'
	  });
	
	  params = objectHelper.merge(this.baseOptions, ['clientID']).with(options || {});
	
	  // eslint-disable-next-line
	  if (this.baseOptions._sendTelemetry) {
	    params.auth0Client = this.request.getTelemetryData();
	  }
	
	  params = objectHelper.toSnakeCase(params, ['auth0Client', 'returnTo']);
	
	  qString = qs.stringify(objectHelper.blacklist(params, ['federated']));
	  if (
	    options &&
	    options.federated !== undefined &&
	    options.federated !== false &&
	    options.federated !== 'false'
	  ) {
	    qString += '&federated';
	  }
	
	  return urljoin(this.baseOptions.rootUrl, 'v2', 'logout', '?' + qString);
	};
	
	/**
	 * @callback authorizeCallback
	 * @param {Error} [err] error returned by Auth0 with the reason of the Auth failure
	 * @param {Object} [result] result of the Auth request
	 * @param {String} [result.accessToken] token that allows access to the specified resource server (identified by the audience parameter or by default Auth0's /userinfo endpoint)
	 * @param {Number} [result.expiresIn] number of seconds until the access token expires
	 * @param {String} [result.idToken] token that identifies the user
	 * @param {String} [result.refreshToken] token that can be used to get new access tokens from Auth0. Note that not all clients can request them or the resource server might not allow them.
	 */
	
	/**
	 * @callback tokenCallback
	 * @param {Error} [err] error returned by Auth0 with the reason of the Auth failure
	 * @param {Object} [result] result of the Auth request
	 * @param {String} result.accessToken token that allows access to the specified resource server (identified by the audience parameter or by default Auth0's /userinfo endpoint)
	 * @param {Number} result.expiresIn number of seconds until the access token expires
	 * @param {String} [result.idToken] token that identifies the user
	 * @param {String} [result.refreshToken] token that can be used to get new access tokens from Auth0. Note that not all clients can request them or the resource server might not allow them.
	 */
	
	/**
	 * Makes a call to the `oauth/token` endpoint with `password` grant type to login to the default directory.
	 *
	 * @method loginWithDefaultDirectory
	 * @param {Object} options
	 * @param {String} options.username email or username of the user that will perform Auth
	 * @param {String} options.password the password of the user that will perform Auth
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @param {tokenCallback} cb function called with the result of the request
	 * @see Requires [`password` grant]{@link https://auth0.com/docs/api-auth/grant/password}. For more information, read {@link https://auth0.com/docs/clients/client-grant-types}.
	 */
	Authentication.prototype.loginWithDefaultDirectory = function(options, cb) {
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      username: { type: 'string', message: 'username option is required' },
	      password: { type: 'string', message: 'password option is required' },
	      scope: { optional: true, type: 'string', message: 'scope option is required' },
	      audience: { optional: true, type: 'string', message: 'audience option is required' }
	    }
	  );
	
	  options.grantType = 'password';
	
	  return this.oauthToken(options, cb);
	};
	
	/**
	 * Makes a call to the `oauth/token` endpoint with `password-realm` grant type
	 *
	 * @method login
	 * @param {Object} options
	 * @param {String} options.username email or username of the user that will perform Auth
	 * @param {String} options.password the password of the user that will perform Auth
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @param {Object} options.realm the HRD domain or the connection name where the user belongs to. e.g. `Username-Password-Authentication`
	 * @param {tokenCallback} cb function called with the result of the request
	 * @see Requires [`http://auth0.com/oauth/grant-type/password-realm` grant]{@link https://auth0.com/docs/api-auth/grant/password#realm-support}. For more information, read {@link https://auth0.com/docs/clients/client-grant-types}.
	 */
	Authentication.prototype.login = function(options, cb) {
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      username: { type: 'string', message: 'username option is required' },
	      password: { type: 'string', message: 'password option is required' },
	      realm: { type: 'string', message: 'realm option is required' },
	      scope: { optional: true, type: 'string', message: 'scope option is required' },
	      audience: { optional: true, type: 'string', message: 'audience option is required' }
	    }
	  );
	
	  options.grantType = 'http://auth0.com/oauth/grant-type/password-realm';
	
	  return this.oauthToken(options, cb);
	};
	
	/**
	 * Makes a call to the `oauth/token` endpoint
	 *
	 * @method oauthToken
	 * @private
	 */
	Authentication.prototype.oauthToken = function(options, cb) {
	  var url;
	  var body;
	
	  assert.check(options, { type: 'object', message: 'options parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'oauth', 'token');
	
	  body = objectHelper.merge(this.baseOptions, ['clientID', 'scope', 'audience']).with(options);
	
	  assert.check(
	    body,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      clientID: { type: 'string', message: 'clientID option is required' },
	      grantType: { type: 'string', message: 'grantType option is required' },
	      scope: { optional: true, type: 'string', message: 'scope option is required' },
	      audience: { optional: true, type: 'string', message: 'audience option is required' }
	    }
	  );
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	  body = parametersWhitelist.oauthTokenParams(this.warn, body);
	
	  return this.request.post(url).send(body).end(responseHandler(cb));
	};
	
	/**
	 * Performs authentication calling `/oauth/ro` endpoint with username
	 * and password for a given connection name.
	 *
	 * This method is not compatible with API Auth so if you need to fetch API tokens with audience
	 * you should use {@link login} or {@link loginWithDefaultDirectory}.
	 *
	 * @method loginWithResourceOwner
	 * @param {Object} options
	 * @param {String} options.username email or username of the user that will perform Auth
	 * @param {String} options.password the password of the user that will perform Auth
	 * @param {Object} options.connection the connection name where the user belongs to. e.g. `Username-Password-Authentication`
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.device] name of the device/browser where the Auth was requested
	 * @param {tokenCallback} cb function called with the result of the request
	 */
	Authentication.prototype.loginWithResourceOwner = function(options, cb) {
	  var url;
	  var body;
	
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      username: { type: 'string', message: 'username option is required' },
	      password: { type: 'string', message: 'password option is required' },
	      connection: { type: 'string', message: 'connection option is required' },
	      scope: { optional: true, type: 'string', message: 'scope option is required' }
	    }
	  );
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'oauth', 'ro');
	
	  body = objectHelper
	    .merge(this.baseOptions, ['clientID', 'scope'])
	    .with(options, ['username', 'password', 'scope', 'connection', 'device']);
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	
	  body.grant_type = body.grant_type || 'password';
	
	  return this.request.post(url).send(body).end(responseHandler(cb));
	};
	
	/**
	 * Uses {@link checkSession} and localStorage to return data from the last successful authentication request.
	 *
	 * @method getSSOData
	 * @param {Boolean} withActiveDirectories this parameter is not used anymore. It's here to be backward compatible
	 * @param {Function} cb
	 */
	Authentication.prototype.getSSOData = function(withActiveDirectories, cb) {
	  /* istanbul ignore if  */
	  if (!this.auth0) {
	    // we can't import this in the constructor because it'd be a ciclic dependency
	    var WebAuth = __webpack_require__(30); // eslint-disable-line
	    this.auth0 = new WebAuth(this.baseOptions);
	  }
	  if (typeof withActiveDirectories === 'function') {
	    cb = withActiveDirectories;
	  }
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	  var clientId = this.baseOptions.clientID;
	  var ssodataInformation = ssodata.get() || {};
	
	  this.auth0.checkSession(
	    {
	      responseType: 'token id_token',
	      scope: 'openid profile email',
	      connection: ssodataInformation.lastUsedConnection,
	      timeout: 5000
	    },
	    function(err, result) {
	      if (err) {
	        if (err.error === 'login_required') {
	          return cb(null, { sso: false });
	        }
	        if (err.error === 'consent_required') {
	          err.error_description =
	            'Consent required. When using `getSSOData`, the user has to be authenticated with the following scope: `openid profile email`.';
	        }
	        return cb(err, { sso: false });
	      }
	      if (
	        ssodataInformation.lastUsedSub &&
	        ssodataInformation.lastUsedSub !== result.idTokenPayload.sub
	      ) {
	        return cb(err, { sso: false });
	      }
	      return cb(null, {
	        lastUsedConnection: {
	          name: ssodataInformation.lastUsedConnection
	        },
	        lastUsedUserID: result.idTokenPayload.sub,
	        lastUsedUsername: result.idTokenPayload.email || result.idTokenPayload.name,
	        lastUsedClientID: clientId,
	        sessionClients: [clientId],
	        sso: true
	      });
	    }
	  );
	};
	
	/**
	 * @callback userInfoCallback
	 * @param {Error} [err] error returned by Auth0
	 * @param {Object} [userInfo] user information
	 */
	
	/**
	 * Makes a call to the `/userinfo` endpoint and returns the user profile
	 *
	 * @method userInfo
	 * @param {String} accessToken token issued to a user after Auth
	 * @param {userInfoCallback} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#get-user-info}
	 */
	Authentication.prototype.userInfo = function(accessToken, cb) {
	  var url;
	
	  assert.check(accessToken, { type: 'string', message: 'accessToken parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'userinfo');
	
	  return this.request
	    .get(url)
	    .set('Authorization', 'Bearer ' + accessToken)
	    .end(responseHandler(cb, { ignoreCasing: true }));
	};
	
	/**
	 * @callback delegationCallback
	 * @param {Error} [err] error returned by Auth0 with the reason why the delegation failed
	 * @param {Object} [result] result of the delegation request. The payload depends on what ai type was used
	 */
	
	/**
	 * Makes a call to the `/delegation` endpoint with either an `id_token` or `refresh_token`
	 *
	 * @method delegation
	 * @param {Object} options
	 * @param {String} [options.clientID] client identifier
	 * @param {String} options.grantType  grant type used for delegation. The only valid value is `urn:ietf:params:oauth:grant-type:jwt-bearer`
	 * @param {String} [options.idToken] valid token of the user issued after Auth. If no `refresh_token` is provided this parameter is required
	 * @param {String} [options.refreshToken] valid refresh token of the user issued after Auth. If no `id_token` is provided this parameter is required
	 * @param {String} [options.target] the target client id of the delegation
	 * @param {String} [options.scope] either `openid` or `openid profile email`
	 * @param {String} [options.apiType] the api to be called
	 * @param {delegationCallback} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#delegation}
	 * @see Requires [http://auth0.com/oauth/grant-type/password-realm]{@link https://auth0.com/docs/api-auth/grant/password#realm-support}. For more information, read {@link https://auth0.com/docs/clients/client-grant-types}.
	 */
	Authentication.prototype.delegation = function(options, cb) {
	  var url;
	  var body;
	
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      grant_type: { type: 'string', message: 'grant_type option is required' }
	    }
	  );
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'delegation');
	
	  body = objectHelper.merge(this.baseOptions, ['clientID']).with(options);
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	
	  return this.request.post(url).send(body).end(responseHandler(cb));
	};
	
	/**
	 * Fetches the user country based on the ip.
	 *
	 * @method getUserCountry
	 * @private
	 * @param {Function} cb
	 */
	Authentication.prototype.getUserCountry = function(cb) {
	  var url;
	
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'user', 'geoloc', 'country');
	
	  return this.request.get(url).end(responseHandler(cb));
	};
	
	module.exports = Authentication;


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var base64 = __webpack_require__(18);
	
	function padding(str) {
	  var mod = str.length % 4;
	  var pad = 4 - mod;
	
	  if (mod === 0) {
	    return str;
	  }
	
	  return str + new Array(1 + pad).join('=');
	}
	
	function stringToByteArray(str) {
	  var arr = new Array(str.length);
	  for (var a = 0; a < str.length; a++) {
	    arr[a] = str.charCodeAt(a);
	  }
	  return arr;
	}
	
	function byteArrayToString(array) {
	  var result = '';
	  for (var i = 0; i < array.length; i++) {
	    result += String.fromCharCode(array[i]);
	  }
	  return result;
	}
	
	function encode(str) {
	  return base64
	    .fromByteArray(stringToByteArray(str))
	    .replace(/\+/g, '-') // Convert '+' to '-'
	    .replace(/\//g, '_'); // Convert '/' to '_'
	}
	
	function decode(str) {
	  str = padding(str)
	    .replace(/-/g, '+') // Convert '-' to '+'
	    .replace(/_/g, '/'); // Convert '_' to '/'
	
	  return byteArrayToString(base64.toByteArray(str));
	}
	
	module.exports = {
	  encode: encode,
	  decode: decode
	};


/***/ },
/* 26 */
/***/ function(module, exports) {

	function buildResponse(error, description) {
	  return {
	    error: error,
	    errorDescription: description
	  };
	}
	
	function invalidToken(description) {
	  return buildResponse('invalid_token', description);
	}
	
	module.exports = {
	  buildResponse: buildResponse,
	  invalidToken: invalidToken
	};


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var windowHelper = __webpack_require__(2);
	
	function IframeHandler(options) {
	  this.url = options.url;
	  this.callback = options.callback;
	  this.timeout = options.timeout || 60 * 1000;
	  this.timeoutCallback = options.timeoutCallback || null;
	  this.eventListenerType = options.eventListenerType || 'message';
	  this.iframe = null;
	  this.timeoutHandle = null;
	  this._destroyTimeout = null;
	  this.transientMessageEventListener = null;
	  this.proxyEventListener = null;
	  // If no event identifier specified, set default
	  this.eventValidator = options.eventValidator || {
	    isValid: function() {
	      return true;
	    }
	  };
	
	  if (typeof this.callback !== 'function') {
	    throw new Error('options.callback must be a function');
	  }
	}
	
	IframeHandler.prototype.init = function() {
	  var _this = this;
	  var _window = windowHelper.getWindow();
	
	  this.iframe = _window.document.createElement('iframe');
	  this.iframe.style.display = 'none';
	
	  // Workaround to avoid using bind that does not work in IE8
	  this.proxyEventListener = function(e) {
	    _this.eventListener(e);
	  };
	
	  switch (this.eventListenerType) {
	    case 'message':
	      this.eventSourceObject = _window;
	      break;
	    case 'load':
	      this.eventSourceObject = this.iframe;
	      break;
	    default:
	      throw new Error('Unsupported event listener type: ' + this.eventListenerType);
	  }
	
	  this.eventSourceObject.addEventListener(this.eventListenerType, this.proxyEventListener, false);
	
	  _window.document.body.appendChild(this.iframe);
	  
	  this.iframe.src = this.url;
	  
	  this.timeoutHandle = setTimeout(function() {
	    _this.timeoutHandler();
	  }, this.timeout);
	};
	
	IframeHandler.prototype.eventListener = function(event) {
	  var eventData = { event: event, sourceObject: this.eventSourceObject };
	
	  if (!this.eventValidator.isValid(eventData)) {
	    return;
	  }
	
	  this.destroy();
	  this.callback(eventData);
	};
	
	IframeHandler.prototype.timeoutHandler = function() {
	  this.destroy();
	  if (this.timeoutCallback) {
	    this.timeoutCallback();
	  }
	};
	
	IframeHandler.prototype.destroy = function() {
	  var _this = this;
	  var _window = windowHelper.getWindow();
	
	  clearTimeout(this.timeoutHandle);
	
	  this._destroyTimeout = setTimeout(function() {
	    _this.eventSourceObject.removeEventListener(
	      _this.eventListenerType,
	      _this.proxyEventListener,
	      false
	    );
	    _window.document.body.removeChild(_this.iframe);
	  }, 0);
	};
	
	module.exports = IframeHandler;


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var storage = __webpack_require__(29);
	
	module.exports = {
	  set: function(connection, sub) {
	    var ssodata = {
	      lastUsedConnection: connection,
	      lastUsedSub: sub
	    };
	    storage.setItem('auth0.ssodata', JSON.stringify(ssodata));
	  },
	  get: function() {
	    var ssodata = storage.getItem('auth0.ssodata');
	    if (!ssodata) {
	      return;
	    }
	    return JSON.parse(ssodata);
	  }
	};


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	var StorageHandler = __webpack_require__(57);
	var storage;
	
	function getStorage(force) {
	  if (!storage || force) {
	    storage = new StorageHandler();
	  }
	  return storage;
	}
	
	module.exports = {
	  getItem: function(key) {
	    var value = getStorage().getItem(key);
	    return value ? JSON.parse(value) : value;
	  },
	  removeItem: function(key) {
	    return getStorage().removeItem(key);
	  },
	  setItem: function(key, value) {
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

	var IdTokenVerifier = __webpack_require__(39);
	
	var assert = __webpack_require__(4);
	var error = __webpack_require__(26);
	var qs = __webpack_require__(6);
	var PluginHandler = __webpack_require__(52);
	var windowHelper = __webpack_require__(2);
	var objectHelper = __webpack_require__(1);
	var ssodata = __webpack_require__(28);
	var TransactionManager = __webpack_require__(17);
	var Authentication = __webpack_require__(24);
	var Redirect = __webpack_require__(63);
	var Popup = __webpack_require__(62);
	var SilentAuthenticationHandler = __webpack_require__(64);
	var CrossOriginAuthentication = __webpack_require__(16);
	var WebMessageHandler = __webpack_require__(31);
	var HostedPages = __webpack_require__(61);
	
	/**
	 * Handles all the browser's AuthN/AuthZ flows
	 * @constructor
	 * @param {Object} options
	 * @param {String} options.domain your Auth0 domain
	 * @param {String} options.clientID your Auth0 client identifier obtained when creating the client in the Auth0 Dashboard
	 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0}
	 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @param {Array} [options.plugins]
	 * @param {Number} [options._timesToRetryFailedRequests] Number of times to retry a failed request, according to {@link https://github.com/visionmedia/superagent/blob/master/lib/should-retry.js}
	 * @see {@link https://auth0.com/docs/api/authentication}
	 */
	function WebAuth(options) {
	  /* eslint-disable */
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      domain: { type: 'string', message: 'domain option is required' },
	      clientID: { type: 'string', message: 'clientID option is required' },
	      responseType: { optional: true, type: 'string', message: 'responseType is not valid' },
	      responseMode: { optional: true, type: 'string', message: 'responseMode is not valid' },
	      redirectUri: { optional: true, type: 'string', message: 'redirectUri is not valid' },
	      scope: { optional: true, type: 'string', message: 'scope is not valid' },
	      audience: { optional: true, type: 'string', message: 'audience is not valid' },
	      popupOrigin: { optional: true, type: 'string', message: 'popupOrigin is not valid' },
	      leeway: { optional: true, type: 'number', message: 'leeway is not valid' },
	      plugins: { optional: true, type: 'array', message: 'plugins is not valid' },
	      _disableDeprecationWarnings: {
	        optional: true,
	        type: 'boolean',
	        message: '_disableDeprecationWarnings option is not valid'
	      },
	      _sendTelemetry: {
	        optional: true,
	        type: 'boolean',
	        message: '_sendTelemetry option is not valid'
	      },
	      _telemetryInfo: {
	        optional: true,
	        type: 'object',
	        message: '_telemetryInfo option is not valid'
	      },
	      _timesToRetryFailedRequests: {
	        optional: true,
	        type: 'number',
	        message: '_timesToRetryFailedRequests option is not valid'
	      }
	    }
	  );
	
	  if (options.overrides) {
	    assert.check(
	      options.overrides,
	      { type: 'object', message: 'overrides option is not valid' },
	      {
	        __tenant: { optional: true, type: 'string', message: '__tenant option is required' },
	        __token_issuer: {
	          optional: true,
	          type: 'string',
	          message: '__token_issuer option is required'
	        },
	        __jwks_uri: { optional: true, type: 'string', message: '__jwks_uri is required' }
	      }
	    );
	  }
	  /* eslint-enable */
	
	  this.baseOptions = options;
	  this.baseOptions.plugins = new PluginHandler(this, this.baseOptions.plugins || []);
	
	  this.baseOptions._sendTelemetry = this.baseOptions._sendTelemetry === false
	    ? this.baseOptions._sendTelemetry
	    : true;
	
	  this.baseOptions._timesToRetryFailedRequests = options._timesToRetryFailedRequests
	    ? parseInt(options._timesToRetryFailedRequests, 0)
	    : 0;
	
	  this.baseOptions.tenant =
	    (this.baseOptions.overrides && this.baseOptions.overrides.__tenant) ||
	    this.baseOptions.domain.split('.')[0];
	
	  this.baseOptions.token_issuer =
	    (this.baseOptions.overrides && this.baseOptions.overrides.__token_issuer) ||
	    'https://' + this.baseOptions.domain + '/';
	
	  this.baseOptions.jwksURI = this.baseOptions.overrides && this.baseOptions.overrides.__jwks_uri;
	
	  this.transactionManager = new TransactionManager(this.baseOptions.transaction);
	
	  this.client = new Authentication(this.baseOptions);
	  this.redirect = new Redirect(this, this.baseOptions);
	  this.popup = new Popup(this, this.baseOptions);
	  this.crossOriginAuthentication = new CrossOriginAuthentication(this, this.baseOptions);
	  this.webMessageHandler = new WebMessageHandler(this);
	  this._universalLogin = new HostedPages(this, this.baseOptions);
	}
	
	/**
	 * Parse the url hash and extract the Auth response from a Auth flow started with {@link authorize}
	 *
	 * Only validates id_tokens signed by Auth0 using the RS256 algorithm using the public key exposed
	 * by the `/.well-known/jwks.json` endpoint of your account.
	 * Tokens signed with other algorithms, e.g. HS256 will not be accepted.
	 *
	 * @method parseHash
	 * @param {Object} options
	 * @param {String} options.hash the url hash. If not provided it will extract from window.location.hash
	 * @param {String} [options.state] value originally sent in `state` parameter to {@link authorize} to mitigate XSRF
	 * @param {String} [options.nonce] value originally sent in `nonce` parameter to {@link authorize} to prevent replay attacks
	 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `token`, `id_token`. For this specific method, we'll only use this value to check if the hash contains the tokens requested in the responseType.
	 * @param {authorizeCallback} cb
	 */
	WebAuth.prototype.parseHash = function(options, cb) {
	  var parsedQs;
	  var err;
	
	  if (!cb && typeof options === 'function') {
	    cb = options;
	    options = {};
	  } else {
	    options = options || {};
	  }
	
	  var _window = windowHelper.getWindow();
	
	  var hashStr = options.hash === undefined ? _window.location.hash : options.hash;
	  hashStr = hashStr.replace(/^#?\/?/, '');
	
	  parsedQs = qs.parse(hashStr);
	
	  if (parsedQs.hasOwnProperty('error')) {
	    err = error.buildResponse(parsedQs.error, parsedQs.error_description);
	
	    if (parsedQs.state) {
	      err.state = parsedQs.state;
	    }
	
	    return cb(err);
	  }
	
	  if (
	    !parsedQs.hasOwnProperty('access_token') &&
	    !parsedQs.hasOwnProperty('id_token') &&
	    !parsedQs.hasOwnProperty('refresh_token')
	  ) {
	    return cb(null, null);
	  }
	  var responseTypes = (this.baseOptions.responseType || options.responseType || '').split(' ');
	  if (
	    responseTypes.length > 0 &&
	    responseTypes.indexOf('token') !== -1 &&
	    !parsedQs.hasOwnProperty('access_token')
	  ) {
	    return cb(
	      error.buildResponse(
	        'invalid_hash',
	        'response_type contains `token`, but the parsed hash does not contain an `access_token` property'
	      )
	    );
	  }
	  if (
	    responseTypes.length > 0 &&
	    responseTypes.indexOf('id_token') !== -1 &&
	    !parsedQs.hasOwnProperty('id_token')
	  ) {
	    return cb(
	      error.buildResponse(
	        'invalid_hash',
	        'response_type contains `id_token`, but the parsed hash does not contain an `id_token` property'
	      )
	    );
	  }
	  return this.validateAuthenticationResponse(options, parsedQs, cb);
	};
	
	/**
	 * Validates an Auth response from a Auth flow started with {@link authorize}
	 *
	 * Only validates id_tokens signed by Auth0 using the RS256 algorithm using the public key exposed
	 * by the `/.well-known/jwks.json` endpoint of your account.
	 * Tokens signed with other algorithms, e.g. HS256 will not be accepted.
	 *
	 * @method validateAuthenticationResponse
	 * @param {Object} options
	 * @param {String} options.hash the url hash. If not provided it will extract from window.location.hash
	 * @param {String} [options.state] value originally sent in `state` parameter to {@link authorize} to mitigate XSRF
	 * @param {String} [options.nonce] value originally sent in `nonce` parameter to {@link authorize} to prevent replay attacks
	 * @param {authorizeCallback} cb
	 */
	WebAuth.prototype.validateAuthenticationResponse = function(options, parsedHash, cb) {
	  var _this = this;
	  options.__enableIdPInitiatedLogin =
	    options.__enableIdPInitiatedLogin || options.__enableImpersonation;
	  var state = parsedHash.state;
	  var transaction = this.transactionManager.getStoredTransaction(state);
	  var transactionState = options.state || (transaction && transaction.state) || null;
	
	  var transactionStateMatchesState = transactionState === state;
	  var shouldBypassStateChecking = !state && !transactionState && options.__enableIdPInitiatedLogin;
	
	  if (!shouldBypassStateChecking && !transactionStateMatchesState) {
	    return cb({
	      error: 'invalid_token',
	      errorDescription: '`state` does not match.'
	    });
	  }
	  var transactionNonce = options.nonce || (transaction && transaction.nonce) || null;
	
	  var appState = options.state || (transaction && transaction.appState) || null;
	
	  var callback = function(err, payload) {
	    if (err) {
	      return cb(err);
	    }
	    if (transaction && transaction.lastUsedConnection) {
	      var sub;
	      if (payload) {
	        sub = payload.sub;
	      }
	      ssodata.set(transaction.lastUsedConnection, sub);
	    }
	    return cb(null, buildParseHashResponse(parsedHash, appState, payload));
	  };
	
	  if (!parsedHash.id_token) {
	    return callback(null, null);
	  }
	  return this.validateToken(parsedHash.id_token, transactionNonce, function(
	    validationError,
	    payload
	  ) {
	    if (!validationError) {
	      if (!parsedHash.access_token) {
	        return callback(null, payload);
	      }
	      // id_token's generated by non-oidc clients don't have at_hash
	      if (!payload.at_hash) {
	        return callback(null, payload);
	      }
	      // here we're absolutely sure that the id_token's alg is RS256
	      // and that the id_token is valid, so we can check the access_token
	      return new IdTokenVerifier().validateAccessToken(
	        parsedHash.access_token,
	        'RS256',
	        payload.at_hash,
	        function(err) {
	          if (err) {
	            return callback(error.invalidToken(err.message));
	          }
	          return callback(null, payload);
	        }
	      );
	    }
	    if (validationError.error !== 'invalid_token') {
	      return callback(validationError);
	    }
	    // if it's an invalid_token error, decode the token
	    var decodedToken = new IdTokenVerifier().decode(parsedHash.id_token);
	    // if the alg is not HS256, return the raw error
	    if (decodedToken.header.alg !== 'HS256') {
	      return callback(validationError);
	    }
	    // if the alg is HS256, use the /userinfo endpoint to build the payload
	    return _this.client.userInfo(parsedHash.access_token, function(errUserInfo, profile) {
	      // if the /userinfo request fails, use the validationError instead
	      if (errUserInfo) {
	        return callback(validationError);
	      }
	      return callback(null, profile);
	    });
	  });
	};
	
	function buildParseHashResponse(qsParams, appState, token) {
	  return {
	    accessToken: qsParams.access_token || null,
	    idToken: qsParams.id_token || null,
	    idTokenPayload: token || null,
	    appState: appState || null,
	    refreshToken: qsParams.refresh_token || null,
	    state: qsParams.state || null,
	    expiresIn: qsParams.expires_in ? parseInt(qsParams.expires_in, 10) : null,
	    tokenType: qsParams.token_type || null,
	    scope: qsParams.scope || null
	  };
	}
	
	/**
	 * @callback validateTokenCallback
	 * @param {Error} [err] error returned by while validating the token
	 * @param {Object} [payload] claims stored in the token
	 */
	
	/**
	 * Decodes the a JWT and verifies its nonce value
	 *
	 * @method validateToken
	 * @private
	 * @param {String} token
	 * @param {String} nonce
	 * @param {validateTokenCallback} cb
	 */
	WebAuth.prototype.validateToken = function(token, nonce, cb) {
	  var verifier = new IdTokenVerifier({
	    issuer: this.baseOptions.token_issuer,
	    jwksURI: this.baseOptions.jwksURI,
	    audience: this.baseOptions.clientID,
	    leeway: this.baseOptions.leeway || 0,
	    __disableExpirationCheck: this.baseOptions.__disableExpirationCheck
	  });
	
	  verifier.verify(token, nonce, function(err, payload) {
	    if (err) {
	      return cb(error.invalidToken(err.message));
	    }
	
	    cb(null, payload);
	  });
	};
	
	/**
	 * Executes a silent authentication transaction under the hood in order to fetch a new tokens for the current session.
	 * This method requires that all Auth is performed with {@link authorize}
	 * Watch out! If you're not using the hosted login page to do social logins, you have to use your own [social connection keys](https://manage.auth0.com/#/connections/social). If you use Auth0's dev keys, you'll always get `login_required` as an error when calling this method.
	 *
	 * @method renewAuth
	 * @param {Object} options
	 * @param {String} [options.domain] your Auth0 domain
	 * @param {String} [options.clientID] your Auth0 client identifier obtained when creating the client in the Auth0 Dashboard
	 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0}
	 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
	 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
	 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @param {String} [options.postMessageDataType] identifier data type to look for in postMessage event data, where events are initiated from silent callback urls, before accepting a message event is the event expected. A value of false means any postMessage event will trigger a callback.
	 * @param {String} [options.postMessageOrigin] origin of redirectUri to expect postMessage response from.  Defaults to the origin of the receiving window. Only used if usePostMessage is truthy.
	 * @param {String} [options.timeout] value in milliseconds used to timeout when the `/authorize` call is failing as part of the silent authentication with postmessage enabled due to a configuration.
	 * @param {Boolean} [options.usePostMessage] use postMessage to comunicate between the silent callback and the SPA. When false the SDK will attempt to parse the url hash should ignore the url hash and no extra behaviour is needed
	 * @param {authorizeCallback} cb
	 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
	 */
	WebAuth.prototype.renewAuth = function(options, cb) {
	  var handler;
	  var usePostMessage = !!options.usePostMessage;
	  var postMessageDataType = options.postMessageDataType || false;
	  var postMessageOrigin = options.postMessageOrigin || windowHelper.getWindow().origin;
	  var timeout = options.timeout;
	  var _this = this;
	
	  var params = objectHelper
	    .merge(this.baseOptions, [
	      'clientID',
	      'redirectUri',
	      'responseType',
	      'scope',
	      'audience',
	      '_csrf',
	      'state',
	      '_intstate',
	      'nonce'
	    ])
	    .with(options);
	
	  params.responseType = params.responseType || 'token';
	  params.responseMode = params.responseMode || 'fragment';
	  params = this.transactionManager.process(params);
	
	  assert.check(params, { type: 'object', message: 'options parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  params.prompt = 'none';
	
	  params = objectHelper.blacklist(params, [
	    'usePostMessage',
	    'tenant',
	    'postMessageDataType',
	    'postMessageOrigin'
	  ]);
	
	  handler = SilentAuthenticationHandler.create({
	    authenticationUrl: this.client.buildAuthorizeUrl(params),
	    postMessageDataType: postMessageDataType,
	    postMessageOrigin: postMessageOrigin,
	    timeout: timeout
	  });
	
	  handler.login(usePostMessage, function(err, hash) {
	    if (typeof hash === 'object') {
	      // hash was already parsed, so we just return it.
	      // it's here to be backwards compatible and should be removed in the next major version.
	      return cb(err, hash);
	    }
	    _this.parseHash({ hash: hash }, cb);
	  });
	};
	
	/**
	 * Renews an existing session on Auth0's servers using `response_mode=web_message`
	 *
	 * @method checkSession
	 * @param {Object} options
	 * @param {String} [options.domain] your Auth0 domain
	 * @param {String} [options.clientID] your Auth0 client identifier obtained when creating the client in the Auth0 Dashboard
	 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0}
	 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
	 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @param {String} [options.timeout] value in milliseconds used to timeout when the `/authorize` call is failing as part of the silent authentication with postmessage enabled due to a configuration.
	 */
	WebAuth.prototype.checkSession = function(options, cb) {
	  var params = objectHelper
	    .merge(this.baseOptions, [
	      'clientID',
	      'responseType',
	      'redirectUri',
	      'scope',
	      'audience',
	      '_csrf',
	      'state',
	      '_intstate',
	      'nonce'
	    ])
	    .with(options);
	
	  if (params.responseType === 'code') {
	    return cb({ error: 'error', error_description: "responseType can't be `code`" });
	  }
	
	  if (!options.nonce) {
	    params = this.transactionManager.process(params);
	  }
	
	  assert.check(params, { type: 'object', message: 'options parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  params = objectHelper.blacklist(params, ['usePostMessage', 'tenant', 'postMessageDataType']);
	  this.webMessageHandler.run(params, cb);
	};
	
	/**
	 * Request an email with instruction to change a user's password
	 *
	 * @method changePassword
	 * @param {Object} options
	 * @param {String} options.email address where the user will receive the change password email. It should match the user's email in Auth0
	 * @param {String} options.connection name of the connection where the user was created
	 * @param {changePasswordCallback} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#change-password}
	 */
	WebAuth.prototype.changePassword = function(options, cb) {
	  return this.client.dbConnection.changePassword(options, cb);
	};
	
	/**
	 * Starts a passwordless authentication transaction.
	 *
	 * @method passwordlessStart
	 * @param {Object} options
	 * @param {String} options.send what will be sent via email which could be `link` or `code`. For SMS `code` is the only one valud
	 * @param {String} [options.phoneNumber] phone number where to send the `code`. This parameter is mutually exclusive with `email`
	 * @param {String} [options.email] email where to send the `code` or `link`. This parameter is mutually exclusive with `phoneNumber`
	 * @param {String} options.connection name of the passwordless connection
	 * @param {Object} [options.authParams] additional Auth parameters when using `link`
	 * @param {Function} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#passwordless}
	 */
	WebAuth.prototype.passwordlessStart = function(options, cb) {
	  var authParams = objectHelper
	    .merge(this.baseOptions, [
	      'responseType',
	      'responseMode',
	      'redirectUri',
	      'scope',
	      'audience',
	      '_csrf',
	      'state',
	      '_intstate',
	      'nonce'
	    ])
	    .with(options.authParams);
	
	  options.authParams = this.transactionManager.process(authParams);
	  return this.client.passwordless.start(options, cb);
	};
	
	/**
	 * Creates a new user in a Auth0 Database connection
	 *
	 * @method signup
	 * @param {Object} options
	 * @param {String} options.email user email address
	 * @param {String} options.password user password
	 * @param {String} options.connection name of the connection where the user will be created
	 * @param {signUpCallback} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#signup}
	 */
	WebAuth.prototype.signup = function(options, cb) {
	  return this.client.dbConnection.signup(options, cb);
	};
	
	/**
	 * Redirects to the hosted login page (`/authorize`) in order to start a new authN/authZ transaction.
	 * After that, you'll have to use the {@link parseHash} function at the specified `redirectUri`.
	 *
	 * @method authorize
	 * @param {Object} options
	 * @param {String} [options.domain] your Auth0 domain
	 * @param {String} [options.clientID] your Auth0 client identifier obtained when creating the client in the Auth0 Dashboard
	 * @param {String} options.redirectUri url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} options.responseType type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0}
	 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
	 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
	 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
	 */
	WebAuth.prototype.authorize = function(options) {
	  var params = objectHelper
	    .merge(this.baseOptions, [
	      'clientID',
	      'responseType',
	      'responseMode',
	      'redirectUri',
	      'scope',
	      'audience',
	      '_csrf',
	      'state',
	      '_intstate',
	      'nonce'
	    ])
	    .with(options);
	
	  assert.check(
	    params,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      responseType: { type: 'string', message: 'responseType option is required' }
	    }
	  );
	
	  params = this.transactionManager.process(params);
	  params.scope = params.scope || 'openid profile email';
	
	  windowHelper.redirect(this.client.buildAuthorizeUrl(params));
	};
	
	/**
	 * Signs up a new user, automatically logs the user in after the signup and returns the user token.
	 * The login will be done using /oauth/token with password-realm grant type.
	 *
	 * @method signupAndAuthorize
	 * @param {Object} options
	 * @param {String} options.email user email address
	 * @param {String} options.password user password
	 * @param {String} options.connection name of the connection where the user will be created
	 * @param {tokenCallback} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#signup}
	 * @see   {@link https://auth0.com/docs/api-auth/grant/password}
	 */
	WebAuth.prototype.signupAndAuthorize = function(options, cb) {
	  var _this = this;
	
	  return this.client.dbConnection.signup(
	    objectHelper.blacklist(options, ['popupHandler']),
	    function(err) {
	      if (err) {
	        return cb(err);
	      }
	      options.realm = options.connection;
	      if (!options.username) {
	        options.username = options.email;
	      }
	      _this.client.login(options, cb);
	    }
	  );
	};
	
	/**
	 * @callback crossOriginLoginCallback
	 * @param {Error} [err] Authentication error returned by Auth0 with the reason why the request failed
	 */
	
	/**
	 * Logs in the user with username and password using the cross origin authentication (/co/authenticate) flow. You can use either `username` or `email` to identify the user, but `username` will take precedence over `email`.
	 * Some browsers might not be able to successfully authenticate if 3rd party cookies are disabled in your browser. [See here for more information.]{@link https://auth0.com/docs/cross-origin-authentication}.
	 * After the /co/authenticate call, you'll have to use the {@link parseHash} function at the `redirectUri` specified in the constructor.
	 * 
	 * @method login
	 * @see Requires [`Implicit` grant]{@link https://auth0.com/docs/api-auth/grant/implicit}. For more information, read {@link https://auth0.com/docs/clients/client-grant-types}.
	 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
	 * @param {String} [options.username] Username (mutually exclusive with email)
	 * @param {String} [options.email] Email (mutually exclusive with username)
	 * @param {String} options.password Password
	 * @param {String} [options.realm] Realm used to authenticate the user, it can be a realm name or a database connection name
	 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
	 */
	WebAuth.prototype.login = function(options, cb) {
	  var isHostedLoginPage = windowHelper.getWindow().location.host === this.baseOptions.domain;
	  if (isHostedLoginPage) {
	    options.connection = options.realm;
	    delete options.realm;
	    this._universalLogin.login(options, cb);
	  } else {
	    this.crossOriginAuthentication.login(options, cb);
	  }
	};
	
	/**
	 * Logs in the user by verifying the verification code (OTP) using the cross origin authentication (/co/authenticate) flow. You can use either `phoneNumber` or `email` to identify the user.
	 * This only works when 3rd party cookies are enabled in the browser. After the /co/authenticate call, you'll have to use the {@link parseHash} function at the `redirectUri` specified in the constructor.
	 *
	 * @method login
	 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
	 * @param {String} [options.phoneNumber] Phone Number (mutually exclusive with email)
	 * @param {String} [options.email] Email (mutually exclusive with username)
	 * @param {String} options.verificationCode Verification Code (OTP)
	 * @param {String} options.connection Passwordless connection to use. It can either be 'sms' or 'email'.
	 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
	 */
	WebAuth.prototype.passwordlessLogin = function(options, cb) {
	  var isHostedLoginPage = windowHelper.getWindow().location.host === this.baseOptions.domain;
	  if (isHostedLoginPage) {
	    this.passwordlessVerify(options, cb);
	  } else {
	    var crossOriginOptions = objectHelper.extend(
	      {
	        credentialType: 'http://auth0.com/oauth/grant-type/passwordless/otp',
	        realm: options.connection,
	        username: options.email || options.phoneNumber,
	        otp: options.verificationCode
	      },
	      objectHelper.blacklist(options, ['connection', 'email', 'phoneNumber', 'verificationCode'])
	    );
	    this.crossOriginAuthentication.login(crossOriginOptions, cb);
	  }
	};
	
	/**
	 * Runs the callback code for the cross origin authentication call. This method is meant to be called by the cross origin authentication callback url.
	 *
	 * @method crossOriginAuthenticationCallback
	 * @deprecated Use {@link crossOriginVerification} instead.
	 */
	WebAuth.prototype.crossOriginAuthenticationCallback = function() {
	  this.crossOriginVerification();
	};
	
	/**
	 * Runs the callback code for the cross origin authentication call. This method is meant to be called by the cross origin authentication callback url.
	 *
	 * @method crossOriginVerification
	 */
	WebAuth.prototype.crossOriginVerification = function() {
	  this.crossOriginAuthentication.callback();
	};
	
	/**
	 * Redirects to the auth0 logout endpoint
	 *
	 * If you want to navigate the user to a specific URL after the logout, set that URL at the returnTo parameter. The URL should be included in any the appropriate Allowed Logout URLs list:
	 *
	 * - If the client_id parameter is included, the returnTo URL must be listed in the Allowed Logout URLs set at the client level (see Setting Allowed Logout URLs at the App Level).
	 * - If the client_id parameter is NOT included, the returnTo URL must be listed in the Allowed Logout URLs set at the account level (see Setting Allowed Logout URLs at the Account Level).
	 *
	 * @method logout
	 * @param {Object} options
	 * @param {String} [options.clientID] identifier of your client
	 * @param {String} [options.returnTo] URL to be redirected after the logout
	 * @param {Boolean} [options.federated] tells Auth0 if it should logout the user also from the IdP.
	 * @see   {@link https://auth0.com/docs/api/authentication#logout}
	 */
	WebAuth.prototype.logout = function(options) {
	  windowHelper.redirect(this.client.buildLogoutUrl(options));
	};
	
	/**
	 * Verifies the passwordless TOTP and redirects to finish the passwordless transaction
	 *
	 * @method passwordlessVerify
	 * @param {Object} options
	 * @param {String} options.type `sms` or `email`
	 * @param {String} options.phoneNumber only if type = sms
	 * @param {String} options.email only if type = email
	 * @param {String} options.connection the connection name
	 * @param {String} options.verificationCode the TOTP code
	 * @param {Function} cb
	 */
	WebAuth.prototype.passwordlessVerify = function(options, cb) {
	  var _this = this;
	  var params = objectHelper
	    .merge(this.baseOptions, [
	      'clientID',
	      'responseType',
	      'responseMode',
	      'redirectUri',
	      'scope',
	      'audience',
	      '_csrf',
	      'state',
	      '_intstate',
	      'nonce'
	    ])
	    .with(options);
	
	  assert.check(
	    params,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      responseType: { type: 'string', message: 'responseType option is required' }
	    }
	  );
	
	  params = this.transactionManager.process(params);
	  return this.client.passwordless.verify(params, function(err) {
	    if (err) {
	      return cb(err);
	    }
	    return windowHelper.redirect(_this.client.passwordless.buildVerifyUrl(params));
	  });
	};
	
	module.exports = WebAuth;


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var IframeHandler = __webpack_require__(27);
	var objectHelper = __webpack_require__(1);
	var windowHelper = __webpack_require__(2);
	var Warn = __webpack_require__(7);
	
	function runWebMessageFlow(authorizeUrl, options, callback) {
	  var handler = new IframeHandler({
	    url: authorizeUrl,
	    eventListenerType: 'message',
	    callback: function(eventData) {
	      callback(null, eventData);
	    },
	    timeout: options.timeout,
	    eventValidator: {
	      isValid: function(eventData) {
	        return (
	          eventData.event.data.type === 'authorization_response' &&
	          options.state === eventData.event.data.response.state
	        );
	      }
	    },
	    timeoutCallback: function() {
	      callback({
	        error: 'timeout',
	        error_description: 'Timeout during executing web_message communication'
	      });
	    }
	  });
	  handler.init();
	}
	
	function WebMessageHandler(webAuth) {
	  this.webAuth = webAuth;
	  this.warn = new Warn(webAuth.baseOptions);
	}
	
	WebMessageHandler.prototype.run = function(options, cb) {
	  var _this = this;
	  options.responseMode = 'web_message';
	  options.prompt = 'none';
	
	  var currentOrigin = windowHelper.getOrigin();
	  var redirectUriOrigin = objectHelper.getOriginFromUrl(options.redirectUri);
	  if (redirectUriOrigin && currentOrigin !== redirectUriOrigin) {
	    return cb({
	      error: 'origin_mismatch',
	      error_description: "The redirectUri's origin (" +
	        redirectUriOrigin +
	        ") should match the window's origin (" +
	        currentOrigin +
	        ').'
	    });
	  }
	
	  runWebMessageFlow(this.webAuth.client.buildAuthorizeUrl(options), options, function(
	    err,
	    eventData
	  ) {
	    var error = err;
	    if (!err && eventData.event.data.response.error) {
	      error = objectHelper.pick(eventData.event.data.response, ['error', 'error_description']);
	    }
	    if (
	      error &&
	      error.error === 'consent_required' &&
	      windowHelper.getWindow().location.hostname === 'localhost'
	    ) {
	      _this.warn.warning(
	        "Consent Required. Consent can't be skipped on localhost. Read more here: https://auth0.com/docs/api-auth/user-consent#skipping-consent-for-first-party-clients"
	      );
	    }
	    if (error) {
	      return cb(error);
	    }
	    var parsedHash = eventData.event.data.response;
	    _this.webAuth.validateAuthenticationResponse(options, parsedHash, cb);
	  });
	};
	
	module.exports = WebMessageHandler;


/***/ },
/* 32 */
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
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	;(function (root, factory) {
		if (true) {
			// CommonJS
			module.exports = exports = factory(__webpack_require__(12));
		}
		else if (typeof define === "function" && define.amd) {
			// AMD
			define(["./core"], factory);
		}
		else {
			// Global (browser)
			factory(root.CryptoJS);
		}
	}(this, function (CryptoJS) {
	
		(function () {
		    // Shortcuts
		    var C = CryptoJS;
		    var C_lib = C.lib;
		    var WordArray = C_lib.WordArray;
		    var C_enc = C.enc;
	
		    /**
		     * Base64 encoding strategy.
		     */
		    var Base64 = C_enc.Base64 = {
		        /**
		         * Converts a word array to a Base64 string.
		         *
		         * @param {WordArray} wordArray The word array.
		         *
		         * @return {string} The Base64 string.
		         *
		         * @static
		         *
		         * @example
		         *
		         *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
		         */
		        stringify: function (wordArray) {
		            // Shortcuts
		            var words = wordArray.words;
		            var sigBytes = wordArray.sigBytes;
		            var map = this._map;
	
		            // Clamp excess bits
		            wordArray.clamp();
	
		            // Convert
		            var base64Chars = [];
		            for (var i = 0; i < sigBytes; i += 3) {
		                var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
		                var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
		                var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;
	
		                var triplet = (byte1 << 16) | (byte2 << 8) | byte3;
	
		                for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
		                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
		                }
		            }
	
		            // Add padding
		            var paddingChar = map.charAt(64);
		            if (paddingChar) {
		                while (base64Chars.length % 4) {
		                    base64Chars.push(paddingChar);
		                }
		            }
	
		            return base64Chars.join('');
		        },
	
		        /**
		         * Converts a Base64 string to a word array.
		         *
		         * @param {string} base64Str The Base64 string.
		         *
		         * @return {WordArray} The word array.
		         *
		         * @static
		         *
		         * @example
		         *
		         *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
		         */
		        parse: function (base64Str) {
		            // Shortcuts
		            var base64StrLength = base64Str.length;
		            var map = this._map;
		            var reverseMap = this._reverseMap;
	
		            if (!reverseMap) {
		                    reverseMap = this._reverseMap = [];
		                    for (var j = 0; j < map.length; j++) {
		                        reverseMap[map.charCodeAt(j)] = j;
		                    }
		            }
	
		            // Ignore padding
		            var paddingChar = map.charAt(64);
		            if (paddingChar) {
		                var paddingIndex = base64Str.indexOf(paddingChar);
		                if (paddingIndex !== -1) {
		                    base64StrLength = paddingIndex;
		                }
		            }
	
		            // Convert
		            return parseLoop(base64Str, base64StrLength, reverseMap);
	
		        },
	
		        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
		    };
	
		    function parseLoop(base64Str, base64StrLength, reverseMap) {
		      var words = [];
		      var nBytes = 0;
		      for (var i = 0; i < base64StrLength; i++) {
		          if (i % 4) {
		              var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
		              var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
		              words[nBytes >>> 2] |= (bits1 | bits2) << (24 - (nBytes % 4) * 8);
		              nBytes++;
		          }
		      }
		      return WordArray.create(words, nBytes);
		    }
		}());
	
	
		return CryptoJS.enc.Base64;
	
	}));

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	;(function (root, factory) {
		if (true) {
			// CommonJS
			module.exports = exports = factory(__webpack_require__(12));
		}
		else if (typeof define === "function" && define.amd) {
			// AMD
			define(["./core"], factory);
		}
		else {
			// Global (browser)
			factory(root.CryptoJS);
		}
	}(this, function (CryptoJS) {
	
		return CryptoJS.enc.Hex;
	
	}));

/***/ },
/* 35 */
/***/ function(module, exports) {

	function DummyCache() {}
	
	DummyCache.prototype.get = function () {
	  return null;
	};
	
	DummyCache.prototype.has = function () {
	  return false;
	};
	
	DummyCache.prototype.set = function () {
	};
	
	module.exports = DummyCache;


/***/ },
/* 36 */
/***/ function(module, exports) {

	function ConfigurationError(message) {
	  this.name = 'ConfigurationError';
	  this.message = (message || '');
	}
	ConfigurationError.prototype = Error.prototype;
	
	function TokenValidationError(message) {
	  this.name = 'TokenValidationError';
	  this.message = (message || '');
	}
	TokenValidationError.prototype = Error.prototype;
	
	module.exports = {
	  ConfigurationError: ConfigurationError,
	  TokenValidationError: TokenValidationError
	};


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(3);
	var base64 = __webpack_require__(20);
	var request = __webpack_require__(21);
	
	function process(jwks) {
	  var modulus = base64.decodeToHEX(jwks.n);
	  var exp = base64.decodeToHEX(jwks.e);
	
	  return {
	    modulus: modulus,
	    exp: exp
	  };
	}
	
	function getJWKS(options, cb) {
	  var url = options.jwksURI || urljoin(options.iss, '.well-known', 'jwks.json');
	
	  return request
	    .get(url)
	    .end(function (err, data) {
	      var matchingKey = null;
	      var a;
	      var key;
	
	      if (err) {
	        return cb(err);
	      }
	
	      // eslint-disable-next-line no-plusplus
	      for (a = 0; a < data.body.keys.length && matchingKey === null; a++) {
	        key = data.body.keys[a];
	        if (key.kid === options.kid) {
	          matchingKey = key;
	        }
	      }
	
	      return cb(null, process(matchingKey));
	    });
	}
	
	module.exports = {
	  process: process,
	  getJWKS: getJWKS
	};


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	/*
	Based on the work of Tom Wu
	http://www-cs-students.stanford.edu/~tjw/jsbn/
	http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE
	*/
	
	var BigInteger = __webpack_require__(40).BigInteger;
	var SHA256 = __webpack_require__(19);
	
	var DigestInfoHead = {
	  sha1: '3021300906052b0e03021a05000414',
	  sha224: '302d300d06096086480165030402040500041c',
	  sha256: '3031300d060960864801650304020105000420',
	  sha384: '3041300d060960864801650304020205000430',
	  sha512: '3051300d060960864801650304020305000440',
	  md2: '3020300c06082a864886f70d020205000410',
	  md5: '3020300c06082a864886f70d020505000410',
	  ripemd160: '3021300906052b2403020105000414'
	};
	
	var DigestAlgs = {
	  sha256: SHA256
	};
	
	function RSAVerifier(modulus, exp) {
	  this.n = null;
	  this.e = 0;
	
	  if (modulus != null && exp != null && modulus.length > 0 && exp.length > 0) {
	    this.n = new BigInteger(modulus, 16);
	    this.e = parseInt(exp, 16);
	  } else {
	    throw new Error('Invalid key data');
	  }
	}
	
	function getAlgorithmFromDigest(hDigestInfo) {
	  for (var algName in DigestInfoHead) {
	    var head = DigestInfoHead[algName];
	    var len = head.length;
	
	    if (hDigestInfo.substring(0, len) === head) {
	      return {
	        alg: algName,
	        hash: hDigestInfo.substring(len)
	      };
	    }
	  }
	  return [];
	}
	
	
	RSAVerifier.prototype.verify = function (msg, encsig) {
	  encsig = encsig.replace(/[^0-9a-f]|[\s\n]]/ig, '');
	
	  var sig = new BigInteger(encsig, 16);
	  if (sig.bitLength() > this.n.bitLength()) {
	    throw new Error('Signature does not match with the key modulus.');
	  }
	
	  var decryptedSig = sig.modPowInt(this.e, this.n);
	  var digest = decryptedSig.toString(16).replace(/^1f+00/, '');
	
	  var digestInfo = getAlgorithmFromDigest(digest);
	  if (digestInfo.length === 0) {
	    return false;
	  }
	
	  if (!DigestAlgs.hasOwnProperty(digestInfo.alg)) {
	    throw new Error('Hashing algorithm is not supported.');
	  }
	
	  var msgHash = DigestAlgs[digestInfo.alg](msg).toString();
	  return (digestInfo.hash === msgHash);
	};
	
	module.exports = RSAVerifier;


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	var sha256 = __webpack_require__(19);
	var cryptoBase64 = __webpack_require__(33);
	var cryptoHex = __webpack_require__(34);
	
	var RSAVerifier = __webpack_require__(38);
	var base64 = __webpack_require__(20);
	var jwks = __webpack_require__(37);
	var error = __webpack_require__(36);
	var DummyCache = __webpack_require__(35);
	var supportedAlgs = ['RS256'];
	
	/**
	 * Creates a new id_token verifier
	 * @constructor
	 * @param {Object} parameters
	 * @param {String} parameters.issuer name of the issuer of the token
	 * that should match the `iss` claim in the id_token
	 * @param {String} parameters.audience identifies the recipients that the JWT is intended for
	 * and should match the `aud` claim
	 * @param {Object} [parameters.jwksCache] cache for JSON Web Token Keys. By default it has no cache
	 * @param {String} [parameters.jwksURI] A valid, direct URI to fetch the JSON Web Key Set (JWKS).
	 * @param {String} [parameters.expectedAlg='RS256'] algorithm in which the id_token was signed
	 * and will be used to validate
	 * @param {number} [parameters.leeway=0] number of seconds that the clock can be out of sync
	 * while validating expiration of the id_token
	 */
	function IdTokenVerifier(parameters) {
	  var options = parameters || {};
	
	  this.jwksCache = options.jwksCache || new DummyCache();
	  this.expectedAlg = options.expectedAlg || 'RS256';
	  this.issuer = options.issuer;
	  this.audience = options.audience;
	  this.leeway = options.leeway || 0;
	  this.__disableExpirationCheck = options.__disableExpirationCheck || false;
	  this.jwksURI = options.jwksURI;
	
	  if (this.leeway < 0 || this.leeway > 60) {
	    throw new error.ConfigurationError('The leeway should be positive and lower than a minute.');
	  }
	
	  if (supportedAlgs.indexOf(this.expectedAlg) === -1) {
	    throw new error.ConfigurationError('Algorithm ' + this.expectedAlg +
	      ' is not supported. (Expected algs: [' + supportedAlgs.join(',') + '])');
	  }
	}
	
	/**
	 * @callback verifyCallback
	 * @param {Error} [err] error returned if the verify cannot be performed
	 * @param {boolean} [status] if the token is valid or not
	 */
	
	/**
	 * Verifies an id_token
	 *
	 * It will validate:
	 * - signature according to the algorithm configured in the verifier.
	 * - if nonce is present and matches the one provided
	 * - if `iss` and `aud` claims matches the configured issuer and audience
	 * - if token is not expired and valid (if the `nbf` claim is in the past)
	 *
	 * @method verify
	 * @param {String} token id_token to verify
	 * @param {String} [nonce] nonce value that should match the one in the id_token claims
	 * @param {verifyCallback} cb callback used to notify the results of the validation
	 */
	IdTokenVerifier.prototype.verify = function (token, nonce, cb) {
	  var jwt = this.decode(token);
	
	  if (jwt instanceof Error) {
	    return cb(jwt, false);
	  }
	
	  /* eslint-disable vars-on-top */
	  var headAndPayload = jwt.encoded.header + '.' + jwt.encoded.payload;
	  var signature = base64.decodeToHEX(jwt.encoded.signature);
	
	  var alg = jwt.header.alg;
	  var kid = jwt.header.kid;
	
	  var aud = jwt.payload.aud;
	  var iss = jwt.payload.iss;
	  var exp = jwt.payload.exp;
	  var nbf = jwt.payload.nbf;
	  var tnonce = jwt.payload.nonce || null;
	  /* eslint-enable vars-on-top */
	
	  if (this.issuer !== iss) {
	    return cb(new error.TokenValidationError('Issuer ' + iss + ' is not valid.'), false);
	  }
	
	  if (this.audience !== aud) {
	    return cb(new error.TokenValidationError('Audience ' + aud + ' is not valid.'), false);
	  }
	
	  if (this.expectedAlg !== alg) {
	    return cb(new error.TokenValidationError('Algorithm ' + alg +
	      ' is not supported. (Expected algs: [' + supportedAlgs.join(',') + '])'), false);
	  }
	
	  if (tnonce !== nonce) {
	    return cb(new error.TokenValidationError('Nonce does not match.'), false);
	  }
	
	  var expirationError = this.verifyExpAndNbf(exp, nbf); // eslint-disable-line vars-on-top
	
	  if (expirationError) {
	    return cb(expirationError, false);
	  }
	
	  return this.getRsaVerifier(iss, kid, function (err, rsaVerifier) {
	    if (err) {
	      return cb(err);
	    }
	    if (rsaVerifier.verify(headAndPayload, signature)) {
	      return cb(null, jwt.payload);
	    }
	    return cb(new error.TokenValidationError('Invalid signature.'));
	  });
	};
	
	/**
	 * Verifies that the `exp` and `nbf` claims are valid in the current moment.
	 *
	 * @method verifyExpAndNbf
	 * @param {String} exp value of `exp` claim
	 * @param {String} nbf value of `nbf` claim
	 * @return {boolean} if token is valid according to `exp` and `nbf`
	 */
	IdTokenVerifier.prototype.verifyExpAndNbf = function (exp, nbf) {
	  var now = new Date();
	  var expDate = new Date(0);
	  var nbfDate = new Date(0);
	
	  if (this.__disableExpirationCheck) {
	    return null;
	  }
	
	  expDate.setUTCSeconds(exp + this.leeway);
	
	  if (now > expDate) {
	    return new error.TokenValidationError('Expired token.');
	  }
	
	  if (typeof nbf === 'undefined') {
	    return null;
	  }
	  nbfDate.setUTCSeconds(nbf - this.leeway);
	  if (now < nbfDate) {
	    return new error.TokenValidationError('The token is not valid until later in the future. ' +
	      'Please check your computed clock.');
	  }
	
	  return null;
	};
	
	/**
	 * Verifies that the `exp` and `iat` claims are valid in the current moment.
	 *
	 * @method verifyExpAndIat
	 * @param {String} exp value of `exp` claim
	 * @param {String} iat value of `iat` claim
	 * @return {boolean} if token is valid according to `exp` and `iat`
	 */
	IdTokenVerifier.prototype.verifyExpAndIat = function (exp, iat) {
	  var now = new Date();
	  var expDate = new Date(0);
	  var iatDate = new Date(0);
	
	  if (this.__disableExpirationCheck) {
	    return null;
	  }
	
	  expDate.setUTCSeconds(exp + this.leeway);
	
	  if (now > expDate) {
	    return new error.TokenValidationError('Expired token.');
	  }
	
	  iatDate.setUTCSeconds(iat - this.leeway);
	
	  if (now < iatDate) {
	    return new error.TokenValidationError('The token was issued in the future. ' +
	      'Please check your computed clock.');
	  }
	  return null;
	};
	
	IdTokenVerifier.prototype.getRsaVerifier = function (iss, kid, cb) {
	  var _this = this;
	  var cachekey = iss + kid;
	
	  if (!this.jwksCache.has(cachekey)) {
	    jwks.getJWKS({
	      jwksURI: this.jwksURI,
	      iss: iss,
	      kid: kid
	    }, function (err, keyInfo) {
	      if (err) {
	        return cb(err);
	      }
	      _this.jwksCache.set(cachekey, keyInfo);
	      return cb(null, new RSAVerifier(keyInfo.modulus, keyInfo.exp));
	    });
	  } else {
	    var keyInfo = this.jwksCache.get(cachekey); // eslint-disable-line vars-on-top
	    cb(null, new RSAVerifier(keyInfo.modulus, keyInfo.exp));
	  }
	};
	
	
	/**
	 * @typedef DecodedToken
	 * @type {Object}
	 * @property {Object} header - content of the JWT header.
	 * @property {Object} payload - token claims.
	 * @property {Object} encoded - encoded parts of the token.
	 */
	
	/**
	 * Decodes a well formed JWT without any verification
	 *
	 * @method decode
	 * @param {String} token decodes the token
	 * @return {DecodedToken} if token is valid according to `exp` and `nbf`
	 */
	IdTokenVerifier.prototype.decode = function (token) {
	  var parts = token.split('.');
	  var header;
	  var payload;
	
	  if (parts.length !== 3) {
	    return new error.TokenValidationError('Cannot decode a malformed JWT');
	  }
	
	  try {
	    header = JSON.parse(base64.decodeToString(parts[0]));
	    payload = JSON.parse(base64.decodeToString(parts[1]));
	  } catch (e) {
	    return new error.TokenValidationError('Token header or payload is not valid JSON');
	  }
	
	  return {
	    header: header,
	    payload: payload,
	    encoded: {
	      header: parts[0],
	      payload: parts[1],
	      signature: parts[2]
	    }
	  };
	};
	
	/**
	 * @callback validateAccessTokenCallback
	 * @param {Error} [err] error returned if the validation cannot be performed
	 * or the token is invalid. If there is no error, then the access_token is valid.
	 */
	
	/**
	 * Validates an access_token based on {@link http://openid.net/specs/openid-connect-core-1_0.html#ImplicitTokenValidation}.
	 * The id_token from where the alg and atHash parameters are taken,
	 * should be decoded and verified before using thisfunction
	 *
	 * @method validateAccessToken
	 * @param {String} access_token the access_token
	 * @param {String} alg The algorithm defined in the header of the
	 * previously verified id_token under the "alg" claim.
	 * @param {String} atHash The "at_hash" value included in the payload
	 * of the previously verified id_token.
	 * @param {validateAccessTokenCallback} cb callback used to notify the results of the validation.
	 */
	IdTokenVerifier.prototype.validateAccessToken = function (accessToken, alg, atHash, cb) {
	  if (this.expectedAlg !== alg) {
	    return cb(new error.TokenValidationError('Algorithm ' + alg +
	      ' is not supported. (Expected alg: ' + this.expectedAlg + ')'));
	  }
	  var sha256AccessToken = sha256(accessToken);
	  var hashToHex = cryptoHex.stringify(sha256AccessToken);
	  var hashToHexFirstHalf = hashToHex.substring(0, hashToHex.length / 2);
	  var hashFirstHalfWordArray = cryptoHex.parse(hashToHexFirstHalf);
	  var hashFirstHalfBase64 = cryptoBase64.stringify(hashFirstHalfWordArray);
	  var hashFirstHalfBase64SafeUrl = base64.base64ToBase64Url(hashFirstHalfBase64);
	  if (hashFirstHalfBase64SafeUrl !== atHash) {
	    return cb(new error.TokenValidationError('Invalid access_token'));
	  }
	  return cb(null);
	};
	
	module.exports = IdTokenVerifier;


/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	(function(){
	
	    // Copyright (c) 2005  Tom Wu
	    // All Rights Reserved.
	    // See "LICENSE" for details.
	
	    // Basic JavaScript BN library - subset useful for RSA encryption.
	
	    // Bits per digit
	    var dbits;
	
	    // JavaScript engine analysis
	    var canary = 0xdeadbeefcafe;
	    var j_lm = ((canary&0xffffff)==0xefcafe);
	
	    // (public) Constructor
	    function BigInteger(a,b,c) {
	      if(a != null)
	        if("number" == typeof a) this.fromNumber(a,b,c);
	        else if(b == null && "string" != typeof a) this.fromString(a,256);
	        else this.fromString(a,b);
	    }
	
	    // return new, unset BigInteger
	    function nbi() { return new BigInteger(null); }
	
	    // am: Compute w_j += (x*this_i), propagate carries,
	    // c is initial carry, returns final carry.
	    // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
	    // We need to select the fastest one that works in this environment.
	
	    // am1: use a single mult and divide to get the high bits,
	    // max digit bits should be 26 because
	    // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
	    function am1(i,x,w,j,c,n) {
	      while(--n >= 0) {
	        var v = x*this[i++]+w[j]+c;
	        c = Math.floor(v/0x4000000);
	        w[j++] = v&0x3ffffff;
	      }
	      return c;
	    }
	    // am2 avoids a big mult-and-extract completely.
	    // Max digit bits should be <= 30 because we do bitwise ops
	    // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
	    function am2(i,x,w,j,c,n) {
	      var xl = x&0x7fff, xh = x>>15;
	      while(--n >= 0) {
	        var l = this[i]&0x7fff;
	        var h = this[i++]>>15;
	        var m = xh*l+h*xl;
	        l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
	        c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
	        w[j++] = l&0x3fffffff;
	      }
	      return c;
	    }
	    // Alternately, set max digit bits to 28 since some
	    // browsers slow down when dealing with 32-bit numbers.
	    function am3(i,x,w,j,c,n) {
	      var xl = x&0x3fff, xh = x>>14;
	      while(--n >= 0) {
	        var l = this[i]&0x3fff;
	        var h = this[i++]>>14;
	        var m = xh*l+h*xl;
	        l = xl*l+((m&0x3fff)<<14)+w[j]+c;
	        c = (l>>28)+(m>>14)+xh*h;
	        w[j++] = l&0xfffffff;
	      }
	      return c;
	    }
	    var inBrowser = typeof navigator !== "undefined";
	    if(inBrowser && j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
	      BigInteger.prototype.am = am2;
	      dbits = 30;
	    }
	    else if(inBrowser && j_lm && (navigator.appName != "Netscape")) {
	      BigInteger.prototype.am = am1;
	      dbits = 26;
	    }
	    else { // Mozilla/Netscape seems to prefer am3
	      BigInteger.prototype.am = am3;
	      dbits = 28;
	    }
	
	    BigInteger.prototype.DB = dbits;
	    BigInteger.prototype.DM = ((1<<dbits)-1);
	    BigInteger.prototype.DV = (1<<dbits);
	
	    var BI_FP = 52;
	    BigInteger.prototype.FV = Math.pow(2,BI_FP);
	    BigInteger.prototype.F1 = BI_FP-dbits;
	    BigInteger.prototype.F2 = 2*dbits-BI_FP;
	
	    // Digit conversions
	    var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
	    var BI_RC = new Array();
	    var rr,vv;
	    rr = "0".charCodeAt(0);
	    for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
	    rr = "a".charCodeAt(0);
	    for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
	    rr = "A".charCodeAt(0);
	    for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
	
	    function int2char(n) { return BI_RM.charAt(n); }
	    function intAt(s,i) {
	      var c = BI_RC[s.charCodeAt(i)];
	      return (c==null)?-1:c;
	    }
	
	    // (protected) copy this to r
	    function bnpCopyTo(r) {
	      for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
	      r.t = this.t;
	      r.s = this.s;
	    }
	
	    // (protected) set from integer value x, -DV <= x < DV
	    function bnpFromInt(x) {
	      this.t = 1;
	      this.s = (x<0)?-1:0;
	      if(x > 0) this[0] = x;
	      else if(x < -1) this[0] = x+this.DV;
	      else this.t = 0;
	    }
	
	    // return bigint initialized to value
	    function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
	
	    // (protected) set from string and radix
	    function bnpFromString(s,b) {
	      var k;
	      if(b == 16) k = 4;
	      else if(b == 8) k = 3;
	      else if(b == 256) k = 8; // byte array
	      else if(b == 2) k = 1;
	      else if(b == 32) k = 5;
	      else if(b == 4) k = 2;
	      else { this.fromRadix(s,b); return; }
	      this.t = 0;
	      this.s = 0;
	      var i = s.length, mi = false, sh = 0;
	      while(--i >= 0) {
	        var x = (k==8)?s[i]&0xff:intAt(s,i);
	        if(x < 0) {
	          if(s.charAt(i) == "-") mi = true;
	          continue;
	        }
	        mi = false;
	        if(sh == 0)
	          this[this.t++] = x;
	        else if(sh+k > this.DB) {
	          this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
	          this[this.t++] = (x>>(this.DB-sh));
	        }
	        else
	          this[this.t-1] |= x<<sh;
	        sh += k;
	        if(sh >= this.DB) sh -= this.DB;
	      }
	      if(k == 8 && (s[0]&0x80) != 0) {
	        this.s = -1;
	        if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
	      }
	      this.clamp();
	      if(mi) BigInteger.ZERO.subTo(this,this);
	    }
	
	    // (protected) clamp off excess high words
	    function bnpClamp() {
	      var c = this.s&this.DM;
	      while(this.t > 0 && this[this.t-1] == c) --this.t;
	    }
	
	    // (public) return string representation in given radix
	    function bnToString(b) {
	      if(this.s < 0) return "-"+this.negate().toString(b);
	      var k;
	      if(b == 16) k = 4;
	      else if(b == 8) k = 3;
	      else if(b == 2) k = 1;
	      else if(b == 32) k = 5;
	      else if(b == 4) k = 2;
	      else return this.toRadix(b);
	      var km = (1<<k)-1, d, m = false, r = "", i = this.t;
	      var p = this.DB-(i*this.DB)%k;
	      if(i-- > 0) {
	        if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
	        while(i >= 0) {
	          if(p < k) {
	            d = (this[i]&((1<<p)-1))<<(k-p);
	            d |= this[--i]>>(p+=this.DB-k);
	          }
	          else {
	            d = (this[i]>>(p-=k))&km;
	            if(p <= 0) { p += this.DB; --i; }
	          }
	          if(d > 0) m = true;
	          if(m) r += int2char(d);
	        }
	      }
	      return m?r:"0";
	    }
	
	    // (public) -this
	    function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
	
	    // (public) |this|
	    function bnAbs() { return (this.s<0)?this.negate():this; }
	
	    // (public) return + if this > a, - if this < a, 0 if equal
	    function bnCompareTo(a) {
	      var r = this.s-a.s;
	      if(r != 0) return r;
	      var i = this.t;
	      r = i-a.t;
	      if(r != 0) return (this.s<0)?-r:r;
	      while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
	      return 0;
	    }
	
	    // returns bit length of the integer x
	    function nbits(x) {
	      var r = 1, t;
	      if((t=x>>>16) != 0) { x = t; r += 16; }
	      if((t=x>>8) != 0) { x = t; r += 8; }
	      if((t=x>>4) != 0) { x = t; r += 4; }
	      if((t=x>>2) != 0) { x = t; r += 2; }
	      if((t=x>>1) != 0) { x = t; r += 1; }
	      return r;
	    }
	
	    // (public) return the number of bits in "this"
	    function bnBitLength() {
	      if(this.t <= 0) return 0;
	      return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
	    }
	
	    // (protected) r = this << n*DB
	    function bnpDLShiftTo(n,r) {
	      var i;
	      for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
	      for(i = n-1; i >= 0; --i) r[i] = 0;
	      r.t = this.t+n;
	      r.s = this.s;
	    }
	
	    // (protected) r = this >> n*DB
	    function bnpDRShiftTo(n,r) {
	      for(var i = n; i < this.t; ++i) r[i-n] = this[i];
	      r.t = Math.max(this.t-n,0);
	      r.s = this.s;
	    }
	
	    // (protected) r = this << n
	    function bnpLShiftTo(n,r) {
	      var bs = n%this.DB;
	      var cbs = this.DB-bs;
	      var bm = (1<<cbs)-1;
	      var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
	      for(i = this.t-1; i >= 0; --i) {
	        r[i+ds+1] = (this[i]>>cbs)|c;
	        c = (this[i]&bm)<<bs;
	      }
	      for(i = ds-1; i >= 0; --i) r[i] = 0;
	      r[ds] = c;
	      r.t = this.t+ds+1;
	      r.s = this.s;
	      r.clamp();
	    }
	
	    // (protected) r = this >> n
	    function bnpRShiftTo(n,r) {
	      r.s = this.s;
	      var ds = Math.floor(n/this.DB);
	      if(ds >= this.t) { r.t = 0; return; }
	      var bs = n%this.DB;
	      var cbs = this.DB-bs;
	      var bm = (1<<bs)-1;
	      r[0] = this[ds]>>bs;
	      for(var i = ds+1; i < this.t; ++i) {
	        r[i-ds-1] |= (this[i]&bm)<<cbs;
	        r[i-ds] = this[i]>>bs;
	      }
	      if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
	      r.t = this.t-ds;
	      r.clamp();
	    }
	
	    // (protected) r = this - a
	    function bnpSubTo(a,r) {
	      var i = 0, c = 0, m = Math.min(a.t,this.t);
	      while(i < m) {
	        c += this[i]-a[i];
	        r[i++] = c&this.DM;
	        c >>= this.DB;
	      }
	      if(a.t < this.t) {
	        c -= a.s;
	        while(i < this.t) {
	          c += this[i];
	          r[i++] = c&this.DM;
	          c >>= this.DB;
	        }
	        c += this.s;
	      }
	      else {
	        c += this.s;
	        while(i < a.t) {
	          c -= a[i];
	          r[i++] = c&this.DM;
	          c >>= this.DB;
	        }
	        c -= a.s;
	      }
	      r.s = (c<0)?-1:0;
	      if(c < -1) r[i++] = this.DV+c;
	      else if(c > 0) r[i++] = c;
	      r.t = i;
	      r.clamp();
	    }
	
	    // (protected) r = this * a, r != this,a (HAC 14.12)
	    // "this" should be the larger one if appropriate.
	    function bnpMultiplyTo(a,r) {
	      var x = this.abs(), y = a.abs();
	      var i = x.t;
	      r.t = i+y.t;
	      while(--i >= 0) r[i] = 0;
	      for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
	      r.s = 0;
	      r.clamp();
	      if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
	    }
	
	    // (protected) r = this^2, r != this (HAC 14.16)
	    function bnpSquareTo(r) {
	      var x = this.abs();
	      var i = r.t = 2*x.t;
	      while(--i >= 0) r[i] = 0;
	      for(i = 0; i < x.t-1; ++i) {
	        var c = x.am(i,x[i],r,2*i,0,1);
	        if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
	          r[i+x.t] -= x.DV;
	          r[i+x.t+1] = 1;
	        }
	      }
	      if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
	      r.s = 0;
	      r.clamp();
	    }
	
	    // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
	    // r != q, this != m.  q or r may be null.
	    function bnpDivRemTo(m,q,r) {
	      var pm = m.abs();
	      if(pm.t <= 0) return;
	      var pt = this.abs();
	      if(pt.t < pm.t) {
	        if(q != null) q.fromInt(0);
	        if(r != null) this.copyTo(r);
	        return;
	      }
	      if(r == null) r = nbi();
	      var y = nbi(), ts = this.s, ms = m.s;
	      var nsh = this.DB-nbits(pm[pm.t-1]);   // normalize modulus
	      if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
	      else { pm.copyTo(y); pt.copyTo(r); }
	      var ys = y.t;
	      var y0 = y[ys-1];
	      if(y0 == 0) return;
	      var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
	      var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
	      var i = r.t, j = i-ys, t = (q==null)?nbi():q;
	      y.dlShiftTo(j,t);
	      if(r.compareTo(t) >= 0) {
	        r[r.t++] = 1;
	        r.subTo(t,r);
	      }
	      BigInteger.ONE.dlShiftTo(ys,t);
	      t.subTo(y,y);  // "negative" y so we can replace sub with am later
	      while(y.t < ys) y[y.t++] = 0;
	      while(--j >= 0) {
	        // Estimate quotient digit
	        var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
	        if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {   // Try it out
	          y.dlShiftTo(j,t);
	          r.subTo(t,r);
	          while(r[i] < --qd) r.subTo(t,r);
	        }
	      }
	      if(q != null) {
	        r.drShiftTo(ys,q);
	        if(ts != ms) BigInteger.ZERO.subTo(q,q);
	      }
	      r.t = ys;
	      r.clamp();
	      if(nsh > 0) r.rShiftTo(nsh,r); // Denormalize remainder
	      if(ts < 0) BigInteger.ZERO.subTo(r,r);
	    }
	
	    // (public) this mod a
	    function bnMod(a) {
	      var r = nbi();
	      this.abs().divRemTo(a,null,r);
	      if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
	      return r;
	    }
	
	    // Modular reduction using "classic" algorithm
	    function Classic(m) { this.m = m; }
	    function cConvert(x) {
	      if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
	      else return x;
	    }
	    function cRevert(x) { return x; }
	    function cReduce(x) { x.divRemTo(this.m,null,x); }
	    function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
	    function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
	
	    Classic.prototype.convert = cConvert;
	    Classic.prototype.revert = cRevert;
	    Classic.prototype.reduce = cReduce;
	    Classic.prototype.mulTo = cMulTo;
	    Classic.prototype.sqrTo = cSqrTo;
	
	    // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
	    // justification:
	    //         xy == 1 (mod m)
	    //         xy =  1+km
	    //   xy(2-xy) = (1+km)(1-km)
	    // x[y(2-xy)] = 1-k^2m^2
	    // x[y(2-xy)] == 1 (mod m^2)
	    // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
	    // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
	    // JS multiply "overflows" differently from C/C++, so care is needed here.
	    function bnpInvDigit() {
	      if(this.t < 1) return 0;
	      var x = this[0];
	      if((x&1) == 0) return 0;
	      var y = x&3;       // y == 1/x mod 2^2
	      y = (y*(2-(x&0xf)*y))&0xf; // y == 1/x mod 2^4
	      y = (y*(2-(x&0xff)*y))&0xff;   // y == 1/x mod 2^8
	      y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;    // y == 1/x mod 2^16
	      // last step - calculate inverse mod DV directly;
	      // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
	      y = (y*(2-x*y%this.DV))%this.DV;       // y == 1/x mod 2^dbits
	      // we really want the negative inverse, and -DV < y < DV
	      return (y>0)?this.DV-y:-y;
	    }
	
	    // Montgomery reduction
	    function Montgomery(m) {
	      this.m = m;
	      this.mp = m.invDigit();
	      this.mpl = this.mp&0x7fff;
	      this.mph = this.mp>>15;
	      this.um = (1<<(m.DB-15))-1;
	      this.mt2 = 2*m.t;
	    }
	
	    // xR mod m
	    function montConvert(x) {
	      var r = nbi();
	      x.abs().dlShiftTo(this.m.t,r);
	      r.divRemTo(this.m,null,r);
	      if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
	      return r;
	    }
	
	    // x/R mod m
	    function montRevert(x) {
	      var r = nbi();
	      x.copyTo(r);
	      this.reduce(r);
	      return r;
	    }
	
	    // x = x/R mod m (HAC 14.32)
	    function montReduce(x) {
	      while(x.t <= this.mt2) // pad x so am has enough room later
	        x[x.t++] = 0;
	      for(var i = 0; i < this.m.t; ++i) {
	        // faster way of calculating u0 = x[i]*mp mod DV
	        var j = x[i]&0x7fff;
	        var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
	        // use am to combine the multiply-shift-add into one call
	        j = i+this.m.t;
	        x[j] += this.m.am(0,u0,x,i,0,this.m.t);
	        // propagate carry
	        while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
	      }
	      x.clamp();
	      x.drShiftTo(this.m.t,x);
	      if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
	    }
	
	    // r = "x^2/R mod m"; x != r
	    function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
	
	    // r = "xy/R mod m"; x,y != r
	    function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
	
	    Montgomery.prototype.convert = montConvert;
	    Montgomery.prototype.revert = montRevert;
	    Montgomery.prototype.reduce = montReduce;
	    Montgomery.prototype.mulTo = montMulTo;
	    Montgomery.prototype.sqrTo = montSqrTo;
	
	    // (protected) true iff this is even
	    function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
	
	    // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
	    function bnpExp(e,z) {
	      if(e > 0xffffffff || e < 1) return BigInteger.ONE;
	      var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
	      g.copyTo(r);
	      while(--i >= 0) {
	        z.sqrTo(r,r2);
	        if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
	        else { var t = r; r = r2; r2 = t; }
	      }
	      return z.revert(r);
	    }
	
	    // (public) this^e % m, 0 <= e < 2^32
	    function bnModPowInt(e,m) {
	      var z;
	      if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
	      return this.exp(e,z);
	    }
	
	    // protected
	    BigInteger.prototype.copyTo = bnpCopyTo;
	    BigInteger.prototype.fromInt = bnpFromInt;
	    BigInteger.prototype.fromString = bnpFromString;
	    BigInteger.prototype.clamp = bnpClamp;
	    BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
	    BigInteger.prototype.drShiftTo = bnpDRShiftTo;
	    BigInteger.prototype.lShiftTo = bnpLShiftTo;
	    BigInteger.prototype.rShiftTo = bnpRShiftTo;
	    BigInteger.prototype.subTo = bnpSubTo;
	    BigInteger.prototype.multiplyTo = bnpMultiplyTo;
	    BigInteger.prototype.squareTo = bnpSquareTo;
	    BigInteger.prototype.divRemTo = bnpDivRemTo;
	    BigInteger.prototype.invDigit = bnpInvDigit;
	    BigInteger.prototype.isEven = bnpIsEven;
	    BigInteger.prototype.exp = bnpExp;
	
	    // public
	    BigInteger.prototype.toString = bnToString;
	    BigInteger.prototype.negate = bnNegate;
	    BigInteger.prototype.abs = bnAbs;
	    BigInteger.prototype.compareTo = bnCompareTo;
	    BigInteger.prototype.bitLength = bnBitLength;
	    BigInteger.prototype.mod = bnMod;
	    BigInteger.prototype.modPowInt = bnModPowInt;
	
	    // "constants"
	    BigInteger.ZERO = nbv(0);
	    BigInteger.ONE = nbv(1);
	
	    // Copyright (c) 2005-2009  Tom Wu
	    // All Rights Reserved.
	    // See "LICENSE" for details.
	
	    // Extended JavaScript BN functions, required for RSA private ops.
	
	    // Version 1.1: new BigInteger("0", 10) returns "proper" zero
	    // Version 1.2: square() API, isProbablePrime fix
	
	    // (public)
	    function bnClone() { var r = nbi(); this.copyTo(r); return r; }
	
	    // (public) return value as integer
	    function bnIntValue() {
	      if(this.s < 0) {
	        if(this.t == 1) return this[0]-this.DV;
	        else if(this.t == 0) return -1;
	      }
	      else if(this.t == 1) return this[0];
	      else if(this.t == 0) return 0;
	      // assumes 16 < DB < 32
	      return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
	    }
	
	    // (public) return value as byte
	    function bnByteValue() { return (this.t==0)?this.s:(this[0]<<24)>>24; }
	
	    // (public) return value as short (assumes DB>=16)
	    function bnShortValue() { return (this.t==0)?this.s:(this[0]<<16)>>16; }
	
	    // (protected) return x s.t. r^x < DV
	    function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
	
	    // (public) 0 if this == 0, 1 if this > 0
	    function bnSigNum() {
	      if(this.s < 0) return -1;
	      else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
	      else return 1;
	    }
	
	    // (protected) convert to radix string
	    function bnpToRadix(b) {
	      if(b == null) b = 10;
	      if(this.signum() == 0 || b < 2 || b > 36) return "0";
	      var cs = this.chunkSize(b);
	      var a = Math.pow(b,cs);
	      var d = nbv(a), y = nbi(), z = nbi(), r = "";
	      this.divRemTo(d,y,z);
	      while(y.signum() > 0) {
	        r = (a+z.intValue()).toString(b).substr(1) + r;
	        y.divRemTo(d,y,z);
	      }
	      return z.intValue().toString(b) + r;
	    }
	
	    // (protected) convert from radix string
	    function bnpFromRadix(s,b) {
	      this.fromInt(0);
	      if(b == null) b = 10;
	      var cs = this.chunkSize(b);
	      var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
	      for(var i = 0; i < s.length; ++i) {
	        var x = intAt(s,i);
	        if(x < 0) {
	          if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
	          continue;
	        }
	        w = b*w+x;
	        if(++j >= cs) {
	          this.dMultiply(d);
	          this.dAddOffset(w,0);
	          j = 0;
	          w = 0;
	        }
	      }
	      if(j > 0) {
	        this.dMultiply(Math.pow(b,j));
	        this.dAddOffset(w,0);
	      }
	      if(mi) BigInteger.ZERO.subTo(this,this);
	    }
	
	    // (protected) alternate constructor
	    function bnpFromNumber(a,b,c) {
	      if("number" == typeof b) {
	        // new BigInteger(int,int,RNG)
	        if(a < 2) this.fromInt(1);
	        else {
	          this.fromNumber(a,c);
	          if(!this.testBit(a-1))	// force MSB set
	            this.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,this);
	          if(this.isEven()) this.dAddOffset(1,0); // force odd
	          while(!this.isProbablePrime(b)) {
	            this.dAddOffset(2,0);
	            if(this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a-1),this);
	          }
	        }
	      }
	      else {
	        // new BigInteger(int,RNG)
	        var x = new Array(), t = a&7;
	        x.length = (a>>3)+1;
	        b.nextBytes(x);
	        if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
	        this.fromString(x,256);
	      }
	    }
	
	    // (public) convert to bigendian byte array
	    function bnToByteArray() {
	      var i = this.t, r = new Array();
	      r[0] = this.s;
	      var p = this.DB-(i*this.DB)%8, d, k = 0;
	      if(i-- > 0) {
	        if(p < this.DB && (d = this[i]>>p) != (this.s&this.DM)>>p)
	          r[k++] = d|(this.s<<(this.DB-p));
	        while(i >= 0) {
	          if(p < 8) {
	            d = (this[i]&((1<<p)-1))<<(8-p);
	            d |= this[--i]>>(p+=this.DB-8);
	          }
	          else {
	            d = (this[i]>>(p-=8))&0xff;
	            if(p <= 0) { p += this.DB; --i; }
	          }
	          if((d&0x80) != 0) d |= -256;
	          if(k == 0 && (this.s&0x80) != (d&0x80)) ++k;
	          if(k > 0 || d != this.s) r[k++] = d;
	        }
	      }
	      return r;
	    }
	
	    function bnEquals(a) { return(this.compareTo(a)==0); }
	    function bnMin(a) { return(this.compareTo(a)<0)?this:a; }
	    function bnMax(a) { return(this.compareTo(a)>0)?this:a; }
	
	    // (protected) r = this op a (bitwise)
	    function bnpBitwiseTo(a,op,r) {
	      var i, f, m = Math.min(a.t,this.t);
	      for(i = 0; i < m; ++i) r[i] = op(this[i],a[i]);
	      if(a.t < this.t) {
	        f = a.s&this.DM;
	        for(i = m; i < this.t; ++i) r[i] = op(this[i],f);
	        r.t = this.t;
	      }
	      else {
	        f = this.s&this.DM;
	        for(i = m; i < a.t; ++i) r[i] = op(f,a[i]);
	        r.t = a.t;
	      }
	      r.s = op(this.s,a.s);
	      r.clamp();
	    }
	
	    // (public) this & a
	    function op_and(x,y) { return x&y; }
	    function bnAnd(a) { var r = nbi(); this.bitwiseTo(a,op_and,r); return r; }
	
	    // (public) this | a
	    function op_or(x,y) { return x|y; }
	    function bnOr(a) { var r = nbi(); this.bitwiseTo(a,op_or,r); return r; }
	
	    // (public) this ^ a
	    function op_xor(x,y) { return x^y; }
	    function bnXor(a) { var r = nbi(); this.bitwiseTo(a,op_xor,r); return r; }
	
	    // (public) this & ~a
	    function op_andnot(x,y) { return x&~y; }
	    function bnAndNot(a) { var r = nbi(); this.bitwiseTo(a,op_andnot,r); return r; }
	
	    // (public) ~this
	    function bnNot() {
	      var r = nbi();
	      for(var i = 0; i < this.t; ++i) r[i] = this.DM&~this[i];
	      r.t = this.t;
	      r.s = ~this.s;
	      return r;
	    }
	
	    // (public) this << n
	    function bnShiftLeft(n) {
	      var r = nbi();
	      if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
	      return r;
	    }
	
	    // (public) this >> n
	    function bnShiftRight(n) {
	      var r = nbi();
	      if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
	      return r;
	    }
	
	    // return index of lowest 1-bit in x, x < 2^31
	    function lbit(x) {
	      if(x == 0) return -1;
	      var r = 0;
	      if((x&0xffff) == 0) { x >>= 16; r += 16; }
	      if((x&0xff) == 0) { x >>= 8; r += 8; }
	      if((x&0xf) == 0) { x >>= 4; r += 4; }
	      if((x&3) == 0) { x >>= 2; r += 2; }
	      if((x&1) == 0) ++r;
	      return r;
	    }
	
	    // (public) returns index of lowest 1-bit (or -1 if none)
	    function bnGetLowestSetBit() {
	      for(var i = 0; i < this.t; ++i)
	        if(this[i] != 0) return i*this.DB+lbit(this[i]);
	      if(this.s < 0) return this.t*this.DB;
	      return -1;
	    }
	
	    // return number of 1 bits in x
	    function cbit(x) {
	      var r = 0;
	      while(x != 0) { x &= x-1; ++r; }
	      return r;
	    }
	
	    // (public) return number of set bits
	    function bnBitCount() {
	      var r = 0, x = this.s&this.DM;
	      for(var i = 0; i < this.t; ++i) r += cbit(this[i]^x);
	      return r;
	    }
	
	    // (public) true iff nth bit is set
	    function bnTestBit(n) {
	      var j = Math.floor(n/this.DB);
	      if(j >= this.t) return(this.s!=0);
	      return((this[j]&(1<<(n%this.DB)))!=0);
	    }
	
	    // (protected) this op (1<<n)
	    function bnpChangeBit(n,op) {
	      var r = BigInteger.ONE.shiftLeft(n);
	      this.bitwiseTo(r,op,r);
	      return r;
	    }
	
	    // (public) this | (1<<n)
	    function bnSetBit(n) { return this.changeBit(n,op_or); }
	
	    // (public) this & ~(1<<n)
	    function bnClearBit(n) { return this.changeBit(n,op_andnot); }
	
	    // (public) this ^ (1<<n)
	    function bnFlipBit(n) { return this.changeBit(n,op_xor); }
	
	    // (protected) r = this + a
	    function bnpAddTo(a,r) {
	      var i = 0, c = 0, m = Math.min(a.t,this.t);
	      while(i < m) {
	        c += this[i]+a[i];
	        r[i++] = c&this.DM;
	        c >>= this.DB;
	      }
	      if(a.t < this.t) {
	        c += a.s;
	        while(i < this.t) {
	          c += this[i];
	          r[i++] = c&this.DM;
	          c >>= this.DB;
	        }
	        c += this.s;
	      }
	      else {
	        c += this.s;
	        while(i < a.t) {
	          c += a[i];
	          r[i++] = c&this.DM;
	          c >>= this.DB;
	        }
	        c += a.s;
	      }
	      r.s = (c<0)?-1:0;
	      if(c > 0) r[i++] = c;
	      else if(c < -1) r[i++] = this.DV+c;
	      r.t = i;
	      r.clamp();
	    }
	
	    // (public) this + a
	    function bnAdd(a) { var r = nbi(); this.addTo(a,r); return r; }
	
	    // (public) this - a
	    function bnSubtract(a) { var r = nbi(); this.subTo(a,r); return r; }
	
	    // (public) this * a
	    function bnMultiply(a) { var r = nbi(); this.multiplyTo(a,r); return r; }
	
	    // (public) this^2
	    function bnSquare() { var r = nbi(); this.squareTo(r); return r; }
	
	    // (public) this / a
	    function bnDivide(a) { var r = nbi(); this.divRemTo(a,r,null); return r; }
	
	    // (public) this % a
	    function bnRemainder(a) { var r = nbi(); this.divRemTo(a,null,r); return r; }
	
	    // (public) [this/a,this%a]
	    function bnDivideAndRemainder(a) {
	      var q = nbi(), r = nbi();
	      this.divRemTo(a,q,r);
	      return new Array(q,r);
	    }
	
	    // (protected) this *= n, this >= 0, 1 < n < DV
	    function bnpDMultiply(n) {
	      this[this.t] = this.am(0,n-1,this,0,0,this.t);
	      ++this.t;
	      this.clamp();
	    }
	
	    // (protected) this += n << w words, this >= 0
	    function bnpDAddOffset(n,w) {
	      if(n == 0) return;
	      while(this.t <= w) this[this.t++] = 0;
	      this[w] += n;
	      while(this[w] >= this.DV) {
	        this[w] -= this.DV;
	        if(++w >= this.t) this[this.t++] = 0;
	        ++this[w];
	      }
	    }
	
	    // A "null" reducer
	    function NullExp() {}
	    function nNop(x) { return x; }
	    function nMulTo(x,y,r) { x.multiplyTo(y,r); }
	    function nSqrTo(x,r) { x.squareTo(r); }
	
	    NullExp.prototype.convert = nNop;
	    NullExp.prototype.revert = nNop;
	    NullExp.prototype.mulTo = nMulTo;
	    NullExp.prototype.sqrTo = nSqrTo;
	
	    // (public) this^e
	    function bnPow(e) { return this.exp(e,new NullExp()); }
	
	    // (protected) r = lower n words of "this * a", a.t <= n
	    // "this" should be the larger one if appropriate.
	    function bnpMultiplyLowerTo(a,n,r) {
	      var i = Math.min(this.t+a.t,n);
	      r.s = 0; // assumes a,this >= 0
	      r.t = i;
	      while(i > 0) r[--i] = 0;
	      var j;
	      for(j = r.t-this.t; i < j; ++i) r[i+this.t] = this.am(0,a[i],r,i,0,this.t);
	      for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a[i],r,i,0,n-i);
	      r.clamp();
	    }
	
	    // (protected) r = "this * a" without lower n words, n > 0
	    // "this" should be the larger one if appropriate.
	    function bnpMultiplyUpperTo(a,n,r) {
	      --n;
	      var i = r.t = this.t+a.t-n;
	      r.s = 0; // assumes a,this >= 0
	      while(--i >= 0) r[i] = 0;
	      for(i = Math.max(n-this.t,0); i < a.t; ++i)
	        r[this.t+i-n] = this.am(n-i,a[i],r,0,0,this.t+i-n);
	      r.clamp();
	      r.drShiftTo(1,r);
	    }
	
	    // Barrett modular reduction
	    function Barrett(m) {
	      // setup Barrett
	      this.r2 = nbi();
	      this.q3 = nbi();
	      BigInteger.ONE.dlShiftTo(2*m.t,this.r2);
	      this.mu = this.r2.divide(m);
	      this.m = m;
	    }
	
	    function barrettConvert(x) {
	      if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
	      else if(x.compareTo(this.m) < 0) return x;
	      else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
	    }
	
	    function barrettRevert(x) { return x; }
	
	    // x = x mod m (HAC 14.42)
	    function barrettReduce(x) {
	      x.drShiftTo(this.m.t-1,this.r2);
	      if(x.t > this.m.t+1) { x.t = this.m.t+1; x.clamp(); }
	      this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);
	      this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);
	      while(x.compareTo(this.r2) < 0) x.dAddOffset(1,this.m.t+1);
	      x.subTo(this.r2,x);
	      while(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
	    }
	
	    // r = x^2 mod m; x != r
	    function barrettSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
	
	    // r = x*y mod m; x,y != r
	    function barrettMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
	
	    Barrett.prototype.convert = barrettConvert;
	    Barrett.prototype.revert = barrettRevert;
	    Barrett.prototype.reduce = barrettReduce;
	    Barrett.prototype.mulTo = barrettMulTo;
	    Barrett.prototype.sqrTo = barrettSqrTo;
	
	    // (public) this^e % m (HAC 14.85)
	    function bnModPow(e,m) {
	      var i = e.bitLength(), k, r = nbv(1), z;
	      if(i <= 0) return r;
	      else if(i < 18) k = 1;
	      else if(i < 48) k = 3;
	      else if(i < 144) k = 4;
	      else if(i < 768) k = 5;
	      else k = 6;
	      if(i < 8)
	        z = new Classic(m);
	      else if(m.isEven())
	        z = new Barrett(m);
	      else
	        z = new Montgomery(m);
	
	      // precomputation
	      var g = new Array(), n = 3, k1 = k-1, km = (1<<k)-1;
	      g[1] = z.convert(this);
	      if(k > 1) {
	        var g2 = nbi();
	        z.sqrTo(g[1],g2);
	        while(n <= km) {
	          g[n] = nbi();
	          z.mulTo(g2,g[n-2],g[n]);
	          n += 2;
	        }
	      }
	
	      var j = e.t-1, w, is1 = true, r2 = nbi(), t;
	      i = nbits(e[j])-1;
	      while(j >= 0) {
	        if(i >= k1) w = (e[j]>>(i-k1))&km;
	        else {
	          w = (e[j]&((1<<(i+1))-1))<<(k1-i);
	          if(j > 0) w |= e[j-1]>>(this.DB+i-k1);
	        }
	
	        n = k;
	        while((w&1) == 0) { w >>= 1; --n; }
	        if((i -= n) < 0) { i += this.DB; --j; }
	        if(is1) {	// ret == 1, don't bother squaring or multiplying it
	          g[w].copyTo(r);
	          is1 = false;
	        }
	        else {
	          while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
	          if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
	          z.mulTo(r2,g[w],r);
	        }
	
	        while(j >= 0 && (e[j]&(1<<i)) == 0) {
	          z.sqrTo(r,r2); t = r; r = r2; r2 = t;
	          if(--i < 0) { i = this.DB-1; --j; }
	        }
	      }
	      return z.revert(r);
	    }
	
	    // (public) gcd(this,a) (HAC 14.54)
	    function bnGCD(a) {
	      var x = (this.s<0)?this.negate():this.clone();
	      var y = (a.s<0)?a.negate():a.clone();
	      if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
	      var i = x.getLowestSetBit(), g = y.getLowestSetBit();
	      if(g < 0) return x;
	      if(i < g) g = i;
	      if(g > 0) {
	        x.rShiftTo(g,x);
	        y.rShiftTo(g,y);
	      }
	      while(x.signum() > 0) {
	        if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
	        if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
	        if(x.compareTo(y) >= 0) {
	          x.subTo(y,x);
	          x.rShiftTo(1,x);
	        }
	        else {
	          y.subTo(x,y);
	          y.rShiftTo(1,y);
	        }
	      }
	      if(g > 0) y.lShiftTo(g,y);
	      return y;
	    }
	
	    // (protected) this % n, n < 2^26
	    function bnpModInt(n) {
	      if(n <= 0) return 0;
	      var d = this.DV%n, r = (this.s<0)?n-1:0;
	      if(this.t > 0)
	        if(d == 0) r = this[0]%n;
	        else for(var i = this.t-1; i >= 0; --i) r = (d*r+this[i])%n;
	      return r;
	    }
	
	    // (public) 1/this % m (HAC 14.61)
	    function bnModInverse(m) {
	      var ac = m.isEven();
	      if((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
	      var u = m.clone(), v = this.clone();
	      var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
	      while(u.signum() != 0) {
	        while(u.isEven()) {
	          u.rShiftTo(1,u);
	          if(ac) {
	            if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
	            a.rShiftTo(1,a);
	          }
	          else if(!b.isEven()) b.subTo(m,b);
	          b.rShiftTo(1,b);
	        }
	        while(v.isEven()) {
	          v.rShiftTo(1,v);
	          if(ac) {
	            if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
	            c.rShiftTo(1,c);
	          }
	          else if(!d.isEven()) d.subTo(m,d);
	          d.rShiftTo(1,d);
	        }
	        if(u.compareTo(v) >= 0) {
	          u.subTo(v,u);
	          if(ac) a.subTo(c,a);
	          b.subTo(d,b);
	        }
	        else {
	          v.subTo(u,v);
	          if(ac) c.subTo(a,c);
	          d.subTo(b,d);
	        }
	      }
	      if(v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
	      if(d.compareTo(m) >= 0) return d.subtract(m);
	      if(d.signum() < 0) d.addTo(m,d); else return d;
	      if(d.signum() < 0) return d.add(m); else return d;
	    }
	
	    var lowprimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997];
	    var lplim = (1<<26)/lowprimes[lowprimes.length-1];
	
	    // (public) test primality with certainty >= 1-.5^t
	    function bnIsProbablePrime(t) {
	      var i, x = this.abs();
	      if(x.t == 1 && x[0] <= lowprimes[lowprimes.length-1]) {
	        for(i = 0; i < lowprimes.length; ++i)
	          if(x[0] == lowprimes[i]) return true;
	        return false;
	      }
	      if(x.isEven()) return false;
	      i = 1;
	      while(i < lowprimes.length) {
	        var m = lowprimes[i], j = i+1;
	        while(j < lowprimes.length && m < lplim) m *= lowprimes[j++];
	        m = x.modInt(m);
	        while(i < j) if(m%lowprimes[i++] == 0) return false;
	      }
	      return x.millerRabin(t);
	    }
	
	    // (protected) true if probably prime (HAC 4.24, Miller-Rabin)
	    function bnpMillerRabin(t) {
	      var n1 = this.subtract(BigInteger.ONE);
	      var k = n1.getLowestSetBit();
	      if(k <= 0) return false;
	      var r = n1.shiftRight(k);
	      t = (t+1)>>1;
	      if(t > lowprimes.length) t = lowprimes.length;
	      var a = nbi();
	      for(var i = 0; i < t; ++i) {
	        //Pick bases at random, instead of starting at 2
	        a.fromInt(lowprimes[Math.floor(Math.random()*lowprimes.length)]);
	        var y = a.modPow(r,this);
	        if(y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
	          var j = 1;
	          while(j++ < k && y.compareTo(n1) != 0) {
	            y = y.modPowInt(2,this);
	            if(y.compareTo(BigInteger.ONE) == 0) return false;
	          }
	          if(y.compareTo(n1) != 0) return false;
	        }
	      }
	      return true;
	    }
	
	    // protected
	    BigInteger.prototype.chunkSize = bnpChunkSize;
	    BigInteger.prototype.toRadix = bnpToRadix;
	    BigInteger.prototype.fromRadix = bnpFromRadix;
	    BigInteger.prototype.fromNumber = bnpFromNumber;
	    BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
	    BigInteger.prototype.changeBit = bnpChangeBit;
	    BigInteger.prototype.addTo = bnpAddTo;
	    BigInteger.prototype.dMultiply = bnpDMultiply;
	    BigInteger.prototype.dAddOffset = bnpDAddOffset;
	    BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
	    BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
	    BigInteger.prototype.modInt = bnpModInt;
	    BigInteger.prototype.millerRabin = bnpMillerRabin;
	
	    // public
	    BigInteger.prototype.clone = bnClone;
	    BigInteger.prototype.intValue = bnIntValue;
	    BigInteger.prototype.byteValue = bnByteValue;
	    BigInteger.prototype.shortValue = bnShortValue;
	    BigInteger.prototype.signum = bnSigNum;
	    BigInteger.prototype.toByteArray = bnToByteArray;
	    BigInteger.prototype.equals = bnEquals;
	    BigInteger.prototype.min = bnMin;
	    BigInteger.prototype.max = bnMax;
	    BigInteger.prototype.and = bnAnd;
	    BigInteger.prototype.or = bnOr;
	    BigInteger.prototype.xor = bnXor;
	    BigInteger.prototype.andNot = bnAndNot;
	    BigInteger.prototype.not = bnNot;
	    BigInteger.prototype.shiftLeft = bnShiftLeft;
	    BigInteger.prototype.shiftRight = bnShiftRight;
	    BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
	    BigInteger.prototype.bitCount = bnBitCount;
	    BigInteger.prototype.testBit = bnTestBit;
	    BigInteger.prototype.setBit = bnSetBit;
	    BigInteger.prototype.clearBit = bnClearBit;
	    BigInteger.prototype.flipBit = bnFlipBit;
	    BigInteger.prototype.add = bnAdd;
	    BigInteger.prototype.subtract = bnSubtract;
	    BigInteger.prototype.multiply = bnMultiply;
	    BigInteger.prototype.divide = bnDivide;
	    BigInteger.prototype.remainder = bnRemainder;
	    BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
	    BigInteger.prototype.modPow = bnModPow;
	    BigInteger.prototype.modInverse = bnModInverse;
	    BigInteger.prototype.pow = bnPow;
	    BigInteger.prototype.gcd = bnGCD;
	    BigInteger.prototype.isProbablePrime = bnIsProbablePrime;
	
	    // JSBN-specific extension
	    BigInteger.prototype.square = bnSquare;
	
	    // Expose the Barrett function
	    BigInteger.prototype.Barrett = Barrett
	
	    // BigInteger interfaces not implemented in jsbn:
	
	    // BigInteger(int signum, byte[] magnitude)
	    // double doubleValue()
	    // float floatValue()
	    // int hashCode()
	    // long longValue()
	    // static BigInteger valueOf(long val)
	
		// Random number generator - requires a PRNG backend, e.g. prng4.js
	
		// For best results, put code like
		// <body onClick='rng_seed_time();' onKeyPress='rng_seed_time();'>
		// in your main HTML document.
	
		var rng_state;
		var rng_pool;
		var rng_pptr;
	
		// Mix in a 32-bit integer into the pool
		function rng_seed_int(x) {
		  rng_pool[rng_pptr++] ^= x & 255;
		  rng_pool[rng_pptr++] ^= (x >> 8) & 255;
		  rng_pool[rng_pptr++] ^= (x >> 16) & 255;
		  rng_pool[rng_pptr++] ^= (x >> 24) & 255;
		  if(rng_pptr >= rng_psize) rng_pptr -= rng_psize;
		}
	
		// Mix in the current time (w/milliseconds) into the pool
		function rng_seed_time() {
		  rng_seed_int(new Date().getTime());
		}
	
		// Initialize the pool with junk if needed.
		if(rng_pool == null) {
		  rng_pool = new Array();
		  rng_pptr = 0;
		  var t;
		  if(typeof window !== "undefined" && window.crypto) {
			if (window.crypto.getRandomValues) {
			  // Use webcrypto if available
			  var ua = new Uint8Array(32);
			  window.crypto.getRandomValues(ua);
			  for(t = 0; t < 32; ++t)
				rng_pool[rng_pptr++] = ua[t];
			}
			else if(navigator.appName == "Netscape" && navigator.appVersion < "5") {
			  // Extract entropy (256 bits) from NS4 RNG if available
			  var z = window.crypto.random(32);
			  for(t = 0; t < z.length; ++t)
				rng_pool[rng_pptr++] = z.charCodeAt(t) & 255;
			}
		  }
		  while(rng_pptr < rng_psize) {  // extract some randomness from Math.random()
			t = Math.floor(65536 * Math.random());
			rng_pool[rng_pptr++] = t >>> 8;
			rng_pool[rng_pptr++] = t & 255;
		  }
		  rng_pptr = 0;
		  rng_seed_time();
		  //rng_seed_int(window.screenX);
		  //rng_seed_int(window.screenY);
		}
	
		function rng_get_byte() {
		  if(rng_state == null) {
			rng_seed_time();
			rng_state = prng_newstate();
			rng_state.init(rng_pool);
			for(rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr)
			  rng_pool[rng_pptr] = 0;
			rng_pptr = 0;
			//rng_pool = null;
		  }
		  // TODO: allow reseeding after first request
		  return rng_state.next();
		}
	
		function rng_get_bytes(ba) {
		  var i;
		  for(i = 0; i < ba.length; ++i) ba[i] = rng_get_byte();
		}
	
		function SecureRandom() {}
	
		SecureRandom.prototype.nextBytes = rng_get_bytes;
	
		// prng4.js - uses Arcfour as a PRNG
	
		function Arcfour() {
		  this.i = 0;
		  this.j = 0;
		  this.S = new Array();
		}
	
		// Initialize arcfour context from key, an array of ints, each from [0..255]
		function ARC4init(key) {
		  var i, j, t;
		  for(i = 0; i < 256; ++i)
			this.S[i] = i;
		  j = 0;
		  for(i = 0; i < 256; ++i) {
			j = (j + this.S[i] + key[i % key.length]) & 255;
			t = this.S[i];
			this.S[i] = this.S[j];
			this.S[j] = t;
		  }
		  this.i = 0;
		  this.j = 0;
		}
	
		function ARC4next() {
		  var t;
		  this.i = (this.i + 1) & 255;
		  this.j = (this.j + this.S[this.i]) & 255;
		  t = this.S[this.i];
		  this.S[this.i] = this.S[this.j];
		  this.S[this.j] = t;
		  return this.S[(t + this.S[this.i]) & 255];
		}
	
		Arcfour.prototype.init = ARC4init;
		Arcfour.prototype.next = ARC4next;
	
		// Plug in your RNG constructor here
		function prng_newstate() {
		  return new Arcfour();
		}
	
		// Pool size must be a multiple of 4 and greater than 32.
		// An array of bytes the size of the pool will be passed to init()
		var rng_psize = 256;
	
	  BigInteger.SecureRandom = SecureRandom;
	  BigInteger.BigInteger = BigInteger;
	  if (true) {
	    exports = module.exports = BigInteger;
	  } else {
	    this.BigInteger = BigInteger;
	    this.SecureRandom = SecureRandom;
	  }
	
	}).call(this);


/***/ },
/* 41 */
/***/ function(module, exports) {

	function Agent() {
	  this._defaults = [];
	}
	
	["use", "on", "once", "set", "query", "type", "accept", "auth", "withCredentials", "sortQuery", "retry", "ok", "redirects",
	 "timeout", "buffer", "serialize", "parse", "ca", "key", "pfx", "cert"].forEach(function(fn) {
	  /** Default setting for all requests from this agent */
	  Agent.prototype[fn] = function(/*varargs*/) {
	    this._defaults.push({fn:fn, arguments:arguments});
	    return this;
	  }
	});
	
	Agent.prototype._setDefaults = function(req) {
	    this._defaults.forEach(function(def) {
	      req[def.fn].apply(req, def.arguments);
	    });
	};
	
	module.exports = Agent;


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/**
	 * Module of mixed-in functions shared between node and client code
	 */
	var isObject = __webpack_require__(22);
	
	/**
	 * Expose `RequestBase`.
	 */
	
	module.exports = RequestBase;
	
	/**
	 * Initialize a new `RequestBase`.
	 *
	 * @api public
	 */
	
	function RequestBase(obj) {
	  if (obj) return mixin(obj);
	}
	
	/**
	 * Mixin the prototype properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */
	
	function mixin(obj) {
	  for (var key in RequestBase.prototype) {
	    obj[key] = RequestBase.prototype[key];
	  }
	  return obj;
	}
	
	/**
	 * Clear previous timeout.
	 *
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.clearTimeout = function _clearTimeout(){
	  clearTimeout(this._timer);
	  clearTimeout(this._responseTimeoutTimer);
	  delete this._timer;
	  delete this._responseTimeoutTimer;
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
	
	RequestBase.prototype.parse = function parse(fn){
	  this._parser = fn;
	  return this;
	};
	
	/**
	 * Set format of binary response body.
	 * In browser valid formats are 'blob' and 'arraybuffer',
	 * which return Blob and ArrayBuffer, respectively.
	 *
	 * In Node all values result in Buffer.
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
	
	RequestBase.prototype.responseType = function(val){
	  this._responseType = val;
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
	
	RequestBase.prototype.serialize = function serialize(fn){
	  this._serializer = fn;
	  return this;
	};
	
	/**
	 * Set timeouts.
	 *
	 * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
	 * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
	 *
	 * Value of 0 or false means no timeout.
	 *
	 * @param {Number|Object} ms or {response, deadline}
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.timeout = function timeout(options){
	  if (!options || 'object' !== typeof options) {
	    this._timeout = options;
	    this._responseTimeout = 0;
	    return this;
	  }
	
	  for(var option in options) {
	    switch(option) {
	      case 'deadline':
	        this._timeout = options.deadline;
	        break;
	      case 'response':
	        this._responseTimeout = options.response;
	        break;
	      default:
	        console.warn("Unknown timeout option", option);
	    }
	  }
	  return this;
	};
	
	/**
	 * Set number of retry attempts on error.
	 *
	 * Failed requests will be retried 'count' times if timeout or err.code >= 500.
	 *
	 * @param {Number} count
	 * @param {Function} [fn]
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.retry = function retry(count, fn){
	  // Default to 1 if no count passed or true
	  if (arguments.length === 0 || count === true) count = 1;
	  if (count <= 0) count = 0;
	  this._maxRetries = count;
	  this._retries = 0;
	  this._retryCallback = fn;
	  return this;
	};
	
	var ERROR_CODES = [
	  'ECONNRESET',
	  'ETIMEDOUT',
	  'EADDRINFO',
	  'ESOCKETTIMEDOUT'
	];
	
	/**
	 * Determine if a request should be retried.
	 * (Borrowed from segmentio/superagent-retry)
	 *
	 * @param {Error} err
	 * @param {Response} [res]
	 * @returns {Boolean}
	 */
	RequestBase.prototype._shouldRetry = function(err, res) {
	  if (!this._maxRetries || this._retries++ >= this._maxRetries) {
	    return false;
	  }
	  if (this._retryCallback) {
	    try {
	      var override = this._retryCallback(err, res);
	      if (override === true) return true;
	      if (override === false) return false;
	      // undefined falls back to defaults
	    } catch(e) {
	      console.error(e);
	    }
	  }
	  if (res && res.status && res.status >= 500 && res.status != 501) return true;
	  if (err) {
	    if (err.code && ~ERROR_CODES.indexOf(err.code)) return true;
	    // Superagent timeout
	    if (err.timeout && err.code == 'ECONNABORTED') return true;
	    if (err.crossDomain) return true;
	  }
	  return false;
	};
	
	/**
	 * Retry request
	 *
	 * @return {Request} for chaining
	 * @api private
	 */
	
	RequestBase.prototype._retry = function() {
	
	  this.clearTimeout();
	
	  // node
	  if (this.req) {
	    this.req = null;
	    this.req = this.request();
	  }
	
	  this._aborted = false;
	  this.timedout = false;
	
	  return this._end();
	};
	
	/**
	 * Promise support
	 *
	 * @param {Function} resolve
	 * @param {Function} [reject]
	 * @return {Request}
	 */
	
	RequestBase.prototype.then = function then(resolve, reject) {
	  if (!this._fullfilledPromise) {
	    var self = this;
	    if (this._endCalled) {
	      console.warn("Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises");
	    }
	    this._fullfilledPromise = new Promise(function(innerResolve, innerReject) {
	      self.end(function(err, res) {
	        if (err) innerReject(err);
	        else innerResolve(res);
	      });
	    });
	  }
	  return this._fullfilledPromise.then(resolve, reject);
	};
	
	RequestBase.prototype.catch = function(cb) {
	  return this.then(undefined, cb);
	};
	
	/**
	 * Allow for extension
	 */
	
	RequestBase.prototype.use = function use(fn) {
	  fn(this);
	  return this;
	};
	
	RequestBase.prototype.ok = function(cb) {
	  if ('function' !== typeof cb) throw Error("Callback required");
	  this._okCallback = cb;
	  return this;
	};
	
	RequestBase.prototype._isResponseOK = function(res) {
	  if (!res) {
	    return false;
	  }
	
	  if (this._okCallback) {
	    return this._okCallback(res);
	  }
	
	  return res.status >= 200 && res.status < 300;
	};
	
	/**
	 * Get request header `field`.
	 * Case-insensitive.
	 *
	 * @param {String} field
	 * @return {String}
	 * @api public
	 */
	
	RequestBase.prototype.get = function(field){
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
	
	RequestBase.prototype.getHeader = RequestBase.prototype.get;
	
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
	
	RequestBase.prototype.set = function(field, val){
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
	RequestBase.prototype.unset = function(field){
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
	RequestBase.prototype.field = function(name, val) {
	  // name should be either a string or an object.
	  if (null === name || undefined === name) {
	    throw new Error('.field(name, val) name can not be empty');
	  }
	
	  if (this._data) {
	    console.error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
	  }
	
	  if (isObject(name)) {
	    for (var key in name) {
	      this.field(key, name[key]);
	    }
	    return this;
	  }
	
	  if (Array.isArray(val)) {
	    for (var i in val) {
	      this.field(name, val[i]);
	    }
	    return this;
	  }
	
	  // val should be defined now
	  if (null === val || undefined === val) {
	    throw new Error('.field(name, val) val can not be empty');
	  }
	  if ('boolean' === typeof val) {
	    val = '' + val;
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
	RequestBase.prototype.abort = function(){
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
	
	RequestBase.prototype._auth = function(user, pass, options, base64Encoder) {
	  switch (options.type) {
	    case 'basic':
	      this.set('Authorization', 'Basic ' + base64Encoder(user + ':' + pass));
	      break;
	
	    case 'auto':
	      this.username = user;
	      this.password = pass;
	      break;
	
	    case 'bearer': // usage would be .auth(accessToken, { type: 'bearer' })
	      this.set('Authorization', 'Bearer ' + user);
	      break;
	  }
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
	
	RequestBase.prototype.withCredentials = function(on) {
	  // This is browser-only functionality. Node side is no-op.
	  if (on == undefined) on = true;
	  this._withCredentials = on;
	  return this;
	};
	
	/**
	 * Set the max redirects to `n`. Does noting in browser XHR implementation.
	 *
	 * @param {Number} n
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.redirects = function(n){
	  this._maxRedirects = n;
	  return this;
	};
	
	/**
	 * Maximum size of buffered response body, in bytes. Counts uncompressed size.
	 * Default 200MB.
	 *
	 * @param {Number} n
	 * @return {Request} for chaining
	 */
	RequestBase.prototype.maxResponseSize = function(n){
	  if ('number' !== typeof n) {
	    throw TypeError("Invalid argument");
	  }
	  this._maxResponseSize = n;
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
	
	RequestBase.prototype.toJSON = function() {
	  return {
	    method: this.method,
	    url: this.url,
	    data: this._data,
	    headers: this._header,
	  };
	};
	
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
	
	RequestBase.prototype.send = function(data){
	  var isObj = isObject(data);
	  var type = this._header['content-type'];
	
	  if (this._formData) {
	    console.error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
	  }
	
	  if (isObj && !this._data) {
	    if (Array.isArray(data)) {
	      this._data = [];
	    } else if (!this._isHost(data)) {
	      this._data = {};
	    }
	  } else if (data && this._data && this._isHost(this._data)) {
	    throw Error("Can't merge these send calls");
	  }
	
	  // merge
	  if (isObj && isObject(this._data)) {
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
	
	  if (!isObj || this._isHost(data)) {
	    return this;
	  }
	
	  // default to json
	  if (!type) this.type('json');
	  return this;
	};
	
	/**
	 * Sort `querystring` by the sort function
	 *
	 *
	 * Examples:
	 *
	 *       // default order
	 *       request.get('/user')
	 *         .query('name=Nick')
	 *         .query('search=Manny')
	 *         .sortQuery()
	 *         .end(callback)
	 *
	 *       // customized sort function
	 *       request.get('/user')
	 *         .query('name=Nick')
	 *         .query('search=Manny')
	 *         .sortQuery(function(a, b){
	 *           return a.length - b.length;
	 *         })
	 *         .end(callback)
	 *
	 *
	 * @param {Function} sort
	 * @return {Request} for chaining
	 * @api public
	 */
	
	RequestBase.prototype.sortQuery = function(sort) {
	  // _sort default to true but otherwise can be a function or boolean
	  this._sort = typeof sort === 'undefined' ? true : sort;
	  return this;
	};
	
	/**
	 * Compose querystring to append to req.url
	 *
	 * @api private
	 */
	RequestBase.prototype._finalizeQueryString = function(){
	  var query = this._query.join('&');
	  if (query) {
	    this.url += (this.url.indexOf('?') >= 0 ? '&' : '?') + query;
	  }
	  this._query.length = 0; // Makes the call idempotent
	
	  if (this._sort) {
	    var index = this.url.indexOf('?');
	    if (index >= 0) {
	      var queryArr = this.url.substring(index + 1).split('&');
	      if ('function' === typeof this._sort) {
	        queryArr.sort(this._sort);
	      } else {
	        queryArr.sort();
	      }
	      this.url = this.url.substring(0, index) + '?' + queryArr.join('&');
	    }
	  }
	};
	
	// For backwards compat only
	RequestBase.prototype._appendQueryString = function() {console.trace("Unsupported");}
	
	/**
	 * Invoke callback with timeout error.
	 *
	 * @api private
	 */
	
	RequestBase.prototype._timeoutError = function(reason, timeout, errno){
	  if (this._aborted) {
	    return;
	  }
	  var err = new Error(reason + timeout + 'ms exceeded');
	  err.timeout = timeout;
	  err.code = 'ECONNABORTED';
	  err.errno = errno;
	  this.timedout = true;
	  this.abort();
	  this.callback(err);
	};
	
	RequestBase.prototype._setTimeouts = function() {
	  var self = this;
	
	  // deadline
	  if (this._timeout && !this._timer) {
	    this._timer = setTimeout(function(){
	      self._timeoutError('Timeout of ', self._timeout, 'ETIME');
	    }, this._timeout);
	  }
	  // response timeout
	  if (this._responseTimeout && !this._responseTimeoutTimer) {
	    this._responseTimeoutTimer = setTimeout(function(){
	      self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
	    }, this._responseTimeout);
	  }
	};


/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/**
	 * Module dependencies.
	 */
	
	var utils = __webpack_require__(44);
	
	/**
	 * Expose `ResponseBase`.
	 */
	
	module.exports = ResponseBase;
	
	/**
	 * Initialize a new `ResponseBase`.
	 *
	 * @api public
	 */
	
	function ResponseBase(obj) {
	  if (obj) return mixin(obj);
	}
	
	/**
	 * Mixin the prototype properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */
	
	function mixin(obj) {
	  for (var key in ResponseBase.prototype) {
	    obj[key] = ResponseBase.prototype[key];
	  }
	  return obj;
	}
	
	/**
	 * Get case-insensitive `field` value.
	 *
	 * @param {String} field
	 * @return {String}
	 * @api public
	 */
	
	ResponseBase.prototype.get = function(field) {
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
	
	ResponseBase.prototype._setHeaderProperties = function(header){
	    // TODO: moar!
	    // TODO: make this a util
	
	    // content-type
	    var ct = header['content-type'] || '';
	    this.type = utils.type(ct);
	
	    // params
	    var params = utils.params(ct);
	    for (var key in params) this[key] = params[key];
	
	    this.links = {};
	
	    // links
	    try {
	        if (header.link) {
	            this.links = utils.parseLinks(header.link);
	        }
	    } catch (err) {
	        // ignore
	    }
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
	
	ResponseBase.prototype._setStatusProperties = function(status){
	    var type = status / 100 | 0;
	
	    // status / class
	    this.status = this.statusCode = status;
	    this.statusType = type;
	
	    // basics
	    this.info = 1 == type;
	    this.ok = 2 == type;
	    this.redirect = 3 == type;
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
	    this.forbidden = 403 == status;
	    this.notFound = 404 == status;
	};


/***/ },
/* 44 */
/***/ function(module, exports) {

	'use strict';
	
	/**
	 * Return the mime type for the given `str`.
	 *
	 * @param {String} str
	 * @return {String}
	 * @api private
	 */
	
	exports.type = function(str){
	  return str.split(/ *; */).shift();
	};
	
	/**
	 * Return header field parameters.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */
	
	exports.params = function(str){
	  return str.split(/ *; */).reduce(function(obj, str){
	    var parts = str.split(/ *= */);
	    var key = parts.shift();
	    var val = parts.shift();
	
	    if (key && val) obj[key] = val;
	    return obj;
	  }, {});
	};
	
	/**
	 * Parse Link header fields.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */
	
	exports.parseLinks = function(str){
	  return str.split(/ *, */).reduce(function(obj, str){
	    var parts = str.split(/ *; */);
	    var url = parts[0].slice(1, -1);
	    var rel = parts[1].split(/ *= */)[1].slice(1, -1);
	    obj[rel] = url;
	    return obj;
	  }, {});
	};
	
	/**
	 * Strip content related fields from `header`.
	 *
	 * @param {Object} header
	 * @return {Object} header
	 * @api private
	 */
	
	exports.cleanHeader = function(header, changesOrigin){
	  delete header['content-type'];
	  delete header['content-length'];
	  delete header['transfer-encoding'];
	  delete header['host'];
	  // secuirty
	  if (changesOrigin) {
	    delete header['authorization'];
	    delete header['cookie'];
	  }
	  return header;
	};


/***/ },
/* 45 */,
/* 46 */,
/* 47 */,
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(3);
	
	var objectHelper = __webpack_require__(1);
	var assert = __webpack_require__(4);
	var responseHandler = __webpack_require__(5);
	
	function DBConnection(request, options) {
	  this.baseOptions = options;
	  this.request = request;
	}
	
	/**
	 * @callback signUpCallback
	 * @param {Error} [err] error returned by Auth0 with the reason why the signup failed
	 * @param {Object} [result] result of the signup request
	 * @param {Object} result.email user's email
	 * @param {Object} result.emailVerified if the user's email was verified
	 */
	
	/**
	 * Creates a new user in a Auth0 Database connection
	 *
	 * @method signup
	 * @param {Object} options
	 * @param {String} options.email user email address
	 * @param {String} options.password user password
	 * @param {String} options.connection name of the connection where the user will be created
	 * @param {Object} [options.userMetadata] additional signup attributes used for creating the user. Will be stored in `user_metadata`
	 * @param {signUpCallback} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#signup}
	 */
	DBConnection.prototype.signup = function(options, cb) {
	  var url;
	  var body;
	  var metadata;
	
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      connection: { type: 'string', message: 'connection option is required' },
	      email: { type: 'string', message: 'email option is required' },
	      password: { type: 'string', message: 'password option is required' }
	    }
	  );
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'dbconnections', 'signup');
	
	  body = objectHelper.merge(this.baseOptions, ['clientID']).with(options);
	
	  metadata = body.user_metadata || body.userMetadata;
	
	  body = objectHelper.blacklist(body, ['scope', 'userMetadata', 'user_metadata']);
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	
	  if (metadata) {
	    body.user_metadata = metadata;
	  }
	
	  return this.request.post(url).send(body).end(responseHandler(cb));
	};
	
	/**
	 * @callback changePasswordCallback
	 * @param {Error} [err] error returned by Auth0 with the reason why the request failed
	 */
	
	/**
	 * Request an email with instruction to change a user's password
	 *
	 * @method changePassword
	 * @param {Object} options
	 * @param {String} options.email address where the user will receive the change password email. It should match the user's email in Auth0
	 * @param {String} options.connection name of the connection where the user was created
	 * @param {changePasswordCallback} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#change-password}
	 */
	DBConnection.prototype.changePassword = function(options, cb) {
	  var url;
	  var body;
	
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      connection: { type: 'string', message: 'connection option is required' },
	      email: { type: 'string', message: 'email option is required' }
	    }
	  );
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'dbconnections', 'change_password');
	
	  body = objectHelper.merge(this.baseOptions, ['clientID']).with(options, ['email', 'connection']);
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	
	  return this.request.post(url).send(body).end(responseHandler(cb));
	};
	
	module.exports = DBConnection;


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(3);
	
	var objectHelper = __webpack_require__(1);
	var assert = __webpack_require__(4);
	var qs = __webpack_require__(6);
	var responseHandler = __webpack_require__(5);
	
	function PasswordlessAuthentication(request, options) {
	  this.baseOptions = options;
	  this.request = request;
	}
	
	PasswordlessAuthentication.prototype.buildVerifyUrl = function(options) {
	  var params;
	  var qString;
	
	  /* eslint-disable */
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      connection: { type: 'string', message: 'connection option is required' },
	      verificationCode: { type: 'string', message: 'verificationCode option is required' },
	      phoneNumber: {
	        optional: false,
	        type: 'string',
	        message: 'phoneNumber option is required',
	        condition: function(o) {
	          return !o.email;
	        }
	      },
	      email: {
	        optional: false,
	        type: 'string',
	        message: 'email option is required',
	        condition: function(o) {
	          return !o.phoneNumber;
	        }
	      }
	    }
	  );
	  /* eslint-enable */
	
	  params = objectHelper
	    .merge(this.baseOptions, [
	      'clientID',
	      'responseType',
	      'responseMode',
	      'redirectUri',
	      'scope',
	      'audience',
	      '_csrf',
	      'state',
	      '_intstate',
	      'protocol',
	      'nonce'
	    ])
	    .with(options);
	
	  // eslint-disable-next-line
	  if (this.baseOptions._sendTelemetry) {
	    params.auth0Client = this.request.getTelemetryData();
	  }
	
	  params = objectHelper.toSnakeCase(params, ['auth0Client']);
	
	  qString = qs.stringify(params);
	
	  return urljoin(this.baseOptions.rootUrl, 'passwordless', 'verify_redirect', '?' + qString);
	};
	
	PasswordlessAuthentication.prototype.start = function(options, cb) {
	  var url;
	  var body;
	
	  /* eslint-disable */
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      connection: { type: 'string', message: 'connection option is required' },
	      send: {
	        type: 'string',
	        message: 'send option is required',
	        values: ['link', 'code'],
	        value_message: 'send is not valid ([link, code])'
	      },
	      phoneNumber: {
	        optional: true,
	        type: 'string',
	        message: 'phoneNumber option is required',
	        condition: function(o) {
	          return o.send === 'code' || !o.email;
	        }
	      },
	      email: {
	        optional: true,
	        type: 'string',
	        message: 'email option is required',
	        condition: function(o) {
	          return o.send === 'link' || !o.phoneNumber;
	        }
	      },
	      authParams: { optional: true, type: 'object', message: 'authParams option is required' }
	    }
	  );
	  /* eslint-enable */
	
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'start');
	
	  body = objectHelper
	    .merge(this.baseOptions, ['clientID', 'responseType', 'redirectUri', 'scope'])
	    .with(options);
	
	  if (body.scope) {
	    body.authParams = body.authParams || {};
	    body.authParams.scope = body.scope;
	  }
	
	  if (body.redirectUri) {
	    body.authParams = body.authParams || {};
	    body.authParams.redirect_uri = body.redirectUri;
	  }
	
	  if (body.responseType) {
	    body.authParams = body.authParams || {};
	    body.authParams.response_type = body.responseType;
	  }
	
	  delete body.redirectUri;
	  delete body.responseType;
	  delete body.scope;
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client', 'authParams']);
	
	  return this.request.post(url).send(body).end(responseHandler(cb));
	};
	
	PasswordlessAuthentication.prototype.verify = function(options, cb) {
	  var url;
	  var cleanOption;
	
	  /* eslint-disable */
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      connection: { type: 'string', message: 'connection option is required' },
	      verificationCode: { type: 'string', message: 'verificationCode option is required' },
	      phoneNumber: {
	        optional: false,
	        type: 'string',
	        message: 'phoneNumber option is required',
	        condition: function(o) {
	          return !o.email;
	        }
	      },
	      email: {
	        optional: false,
	        type: 'string',
	        message: 'email option is required',
	        condition: function(o) {
	          return !o.phoneNumber;
	        }
	      }
	    }
	  );
	  /* eslint-enable */
	
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  cleanOption = objectHelper.pick(options, [
	    'connection',
	    'verificationCode',
	    'phoneNumber',
	    'email',
	    'auth0Client'
	  ]);
	  cleanOption = objectHelper.toSnakeCase(cleanOption, ['auth0Client']);
	
	  url = urljoin(this.baseOptions.rootUrl, 'passwordless', 'verify');
	
	  return this.request.post(url).send(cleanOption).end(responseHandler(cb));
	};
	
	module.exports = PasswordlessAuthentication;


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	var windowHandler = __webpack_require__(2);
	var base64Url = __webpack_require__(25);
	
	function create(name, value, days) {
	  var date;
	  var expires;
	
	  if (
	    windowHandler.getDocument().cookie === undefined ||
	    windowHandler.getDocument().cookie === null
	  ) {
	    throw new Error('cookie storage not available');
	  }
	
	  if (days) {
	    var timeToExpire = days * 24 * 60 * 60 * 1000;
	    date = new Date();
	    date.setTime(date.getTime() + timeToExpire);
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
	
	  if (
	    windowHandler.getDocument().cookie === undefined ||
	    windowHandler.getDocument().cookie === null
	  ) {
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
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	var objectHelper = __webpack_require__(1);
	
	var tokenParams = [
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
	
	var authorizeParams = [
	  // auth0
	  'connection',
	  'connection_scope',
	  'auth0Client',
	  'owp',
	  'device',
	  'realm',
	
	  'protocol',
	  '_csrf',
	  '_intstate',
	  'login_ticket',
	
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
	
	function oauthAuthorizeParams(warn, params) {
	  var notAllowed = objectHelper.getKeysNotIn(params, authorizeParams);
	
	  if (notAllowed.length > 0) {
	    warn.warning(
	      'Following parameters are not allowed on the `/authorize` endpoint: [' +
	        notAllowed.join(',') +
	        ']'
	    );
	  }
	
	  return params;
	}
	
	function oauthTokenParams(warn, params) {
	  return objectHelper.pick(params, tokenParams);
	}
	
	module.exports = {
	  oauthTokenParams: oauthTokenParams,
	  oauthAuthorizeParams: oauthAuthorizeParams
	};


/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	var version = __webpack_require__(10);
	
	function PluginHandler(webAuth, plugins) {
	  this.plugins = plugins;
	
	  for (var a = 0; a < this.plugins.length; a++) {
	    if (this.plugins[a].version !== version.raw) {
	      var pluginName = '';
	
	      if (this.plugins[a].constructor && this.plugins[a].constructor.name) {
	        pluginName = this.plugins[a].constructor.name;
	      }
	
	      throw new Error(
	        'Plugin ' +
	          pluginName +
	          ' version (' +
	          this.plugins[a].version +
	          ') ' +
	          'is not compatible with the SDK version (' +
	          version.raw +
	          ')'
	      );
	    }
	
	    this.plugins[a].setWebAuth(webAuth);
	  }
	}
	
	PluginHandler.prototype.get = function(extensibilityPoint) {
	  for (var a = 0; a < this.plugins.length; a++) {
	    if (this.plugins[a].supports(extensibilityPoint)) {
	      return this.plugins[a].init();
	    }
	  }
	
	  return null;
	};
	
	module.exports = PluginHandler;


/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	/* eslint-disable no-restricted-syntax */
	/* eslint-disable guard-for-in */
	var WinChan = __webpack_require__(23);
	
	var windowHandler = __webpack_require__(2);
	var objectHelper = __webpack_require__(1);
	var qs = __webpack_require__(6);
	
	function PopupHandler() {
	  this._current_popup = null;
	}
	
	PopupHandler.prototype.calculatePosition = function(options) {
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
	
	  var left = (outerWidth - width) / 2;
	  var top = (outerHeight - height) / 2;
	
	  return { width: width, height: height, left: screenX + left, top: screenY + top };
	};
	
	PopupHandler.prototype.preload = function(options) {
	  var _this = this;
	  var _window = windowHandler.getWindow();
	  var popupPosition = this.calculatePosition(options.popupOptions || {});
	  var popupOptions = objectHelper.merge(popupPosition).with(options.popupOptions);
	  var url = options.url || 'about:blank';
	  var windowFeatures = qs.stringify(popupOptions, {
	    encode: false,
	    delimiter: ','
	  });
	
	  if (this._current_popup && !this._current_popup.closed) {
	    return this._current_popup;
	  }
	
	  this._current_popup = _window.open(url, 'auth0_signup_popup', windowFeatures);
	
	  this._current_popup.kill = function() {
	    this.close();
	    _this._current_popup = null;
	  };
	
	  return this._current_popup;
	};
	
	PopupHandler.prototype.load = function(url, relayUrl, options, cb) {
	  var _this = this;
	  var popupPosition = this.calculatePosition(options.popupOptions || {});
	  var popupOptions = objectHelper.merge(popupPosition).with(options.popupOptions);
	
	  var winchanOptions = objectHelper
	    .merge({
	      url: url,
	      relay_url: relayUrl,
	      window_features: qs.stringify(popupOptions, {
	        delimiter: ',',
	        encode: false
	      }),
	      popup: this._current_popup
	    })
	    .with(options);
	
	  var popup = WinChan.open(winchanOptions, function(err, data) {
	    _this._current_popup = null;
	    return cb(err, data);
	  });
	
	  popup.focus();
	
	  return popup;
	};
	
	module.exports = PopupHandler;


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	var windowHelper = __webpack_require__(2);
	
	function randomString(length) {
	  // eslint-disable-next-line
	  var bytes = new Uint8Array(length);
	  var result = [];
	  var charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';
	
	  var cryptoObj = windowHelper.getWindow().crypto || windowHelper.getWindow().msCrypto;
	  if (!cryptoObj) {
	    return null;
	  }
	
	  var random = cryptoObj.getRandomValues(bytes);
	
	  for (var a = 0; a < random.length; a++) {
	    result.push(charset[random[a] % charset.length]);
	  }
	
	  return result.join('');
	}
	
	module.exports = {
	  randomString: randomString
	};


/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	var cookies = __webpack_require__(50);
	
	function CookieStorage() {}
	
	CookieStorage.prototype.getItem = function(key) {
	  return cookies.read(key);
	};
	
	CookieStorage.prototype.removeItem = function(key) {
	  cookies.erase(key);
	};
	
	CookieStorage.prototype.setItem = function(key, value) {
	  cookies.create(key, value, 1);
	};
	
	module.exports = CookieStorage;


/***/ },
/* 56 */
/***/ function(module, exports) {

	function DummyStorage() {}
	
	DummyStorage.prototype.getItem = function() {
	  return null;
	};
	
	DummyStorage.prototype.removeItem = function() {};
	
	DummyStorage.prototype.setItem = function() {};
	
	module.exports = DummyStorage;


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	var windowHandler = __webpack_require__(2);
	var DummyStorage = __webpack_require__(56);
	var CookieStorage = __webpack_require__(55);
	var Warn = __webpack_require__(7);
	
	function StorageHandler() {
	  this.warn = new Warn({});
	  this.storage = new CookieStorage();
	  try {
	    // some browsers throw an error when trying to access localStorage
	    // when localStorage is disabled.
	    this.storage = windowHandler.getWindow().localStorage;
	  } catch (e) {
	    this.warn.warning(e);
	    this.warn.warning("Can't use localStorage. Using CookieStorage instead.");
	  }
	}
	
	StorageHandler.prototype.failover = function() {
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
	
	StorageHandler.prototype.getItem = function(key) {
	  try {
	    return this.storage.getItem(key);
	  } catch (e) {
	    this.warn.warning(e);
	    this.failover();
	    return this.getItem(key);
	  }
	};
	
	StorageHandler.prototype.removeItem = function(key) {
	  try {
	    return this.storage.removeItem(key);
	  } catch (e) {
	    this.warn.warning(e);
	    this.failover();
	    return this.removeItem(key);
	  }
	};
	
	StorageHandler.prototype.setItem = function(key, value) {
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
/* 58 */
/***/ function(module, exports) {

	// given a URL, extract the origin. Taken from: https://github.com/firebase/firebase-simple-login/blob/d2cb95b9f812d8488bdbfba51c3a7c153ba1a074/js/src/simple-login/transports/WinChan.js#L25-L30
	function extractOrigin(url) {
	  if (!/^https?:\/\//.test(url)) url = window.location.href;
	  var m = /^(https?:\/\/[-_a-zA-Z.0-9:]+)/.exec(url);
	  if (m) return m[1];
	  return url;
	}
	
	module.exports = {
	  extractOrigin: extractOrigin
	};


/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	var Authentication = __webpack_require__(24);
	var Management = __webpack_require__(60);
	var WebAuth = __webpack_require__(30);
	var version = __webpack_require__(10);
	
	module.exports = {
	  Authentication: Authentication,
	  Management: Management,
	  WebAuth: WebAuth,
	  version: version.raw
	};


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(3);
	
	var RequestBuilder = __webpack_require__(11);
	var assert = __webpack_require__(4);
	var responseHandler = __webpack_require__(5);
	
	/**
	 * Auth0 Management API Client (methods allowed to be called from the browser only)
	 * @constructor
	 * @param {Object} options
	 * @param {Object} options.domain your Auth0 acount domain
	 * @param {Object} options.token a valid API token
	 */
	function Management(options) {
	  /* eslint-disable */
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      domain: { type: 'string', message: 'domain option is required' },
	      token: { type: 'string', message: 'token option is required' },
	      _sendTelemetry: {
	        optional: true,
	        type: 'boolean',
	        message: '_sendTelemetry option is not valid'
	      },
	      _telemetryInfo: {
	        optional: true,
	        type: 'object',
	        message: '_telemetryInfo option is not valid'
	      }
	    }
	  );
	  /* eslint-enable */
	
	  this.baseOptions = options;
	
	  this.baseOptions.headers = { Authorization: 'Bearer ' + this.baseOptions.token };
	
	  this.request = new RequestBuilder(this.baseOptions);
	  this.baseOptions.rootUrl = urljoin('https://' + this.baseOptions.domain, 'api', 'v2');
	}
	
	/**
	 * @callback userCallback
	 * @param {Error} [err] failure reason for the failed request to Management API
	 * @param {Object} [result] user profile
	 */
	
	/**
	 * Returns the user profile
	 *
	 * @method getUser
	 * @param {String} userId identifier of the user to retrieve
	 * @param {userCallback} cb
	 * @see https://auth0.com/docs/api/management/v2#!/Users/get_users_by_id
	 */
	Management.prototype.getUser = function(userId, cb) {
	  var url;
	
	  assert.check(userId, { type: 'string', message: 'userId parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'users', userId);
	
	  return this.request.get(url).end(responseHandler(cb, { ignoreCasing: true }));
	};
	
	/**
	 * Updates the user metdata. It will patch the user metdata with the attributes sent.
	 *
	 *
	 * @method patchUserMetadata
	 * @param {String} userId
	 * @param {Object} userMetadata
	 * @param {userCallback} cb
	 * @see   {@link https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id}
	 */
	Management.prototype.patchUserMetadata = function(userId, userMetadata, cb) {
	  var url;
	
	  assert.check(userId, { type: 'string', message: 'userId parameter is not valid' });
	  assert.check(userMetadata, { type: 'object', message: 'userMetadata parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	
	  url = urljoin(this.baseOptions.rootUrl, 'users', userId);
	
	  return this.request
	    .patch(url)
	    .send({ user_metadata: userMetadata })
	    .end(responseHandler(cb, { ignoreCasing: true }));
	};
	
	/**
	 * Link two users
	 *
	 * @method linkUser
	 * @param {String} userId
	 * @param {String} secondaryUserToken
	 * @param {userCallback} cb
	 * @see   {@link https://auth0.com/docs/api/management/v2#!/Users/post_identities}
	 */
	Management.prototype.linkUser = function(userId, secondaryUserToken, cb) {
	  var url;
	  /* eslint-disable */
	  assert.check(userId, { type: 'string', message: 'userId parameter is not valid' });
	  assert.check(secondaryUserToken, {
	    type: 'string',
	    message: 'secondaryUserToken parameter is not valid'
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	  /* eslint-enable */
	
	  url = urljoin(this.baseOptions.rootUrl, 'users', userId, 'identities');
	
	  return this.request
	    .post(url)
	    .send({ link_with: secondaryUserToken })
	    .end(responseHandler(cb, { ignoreCasing: true }));
	};
	
	module.exports = Management;


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	var UsernamePassword = __webpack_require__(65);
	var objectHelper = __webpack_require__(1);
	var windowHelper = __webpack_require__(2);
	var Warn = __webpack_require__(7);
	var assert = __webpack_require__(4);
	
	function HostedPages(client, options) {
	  this.baseOptions = options;
	  this.client = client;
	
	  this.warn = new Warn({
	    disableWarnings: !!options._disableDeprecationWarnings
	  });
	}
	
	/**
	 * @callback credentialsCallback
	 * @param {Error} [err] error returned by Auth0 with the reason of the Auth failure
	 * @param {Object} [result] result of the AuthN request
	 * @param {String} result.accessToken token that can be used with {@link userinfo}
	 * @param {String} [result.idToken] token that identifies the user
	 * @param {String} [result.refreshToken] token that can be used to get new access tokens from Auth0. Note that not all clients can request them or the resource server might not allow them.
	 */
	
	/**
	 * Performs authentication with username/email and password with a database connection
	 *
	 * This method is not compatible with API Auth so if you need to fetch API tokens with audience
	 * you should use {@link authorize} or {@link login}.
	 *
	 * @method loginWithCredentials
	 * @param {Object} options
	 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} [options.responseType] type of the response used. It can be any of the values `code` and `token`
	 * @param {String} [options.responseMode] how the AuthN response is encoded and redirected back to the client. Supported values are `query` and `fragment`
	 * @param {String} [options.scope] scopes to be requested during AuthN. e.g. `openid email`
	 * @param {credentialsCallback} cb
	 */
	HostedPages.prototype.login = function(options, cb) {
	  if (windowHelper.getWindow().location.host !== this.baseOptions.domain) {
	    throw new Error('This method is meant to be used only inside the Universal Login Page.');
	  }
	  var usernamePassword;
	
	  var params = objectHelper
	    .merge(this.baseOptions, [
	      'clientID',
	      'redirectUri',
	      'tenant',
	      'responseType',
	      'responseMode',
	      'scope',
	      'audience',
	      '_csrf',
	      'state',
	      '_intstate',
	      'nonce'
	    ])
	    .with(options);
	
	  assert.check(
	    params,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      responseType: { type: 'string', message: 'responseType option is required' }
	    }
	  );
	
	  usernamePassword = new UsernamePassword(this.baseOptions);
	  return usernamePassword.login(params, function(err, data) {
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
	 * @param {Object} options
	 * @param {String} options.email user email address
	 * @param {String} options.password user password
	 * @param {String} options.connection name of the connection where the user will be created
	 * @param {credentialsCallback} cb
	 */
	HostedPages.prototype.signupAndLogin = function(options, cb) {
	  var _this = this;
	  return _this.client.client.dbConnection.signup(options, function(err) {
	    if (err) {
	      return cb(err);
	    }
	    return _this.login(options, cb);
	  });
	};
	
	module.exports = HostedPages;


/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(3);
	var WinChan = __webpack_require__(23);
	
	var urlHelper = __webpack_require__(58);
	var assert = __webpack_require__(4);
	var responseHandler = __webpack_require__(5);
	var PopupHandler = __webpack_require__(53);
	var objectHelper = __webpack_require__(1);
	var windowHelper = __webpack_require__(2);
	var Warn = __webpack_require__(7);
	var TransactionManager = __webpack_require__(17);
	var CrossOriginAuthentication = __webpack_require__(16);
	
	function Popup(webAuth, options) {
	  this.baseOptions = options;
	  this.baseOptions.popupOrigin = options.popupOrigin;
	  this.client = webAuth.client;
	  this.webAuth = webAuth;
	
	  this.transactionManager = new TransactionManager(this.baseOptions.transaction);
	  this.crossOriginAuthentication = new CrossOriginAuthentication(webAuth, this.baseOptions);
	  this.warn = new Warn({
	    disableWarnings: !!options._disableDeprecationWarnings
	  });
	}
	
	/**
	 * Returns a new instance of the popup handler
	 *
	 * @method buildPopupHandler
	 * @private
	 */
	Popup.prototype.buildPopupHandler = function() {
	  var pluginHandler = this.baseOptions.plugins.get('popup.getPopupHandler');
	
	  if (pluginHandler) {
	    return pluginHandler.getPopupHandler();
	  }
	
	  return new PopupHandler();
	};
	
	/**
	 * Initializes the popup window and returns the instance to be used later in order to avoid being blocked by the browser.
	 *
	 * @method preload
	 * @param {Object} options receives the window height and width and any other window feature to be sent to window.open
	 */
	Popup.prototype.preload = function(options) {
	  options = options || {};
	
	  var popup = this.buildPopupHandler();
	
	  popup.preload(options);
	  return popup;
	};
	
	/**
	 * Internal use.
	 *
	 * @method getPopupHandler
	 * @private
	 */
	Popup.prototype.getPopupHandler = function(options, preload) {
	  if (options.popupHandler) {
	    return options.popupHandler;
	  }
	
	  if (preload) {
	    return this.preload(options);
	  }
	
	  return this.buildPopupHandler();
	};
	
	/**
	 * Handles the popup logic for the callback page.
	 *
	 * @method callback
	 * @param {Object} options
	 * @param {String} options.hash the url hash. If not provided it will extract from window.location.hash
	 * @param {String} [options.state] value originally sent in `state` parameter to {@link authorize} to mitigate XSRF
	 * @param {String} [options.nonce] value originally sent in `nonce` parameter to {@link authorize} to prevent replay attacks
	 * @see   {@link parseHash}
	 */
	Popup.prototype.callback = function(options) {
	  var _this = this;
	  var theWindow = windowHelper.getWindow();
	  options = options || {};
	  var originUrl = options.popupOrigin || this.baseOptions.popupOrigin || windowHelper.getOrigin();
	
	  /*
	    in IE 11, there's a bug that makes window.opener return undefined.
	    The callback page will still call `popup.callback()` which will run this method
	    in the relay page. WinChan expects the relay page to have a global `doPost` function,
	    which will be called with the response.
	
	    IE11 Bug: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/110920/
	   */
	  if (!theWindow.opener) {
	    theWindow.doPost = function(msg) {
	      if (theWindow.parent) {
	        theWindow.parent.postMessage(msg, originUrl);
	      }
	    };
	    return;
	  }
	
	  WinChan.onOpen(function(popupOrigin, r, cb) {
	    if (popupOrigin !== originUrl) {
	      return cb({
	        error: 'origin_mismatch',
	        error_description: "The popup's origin (" +
	          popupOrigin +
	          ') should match the `popupOrigin` parameter (' +
	          originUrl +
	          ').'
	      });
	    }
	    _this.webAuth.parseHash(options || {}, function(err, data) {
	      return cb(err || data);
	    });
	  });
	};
	
	/**
	 * Shows inside a new window the hosted login page (`/authorize`) in order to start a new authN/authZ transaction and post its result using `postMessage`.
	 *
	 * @method authorize
	 * @param {Object} options
	 * @param {String} [options.domain] your Auth0 domain
	 * @param {String} [options.clientID] your Auth0 client identifier obtained when creating the client in the Auth0 Dashboard
	 * @param {String} options.redirectUri url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} options.responseType type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0}
	 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
	 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
	 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @param {Boolean} [options.owp] determines if Auth0 should render the relay page or not and the caller is responsible of handling the response.
	 * @param {authorizeCallback} cb
	 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
	 */
	Popup.prototype.authorize = function(options, cb) {
	  var popup;
	  var url;
	  var relayUrl;
	  var popOpts = {};
	
	  var pluginHandler = this.baseOptions.plugins.get('popup.authorize');
	
	  var params = objectHelper
	    .merge(this.baseOptions, [
	      'clientID',
	      'scope',
	      'domain',
	      'audience',
	      'tenant',
	      'responseType',
	      'redirectUri',
	      '_csrf',
	      'state',
	      '_intstate',
	      'nonce'
	    ])
	    .with(objectHelper.blacklist(options, ['popupHandler']));
	
	  assert.check(
	    params,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      responseType: { type: 'string', message: 'responseType option is required' }
	    }
	  );
	
	  // the relay page should not be necessary as long it happens in the same domain
	  // (a redirectUri shoul be provided). It is necessary when using OWP
	  relayUrl = urljoin(this.baseOptions.rootUrl, 'relay.html');
	
	  // if a owp is enabled, it should use the owp flag
	  if (options.owp) {
	    // used by server to render the relay page instead of sending the chunk in the
	    // url to the callback
	    params.owp = true;
	  } else {
	    popOpts.origin = urlHelper.extractOrigin(params.redirectUri);
	    relayUrl = params.redirectUri;
	  }
	
	  if (options.popupOptions) {
	    popOpts.popupOptions = objectHelper.pick(options.popupOptions, ['width', 'height']);
	  }
	
	  if (pluginHandler) {
	    params = pluginHandler.processParams(params);
	  }
	
	  params = this.transactionManager.process(params);
	  params.scope = params.scope || 'openid profile email';
	  delete params.domain;
	
	  url = this.client.buildAuthorizeUrl(params);
	
	  popup = this.getPopupHandler(options);
	
	  return popup.load(url, relayUrl, popOpts, responseHandler(cb));
	};
	
	/**
	 * Performs authentication with username/email and password with a database connection inside a new window
	 *
	 * This method is not compatible with API Auth so if you need to fetch API tokens with audience
	 * you should use {@link authorize} or {@link login}.
	 *
	 * @method loginWithCredentials
	 * @param {Object} options
	 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} [options.responseType] type of the response used. It can be any of the values `code` and `token`
	 * @param {String} [options.responseMode] how the AuthN response is encoded and redirected back to the client. Supported values are `query` and `fragment`. The `query` value is only supported when `responseType` is `code`.
	 * @param {String} [options.scope] scopes to be requested during AuthN. e.g. `openid email`
	 * @param {credentialsCallback} cb
	 */
	Popup.prototype.loginWithCredentials = function(options, cb) {
	  options.realm = options.realm || options.connection;
	  options.popup = true;
	  options = objectHelper
	    .merge(this.baseOptions, ['redirectUri', 'responseType', 'state', 'nonce'])
	    .with(objectHelper.blacklist(options, ['popupHandler', 'connection']));
	  options = this.transactionManager.process(options);
	  this.crossOriginAuthentication.login(options, cb);
	};
	
	/**
	 * Verifies the passwordless TOTP and redirects to finish the passwordless transaction
	 *
	 * @method passwordlessVerify
	 * @param {Object} options
	 * @param {String} options.type `sms` or `email`
	 * @param {String} options.phoneNumber only if type = sms
	 * @param {String} options.email only if type = email
	 * @param {String} options.connection the connection name
	 * @param {String} options.verificationCode the TOTP code
	 * @param {Function} cb
	 */
	Popup.prototype.passwordlessVerify = function(options, cb) {
	  var _this = this;
	  return this.client.passwordless.verify(
	    objectHelper.blacklist(options, ['popupHandler']),
	    function(err) {
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
	    }
	  );
	};
	
	/**
	 * Signs up a new user and automatically logs the user in after the signup.
	 *
	 * This method is not compatible with API Auth so if you need to fetch API tokens with audience
	 * you should use {@link authorize} or {@link signupAndAuthorize}.
	 *
	 * @method signupAndLogin
	 * @param {Object} options
	 * @param {String} options.email user email address
	 * @param {String} options.password user password
	 * @param {String} options.connection name of the connection where the user will be created
	 * @param {credentialsCallback} cb
	 */
	Popup.prototype.signupAndLogin = function(options, cb) {
	  var _this = this;
	
	  // Preload popup to avoid the browser to block it since the login happens later
	  var popupHandler = this.getPopupHandler(options, true);
	  options.popupHandler = popupHandler;
	
	  return this.client.dbConnection.signup(
	    objectHelper.blacklist(options, ['popupHandler']),
	    function(err) {
	      if (err) {
	        if (popupHandler._current_popup) {
	          popupHandler._current_popup.kill();
	        }
	        return cb(err);
	      }
	      _this.loginWithCredentials(options, cb);
	    }
	  );
	};
	
	module.exports = Popup;


/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	var CrossOriginAuthentication = __webpack_require__(16);
	var Warn = __webpack_require__(7);
	
	function Redirect(auth0, options) {
	  this.webAuth = auth0;
	  this.baseOptions = options;
	  this.crossOriginAuthentication = new CrossOriginAuthentication(auth0, this.baseOptions);
	
	  this.warn = new Warn({
	    disableWarnings: !!options._disableDeprecationWarnings
	  });
	}
	
	/**
	 * Logs in the user with username and password using the cross origin authentication (/co/authenticate) flow. You can use either `username` or `email` to identify the user, but `username` will take precedence over `email`.
	 * Some browsers might not be able to successfully authenticate if 3rd party cookies are disabled in your browser. [See here for more information.]{@link https://auth0.com/docs/cross-origin-authentication}.
	 * After the /co/authenticate call, you'll have to use the {@link parseHash} function at the `redirectUri` specified in the constructor.
	 *
	 * @method loginWithCredentials
	 * @deprecated This method will be released in the next major version. Use `webAuth.login` instead.
	 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
	 * @param {String} [options.username] Username (mutually exclusive with email)
	 * @param {String} [options.email] Email (mutually exclusive with username)
	 * @param {String} options.password Password
	 * @param {String} [options.connection] Connection used to authenticate the user, it can be a realm name or a database connection name
	 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
	 */
	Redirect.prototype.loginWithCredentials = function(options, cb) {
	  options.realm = options.realm || options.connection;
	  delete options.connection;
	  this.crossOriginAuthentication.login(options, cb);
	};
	
	/**
	 * Signs up a new user and automatically logs the user in after the signup.
	 *
	 * @method signupAndLogin
	 * @param {Object} options
	 * @param {String} options.email user email address
	 * @param {String} options.password user password
	 * @param {String} options.connection name of the connection where the user will be created
	 * @param {crossOriginLoginCallback} cb
	 */
	Redirect.prototype.signupAndLogin = function(options, cb) {
	  var _this = this;
	  return this.webAuth.client.dbConnection.signup(options, function(err) {
	    if (err) {
	      return cb(err);
	    }
	    options.realm = options.realm || options.connection;
	    delete options.connection;
	    return _this.webAuth.login(options, cb);
	  });
	};
	
	module.exports = Redirect;


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var IframeHandler = __webpack_require__(27);
	var windowHelper = __webpack_require__(2);
	
	function SilentAuthenticationHandler(options) {
	  this.authenticationUrl = options.authenticationUrl;
	  this.timeout = options.timeout || 60 * 1000;
	  this.handler = null;
	  this.postMessageDataType = options.postMessageDataType || false;
	
	  // prefer origin from options, fallback to origin from browser, and some browsers (for example MS Edge) don't support origin; fallback to construct origin manually
	  this.postMessageOrigin =
	    options.postMessageOrigin ||
	    windowHelper.getWindow().location.origin ||
	    windowHelper.getWindow().location.protocol + '//' + windowHelper.getWindow().location.hostname
	      + (windowHelper.getWindow().location.port ? ':' + windowHelper.getWindow().location.port : '');
	}
	
	SilentAuthenticationHandler.create = function(options) {
	  return new SilentAuthenticationHandler(options);
	};
	
	SilentAuthenticationHandler.prototype.login = function(usePostMessage, callback) {
	  this.handler = new IframeHandler({
	    auth0: this.auth0,
	    url: this.authenticationUrl,
	    eventListenerType: usePostMessage ? 'message' : 'load',
	    callback: this.getCallbackHandler(callback, usePostMessage),
	    timeout: this.timeout,
	    eventValidator: this.getEventValidator(),
	    timeoutCallback: function() {
	      callback(null, '#error=timeout&error_description=Timeout+during+authentication+renew.');
	    },
	    usePostMessage: usePostMessage || false
	  });
	
	  this.handler.init();
	};
	
	SilentAuthenticationHandler.prototype.getEventValidator = function() {
	  var _this = this;
	  return {
	    isValid: function(eventData) {
	      switch (eventData.event.type) {
	        case 'message':
	          // Message must come from the expected origin and iframe window.
	          if (
	            eventData.event.origin !== _this.postMessageOrigin ||
	            eventData.event.source !== _this.handler.iframe.contentWindow
	          ) {
	            return false;
	          }
	
	          // Default behaviour, return all message events from the iframe.
	          if (_this.postMessageDataType === false) {
	            return true;
	          }
	
	          return (
	            eventData.event.data.type && eventData.event.data.type === _this.postMessageDataType
	          );
	
	        case 'load':
	          if (eventData.sourceObject.contentWindow.location.protocol === 'about:') {
	            // Chrome is automatically loading the about:blank page, we ignore this.
	            return false;
	          }
	        // Fall through to default
	        default:
	          return true;
	      }
	    }
	  };
	};
	
	SilentAuthenticationHandler.prototype.getCallbackHandler = function(callback, usePostMessage) {
	  return function(eventData) {
	    var callbackValue;
	    if (!usePostMessage) {
	      callbackValue = eventData.sourceObject.contentWindow.location.hash;
	    } else if (typeof eventData.event.data === 'object' && eventData.event.data.hash) {
	      callbackValue = eventData.event.data.hash;
	    } else {
	      callbackValue = eventData.event.data;
	    }
	    callback(null, callbackValue);
	  };
	};
	
	module.exports = SilentAuthenticationHandler;


/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(3);
	
	var objectHelper = __webpack_require__(1);
	var RequestBuilder = __webpack_require__(11);
	var responseHandler = __webpack_require__(5);
	var windowHelper = __webpack_require__(2);
	var TransactionManager = __webpack_require__(17);
	
	function UsernamePassword(options) {
	  this.baseOptions = options;
	  this.request = new RequestBuilder(options);
	  this.transactionManager = new TransactionManager(this.baseOptions.transaction);
	}
	
	UsernamePassword.prototype.login = function(options, cb) {
	  var url;
	  var body;
	
	  url = urljoin(this.baseOptions.rootUrl, 'usernamepassword', 'login');
	
	  options.username = options.username || options.email; // eslint-disable-line
	
	  options = objectHelper.blacklist(options, ['email']); // eslint-disable-line
	
	  body = objectHelper
	    .merge(this.baseOptions, [
	      'clientID',
	      'redirectUri',
	      'tenant',
	      'responseType',
	      'responseMode',
	      'scope',
	      'audience'
	    ])
	    .with(options);
	  body = this.transactionManager.process(body);
	
	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	
	  return this.request.post(url).send(body).end(responseHandler(cb));
	};
	
	UsernamePassword.prototype.callback = function(formHtml) {
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