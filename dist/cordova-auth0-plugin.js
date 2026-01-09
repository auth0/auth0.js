/**
 * auth0-js v9.30.0
 * Author: Auth0
 * Date: 2026-01-09
 * License: MIT
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.CordovaAuth0Plugin = factory());
})(this, (function () { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function getAugmentedNamespace(n) {
	  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n;
	  var f = n.default;
		if (typeof f == "function") {
			var a = function a () {
				var isInstance = false;
	      try {
	        isInstance = this instanceof a;
	      } catch (e) {}
				if (isInstance) {
	        return Reflect.construct(f, arguments, this.constructor);
				}
				return f.apply(this, arguments);
			};
			a.prototype = f.prototype;
	  } else a = {};
	  Object.defineProperty(a, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	var version$1;
	var hasRequiredVersion;
	function requireVersion() {
	  if (hasRequiredVersion) return version$1;
	  hasRequiredVersion = 1;
	  version$1 = {
	    raw: '9.30.0'
	  };
	  return version$1;
	}

	var versionExports = requireVersion();
	var version = /*@__PURE__*/getDefaultExportFromCjs(versionExports);

	function _typeof(o) {
	  "@babel/helpers - typeof";

	  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
	    return typeof o;
	  } : function (o) {
	    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	  }, _typeof(o);
	}

	var toString = Object.prototype.toString;
	function attribute(o, attr, type, text) {
	  type = type === 'array' ? 'object' : type;
	  if (o && _typeof(o[attr]) !== type) {
	    throw new Error(text);
	  }
	}
	function variable(o, type, text) {
	  if (_typeof(o) !== type) {
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
	var assert = {
	  check: check,
	  attribute: attribute,
	  variable: variable,
	  value: value,
	  isArray: isArray,
	  supportsIsArray: supportsIsArray
	};

	/* eslint-disable no-continue */

	function get$1() {
	  if (!Object.assign) {
	    return objectAssignPolyfill;
	  }
	  return Object.assign;
	}
	function objectAssignPolyfill(target) {
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
	var objectAssign = {
	  get: get$1,
	  objectAssignPolyfill: objectAssignPolyfill
	};

	function pick(object, keys) {
	  return keys.reduce(function (prev, key) {
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
	    with: function _with(object2, keys2) {
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
	    if (!wasPrevUppercase && code >= 65 && code <= 90 || !wasPrevNumber && code >= 48 && code <= 57) {
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
	  return parts.reduce(function (p, c) {
	    return p + c.charAt(0).toUpperCase() + c.slice(1);
	  }, parts.shift());
	}
	function toSnakeCase(object, exceptions) {
	  if (_typeof(object) !== 'object' || assert.isArray(object) || object === null) {
	    return object;
	  }
	  exceptions = exceptions || [];
	  return Object.keys(object).reduce(function (p, key) {
	    var newKey = exceptions.indexOf(key) === -1 ? camelToSnake(key) : key;
	    p[newKey] = toSnakeCase(object[key]);
	    return p;
	  }, {});
	}
	function toCamelCase(object, exceptions, options) {
	  if (_typeof(object) !== 'object' || assert.isArray(object) || object === null) {
	    return object;
	  }
	  exceptions = exceptions || [];
	  options = options || {};
	  return Object.keys(object).reduce(function (p, key) {
	    var newKey = exceptions.indexOf(key) === -1 ? snakeToCamel(key) : key;
	    p[newKey] = toCamelCase(object[newKey] || object[key], [], options);
	    if (options.keepOriginal) {
	      p[key] = toCamelCase(object[key], [], options);
	    }
	    return p;
	  }, {});
	}
	function getLocationFromUrl(href) {
	  var match = href.match(/^(https?:|file:|chrome-extension:)\/\/(([^:/?#]*)(?::([0-9]+))?)([/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
	  return match && {
	    href: href,
	    protocol: match[1],
	    host: match[2],
	    hostname: match[3],
	    port: match[4],
	    pathname: match[5],
	    search: match[6],
	    hash: match[7]
	  };
	}
	function getOriginFromUrl(url) {
	  if (!url) {
	    return undefined;
	  }
	  var parsed = getLocationFromUrl(url);
	  if (!parsed) {
	    return null;
	  }
	  var origin = parsed.protocol + '//' + parsed.hostname;
	  if (parsed.port) {
	    origin += ':' + parsed.port;
	  }
	  return origin;
	}
	function trim(options, key) {
	  var trimmed = extend(options);
	  if (options[key]) {
	    trimmed[key] = options[key].trim();
	  }
	  return trimmed;
	}
	function trimMultiple(options, keys) {
	  return keys.reduce(trim, options);
	}
	function trimUserDetails(options) {
	  return trimMultiple(options, ['username', 'email', 'phoneNumber']);
	}

	/**
	 * Updates the value of a property on the given object, using a deep path selector.
	 * @param {object} obj The object to set the property value on
	 * @param {string|array} path The path to the property that should have its value updated. e.g. 'prop1.prop2.prop3' or ['prop1', 'prop2', 'prop3']
	 * @param {any} value The value to set
	 * @ignore
	 */
	function updatePropertyOn(obj, path, value) {
	  if (typeof path === 'string') {
	    path = path.split('.');
	  }
	  var next = path[0];
	  if (obj.hasOwnProperty(next)) {
	    if (path.length === 1) {
	      obj[next] = value;
	    } else {
	      updatePropertyOn(obj[next], path.slice(1), value);
	    }
	  }
	}
	var objectHelper = {
	  toSnakeCase: toSnakeCase,
	  toCamelCase: toCamelCase,
	  blacklist: blacklist,
	  merge: merge,
	  pick: pick,
	  getKeysNotIn: getKeysNotIn,
	  extend: extend,
	  getOriginFromUrl: getOriginFromUrl,
	  getLocationFromUrl: getLocationFromUrl,
	  trimUserDetails: trimUserDetails,
	  updatePropertyOn: updatePropertyOn
	};

	function redirect(url) {
	  getWindow().location = url;
	}
	function getDocument() {
	  return getWindow().document;
	}
	function getWindow() {
	  return window;
	}
	function getOrigin() {
	  var location = getWindow().location;
	  var origin = location.origin;
	  if (!origin) {
	    origin = objectHelper.getOriginFromUrl(location.href);
	  }
	  return origin;
	}
	var windowHandler = {
	  redirect: redirect,
	  getDocument: getDocument,
	  getWindow: getWindow,
	  getOrigin: getOrigin
	};

	var urlJoin$1 = {exports: {}};

	var urlJoin = urlJoin$1.exports;

	var hasRequiredUrlJoin;

	function requireUrlJoin () {
		if (hasRequiredUrlJoin) return urlJoin$1.exports;
		hasRequiredUrlJoin = 1;
		(function (module) {
			(function (name, context, definition) {
			  if (module.exports) module.exports = definition();
			  else context[name] = definition();
			})('urljoin', urlJoin, function () {

			  function normalize (strArray) {
			    var resultArray = [];
			    if (strArray.length === 0) { return ''; }

			    if (typeof strArray[0] !== 'string') {
			      throw new TypeError('Url must be a string. Received ' + strArray[0]);
			    }

			    // If the first part is a plain protocol, we combine it with the next part.
			    if (strArray[0].match(/^[^/:]+:\/*$/) && strArray.length > 1) {
			      var first = strArray.shift();
			      strArray[0] = first + strArray[0];
			    }

			    // There must be two or three slashes in the file protocol, two slashes in anything else.
			    if (strArray[0].match(/^file:\/\/\//)) {
			      strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, '$1:///');
			    } else {
			      strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, '$1://');
			    }

			    for (var i = 0; i < strArray.length; i++) {
			      var component = strArray[i];

			      if (typeof component !== 'string') {
			        throw new TypeError('Url must be a string. Received ' + component);
			      }

			      if (component === '') { continue; }

			      if (i > 0) {
			        // Removing the starting slashes for each component but the first.
			        component = component.replace(/^[\/]+/, '');
			      }
			      if (i < strArray.length - 1) {
			        // Removing the ending slashes for each component but the last.
			        component = component.replace(/[\/]+$/, '');
			      } else {
			        // For the last component we will combine multiple slashes to a single one.
			        component = component.replace(/[\/]+$/, '/');
			      }

			      resultArray.push(component);

			    }

			    var str = resultArray.join('/');
			    // Each input component is now separated by a single slash except the possible first plain protocol part.

			    // remove trailing slash before parameters or hash
			    str = str.replace(/\/(\?|&|#[^!])/g, '$1');

			    // replace ? in parameters with &
			    var parts = str.split('?');
			    str = parts.shift() + (parts.length > 0 ? '?': '') + parts.join('&');

			    return str;
			  }

			  return function () {
			    var input;

			    if (typeof arguments[0] === 'object') {
			      input = arguments[0];
			    } else {
			      input = [].slice.call(arguments);
			    }

			    return normalize(input);
			  };

			}); 
		} (urlJoin$1));
		return urlJoin$1.exports;
	}

	var urlJoinExports = requireUrlJoin();
	var urljoin = /*@__PURE__*/getDefaultExportFromCjs(urlJoinExports);

	var type;
	var hasRequiredType;

	function requireType () {
		if (hasRequiredType) return type;
		hasRequiredType = 1;

		/** @type {import('./type')} */
		type = TypeError;
		return type;
	}

	var _nodeResolve_empty = {};

	var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		default: _nodeResolve_empty
	});

	var require$$0 = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

	var objectInspect;
	var hasRequiredObjectInspect;

	function requireObjectInspect () {
		if (hasRequiredObjectInspect) return objectInspect;
		hasRequiredObjectInspect = 1;
		var hasMap = typeof Map === 'function' && Map.prototype;
		var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
		var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
		var mapForEach = hasMap && Map.prototype.forEach;
		var hasSet = typeof Set === 'function' && Set.prototype;
		var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
		var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
		var setForEach = hasSet && Set.prototype.forEach;
		var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
		var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
		var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
		var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
		var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
		var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
		var booleanValueOf = Boolean.prototype.valueOf;
		var objectToString = Object.prototype.toString;
		var functionToString = Function.prototype.toString;
		var $match = String.prototype.match;
		var $slice = String.prototype.slice;
		var $replace = String.prototype.replace;
		var $toUpperCase = String.prototype.toUpperCase;
		var $toLowerCase = String.prototype.toLowerCase;
		var $test = RegExp.prototype.test;
		var $concat = Array.prototype.concat;
		var $join = Array.prototype.join;
		var $arrSlice = Array.prototype.slice;
		var $floor = Math.floor;
		var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
		var gOPS = Object.getOwnPropertySymbols;
		var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
		var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
		// ie, `has-tostringtag/shams
		var toStringTag = typeof Symbol === 'function' && Symbol.toStringTag && (typeof Symbol.toStringTag === hasShammedSymbols ? 'object' : 'symbol')
		    ? Symbol.toStringTag
		    : null;
		var isEnumerable = Object.prototype.propertyIsEnumerable;

		var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
		    [].__proto__ === Array.prototype // eslint-disable-line no-proto
		        ? function (O) {
		            return O.__proto__; // eslint-disable-line no-proto
		        }
		        : null
		);

		function addNumericSeparator(num, str) {
		    if (
		        num === Infinity
		        || num === -Infinity
		        || num !== num
		        || (num && num > -1e3 && num < 1000)
		        || $test.call(/e/, str)
		    ) {
		        return str;
		    }
		    var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
		    if (typeof num === 'number') {
		        var int = num < 0 ? -$floor(-num) : $floor(num); // trunc(num)
		        if (int !== num) {
		            var intStr = String(int);
		            var dec = $slice.call(str, intStr.length + 1);
		            return $replace.call(intStr, sepRegex, '$&_') + '.' + $replace.call($replace.call(dec, /([0-9]{3})/g, '$&_'), /_$/, '');
		        }
		    }
		    return $replace.call(str, sepRegex, '$&_');
		}

		var utilInspect = require$$0;
		var inspectCustom = utilInspect.custom;
		var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null;

		var quotes = {
		    __proto__: null,
		    'double': '"',
		    single: "'"
		};
		var quoteREs = {
		    __proto__: null,
		    'double': /(["\\])/g,
		    single: /(['\\])/g
		};

		objectInspect = function inspect_(obj, options, depth, seen) {
		    var opts = options || {};

		    if (has(opts, 'quoteStyle') && !has(quotes, opts.quoteStyle)) {
		        throw new TypeError('option "quoteStyle" must be "single" or "double"');
		    }
		    if (
		        has(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
		            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
		            : opts.maxStringLength !== null
		        )
		    ) {
		        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
		    }
		    var customInspect = has(opts, 'customInspect') ? opts.customInspect : true;
		    if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
		        throw new TypeError('option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`');
		    }

		    if (
		        has(opts, 'indent')
		        && opts.indent !== null
		        && opts.indent !== '\t'
		        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
		    ) {
		        throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
		    }
		    if (has(opts, 'numericSeparator') && typeof opts.numericSeparator !== 'boolean') {
		        throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
		    }
		    var numericSeparator = opts.numericSeparator;

		    if (typeof obj === 'undefined') {
		        return 'undefined';
		    }
		    if (obj === null) {
		        return 'null';
		    }
		    if (typeof obj === 'boolean') {
		        return obj ? 'true' : 'false';
		    }

		    if (typeof obj === 'string') {
		        return inspectString(obj, opts);
		    }
		    if (typeof obj === 'number') {
		        if (obj === 0) {
		            return Infinity / obj > 0 ? '0' : '-0';
		        }
		        var str = String(obj);
		        return numericSeparator ? addNumericSeparator(obj, str) : str;
		    }
		    if (typeof obj === 'bigint') {
		        var bigIntStr = String(obj) + 'n';
		        return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
		    }

		    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
		    if (typeof depth === 'undefined') { depth = 0; }
		    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
		        return isArray(obj) ? '[Array]' : '[Object]';
		    }

		    var indent = getIndent(opts, depth);

		    if (typeof seen === 'undefined') {
		        seen = [];
		    } else if (indexOf(seen, obj) >= 0) {
		        return '[Circular]';
		    }

		    function inspect(value, from, noIndent) {
		        if (from) {
		            seen = $arrSlice.call(seen);
		            seen.push(from);
		        }
		        if (noIndent) {
		            var newOpts = {
		                depth: opts.depth
		            };
		            if (has(opts, 'quoteStyle')) {
		                newOpts.quoteStyle = opts.quoteStyle;
		            }
		            return inspect_(value, newOpts, depth + 1, seen);
		        }
		        return inspect_(value, opts, depth + 1, seen);
		    }

		    if (typeof obj === 'function' && !isRegExp(obj)) { // in older engines, regexes are callable
		        var name = nameOf(obj);
		        var keys = arrObjKeys(obj, inspect);
		        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + $join.call(keys, ', ') + ' }' : '');
		    }
		    if (isSymbol(obj)) {
		        var symString = hasShammedSymbols ? $replace.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
		        return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
		    }
		    if (isElement(obj)) {
		        var s = '<' + $toLowerCase.call(String(obj.nodeName));
		        var attrs = obj.attributes || [];
		        for (var i = 0; i < attrs.length; i++) {
		            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
		        }
		        s += '>';
		        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
		        s += '</' + $toLowerCase.call(String(obj.nodeName)) + '>';
		        return s;
		    }
		    if (isArray(obj)) {
		        if (obj.length === 0) { return '[]'; }
		        var xs = arrObjKeys(obj, inspect);
		        if (indent && !singleLineValues(xs)) {
		            return '[' + indentedJoin(xs, indent) + ']';
		        }
		        return '[ ' + $join.call(xs, ', ') + ' ]';
		    }
		    if (isError(obj)) {
		        var parts = arrObjKeys(obj, inspect);
		        if (!('cause' in Error.prototype) && 'cause' in obj && !isEnumerable.call(obj, 'cause')) {
		            return '{ [' + String(obj) + '] ' + $join.call($concat.call('[cause]: ' + inspect(obj.cause), parts), ', ') + ' }';
		        }
		        if (parts.length === 0) { return '[' + String(obj) + ']'; }
		        return '{ [' + String(obj) + '] ' + $join.call(parts, ', ') + ' }';
		    }
		    if (typeof obj === 'object' && customInspect) {
		        if (inspectSymbol && typeof obj[inspectSymbol] === 'function' && utilInspect) {
		            return utilInspect(obj, { depth: maxDepth - depth });
		        } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
		            return obj.inspect();
		        }
		    }
		    if (isMap(obj)) {
		        var mapParts = [];
		        if (mapForEach) {
		            mapForEach.call(obj, function (value, key) {
		                mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
		            });
		        }
		        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
		    }
		    if (isSet(obj)) {
		        var setParts = [];
		        if (setForEach) {
		            setForEach.call(obj, function (value) {
		                setParts.push(inspect(value, obj));
		            });
		        }
		        return collectionOf('Set', setSize.call(obj), setParts, indent);
		    }
		    if (isWeakMap(obj)) {
		        return weakCollectionOf('WeakMap');
		    }
		    if (isWeakSet(obj)) {
		        return weakCollectionOf('WeakSet');
		    }
		    if (isWeakRef(obj)) {
		        return weakCollectionOf('WeakRef');
		    }
		    if (isNumber(obj)) {
		        return markBoxed(inspect(Number(obj)));
		    }
		    if (isBigInt(obj)) {
		        return markBoxed(inspect(bigIntValueOf.call(obj)));
		    }
		    if (isBoolean(obj)) {
		        return markBoxed(booleanValueOf.call(obj));
		    }
		    if (isString(obj)) {
		        return markBoxed(inspect(String(obj)));
		    }
		    // note: in IE 8, sometimes `global !== window` but both are the prototypes of each other
		    /* eslint-env browser */
		    if (typeof window !== 'undefined' && obj === window) {
		        return '{ [object Window] }';
		    }
		    if (
		        (typeof globalThis !== 'undefined' && obj === globalThis)
		        || (typeof commonjsGlobal !== 'undefined' && obj === commonjsGlobal)
		    ) {
		        return '{ [object globalThis] }';
		    }
		    if (!isDate(obj) && !isRegExp(obj)) {
		        var ys = arrObjKeys(obj, inspect);
		        var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
		        var protoTag = obj instanceof Object ? '' : 'null prototype';
		        var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice.call(toStr(obj), 8, -1) : protoTag ? 'Object' : '';
		        var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
		        var tag = constructorTag + (stringTag || protoTag ? '[' + $join.call($concat.call([], stringTag || [], protoTag || []), ': ') + '] ' : '');
		        if (ys.length === 0) { return tag + '{}'; }
		        if (indent) {
		            return tag + '{' + indentedJoin(ys, indent) + '}';
		        }
		        return tag + '{ ' + $join.call(ys, ', ') + ' }';
		    }
		    return String(obj);
		};

		function wrapQuotes(s, defaultStyle, opts) {
		    var style = opts.quoteStyle || defaultStyle;
		    var quoteChar = quotes[style];
		    return quoteChar + s + quoteChar;
		}

		function quote(s) {
		    return $replace.call(String(s), /"/g, '&quot;');
		}

		function canTrustToString(obj) {
		    return !toStringTag || !(typeof obj === 'object' && (toStringTag in obj || typeof obj[toStringTag] !== 'undefined'));
		}
		function isArray(obj) { return toStr(obj) === '[object Array]' && canTrustToString(obj); }
		function isDate(obj) { return toStr(obj) === '[object Date]' && canTrustToString(obj); }
		function isRegExp(obj) { return toStr(obj) === '[object RegExp]' && canTrustToString(obj); }
		function isError(obj) { return toStr(obj) === '[object Error]' && canTrustToString(obj); }
		function isString(obj) { return toStr(obj) === '[object String]' && canTrustToString(obj); }
		function isNumber(obj) { return toStr(obj) === '[object Number]' && canTrustToString(obj); }
		function isBoolean(obj) { return toStr(obj) === '[object Boolean]' && canTrustToString(obj); }

		// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
		function isSymbol(obj) {
		    if (hasShammedSymbols) {
		        return obj && typeof obj === 'object' && obj instanceof Symbol;
		    }
		    if (typeof obj === 'symbol') {
		        return true;
		    }
		    if (!obj || typeof obj !== 'object' || !symToString) {
		        return false;
		    }
		    try {
		        symToString.call(obj);
		        return true;
		    } catch (e) {}
		    return false;
		}

		function isBigInt(obj) {
		    if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
		        return false;
		    }
		    try {
		        bigIntValueOf.call(obj);
		        return true;
		    } catch (e) {}
		    return false;
		}

		var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
		function has(obj, key) {
		    return hasOwn.call(obj, key);
		}

		function toStr(obj) {
		    return objectToString.call(obj);
		}

		function nameOf(f) {
		    if (f.name) { return f.name; }
		    var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/);
		    if (m) { return m[1]; }
		    return null;
		}

		function indexOf(xs, x) {
		    if (xs.indexOf) { return xs.indexOf(x); }
		    for (var i = 0, l = xs.length; i < l; i++) {
		        if (xs[i] === x) { return i; }
		    }
		    return -1;
		}

		function isMap(x) {
		    if (!mapSize || !x || typeof x !== 'object') {
		        return false;
		    }
		    try {
		        mapSize.call(x);
		        try {
		            setSize.call(x);
		        } catch (s) {
		            return true;
		        }
		        return x instanceof Map; // core-js workaround, pre-v2.5.0
		    } catch (e) {}
		    return false;
		}

		function isWeakMap(x) {
		    if (!weakMapHas || !x || typeof x !== 'object') {
		        return false;
		    }
		    try {
		        weakMapHas.call(x, weakMapHas);
		        try {
		            weakSetHas.call(x, weakSetHas);
		        } catch (s) {
		            return true;
		        }
		        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
		    } catch (e) {}
		    return false;
		}

		function isWeakRef(x) {
		    if (!weakRefDeref || !x || typeof x !== 'object') {
		        return false;
		    }
		    try {
		        weakRefDeref.call(x);
		        return true;
		    } catch (e) {}
		    return false;
		}

		function isSet(x) {
		    if (!setSize || !x || typeof x !== 'object') {
		        return false;
		    }
		    try {
		        setSize.call(x);
		        try {
		            mapSize.call(x);
		        } catch (m) {
		            return true;
		        }
		        return x instanceof Set; // core-js workaround, pre-v2.5.0
		    } catch (e) {}
		    return false;
		}

		function isWeakSet(x) {
		    if (!weakSetHas || !x || typeof x !== 'object') {
		        return false;
		    }
		    try {
		        weakSetHas.call(x, weakSetHas);
		        try {
		            weakMapHas.call(x, weakMapHas);
		        } catch (s) {
		            return true;
		        }
		        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
		    } catch (e) {}
		    return false;
		}

		function isElement(x) {
		    if (!x || typeof x !== 'object') { return false; }
		    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
		        return true;
		    }
		    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
		}

		function inspectString(str, opts) {
		    if (str.length > opts.maxStringLength) {
		        var remaining = str.length - opts.maxStringLength;
		        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
		        return inspectString($slice.call(str, 0, opts.maxStringLength), opts) + trailer;
		    }
		    var quoteRE = quoteREs[opts.quoteStyle || 'single'];
		    quoteRE.lastIndex = 0;
		    // eslint-disable-next-line no-control-regex
		    var s = $replace.call($replace.call(str, quoteRE, '\\$1'), /[\x00-\x1f]/g, lowbyte);
		    return wrapQuotes(s, 'single', opts);
		}

		function lowbyte(c) {
		    var n = c.charCodeAt(0);
		    var x = {
		        8: 'b',
		        9: 't',
		        10: 'n',
		        12: 'f',
		        13: 'r'
		    }[n];
		    if (x) { return '\\' + x; }
		    return '\\x' + (n < 0x10 ? '0' : '') + $toUpperCase.call(n.toString(16));
		}

		function markBoxed(str) {
		    return 'Object(' + str + ')';
		}

		function weakCollectionOf(type) {
		    return type + ' { ? }';
		}

		function collectionOf(type, size, entries, indent) {
		    var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ', ');
		    return type + ' (' + size + ') {' + joinedEntries + '}';
		}

		function singleLineValues(xs) {
		    for (var i = 0; i < xs.length; i++) {
		        if (indexOf(xs[i], '\n') >= 0) {
		            return false;
		        }
		    }
		    return true;
		}

		function getIndent(opts, depth) {
		    var baseIndent;
		    if (opts.indent === '\t') {
		        baseIndent = '\t';
		    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
		        baseIndent = $join.call(Array(opts.indent + 1), ' ');
		    } else {
		        return null;
		    }
		    return {
		        base: baseIndent,
		        prev: $join.call(Array(depth + 1), baseIndent)
		    };
		}

		function indentedJoin(xs, indent) {
		    if (xs.length === 0) { return ''; }
		    var lineJoiner = '\n' + indent.prev + indent.base;
		    return lineJoiner + $join.call(xs, ',' + lineJoiner) + '\n' + indent.prev;
		}

		function arrObjKeys(obj, inspect) {
		    var isArr = isArray(obj);
		    var xs = [];
		    if (isArr) {
		        xs.length = obj.length;
		        for (var i = 0; i < obj.length; i++) {
		            xs[i] = has(obj, i) ? inspect(obj[i], obj) : '';
		        }
		    }
		    var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
		    var symMap;
		    if (hasShammedSymbols) {
		        symMap = {};
		        for (var k = 0; k < syms.length; k++) {
		            symMap['$' + syms[k]] = syms[k];
		        }
		    }

		    for (var key in obj) { // eslint-disable-line no-restricted-syntax
		        if (!has(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
		        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
		        if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
		            // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
		            continue; // eslint-disable-line no-restricted-syntax, no-continue
		        } else if ($test.call(/[^\w$]/, key)) {
		            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
		        } else {
		            xs.push(key + ': ' + inspect(obj[key], obj));
		        }
		    }
		    if (typeof gOPS === 'function') {
		        for (var j = 0; j < syms.length; j++) {
		            if (isEnumerable.call(obj, syms[j])) {
		                xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
		            }
		        }
		    }
		    return xs;
		}
		return objectInspect;
	}

	var sideChannelList;
	var hasRequiredSideChannelList;

	function requireSideChannelList () {
		if (hasRequiredSideChannelList) return sideChannelList;
		hasRequiredSideChannelList = 1;

		var inspect = /*@__PURE__*/ requireObjectInspect();

		var $TypeError = /*@__PURE__*/ requireType();

		/*
		* This function traverses the list returning the node corresponding to the given key.
		*
		* That node is also moved to the head of the list, so that if it's accessed again we don't need to traverse the whole list.
		* By doing so, all the recently used nodes can be accessed relatively quickly.
		*/
		/** @type {import('./list.d.ts').listGetNode} */
		// eslint-disable-next-line consistent-return
		var listGetNode = function (list, key, isDelete) {
			/** @type {typeof list | NonNullable<(typeof list)['next']>} */
			var prev = list;
			/** @type {(typeof list)['next']} */
			var curr;
			// eslint-disable-next-line eqeqeq
			for (; (curr = prev.next) != null; prev = curr) {
				if (curr.key === key) {
					prev.next = curr.next;
					if (!isDelete) {
						// eslint-disable-next-line no-extra-parens
						curr.next = /** @type {NonNullable<typeof list.next>} */ (list.next);
						list.next = curr; // eslint-disable-line no-param-reassign
					}
					return curr;
				}
			}
		};

		/** @type {import('./list.d.ts').listGet} */
		var listGet = function (objects, key) {
			if (!objects) {
				return void undefined;
			}
			var node = listGetNode(objects, key);
			return node && node.value;
		};
		/** @type {import('./list.d.ts').listSet} */
		var listSet = function (objects, key, value) {
			var node = listGetNode(objects, key);
			if (node) {
				node.value = value;
			} else {
				// Prepend the new node to the beginning of the list
				objects.next = /** @type {import('./list.d.ts').ListNode<typeof value, typeof key>} */ ({ // eslint-disable-line no-param-reassign, no-extra-parens
					key: key,
					next: objects.next,
					value: value
				});
			}
		};
		/** @type {import('./list.d.ts').listHas} */
		var listHas = function (objects, key) {
			if (!objects) {
				return false;
			}
			return !!listGetNode(objects, key);
		};
		/** @type {import('./list.d.ts').listDelete} */
		// eslint-disable-next-line consistent-return
		var listDelete = function (objects, key) {
			if (objects) {
				return listGetNode(objects, key, true);
			}
		};

		/** @type {import('.')} */
		sideChannelList = function getSideChannelList() {
			/** @typedef {ReturnType<typeof getSideChannelList>} Channel */
			/** @typedef {Parameters<Channel['get']>[0]} K */
			/** @typedef {Parameters<Channel['set']>[1]} V */

			/** @type {import('./list.d.ts').RootNode<V, K> | undefined} */ var $o;

			/** @type {Channel} */
			var channel = {
				assert: function (key) {
					if (!channel.has(key)) {
						throw new $TypeError('Side channel does not contain ' + inspect(key));
					}
				},
				'delete': function (key) {
					var root = $o && $o.next;
					var deletedNode = listDelete($o, key);
					if (deletedNode && root && root === deletedNode) {
						$o = void undefined;
					}
					return !!deletedNode;
				},
				get: function (key) {
					return listGet($o, key);
				},
				has: function (key) {
					return listHas($o, key);
				},
				set: function (key, value) {
					if (!$o) {
						// Initialize the linked list as an empty node, so that we don't have to special-case handling of the first node: we can always refer to it as (previous node).next, instead of something like (list).head
						$o = {
							next: void undefined
						};
					}
					// eslint-disable-next-line no-extra-parens
					listSet(/** @type {NonNullable<typeof $o>} */ ($o), key, value);
				}
			};
			// @ts-expect-error TODO: figure out why this is erroring
			return channel;
		};
		return sideChannelList;
	}

	var esObjectAtoms;
	var hasRequiredEsObjectAtoms;

	function requireEsObjectAtoms () {
		if (hasRequiredEsObjectAtoms) return esObjectAtoms;
		hasRequiredEsObjectAtoms = 1;

		/** @type {import('.')} */
		esObjectAtoms = Object;
		return esObjectAtoms;
	}

	var esErrors;
	var hasRequiredEsErrors;

	function requireEsErrors () {
		if (hasRequiredEsErrors) return esErrors;
		hasRequiredEsErrors = 1;

		/** @type {import('.')} */
		esErrors = Error;
		return esErrors;
	}

	var _eval;
	var hasRequired_eval;

	function require_eval () {
		if (hasRequired_eval) return _eval;
		hasRequired_eval = 1;

		/** @type {import('./eval')} */
		_eval = EvalError;
		return _eval;
	}

	var range;
	var hasRequiredRange;

	function requireRange () {
		if (hasRequiredRange) return range;
		hasRequiredRange = 1;

		/** @type {import('./range')} */
		range = RangeError;
		return range;
	}

	var ref;
	var hasRequiredRef;

	function requireRef () {
		if (hasRequiredRef) return ref;
		hasRequiredRef = 1;

		/** @type {import('./ref')} */
		ref = ReferenceError;
		return ref;
	}

	var syntax;
	var hasRequiredSyntax;

	function requireSyntax () {
		if (hasRequiredSyntax) return syntax;
		hasRequiredSyntax = 1;

		/** @type {import('./syntax')} */
		syntax = SyntaxError;
		return syntax;
	}

	var uri;
	var hasRequiredUri;

	function requireUri () {
		if (hasRequiredUri) return uri;
		hasRequiredUri = 1;

		/** @type {import('./uri')} */
		uri = URIError;
		return uri;
	}

	var abs;
	var hasRequiredAbs;

	function requireAbs () {
		if (hasRequiredAbs) return abs;
		hasRequiredAbs = 1;

		/** @type {import('./abs')} */
		abs = Math.abs;
		return abs;
	}

	var floor;
	var hasRequiredFloor;

	function requireFloor () {
		if (hasRequiredFloor) return floor;
		hasRequiredFloor = 1;

		/** @type {import('./floor')} */
		floor = Math.floor;
		return floor;
	}

	var max;
	var hasRequiredMax;

	function requireMax () {
		if (hasRequiredMax) return max;
		hasRequiredMax = 1;

		/** @type {import('./max')} */
		max = Math.max;
		return max;
	}

	var min;
	var hasRequiredMin;

	function requireMin () {
		if (hasRequiredMin) return min;
		hasRequiredMin = 1;

		/** @type {import('./min')} */
		min = Math.min;
		return min;
	}

	var pow;
	var hasRequiredPow;

	function requirePow () {
		if (hasRequiredPow) return pow;
		hasRequiredPow = 1;

		/** @type {import('./pow')} */
		pow = Math.pow;
		return pow;
	}

	var round;
	var hasRequiredRound;

	function requireRound () {
		if (hasRequiredRound) return round;
		hasRequiredRound = 1;

		/** @type {import('./round')} */
		round = Math.round;
		return round;
	}

	var _isNaN;
	var hasRequired_isNaN;

	function require_isNaN () {
		if (hasRequired_isNaN) return _isNaN;
		hasRequired_isNaN = 1;

		/** @type {import('./isNaN')} */
		_isNaN = Number.isNaN || function isNaN(a) {
			return a !== a;
		};
		return _isNaN;
	}

	var sign;
	var hasRequiredSign;

	function requireSign () {
		if (hasRequiredSign) return sign;
		hasRequiredSign = 1;

		var $isNaN = /*@__PURE__*/ require_isNaN();

		/** @type {import('./sign')} */
		sign = function sign(number) {
			if ($isNaN(number) || number === 0) {
				return number;
			}
			return number < 0 ? -1 : 1;
		};
		return sign;
	}

	var gOPD;
	var hasRequiredGOPD;

	function requireGOPD () {
		if (hasRequiredGOPD) return gOPD;
		hasRequiredGOPD = 1;

		/** @type {import('./gOPD')} */
		gOPD = Object.getOwnPropertyDescriptor;
		return gOPD;
	}

	var gopd;
	var hasRequiredGopd;

	function requireGopd () {
		if (hasRequiredGopd) return gopd;
		hasRequiredGopd = 1;

		/** @type {import('.')} */
		var $gOPD = /*@__PURE__*/ requireGOPD();

		if ($gOPD) {
			try {
				$gOPD([], 'length');
			} catch (e) {
				// IE 8 has a broken gOPD
				$gOPD = null;
			}
		}

		gopd = $gOPD;
		return gopd;
	}

	var esDefineProperty;
	var hasRequiredEsDefineProperty;

	function requireEsDefineProperty () {
		if (hasRequiredEsDefineProperty) return esDefineProperty;
		hasRequiredEsDefineProperty = 1;

		/** @type {import('.')} */
		var $defineProperty = Object.defineProperty || false;
		if ($defineProperty) {
			try {
				$defineProperty({}, 'a', { value: 1 });
			} catch (e) {
				// IE 8 has a broken defineProperty
				$defineProperty = false;
			}
		}

		esDefineProperty = $defineProperty;
		return esDefineProperty;
	}

	var shams;
	var hasRequiredShams;

	function requireShams () {
		if (hasRequiredShams) return shams;
		hasRequiredShams = 1;

		/** @type {import('./shams')} */
		/* eslint complexity: [2, 18], max-statements: [2, 33] */
		shams = function hasSymbols() {
			if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
			if (typeof Symbol.iterator === 'symbol') { return true; }

			/** @type {{ [k in symbol]?: unknown }} */
			var obj = {};
			var sym = Symbol('test');
			var symObj = Object(sym);
			if (typeof sym === 'string') { return false; }

			if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
			if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

			// temp disabled per https://github.com/ljharb/object.assign/issues/17
			// if (sym instanceof Symbol) { return false; }
			// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
			// if (!(symObj instanceof Symbol)) { return false; }

			// if (typeof Symbol.prototype.toString !== 'function') { return false; }
			// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

			var symVal = 42;
			obj[sym] = symVal;
			for (var _ in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
			if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

			if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

			var syms = Object.getOwnPropertySymbols(obj);
			if (syms.length !== 1 || syms[0] !== sym) { return false; }

			if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

			if (typeof Object.getOwnPropertyDescriptor === 'function') {
				// eslint-disable-next-line no-extra-parens
				var descriptor = /** @type {PropertyDescriptor} */ (Object.getOwnPropertyDescriptor(obj, sym));
				if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
			}

			return true;
		};
		return shams;
	}

	var hasSymbols;
	var hasRequiredHasSymbols;

	function requireHasSymbols () {
		if (hasRequiredHasSymbols) return hasSymbols;
		hasRequiredHasSymbols = 1;

		var origSymbol = typeof Symbol !== 'undefined' && Symbol;
		var hasSymbolSham = requireShams();

		/** @type {import('.')} */
		hasSymbols = function hasNativeSymbols() {
			if (typeof origSymbol !== 'function') { return false; }
			if (typeof Symbol !== 'function') { return false; }
			if (typeof origSymbol('foo') !== 'symbol') { return false; }
			if (typeof Symbol('bar') !== 'symbol') { return false; }

			return hasSymbolSham();
		};
		return hasSymbols;
	}

	var Reflect_getPrototypeOf;
	var hasRequiredReflect_getPrototypeOf;

	function requireReflect_getPrototypeOf () {
		if (hasRequiredReflect_getPrototypeOf) return Reflect_getPrototypeOf;
		hasRequiredReflect_getPrototypeOf = 1;

		/** @type {import('./Reflect.getPrototypeOf')} */
		Reflect_getPrototypeOf = (typeof Reflect !== 'undefined' && Reflect.getPrototypeOf) || null;
		return Reflect_getPrototypeOf;
	}

	var Object_getPrototypeOf;
	var hasRequiredObject_getPrototypeOf;

	function requireObject_getPrototypeOf () {
		if (hasRequiredObject_getPrototypeOf) return Object_getPrototypeOf;
		hasRequiredObject_getPrototypeOf = 1;

		var $Object = /*@__PURE__*/ requireEsObjectAtoms();

		/** @type {import('./Object.getPrototypeOf')} */
		Object_getPrototypeOf = $Object.getPrototypeOf || null;
		return Object_getPrototypeOf;
	}

	var implementation;
	var hasRequiredImplementation;

	function requireImplementation () {
		if (hasRequiredImplementation) return implementation;
		hasRequiredImplementation = 1;

		/* eslint no-invalid-this: 1 */

		var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
		var toStr = Object.prototype.toString;
		var max = Math.max;
		var funcType = '[object Function]';

		var concatty = function concatty(a, b) {
		    var arr = [];

		    for (var i = 0; i < a.length; i += 1) {
		        arr[i] = a[i];
		    }
		    for (var j = 0; j < b.length; j += 1) {
		        arr[j + a.length] = b[j];
		    }

		    return arr;
		};

		var slicy = function slicy(arrLike, offset) {
		    var arr = [];
		    for (var i = offset, j = 0; i < arrLike.length; i += 1, j += 1) {
		        arr[j] = arrLike[i];
		    }
		    return arr;
		};

		var joiny = function (arr, joiner) {
		    var str = '';
		    for (var i = 0; i < arr.length; i += 1) {
		        str += arr[i];
		        if (i + 1 < arr.length) {
		            str += joiner;
		        }
		    }
		    return str;
		};

		implementation = function bind(that) {
		    var target = this;
		    if (typeof target !== 'function' || toStr.apply(target) !== funcType) {
		        throw new TypeError(ERROR_MESSAGE + target);
		    }
		    var args = slicy(arguments, 1);

		    var bound;
		    var binder = function () {
		        if (this instanceof bound) {
		            var result = target.apply(
		                this,
		                concatty(args, arguments)
		            );
		            if (Object(result) === result) {
		                return result;
		            }
		            return this;
		        }
		        return target.apply(
		            that,
		            concatty(args, arguments)
		        );

		    };

		    var boundLength = max(0, target.length - args.length);
		    var boundArgs = [];
		    for (var i = 0; i < boundLength; i++) {
		        boundArgs[i] = '$' + i;
		    }

		    bound = Function('binder', 'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);

		    if (target.prototype) {
		        var Empty = function Empty() {};
		        Empty.prototype = target.prototype;
		        bound.prototype = new Empty();
		        Empty.prototype = null;
		    }

		    return bound;
		};
		return implementation;
	}

	var functionBind;
	var hasRequiredFunctionBind;

	function requireFunctionBind () {
		if (hasRequiredFunctionBind) return functionBind;
		hasRequiredFunctionBind = 1;

		var implementation = requireImplementation();

		functionBind = Function.prototype.bind || implementation;
		return functionBind;
	}

	var functionCall;
	var hasRequiredFunctionCall;

	function requireFunctionCall () {
		if (hasRequiredFunctionCall) return functionCall;
		hasRequiredFunctionCall = 1;

		/** @type {import('./functionCall')} */
		functionCall = Function.prototype.call;
		return functionCall;
	}

	var functionApply;
	var hasRequiredFunctionApply;

	function requireFunctionApply () {
		if (hasRequiredFunctionApply) return functionApply;
		hasRequiredFunctionApply = 1;

		/** @type {import('./functionApply')} */
		functionApply = Function.prototype.apply;
		return functionApply;
	}

	var reflectApply;
	var hasRequiredReflectApply;

	function requireReflectApply () {
		if (hasRequiredReflectApply) return reflectApply;
		hasRequiredReflectApply = 1;

		/** @type {import('./reflectApply')} */
		reflectApply = typeof Reflect !== 'undefined' && Reflect && Reflect.apply;
		return reflectApply;
	}

	var actualApply;
	var hasRequiredActualApply;

	function requireActualApply () {
		if (hasRequiredActualApply) return actualApply;
		hasRequiredActualApply = 1;

		var bind = requireFunctionBind();

		var $apply = requireFunctionApply();
		var $call = requireFunctionCall();
		var $reflectApply = requireReflectApply();

		/** @type {import('./actualApply')} */
		actualApply = $reflectApply || bind.call($call, $apply);
		return actualApply;
	}

	var callBindApplyHelpers;
	var hasRequiredCallBindApplyHelpers;

	function requireCallBindApplyHelpers () {
		if (hasRequiredCallBindApplyHelpers) return callBindApplyHelpers;
		hasRequiredCallBindApplyHelpers = 1;

		var bind = requireFunctionBind();
		var $TypeError = /*@__PURE__*/ requireType();

		var $call = requireFunctionCall();
		var $actualApply = requireActualApply();

		/** @type {(args: [Function, thisArg?: unknown, ...args: unknown[]]) => Function} TODO FIXME, find a way to use import('.') */
		callBindApplyHelpers = function callBindBasic(args) {
			if (args.length < 1 || typeof args[0] !== 'function') {
				throw new $TypeError('a function is required');
			}
			return $actualApply(bind, $call, args);
		};
		return callBindApplyHelpers;
	}

	var get;
	var hasRequiredGet;

	function requireGet () {
		if (hasRequiredGet) return get;
		hasRequiredGet = 1;

		var callBind = requireCallBindApplyHelpers();
		var gOPD = /*@__PURE__*/ requireGopd();

		var hasProtoAccessor;
		try {
			// eslint-disable-next-line no-extra-parens, no-proto
			hasProtoAccessor = /** @type {{ __proto__?: typeof Array.prototype }} */ ([]).__proto__ === Array.prototype;
		} catch (e) {
			if (!e || typeof e !== 'object' || !('code' in e) || e.code !== 'ERR_PROTO_ACCESS') {
				throw e;
			}
		}

		// eslint-disable-next-line no-extra-parens
		var desc = !!hasProtoAccessor && gOPD && gOPD(Object.prototype, /** @type {keyof typeof Object.prototype} */ ('__proto__'));

		var $Object = Object;
		var $getPrototypeOf = $Object.getPrototypeOf;

		/** @type {import('./get')} */
		get = desc && typeof desc.get === 'function'
			? callBind([desc.get])
			: typeof $getPrototypeOf === 'function'
				? /** @type {import('./get')} */ function getDunder(value) {
					// eslint-disable-next-line eqeqeq
					return $getPrototypeOf(value == null ? value : $Object(value));
				}
				: false;
		return get;
	}

	var getProto;
	var hasRequiredGetProto;

	function requireGetProto () {
		if (hasRequiredGetProto) return getProto;
		hasRequiredGetProto = 1;

		var reflectGetProto = requireReflect_getPrototypeOf();
		var originalGetProto = requireObject_getPrototypeOf();

		var getDunderProto = /*@__PURE__*/ requireGet();

		/** @type {import('.')} */
		getProto = reflectGetProto
			? function getProto(O) {
				// @ts-expect-error TS can't narrow inside a closure, for some reason
				return reflectGetProto(O);
			}
			: originalGetProto
				? function getProto(O) {
					if (!O || (typeof O !== 'object' && typeof O !== 'function')) {
						throw new TypeError('getProto: not an object');
					}
					// @ts-expect-error TS can't narrow inside a closure, for some reason
					return originalGetProto(O);
				}
				: getDunderProto
					? function getProto(O) {
						// @ts-expect-error TS can't narrow inside a closure, for some reason
						return getDunderProto(O);
					}
					: null;
		return getProto;
	}

	var hasown;
	var hasRequiredHasown;

	function requireHasown () {
		if (hasRequiredHasown) return hasown;
		hasRequiredHasown = 1;

		var call = Function.prototype.call;
		var $hasOwn = Object.prototype.hasOwnProperty;
		var bind = requireFunctionBind();

		/** @type {import('.')} */
		hasown = bind.call(call, $hasOwn);
		return hasown;
	}

	var getIntrinsic;
	var hasRequiredGetIntrinsic;

	function requireGetIntrinsic () {
		if (hasRequiredGetIntrinsic) return getIntrinsic;
		hasRequiredGetIntrinsic = 1;

		var undefined$1;

		var $Object = /*@__PURE__*/ requireEsObjectAtoms();

		var $Error = /*@__PURE__*/ requireEsErrors();
		var $EvalError = /*@__PURE__*/ require_eval();
		var $RangeError = /*@__PURE__*/ requireRange();
		var $ReferenceError = /*@__PURE__*/ requireRef();
		var $SyntaxError = /*@__PURE__*/ requireSyntax();
		var $TypeError = /*@__PURE__*/ requireType();
		var $URIError = /*@__PURE__*/ requireUri();

		var abs = /*@__PURE__*/ requireAbs();
		var floor = /*@__PURE__*/ requireFloor();
		var max = /*@__PURE__*/ requireMax();
		var min = /*@__PURE__*/ requireMin();
		var pow = /*@__PURE__*/ requirePow();
		var round = /*@__PURE__*/ requireRound();
		var sign = /*@__PURE__*/ requireSign();

		var $Function = Function;

		// eslint-disable-next-line consistent-return
		var getEvalledConstructor = function (expressionSyntax) {
			try {
				return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
			} catch (e) {}
		};

		var $gOPD = /*@__PURE__*/ requireGopd();
		var $defineProperty = /*@__PURE__*/ requireEsDefineProperty();

		var throwTypeError = function () {
			throw new $TypeError();
		};
		var ThrowTypeError = $gOPD
			? (function () {
				try {
					// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
					arguments.callee; // IE 8 does not throw here
					return throwTypeError;
				} catch (calleeThrows) {
					try {
						// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
						return $gOPD(arguments, 'callee').get;
					} catch (gOPDthrows) {
						return throwTypeError;
					}
				}
			}())
			: throwTypeError;

		var hasSymbols = requireHasSymbols()();

		var getProto = requireGetProto();
		var $ObjectGPO = requireObject_getPrototypeOf();
		var $ReflectGPO = requireReflect_getPrototypeOf();

		var $apply = requireFunctionApply();
		var $call = requireFunctionCall();

		var needsEval = {};

		var TypedArray = typeof Uint8Array === 'undefined' || !getProto ? undefined$1 : getProto(Uint8Array);

		var INTRINSICS = {
			__proto__: null,
			'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
			'%Array%': Array,
			'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
			'%ArrayIteratorPrototype%': hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined$1,
			'%AsyncFromSyncIteratorPrototype%': undefined$1,
			'%AsyncFunction%': needsEval,
			'%AsyncGenerator%': needsEval,
			'%AsyncGeneratorFunction%': needsEval,
			'%AsyncIteratorPrototype%': needsEval,
			'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
			'%BigInt%': typeof BigInt === 'undefined' ? undefined$1 : BigInt,
			'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined$1 : BigInt64Array,
			'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined$1 : BigUint64Array,
			'%Boolean%': Boolean,
			'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
			'%Date%': Date,
			'%decodeURI%': decodeURI,
			'%decodeURIComponent%': decodeURIComponent,
			'%encodeURI%': encodeURI,
			'%encodeURIComponent%': encodeURIComponent,
			'%Error%': $Error,
			'%eval%': eval, // eslint-disable-line no-eval
			'%EvalError%': $EvalError,
			'%Float16Array%': typeof Float16Array === 'undefined' ? undefined$1 : Float16Array,
			'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
			'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
			'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$1 : FinalizationRegistry,
			'%Function%': $Function,
			'%GeneratorFunction%': needsEval,
			'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
			'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
			'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
			'%isFinite%': isFinite,
			'%isNaN%': isNaN,
			'%IteratorPrototype%': hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
			'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
			'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
			'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols || !getProto ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
			'%Math%': Math,
			'%Number%': Number,
			'%Object%': $Object,
			'%Object.getOwnPropertyDescriptor%': $gOPD,
			'%parseFloat%': parseFloat,
			'%parseInt%': parseInt,
			'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
			'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
			'%RangeError%': $RangeError,
			'%ReferenceError%': $ReferenceError,
			'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
			'%RegExp%': RegExp,
			'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
			'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols || !getProto ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
			'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
			'%String%': String,
			'%StringIteratorPrototype%': hasSymbols && getProto ? getProto(''[Symbol.iterator]()) : undefined$1,
			'%Symbol%': hasSymbols ? Symbol : undefined$1,
			'%SyntaxError%': $SyntaxError,
			'%ThrowTypeError%': ThrowTypeError,
			'%TypedArray%': TypedArray,
			'%TypeError%': $TypeError,
			'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
			'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
			'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
			'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
			'%URIError%': $URIError,
			'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
			'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$1 : WeakRef,
			'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet,

			'%Function.prototype.call%': $call,
			'%Function.prototype.apply%': $apply,
			'%Object.defineProperty%': $defineProperty,
			'%Object.getPrototypeOf%': $ObjectGPO,
			'%Math.abs%': abs,
			'%Math.floor%': floor,
			'%Math.max%': max,
			'%Math.min%': min,
			'%Math.pow%': pow,
			'%Math.round%': round,
			'%Math.sign%': sign,
			'%Reflect.getPrototypeOf%': $ReflectGPO
		};

		if (getProto) {
			try {
				null.error; // eslint-disable-line no-unused-expressions
			} catch (e) {
				// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
				var errorProto = getProto(getProto(e));
				INTRINSICS['%Error.prototype%'] = errorProto;
			}
		}

		var doEval = function doEval(name) {
			var value;
			if (name === '%AsyncFunction%') {
				value = getEvalledConstructor('async function () {}');
			} else if (name === '%GeneratorFunction%') {
				value = getEvalledConstructor('function* () {}');
			} else if (name === '%AsyncGeneratorFunction%') {
				value = getEvalledConstructor('async function* () {}');
			} else if (name === '%AsyncGenerator%') {
				var fn = doEval('%AsyncGeneratorFunction%');
				if (fn) {
					value = fn.prototype;
				}
			} else if (name === '%AsyncIteratorPrototype%') {
				var gen = doEval('%AsyncGenerator%');
				if (gen && getProto) {
					value = getProto(gen.prototype);
				}
			}

			INTRINSICS[name] = value;

			return value;
		};

		var LEGACY_ALIASES = {
			__proto__: null,
			'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
			'%ArrayPrototype%': ['Array', 'prototype'],
			'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
			'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
			'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
			'%ArrayProto_values%': ['Array', 'prototype', 'values'],
			'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
			'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
			'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
			'%BooleanPrototype%': ['Boolean', 'prototype'],
			'%DataViewPrototype%': ['DataView', 'prototype'],
			'%DatePrototype%': ['Date', 'prototype'],
			'%ErrorPrototype%': ['Error', 'prototype'],
			'%EvalErrorPrototype%': ['EvalError', 'prototype'],
			'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
			'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
			'%FunctionPrototype%': ['Function', 'prototype'],
			'%Generator%': ['GeneratorFunction', 'prototype'],
			'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
			'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
			'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
			'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
			'%JSONParse%': ['JSON', 'parse'],
			'%JSONStringify%': ['JSON', 'stringify'],
			'%MapPrototype%': ['Map', 'prototype'],
			'%NumberPrototype%': ['Number', 'prototype'],
			'%ObjectPrototype%': ['Object', 'prototype'],
			'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
			'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
			'%PromisePrototype%': ['Promise', 'prototype'],
			'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
			'%Promise_all%': ['Promise', 'all'],
			'%Promise_reject%': ['Promise', 'reject'],
			'%Promise_resolve%': ['Promise', 'resolve'],
			'%RangeErrorPrototype%': ['RangeError', 'prototype'],
			'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
			'%RegExpPrototype%': ['RegExp', 'prototype'],
			'%SetPrototype%': ['Set', 'prototype'],
			'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
			'%StringPrototype%': ['String', 'prototype'],
			'%SymbolPrototype%': ['Symbol', 'prototype'],
			'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
			'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
			'%TypeErrorPrototype%': ['TypeError', 'prototype'],
			'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
			'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
			'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
			'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
			'%URIErrorPrototype%': ['URIError', 'prototype'],
			'%WeakMapPrototype%': ['WeakMap', 'prototype'],
			'%WeakSetPrototype%': ['WeakSet', 'prototype']
		};

		var bind = requireFunctionBind();
		var hasOwn = /*@__PURE__*/ requireHasown();
		var $concat = bind.call($call, Array.prototype.concat);
		var $spliceApply = bind.call($apply, Array.prototype.splice);
		var $replace = bind.call($call, String.prototype.replace);
		var $strSlice = bind.call($call, String.prototype.slice);
		var $exec = bind.call($call, RegExp.prototype.exec);

		/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
		var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
		var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
		var stringToPath = function stringToPath(string) {
			var first = $strSlice(string, 0, 1);
			var last = $strSlice(string, -1);
			if (first === '%' && last !== '%') {
				throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
			} else if (last === '%' && first !== '%') {
				throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
			}
			var result = [];
			$replace(string, rePropName, function (match, number, quote, subString) {
				result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
			});
			return result;
		};
		/* end adaptation */

		var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
			var intrinsicName = name;
			var alias;
			if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
				alias = LEGACY_ALIASES[intrinsicName];
				intrinsicName = '%' + alias[0] + '%';
			}

			if (hasOwn(INTRINSICS, intrinsicName)) {
				var value = INTRINSICS[intrinsicName];
				if (value === needsEval) {
					value = doEval(intrinsicName);
				}
				if (typeof value === 'undefined' && !allowMissing) {
					throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
				}

				return {
					alias: alias,
					name: intrinsicName,
					value: value
				};
			}

			throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
		};

		getIntrinsic = function GetIntrinsic(name, allowMissing) {
			if (typeof name !== 'string' || name.length === 0) {
				throw new $TypeError('intrinsic name must be a non-empty string');
			}
			if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
				throw new $TypeError('"allowMissing" argument must be a boolean');
			}

			if ($exec(/^%?[^%]*%?$/, name) === null) {
				throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
			}
			var parts = stringToPath(name);
			var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

			var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
			var intrinsicRealName = intrinsic.name;
			var value = intrinsic.value;
			var skipFurtherCaching = false;

			var alias = intrinsic.alias;
			if (alias) {
				intrinsicBaseName = alias[0];
				$spliceApply(parts, $concat([0, 1], alias));
			}

			for (var i = 1, isOwn = true; i < parts.length; i += 1) {
				var part = parts[i];
				var first = $strSlice(part, 0, 1);
				var last = $strSlice(part, -1);
				if (
					(
						(first === '"' || first === "'" || first === '`')
						|| (last === '"' || last === "'" || last === '`')
					)
					&& first !== last
				) {
					throw new $SyntaxError('property names with quotes must have matching quotes');
				}
				if (part === 'constructor' || !isOwn) {
					skipFurtherCaching = true;
				}

				intrinsicBaseName += '.' + part;
				intrinsicRealName = '%' + intrinsicBaseName + '%';

				if (hasOwn(INTRINSICS, intrinsicRealName)) {
					value = INTRINSICS[intrinsicRealName];
				} else if (value != null) {
					if (!(part in value)) {
						if (!allowMissing) {
							throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
						}
						return void undefined$1;
					}
					if ($gOPD && (i + 1) >= parts.length) {
						var desc = $gOPD(value, part);
						isOwn = !!desc;

						// By convention, when a data property is converted to an accessor
						// property to emulate a data property that does not suffer from
						// the override mistake, that accessor's getter is marked with
						// an `originalValue` property. Here, when we detect this, we
						// uphold the illusion by pretending to see that original data
						// property, i.e., returning the value rather than the getter
						// itself.
						if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
							value = desc.get;
						} else {
							value = value[part];
						}
					} else {
						isOwn = hasOwn(value, part);
						value = value[part];
					}

					if (isOwn && !skipFurtherCaching) {
						INTRINSICS[intrinsicRealName] = value;
					}
				}
			}
			return value;
		};
		return getIntrinsic;
	}

	var callBound;
	var hasRequiredCallBound;

	function requireCallBound () {
		if (hasRequiredCallBound) return callBound;
		hasRequiredCallBound = 1;

		var GetIntrinsic = /*@__PURE__*/ requireGetIntrinsic();

		var callBindBasic = requireCallBindApplyHelpers();

		/** @type {(thisArg: string, searchString: string, position?: number) => number} */
		var $indexOf = callBindBasic([GetIntrinsic('%String.prototype.indexOf%')]);

		/** @type {import('.')} */
		callBound = function callBoundIntrinsic(name, allowMissing) {
			/* eslint no-extra-parens: 0 */

			var intrinsic = /** @type {(this: unknown, ...args: unknown[]) => unknown} */ (GetIntrinsic(name, !!allowMissing));
			if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
				return callBindBasic(/** @type {const} */ ([intrinsic]));
			}
			return intrinsic;
		};
		return callBound;
	}

	var sideChannelMap;
	var hasRequiredSideChannelMap;

	function requireSideChannelMap () {
		if (hasRequiredSideChannelMap) return sideChannelMap;
		hasRequiredSideChannelMap = 1;

		var GetIntrinsic = /*@__PURE__*/ requireGetIntrinsic();
		var callBound = /*@__PURE__*/ requireCallBound();
		var inspect = /*@__PURE__*/ requireObjectInspect();

		var $TypeError = /*@__PURE__*/ requireType();
		var $Map = GetIntrinsic('%Map%', true);

		/** @type {<K, V>(thisArg: Map<K, V>, key: K) => V} */
		var $mapGet = callBound('Map.prototype.get', true);
		/** @type {<K, V>(thisArg: Map<K, V>, key: K, value: V) => void} */
		var $mapSet = callBound('Map.prototype.set', true);
		/** @type {<K, V>(thisArg: Map<K, V>, key: K) => boolean} */
		var $mapHas = callBound('Map.prototype.has', true);
		/** @type {<K, V>(thisArg: Map<K, V>, key: K) => boolean} */
		var $mapDelete = callBound('Map.prototype.delete', true);
		/** @type {<K, V>(thisArg: Map<K, V>) => number} */
		var $mapSize = callBound('Map.prototype.size', true);

		/** @type {import('.')} */
		sideChannelMap = !!$Map && /** @type {Exclude<import('.'), false>} */ function getSideChannelMap() {
			/** @typedef {ReturnType<typeof getSideChannelMap>} Channel */
			/** @typedef {Parameters<Channel['get']>[0]} K */
			/** @typedef {Parameters<Channel['set']>[1]} V */

			/** @type {Map<K, V> | undefined} */ var $m;

			/** @type {Channel} */
			var channel = {
				assert: function (key) {
					if (!channel.has(key)) {
						throw new $TypeError('Side channel does not contain ' + inspect(key));
					}
				},
				'delete': function (key) {
					if ($m) {
						var result = $mapDelete($m, key);
						if ($mapSize($m) === 0) {
							$m = void undefined;
						}
						return result;
					}
					return false;
				},
				get: function (key) { // eslint-disable-line consistent-return
					if ($m) {
						return $mapGet($m, key);
					}
				},
				has: function (key) {
					if ($m) {
						return $mapHas($m, key);
					}
					return false;
				},
				set: function (key, value) {
					if (!$m) {
						// @ts-expect-error TS can't handle narrowing a variable inside a closure
						$m = new $Map();
					}
					$mapSet($m, key, value);
				}
			};

			// @ts-expect-error TODO: figure out why TS is erroring here
			return channel;
		};
		return sideChannelMap;
	}

	var sideChannelWeakmap;
	var hasRequiredSideChannelWeakmap;

	function requireSideChannelWeakmap () {
		if (hasRequiredSideChannelWeakmap) return sideChannelWeakmap;
		hasRequiredSideChannelWeakmap = 1;

		var GetIntrinsic = /*@__PURE__*/ requireGetIntrinsic();
		var callBound = /*@__PURE__*/ requireCallBound();
		var inspect = /*@__PURE__*/ requireObjectInspect();
		var getSideChannelMap = requireSideChannelMap();

		var $TypeError = /*@__PURE__*/ requireType();
		var $WeakMap = GetIntrinsic('%WeakMap%', true);

		/** @type {<K extends object, V>(thisArg: WeakMap<K, V>, key: K) => V} */
		var $weakMapGet = callBound('WeakMap.prototype.get', true);
		/** @type {<K extends object, V>(thisArg: WeakMap<K, V>, key: K, value: V) => void} */
		var $weakMapSet = callBound('WeakMap.prototype.set', true);
		/** @type {<K extends object, V>(thisArg: WeakMap<K, V>, key: K) => boolean} */
		var $weakMapHas = callBound('WeakMap.prototype.has', true);
		/** @type {<K extends object, V>(thisArg: WeakMap<K, V>, key: K) => boolean} */
		var $weakMapDelete = callBound('WeakMap.prototype.delete', true);

		/** @type {import('.')} */
		sideChannelWeakmap = $WeakMap
			? /** @type {Exclude<import('.'), false>} */ function getSideChannelWeakMap() {
				/** @typedef {ReturnType<typeof getSideChannelWeakMap>} Channel */
				/** @typedef {Parameters<Channel['get']>[0]} K */
				/** @typedef {Parameters<Channel['set']>[1]} V */

				/** @type {WeakMap<K & object, V> | undefined} */ var $wm;
				/** @type {Channel | undefined} */ var $m;

				/** @type {Channel} */
				var channel = {
					assert: function (key) {
						if (!channel.has(key)) {
							throw new $TypeError('Side channel does not contain ' + inspect(key));
						}
					},
					'delete': function (key) {
						if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
							if ($wm) {
								return $weakMapDelete($wm, key);
							}
						} else if (getSideChannelMap) {
							if ($m) {
								return $m['delete'](key);
							}
						}
						return false;
					},
					get: function (key) {
						if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
							if ($wm) {
								return $weakMapGet($wm, key);
							}
						}
						return $m && $m.get(key);
					},
					has: function (key) {
						if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
							if ($wm) {
								return $weakMapHas($wm, key);
							}
						}
						return !!$m && $m.has(key);
					},
					set: function (key, value) {
						if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
							if (!$wm) {
								$wm = new $WeakMap();
							}
							$weakMapSet($wm, key, value);
						} else if (getSideChannelMap) {
							if (!$m) {
								$m = getSideChannelMap();
							}
							// eslint-disable-next-line no-extra-parens
							/** @type {NonNullable<typeof $m>} */ ($m).set(key, value);
						}
					}
				};

				// @ts-expect-error TODO: figure out why this is erroring
				return channel;
			}
			: getSideChannelMap;
		return sideChannelWeakmap;
	}

	var sideChannel;
	var hasRequiredSideChannel;

	function requireSideChannel () {
		if (hasRequiredSideChannel) return sideChannel;
		hasRequiredSideChannel = 1;

		var $TypeError = /*@__PURE__*/ requireType();
		var inspect = /*@__PURE__*/ requireObjectInspect();
		var getSideChannelList = requireSideChannelList();
		var getSideChannelMap = requireSideChannelMap();
		var getSideChannelWeakMap = requireSideChannelWeakmap();

		var makeChannel = getSideChannelWeakMap || getSideChannelMap || getSideChannelList;

		/** @type {import('.')} */
		sideChannel = function getSideChannel() {
			/** @typedef {ReturnType<typeof getSideChannel>} Channel */

			/** @type {Channel | undefined} */ var $channelData;

			/** @type {Channel} */
			var channel = {
				assert: function (key) {
					if (!channel.has(key)) {
						throw new $TypeError('Side channel does not contain ' + inspect(key));
					}
				},
				'delete': function (key) {
					return !!$channelData && $channelData['delete'](key);
				},
				get: function (key) {
					return $channelData && $channelData.get(key);
				},
				has: function (key) {
					return !!$channelData && $channelData.has(key);
				},
				set: function (key, value) {
					if (!$channelData) {
						$channelData = makeChannel();
					}

					$channelData.set(key, value);
				}
			};
			// @ts-expect-error TODO: figure out why this is erroring
			return channel;
		};
		return sideChannel;
	}

	var formats;
	var hasRequiredFormats;

	function requireFormats () {
		if (hasRequiredFormats) return formats;
		hasRequiredFormats = 1;

		var replace = String.prototype.replace;
		var percentTwenties = /%20/g;

		var Format = {
		    RFC1738: 'RFC1738',
		    RFC3986: 'RFC3986'
		};

		formats = {
		    'default': Format.RFC3986,
		    formatters: {
		        RFC1738: function (value) {
		            return replace.call(value, percentTwenties, '+');
		        },
		        RFC3986: function (value) {
		            return String(value);
		        }
		    },
		    RFC1738: Format.RFC1738,
		    RFC3986: Format.RFC3986
		};
		return formats;
	}

	var utils;
	var hasRequiredUtils;

	function requireUtils () {
		if (hasRequiredUtils) return utils;
		hasRequiredUtils = 1;

		var formats = /*@__PURE__*/ requireFormats();
		var getSideChannel = requireSideChannel();

		var has = Object.prototype.hasOwnProperty;
		var isArray = Array.isArray;

		// Track objects created from arrayLimit overflow using side-channel
		// Stores the current max numeric index for O(1) lookup
		var overflowChannel = getSideChannel();

		var markOverflow = function markOverflow(obj, maxIndex) {
		    overflowChannel.set(obj, maxIndex);
		    return obj;
		};

		var isOverflow = function isOverflow(obj) {
		    return overflowChannel.has(obj);
		};

		var getMaxIndex = function getMaxIndex(obj) {
		    return overflowChannel.get(obj);
		};

		var setMaxIndex = function setMaxIndex(obj, maxIndex) {
		    overflowChannel.set(obj, maxIndex);
		};

		var hexTable = (function () {
		    var array = [];
		    for (var i = 0; i < 256; ++i) {
		        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
		    }

		    return array;
		}());

		var compactQueue = function compactQueue(queue) {
		    while (queue.length > 1) {
		        var item = queue.pop();
		        var obj = item.obj[item.prop];

		        if (isArray(obj)) {
		            var compacted = [];

		            for (var j = 0; j < obj.length; ++j) {
		                if (typeof obj[j] !== 'undefined') {
		                    compacted.push(obj[j]);
		                }
		            }

		            item.obj[item.prop] = compacted;
		        }
		    }
		};

		var arrayToObject = function arrayToObject(source, options) {
		    var obj = options && options.plainObjects ? { __proto__: null } : {};
		    for (var i = 0; i < source.length; ++i) {
		        if (typeof source[i] !== 'undefined') {
		            obj[i] = source[i];
		        }
		    }

		    return obj;
		};

		var merge = function merge(target, source, options) {
		    /* eslint no-param-reassign: 0 */
		    if (!source) {
		        return target;
		    }

		    if (typeof source !== 'object' && typeof source !== 'function') {
		        if (isArray(target)) {
		            target.push(source);
		        } else if (target && typeof target === 'object') {
		            if (isOverflow(target)) {
		                // Add at next numeric index for overflow objects
		                var newIndex = getMaxIndex(target) + 1;
		                target[newIndex] = source;
		                setMaxIndex(target, newIndex);
		            } else if (
		                (options && (options.plainObjects || options.allowPrototypes))
		                || !has.call(Object.prototype, source)
		            ) {
		                target[source] = true;
		            }
		        } else {
		            return [target, source];
		        }

		        return target;
		    }

		    if (!target || typeof target !== 'object') {
		        if (isOverflow(source)) {
		            // Create new object with target at 0, source values shifted by 1
		            var sourceKeys = Object.keys(source);
		            var result = options && options.plainObjects
		                ? { __proto__: null, 0: target }
		                : { 0: target };
		            for (var m = 0; m < sourceKeys.length; m++) {
		                var oldKey = parseInt(sourceKeys[m], 10);
		                result[oldKey + 1] = source[sourceKeys[m]];
		            }
		            return markOverflow(result, getMaxIndex(source) + 1);
		        }
		        return [target].concat(source);
		    }

		    var mergeTarget = target;
		    if (isArray(target) && !isArray(source)) {
		        mergeTarget = arrayToObject(target, options);
		    }

		    if (isArray(target) && isArray(source)) {
		        source.forEach(function (item, i) {
		            if (has.call(target, i)) {
		                var targetItem = target[i];
		                if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
		                    target[i] = merge(targetItem, item, options);
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

		        if (has.call(acc, key)) {
		            acc[key] = merge(acc[key], value, options);
		        } else {
		            acc[key] = value;
		        }
		        return acc;
		    }, mergeTarget);
		};

		var assign = function assignSingleSource(target, source) {
		    return Object.keys(source).reduce(function (acc, key) {
		        acc[key] = source[key];
		        return acc;
		    }, target);
		};

		var decode = function (str, defaultDecoder, charset) {
		    var strWithoutPlus = str.replace(/\+/g, ' ');
		    if (charset === 'iso-8859-1') {
		        // unescape never throws, no try...catch needed:
		        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
		    }
		    // utf-8
		    try {
		        return decodeURIComponent(strWithoutPlus);
		    } catch (e) {
		        return strWithoutPlus;
		    }
		};

		var limit = 1024;

		/* eslint operator-linebreak: [2, "before"] */

		var encode = function encode(str, defaultEncoder, charset, kind, format) {
		    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
		    // It has been adapted here for stricter adherence to RFC 3986
		    if (str.length === 0) {
		        return str;
		    }

		    var string = str;
		    if (typeof str === 'symbol') {
		        string = Symbol.prototype.toString.call(str);
		    } else if (typeof str !== 'string') {
		        string = String(str);
		    }

		    if (charset === 'iso-8859-1') {
		        return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
		            return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
		        });
		    }

		    var out = '';
		    for (var j = 0; j < string.length; j += limit) {
		        var segment = string.length >= limit ? string.slice(j, j + limit) : string;
		        var arr = [];

		        for (var i = 0; i < segment.length; ++i) {
		            var c = segment.charCodeAt(i);
		            if (
		                c === 0x2D // -
		                || c === 0x2E // .
		                || c === 0x5F // _
		                || c === 0x7E // ~
		                || (c >= 0x30 && c <= 0x39) // 0-9
		                || (c >= 0x41 && c <= 0x5A) // a-z
		                || (c >= 0x61 && c <= 0x7A) // A-Z
		                || (format === formats.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
		            ) {
		                arr[arr.length] = segment.charAt(i);
		                continue;
		            }

		            if (c < 0x80) {
		                arr[arr.length] = hexTable[c];
		                continue;
		            }

		            if (c < 0x800) {
		                arr[arr.length] = hexTable[0xC0 | (c >> 6)]
		                    + hexTable[0x80 | (c & 0x3F)];
		                continue;
		            }

		            if (c < 0xD800 || c >= 0xE000) {
		                arr[arr.length] = hexTable[0xE0 | (c >> 12)]
		                    + hexTable[0x80 | ((c >> 6) & 0x3F)]
		                    + hexTable[0x80 | (c & 0x3F)];
		                continue;
		            }

		            i += 1;
		            c = 0x10000 + (((c & 0x3FF) << 10) | (segment.charCodeAt(i) & 0x3FF));

		            arr[arr.length] = hexTable[0xF0 | (c >> 18)]
		                + hexTable[0x80 | ((c >> 12) & 0x3F)]
		                + hexTable[0x80 | ((c >> 6) & 0x3F)]
		                + hexTable[0x80 | (c & 0x3F)];
		        }

		        out += arr.join('');
		    }

		    return out;
		};

		var compact = function compact(value) {
		    var queue = [{ obj: { o: value }, prop: 'o' }];
		    var refs = [];

		    for (var i = 0; i < queue.length; ++i) {
		        var item = queue[i];
		        var obj = item.obj[item.prop];

		        var keys = Object.keys(obj);
		        for (var j = 0; j < keys.length; ++j) {
		            var key = keys[j];
		            var val = obj[key];
		            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
		                queue.push({ obj: obj, prop: key });
		                refs.push(val);
		            }
		        }
		    }

		    compactQueue(queue);

		    return value;
		};

		var isRegExp = function isRegExp(obj) {
		    return Object.prototype.toString.call(obj) === '[object RegExp]';
		};

		var isBuffer = function isBuffer(obj) {
		    if (!obj || typeof obj !== 'object') {
		        return false;
		    }

		    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
		};

		var combine = function combine(a, b, arrayLimit, plainObjects) {
		    // If 'a' is already an overflow object, add to it
		    if (isOverflow(a)) {
		        var newIndex = getMaxIndex(a) + 1;
		        a[newIndex] = b;
		        setMaxIndex(a, newIndex);
		        return a;
		    }

		    var result = [].concat(a, b);
		    if (result.length > arrayLimit) {
		        return markOverflow(arrayToObject(result, { plainObjects: plainObjects }), result.length - 1);
		    }
		    return result;
		};

		var maybeMap = function maybeMap(val, fn) {
		    if (isArray(val)) {
		        var mapped = [];
		        for (var i = 0; i < val.length; i += 1) {
		            mapped.push(fn(val[i]));
		        }
		        return mapped;
		    }
		    return fn(val);
		};

		utils = {
		    arrayToObject: arrayToObject,
		    assign: assign,
		    combine: combine,
		    compact: compact,
		    decode: decode,
		    encode: encode,
		    isBuffer: isBuffer,
		    isOverflow: isOverflow,
		    isRegExp: isRegExp,
		    maybeMap: maybeMap,
		    merge: merge
		};
		return utils;
	}

	var stringify_1;
	var hasRequiredStringify;

	function requireStringify () {
		if (hasRequiredStringify) return stringify_1;
		hasRequiredStringify = 1;

		var getSideChannel = requireSideChannel();
		var utils = /*@__PURE__*/ requireUtils();
		var formats = /*@__PURE__*/ requireFormats();
		var has = Object.prototype.hasOwnProperty;

		var arrayPrefixGenerators = {
		    brackets: function brackets(prefix) {
		        return prefix + '[]';
		    },
		    comma: 'comma',
		    indices: function indices(prefix, key) {
		        return prefix + '[' + key + ']';
		    },
		    repeat: function repeat(prefix) {
		        return prefix;
		    }
		};

		var isArray = Array.isArray;
		var push = Array.prototype.push;
		var pushToArray = function (arr, valueOrArray) {
		    push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
		};

		var toISO = Date.prototype.toISOString;

		var defaultFormat = formats['default'];
		var defaults = {
		    addQueryPrefix: false,
		    allowDots: false,
		    allowEmptyArrays: false,
		    arrayFormat: 'indices',
		    charset: 'utf-8',
		    charsetSentinel: false,
		    commaRoundTrip: false,
		    delimiter: '&',
		    encode: true,
		    encodeDotInKeys: false,
		    encoder: utils.encode,
		    encodeValuesOnly: false,
		    filter: void undefined,
		    format: defaultFormat,
		    formatter: formats.formatters[defaultFormat],
		    // deprecated
		    indices: false,
		    serializeDate: function serializeDate(date) {
		        return toISO.call(date);
		    },
		    skipNulls: false,
		    strictNullHandling: false
		};

		var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
		    return typeof v === 'string'
		        || typeof v === 'number'
		        || typeof v === 'boolean'
		        || typeof v === 'symbol'
		        || typeof v === 'bigint';
		};

		var sentinel = {};

		var stringify = function stringify(
		    object,
		    prefix,
		    generateArrayPrefix,
		    commaRoundTrip,
		    allowEmptyArrays,
		    strictNullHandling,
		    skipNulls,
		    encodeDotInKeys,
		    encoder,
		    filter,
		    sort,
		    allowDots,
		    serializeDate,
		    format,
		    formatter,
		    encodeValuesOnly,
		    charset,
		    sideChannel
		) {
		    var obj = object;

		    var tmpSc = sideChannel;
		    var step = 0;
		    var findFlag = false;
		    while ((tmpSc = tmpSc.get(sentinel)) !== void undefined && !findFlag) {
		        // Where object last appeared in the ref tree
		        var pos = tmpSc.get(object);
		        step += 1;
		        if (typeof pos !== 'undefined') {
		            if (pos === step) {
		                throw new RangeError('Cyclic object value');
		            } else {
		                findFlag = true; // Break while
		            }
		        }
		        if (typeof tmpSc.get(sentinel) === 'undefined') {
		            step = 0;
		        }
		    }

		    if (typeof filter === 'function') {
		        obj = filter(prefix, obj);
		    } else if (obj instanceof Date) {
		        obj = serializeDate(obj);
		    } else if (generateArrayPrefix === 'comma' && isArray(obj)) {
		        obj = utils.maybeMap(obj, function (value) {
		            if (value instanceof Date) {
		                return serializeDate(value);
		            }
		            return value;
		        });
		    }

		    if (obj === null) {
		        if (strictNullHandling) {
		            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, 'key', format) : prefix;
		        }

		        obj = '';
		    }

		    if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
		        if (encoder) {
		            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, 'key', format);
		            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value', format))];
		        }
		        return [formatter(prefix) + '=' + formatter(String(obj))];
		    }

		    var values = [];

		    if (typeof obj === 'undefined') {
		        return values;
		    }

		    var objKeys;
		    if (generateArrayPrefix === 'comma' && isArray(obj)) {
		        // we need to join elements in
		        if (encodeValuesOnly && encoder) {
		            obj = utils.maybeMap(obj, encoder);
		        }
		        objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : void undefined }];
		    } else if (isArray(filter)) {
		        objKeys = filter;
		    } else {
		        var keys = Object.keys(obj);
		        objKeys = sort ? keys.sort(sort) : keys;
		    }

		    var encodedPrefix = encodeDotInKeys ? String(prefix).replace(/\./g, '%2E') : String(prefix);

		    var adjustedPrefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? encodedPrefix + '[]' : encodedPrefix;

		    if (allowEmptyArrays && isArray(obj) && obj.length === 0) {
		        return adjustedPrefix + '[]';
		    }

		    for (var j = 0; j < objKeys.length; ++j) {
		        var key = objKeys[j];
		        var value = typeof key === 'object' && key && typeof key.value !== 'undefined'
		            ? key.value
		            : obj[key];

		        if (skipNulls && value === null) {
		            continue;
		        }

		        var encodedKey = allowDots && encodeDotInKeys ? String(key).replace(/\./g, '%2E') : String(key);
		        var keyPrefix = isArray(obj)
		            ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(adjustedPrefix, encodedKey) : adjustedPrefix
		            : adjustedPrefix + (allowDots ? '.' + encodedKey : '[' + encodedKey + ']');

		        sideChannel.set(object, step);
		        var valueSideChannel = getSideChannel();
		        valueSideChannel.set(sentinel, sideChannel);
		        pushToArray(values, stringify(
		            value,
		            keyPrefix,
		            generateArrayPrefix,
		            commaRoundTrip,
		            allowEmptyArrays,
		            strictNullHandling,
		            skipNulls,
		            encodeDotInKeys,
		            generateArrayPrefix === 'comma' && encodeValuesOnly && isArray(obj) ? null : encoder,
		            filter,
		            sort,
		            allowDots,
		            serializeDate,
		            format,
		            formatter,
		            encodeValuesOnly,
		            charset,
		            valueSideChannel
		        ));
		    }

		    return values;
		};

		var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
		    if (!opts) {
		        return defaults;
		    }

		    if (typeof opts.allowEmptyArrays !== 'undefined' && typeof opts.allowEmptyArrays !== 'boolean') {
		        throw new TypeError('`allowEmptyArrays` option can only be `true` or `false`, when provided');
		    }

		    if (typeof opts.encodeDotInKeys !== 'undefined' && typeof opts.encodeDotInKeys !== 'boolean') {
		        throw new TypeError('`encodeDotInKeys` option can only be `true` or `false`, when provided');
		    }

		    if (opts.encoder !== null && typeof opts.encoder !== 'undefined' && typeof opts.encoder !== 'function') {
		        throw new TypeError('Encoder has to be a function.');
		    }

		    var charset = opts.charset || defaults.charset;
		    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
		        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
		    }

		    var format = formats['default'];
		    if (typeof opts.format !== 'undefined') {
		        if (!has.call(formats.formatters, opts.format)) {
		            throw new TypeError('Unknown format option provided.');
		        }
		        format = opts.format;
		    }
		    var formatter = formats.formatters[format];

		    var filter = defaults.filter;
		    if (typeof opts.filter === 'function' || isArray(opts.filter)) {
		        filter = opts.filter;
		    }

		    var arrayFormat;
		    if (opts.arrayFormat in arrayPrefixGenerators) {
		        arrayFormat = opts.arrayFormat;
		    } else if ('indices' in opts) {
		        arrayFormat = opts.indices ? 'indices' : 'repeat';
		    } else {
		        arrayFormat = defaults.arrayFormat;
		    }

		    if ('commaRoundTrip' in opts && typeof opts.commaRoundTrip !== 'boolean') {
		        throw new TypeError('`commaRoundTrip` must be a boolean, or absent');
		    }

		    var allowDots = typeof opts.allowDots === 'undefined' ? opts.encodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;

		    return {
		        addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
		        allowDots: allowDots,
		        allowEmptyArrays: typeof opts.allowEmptyArrays === 'boolean' ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
		        arrayFormat: arrayFormat,
		        charset: charset,
		        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
		        commaRoundTrip: !!opts.commaRoundTrip,
		        delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
		        encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
		        encodeDotInKeys: typeof opts.encodeDotInKeys === 'boolean' ? opts.encodeDotInKeys : defaults.encodeDotInKeys,
		        encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
		        encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
		        filter: filter,
		        format: format,
		        formatter: formatter,
		        serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
		        skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
		        sort: typeof opts.sort === 'function' ? opts.sort : null,
		        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
		    };
		};

		stringify_1 = function (object, opts) {
		    var obj = object;
		    var options = normalizeStringifyOptions(opts);

		    var objKeys;
		    var filter;

		    if (typeof options.filter === 'function') {
		        filter = options.filter;
		        obj = filter('', obj);
		    } else if (isArray(options.filter)) {
		        filter = options.filter;
		        objKeys = filter;
		    }

		    var keys = [];

		    if (typeof obj !== 'object' || obj === null) {
		        return '';
		    }

		    var generateArrayPrefix = arrayPrefixGenerators[options.arrayFormat];
		    var commaRoundTrip = generateArrayPrefix === 'comma' && options.commaRoundTrip;

		    if (!objKeys) {
		        objKeys = Object.keys(obj);
		    }

		    if (options.sort) {
		        objKeys.sort(options.sort);
		    }

		    var sideChannel = getSideChannel();
		    for (var i = 0; i < objKeys.length; ++i) {
		        var key = objKeys[i];
		        var value = obj[key];

		        if (options.skipNulls && value === null) {
		            continue;
		        }
		        pushToArray(keys, stringify(
		            value,
		            key,
		            generateArrayPrefix,
		            commaRoundTrip,
		            options.allowEmptyArrays,
		            options.strictNullHandling,
		            options.skipNulls,
		            options.encodeDotInKeys,
		            options.encode ? options.encoder : null,
		            options.filter,
		            options.sort,
		            options.allowDots,
		            options.serializeDate,
		            options.format,
		            options.formatter,
		            options.encodeValuesOnly,
		            options.charset,
		            sideChannel
		        ));
		    }

		    var joined = keys.join(options.delimiter);
		    var prefix = options.addQueryPrefix === true ? '?' : '';

		    if (options.charsetSentinel) {
		        if (options.charset === 'iso-8859-1') {
		            // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
		            prefix += 'utf8=%26%2310003%3B&';
		        } else {
		            // encodeURIComponent('✓')
		            prefix += 'utf8=%E2%9C%93&';
		        }
		    }

		    return joined.length > 0 ? prefix + joined : '';
		};
		return stringify_1;
	}

	var parse;
	var hasRequiredParse;

	function requireParse () {
		if (hasRequiredParse) return parse;
		hasRequiredParse = 1;

		var utils = /*@__PURE__*/ requireUtils();

		var has = Object.prototype.hasOwnProperty;
		var isArray = Array.isArray;

		var defaults = {
		    allowDots: false,
		    allowEmptyArrays: false,
		    allowPrototypes: false,
		    allowSparse: false,
		    arrayLimit: 20,
		    charset: 'utf-8',
		    charsetSentinel: false,
		    comma: false,
		    decodeDotInKeys: false,
		    decoder: utils.decode,
		    delimiter: '&',
		    depth: 5,
		    duplicates: 'combine',
		    ignoreQueryPrefix: false,
		    interpretNumericEntities: false,
		    parameterLimit: 1000,
		    parseArrays: true,
		    plainObjects: false,
		    strictDepth: false,
		    strictNullHandling: false,
		    throwOnLimitExceeded: false
		};

		var interpretNumericEntities = function (str) {
		    return str.replace(/&#(\d+);/g, function ($0, numberStr) {
		        return String.fromCharCode(parseInt(numberStr, 10));
		    });
		};

		var parseArrayValue = function (val, options, currentArrayLength) {
		    if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
		        return val.split(',');
		    }

		    if (options.throwOnLimitExceeded && currentArrayLength >= options.arrayLimit) {
		        throw new RangeError('Array limit exceeded. Only ' + options.arrayLimit + ' element' + (options.arrayLimit === 1 ? '' : 's') + ' allowed in an array.');
		    }

		    return val;
		};

		// This is what browsers will submit when the ✓ character occurs in an
		// application/x-www-form-urlencoded body and the encoding of the page containing
		// the form is iso-8859-1, or when the submitted form has an accept-charset
		// attribute of iso-8859-1. Presumably also with other charsets that do not contain
		// the ✓ character, such as us-ascii.
		var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

		// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
		var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

		var parseValues = function parseQueryStringValues(str, options) {
		    var obj = { __proto__: null };

		    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
		    cleanStr = cleanStr.replace(/%5B/gi, '[').replace(/%5D/gi, ']');

		    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
		    var parts = cleanStr.split(
		        options.delimiter,
		        options.throwOnLimitExceeded ? limit + 1 : limit
		    );

		    if (options.throwOnLimitExceeded && parts.length > limit) {
		        throw new RangeError('Parameter limit exceeded. Only ' + limit + ' parameter' + (limit === 1 ? '' : 's') + ' allowed.');
		    }

		    var skipIndex = -1; // Keep track of where the utf8 sentinel was found
		    var i;

		    var charset = options.charset;
		    if (options.charsetSentinel) {
		        for (i = 0; i < parts.length; ++i) {
		            if (parts[i].indexOf('utf8=') === 0) {
		                if (parts[i] === charsetSentinel) {
		                    charset = 'utf-8';
		                } else if (parts[i] === isoSentinel) {
		                    charset = 'iso-8859-1';
		                }
		                skipIndex = i;
		                i = parts.length; // The eslint settings do not allow break;
		            }
		        }
		    }

		    for (i = 0; i < parts.length; ++i) {
		        if (i === skipIndex) {
		            continue;
		        }
		        var part = parts[i];

		        var bracketEqualsPos = part.indexOf(']=');
		        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

		        var key;
		        var val;
		        if (pos === -1) {
		            key = options.decoder(part, defaults.decoder, charset, 'key');
		            val = options.strictNullHandling ? null : '';
		        } else {
		            key = options.decoder(part.slice(0, pos), defaults.decoder, charset, 'key');

		            if (key !== null) {
		                val = utils.maybeMap(
		                    parseArrayValue(
		                        part.slice(pos + 1),
		                        options,
		                        isArray(obj[key]) ? obj[key].length : 0
		                    ),
		                    function (encodedVal) {
		                        return options.decoder(encodedVal, defaults.decoder, charset, 'value');
		                    }
		                );
		            }
		        }

		        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
		            val = interpretNumericEntities(String(val));
		        }

		        if (part.indexOf('[]=') > -1) {
		            val = isArray(val) ? [val] : val;
		        }

		        if (key !== null) {
		            var existing = has.call(obj, key);
		            if (existing && options.duplicates === 'combine') {
		                obj[key] = utils.combine(
		                    obj[key],
		                    val,
		                    options.arrayLimit,
		                    options.plainObjects
		                );
		            } else if (!existing || options.duplicates === 'last') {
		                obj[key] = val;
		            }
		        }
		    }

		    return obj;
		};

		var parseObject = function (chain, val, options, valuesParsed) {
		    var currentArrayLength = 0;
		    if (chain.length > 0 && chain[chain.length - 1] === '[]') {
		        var parentKey = chain.slice(0, -1).join('');
		        currentArrayLength = Array.isArray(val) && val[parentKey] ? val[parentKey].length : 0;
		    }

		    var leaf = valuesParsed ? val : parseArrayValue(val, options, currentArrayLength);

		    for (var i = chain.length - 1; i >= 0; --i) {
		        var obj;
		        var root = chain[i];

		        if (root === '[]' && options.parseArrays) {
		            if (utils.isOverflow(leaf)) {
		                // leaf is already an overflow object, preserve it
		                obj = leaf;
		            } else {
		                obj = options.allowEmptyArrays && (leaf === '' || (options.strictNullHandling && leaf === null))
		                    ? []
		                    : utils.combine(
		                        [],
		                        leaf,
		                        options.arrayLimit,
		                        options.plainObjects
		                    );
		            }
		        } else {
		            obj = options.plainObjects ? { __proto__: null } : {};
		            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
		            var decodedRoot = options.decodeDotInKeys ? cleanRoot.replace(/%2E/g, '.') : cleanRoot;
		            var index = parseInt(decodedRoot, 10);
		            if (!options.parseArrays && decodedRoot === '') {
		                obj = { 0: leaf };
		            } else if (
		                !isNaN(index)
		                && root !== decodedRoot
		                && String(index) === decodedRoot
		                && index >= 0
		                && (options.parseArrays && index <= options.arrayLimit)
		            ) {
		                obj = [];
		                obj[index] = leaf;
		            } else if (decodedRoot !== '__proto__') {
		                obj[decodedRoot] = leaf;
		            }
		        }

		        leaf = obj;
		    }

		    return leaf;
		};

		var splitKeyIntoSegments = function splitKeyIntoSegments(givenKey, options) {
		    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

		    if (options.depth <= 0) {
		        if (!options.plainObjects && has.call(Object.prototype, key)) {
		            if (!options.allowPrototypes) {
		                return;
		            }
		        }

		        return [key];
		    }

		    var brackets = /(\[[^[\]]*])/;
		    var child = /(\[[^[\]]*])/g;

		    var segment = brackets.exec(key);
		    var parent = segment ? key.slice(0, segment.index) : key;

		    var keys = [];

		    if (parent) {
		        if (!options.plainObjects && has.call(Object.prototype, parent)) {
		            if (!options.allowPrototypes) {
		                return;
		            }
		        }

		        keys.push(parent);
		    }

		    var i = 0;
		    while ((segment = child.exec(key)) !== null && i < options.depth) {
		        i += 1;

		        var segmentContent = segment[1].slice(1, -1);
		        if (!options.plainObjects && has.call(Object.prototype, segmentContent)) {
		            if (!options.allowPrototypes) {
		                return;
		            }
		        }

		        keys.push(segment[1]);
		    }

		    if (segment) {
		        if (options.strictDepth === true) {
		            throw new RangeError('Input depth exceeded depth option of ' + options.depth + ' and strictDepth is true');
		        }

		        keys.push('[' + key.slice(segment.index) + ']');
		    }

		    return keys;
		};

		var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
		    if (!givenKey) {
		        return;
		    }

		    var keys = splitKeyIntoSegments(givenKey, options);

		    if (!keys) {
		        return;
		    }

		    return parseObject(keys, val, options, valuesParsed);
		};

		var normalizeParseOptions = function normalizeParseOptions(opts) {
		    if (!opts) {
		        return defaults;
		    }

		    if (typeof opts.allowEmptyArrays !== 'undefined' && typeof opts.allowEmptyArrays !== 'boolean') {
		        throw new TypeError('`allowEmptyArrays` option can only be `true` or `false`, when provided');
		    }

		    if (typeof opts.decodeDotInKeys !== 'undefined' && typeof opts.decodeDotInKeys !== 'boolean') {
		        throw new TypeError('`decodeDotInKeys` option can only be `true` or `false`, when provided');
		    }

		    if (opts.decoder !== null && typeof opts.decoder !== 'undefined' && typeof opts.decoder !== 'function') {
		        throw new TypeError('Decoder has to be a function.');
		    }

		    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
		        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
		    }

		    if (typeof opts.throwOnLimitExceeded !== 'undefined' && typeof opts.throwOnLimitExceeded !== 'boolean') {
		        throw new TypeError('`throwOnLimitExceeded` option must be a boolean');
		    }

		    var charset = typeof opts.charset === 'undefined' ? defaults.charset : opts.charset;

		    var duplicates = typeof opts.duplicates === 'undefined' ? defaults.duplicates : opts.duplicates;

		    if (duplicates !== 'combine' && duplicates !== 'first' && duplicates !== 'last') {
		        throw new TypeError('The duplicates option must be either combine, first, or last');
		    }

		    var allowDots = typeof opts.allowDots === 'undefined' ? opts.decodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;

		    return {
		        allowDots: allowDots,
		        allowEmptyArrays: typeof opts.allowEmptyArrays === 'boolean' ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
		        allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults.allowPrototypes,
		        allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults.allowSparse,
		        arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults.arrayLimit,
		        charset: charset,
		        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
		        comma: typeof opts.comma === 'boolean' ? opts.comma : defaults.comma,
		        decodeDotInKeys: typeof opts.decodeDotInKeys === 'boolean' ? opts.decodeDotInKeys : defaults.decodeDotInKeys,
		        decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults.decoder,
		        delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
		        // eslint-disable-next-line no-implicit-coercion, no-extra-parens
		        depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults.depth,
		        duplicates: duplicates,
		        ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
		        interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
		        parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults.parameterLimit,
		        parseArrays: opts.parseArrays !== false,
		        plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults.plainObjects,
		        strictDepth: typeof opts.strictDepth === 'boolean' ? !!opts.strictDepth : defaults.strictDepth,
		        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling,
		        throwOnLimitExceeded: typeof opts.throwOnLimitExceeded === 'boolean' ? opts.throwOnLimitExceeded : false
		    };
		};

		parse = function (str, opts) {
		    var options = normalizeParseOptions(opts);

		    if (str === '' || str === null || typeof str === 'undefined') {
		        return options.plainObjects ? { __proto__: null } : {};
		    }

		    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
		    var obj = options.plainObjects ? { __proto__: null } : {};

		    // Iterate over the keys and setup the new object

		    var keys = Object.keys(tempObj);
		    for (var i = 0; i < keys.length; ++i) {
		        var key = keys[i];
		        var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
		        obj = utils.merge(obj, newObj, options);
		    }

		    if (options.allowSparse === true) {
		        return obj;
		    }

		    return utils.compact(obj);
		};
		return parse;
	}

	var lib;
	var hasRequiredLib;

	function requireLib () {
		if (hasRequiredLib) return lib;
		hasRequiredLib = 1;

		var stringify = /*@__PURE__*/ requireStringify();
		var parse = /*@__PURE__*/ requireParse();
		var formats = /*@__PURE__*/ requireFormats();

		lib = {
		    formats: formats,
		    parse: parse,
		    stringify: stringify
		};
		return lib;
	}

	var libExports = /*@__PURE__*/ requireLib();
	var qs = /*@__PURE__*/getDefaultExportFromCjs(libExports);

	function PopupHandler(webAuth) {
	  this.webAuth = webAuth;
	  this._current_popup = null;
	  this.options = null;
	}

	PopupHandler.prototype.preload = function(options) {
	  var _this = this;
	  var _window = windowHandler.getWindow();

	  var url = options.url || 'about:blank';
	  var popupOptions = options.popupOptions || {};

	  popupOptions.location = 'yes';
	  delete popupOptions.width;
	  delete popupOptions.height;

	  var windowFeatures = qs.stringify(popupOptions, {
	    encode: false,
	    delimiter: ','
	  });

	  if (this._current_popup && !this._current_popup.closed) {
	    return this._current_popup;
	  }

	  this._current_popup = _window.open(url, '_blank', windowFeatures);

	  this._current_popup.kill = function(success) {
	    _this._current_popup.success = success;
	    this.close();
	    _this._current_popup = null;
	  };

	  return this._current_popup;
	};

	PopupHandler.prototype.load = function(url, _, options, cb) {
	  var _this = this;
	  this.url = url;
	  this.options = options;
	  if (!this._current_popup) {
	    options.url = url;
	    this.preload(options);
	  } else {
	    this._current_popup.location.href = url;
	  }

	  this.transientErrorHandler = function(event) {
	    _this.errorHandler(event, cb);
	  };

	  this.transientStartHandler = function(event) {
	    _this.startHandler(event, cb);
	  };

	  this.transientExitHandler = function() {
	    _this.exitHandler(cb);
	  };

	  this._current_popup.addEventListener('loaderror', this.transientErrorHandler);
	  this._current_popup.addEventListener('loadstart', this.transientStartHandler);
	  this._current_popup.addEventListener('exit', this.transientExitHandler);
	};

	PopupHandler.prototype.errorHandler = function(event, cb) {
	  if (!this._current_popup) {
	    return;
	  }

	  this._current_popup.kill(true);

	  cb({ error: 'window_error', errorDescription: event.message });
	};

	PopupHandler.prototype.unhook = function() {
	  this._current_popup.removeEventListener(
	    'loaderror',
	    this.transientErrorHandler
	  );
	  this._current_popup.removeEventListener(
	    'loadstart',
	    this.transientStartHandler
	  );
	  this._current_popup.removeEventListener('exit', this.transientExitHandler);
	};

	PopupHandler.prototype.exitHandler = function(cb) {
	  if (!this._current_popup) {
	    return;
	  }

	  // when the modal is closed, this event is called which ends up removing the
	  // event listeners. If you move this before closing the modal, it will add ~1 sec
	  // delay between the user being redirected to the callback and the popup gets closed.
	  this.unhook();

	  if (!this._current_popup.success) {
	    cb({ error: 'window_closed', errorDescription: 'Browser window closed' });
	  }
	};

	PopupHandler.prototype.startHandler = function(event, cb) {
	  var _this = this;

	  if (!this._current_popup) {
	    return;
	  }

	  var callbackUrl = urljoin(
	    'https:',
	    this.webAuth.baseOptions.domain,
	    '/mobile'
	  );

	  if (event.url && !(event.url.indexOf(callbackUrl + '#') === 0)) {
	    return;
	  }

	  var parts = event.url.split('#');

	  if (parts.length === 1) {
	    return;
	  }

	  var opts = { hash: parts.pop() };

	  if (this.options.nonce) {
	    opts.nonce = this.options.nonce;
	  }

	  this.webAuth.parseHash(opts, function(error, result) {
	    if (error || result) {
	      _this._current_popup.kill(true);
	      cb(error, result);
	    }
	  });
	};

	function PluginHandler(webAuth) {
	  this.webAuth = webAuth;
	}

	PluginHandler.prototype.processParams = function(params) {
	  params.redirectUri = urljoin('https://' + params.domain, 'mobile');
	  delete params.owp;
	  return params;
	};

	PluginHandler.prototype.getPopupHandler = function() {
	  return new PopupHandler(this.webAuth);
	};

	function CordovaPlugin() {
	  this.webAuth = null;
	  this.version = version.raw;
	  this.extensibilityPoints = ['popup.authorize', 'popup.getPopupHandler'];
	}

	CordovaPlugin.prototype.setWebAuth = function(webAuth) {
	  this.webAuth = webAuth;
	};

	CordovaPlugin.prototype.supports = function(extensibilityPoint) {
	  var _window = windowHandler.getWindow();
	  return (
	    (!!_window.cordova || !!_window.electron) &&
	    this.extensibilityPoints.indexOf(extensibilityPoint) > -1
	  );
	};

	CordovaPlugin.prototype.init = function() {
	  return new PluginHandler(this.webAuth);
	};

	return CordovaPlugin;

}));
