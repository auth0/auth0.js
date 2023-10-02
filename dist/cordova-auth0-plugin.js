/**
 * auth0-js v9.22.1
 * Author: Auth0
 * Date: 2023-10-02
 * License: MIT
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.CordovaAuth0Plugin = factory());
}(this, (function () { 'use strict';

  var version = { raw: '9.22.1' };

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

  var assert = {
    check: check,
    attribute: attribute,
    variable: variable,
    value: value,
    isArray: isArray,
    supportsIsArray: supportsIsArray
  };

  /* eslint-disable no-continue */

  function get() {
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
      for (
        var nextIndex = 0, len = keysArray.length;
        nextIndex < len;
        nextIndex++
      ) {
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
    get: get,
    objectAssignPolyfill: objectAssignPolyfill
  };

  /* eslint-disable no-param-reassign */

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

  function toCamelCase(object, exceptions, options) {
    if (typeof object !== 'object' || assert.isArray(object) || object === null) {
      return object;
    }

    exceptions = exceptions || [];
    options = options || {};
    return Object.keys(object).reduce(function(p, key) {
      var newKey = exceptions.indexOf(key) === -1 ? snakeToCamel(key) : key;

      p[newKey] = toCamelCase(object[newKey] || object[key], [], options);

      if (options.keepOriginal) {
        p[key] = toCamelCase(object[key], [], options);
      }
      return p;
    }, {});
  }

  function getLocationFromUrl(href) {
    var match = href.match(
      /^(https?:|file:|chrome-extension:)\/\/(([^:/?#]*)(?::([0-9]+))?)([/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/
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

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  function getCjsExportFromNamespace (n) {
  	return n && n['default'] || n;
  }

  var urlJoin = createCommonjsModule(function (module) {
  (function (name, context, definition) {
    if ( module.exports) module.exports = definition();
    else context[name] = definition();
  })('urljoin', commonjsGlobal, function () {

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
  });

  /* eslint complexity: [2, 18], max-statements: [2, 33] */
  var shams = function hasSymbols() {
  	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
  	if (typeof Symbol.iterator === 'symbol') { return true; }

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
  	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
  	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

  	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

  	var syms = Object.getOwnPropertySymbols(obj);
  	if (syms.length !== 1 || syms[0] !== sym) { return false; }

  	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

  	if (typeof Object.getOwnPropertyDescriptor === 'function') {
  		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
  		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
  	}

  	return true;
  };

  var origSymbol = typeof Symbol !== 'undefined' && Symbol;


  var hasSymbols = function hasNativeSymbols() {
  	if (typeof origSymbol !== 'function') { return false; }
  	if (typeof Symbol !== 'function') { return false; }
  	if (typeof origSymbol('foo') !== 'symbol') { return false; }
  	if (typeof Symbol('bar') !== 'symbol') { return false; }

  	return shams();
  };

  var test = {
  	foo: {}
  };

  var $Object = Object;

  var hasProto = function hasProto() {
  	return { __proto__: test }.foo === test.foo && !({ __proto__: null } instanceof $Object);
  };

  /* eslint no-invalid-this: 1 */

  var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
  var slice = Array.prototype.slice;
  var toStr = Object.prototype.toString;
  var funcType = '[object Function]';

  var implementation = function bind(that) {
      var target = this;
      if (typeof target !== 'function' || toStr.call(target) !== funcType) {
          throw new TypeError(ERROR_MESSAGE + target);
      }
      var args = slice.call(arguments, 1);

      var bound;
      var binder = function () {
          if (this instanceof bound) {
              var result = target.apply(
                  this,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return this;
          } else {
              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );
          }
      };

      var boundLength = Math.max(0, target.length - args.length);
      var boundArgs = [];
      for (var i = 0; i < boundLength; i++) {
          boundArgs.push('$' + i);
      }

      bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

      if (target.prototype) {
          var Empty = function Empty() {};
          Empty.prototype = target.prototype;
          bound.prototype = new Empty();
          Empty.prototype = null;
      }

      return bound;
  };

  var functionBind = Function.prototype.bind || implementation;

  var src = functionBind.call(Function.call, Object.prototype.hasOwnProperty);

  var undefined$1;

  var $SyntaxError = SyntaxError;
  var $Function = Function;
  var $TypeError = TypeError;

  // eslint-disable-next-line consistent-return
  var getEvalledConstructor = function (expressionSyntax) {
  	try {
  		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
  	} catch (e) {}
  };

  var $gOPD = Object.getOwnPropertyDescriptor;
  if ($gOPD) {
  	try {
  		$gOPD({}, '');
  	} catch (e) {
  		$gOPD = null; // this is IE 8, which has a broken gOPD
  	}
  }

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

  var hasSymbols$1 = hasSymbols();
  var hasProto$1 = hasProto();

  var getProto = Object.getPrototypeOf || (
  	hasProto$1
  		? function (x) { return x.__proto__; } // eslint-disable-line no-proto
  		: null
  );

  var needsEval = {};

  var TypedArray = typeof Uint8Array === 'undefined' || !getProto ? undefined$1 : getProto(Uint8Array);

  var INTRINSICS = {
  	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
  	'%Array%': Array,
  	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
  	'%ArrayIteratorPrototype%': hasSymbols$1 && getProto ? getProto([][Symbol.iterator]()) : undefined$1,
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
  	'%Error%': Error,
  	'%eval%': eval, // eslint-disable-line no-eval
  	'%EvalError%': EvalError,
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
  	'%IteratorPrototype%': hasSymbols$1 && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
  	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
  	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
  	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$1 || !getProto ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
  	'%Math%': Math,
  	'%Number%': Number,
  	'%Object%': Object,
  	'%parseFloat%': parseFloat,
  	'%parseInt%': parseInt,
  	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
  	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
  	'%RangeError%': RangeError,
  	'%ReferenceError%': ReferenceError,
  	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
  	'%RegExp%': RegExp,
  	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
  	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$1 || !getProto ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
  	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
  	'%String%': String,
  	'%StringIteratorPrototype%': hasSymbols$1 && getProto ? getProto(''[Symbol.iterator]()) : undefined$1,
  	'%Symbol%': hasSymbols$1 ? Symbol : undefined$1,
  	'%SyntaxError%': $SyntaxError,
  	'%ThrowTypeError%': ThrowTypeError,
  	'%TypedArray%': TypedArray,
  	'%TypeError%': $TypeError,
  	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
  	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
  	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
  	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
  	'%URIError%': URIError,
  	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
  	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$1 : WeakRef,
  	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet
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



  var $concat = functionBind.call(Function.call, Array.prototype.concat);
  var $spliceApply = functionBind.call(Function.apply, Array.prototype.splice);
  var $replace = functionBind.call(Function.call, String.prototype.replace);
  var $strSlice = functionBind.call(Function.call, String.prototype.slice);
  var $exec = functionBind.call(Function.call, RegExp.prototype.exec);

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
  	if (src(LEGACY_ALIASES, intrinsicName)) {
  		alias = LEGACY_ALIASES[intrinsicName];
  		intrinsicName = '%' + alias[0] + '%';
  	}

  	if (src(INTRINSICS, intrinsicName)) {
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

  var getIntrinsic = function GetIntrinsic(name, allowMissing) {
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

  		if (src(INTRINSICS, intrinsicRealName)) {
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
  				isOwn = src(value, part);
  				value = value[part];
  			}

  			if (isOwn && !skipFurtherCaching) {
  				INTRINSICS[intrinsicRealName] = value;
  			}
  		}
  	}
  	return value;
  };

  var callBind = createCommonjsModule(function (module) {




  var $apply = getIntrinsic('%Function.prototype.apply%');
  var $call = getIntrinsic('%Function.prototype.call%');
  var $reflectApply = getIntrinsic('%Reflect.apply%', true) || functionBind.call($call, $apply);

  var $gOPD = getIntrinsic('%Object.getOwnPropertyDescriptor%', true);
  var $defineProperty = getIntrinsic('%Object.defineProperty%', true);
  var $max = getIntrinsic('%Math.max%');

  if ($defineProperty) {
  	try {
  		$defineProperty({}, 'a', { value: 1 });
  	} catch (e) {
  		// IE 8 has a broken defineProperty
  		$defineProperty = null;
  	}
  }

  module.exports = function callBind(originalFunction) {
  	var func = $reflectApply(functionBind, $call, arguments);
  	if ($gOPD && $defineProperty) {
  		var desc = $gOPD(func, 'length');
  		if (desc.configurable) {
  			// original length, plus the receiver, minus any additional arguments (after the receiver)
  			$defineProperty(
  				func,
  				'length',
  				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
  			);
  		}
  	}
  	return func;
  };

  var applyBind = function applyBind() {
  	return $reflectApply(functionBind, $apply, arguments);
  };

  if ($defineProperty) {
  	$defineProperty(module.exports, 'apply', { value: applyBind });
  } else {
  	module.exports.apply = applyBind;
  }
  });
  var callBind_1 = callBind.apply;

  var $indexOf = callBind(getIntrinsic('String.prototype.indexOf'));

  var callBound = function callBoundIntrinsic(name, allowMissing) {
  	var intrinsic = getIntrinsic(name, !!allowMissing);
  	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
  		return callBind(intrinsic);
  	}
  	return intrinsic;
  };

  var _nodeResolve_empty = {};

  var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': _nodeResolve_empty
  });

  var utilInspect = getCjsExportFromNamespace(_nodeResolve_empty$1);

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
  var $replace$1 = String.prototype.replace;
  var $toUpperCase = String.prototype.toUpperCase;
  var $toLowerCase = String.prototype.toLowerCase;
  var $test = RegExp.prototype.test;
  var $concat$1 = Array.prototype.concat;
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
          || (num && num > -1000 && num < 1000)
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
              return $replace$1.call(intStr, sepRegex, '$&_') + '.' + $replace$1.call($replace$1.call(dec, /([0-9]{3})/g, '$&_'), /_$/, '');
          }
      }
      return $replace$1.call(str, sepRegex, '$&_');
  }


  var inspectCustom = utilInspect.custom;
  var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null;

  var objectInspect = function inspect_(obj, options, depth, seen) {
      var opts = options || {};

      if (has(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
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
          return isArray$1(obj) ? '[Array]' : '[Object]';
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
          var symString = hasShammedSymbols ? $replace$1.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
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
      if (isArray$1(obj)) {
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
              return '{ [' + String(obj) + '] ' + $join.call($concat$1.call('[cause]: ' + inspect(obj.cause), parts), ', ') + ' }';
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
      if (!isDate(obj) && !isRegExp(obj)) {
          var ys = arrObjKeys(obj, inspect);
          var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
          var protoTag = obj instanceof Object ? '' : 'null prototype';
          var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice.call(toStr$1(obj), 8, -1) : protoTag ? 'Object' : '';
          var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
          var tag = constructorTag + (stringTag || protoTag ? '[' + $join.call($concat$1.call([], stringTag || [], protoTag || []), ': ') + '] ' : '');
          if (ys.length === 0) { return tag + '{}'; }
          if (indent) {
              return tag + '{' + indentedJoin(ys, indent) + '}';
          }
          return tag + '{ ' + $join.call(ys, ', ') + ' }';
      }
      return String(obj);
  };

  function wrapQuotes(s, defaultStyle, opts) {
      var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
      return quoteChar + s + quoteChar;
  }

  function quote(s) {
      return $replace$1.call(String(s), /"/g, '&quot;');
  }

  function isArray$1(obj) { return toStr$1(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isDate(obj) { return toStr$1(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isRegExp(obj) { return toStr$1(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isError(obj) { return toStr$1(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isString(obj) { return toStr$1(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isNumber(obj) { return toStr$1(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isBoolean(obj) { return toStr$1(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

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

  function toStr$1(obj) {
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
      // eslint-disable-next-line no-control-regex
      var s = $replace$1.call($replace$1.call(str, /(['\\])/g, '\\$1'), /[\x00-\x1f]/g, lowbyte);
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
      var isArr = isArray$1(obj);
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

  var $TypeError$1 = getIntrinsic('%TypeError%');
  var $WeakMap = getIntrinsic('%WeakMap%', true);
  var $Map = getIntrinsic('%Map%', true);

  var $weakMapGet = callBound('WeakMap.prototype.get', true);
  var $weakMapSet = callBound('WeakMap.prototype.set', true);
  var $weakMapHas = callBound('WeakMap.prototype.has', true);
  var $mapGet = callBound('Map.prototype.get', true);
  var $mapSet = callBound('Map.prototype.set', true);
  var $mapHas = callBound('Map.prototype.has', true);

  /*
   * This function traverses the list returning the node corresponding to the
   * given key.
   *
   * That node is also moved to the head of the list, so that if it's accessed
   * again we don't need to traverse the whole list. By doing so, all the recently
   * used nodes can be accessed relatively quickly.
   */
  var listGetNode = function (list, key) { // eslint-disable-line consistent-return
  	for (var prev = list, curr; (curr = prev.next) !== null; prev = curr) {
  		if (curr.key === key) {
  			prev.next = curr.next;
  			curr.next = list.next;
  			list.next = curr; // eslint-disable-line no-param-reassign
  			return curr;
  		}
  	}
  };

  var listGet = function (objects, key) {
  	var node = listGetNode(objects, key);
  	return node && node.value;
  };
  var listSet = function (objects, key, value) {
  	var node = listGetNode(objects, key);
  	if (node) {
  		node.value = value;
  	} else {
  		// Prepend the new node to the beginning of the list
  		objects.next = { // eslint-disable-line no-param-reassign
  			key: key,
  			next: objects.next,
  			value: value
  		};
  	}
  };
  var listHas = function (objects, key) {
  	return !!listGetNode(objects, key);
  };

  var sideChannel = function getSideChannel() {
  	var $wm;
  	var $m;
  	var $o;
  	var channel = {
  		assert: function (key) {
  			if (!channel.has(key)) {
  				throw new $TypeError$1('Side channel does not contain ' + objectInspect(key));
  			}
  		},
  		get: function (key) { // eslint-disable-line consistent-return
  			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
  				if ($wm) {
  					return $weakMapGet($wm, key);
  				}
  			} else if ($Map) {
  				if ($m) {
  					return $mapGet($m, key);
  				}
  			} else {
  				if ($o) { // eslint-disable-line no-lonely-if
  					return listGet($o, key);
  				}
  			}
  		},
  		has: function (key) {
  			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
  				if ($wm) {
  					return $weakMapHas($wm, key);
  				}
  			} else if ($Map) {
  				if ($m) {
  					return $mapHas($m, key);
  				}
  			} else {
  				if ($o) { // eslint-disable-line no-lonely-if
  					return listHas($o, key);
  				}
  			}
  			return false;
  		},
  		set: function (key, value) {
  			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
  				if (!$wm) {
  					$wm = new $WeakMap();
  				}
  				$weakMapSet($wm, key, value);
  			} else if ($Map) {
  				if (!$m) {
  					$m = new $Map();
  				}
  				$mapSet($m, key, value);
  			} else {
  				if (!$o) {
  					/*
  					 * Initialize the linked list as an empty node, so that we don't have
  					 * to special-case handling of the first node: we can always refer to
  					 * it as (previous node).next, instead of something like (list).head
  					 */
  					$o = { key: {}, next: null };
  				}
  				listSet($o, key, value);
  			}
  		}
  	};
  	return channel;
  };

  var replace = String.prototype.replace;
  var percentTwenties = /%20/g;

  var Format = {
      RFC1738: 'RFC1738',
      RFC3986: 'RFC3986'
  };

  var formats = {
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

  var has$1 = Object.prototype.hasOwnProperty;
  var isArray$2 = Array.isArray;

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

          if (isArray$2(obj)) {
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
      var obj = options && options.plainObjects ? Object.create(null) : {};
      for (var i = 0; i < source.length; ++i) {
          if (typeof source[i] !== 'undefined') {
              obj[i] = source[i];
          }
      }

      return obj;
  };

  var merge$1 = function merge(target, source, options) {
      /* eslint no-param-reassign: 0 */
      if (!source) {
          return target;
      }

      if (typeof source !== 'object') {
          if (isArray$2(target)) {
              target.push(source);
          } else if (target && typeof target === 'object') {
              if ((options && (options.plainObjects || options.allowPrototypes)) || !has$1.call(Object.prototype, source)) {
                  target[source] = true;
              }
          } else {
              return [target, source];
          }

          return target;
      }

      if (!target || typeof target !== 'object') {
          return [target].concat(source);
      }

      var mergeTarget = target;
      if (isArray$2(target) && !isArray$2(source)) {
          mergeTarget = arrayToObject(target, options);
      }

      if (isArray$2(target) && isArray$2(source)) {
          source.forEach(function (item, i) {
              if (has$1.call(target, i)) {
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

          if (has$1.call(acc, key)) {
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

  var decode = function (str, decoder, charset) {
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
      for (var i = 0; i < string.length; ++i) {
          var c = string.charCodeAt(i);

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
          /* eslint operator-linebreak: [2, "before"] */
          out += hexTable[0xF0 | (c >> 18)]
              + hexTable[0x80 | ((c >> 12) & 0x3F)]
              + hexTable[0x80 | ((c >> 6) & 0x3F)]
              + hexTable[0x80 | (c & 0x3F)];
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

  var isRegExp$1 = function isRegExp(obj) {
      return Object.prototype.toString.call(obj) === '[object RegExp]';
  };

  var isBuffer = function isBuffer(obj) {
      if (!obj || typeof obj !== 'object') {
          return false;
      }

      return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
  };

  var combine = function combine(a, b) {
      return [].concat(a, b);
  };

  var maybeMap = function maybeMap(val, fn) {
      if (isArray$2(val)) {
          var mapped = [];
          for (var i = 0; i < val.length; i += 1) {
              mapped.push(fn(val[i]));
          }
          return mapped;
      }
      return fn(val);
  };

  var utils = {
      arrayToObject: arrayToObject,
      assign: assign,
      combine: combine,
      compact: compact,
      decode: decode,
      encode: encode,
      isBuffer: isBuffer,
      isRegExp: isRegExp$1,
      maybeMap: maybeMap,
      merge: merge$1
  };

  var has$2 = Object.prototype.hasOwnProperty;

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

  var isArray$3 = Array.isArray;
  var push = Array.prototype.push;
  var pushToArray = function (arr, valueOrArray) {
      push.apply(arr, isArray$3(valueOrArray) ? valueOrArray : [valueOrArray]);
  };

  var toISO = Date.prototype.toISOString;

  var defaultFormat = formats['default'];
  var defaults = {
      addQueryPrefix: false,
      allowDots: false,
      charset: 'utf-8',
      charsetSentinel: false,
      delimiter: '&',
      encode: true,
      encoder: utils.encode,
      encodeValuesOnly: false,
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
      strictNullHandling,
      skipNulls,
      encoder,
      filter,
      sort,
      allowDots,
      serializeDate,
      format,
      formatter,
      encodeValuesOnly,
      charset,
      sideChannel$1
  ) {
      var obj = object;

      var tmpSc = sideChannel$1;
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
      } else if (generateArrayPrefix === 'comma' && isArray$3(obj)) {
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
      if (generateArrayPrefix === 'comma' && isArray$3(obj)) {
          // we need to join elements in
          if (encodeValuesOnly && encoder) {
              obj = utils.maybeMap(obj, encoder);
          }
          objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : void undefined }];
      } else if (isArray$3(filter)) {
          objKeys = filter;
      } else {
          var keys = Object.keys(obj);
          objKeys = sort ? keys.sort(sort) : keys;
      }

      var adjustedPrefix = commaRoundTrip && isArray$3(obj) && obj.length === 1 ? prefix + '[]' : prefix;

      for (var j = 0; j < objKeys.length; ++j) {
          var key = objKeys[j];
          var value = typeof key === 'object' && typeof key.value !== 'undefined' ? key.value : obj[key];

          if (skipNulls && value === null) {
              continue;
          }

          var keyPrefix = isArray$3(obj)
              ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(adjustedPrefix, key) : adjustedPrefix
              : adjustedPrefix + (allowDots ? '.' + key : '[' + key + ']');

          sideChannel$1.set(object, step);
          var valueSideChannel = sideChannel();
          valueSideChannel.set(sentinel, sideChannel$1);
          pushToArray(values, stringify(
              value,
              keyPrefix,
              generateArrayPrefix,
              commaRoundTrip,
              strictNullHandling,
              skipNulls,
              generateArrayPrefix === 'comma' && encodeValuesOnly && isArray$3(obj) ? null : encoder,
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

      if (opts.encoder !== null && typeof opts.encoder !== 'undefined' && typeof opts.encoder !== 'function') {
          throw new TypeError('Encoder has to be a function.');
      }

      var charset = opts.charset || defaults.charset;
      if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
          throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
      }

      var format = formats['default'];
      if (typeof opts.format !== 'undefined') {
          if (!has$2.call(formats.formatters, opts.format)) {
              throw new TypeError('Unknown format option provided.');
          }
          format = opts.format;
      }
      var formatter = formats.formatters[format];

      var filter = defaults.filter;
      if (typeof opts.filter === 'function' || isArray$3(opts.filter)) {
          filter = opts.filter;
      }

      return {
          addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
          allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
          charset: charset,
          charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
          delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
          encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
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

  var stringify_1 = function (object, opts) {
      var obj = object;
      var options = normalizeStringifyOptions(opts);

      var objKeys;
      var filter;

      if (typeof options.filter === 'function') {
          filter = options.filter;
          obj = filter('', obj);
      } else if (isArray$3(options.filter)) {
          filter = options.filter;
          objKeys = filter;
      }

      var keys = [];

      if (typeof obj !== 'object' || obj === null) {
          return '';
      }

      var arrayFormat;
      if (opts && opts.arrayFormat in arrayPrefixGenerators) {
          arrayFormat = opts.arrayFormat;
      } else if (opts && 'indices' in opts) {
          arrayFormat = opts.indices ? 'indices' : 'repeat';
      } else {
          arrayFormat = 'indices';
      }

      var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];
      if (opts && 'commaRoundTrip' in opts && typeof opts.commaRoundTrip !== 'boolean') {
          throw new TypeError('`commaRoundTrip` must be a boolean, or absent');
      }
      var commaRoundTrip = generateArrayPrefix === 'comma' && opts && opts.commaRoundTrip;

      if (!objKeys) {
          objKeys = Object.keys(obj);
      }

      if (options.sort) {
          objKeys.sort(options.sort);
      }

      var sideChannel$1 = sideChannel();
      for (var i = 0; i < objKeys.length; ++i) {
          var key = objKeys[i];

          if (options.skipNulls && obj[key] === null) {
              continue;
          }
          pushToArray(keys, stringify(
              obj[key],
              key,
              generateArrayPrefix,
              commaRoundTrip,
              options.strictNullHandling,
              options.skipNulls,
              options.encode ? options.encoder : null,
              options.filter,
              options.sort,
              options.allowDots,
              options.serializeDate,
              options.format,
              options.formatter,
              options.encodeValuesOnly,
              options.charset,
              sideChannel$1
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

  var has$3 = Object.prototype.hasOwnProperty;
  var isArray$4 = Array.isArray;

  var defaults$1 = {
      allowDots: false,
      allowPrototypes: false,
      allowSparse: false,
      arrayLimit: 20,
      charset: 'utf-8',
      charsetSentinel: false,
      comma: false,
      decoder: utils.decode,
      delimiter: '&',
      depth: 5,
      ignoreQueryPrefix: false,
      interpretNumericEntities: false,
      parameterLimit: 1000,
      parseArrays: true,
      plainObjects: false,
      strictNullHandling: false
  };

  var interpretNumericEntities = function (str) {
      return str.replace(/&#(\d+);/g, function ($0, numberStr) {
          return String.fromCharCode(parseInt(numberStr, 10));
      });
  };

  var parseArrayValue = function (val, options) {
      if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
          return val.split(',');
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
      var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
      var parts = cleanStr.split(options.delimiter, limit);
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

          var key, val;
          if (pos === -1) {
              key = options.decoder(part, defaults$1.decoder, charset, 'key');
              val = options.strictNullHandling ? null : '';
          } else {
              key = options.decoder(part.slice(0, pos), defaults$1.decoder, charset, 'key');
              val = utils.maybeMap(
                  parseArrayValue(part.slice(pos + 1), options),
                  function (encodedVal) {
                      return options.decoder(encodedVal, defaults$1.decoder, charset, 'value');
                  }
              );
          }

          if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
              val = interpretNumericEntities(val);
          }

          if (part.indexOf('[]=') > -1) {
              val = isArray$4(val) ? [val] : val;
          }

          if (has$3.call(obj, key)) {
              obj[key] = utils.combine(obj[key], val);
          } else {
              obj[key] = val;
          }
      }

      return obj;
  };

  var parseObject = function (chain, val, options, valuesParsed) {
      var leaf = valuesParsed ? val : parseArrayValue(val, options);

      for (var i = chain.length - 1; i >= 0; --i) {
          var obj;
          var root = chain[i];

          if (root === '[]' && options.parseArrays) {
              obj = [].concat(leaf);
          } else {
              obj = options.plainObjects ? Object.create(null) : {};
              var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
              var index = parseInt(cleanRoot, 10);
              if (!options.parseArrays && cleanRoot === '') {
                  obj = { 0: leaf };
              } else if (
                  !isNaN(index)
                  && root !== cleanRoot
                  && String(index) === cleanRoot
                  && index >= 0
                  && (options.parseArrays && index <= options.arrayLimit)
              ) {
                  obj = [];
                  obj[index] = leaf;
              } else if (cleanRoot !== '__proto__') {
                  obj[cleanRoot] = leaf;
              }
          }

          leaf = obj;
      }

      return leaf;
  };

  var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
      if (!givenKey) {
          return;
      }

      // Transform dot notation to bracket notation
      var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

      // The regex chunks

      var brackets = /(\[[^[\]]*])/;
      var child = /(\[[^[\]]*])/g;

      // Get the parent

      var segment = options.depth > 0 && brackets.exec(key);
      var parent = segment ? key.slice(0, segment.index) : key;

      // Stash the parent if it exists

      var keys = [];
      if (parent) {
          // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
          if (!options.plainObjects && has$3.call(Object.prototype, parent)) {
              if (!options.allowPrototypes) {
                  return;
              }
          }

          keys.push(parent);
      }

      // Loop through children appending to the array until we hit depth

      var i = 0;
      while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
          i += 1;
          if (!options.plainObjects && has$3.call(Object.prototype, segment[1].slice(1, -1))) {
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

      return parseObject(keys, val, options, valuesParsed);
  };

  var normalizeParseOptions = function normalizeParseOptions(opts) {
      if (!opts) {
          return defaults$1;
      }

      if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
          throw new TypeError('Decoder has to be a function.');
      }

      if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
          throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
      }
      var charset = typeof opts.charset === 'undefined' ? defaults$1.charset : opts.charset;

      return {
          allowDots: typeof opts.allowDots === 'undefined' ? defaults$1.allowDots : !!opts.allowDots,
          allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults$1.allowPrototypes,
          allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults$1.allowSparse,
          arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults$1.arrayLimit,
          charset: charset,
          charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults$1.charsetSentinel,
          comma: typeof opts.comma === 'boolean' ? opts.comma : defaults$1.comma,
          decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults$1.decoder,
          delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults$1.delimiter,
          // eslint-disable-next-line no-implicit-coercion, no-extra-parens
          depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults$1.depth,
          ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
          interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults$1.interpretNumericEntities,
          parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults$1.parameterLimit,
          parseArrays: opts.parseArrays !== false,
          plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults$1.plainObjects,
          strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults$1.strictNullHandling
      };
  };

  var parse = function (str, opts) {
      var options = normalizeParseOptions(opts);

      if (str === '' || str === null || typeof str === 'undefined') {
          return options.plainObjects ? Object.create(null) : {};
      }

      var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
      var obj = options.plainObjects ? Object.create(null) : {};

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

  var lib = {
      formats: formats,
      parse: parse,
      stringify: stringify_1
  };

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

    var windowFeatures = lib.stringify(popupOptions, {
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

    var callbackUrl = urlJoin(
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
    params.redirectUri = urlJoin('https://' + params.domain, 'mobile');
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

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZG92YS1hdXRoMC1wbHVnaW4uanMiLCJzb3VyY2VzIjpbIi4uL3NyYy92ZXJzaW9uLmpzIiwiLi4vc3JjL2hlbHBlci9hc3NlcnQuanMiLCIuLi9zcmMvaGVscGVyL29iamVjdC1hc3NpZ24uanMiLCIuLi9zcmMvaGVscGVyL29iamVjdC5qcyIsIi4uL3NyYy9oZWxwZXIvd2luZG93LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3VybC1qb2luL2xpYi91cmwtam9pbi5qcyIsIi4uL25vZGVfbW9kdWxlcy9oYXMtc3ltYm9scy9zaGFtcy5qcyIsIi4uL25vZGVfbW9kdWxlcy9oYXMtc3ltYm9scy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9oYXMtcHJvdG8vaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvZnVuY3Rpb24tYmluZC9pbXBsZW1lbnRhdGlvbi5qcyIsIi4uL25vZGVfbW9kdWxlcy9mdW5jdGlvbi1iaW5kL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2hhcy9zcmMvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvZ2V0LWludHJpbnNpYy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9jYWxsLWJpbmQvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvY2FsbC1iaW5kL2NhbGxCb3VuZC5qcyIsIi4uL25vZGVfbW9kdWxlcy9vYmplY3QtaW5zcGVjdC9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9zaWRlLWNoYW5uZWwvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvcXMvbGliL2Zvcm1hdHMuanMiLCIuLi9ub2RlX21vZHVsZXMvcXMvbGliL3V0aWxzLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3FzL2xpYi9zdHJpbmdpZnkuanMiLCIuLi9ub2RlX21vZHVsZXMvcXMvbGliL3BhcnNlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3FzL2xpYi9pbmRleC5qcyIsIi4uL3BsdWdpbnMvY29yZG92YS9wb3B1cC1oYW5kbGVyLmpzIiwiLi4vcGx1Z2lucy9jb3Jkb3ZhL3BsdWdpbi1oYW5kbGVyLmpzIiwiLi4vcGx1Z2lucy9jb3Jkb3ZhL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0geyByYXc6ICc5LjIyLjEnIH07XG4iLCJ2YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5mdW5jdGlvbiBhdHRyaWJ1dGUobywgYXR0ciwgdHlwZSwgdGV4dCkge1xuICB0eXBlID0gdHlwZSA9PT0gJ2FycmF5JyA/ICdvYmplY3QnIDogdHlwZTtcbiAgaWYgKG8gJiYgdHlwZW9mIG9bYXR0cl0gIT09IHR5cGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IodGV4dCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFyaWFibGUobywgdHlwZSwgdGV4dCkge1xuICBpZiAodHlwZW9mIG8gIT09IHR5cGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IodGV4dCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsdWUobywgdmFsdWVzLCB0ZXh0KSB7XG4gIGlmICh2YWx1ZXMuaW5kZXhPZihvKSA9PT0gLTEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IodGV4dCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2sobywgY29uZmlnLCBhdHRyaWJ1dGVzKSB7XG4gIGlmICghY29uZmlnLm9wdGlvbmFsIHx8IG8pIHtcbiAgICB2YXJpYWJsZShvLCBjb25maWcudHlwZSwgY29uZmlnLm1lc3NhZ2UpO1xuICB9XG4gIGlmIChjb25maWcudHlwZSA9PT0gJ29iamVjdCcgJiYgYXR0cmlidXRlcykge1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcyk7XG5cbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwga2V5cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBhID0ga2V5c1tpbmRleF07XG4gICAgICBpZiAoIWF0dHJpYnV0ZXNbYV0ub3B0aW9uYWwgfHwgb1thXSkge1xuICAgICAgICBpZiAoIWF0dHJpYnV0ZXNbYV0uY29uZGl0aW9uIHx8IGF0dHJpYnV0ZXNbYV0uY29uZGl0aW9uKG8pKSB7XG4gICAgICAgICAgYXR0cmlidXRlKG8sIGEsIGF0dHJpYnV0ZXNbYV0udHlwZSwgYXR0cmlidXRlc1thXS5tZXNzYWdlKTtcbiAgICAgICAgICBpZiAoYXR0cmlidXRlc1thXS52YWx1ZXMpIHtcbiAgICAgICAgICAgIHZhbHVlKG9bYV0sIGF0dHJpYnV0ZXNbYV0udmFsdWVzLCBhdHRyaWJ1dGVzW2FdLnZhbHVlX21lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFdyYXAgYEFycmF5LmlzQXJyYXlgIFBvbHlmaWxsIGZvciBJRTlcbiAqIHNvdXJjZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvaXNBcnJheVxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5XG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBpc0FycmF5KGFycmF5KSB7XG4gIGlmICh0aGlzLnN1cHBvcnRzSXNBcnJheSgpKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXJyYXkpO1xuICB9XG5cbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoYXJyYXkpID09PSAnW29iamVjdCBBcnJheV0nO1xufVxuXG5mdW5jdGlvbiBzdXBwb3J0c0lzQXJyYXkoKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5ICE9IG51bGw7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgY2hlY2s6IGNoZWNrLFxuICBhdHRyaWJ1dGU6IGF0dHJpYnV0ZSxcbiAgdmFyaWFibGU6IHZhcmlhYmxlLFxuICB2YWx1ZTogdmFsdWUsXG4gIGlzQXJyYXk6IGlzQXJyYXksXG4gIHN1cHBvcnRzSXNBcnJheTogc3VwcG9ydHNJc0FycmF5XG59O1xuIiwiLyogZXNsaW50LWRpc2FibGUgbm8tY29udGludWUgKi9cblxuZnVuY3Rpb24gZ2V0KCkge1xuICBpZiAoIU9iamVjdC5hc3NpZ24pIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduUG9seWZpbGw7XG4gIH1cblxuICByZXR1cm4gT2JqZWN0LmFzc2lnbjtcbn1cblxuZnVuY3Rpb24gb2JqZWN0QXNzaWduUG9seWZpbGwodGFyZ2V0KSB7XG4gIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCB8fCB0YXJnZXQgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCBmaXJzdCBhcmd1bWVudCB0byBvYmplY3QnKTtcbiAgfVxuXG4gIHZhciB0byA9IE9iamVjdCh0YXJnZXQpO1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBuZXh0U291cmNlID0gYXJndW1lbnRzW2ldO1xuICAgIGlmIChuZXh0U291cmNlID09PSB1bmRlZmluZWQgfHwgbmV4dFNvdXJjZSA9PT0gbnVsbCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgdmFyIGtleXNBcnJheSA9IE9iamVjdC5rZXlzKE9iamVjdChuZXh0U291cmNlKSk7XG4gICAgZm9yIChcbiAgICAgIHZhciBuZXh0SW5kZXggPSAwLCBsZW4gPSBrZXlzQXJyYXkubGVuZ3RoO1xuICAgICAgbmV4dEluZGV4IDwgbGVuO1xuICAgICAgbmV4dEluZGV4KytcbiAgICApIHtcbiAgICAgIHZhciBuZXh0S2V5ID0ga2V5c0FycmF5W25leHRJbmRleF07XG4gICAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IobmV4dFNvdXJjZSwgbmV4dEtleSk7XG4gICAgICBpZiAoZGVzYyAhPT0gdW5kZWZpbmVkICYmIGRlc2MuZW51bWVyYWJsZSkge1xuICAgICAgICB0b1tuZXh0S2V5XSA9IG5leHRTb3VyY2VbbmV4dEtleV07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0bztcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBnZXQ6IGdldCxcbiAgb2JqZWN0QXNzaWduUG9seWZpbGw6IG9iamVjdEFzc2lnblBvbHlmaWxsXG59O1xuIiwiLyogZXNsaW50LWRpc2FibGUgbm8tcGFyYW0tcmVhc3NpZ24gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXJlc3RyaWN0ZWQtc3ludGF4ICovXG4vKiBlc2xpbnQtZGlzYWJsZSBndWFyZC1mb3ItaW4gKi9cblxuaW1wb3J0IGFzc2VydCBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQgb2JqZWN0QXNzaWduIGZyb20gJy4vb2JqZWN0LWFzc2lnbic7XG5cbmZ1bmN0aW9uIHBpY2sob2JqZWN0LCBrZXlzKSB7XG4gIHJldHVybiBrZXlzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBrZXkpIHtcbiAgICBpZiAob2JqZWN0W2tleV0pIHtcbiAgICAgIHByZXZba2V5XSA9IG9iamVjdFtrZXldO1xuICAgIH1cbiAgICByZXR1cm4gcHJldjtcbiAgfSwge30pO1xufVxuXG5mdW5jdGlvbiBnZXRLZXlzTm90SW4ob2JqLCBhbGxvd2VkS2V5cykge1xuICB2YXIgbm90QWxsb3dlZCA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGFsbG93ZWRLZXlzLmluZGV4T2Yoa2V5KSA9PT0gLTEpIHtcbiAgICAgIG5vdEFsbG93ZWQucHVzaChrZXkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbm90QWxsb3dlZDtcbn1cblxuZnVuY3Rpb24gb2JqZWN0VmFsdWVzKG9iaikge1xuICB2YXIgdmFsdWVzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICB2YWx1ZXMucHVzaChvYmpba2V5XSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlcztcbn1cblxuZnVuY3Rpb24gZXh0ZW5kKCkge1xuICB2YXIgcGFyYW1zID0gb2JqZWN0VmFsdWVzKGFyZ3VtZW50cyk7XG4gIHBhcmFtcy51bnNoaWZ0KHt9KTtcbiAgcmV0dXJuIG9iamVjdEFzc2lnbi5nZXQoKS5hcHBseSh1bmRlZmluZWQsIHBhcmFtcyk7XG59XG5cbmZ1bmN0aW9uIG1lcmdlKG9iamVjdCwga2V5cykge1xuICByZXR1cm4ge1xuICAgIGJhc2U6IGtleXMgPyBwaWNrKG9iamVjdCwga2V5cykgOiBvYmplY3QsXG4gICAgd2l0aDogZnVuY3Rpb24ob2JqZWN0Miwga2V5czIpIHtcbiAgICAgIG9iamVjdDIgPSBrZXlzMiA/IHBpY2sob2JqZWN0Miwga2V5czIpIDogb2JqZWN0MjtcbiAgICAgIHJldHVybiBleHRlbmQodGhpcy5iYXNlLCBvYmplY3QyKTtcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGJsYWNrbGlzdChvYmplY3QsIGJsYWNrbGlzdGVkS2V5cykge1xuICByZXR1cm4gT2JqZWN0LmtleXMob2JqZWN0KS5yZWR1Y2UoZnVuY3Rpb24ocCwga2V5KSB7XG4gICAgaWYgKGJsYWNrbGlzdGVkS2V5cy5pbmRleE9mKGtleSkgPT09IC0xKSB7XG4gICAgICBwW2tleV0gPSBvYmplY3Rba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0sIHt9KTtcbn1cblxuZnVuY3Rpb24gY2FtZWxUb1NuYWtlKHN0cikge1xuICB2YXIgbmV3S2V5ID0gJyc7XG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBjb2RlO1xuICB2YXIgd2FzUHJldk51bWJlciA9IHRydWU7XG4gIHZhciB3YXNQcmV2VXBwZXJjYXNlID0gdHJ1ZTtcblxuICB3aGlsZSAoaW5kZXggPCBzdHIubGVuZ3RoKSB7XG4gICAgY29kZSA9IHN0ci5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICBpZiAoXG4gICAgICAoIXdhc1ByZXZVcHBlcmNhc2UgJiYgY29kZSA+PSA2NSAmJiBjb2RlIDw9IDkwKSB8fFxuICAgICAgKCF3YXNQcmV2TnVtYmVyICYmIGNvZGUgPj0gNDggJiYgY29kZSA8PSA1NylcbiAgICApIHtcbiAgICAgIG5ld0tleSArPSAnXyc7XG4gICAgICBuZXdLZXkgKz0gc3RyW2luZGV4XS50b0xvd2VyQ2FzZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdLZXkgKz0gc3RyW2luZGV4XS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgICB3YXNQcmV2TnVtYmVyID0gY29kZSA+PSA0OCAmJiBjb2RlIDw9IDU3O1xuICAgIHdhc1ByZXZVcHBlcmNhc2UgPSBjb2RlID49IDY1ICYmIGNvZGUgPD0gOTA7XG4gICAgaW5kZXgrKztcbiAgfVxuXG4gIHJldHVybiBuZXdLZXk7XG59XG5cbmZ1bmN0aW9uIHNuYWtlVG9DYW1lbChzdHIpIHtcbiAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KCdfJyk7XG4gIHJldHVybiBwYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocCwgYykge1xuICAgIHJldHVybiBwICsgYy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGMuc2xpY2UoMSk7XG4gIH0sIHBhcnRzLnNoaWZ0KCkpO1xufVxuXG5mdW5jdGlvbiB0b1NuYWtlQ2FzZShvYmplY3QsIGV4Y2VwdGlvbnMpIHtcbiAgaWYgKHR5cGVvZiBvYmplY3QgIT09ICdvYmplY3QnIHx8IGFzc2VydC5pc0FycmF5KG9iamVjdCkgfHwgb2JqZWN0ID09PSBudWxsKSB7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuICBleGNlcHRpb25zID0gZXhjZXB0aW9ucyB8fCBbXTtcblxuICByZXR1cm4gT2JqZWN0LmtleXMob2JqZWN0KS5yZWR1Y2UoZnVuY3Rpb24ocCwga2V5KSB7XG4gICAgdmFyIG5ld0tleSA9IGV4Y2VwdGlvbnMuaW5kZXhPZihrZXkpID09PSAtMSA/IGNhbWVsVG9TbmFrZShrZXkpIDoga2V5O1xuICAgIHBbbmV3S2V5XSA9IHRvU25ha2VDYXNlKG9iamVjdFtrZXldKTtcbiAgICByZXR1cm4gcDtcbiAgfSwge30pO1xufVxuXG5mdW5jdGlvbiB0b0NhbWVsQ2FzZShvYmplY3QsIGV4Y2VwdGlvbnMsIG9wdGlvbnMpIHtcbiAgaWYgKHR5cGVvZiBvYmplY3QgIT09ICdvYmplY3QnIHx8IGFzc2VydC5pc0FycmF5KG9iamVjdCkgfHwgb2JqZWN0ID09PSBudWxsKSB7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIGV4Y2VwdGlvbnMgPSBleGNlcHRpb25zIHx8IFtdO1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG9iamVjdCkucmVkdWNlKGZ1bmN0aW9uKHAsIGtleSkge1xuICAgIHZhciBuZXdLZXkgPSBleGNlcHRpb25zLmluZGV4T2Yoa2V5KSA9PT0gLTEgPyBzbmFrZVRvQ2FtZWwoa2V5KSA6IGtleTtcblxuICAgIHBbbmV3S2V5XSA9IHRvQ2FtZWxDYXNlKG9iamVjdFtuZXdLZXldIHx8IG9iamVjdFtrZXldLCBbXSwgb3B0aW9ucyk7XG5cbiAgICBpZiAob3B0aW9ucy5rZWVwT3JpZ2luYWwpIHtcbiAgICAgIHBba2V5XSA9IHRvQ2FtZWxDYXNlKG9iamVjdFtrZXldLCBbXSwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9LCB7fSk7XG59XG5cbmZ1bmN0aW9uIGdldExvY2F0aW9uRnJvbVVybChocmVmKSB7XG4gIHZhciBtYXRjaCA9IGhyZWYubWF0Y2goXG4gICAgL14oaHR0cHM/OnxmaWxlOnxjaHJvbWUtZXh0ZW5zaW9uOilcXC9cXC8oKFteOi8/I10qKSg/OjooWzAtOV0rKSk/KShbL117MCwxfVtePyNdKikoXFw/W14jXSp8KSgjLip8KSQvXG4gICk7XG4gIHJldHVybiAoXG4gICAgbWF0Y2ggJiYge1xuICAgICAgaHJlZjogaHJlZixcbiAgICAgIHByb3RvY29sOiBtYXRjaFsxXSxcbiAgICAgIGhvc3Q6IG1hdGNoWzJdLFxuICAgICAgaG9zdG5hbWU6IG1hdGNoWzNdLFxuICAgICAgcG9ydDogbWF0Y2hbNF0sXG4gICAgICBwYXRobmFtZTogbWF0Y2hbNV0sXG4gICAgICBzZWFyY2g6IG1hdGNoWzZdLFxuICAgICAgaGFzaDogbWF0Y2hbN11cbiAgICB9XG4gICk7XG59XG5cbmZ1bmN0aW9uIGdldE9yaWdpbkZyb21VcmwodXJsKSB7XG4gIGlmICghdXJsKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICB2YXIgcGFyc2VkID0gZ2V0TG9jYXRpb25Gcm9tVXJsKHVybCk7XG4gIGlmICghcGFyc2VkKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgdmFyIG9yaWdpbiA9IHBhcnNlZC5wcm90b2NvbCArICcvLycgKyBwYXJzZWQuaG9zdG5hbWU7XG4gIGlmIChwYXJzZWQucG9ydCkge1xuICAgIG9yaWdpbiArPSAnOicgKyBwYXJzZWQucG9ydDtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufVxuXG5mdW5jdGlvbiB0cmltKG9wdGlvbnMsIGtleSkge1xuICB2YXIgdHJpbW1lZCA9IGV4dGVuZChvcHRpb25zKTtcbiAgaWYgKG9wdGlvbnNba2V5XSkge1xuICAgIHRyaW1tZWRba2V5XSA9IG9wdGlvbnNba2V5XS50cmltKCk7XG4gIH1cbiAgcmV0dXJuIHRyaW1tZWQ7XG59XG5cbmZ1bmN0aW9uIHRyaW1NdWx0aXBsZShvcHRpb25zLCBrZXlzKSB7XG4gIHJldHVybiBrZXlzLnJlZHVjZSh0cmltLCBvcHRpb25zKTtcbn1cblxuZnVuY3Rpb24gdHJpbVVzZXJEZXRhaWxzKG9wdGlvbnMpIHtcbiAgcmV0dXJuIHRyaW1NdWx0aXBsZShvcHRpb25zLCBbJ3VzZXJuYW1lJywgJ2VtYWlsJywgJ3Bob25lTnVtYmVyJ10pO1xufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgb24gdGhlIGdpdmVuIG9iamVjdCwgdXNpbmcgYSBkZWVwIHBhdGggc2VsZWN0b3IuXG4gKiBAcGFyYW0ge29iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gc2V0IHRoZSBwcm9wZXJ0eSB2YWx1ZSBvblxuICogQHBhcmFtIHtzdHJpbmd8YXJyYXl9IHBhdGggVGhlIHBhdGggdG8gdGhlIHByb3BlcnR5IHRoYXQgc2hvdWxkIGhhdmUgaXRzIHZhbHVlIHVwZGF0ZWQuIGUuZy4gJ3Byb3AxLnByb3AyLnByb3AzJyBvciBbJ3Byb3AxJywgJ3Byb3AyJywgJ3Byb3AzJ11cbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0XG4gKiBAaWdub3JlXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVByb3BlcnR5T24ob2JqLCBwYXRoLCB2YWx1ZSkge1xuICBpZiAodHlwZW9mIHBhdGggPT09ICdzdHJpbmcnKSB7XG4gICAgcGF0aCA9IHBhdGguc3BsaXQoJy4nKTtcbiAgfVxuXG4gIHZhciBuZXh0ID0gcGF0aFswXTtcblxuICBpZiAob2JqLmhhc093blByb3BlcnR5KG5leHQpKSB7XG4gICAgaWYgKHBhdGgubGVuZ3RoID09PSAxKSB7XG4gICAgICBvYmpbbmV4dF0gPSB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlUHJvcGVydHlPbihvYmpbbmV4dF0sIHBhdGguc2xpY2UoMSksIHZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICB0b1NuYWtlQ2FzZTogdG9TbmFrZUNhc2UsXG4gIHRvQ2FtZWxDYXNlOiB0b0NhbWVsQ2FzZSxcbiAgYmxhY2tsaXN0OiBibGFja2xpc3QsXG4gIG1lcmdlOiBtZXJnZSxcbiAgcGljazogcGljayxcbiAgZ2V0S2V5c05vdEluOiBnZXRLZXlzTm90SW4sXG4gIGV4dGVuZDogZXh0ZW5kLFxuICBnZXRPcmlnaW5Gcm9tVXJsOiBnZXRPcmlnaW5Gcm9tVXJsLFxuICBnZXRMb2NhdGlvbkZyb21Vcmw6IGdldExvY2F0aW9uRnJvbVVybCxcbiAgdHJpbVVzZXJEZXRhaWxzOiB0cmltVXNlckRldGFpbHMsXG4gIHVwZGF0ZVByb3BlcnR5T246IHVwZGF0ZVByb3BlcnR5T25cbn07XG4iLCJpbXBvcnQgb2JqZWN0SGVscGVyIGZyb20gJy4vb2JqZWN0JztcblxuZnVuY3Rpb24gcmVkaXJlY3QodXJsKSB7XG4gIGdldFdpbmRvdygpLmxvY2F0aW9uID0gdXJsO1xufVxuXG5mdW5jdGlvbiBnZXREb2N1bWVudCgpIHtcbiAgcmV0dXJuIGdldFdpbmRvdygpLmRvY3VtZW50O1xufVxuXG5mdW5jdGlvbiBnZXRXaW5kb3coKSB7XG4gIHJldHVybiB3aW5kb3c7XG59XG5cbmZ1bmN0aW9uIGdldE9yaWdpbigpIHtcbiAgdmFyIGxvY2F0aW9uID0gZ2V0V2luZG93KCkubG9jYXRpb247XG4gIHZhciBvcmlnaW4gPSBsb2NhdGlvbi5vcmlnaW47XG5cbiAgaWYgKCFvcmlnaW4pIHtcbiAgICBvcmlnaW4gPSBvYmplY3RIZWxwZXIuZ2V0T3JpZ2luRnJvbVVybChsb2NhdGlvbi5ocmVmKTtcbiAgfVxuXG4gIHJldHVybiBvcmlnaW47XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgcmVkaXJlY3Q6IHJlZGlyZWN0LFxuICBnZXREb2N1bWVudDogZ2V0RG9jdW1lbnQsXG4gIGdldFdpbmRvdzogZ2V0V2luZG93LFxuICBnZXRPcmlnaW46IGdldE9yaWdpblxufTtcbiIsIihmdW5jdGlvbiAobmFtZSwgY29udGV4dCwgZGVmaW5pdGlvbikge1xuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xuICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIGRlZmluZShkZWZpbml0aW9uKTtcbiAgZWxzZSBjb250ZXh0W25hbWVdID0gZGVmaW5pdGlvbigpO1xufSkoJ3VybGpvaW4nLCB0aGlzLCBmdW5jdGlvbiAoKSB7XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplIChzdHJBcnJheSkge1xuICAgIHZhciByZXN1bHRBcnJheSA9IFtdO1xuICAgIGlmIChzdHJBcnJheS5sZW5ndGggPT09IDApIHsgcmV0dXJuICcnOyB9XG5cbiAgICBpZiAodHlwZW9mIHN0ckFycmF5WzBdICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVXJsIG11c3QgYmUgYSBzdHJpbmcuIFJlY2VpdmVkICcgKyBzdHJBcnJheVswXSk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGZpcnN0IHBhcnQgaXMgYSBwbGFpbiBwcm90b2NvbCwgd2UgY29tYmluZSBpdCB3aXRoIHRoZSBuZXh0IHBhcnQuXG4gICAgaWYgKHN0ckFycmF5WzBdLm1hdGNoKC9eW14vOl0rOlxcLyokLykgJiYgc3RyQXJyYXkubGVuZ3RoID4gMSkge1xuICAgICAgdmFyIGZpcnN0ID0gc3RyQXJyYXkuc2hpZnQoKTtcbiAgICAgIHN0ckFycmF5WzBdID0gZmlyc3QgKyBzdHJBcnJheVswXTtcbiAgICB9XG5cbiAgICAvLyBUaGVyZSBtdXN0IGJlIHR3byBvciB0aHJlZSBzbGFzaGVzIGluIHRoZSBmaWxlIHByb3RvY29sLCB0d28gc2xhc2hlcyBpbiBhbnl0aGluZyBlbHNlLlxuICAgIGlmIChzdHJBcnJheVswXS5tYXRjaCgvXmZpbGU6XFwvXFwvXFwvLykpIHtcbiAgICAgIHN0ckFycmF5WzBdID0gc3RyQXJyYXlbMF0ucmVwbGFjZSgvXihbXi86XSspOlxcLyovLCAnJDE6Ly8vJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ckFycmF5WzBdID0gc3RyQXJyYXlbMF0ucmVwbGFjZSgvXihbXi86XSspOlxcLyovLCAnJDE6Ly8nKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ckFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY29tcG9uZW50ID0gc3RyQXJyYXlbaV07XG5cbiAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVcmwgbXVzdCBiZSBhIHN0cmluZy4gUmVjZWl2ZWQgJyArIGNvbXBvbmVudCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb21wb25lbnQgPT09ICcnKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAvLyBSZW1vdmluZyB0aGUgc3RhcnRpbmcgc2xhc2hlcyBmb3IgZWFjaCBjb21wb25lbnQgYnV0IHRoZSBmaXJzdC5cbiAgICAgICAgY29tcG9uZW50ID0gY29tcG9uZW50LnJlcGxhY2UoL15bXFwvXSsvLCAnJyk7XG4gICAgICB9XG4gICAgICBpZiAoaSA8IHN0ckFycmF5Lmxlbmd0aCAtIDEpIHtcbiAgICAgICAgLy8gUmVtb3ZpbmcgdGhlIGVuZGluZyBzbGFzaGVzIGZvciBlYWNoIGNvbXBvbmVudCBidXQgdGhlIGxhc3QuXG4gICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudC5yZXBsYWNlKC9bXFwvXSskLywgJycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRm9yIHRoZSBsYXN0IGNvbXBvbmVudCB3ZSB3aWxsIGNvbWJpbmUgbXVsdGlwbGUgc2xhc2hlcyB0byBhIHNpbmdsZSBvbmUuXG4gICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudC5yZXBsYWNlKC9bXFwvXSskLywgJy8nKTtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0QXJyYXkucHVzaChjb21wb25lbnQpO1xuXG4gICAgfVxuXG4gICAgdmFyIHN0ciA9IHJlc3VsdEFycmF5LmpvaW4oJy8nKTtcbiAgICAvLyBFYWNoIGlucHV0IGNvbXBvbmVudCBpcyBub3cgc2VwYXJhdGVkIGJ5IGEgc2luZ2xlIHNsYXNoIGV4Y2VwdCB0aGUgcG9zc2libGUgZmlyc3QgcGxhaW4gcHJvdG9jb2wgcGFydC5cblxuICAgIC8vIHJlbW92ZSB0cmFpbGluZyBzbGFzaCBiZWZvcmUgcGFyYW1ldGVycyBvciBoYXNoXG4gICAgc3RyID0gc3RyLnJlcGxhY2UoL1xcLyhcXD98JnwjW14hXSkvZywgJyQxJyk7XG5cbiAgICAvLyByZXBsYWNlID8gaW4gcGFyYW1ldGVycyB3aXRoICZcbiAgICB2YXIgcGFydHMgPSBzdHIuc3BsaXQoJz8nKTtcbiAgICBzdHIgPSBwYXJ0cy5zaGlmdCgpICsgKHBhcnRzLmxlbmd0aCA+IDAgPyAnPyc6ICcnKSArIHBhcnRzLmpvaW4oJyYnKTtcblxuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBpbnB1dDtcblxuICAgIGlmICh0eXBlb2YgYXJndW1lbnRzWzBdID09PSAnb2JqZWN0Jykge1xuICAgICAgaW5wdXQgPSBhcmd1bWVudHNbMF07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlucHV0ID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBub3JtYWxpemUoaW5wdXQpO1xuICB9O1xuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyogZXNsaW50IGNvbXBsZXhpdHk6IFsyLCAxOF0sIG1heC1zdGF0ZW1lbnRzOiBbMiwgMzNdICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGhhc1N5bWJvbHMoKSB7XG5cdGlmICh0eXBlb2YgU3ltYm9sICE9PSAnZnVuY3Rpb24nIHx8IHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzICE9PSAnZnVuY3Rpb24nKSB7IHJldHVybiBmYWxzZTsgfVxuXHRpZiAodHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gJ3N5bWJvbCcpIHsgcmV0dXJuIHRydWU7IH1cblxuXHR2YXIgb2JqID0ge307XG5cdHZhciBzeW0gPSBTeW1ib2woJ3Rlc3QnKTtcblx0dmFyIHN5bU9iaiA9IE9iamVjdChzeW0pO1xuXHRpZiAodHlwZW9mIHN5bSA9PT0gJ3N0cmluZycpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0aWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzeW0pICE9PSAnW29iamVjdCBTeW1ib2xdJykgeyByZXR1cm4gZmFsc2U7IH1cblx0aWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzeW1PYmopICE9PSAnW29iamVjdCBTeW1ib2xdJykgeyByZXR1cm4gZmFsc2U7IH1cblxuXHQvLyB0ZW1wIGRpc2FibGVkIHBlciBodHRwczovL2dpdGh1Yi5jb20vbGpoYXJiL29iamVjdC5hc3NpZ24vaXNzdWVzLzE3XG5cdC8vIGlmIChzeW0gaW5zdGFuY2VvZiBTeW1ib2wpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdC8vIHRlbXAgZGlzYWJsZWQgcGVyIGh0dHBzOi8vZ2l0aHViLmNvbS9XZWJSZWZsZWN0aW9uL2dldC1vd24tcHJvcGVydHktc3ltYm9scy9pc3N1ZXMvNFxuXHQvLyBpZiAoIShzeW1PYmogaW5zdGFuY2VvZiBTeW1ib2wpKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdC8vIGlmICh0eXBlb2YgU3ltYm9sLnByb3RvdHlwZS50b1N0cmluZyAhPT0gJ2Z1bmN0aW9uJykgeyByZXR1cm4gZmFsc2U7IH1cblx0Ly8gaWYgKFN0cmluZyhzeW0pICE9PSBTeW1ib2wucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc3ltKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHR2YXIgc3ltVmFsID0gNDI7XG5cdG9ialtzeW1dID0gc3ltVmFsO1xuXHRmb3IgKHN5bSBpbiBvYmopIHsgcmV0dXJuIGZhbHNlOyB9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcmVzdHJpY3RlZC1zeW50YXgsIG5vLXVucmVhY2hhYmxlLWxvb3Bcblx0aWYgKHR5cGVvZiBPYmplY3Qua2V5cyA9PT0gJ2Z1bmN0aW9uJyAmJiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCAhPT0gMCkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHRpZiAodHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzID09PSAnZnVuY3Rpb24nICYmIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaikubGVuZ3RoICE9PSAwKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdHZhciBzeW1zID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvYmopO1xuXHRpZiAoc3ltcy5sZW5ndGggIT09IDEgfHwgc3ltc1swXSAhPT0gc3ltKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdGlmICghT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iaiwgc3ltKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHRpZiAodHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPT09ICdmdW5jdGlvbicpIHtcblx0XHR2YXIgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBzeW0pO1xuXHRcdGlmIChkZXNjcmlwdG9yLnZhbHVlICE9PSBzeW1WYWwgfHwgZGVzY3JpcHRvci5lbnVtZXJhYmxlICE9PSB0cnVlKSB7IHJldHVybiBmYWxzZTsgfVxuXHR9XG5cblx0cmV0dXJuIHRydWU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb3JpZ1N5bWJvbCA9IHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbDtcbnZhciBoYXNTeW1ib2xTaGFtID0gcmVxdWlyZSgnLi9zaGFtcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGhhc05hdGl2ZVN5bWJvbHMoKSB7XG5cdGlmICh0eXBlb2Ygb3JpZ1N5bWJvbCAhPT0gJ2Z1bmN0aW9uJykgeyByZXR1cm4gZmFsc2U7IH1cblx0aWYgKHR5cGVvZiBTeW1ib2wgIT09ICdmdW5jdGlvbicpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdGlmICh0eXBlb2Ygb3JpZ1N5bWJvbCgnZm9vJykgIT09ICdzeW1ib2wnKSB7IHJldHVybiBmYWxzZTsgfVxuXHRpZiAodHlwZW9mIFN5bWJvbCgnYmFyJykgIT09ICdzeW1ib2wnKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdHJldHVybiBoYXNTeW1ib2xTaGFtKCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdGVzdCA9IHtcblx0Zm9vOiB7fVxufTtcblxudmFyICRPYmplY3QgPSBPYmplY3Q7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaGFzUHJvdG8oKSB7XG5cdHJldHVybiB7IF9fcHJvdG9fXzogdGVzdCB9LmZvbyA9PT0gdGVzdC5mb28gJiYgISh7IF9fcHJvdG9fXzogbnVsbCB9IGluc3RhbmNlb2YgJE9iamVjdCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBlc2xpbnQgbm8taW52YWxpZC10aGlzOiAxICovXG5cbnZhciBFUlJPUl9NRVNTQUdFID0gJ0Z1bmN0aW9uLnByb3RvdHlwZS5iaW5kIGNhbGxlZCBvbiBpbmNvbXBhdGlibGUgJztcbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciB0b1N0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgZnVuY1R5cGUgPSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJpbmQodGhhdCkge1xuICAgIHZhciB0YXJnZXQgPSB0aGlzO1xuICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9PSAnZnVuY3Rpb24nIHx8IHRvU3RyLmNhbGwodGFyZ2V0KSAhPT0gZnVuY1R5cGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihFUlJPUl9NRVNTQUdFICsgdGFyZ2V0KTtcbiAgICB9XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICB2YXIgYm91bmQ7XG4gICAgdmFyIGJpbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMgaW5zdGFuY2VvZiBib3VuZCkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRhcmdldC5hcHBseShcbiAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSlcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXQuYXBwbHkoXG4gICAgICAgICAgICAgICAgdGhhdCxcbiAgICAgICAgICAgICAgICBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBib3VuZExlbmd0aCA9IE1hdGgubWF4KDAsIHRhcmdldC5sZW5ndGggLSBhcmdzLmxlbmd0aCk7XG4gICAgdmFyIGJvdW5kQXJncyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYm91bmRMZW5ndGg7IGkrKykge1xuICAgICAgICBib3VuZEFyZ3MucHVzaCgnJCcgKyBpKTtcbiAgICB9XG5cbiAgICBib3VuZCA9IEZ1bmN0aW9uKCdiaW5kZXInLCAncmV0dXJuIGZ1bmN0aW9uICgnICsgYm91bmRBcmdzLmpvaW4oJywnKSArICcpeyByZXR1cm4gYmluZGVyLmFwcGx5KHRoaXMsYXJndW1lbnRzKTsgfScpKGJpbmRlcik7XG5cbiAgICBpZiAodGFyZ2V0LnByb3RvdHlwZSkge1xuICAgICAgICB2YXIgRW1wdHkgPSBmdW5jdGlvbiBFbXB0eSgpIHt9O1xuICAgICAgICBFbXB0eS5wcm90b3R5cGUgPSB0YXJnZXQucHJvdG90eXBlO1xuICAgICAgICBib3VuZC5wcm90b3R5cGUgPSBuZXcgRW1wdHkoKTtcbiAgICAgICAgRW1wdHkucHJvdG90eXBlID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gYm91bmQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW1wbGVtZW50YXRpb24gPSByZXF1aXJlKCcuL2ltcGxlbWVudGF0aW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgfHwgaW1wbGVtZW50YXRpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiaW5kID0gcmVxdWlyZSgnZnVuY3Rpb24tYmluZCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJpbmQuY2FsbChGdW5jdGlvbi5jYWxsLCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHVuZGVmaW5lZDtcblxudmFyICRTeW50YXhFcnJvciA9IFN5bnRheEVycm9yO1xudmFyICRGdW5jdGlvbiA9IEZ1bmN0aW9uO1xudmFyICRUeXBlRXJyb3IgPSBUeXBlRXJyb3I7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb25zaXN0ZW50LXJldHVyblxudmFyIGdldEV2YWxsZWRDb25zdHJ1Y3RvciA9IGZ1bmN0aW9uIChleHByZXNzaW9uU3ludGF4KSB7XG5cdHRyeSB7XG5cdFx0cmV0dXJuICRGdW5jdGlvbignXCJ1c2Ugc3RyaWN0XCI7IHJldHVybiAoJyArIGV4cHJlc3Npb25TeW50YXggKyAnKS5jb25zdHJ1Y3RvcjsnKSgpO1xuXHR9IGNhdGNoIChlKSB7fVxufTtcblxudmFyICRnT1BEID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtcbmlmICgkZ09QRCkge1xuXHR0cnkge1xuXHRcdCRnT1BEKHt9LCAnJyk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHQkZ09QRCA9IG51bGw7IC8vIHRoaXMgaXMgSUUgOCwgd2hpY2ggaGFzIGEgYnJva2VuIGdPUERcblx0fVxufVxuXG52YXIgdGhyb3dUeXBlRXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cdHRocm93IG5ldyAkVHlwZUVycm9yKCk7XG59O1xudmFyIFRocm93VHlwZUVycm9yID0gJGdPUERcblx0PyAoZnVuY3Rpb24gKCkge1xuXHRcdHRyeSB7XG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLWV4cHJlc3Npb25zLCBuby1jYWxsZXIsIG5vLXJlc3RyaWN0ZWQtcHJvcGVydGllc1xuXHRcdFx0YXJndW1lbnRzLmNhbGxlZTsgLy8gSUUgOCBkb2VzIG5vdCB0aHJvdyBoZXJlXG5cdFx0XHRyZXR1cm4gdGhyb3dUeXBlRXJyb3I7XG5cdFx0fSBjYXRjaCAoY2FsbGVlVGhyb3dzKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHQvLyBJRSA4IHRocm93cyBvbiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGFyZ3VtZW50cywgJycpXG5cdFx0XHRcdHJldHVybiAkZ09QRChhcmd1bWVudHMsICdjYWxsZWUnKS5nZXQ7XG5cdFx0XHR9IGNhdGNoIChnT1BEdGhyb3dzKSB7XG5cdFx0XHRcdHJldHVybiB0aHJvd1R5cGVFcnJvcjtcblx0XHRcdH1cblx0XHR9XG5cdH0oKSlcblx0OiB0aHJvd1R5cGVFcnJvcjtcblxudmFyIGhhc1N5bWJvbHMgPSByZXF1aXJlKCdoYXMtc3ltYm9scycpKCk7XG52YXIgaGFzUHJvdG8gPSByZXF1aXJlKCdoYXMtcHJvdG8nKSgpO1xuXG52YXIgZ2V0UHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgfHwgKFxuXHRoYXNQcm90b1xuXHRcdD8gZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHguX19wcm90b19fOyB9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcHJvdG9cblx0XHQ6IG51bGxcbik7XG5cbnZhciBuZWVkc0V2YWwgPSB7fTtcblxudmFyIFR5cGVkQXJyYXkgPSB0eXBlb2YgVWludDhBcnJheSA9PT0gJ3VuZGVmaW5lZCcgfHwgIWdldFByb3RvID8gdW5kZWZpbmVkIDogZ2V0UHJvdG8oVWludDhBcnJheSk7XG5cbnZhciBJTlRSSU5TSUNTID0ge1xuXHQnJUFnZ3JlZ2F0ZUVycm9yJSc6IHR5cGVvZiBBZ2dyZWdhdGVFcnJvciA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBBZ2dyZWdhdGVFcnJvcixcblx0JyVBcnJheSUnOiBBcnJheSxcblx0JyVBcnJheUJ1ZmZlciUnOiB0eXBlb2YgQXJyYXlCdWZmZXIgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQXJyYXlCdWZmZXIsXG5cdCclQXJyYXlJdGVyYXRvclByb3RvdHlwZSUnOiBoYXNTeW1ib2xzICYmIGdldFByb3RvID8gZ2V0UHJvdG8oW11bU3ltYm9sLml0ZXJhdG9yXSgpKSA6IHVuZGVmaW5lZCxcblx0JyVBc3luY0Zyb21TeW5jSXRlcmF0b3JQcm90b3R5cGUlJzogdW5kZWZpbmVkLFxuXHQnJUFzeW5jRnVuY3Rpb24lJzogbmVlZHNFdmFsLFxuXHQnJUFzeW5jR2VuZXJhdG9yJSc6IG5lZWRzRXZhbCxcblx0JyVBc3luY0dlbmVyYXRvckZ1bmN0aW9uJSc6IG5lZWRzRXZhbCxcblx0JyVBc3luY0l0ZXJhdG9yUHJvdG90eXBlJSc6IG5lZWRzRXZhbCxcblx0JyVBdG9taWNzJSc6IHR5cGVvZiBBdG9taWNzID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEF0b21pY3MsXG5cdCclQmlnSW50JSc6IHR5cGVvZiBCaWdJbnQgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQmlnSW50LFxuXHQnJUJpZ0ludDY0QXJyYXklJzogdHlwZW9mIEJpZ0ludDY0QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQmlnSW50NjRBcnJheSxcblx0JyVCaWdVaW50NjRBcnJheSUnOiB0eXBlb2YgQmlnVWludDY0QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQmlnVWludDY0QXJyYXksXG5cdCclQm9vbGVhbiUnOiBCb29sZWFuLFxuXHQnJURhdGFWaWV3JSc6IHR5cGVvZiBEYXRhVmlldyA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBEYXRhVmlldyxcblx0JyVEYXRlJSc6IERhdGUsXG5cdCclZGVjb2RlVVJJJSc6IGRlY29kZVVSSSxcblx0JyVkZWNvZGVVUklDb21wb25lbnQlJzogZGVjb2RlVVJJQ29tcG9uZW50LFxuXHQnJWVuY29kZVVSSSUnOiBlbmNvZGVVUkksXG5cdCclZW5jb2RlVVJJQ29tcG9uZW50JSc6IGVuY29kZVVSSUNvbXBvbmVudCxcblx0JyVFcnJvciUnOiBFcnJvcixcblx0JyVldmFsJSc6IGV2YWwsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZXZhbFxuXHQnJUV2YWxFcnJvciUnOiBFdmFsRXJyb3IsXG5cdCclRmxvYXQzMkFycmF5JSc6IHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogRmxvYXQzMkFycmF5LFxuXHQnJUZsb2F0NjRBcnJheSUnOiB0eXBlb2YgRmxvYXQ2NEFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEZsb2F0NjRBcnJheSxcblx0JyVGaW5hbGl6YXRpb25SZWdpc3RyeSUnOiB0eXBlb2YgRmluYWxpemF0aW9uUmVnaXN0cnkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogRmluYWxpemF0aW9uUmVnaXN0cnksXG5cdCclRnVuY3Rpb24lJzogJEZ1bmN0aW9uLFxuXHQnJUdlbmVyYXRvckZ1bmN0aW9uJSc6IG5lZWRzRXZhbCxcblx0JyVJbnQ4QXJyYXklJzogdHlwZW9mIEludDhBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBJbnQ4QXJyYXksXG5cdCclSW50MTZBcnJheSUnOiB0eXBlb2YgSW50MTZBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBJbnQxNkFycmF5LFxuXHQnJUludDMyQXJyYXklJzogdHlwZW9mIEludDMyQXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogSW50MzJBcnJheSxcblx0JyVpc0Zpbml0ZSUnOiBpc0Zpbml0ZSxcblx0JyVpc05hTiUnOiBpc05hTixcblx0JyVJdGVyYXRvclByb3RvdHlwZSUnOiBoYXNTeW1ib2xzICYmIGdldFByb3RvID8gZ2V0UHJvdG8oZ2V0UHJvdG8oW11bU3ltYm9sLml0ZXJhdG9yXSgpKSkgOiB1bmRlZmluZWQsXG5cdCclSlNPTiUnOiB0eXBlb2YgSlNPTiA9PT0gJ29iamVjdCcgPyBKU09OIDogdW5kZWZpbmVkLFxuXHQnJU1hcCUnOiB0eXBlb2YgTWFwID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IE1hcCxcblx0JyVNYXBJdGVyYXRvclByb3RvdHlwZSUnOiB0eXBlb2YgTWFwID09PSAndW5kZWZpbmVkJyB8fCAhaGFzU3ltYm9scyB8fCAhZ2V0UHJvdG8gPyB1bmRlZmluZWQgOiBnZXRQcm90byhuZXcgTWFwKClbU3ltYm9sLml0ZXJhdG9yXSgpKSxcblx0JyVNYXRoJSc6IE1hdGgsXG5cdCclTnVtYmVyJSc6IE51bWJlcixcblx0JyVPYmplY3QlJzogT2JqZWN0LFxuXHQnJXBhcnNlRmxvYXQlJzogcGFyc2VGbG9hdCxcblx0JyVwYXJzZUludCUnOiBwYXJzZUludCxcblx0JyVQcm9taXNlJSc6IHR5cGVvZiBQcm9taXNlID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFByb21pc2UsXG5cdCclUHJveHklJzogdHlwZW9mIFByb3h5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFByb3h5LFxuXHQnJVJhbmdlRXJyb3IlJzogUmFuZ2VFcnJvcixcblx0JyVSZWZlcmVuY2VFcnJvciUnOiBSZWZlcmVuY2VFcnJvcixcblx0JyVSZWZsZWN0JSc6IHR5cGVvZiBSZWZsZWN0ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFJlZmxlY3QsXG5cdCclUmVnRXhwJSc6IFJlZ0V4cCxcblx0JyVTZXQlJzogdHlwZW9mIFNldCA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBTZXQsXG5cdCclU2V0SXRlcmF0b3JQcm90b3R5cGUlJzogdHlwZW9mIFNldCA9PT0gJ3VuZGVmaW5lZCcgfHwgIWhhc1N5bWJvbHMgfHwgIWdldFByb3RvID8gdW5kZWZpbmVkIDogZ2V0UHJvdG8obmV3IFNldCgpW1N5bWJvbC5pdGVyYXRvcl0oKSksXG5cdCclU2hhcmVkQXJyYXlCdWZmZXIlJzogdHlwZW9mIFNoYXJlZEFycmF5QnVmZmVyID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFNoYXJlZEFycmF5QnVmZmVyLFxuXHQnJVN0cmluZyUnOiBTdHJpbmcsXG5cdCclU3RyaW5nSXRlcmF0b3JQcm90b3R5cGUlJzogaGFzU3ltYm9scyAmJiBnZXRQcm90byA/IGdldFByb3RvKCcnW1N5bWJvbC5pdGVyYXRvcl0oKSkgOiB1bmRlZmluZWQsXG5cdCclU3ltYm9sJSc6IGhhc1N5bWJvbHMgPyBTeW1ib2wgOiB1bmRlZmluZWQsXG5cdCclU3ludGF4RXJyb3IlJzogJFN5bnRheEVycm9yLFxuXHQnJVRocm93VHlwZUVycm9yJSc6IFRocm93VHlwZUVycm9yLFxuXHQnJVR5cGVkQXJyYXklJzogVHlwZWRBcnJheSxcblx0JyVUeXBlRXJyb3IlJzogJFR5cGVFcnJvcixcblx0JyVVaW50OEFycmF5JSc6IHR5cGVvZiBVaW50OEFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFVpbnQ4QXJyYXksXG5cdCclVWludDhDbGFtcGVkQXJyYXklJzogdHlwZW9mIFVpbnQ4Q2xhbXBlZEFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFVpbnQ4Q2xhbXBlZEFycmF5LFxuXHQnJVVpbnQxNkFycmF5JSc6IHR5cGVvZiBVaW50MTZBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBVaW50MTZBcnJheSxcblx0JyVVaW50MzJBcnJheSUnOiB0eXBlb2YgVWludDMyQXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogVWludDMyQXJyYXksXG5cdCclVVJJRXJyb3IlJzogVVJJRXJyb3IsXG5cdCclV2Vha01hcCUnOiB0eXBlb2YgV2Vha01hcCA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBXZWFrTWFwLFxuXHQnJVdlYWtSZWYlJzogdHlwZW9mIFdlYWtSZWYgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogV2Vha1JlZixcblx0JyVXZWFrU2V0JSc6IHR5cGVvZiBXZWFrU2V0ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFdlYWtTZXRcbn07XG5cbmlmIChnZXRQcm90bykge1xuXHR0cnkge1xuXHRcdG51bGwuZXJyb3I7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLWV4cHJlc3Npb25zXG5cdH0gY2F0Y2ggKGUpIHtcblx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vdGMzOS9wcm9wb3NhbC1zaGFkb3dyZWFsbS9wdWxsLzM4NCNpc3N1ZWNvbW1lbnQtMTM2NDI2NDIyOVxuXHRcdHZhciBlcnJvclByb3RvID0gZ2V0UHJvdG8oZ2V0UHJvdG8oZSkpO1xuXHRcdElOVFJJTlNJQ1NbJyVFcnJvci5wcm90b3R5cGUlJ10gPSBlcnJvclByb3RvO1xuXHR9XG59XG5cbnZhciBkb0V2YWwgPSBmdW5jdGlvbiBkb0V2YWwobmFtZSkge1xuXHR2YXIgdmFsdWU7XG5cdGlmIChuYW1lID09PSAnJUFzeW5jRnVuY3Rpb24lJykge1xuXHRcdHZhbHVlID0gZ2V0RXZhbGxlZENvbnN0cnVjdG9yKCdhc3luYyBmdW5jdGlvbiAoKSB7fScpO1xuXHR9IGVsc2UgaWYgKG5hbWUgPT09ICclR2VuZXJhdG9yRnVuY3Rpb24lJykge1xuXHRcdHZhbHVlID0gZ2V0RXZhbGxlZENvbnN0cnVjdG9yKCdmdW5jdGlvbiogKCkge30nKTtcblx0fSBlbHNlIGlmIChuYW1lID09PSAnJUFzeW5jR2VuZXJhdG9yRnVuY3Rpb24lJykge1xuXHRcdHZhbHVlID0gZ2V0RXZhbGxlZENvbnN0cnVjdG9yKCdhc3luYyBmdW5jdGlvbiogKCkge30nKTtcblx0fSBlbHNlIGlmIChuYW1lID09PSAnJUFzeW5jR2VuZXJhdG9yJScpIHtcblx0XHR2YXIgZm4gPSBkb0V2YWwoJyVBc3luY0dlbmVyYXRvckZ1bmN0aW9uJScpO1xuXHRcdGlmIChmbikge1xuXHRcdFx0dmFsdWUgPSBmbi5wcm90b3R5cGU7XG5cdFx0fVxuXHR9IGVsc2UgaWYgKG5hbWUgPT09ICclQXN5bmNJdGVyYXRvclByb3RvdHlwZSUnKSB7XG5cdFx0dmFyIGdlbiA9IGRvRXZhbCgnJUFzeW5jR2VuZXJhdG9yJScpO1xuXHRcdGlmIChnZW4gJiYgZ2V0UHJvdG8pIHtcblx0XHRcdHZhbHVlID0gZ2V0UHJvdG8oZ2VuLnByb3RvdHlwZSk7XG5cdFx0fVxuXHR9XG5cblx0SU5UUklOU0lDU1tuYW1lXSA9IHZhbHVlO1xuXG5cdHJldHVybiB2YWx1ZTtcbn07XG5cbnZhciBMRUdBQ1lfQUxJQVNFUyA9IHtcblx0JyVBcnJheUJ1ZmZlclByb3RvdHlwZSUnOiBbJ0FycmF5QnVmZmVyJywgJ3Byb3RvdHlwZSddLFxuXHQnJUFycmF5UHJvdG90eXBlJSc6IFsnQXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclQXJyYXlQcm90b19lbnRyaWVzJSc6IFsnQXJyYXknLCAncHJvdG90eXBlJywgJ2VudHJpZXMnXSxcblx0JyVBcnJheVByb3RvX2ZvckVhY2glJzogWydBcnJheScsICdwcm90b3R5cGUnLCAnZm9yRWFjaCddLFxuXHQnJUFycmF5UHJvdG9fa2V5cyUnOiBbJ0FycmF5JywgJ3Byb3RvdHlwZScsICdrZXlzJ10sXG5cdCclQXJyYXlQcm90b192YWx1ZXMlJzogWydBcnJheScsICdwcm90b3R5cGUnLCAndmFsdWVzJ10sXG5cdCclQXN5bmNGdW5jdGlvblByb3RvdHlwZSUnOiBbJ0FzeW5jRnVuY3Rpb24nLCAncHJvdG90eXBlJ10sXG5cdCclQXN5bmNHZW5lcmF0b3IlJzogWydBc3luY0dlbmVyYXRvckZ1bmN0aW9uJywgJ3Byb3RvdHlwZSddLFxuXHQnJUFzeW5jR2VuZXJhdG9yUHJvdG90eXBlJSc6IFsnQXN5bmNHZW5lcmF0b3JGdW5jdGlvbicsICdwcm90b3R5cGUnLCAncHJvdG90eXBlJ10sXG5cdCclQm9vbGVhblByb3RvdHlwZSUnOiBbJ0Jvb2xlYW4nLCAncHJvdG90eXBlJ10sXG5cdCclRGF0YVZpZXdQcm90b3R5cGUlJzogWydEYXRhVmlldycsICdwcm90b3R5cGUnXSxcblx0JyVEYXRlUHJvdG90eXBlJSc6IFsnRGF0ZScsICdwcm90b3R5cGUnXSxcblx0JyVFcnJvclByb3RvdHlwZSUnOiBbJ0Vycm9yJywgJ3Byb3RvdHlwZSddLFxuXHQnJUV2YWxFcnJvclByb3RvdHlwZSUnOiBbJ0V2YWxFcnJvcicsICdwcm90b3R5cGUnXSxcblx0JyVGbG9hdDMyQXJyYXlQcm90b3R5cGUlJzogWydGbG9hdDMyQXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclRmxvYXQ2NEFycmF5UHJvdG90eXBlJSc6IFsnRmxvYXQ2NEFycmF5JywgJ3Byb3RvdHlwZSddLFxuXHQnJUZ1bmN0aW9uUHJvdG90eXBlJSc6IFsnRnVuY3Rpb24nLCAncHJvdG90eXBlJ10sXG5cdCclR2VuZXJhdG9yJSc6IFsnR2VuZXJhdG9yRnVuY3Rpb24nLCAncHJvdG90eXBlJ10sXG5cdCclR2VuZXJhdG9yUHJvdG90eXBlJSc6IFsnR2VuZXJhdG9yRnVuY3Rpb24nLCAncHJvdG90eXBlJywgJ3Byb3RvdHlwZSddLFxuXHQnJUludDhBcnJheVByb3RvdHlwZSUnOiBbJ0ludDhBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVJbnQxNkFycmF5UHJvdG90eXBlJSc6IFsnSW50MTZBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVJbnQzMkFycmF5UHJvdG90eXBlJSc6IFsnSW50MzJBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVKU09OUGFyc2UlJzogWydKU09OJywgJ3BhcnNlJ10sXG5cdCclSlNPTlN0cmluZ2lmeSUnOiBbJ0pTT04nLCAnc3RyaW5naWZ5J10sXG5cdCclTWFwUHJvdG90eXBlJSc6IFsnTWFwJywgJ3Byb3RvdHlwZSddLFxuXHQnJU51bWJlclByb3RvdHlwZSUnOiBbJ051bWJlcicsICdwcm90b3R5cGUnXSxcblx0JyVPYmplY3RQcm90b3R5cGUlJzogWydPYmplY3QnLCAncHJvdG90eXBlJ10sXG5cdCclT2JqUHJvdG9fdG9TdHJpbmclJzogWydPYmplY3QnLCAncHJvdG90eXBlJywgJ3RvU3RyaW5nJ10sXG5cdCclT2JqUHJvdG9fdmFsdWVPZiUnOiBbJ09iamVjdCcsICdwcm90b3R5cGUnLCAndmFsdWVPZiddLFxuXHQnJVByb21pc2VQcm90b3R5cGUlJzogWydQcm9taXNlJywgJ3Byb3RvdHlwZSddLFxuXHQnJVByb21pc2VQcm90b190aGVuJSc6IFsnUHJvbWlzZScsICdwcm90b3R5cGUnLCAndGhlbiddLFxuXHQnJVByb21pc2VfYWxsJSc6IFsnUHJvbWlzZScsICdhbGwnXSxcblx0JyVQcm9taXNlX3JlamVjdCUnOiBbJ1Byb21pc2UnLCAncmVqZWN0J10sXG5cdCclUHJvbWlzZV9yZXNvbHZlJSc6IFsnUHJvbWlzZScsICdyZXNvbHZlJ10sXG5cdCclUmFuZ2VFcnJvclByb3RvdHlwZSUnOiBbJ1JhbmdlRXJyb3InLCAncHJvdG90eXBlJ10sXG5cdCclUmVmZXJlbmNlRXJyb3JQcm90b3R5cGUlJzogWydSZWZlcmVuY2VFcnJvcicsICdwcm90b3R5cGUnXSxcblx0JyVSZWdFeHBQcm90b3R5cGUlJzogWydSZWdFeHAnLCAncHJvdG90eXBlJ10sXG5cdCclU2V0UHJvdG90eXBlJSc6IFsnU2V0JywgJ3Byb3RvdHlwZSddLFxuXHQnJVNoYXJlZEFycmF5QnVmZmVyUHJvdG90eXBlJSc6IFsnU2hhcmVkQXJyYXlCdWZmZXInLCAncHJvdG90eXBlJ10sXG5cdCclU3RyaW5nUHJvdG90eXBlJSc6IFsnU3RyaW5nJywgJ3Byb3RvdHlwZSddLFxuXHQnJVN5bWJvbFByb3RvdHlwZSUnOiBbJ1N5bWJvbCcsICdwcm90b3R5cGUnXSxcblx0JyVTeW50YXhFcnJvclByb3RvdHlwZSUnOiBbJ1N5bnRheEVycm9yJywgJ3Byb3RvdHlwZSddLFxuXHQnJVR5cGVkQXJyYXlQcm90b3R5cGUlJzogWydUeXBlZEFycmF5JywgJ3Byb3RvdHlwZSddLFxuXHQnJVR5cGVFcnJvclByb3RvdHlwZSUnOiBbJ1R5cGVFcnJvcicsICdwcm90b3R5cGUnXSxcblx0JyVVaW50OEFycmF5UHJvdG90eXBlJSc6IFsnVWludDhBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVVaW50OENsYW1wZWRBcnJheVByb3RvdHlwZSUnOiBbJ1VpbnQ4Q2xhbXBlZEFycmF5JywgJ3Byb3RvdHlwZSddLFxuXHQnJVVpbnQxNkFycmF5UHJvdG90eXBlJSc6IFsnVWludDE2QXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclVWludDMyQXJyYXlQcm90b3R5cGUlJzogWydVaW50MzJBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVVUklFcnJvclByb3RvdHlwZSUnOiBbJ1VSSUVycm9yJywgJ3Byb3RvdHlwZSddLFxuXHQnJVdlYWtNYXBQcm90b3R5cGUlJzogWydXZWFrTWFwJywgJ3Byb3RvdHlwZSddLFxuXHQnJVdlYWtTZXRQcm90b3R5cGUlJzogWydXZWFrU2V0JywgJ3Byb3RvdHlwZSddXG59O1xuXG52YXIgYmluZCA9IHJlcXVpcmUoJ2Z1bmN0aW9uLWJpbmQnKTtcbnZhciBoYXNPd24gPSByZXF1aXJlKCdoYXMnKTtcbnZhciAkY29uY2F0ID0gYmluZC5jYWxsKEZ1bmN0aW9uLmNhbGwsIEFycmF5LnByb3RvdHlwZS5jb25jYXQpO1xudmFyICRzcGxpY2VBcHBseSA9IGJpbmQuY2FsbChGdW5jdGlvbi5hcHBseSwgQXJyYXkucHJvdG90eXBlLnNwbGljZSk7XG52YXIgJHJlcGxhY2UgPSBiaW5kLmNhbGwoRnVuY3Rpb24uY2FsbCwgU3RyaW5nLnByb3RvdHlwZS5yZXBsYWNlKTtcbnZhciAkc3RyU2xpY2UgPSBiaW5kLmNhbGwoRnVuY3Rpb24uY2FsbCwgU3RyaW5nLnByb3RvdHlwZS5zbGljZSk7XG52YXIgJGV4ZWMgPSBiaW5kLmNhbGwoRnVuY3Rpb24uY2FsbCwgUmVnRXhwLnByb3RvdHlwZS5leGVjKTtcblxuLyogYWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9sb2Rhc2gvbG9kYXNoL2Jsb2IvNC4xNy4xNS9kaXN0L2xvZGFzaC5qcyNMNjczNS1MNjc0NCAqL1xudmFyIHJlUHJvcE5hbWUgPSAvW14lLltcXF1dK3xcXFsoPzooLT9cXGQrKD86XFwuXFxkKyk/KXwoW1wiJ10pKCg/Oig/IVxcMilbXlxcXFxdfFxcXFwuKSo/KVxcMilcXF18KD89KD86XFwufFxcW1xcXSkoPzpcXC58XFxbXFxdfCUkKSkvZztcbnZhciByZUVzY2FwZUNoYXIgPSAvXFxcXChcXFxcKT8vZzsgLyoqIFVzZWQgdG8gbWF0Y2ggYmFja3NsYXNoZXMgaW4gcHJvcGVydHkgcGF0aHMuICovXG52YXIgc3RyaW5nVG9QYXRoID0gZnVuY3Rpb24gc3RyaW5nVG9QYXRoKHN0cmluZykge1xuXHR2YXIgZmlyc3QgPSAkc3RyU2xpY2Uoc3RyaW5nLCAwLCAxKTtcblx0dmFyIGxhc3QgPSAkc3RyU2xpY2Uoc3RyaW5nLCAtMSk7XG5cdGlmIChmaXJzdCA9PT0gJyUnICYmIGxhc3QgIT09ICclJykge1xuXHRcdHRocm93IG5ldyAkU3ludGF4RXJyb3IoJ2ludmFsaWQgaW50cmluc2ljIHN5bnRheCwgZXhwZWN0ZWQgY2xvc2luZyBgJWAnKTtcblx0fSBlbHNlIGlmIChsYXN0ID09PSAnJScgJiYgZmlyc3QgIT09ICclJykge1xuXHRcdHRocm93IG5ldyAkU3ludGF4RXJyb3IoJ2ludmFsaWQgaW50cmluc2ljIHN5bnRheCwgZXhwZWN0ZWQgb3BlbmluZyBgJWAnKTtcblx0fVxuXHR2YXIgcmVzdWx0ID0gW107XG5cdCRyZXBsYWNlKHN0cmluZywgcmVQcm9wTmFtZSwgZnVuY3Rpb24gKG1hdGNoLCBudW1iZXIsIHF1b3RlLCBzdWJTdHJpbmcpIHtcblx0XHRyZXN1bHRbcmVzdWx0Lmxlbmd0aF0gPSBxdW90ZSA/ICRyZXBsYWNlKHN1YlN0cmluZywgcmVFc2NhcGVDaGFyLCAnJDEnKSA6IG51bWJlciB8fCBtYXRjaDtcblx0fSk7XG5cdHJldHVybiByZXN1bHQ7XG59O1xuLyogZW5kIGFkYXB0YXRpb24gKi9cblxudmFyIGdldEJhc2VJbnRyaW5zaWMgPSBmdW5jdGlvbiBnZXRCYXNlSW50cmluc2ljKG5hbWUsIGFsbG93TWlzc2luZykge1xuXHR2YXIgaW50cmluc2ljTmFtZSA9IG5hbWU7XG5cdHZhciBhbGlhcztcblx0aWYgKGhhc093bihMRUdBQ1lfQUxJQVNFUywgaW50cmluc2ljTmFtZSkpIHtcblx0XHRhbGlhcyA9IExFR0FDWV9BTElBU0VTW2ludHJpbnNpY05hbWVdO1xuXHRcdGludHJpbnNpY05hbWUgPSAnJScgKyBhbGlhc1swXSArICclJztcblx0fVxuXG5cdGlmIChoYXNPd24oSU5UUklOU0lDUywgaW50cmluc2ljTmFtZSkpIHtcblx0XHR2YXIgdmFsdWUgPSBJTlRSSU5TSUNTW2ludHJpbnNpY05hbWVdO1xuXHRcdGlmICh2YWx1ZSA9PT0gbmVlZHNFdmFsKSB7XG5cdFx0XHR2YWx1ZSA9IGRvRXZhbChpbnRyaW5zaWNOYW1lKTtcblx0XHR9XG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcgJiYgIWFsbG93TWlzc2luZykge1xuXHRcdFx0dGhyb3cgbmV3ICRUeXBlRXJyb3IoJ2ludHJpbnNpYyAnICsgbmFtZSArICcgZXhpc3RzLCBidXQgaXMgbm90IGF2YWlsYWJsZS4gUGxlYXNlIGZpbGUgYW4gaXNzdWUhJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGFsaWFzOiBhbGlhcyxcblx0XHRcdG5hbWU6IGludHJpbnNpY05hbWUsXG5cdFx0XHR2YWx1ZTogdmFsdWVcblx0XHR9O1xuXHR9XG5cblx0dGhyb3cgbmV3ICRTeW50YXhFcnJvcignaW50cmluc2ljICcgKyBuYW1lICsgJyBkb2VzIG5vdCBleGlzdCEnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gR2V0SW50cmluc2ljKG5hbWUsIGFsbG93TWlzc2luZykge1xuXHRpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnIHx8IG5hbWUubGVuZ3RoID09PSAwKSB7XG5cdFx0dGhyb3cgbmV3ICRUeXBlRXJyb3IoJ2ludHJpbnNpYyBuYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyk7XG5cdH1cblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIHR5cGVvZiBhbGxvd01pc3NpbmcgIT09ICdib29sZWFuJykge1xuXHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdcImFsbG93TWlzc2luZ1wiIGFyZ3VtZW50IG11c3QgYmUgYSBib29sZWFuJyk7XG5cdH1cblxuXHRpZiAoJGV4ZWMoL14lP1teJV0qJT8kLywgbmFtZSkgPT09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgJFN5bnRheEVycm9yKCdgJWAgbWF5IG5vdCBiZSBwcmVzZW50IGFueXdoZXJlIGJ1dCBhdCB0aGUgYmVnaW5uaW5nIGFuZCBlbmQgb2YgdGhlIGludHJpbnNpYyBuYW1lJyk7XG5cdH1cblx0dmFyIHBhcnRzID0gc3RyaW5nVG9QYXRoKG5hbWUpO1xuXHR2YXIgaW50cmluc2ljQmFzZU5hbWUgPSBwYXJ0cy5sZW5ndGggPiAwID8gcGFydHNbMF0gOiAnJztcblxuXHR2YXIgaW50cmluc2ljID0gZ2V0QmFzZUludHJpbnNpYygnJScgKyBpbnRyaW5zaWNCYXNlTmFtZSArICclJywgYWxsb3dNaXNzaW5nKTtcblx0dmFyIGludHJpbnNpY1JlYWxOYW1lID0gaW50cmluc2ljLm5hbWU7XG5cdHZhciB2YWx1ZSA9IGludHJpbnNpYy52YWx1ZTtcblx0dmFyIHNraXBGdXJ0aGVyQ2FjaGluZyA9IGZhbHNlO1xuXG5cdHZhciBhbGlhcyA9IGludHJpbnNpYy5hbGlhcztcblx0aWYgKGFsaWFzKSB7XG5cdFx0aW50cmluc2ljQmFzZU5hbWUgPSBhbGlhc1swXTtcblx0XHQkc3BsaWNlQXBwbHkocGFydHMsICRjb25jYXQoWzAsIDFdLCBhbGlhcykpO1xuXHR9XG5cblx0Zm9yICh2YXIgaSA9IDEsIGlzT3duID0gdHJ1ZTsgaSA8IHBhcnRzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0dmFyIHBhcnQgPSBwYXJ0c1tpXTtcblx0XHR2YXIgZmlyc3QgPSAkc3RyU2xpY2UocGFydCwgMCwgMSk7XG5cdFx0dmFyIGxhc3QgPSAkc3RyU2xpY2UocGFydCwgLTEpO1xuXHRcdGlmIChcblx0XHRcdChcblx0XHRcdFx0KGZpcnN0ID09PSAnXCInIHx8IGZpcnN0ID09PSBcIidcIiB8fCBmaXJzdCA9PT0gJ2AnKVxuXHRcdFx0XHR8fCAobGFzdCA9PT0gJ1wiJyB8fCBsYXN0ID09PSBcIidcIiB8fCBsYXN0ID09PSAnYCcpXG5cdFx0XHQpXG5cdFx0XHQmJiBmaXJzdCAhPT0gbGFzdFxuXHRcdCkge1xuXHRcdFx0dGhyb3cgbmV3ICRTeW50YXhFcnJvcigncHJvcGVydHkgbmFtZXMgd2l0aCBxdW90ZXMgbXVzdCBoYXZlIG1hdGNoaW5nIHF1b3RlcycpO1xuXHRcdH1cblx0XHRpZiAocGFydCA9PT0gJ2NvbnN0cnVjdG9yJyB8fCAhaXNPd24pIHtcblx0XHRcdHNraXBGdXJ0aGVyQ2FjaGluZyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aW50cmluc2ljQmFzZU5hbWUgKz0gJy4nICsgcGFydDtcblx0XHRpbnRyaW5zaWNSZWFsTmFtZSA9ICclJyArIGludHJpbnNpY0Jhc2VOYW1lICsgJyUnO1xuXG5cdFx0aWYgKGhhc093bihJTlRSSU5TSUNTLCBpbnRyaW5zaWNSZWFsTmFtZSkpIHtcblx0XHRcdHZhbHVlID0gSU5UUklOU0lDU1tpbnRyaW5zaWNSZWFsTmFtZV07XG5cdFx0fSBlbHNlIGlmICh2YWx1ZSAhPSBudWxsKSB7XG5cdFx0XHRpZiAoIShwYXJ0IGluIHZhbHVlKSkge1xuXHRcdFx0XHRpZiAoIWFsbG93TWlzc2luZykge1xuXHRcdFx0XHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdiYXNlIGludHJpbnNpYyBmb3IgJyArIG5hbWUgKyAnIGV4aXN0cywgYnV0IHRoZSBwcm9wZXJ0eSBpcyBub3QgYXZhaWxhYmxlLicpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB2b2lkIHVuZGVmaW5lZDtcblx0XHRcdH1cblx0XHRcdGlmICgkZ09QRCAmJiAoaSArIDEpID49IHBhcnRzLmxlbmd0aCkge1xuXHRcdFx0XHR2YXIgZGVzYyA9ICRnT1BEKHZhbHVlLCBwYXJ0KTtcblx0XHRcdFx0aXNPd24gPSAhIWRlc2M7XG5cblx0XHRcdFx0Ly8gQnkgY29udmVudGlvbiwgd2hlbiBhIGRhdGEgcHJvcGVydHkgaXMgY29udmVydGVkIHRvIGFuIGFjY2Vzc29yXG5cdFx0XHRcdC8vIHByb3BlcnR5IHRvIGVtdWxhdGUgYSBkYXRhIHByb3BlcnR5IHRoYXQgZG9lcyBub3Qgc3VmZmVyIGZyb21cblx0XHRcdFx0Ly8gdGhlIG92ZXJyaWRlIG1pc3Rha2UsIHRoYXQgYWNjZXNzb3IncyBnZXR0ZXIgaXMgbWFya2VkIHdpdGhcblx0XHRcdFx0Ly8gYW4gYG9yaWdpbmFsVmFsdWVgIHByb3BlcnR5LiBIZXJlLCB3aGVuIHdlIGRldGVjdCB0aGlzLCB3ZVxuXHRcdFx0XHQvLyB1cGhvbGQgdGhlIGlsbHVzaW9uIGJ5IHByZXRlbmRpbmcgdG8gc2VlIHRoYXQgb3JpZ2luYWwgZGF0YVxuXHRcdFx0XHQvLyBwcm9wZXJ0eSwgaS5lLiwgcmV0dXJuaW5nIHRoZSB2YWx1ZSByYXRoZXIgdGhhbiB0aGUgZ2V0dGVyXG5cdFx0XHRcdC8vIGl0c2VsZi5cblx0XHRcdFx0aWYgKGlzT3duICYmICdnZXQnIGluIGRlc2MgJiYgISgnb3JpZ2luYWxWYWx1ZScgaW4gZGVzYy5nZXQpKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSBkZXNjLmdldDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2YWx1ZSA9IHZhbHVlW3BhcnRdO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpc093biA9IGhhc093bih2YWx1ZSwgcGFydCk7XG5cdFx0XHRcdHZhbHVlID0gdmFsdWVbcGFydF07XG5cdFx0XHR9XG5cblx0XHRcdGlmIChpc093biAmJiAhc2tpcEZ1cnRoZXJDYWNoaW5nKSB7XG5cdFx0XHRcdElOVFJJTlNJQ1NbaW50cmluc2ljUmVhbE5hbWVdID0gdmFsdWU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiB2YWx1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiaW5kID0gcmVxdWlyZSgnZnVuY3Rpb24tYmluZCcpO1xudmFyIEdldEludHJpbnNpYyA9IHJlcXVpcmUoJ2dldC1pbnRyaW5zaWMnKTtcblxudmFyICRhcHBseSA9IEdldEludHJpbnNpYygnJUZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseSUnKTtcbnZhciAkY2FsbCA9IEdldEludHJpbnNpYygnJUZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsJScpO1xudmFyICRyZWZsZWN0QXBwbHkgPSBHZXRJbnRyaW5zaWMoJyVSZWZsZWN0LmFwcGx5JScsIHRydWUpIHx8IGJpbmQuY2FsbCgkY2FsbCwgJGFwcGx5KTtcblxudmFyICRnT1BEID0gR2V0SW50cmluc2ljKCclT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciUnLCB0cnVlKTtcbnZhciAkZGVmaW5lUHJvcGVydHkgPSBHZXRJbnRyaW5zaWMoJyVPYmplY3QuZGVmaW5lUHJvcGVydHklJywgdHJ1ZSk7XG52YXIgJG1heCA9IEdldEludHJpbnNpYygnJU1hdGgubWF4JScpO1xuXG5pZiAoJGRlZmluZVByb3BlcnR5KSB7XG5cdHRyeSB7XG5cdFx0JGRlZmluZVByb3BlcnR5KHt9LCAnYScsIHsgdmFsdWU6IDEgfSk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHQvLyBJRSA4IGhhcyBhIGJyb2tlbiBkZWZpbmVQcm9wZXJ0eVxuXHRcdCRkZWZpbmVQcm9wZXJ0eSA9IG51bGw7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjYWxsQmluZChvcmlnaW5hbEZ1bmN0aW9uKSB7XG5cdHZhciBmdW5jID0gJHJlZmxlY3RBcHBseShiaW5kLCAkY2FsbCwgYXJndW1lbnRzKTtcblx0aWYgKCRnT1BEICYmICRkZWZpbmVQcm9wZXJ0eSkge1xuXHRcdHZhciBkZXNjID0gJGdPUEQoZnVuYywgJ2xlbmd0aCcpO1xuXHRcdGlmIChkZXNjLmNvbmZpZ3VyYWJsZSkge1xuXHRcdFx0Ly8gb3JpZ2luYWwgbGVuZ3RoLCBwbHVzIHRoZSByZWNlaXZlciwgbWludXMgYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzIChhZnRlciB0aGUgcmVjZWl2ZXIpXG5cdFx0XHQkZGVmaW5lUHJvcGVydHkoXG5cdFx0XHRcdGZ1bmMsXG5cdFx0XHRcdCdsZW5ndGgnLFxuXHRcdFx0XHR7IHZhbHVlOiAxICsgJG1heCgwLCBvcmlnaW5hbEZ1bmN0aW9uLmxlbmd0aCAtIChhcmd1bWVudHMubGVuZ3RoIC0gMSkpIH1cblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBmdW5jO1xufTtcblxudmFyIGFwcGx5QmluZCA9IGZ1bmN0aW9uIGFwcGx5QmluZCgpIHtcblx0cmV0dXJuICRyZWZsZWN0QXBwbHkoYmluZCwgJGFwcGx5LCBhcmd1bWVudHMpO1xufTtcblxuaWYgKCRkZWZpbmVQcm9wZXJ0eSkge1xuXHQkZGVmaW5lUHJvcGVydHkobW9kdWxlLmV4cG9ydHMsICdhcHBseScsIHsgdmFsdWU6IGFwcGx5QmluZCB9KTtcbn0gZWxzZSB7XG5cdG1vZHVsZS5leHBvcnRzLmFwcGx5ID0gYXBwbHlCaW5kO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR2V0SW50cmluc2ljID0gcmVxdWlyZSgnZ2V0LWludHJpbnNpYycpO1xuXG52YXIgY2FsbEJpbmQgPSByZXF1aXJlKCcuLycpO1xuXG52YXIgJGluZGV4T2YgPSBjYWxsQmluZChHZXRJbnRyaW5zaWMoJ1N0cmluZy5wcm90b3R5cGUuaW5kZXhPZicpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjYWxsQm91bmRJbnRyaW5zaWMobmFtZSwgYWxsb3dNaXNzaW5nKSB7XG5cdHZhciBpbnRyaW5zaWMgPSBHZXRJbnRyaW5zaWMobmFtZSwgISFhbGxvd01pc3NpbmcpO1xuXHRpZiAodHlwZW9mIGludHJpbnNpYyA9PT0gJ2Z1bmN0aW9uJyAmJiAkaW5kZXhPZihuYW1lLCAnLnByb3RvdHlwZS4nKSA+IC0xKSB7XG5cdFx0cmV0dXJuIGNhbGxCaW5kKGludHJpbnNpYyk7XG5cdH1cblx0cmV0dXJuIGludHJpbnNpYztcbn07XG4iLCJ2YXIgaGFzTWFwID0gdHlwZW9mIE1hcCA9PT0gJ2Z1bmN0aW9uJyAmJiBNYXAucHJvdG90eXBlO1xudmFyIG1hcFNpemVEZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciAmJiBoYXNNYXAgPyBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE1hcC5wcm90b3R5cGUsICdzaXplJykgOiBudWxsO1xudmFyIG1hcFNpemUgPSBoYXNNYXAgJiYgbWFwU2l6ZURlc2NyaXB0b3IgJiYgdHlwZW9mIG1hcFNpemVEZXNjcmlwdG9yLmdldCA9PT0gJ2Z1bmN0aW9uJyA/IG1hcFNpemVEZXNjcmlwdG9yLmdldCA6IG51bGw7XG52YXIgbWFwRm9yRWFjaCA9IGhhc01hcCAmJiBNYXAucHJvdG90eXBlLmZvckVhY2g7XG52YXIgaGFzU2V0ID0gdHlwZW9mIFNldCA9PT0gJ2Z1bmN0aW9uJyAmJiBTZXQucHJvdG90eXBlO1xudmFyIHNldFNpemVEZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciAmJiBoYXNTZXQgPyBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKFNldC5wcm90b3R5cGUsICdzaXplJykgOiBudWxsO1xudmFyIHNldFNpemUgPSBoYXNTZXQgJiYgc2V0U2l6ZURlc2NyaXB0b3IgJiYgdHlwZW9mIHNldFNpemVEZXNjcmlwdG9yLmdldCA9PT0gJ2Z1bmN0aW9uJyA/IHNldFNpemVEZXNjcmlwdG9yLmdldCA6IG51bGw7XG52YXIgc2V0Rm9yRWFjaCA9IGhhc1NldCAmJiBTZXQucHJvdG90eXBlLmZvckVhY2g7XG52YXIgaGFzV2Vha01hcCA9IHR5cGVvZiBXZWFrTWFwID09PSAnZnVuY3Rpb24nICYmIFdlYWtNYXAucHJvdG90eXBlO1xudmFyIHdlYWtNYXBIYXMgPSBoYXNXZWFrTWFwID8gV2Vha01hcC5wcm90b3R5cGUuaGFzIDogbnVsbDtcbnZhciBoYXNXZWFrU2V0ID0gdHlwZW9mIFdlYWtTZXQgPT09ICdmdW5jdGlvbicgJiYgV2Vha1NldC5wcm90b3R5cGU7XG52YXIgd2Vha1NldEhhcyA9IGhhc1dlYWtTZXQgPyBXZWFrU2V0LnByb3RvdHlwZS5oYXMgOiBudWxsO1xudmFyIGhhc1dlYWtSZWYgPSB0eXBlb2YgV2Vha1JlZiA9PT0gJ2Z1bmN0aW9uJyAmJiBXZWFrUmVmLnByb3RvdHlwZTtcbnZhciB3ZWFrUmVmRGVyZWYgPSBoYXNXZWFrUmVmID8gV2Vha1JlZi5wcm90b3R5cGUuZGVyZWYgOiBudWxsO1xudmFyIGJvb2xlYW5WYWx1ZU9mID0gQm9vbGVhbi5wcm90b3R5cGUudmFsdWVPZjtcbnZhciBvYmplY3RUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgZnVuY3Rpb25Ub1N0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcbnZhciAkbWF0Y2ggPSBTdHJpbmcucHJvdG90eXBlLm1hdGNoO1xudmFyICRzbGljZSA9IFN0cmluZy5wcm90b3R5cGUuc2xpY2U7XG52YXIgJHJlcGxhY2UgPSBTdHJpbmcucHJvdG90eXBlLnJlcGxhY2U7XG52YXIgJHRvVXBwZXJDYXNlID0gU3RyaW5nLnByb3RvdHlwZS50b1VwcGVyQ2FzZTtcbnZhciAkdG9Mb3dlckNhc2UgPSBTdHJpbmcucHJvdG90eXBlLnRvTG93ZXJDYXNlO1xudmFyICR0ZXN0ID0gUmVnRXhwLnByb3RvdHlwZS50ZXN0O1xudmFyICRjb25jYXQgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0O1xudmFyICRqb2luID0gQXJyYXkucHJvdG90eXBlLmpvaW47XG52YXIgJGFyclNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyICRmbG9vciA9IE1hdGguZmxvb3I7XG52YXIgYmlnSW50VmFsdWVPZiA9IHR5cGVvZiBCaWdJbnQgPT09ICdmdW5jdGlvbicgPyBCaWdJbnQucHJvdG90eXBlLnZhbHVlT2YgOiBudWxsO1xudmFyIGdPUFMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xudmFyIHN5bVRvU3RyaW5nID0gdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSAnc3ltYm9sJyA/IFN5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcgOiBudWxsO1xudmFyIGhhc1NoYW1tZWRTeW1ib2xzID0gdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSAnb2JqZWN0Jztcbi8vIGllLCBgaGFzLXRvc3RyaW5ndGFnL3NoYW1zXG52YXIgdG9TdHJpbmdUYWcgPSB0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIFN5bWJvbC50b1N0cmluZ1RhZyAmJiAodHlwZW9mIFN5bWJvbC50b1N0cmluZ1RhZyA9PT0gaGFzU2hhbW1lZFN5bWJvbHMgPyAnb2JqZWN0JyA6ICdzeW1ib2wnKVxuICAgID8gU3ltYm9sLnRvU3RyaW5nVGFnXG4gICAgOiBudWxsO1xudmFyIGlzRW51bWVyYWJsZSA9IE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbnZhciBnUE8gPSAodHlwZW9mIFJlZmxlY3QgPT09ICdmdW5jdGlvbicgPyBSZWZsZWN0LmdldFByb3RvdHlwZU9mIDogT2JqZWN0LmdldFByb3RvdHlwZU9mKSB8fCAoXG4gICAgW10uX19wcm90b19fID09PSBBcnJheS5wcm90b3R5cGUgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wcm90b1xuICAgICAgICA/IGZ1bmN0aW9uIChPKSB7XG4gICAgICAgICAgICByZXR1cm4gTy5fX3Byb3RvX187IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcHJvdG9cbiAgICAgICAgfVxuICAgICAgICA6IG51bGxcbik7XG5cbmZ1bmN0aW9uIGFkZE51bWVyaWNTZXBhcmF0b3IobnVtLCBzdHIpIHtcbiAgICBpZiAoXG4gICAgICAgIG51bSA9PT0gSW5maW5pdHlcbiAgICAgICAgfHwgbnVtID09PSAtSW5maW5pdHlcbiAgICAgICAgfHwgbnVtICE9PSBudW1cbiAgICAgICAgfHwgKG51bSAmJiBudW0gPiAtMTAwMCAmJiBudW0gPCAxMDAwKVxuICAgICAgICB8fCAkdGVzdC5jYWxsKC9lLywgc3RyKVxuICAgICkge1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICB2YXIgc2VwUmVnZXggPSAvWzAtOV0oPz0oPzpbMC05XXszfSkrKD8hWzAtOV0pKS9nO1xuICAgIGlmICh0eXBlb2YgbnVtID09PSAnbnVtYmVyJykge1xuICAgICAgICB2YXIgaW50ID0gbnVtIDwgMCA/IC0kZmxvb3IoLW51bSkgOiAkZmxvb3IobnVtKTsgLy8gdHJ1bmMobnVtKVxuICAgICAgICBpZiAoaW50ICE9PSBudW0pIHtcbiAgICAgICAgICAgIHZhciBpbnRTdHIgPSBTdHJpbmcoaW50KTtcbiAgICAgICAgICAgIHZhciBkZWMgPSAkc2xpY2UuY2FsbChzdHIsIGludFN0ci5sZW5ndGggKyAxKTtcbiAgICAgICAgICAgIHJldHVybiAkcmVwbGFjZS5jYWxsKGludFN0ciwgc2VwUmVnZXgsICckJl8nKSArICcuJyArICRyZXBsYWNlLmNhbGwoJHJlcGxhY2UuY2FsbChkZWMsIC8oWzAtOV17M30pL2csICckJl8nKSwgL18kLywgJycpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAkcmVwbGFjZS5jYWxsKHN0ciwgc2VwUmVnZXgsICckJl8nKTtcbn1cblxudmFyIHV0aWxJbnNwZWN0ID0gcmVxdWlyZSgnLi91dGlsLmluc3BlY3QnKTtcbnZhciBpbnNwZWN0Q3VzdG9tID0gdXRpbEluc3BlY3QuY3VzdG9tO1xudmFyIGluc3BlY3RTeW1ib2wgPSBpc1N5bWJvbChpbnNwZWN0Q3VzdG9tKSA/IGluc3BlY3RDdXN0b20gOiBudWxsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluc3BlY3RfKG9iaiwgb3B0aW9ucywgZGVwdGgsIHNlZW4pIHtcbiAgICB2YXIgb3B0cyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAoaGFzKG9wdHMsICdxdW90ZVN0eWxlJykgJiYgKG9wdHMucXVvdGVTdHlsZSAhPT0gJ3NpbmdsZScgJiYgb3B0cy5xdW90ZVN0eWxlICE9PSAnZG91YmxlJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIFwicXVvdGVTdHlsZVwiIG11c3QgYmUgXCJzaW5nbGVcIiBvciBcImRvdWJsZVwiJyk7XG4gICAgfVxuICAgIGlmIChcbiAgICAgICAgaGFzKG9wdHMsICdtYXhTdHJpbmdMZW5ndGgnKSAmJiAodHlwZW9mIG9wdHMubWF4U3RyaW5nTGVuZ3RoID09PSAnbnVtYmVyJ1xuICAgICAgICAgICAgPyBvcHRzLm1heFN0cmluZ0xlbmd0aCA8IDAgJiYgb3B0cy5tYXhTdHJpbmdMZW5ndGggIT09IEluZmluaXR5XG4gICAgICAgICAgICA6IG9wdHMubWF4U3RyaW5nTGVuZ3RoICE9PSBudWxsXG4gICAgICAgIClcbiAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIFwibWF4U3RyaW5nTGVuZ3RoXCIsIGlmIHByb3ZpZGVkLCBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlciwgSW5maW5pdHksIG9yIGBudWxsYCcpO1xuICAgIH1cbiAgICB2YXIgY3VzdG9tSW5zcGVjdCA9IGhhcyhvcHRzLCAnY3VzdG9tSW5zcGVjdCcpID8gb3B0cy5jdXN0b21JbnNwZWN0IDogdHJ1ZTtcbiAgICBpZiAodHlwZW9mIGN1c3RvbUluc3BlY3QgIT09ICdib29sZWFuJyAmJiBjdXN0b21JbnNwZWN0ICE9PSAnc3ltYm9sJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gXCJjdXN0b21JbnNwZWN0XCIsIGlmIHByb3ZpZGVkLCBtdXN0IGJlIGB0cnVlYCwgYGZhbHNlYCwgb3IgYFxcJ3N5bWJvbFxcJ2AnKTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAgIGhhcyhvcHRzLCAnaW5kZW50JylcbiAgICAgICAgJiYgb3B0cy5pbmRlbnQgIT09IG51bGxcbiAgICAgICAgJiYgb3B0cy5pbmRlbnQgIT09ICdcXHQnXG4gICAgICAgICYmICEocGFyc2VJbnQob3B0cy5pbmRlbnQsIDEwKSA9PT0gb3B0cy5pbmRlbnQgJiYgb3B0cy5pbmRlbnQgPiAwKVxuICAgICkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gXCJpbmRlbnRcIiBtdXN0IGJlIFwiXFxcXHRcIiwgYW4gaW50ZWdlciA+IDAsIG9yIGBudWxsYCcpO1xuICAgIH1cbiAgICBpZiAoaGFzKG9wdHMsICdudW1lcmljU2VwYXJhdG9yJykgJiYgdHlwZW9mIG9wdHMubnVtZXJpY1NlcGFyYXRvciAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29wdGlvbiBcIm51bWVyaWNTZXBhcmF0b3JcIiwgaWYgcHJvdmlkZWQsIG11c3QgYmUgYHRydWVgIG9yIGBmYWxzZWAnKTtcbiAgICB9XG4gICAgdmFyIG51bWVyaWNTZXBhcmF0b3IgPSBvcHRzLm51bWVyaWNTZXBhcmF0b3I7XG5cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuICd1bmRlZmluZWQnO1xuICAgIH1cbiAgICBpZiAob2JqID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAnbnVsbCc7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgcmV0dXJuIG9iaiA/ICd0cnVlJyA6ICdmYWxzZSc7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBpbnNwZWN0U3RyaW5nKG9iaiwgb3B0cyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZiAob2JqID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gSW5maW5pdHkgLyBvYmogPiAwID8gJzAnIDogJy0wJztcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RyID0gU3RyaW5nKG9iaik7XG4gICAgICAgIHJldHVybiBudW1lcmljU2VwYXJhdG9yID8gYWRkTnVtZXJpY1NlcGFyYXRvcihvYmosIHN0cikgOiBzdHI7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnYmlnaW50Jykge1xuICAgICAgICB2YXIgYmlnSW50U3RyID0gU3RyaW5nKG9iaikgKyAnbic7XG4gICAgICAgIHJldHVybiBudW1lcmljU2VwYXJhdG9yID8gYWRkTnVtZXJpY1NlcGFyYXRvcihvYmosIGJpZ0ludFN0cikgOiBiaWdJbnRTdHI7XG4gICAgfVxuXG4gICAgdmFyIG1heERlcHRoID0gdHlwZW9mIG9wdHMuZGVwdGggPT09ICd1bmRlZmluZWQnID8gNSA6IG9wdHMuZGVwdGg7XG4gICAgaWYgKHR5cGVvZiBkZXB0aCA9PT0gJ3VuZGVmaW5lZCcpIHsgZGVwdGggPSAwOyB9XG4gICAgaWYgKGRlcHRoID49IG1heERlcHRoICYmIG1heERlcHRoID4gMCAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gaXNBcnJheShvYmopID8gJ1tBcnJheV0nIDogJ1tPYmplY3RdJztcbiAgICB9XG5cbiAgICB2YXIgaW5kZW50ID0gZ2V0SW5kZW50KG9wdHMsIGRlcHRoKTtcblxuICAgIGlmICh0eXBlb2Ygc2VlbiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc2VlbiA9IFtdO1xuICAgIH0gZWxzZSBpZiAoaW5kZXhPZihzZWVuLCBvYmopID49IDApIHtcbiAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnNwZWN0KHZhbHVlLCBmcm9tLCBub0luZGVudCkge1xuICAgICAgICBpZiAoZnJvbSkge1xuICAgICAgICAgICAgc2VlbiA9ICRhcnJTbGljZS5jYWxsKHNlZW4pO1xuICAgICAgICAgICAgc2Vlbi5wdXNoKGZyb20pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub0luZGVudCkge1xuICAgICAgICAgICAgdmFyIG5ld09wdHMgPSB7XG4gICAgICAgICAgICAgICAgZGVwdGg6IG9wdHMuZGVwdGhcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoaGFzKG9wdHMsICdxdW90ZVN0eWxlJykpIHtcbiAgICAgICAgICAgICAgICBuZXdPcHRzLnF1b3RlU3R5bGUgPSBvcHRzLnF1b3RlU3R5bGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdF8odmFsdWUsIG5ld09wdHMsIGRlcHRoICsgMSwgc2Vlbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluc3BlY3RfKHZhbHVlLCBvcHRzLCBkZXB0aCArIDEsIHNlZW4pO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nICYmICFpc1JlZ0V4cChvYmopKSB7IC8vIGluIG9sZGVyIGVuZ2luZXMsIHJlZ2V4ZXMgYXJlIGNhbGxhYmxlXG4gICAgICAgIHZhciBuYW1lID0gbmFtZU9mKG9iaik7XG4gICAgICAgIHZhciBrZXlzID0gYXJyT2JqS2V5cyhvYmosIGluc3BlY3QpO1xuICAgICAgICByZXR1cm4gJ1tGdW5jdGlvbicgKyAobmFtZSA/ICc6ICcgKyBuYW1lIDogJyAoYW5vbnltb3VzKScpICsgJ10nICsgKGtleXMubGVuZ3RoID4gMCA/ICcgeyAnICsgJGpvaW4uY2FsbChrZXlzLCAnLCAnKSArICcgfScgOiAnJyk7XG4gICAgfVxuICAgIGlmIChpc1N5bWJvbChvYmopKSB7XG4gICAgICAgIHZhciBzeW1TdHJpbmcgPSBoYXNTaGFtbWVkU3ltYm9scyA/ICRyZXBsYWNlLmNhbGwoU3RyaW5nKG9iaiksIC9eKFN5bWJvbFxcKC4qXFwpKV9bXildKiQvLCAnJDEnKSA6IHN5bVRvU3RyaW5nLmNhbGwob2JqKTtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmICFoYXNTaGFtbWVkU3ltYm9scyA/IG1hcmtCb3hlZChzeW1TdHJpbmcpIDogc3ltU3RyaW5nO1xuICAgIH1cbiAgICBpZiAoaXNFbGVtZW50KG9iaikpIHtcbiAgICAgICAgdmFyIHMgPSAnPCcgKyAkdG9Mb3dlckNhc2UuY2FsbChTdHJpbmcob2JqLm5vZGVOYW1lKSk7XG4gICAgICAgIHZhciBhdHRycyA9IG9iai5hdHRyaWJ1dGVzIHx8IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzICs9ICcgJyArIGF0dHJzW2ldLm5hbWUgKyAnPScgKyB3cmFwUXVvdGVzKHF1b3RlKGF0dHJzW2ldLnZhbHVlKSwgJ2RvdWJsZScsIG9wdHMpO1xuICAgICAgICB9XG4gICAgICAgIHMgKz0gJz4nO1xuICAgICAgICBpZiAob2JqLmNoaWxkTm9kZXMgJiYgb2JqLmNoaWxkTm9kZXMubGVuZ3RoKSB7IHMgKz0gJy4uLic7IH1cbiAgICAgICAgcyArPSAnPC8nICsgJHRvTG93ZXJDYXNlLmNhbGwoU3RyaW5nKG9iai5ub2RlTmFtZSkpICsgJz4nO1xuICAgICAgICByZXR1cm4gcztcbiAgICB9XG4gICAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgICAgICBpZiAob2JqLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gJ1tdJzsgfVxuICAgICAgICB2YXIgeHMgPSBhcnJPYmpLZXlzKG9iaiwgaW5zcGVjdCk7XG4gICAgICAgIGlmIChpbmRlbnQgJiYgIXNpbmdsZUxpbmVWYWx1ZXMoeHMpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1snICsgaW5kZW50ZWRKb2luKHhzLCBpbmRlbnQpICsgJ10nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnWyAnICsgJGpvaW4uY2FsbCh4cywgJywgJykgKyAnIF0nO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcihvYmopKSB7XG4gICAgICAgIHZhciBwYXJ0cyA9IGFyck9iaktleXMob2JqLCBpbnNwZWN0KTtcbiAgICAgICAgaWYgKCEoJ2NhdXNlJyBpbiBFcnJvci5wcm90b3R5cGUpICYmICdjYXVzZScgaW4gb2JqICYmICFpc0VudW1lcmFibGUuY2FsbChvYmosICdjYXVzZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3sgWycgKyBTdHJpbmcob2JqKSArICddICcgKyAkam9pbi5jYWxsKCRjb25jYXQuY2FsbCgnW2NhdXNlXTogJyArIGluc3BlY3Qob2JqLmNhdXNlKSwgcGFydHMpLCAnLCAnKSArICcgfSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gJ1snICsgU3RyaW5nKG9iaikgKyAnXSc7IH1cbiAgICAgICAgcmV0dXJuICd7IFsnICsgU3RyaW5nKG9iaikgKyAnXSAnICsgJGpvaW4uY2FsbChwYXJ0cywgJywgJykgKyAnIH0nO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgY3VzdG9tSW5zcGVjdCkge1xuICAgICAgICBpZiAoaW5zcGVjdFN5bWJvbCAmJiB0eXBlb2Ygb2JqW2luc3BlY3RTeW1ib2xdID09PSAnZnVuY3Rpb24nICYmIHV0aWxJbnNwZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbEluc3BlY3Qob2JqLCB7IGRlcHRoOiBtYXhEZXB0aCAtIGRlcHRoIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKGN1c3RvbUluc3BlY3QgIT09ICdzeW1ib2wnICYmIHR5cGVvZiBvYmouaW5zcGVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIG9iai5pbnNwZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzTWFwKG9iaikpIHtcbiAgICAgICAgdmFyIG1hcFBhcnRzID0gW107XG4gICAgICAgIGlmIChtYXBGb3JFYWNoKSB7XG4gICAgICAgICAgICBtYXBGb3JFYWNoLmNhbGwob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICAgICAgICAgIG1hcFBhcnRzLnB1c2goaW5zcGVjdChrZXksIG9iaiwgdHJ1ZSkgKyAnID0+ICcgKyBpbnNwZWN0KHZhbHVlLCBvYmopKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb2xsZWN0aW9uT2YoJ01hcCcsIG1hcFNpemUuY2FsbChvYmopLCBtYXBQYXJ0cywgaW5kZW50KTtcbiAgICB9XG4gICAgaWYgKGlzU2V0KG9iaikpIHtcbiAgICAgICAgdmFyIHNldFBhcnRzID0gW107XG4gICAgICAgIGlmIChzZXRGb3JFYWNoKSB7XG4gICAgICAgICAgICBzZXRGb3JFYWNoLmNhbGwob2JqLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBzZXRQYXJ0cy5wdXNoKGluc3BlY3QodmFsdWUsIG9iaikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25PZignU2V0Jywgc2V0U2l6ZS5jYWxsKG9iaiksIHNldFBhcnRzLCBpbmRlbnQpO1xuICAgIH1cbiAgICBpZiAoaXNXZWFrTWFwKG9iaikpIHtcbiAgICAgICAgcmV0dXJuIHdlYWtDb2xsZWN0aW9uT2YoJ1dlYWtNYXAnKTtcbiAgICB9XG4gICAgaWYgKGlzV2Vha1NldChvYmopKSB7XG4gICAgICAgIHJldHVybiB3ZWFrQ29sbGVjdGlvbk9mKCdXZWFrU2V0Jyk7XG4gICAgfVxuICAgIGlmIChpc1dlYWtSZWYob2JqKSkge1xuICAgICAgICByZXR1cm4gd2Vha0NvbGxlY3Rpb25PZignV2Vha1JlZicpO1xuICAgIH1cbiAgICBpZiAoaXNOdW1iZXIob2JqKSkge1xuICAgICAgICByZXR1cm4gbWFya0JveGVkKGluc3BlY3QoTnVtYmVyKG9iaikpKTtcbiAgICB9XG4gICAgaWYgKGlzQmlnSW50KG9iaikpIHtcbiAgICAgICAgcmV0dXJuIG1hcmtCb3hlZChpbnNwZWN0KGJpZ0ludFZhbHVlT2YuY2FsbChvYmopKSk7XG4gICAgfVxuICAgIGlmIChpc0Jvb2xlYW4ob2JqKSkge1xuICAgICAgICByZXR1cm4gbWFya0JveGVkKGJvb2xlYW5WYWx1ZU9mLmNhbGwob2JqKSk7XG4gICAgfVxuICAgIGlmIChpc1N0cmluZyhvYmopKSB7XG4gICAgICAgIHJldHVybiBtYXJrQm94ZWQoaW5zcGVjdChTdHJpbmcob2JqKSkpO1xuICAgIH1cbiAgICBpZiAoIWlzRGF0ZShvYmopICYmICFpc1JlZ0V4cChvYmopKSB7XG4gICAgICAgIHZhciB5cyA9IGFyck9iaktleXMob2JqLCBpbnNwZWN0KTtcbiAgICAgICAgdmFyIGlzUGxhaW5PYmplY3QgPSBnUE8gPyBnUE8ob2JqKSA9PT0gT2JqZWN0LnByb3RvdHlwZSA6IG9iaiBpbnN0YW5jZW9mIE9iamVjdCB8fCBvYmouY29uc3RydWN0b3IgPT09IE9iamVjdDtcbiAgICAgICAgdmFyIHByb3RvVGFnID0gb2JqIGluc3RhbmNlb2YgT2JqZWN0ID8gJycgOiAnbnVsbCBwcm90b3R5cGUnO1xuICAgICAgICB2YXIgc3RyaW5nVGFnID0gIWlzUGxhaW5PYmplY3QgJiYgdG9TdHJpbmdUYWcgJiYgT2JqZWN0KG9iaikgPT09IG9iaiAmJiB0b1N0cmluZ1RhZyBpbiBvYmogPyAkc2xpY2UuY2FsbCh0b1N0cihvYmopLCA4LCAtMSkgOiBwcm90b1RhZyA/ICdPYmplY3QnIDogJyc7XG4gICAgICAgIHZhciBjb25zdHJ1Y3RvclRhZyA9IGlzUGxhaW5PYmplY3QgfHwgdHlwZW9mIG9iai5jb25zdHJ1Y3RvciAhPT0gJ2Z1bmN0aW9uJyA/ICcnIDogb2JqLmNvbnN0cnVjdG9yLm5hbWUgPyBvYmouY29uc3RydWN0b3IubmFtZSArICcgJyA6ICcnO1xuICAgICAgICB2YXIgdGFnID0gY29uc3RydWN0b3JUYWcgKyAoc3RyaW5nVGFnIHx8IHByb3RvVGFnID8gJ1snICsgJGpvaW4uY2FsbCgkY29uY2F0LmNhbGwoW10sIHN0cmluZ1RhZyB8fCBbXSwgcHJvdG9UYWcgfHwgW10pLCAnOiAnKSArICddICcgOiAnJyk7XG4gICAgICAgIGlmICh5cy5sZW5ndGggPT09IDApIHsgcmV0dXJuIHRhZyArICd7fSc7IH1cbiAgICAgICAgaWYgKGluZGVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRhZyArICd7JyArIGluZGVudGVkSm9pbih5cywgaW5kZW50KSArICd9JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGFnICsgJ3sgJyArICRqb2luLmNhbGwoeXMsICcsICcpICsgJyB9JztcbiAgICB9XG4gICAgcmV0dXJuIFN0cmluZyhvYmopO1xufTtcblxuZnVuY3Rpb24gd3JhcFF1b3RlcyhzLCBkZWZhdWx0U3R5bGUsIG9wdHMpIHtcbiAgICB2YXIgcXVvdGVDaGFyID0gKG9wdHMucXVvdGVTdHlsZSB8fCBkZWZhdWx0U3R5bGUpID09PSAnZG91YmxlJyA/ICdcIicgOiBcIidcIjtcbiAgICByZXR1cm4gcXVvdGVDaGFyICsgcyArIHF1b3RlQ2hhcjtcbn1cblxuZnVuY3Rpb24gcXVvdGUocykge1xuICAgIHJldHVybiAkcmVwbGFjZS5jYWxsKFN0cmluZyhzKSwgL1wiL2csICcmcXVvdDsnKTtcbn1cblxuZnVuY3Rpb24gaXNBcnJheShvYmopIHsgcmV0dXJuIHRvU3RyKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XScgJiYgKCF0b1N0cmluZ1RhZyB8fCAhKHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIHRvU3RyaW5nVGFnIGluIG9iaikpOyB9XG5mdW5jdGlvbiBpc0RhdGUob2JqKSB7IHJldHVybiB0b1N0cihvYmopID09PSAnW29iamVjdCBEYXRlXScgJiYgKCF0b1N0cmluZ1RhZyB8fCAhKHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIHRvU3RyaW5nVGFnIGluIG9iaikpOyB9XG5mdW5jdGlvbiBpc1JlZ0V4cChvYmopIHsgcmV0dXJuIHRvU3RyKG9iaikgPT09ICdbb2JqZWN0IFJlZ0V4cF0nICYmICghdG9TdHJpbmdUYWcgfHwgISh0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiB0b1N0cmluZ1RhZyBpbiBvYmopKTsgfVxuZnVuY3Rpb24gaXNFcnJvcihvYmopIHsgcmV0dXJuIHRvU3RyKG9iaikgPT09ICdbb2JqZWN0IEVycm9yXScgJiYgKCF0b1N0cmluZ1RhZyB8fCAhKHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIHRvU3RyaW5nVGFnIGluIG9iaikpOyB9XG5mdW5jdGlvbiBpc1N0cmluZyhvYmopIHsgcmV0dXJuIHRvU3RyKG9iaikgPT09ICdbb2JqZWN0IFN0cmluZ10nICYmICghdG9TdHJpbmdUYWcgfHwgISh0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiB0b1N0cmluZ1RhZyBpbiBvYmopKTsgfVxuZnVuY3Rpb24gaXNOdW1iZXIob2JqKSB7IHJldHVybiB0b1N0cihvYmopID09PSAnW29iamVjdCBOdW1iZXJdJyAmJiAoIXRvU3RyaW5nVGFnIHx8ICEodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgdG9TdHJpbmdUYWcgaW4gb2JqKSk7IH1cbmZ1bmN0aW9uIGlzQm9vbGVhbihvYmopIHsgcmV0dXJuIHRvU3RyKG9iaikgPT09ICdbb2JqZWN0IEJvb2xlYW5dJyAmJiAoIXRvU3RyaW5nVGFnIHx8ICEodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgdG9TdHJpbmdUYWcgaW4gb2JqKSk7IH1cblxuLy8gU3ltYm9sIGFuZCBCaWdJbnQgZG8gaGF2ZSBTeW1ib2wudG9TdHJpbmdUYWcgYnkgc3BlYywgc28gdGhhdCBjYW4ndCBiZSB1c2VkIHRvIGVsaW1pbmF0ZSBmYWxzZSBwb3NpdGl2ZXNcbmZ1bmN0aW9uIGlzU3ltYm9sKG9iaikge1xuICAgIGlmIChoYXNTaGFtbWVkU3ltYm9scykge1xuICAgICAgICByZXR1cm4gb2JqICYmIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIG9iaiBpbnN0YW5jZW9mIFN5bWJvbDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdzeW1ib2wnKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCAhc3ltVG9TdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBzeW1Ub1N0cmluZy5jYWxsKG9iaik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc0JpZ0ludChvYmopIHtcbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCAhYmlnSW50VmFsdWVPZikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGJpZ0ludFZhbHVlT2YuY2FsbChvYmopO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkgfHwgZnVuY3Rpb24gKGtleSkgeyByZXR1cm4ga2V5IGluIHRoaXM7IH07XG5mdW5jdGlvbiBoYXMob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gaGFzT3duLmNhbGwob2JqLCBrZXkpO1xufVxuXG5mdW5jdGlvbiB0b1N0cihvYmopIHtcbiAgICByZXR1cm4gb2JqZWN0VG9TdHJpbmcuY2FsbChvYmopO1xufVxuXG5mdW5jdGlvbiBuYW1lT2YoZikge1xuICAgIGlmIChmLm5hbWUpIHsgcmV0dXJuIGYubmFtZTsgfVxuICAgIHZhciBtID0gJG1hdGNoLmNhbGwoZnVuY3Rpb25Ub1N0cmluZy5jYWxsKGYpLCAvXmZ1bmN0aW9uXFxzKihbXFx3JF0rKS8pO1xuICAgIGlmIChtKSB7IHJldHVybiBtWzFdOyB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGluZGV4T2YoeHMsIHgpIHtcbiAgICBpZiAoeHMuaW5kZXhPZikgeyByZXR1cm4geHMuaW5kZXhPZih4KTsgfVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0geHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmICh4c1tpXSA9PT0geCkgeyByZXR1cm4gaTsgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGlzTWFwKHgpIHtcbiAgICBpZiAoIW1hcFNpemUgfHwgIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgbWFwU2l6ZS5jYWxsKHgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2V0U2l6ZS5jYWxsKHgpO1xuICAgICAgICB9IGNhdGNoIChzKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geCBpbnN0YW5jZW9mIE1hcDsgLy8gY29yZS1qcyB3b3JrYXJvdW5kLCBwcmUtdjIuNS4wXG4gICAgfSBjYXRjaCAoZSkge31cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzV2Vha01hcCh4KSB7XG4gICAgaWYgKCF3ZWFrTWFwSGFzIHx8ICF4IHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHdlYWtNYXBIYXMuY2FsbCh4LCB3ZWFrTWFwSGFzKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHdlYWtTZXRIYXMuY2FsbCh4LCB3ZWFrU2V0SGFzKTtcbiAgICAgICAgfSBjYXRjaCAocykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHggaW5zdGFuY2VvZiBXZWFrTWFwOyAvLyBjb3JlLWpzIHdvcmthcm91bmQsIHByZS12Mi41LjBcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNXZWFrUmVmKHgpIHtcbiAgICBpZiAoIXdlYWtSZWZEZXJlZiB8fCAheCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICB3ZWFrUmVmRGVyZWYuY2FsbCh4KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzU2V0KHgpIHtcbiAgICBpZiAoIXNldFNpemUgfHwgIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgc2V0U2l6ZS5jYWxsKHgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbWFwU2l6ZS5jYWxsKHgpO1xuICAgICAgICB9IGNhdGNoIChtKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geCBpbnN0YW5jZW9mIFNldDsgLy8gY29yZS1qcyB3b3JrYXJvdW5kLCBwcmUtdjIuNS4wXG4gICAgfSBjYXRjaCAoZSkge31cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzV2Vha1NldCh4KSB7XG4gICAgaWYgKCF3ZWFrU2V0SGFzIHx8ICF4IHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHdlYWtTZXRIYXMuY2FsbCh4LCB3ZWFrU2V0SGFzKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHdlYWtNYXBIYXMuY2FsbCh4LCB3ZWFrTWFwSGFzKTtcbiAgICAgICAgfSBjYXRjaCAocykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHggaW5zdGFuY2VvZiBXZWFrU2V0OyAvLyBjb3JlLWpzIHdvcmthcm91bmQsIHByZS12Mi41LjBcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNFbGVtZW50KHgpIHtcbiAgICBpZiAoIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnKSB7IHJldHVybiBmYWxzZTsgfVxuICAgIGlmICh0eXBlb2YgSFRNTEVsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHggaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHR5cGVvZiB4Lm5vZGVOYW1lID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgeC5nZXRBdHRyaWJ1dGUgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGluc3BlY3RTdHJpbmcoc3RyLCBvcHRzKSB7XG4gICAgaWYgKHN0ci5sZW5ndGggPiBvcHRzLm1heFN0cmluZ0xlbmd0aCkge1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gc3RyLmxlbmd0aCAtIG9wdHMubWF4U3RyaW5nTGVuZ3RoO1xuICAgICAgICB2YXIgdHJhaWxlciA9ICcuLi4gJyArIHJlbWFpbmluZyArICcgbW9yZSBjaGFyYWN0ZXInICsgKHJlbWFpbmluZyA+IDEgPyAncycgOiAnJyk7XG4gICAgICAgIHJldHVybiBpbnNwZWN0U3RyaW5nKCRzbGljZS5jYWxsKHN0ciwgMCwgb3B0cy5tYXhTdHJpbmdMZW5ndGgpLCBvcHRzKSArIHRyYWlsZXI7XG4gICAgfVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb250cm9sLXJlZ2V4XG4gICAgdmFyIHMgPSAkcmVwbGFjZS5jYWxsKCRyZXBsYWNlLmNhbGwoc3RyLCAvKFsnXFxcXF0pL2csICdcXFxcJDEnKSwgL1tcXHgwMC1cXHgxZl0vZywgbG93Ynl0ZSk7XG4gICAgcmV0dXJuIHdyYXBRdW90ZXMocywgJ3NpbmdsZScsIG9wdHMpO1xufVxuXG5mdW5jdGlvbiBsb3dieXRlKGMpIHtcbiAgICB2YXIgbiA9IGMuY2hhckNvZGVBdCgwKTtcbiAgICB2YXIgeCA9IHtcbiAgICAgICAgODogJ2InLFxuICAgICAgICA5OiAndCcsXG4gICAgICAgIDEwOiAnbicsXG4gICAgICAgIDEyOiAnZicsXG4gICAgICAgIDEzOiAncidcbiAgICB9W25dO1xuICAgIGlmICh4KSB7IHJldHVybiAnXFxcXCcgKyB4OyB9XG4gICAgcmV0dXJuICdcXFxceCcgKyAobiA8IDB4MTAgPyAnMCcgOiAnJykgKyAkdG9VcHBlckNhc2UuY2FsbChuLnRvU3RyaW5nKDE2KSk7XG59XG5cbmZ1bmN0aW9uIG1hcmtCb3hlZChzdHIpIHtcbiAgICByZXR1cm4gJ09iamVjdCgnICsgc3RyICsgJyknO1xufVxuXG5mdW5jdGlvbiB3ZWFrQ29sbGVjdGlvbk9mKHR5cGUpIHtcbiAgICByZXR1cm4gdHlwZSArICcgeyA/IH0nO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0aW9uT2YodHlwZSwgc2l6ZSwgZW50cmllcywgaW5kZW50KSB7XG4gICAgdmFyIGpvaW5lZEVudHJpZXMgPSBpbmRlbnQgPyBpbmRlbnRlZEpvaW4oZW50cmllcywgaW5kZW50KSA6ICRqb2luLmNhbGwoZW50cmllcywgJywgJyk7XG4gICAgcmV0dXJuIHR5cGUgKyAnICgnICsgc2l6ZSArICcpIHsnICsgam9pbmVkRW50cmllcyArICd9Jztcbn1cblxuZnVuY3Rpb24gc2luZ2xlTGluZVZhbHVlcyh4cykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGluZGV4T2YoeHNbaV0sICdcXG4nKSA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGdldEluZGVudChvcHRzLCBkZXB0aCkge1xuICAgIHZhciBiYXNlSW5kZW50O1xuICAgIGlmIChvcHRzLmluZGVudCA9PT0gJ1xcdCcpIHtcbiAgICAgICAgYmFzZUluZGVudCA9ICdcXHQnO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wdHMuaW5kZW50ID09PSAnbnVtYmVyJyAmJiBvcHRzLmluZGVudCA+IDApIHtcbiAgICAgICAgYmFzZUluZGVudCA9ICRqb2luLmNhbGwoQXJyYXkob3B0cy5pbmRlbnQgKyAxKSwgJyAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYmFzZTogYmFzZUluZGVudCxcbiAgICAgICAgcHJldjogJGpvaW4uY2FsbChBcnJheShkZXB0aCArIDEpLCBiYXNlSW5kZW50KVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGluZGVudGVkSm9pbih4cywgaW5kZW50KSB7XG4gICAgaWYgKHhzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gJyc7IH1cbiAgICB2YXIgbGluZUpvaW5lciA9ICdcXG4nICsgaW5kZW50LnByZXYgKyBpbmRlbnQuYmFzZTtcbiAgICByZXR1cm4gbGluZUpvaW5lciArICRqb2luLmNhbGwoeHMsICcsJyArIGxpbmVKb2luZXIpICsgJ1xcbicgKyBpbmRlbnQucHJldjtcbn1cblxuZnVuY3Rpb24gYXJyT2JqS2V5cyhvYmosIGluc3BlY3QpIHtcbiAgICB2YXIgaXNBcnIgPSBpc0FycmF5KG9iaik7XG4gICAgdmFyIHhzID0gW107XG4gICAgaWYgKGlzQXJyKSB7XG4gICAgICAgIHhzLmxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB4c1tpXSA9IGhhcyhvYmosIGkpID8gaW5zcGVjdChvYmpbaV0sIG9iaikgOiAnJztcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgc3ltcyA9IHR5cGVvZiBnT1BTID09PSAnZnVuY3Rpb24nID8gZ09QUyhvYmopIDogW107XG4gICAgdmFyIHN5bU1hcDtcbiAgICBpZiAoaGFzU2hhbW1lZFN5bWJvbHMpIHtcbiAgICAgICAgc3ltTWFwID0ge307XG4gICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgc3ltcy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgc3ltTWFwWyckJyArIHN5bXNba11dID0gc3ltc1trXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheFxuICAgICAgICBpZiAoIWhhcyhvYmosIGtleSkpIHsgY29udGludWU7IH0gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheCwgbm8tY29udGludWVcbiAgICAgICAgaWYgKGlzQXJyICYmIFN0cmluZyhOdW1iZXIoa2V5KSkgPT09IGtleSAmJiBrZXkgPCBvYmoubGVuZ3RoKSB7IGNvbnRpbnVlOyB9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcmVzdHJpY3RlZC1zeW50YXgsIG5vLWNvbnRpbnVlXG4gICAgICAgIGlmIChoYXNTaGFtbWVkU3ltYm9scyAmJiBzeW1NYXBbJyQnICsga2V5XSBpbnN0YW5jZW9mIFN5bWJvbCkge1xuICAgICAgICAgICAgLy8gdGhpcyBpcyB0byBwcmV2ZW50IHNoYW1tZWQgU3ltYm9scywgd2hpY2ggYXJlIHN0b3JlZCBhcyBzdHJpbmdzLCBmcm9tIGJlaW5nIGluY2x1ZGVkIGluIHRoZSBzdHJpbmcga2V5IHNlY3Rpb25cbiAgICAgICAgICAgIGNvbnRpbnVlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXJlc3RyaWN0ZWQtc3ludGF4LCBuby1jb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKCR0ZXN0LmNhbGwoL1teXFx3JF0vLCBrZXkpKSB7XG4gICAgICAgICAgICB4cy5wdXNoKGluc3BlY3Qoa2V5LCBvYmopICsgJzogJyArIGluc3BlY3Qob2JqW2tleV0sIG9iaikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgeHMucHVzaChrZXkgKyAnOiAnICsgaW5zcGVjdChvYmpba2V5XSwgb2JqKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVvZiBnT1BTID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3ltcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKGlzRW51bWVyYWJsZS5jYWxsKG9iaiwgc3ltc1tqXSkpIHtcbiAgICAgICAgICAgICAgICB4cy5wdXNoKCdbJyArIGluc3BlY3Qoc3ltc1tqXSkgKyAnXTogJyArIGluc3BlY3Qob2JqW3N5bXNbal1dLCBvYmopKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geHM7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBHZXRJbnRyaW5zaWMgPSByZXF1aXJlKCdnZXQtaW50cmluc2ljJyk7XG52YXIgY2FsbEJvdW5kID0gcmVxdWlyZSgnY2FsbC1iaW5kL2NhbGxCb3VuZCcpO1xudmFyIGluc3BlY3QgPSByZXF1aXJlKCdvYmplY3QtaW5zcGVjdCcpO1xuXG52YXIgJFR5cGVFcnJvciA9IEdldEludHJpbnNpYygnJVR5cGVFcnJvciUnKTtcbnZhciAkV2Vha01hcCA9IEdldEludHJpbnNpYygnJVdlYWtNYXAlJywgdHJ1ZSk7XG52YXIgJE1hcCA9IEdldEludHJpbnNpYygnJU1hcCUnLCB0cnVlKTtcblxudmFyICR3ZWFrTWFwR2V0ID0gY2FsbEJvdW5kKCdXZWFrTWFwLnByb3RvdHlwZS5nZXQnLCB0cnVlKTtcbnZhciAkd2Vha01hcFNldCA9IGNhbGxCb3VuZCgnV2Vha01hcC5wcm90b3R5cGUuc2V0JywgdHJ1ZSk7XG52YXIgJHdlYWtNYXBIYXMgPSBjYWxsQm91bmQoJ1dlYWtNYXAucHJvdG90eXBlLmhhcycsIHRydWUpO1xudmFyICRtYXBHZXQgPSBjYWxsQm91bmQoJ01hcC5wcm90b3R5cGUuZ2V0JywgdHJ1ZSk7XG52YXIgJG1hcFNldCA9IGNhbGxCb3VuZCgnTWFwLnByb3RvdHlwZS5zZXQnLCB0cnVlKTtcbnZhciAkbWFwSGFzID0gY2FsbEJvdW5kKCdNYXAucHJvdG90eXBlLmhhcycsIHRydWUpO1xuXG4vKlxuICogVGhpcyBmdW5jdGlvbiB0cmF2ZXJzZXMgdGhlIGxpc3QgcmV0dXJuaW5nIHRoZSBub2RlIGNvcnJlc3BvbmRpbmcgdG8gdGhlXG4gKiBnaXZlbiBrZXkuXG4gKlxuICogVGhhdCBub2RlIGlzIGFsc28gbW92ZWQgdG8gdGhlIGhlYWQgb2YgdGhlIGxpc3QsIHNvIHRoYXQgaWYgaXQncyBhY2Nlc3NlZFxuICogYWdhaW4gd2UgZG9uJ3QgbmVlZCB0byB0cmF2ZXJzZSB0aGUgd2hvbGUgbGlzdC4gQnkgZG9pbmcgc28sIGFsbCB0aGUgcmVjZW50bHlcbiAqIHVzZWQgbm9kZXMgY2FuIGJlIGFjY2Vzc2VkIHJlbGF0aXZlbHkgcXVpY2tseS5cbiAqL1xudmFyIGxpc3RHZXROb2RlID0gZnVuY3Rpb24gKGxpc3QsIGtleSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbnNpc3RlbnQtcmV0dXJuXG5cdGZvciAodmFyIHByZXYgPSBsaXN0LCBjdXJyOyAoY3VyciA9IHByZXYubmV4dCkgIT09IG51bGw7IHByZXYgPSBjdXJyKSB7XG5cdFx0aWYgKGN1cnIua2V5ID09PSBrZXkpIHtcblx0XHRcdHByZXYubmV4dCA9IGN1cnIubmV4dDtcblx0XHRcdGN1cnIubmV4dCA9IGxpc3QubmV4dDtcblx0XHRcdGxpc3QubmV4dCA9IGN1cnI7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cblx0XHRcdHJldHVybiBjdXJyO1xuXHRcdH1cblx0fVxufTtcblxudmFyIGxpc3RHZXQgPSBmdW5jdGlvbiAob2JqZWN0cywga2V5KSB7XG5cdHZhciBub2RlID0gbGlzdEdldE5vZGUob2JqZWN0cywga2V5KTtcblx0cmV0dXJuIG5vZGUgJiYgbm9kZS52YWx1ZTtcbn07XG52YXIgbGlzdFNldCA9IGZ1bmN0aW9uIChvYmplY3RzLCBrZXksIHZhbHVlKSB7XG5cdHZhciBub2RlID0gbGlzdEdldE5vZGUob2JqZWN0cywga2V5KTtcblx0aWYgKG5vZGUpIHtcblx0XHRub2RlLnZhbHVlID0gdmFsdWU7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gUHJlcGVuZCB0aGUgbmV3IG5vZGUgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGlzdFxuXHRcdG9iamVjdHMubmV4dCA9IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuXHRcdFx0a2V5OiBrZXksXG5cdFx0XHRuZXh0OiBvYmplY3RzLm5leHQsXG5cdFx0XHR2YWx1ZTogdmFsdWVcblx0XHR9O1xuXHR9XG59O1xudmFyIGxpc3RIYXMgPSBmdW5jdGlvbiAob2JqZWN0cywga2V5KSB7XG5cdHJldHVybiAhIWxpc3RHZXROb2RlKG9iamVjdHMsIGtleSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFNpZGVDaGFubmVsKCkge1xuXHR2YXIgJHdtO1xuXHR2YXIgJG07XG5cdHZhciAkbztcblx0dmFyIGNoYW5uZWwgPSB7XG5cdFx0YXNzZXJ0OiBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRpZiAoIWNoYW5uZWwuaGFzKGtleSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3ICRUeXBlRXJyb3IoJ1NpZGUgY2hhbm5lbCBkb2VzIG5vdCBjb250YWluICcgKyBpbnNwZWN0KGtleSkpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Z2V0OiBmdW5jdGlvbiAoa2V5KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29uc2lzdGVudC1yZXR1cm5cblx0XHRcdGlmICgkV2Vha01hcCAmJiBrZXkgJiYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBrZXkgPT09ICdmdW5jdGlvbicpKSB7XG5cdFx0XHRcdGlmICgkd20pIHtcblx0XHRcdFx0XHRyZXR1cm4gJHdlYWtNYXBHZXQoJHdtLCBrZXkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKCRNYXApIHtcblx0XHRcdFx0aWYgKCRtKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRtYXBHZXQoJG0sIGtleSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICgkbykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvbmVseS1pZlxuXHRcdFx0XHRcdHJldHVybiBsaXN0R2V0KCRvLCBrZXkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRoYXM6IGZ1bmN0aW9uIChrZXkpIHtcblx0XHRcdGlmICgkV2Vha01hcCAmJiBrZXkgJiYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBrZXkgPT09ICdmdW5jdGlvbicpKSB7XG5cdFx0XHRcdGlmICgkd20pIHtcblx0XHRcdFx0XHRyZXR1cm4gJHdlYWtNYXBIYXMoJHdtLCBrZXkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKCRNYXApIHtcblx0XHRcdFx0aWYgKCRtKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRtYXBIYXMoJG0sIGtleSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICgkbykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvbmVseS1pZlxuXHRcdFx0XHRcdHJldHVybiBsaXN0SGFzKCRvLCBrZXkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fSxcblx0XHRzZXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG5cdFx0XHRpZiAoJFdlYWtNYXAgJiYga2V5ICYmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyB8fCB0eXBlb2Yga2V5ID09PSAnZnVuY3Rpb24nKSkge1xuXHRcdFx0XHRpZiAoISR3bSkge1xuXHRcdFx0XHRcdCR3bSA9IG5ldyAkV2Vha01hcCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCR3ZWFrTWFwU2V0KCR3bSwga2V5LCB2YWx1ZSk7XG5cdFx0XHR9IGVsc2UgaWYgKCRNYXApIHtcblx0XHRcdFx0aWYgKCEkbSkge1xuXHRcdFx0XHRcdCRtID0gbmV3ICRNYXAoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQkbWFwU2V0KCRtLCBrZXksIHZhbHVlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICghJG8pIHtcblx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdCAqIEluaXRpYWxpemUgdGhlIGxpbmtlZCBsaXN0IGFzIGFuIGVtcHR5IG5vZGUsIHNvIHRoYXQgd2UgZG9uJ3QgaGF2ZVxuXHRcdFx0XHRcdCAqIHRvIHNwZWNpYWwtY2FzZSBoYW5kbGluZyBvZiB0aGUgZmlyc3Qgbm9kZTogd2UgY2FuIGFsd2F5cyByZWZlciB0b1xuXHRcdFx0XHRcdCAqIGl0IGFzIChwcmV2aW91cyBub2RlKS5uZXh0LCBpbnN0ZWFkIG9mIHNvbWV0aGluZyBsaWtlIChsaXN0KS5oZWFkXG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0JG8gPSB7IGtleToge30sIG5leHQ6IG51bGwgfTtcblx0XHRcdFx0fVxuXHRcdFx0XHRsaXN0U2V0KCRvLCBrZXksIHZhbHVlKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cdHJldHVybiBjaGFubmVsO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJlcGxhY2UgPSBTdHJpbmcucHJvdG90eXBlLnJlcGxhY2U7XG52YXIgcGVyY2VudFR3ZW50aWVzID0gLyUyMC9nO1xuXG52YXIgRm9ybWF0ID0ge1xuICAgIFJGQzE3Mzg6ICdSRkMxNzM4JyxcbiAgICBSRkMzOTg2OiAnUkZDMzk4Nidcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdkZWZhdWx0JzogRm9ybWF0LlJGQzM5ODYsXG4gICAgZm9ybWF0dGVyczoge1xuICAgICAgICBSRkMxNzM4OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiByZXBsYWNlLmNhbGwodmFsdWUsIHBlcmNlbnRUd2VudGllcywgJysnKTtcbiAgICAgICAgfSxcbiAgICAgICAgUkZDMzk4NjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgUkZDMTczODogRm9ybWF0LlJGQzE3MzgsXG4gICAgUkZDMzk4NjogRm9ybWF0LlJGQzM5ODZcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJyk7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG52YXIgaGV4VGFibGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcnJheSA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjU2OyArK2kpIHtcbiAgICAgICAgYXJyYXkucHVzaCgnJScgKyAoKGkgPCAxNiA/ICcwJyA6ICcnKSArIGkudG9TdHJpbmcoMTYpKS50b1VwcGVyQ2FzZSgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJyYXk7XG59KCkpO1xuXG52YXIgY29tcGFjdFF1ZXVlID0gZnVuY3Rpb24gY29tcGFjdFF1ZXVlKHF1ZXVlKSB7XG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBxdWV1ZS5wb3AoKTtcbiAgICAgICAgdmFyIG9iaiA9IGl0ZW0ub2JqW2l0ZW0ucHJvcF07XG5cbiAgICAgICAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgICAgICAgICAgdmFyIGNvbXBhY3RlZCA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG9iai5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqW2pdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBjb21wYWN0ZWQucHVzaChvYmpbal0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXRlbS5vYmpbaXRlbS5wcm9wXSA9IGNvbXBhY3RlZDtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbnZhciBhcnJheVRvT2JqZWN0ID0gZnVuY3Rpb24gYXJyYXlUb09iamVjdChzb3VyY2UsIG9wdGlvbnMpIHtcbiAgICB2YXIgb2JqID0gb3B0aW9ucyAmJiBvcHRpb25zLnBsYWluT2JqZWN0cyA/IE9iamVjdC5jcmVhdGUobnVsbCkgOiB7fTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvdXJjZS5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZVtpXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG9ialtpXSA9IHNvdXJjZVtpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG59O1xuXG52YXIgbWVyZ2UgPSBmdW5jdGlvbiBtZXJnZSh0YXJnZXQsIHNvdXJjZSwgb3B0aW9ucykge1xuICAgIC8qIGVzbGludCBuby1wYXJhbS1yZWFzc2lnbjogMCAqL1xuICAgIGlmICghc291cmNlKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmIChpc0FycmF5KHRhcmdldCkpIHtcbiAgICAgICAgICAgIHRhcmdldC5wdXNoKHNvdXJjZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0ICYmIHR5cGVvZiB0YXJnZXQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBpZiAoKG9wdGlvbnMgJiYgKG9wdGlvbnMucGxhaW5PYmplY3RzIHx8IG9wdGlvbnMuYWxsb3dQcm90b3R5cGVzKSkgfHwgIWhhcy5jYWxsKE9iamVjdC5wcm90b3R5cGUsIHNvdXJjZSkpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRbc291cmNlXSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW3RhcmdldCwgc291cmNlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgaWYgKCF0YXJnZXQgfHwgdHlwZW9mIHRhcmdldCAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIFt0YXJnZXRdLmNvbmNhdChzb3VyY2UpO1xuICAgIH1cblxuICAgIHZhciBtZXJnZVRhcmdldCA9IHRhcmdldDtcbiAgICBpZiAoaXNBcnJheSh0YXJnZXQpICYmICFpc0FycmF5KHNvdXJjZSkpIHtcbiAgICAgICAgbWVyZ2VUYXJnZXQgPSBhcnJheVRvT2JqZWN0KHRhcmdldCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgaWYgKGlzQXJyYXkodGFyZ2V0KSAmJiBpc0FycmF5KHNvdXJjZSkpIHtcbiAgICAgICAgc291cmNlLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0sIGkpIHtcbiAgICAgICAgICAgIGlmIChoYXMuY2FsbCh0YXJnZXQsIGkpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldEl0ZW0gPSB0YXJnZXRbaV07XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldEl0ZW0gJiYgdHlwZW9mIHRhcmdldEl0ZW0gPT09ICdvYmplY3QnICYmIGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFtpXSA9IG1lcmdlKHRhcmdldEl0ZW0sIGl0ZW0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2ldID0gaXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHNvdXJjZSkucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGtleSkge1xuICAgICAgICB2YXIgdmFsdWUgPSBzb3VyY2Vba2V5XTtcblxuICAgICAgICBpZiAoaGFzLmNhbGwoYWNjLCBrZXkpKSB7XG4gICAgICAgICAgICBhY2Nba2V5XSA9IG1lcmdlKGFjY1trZXldLCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhY2Nba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgbWVyZ2VUYXJnZXQpO1xufTtcblxudmFyIGFzc2lnbiA9IGZ1bmN0aW9uIGFzc2lnblNpbmdsZVNvdXJjZSh0YXJnZXQsIHNvdXJjZSkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhzb3VyY2UpLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICAgICAgYWNjW2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB0YXJnZXQpO1xufTtcblxudmFyIGRlY29kZSA9IGZ1bmN0aW9uIChzdHIsIGRlY29kZXIsIGNoYXJzZXQpIHtcbiAgICB2YXIgc3RyV2l0aG91dFBsdXMgPSBzdHIucmVwbGFjZSgvXFwrL2csICcgJyk7XG4gICAgaWYgKGNoYXJzZXQgPT09ICdpc28tODg1OS0xJykge1xuICAgICAgICAvLyB1bmVzY2FwZSBuZXZlciB0aHJvd3MsIG5vIHRyeS4uLmNhdGNoIG5lZWRlZDpcbiAgICAgICAgcmV0dXJuIHN0cldpdGhvdXRQbHVzLnJlcGxhY2UoLyVbMC05YS1mXXsyfS9naSwgdW5lc2NhcGUpO1xuICAgIH1cbiAgICAvLyB1dGYtOFxuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyV2l0aG91dFBsdXMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHN0cldpdGhvdXRQbHVzO1xuICAgIH1cbn07XG5cbnZhciBlbmNvZGUgPSBmdW5jdGlvbiBlbmNvZGUoc3RyLCBkZWZhdWx0RW5jb2RlciwgY2hhcnNldCwga2luZCwgZm9ybWF0KSB7XG4gICAgLy8gVGhpcyBjb2RlIHdhcyBvcmlnaW5hbGx5IHdyaXR0ZW4gYnkgQnJpYW4gV2hpdGUgKG1zY2RleCkgZm9yIHRoZSBpby5qcyBjb3JlIHF1ZXJ5c3RyaW5nIGxpYnJhcnkuXG4gICAgLy8gSXQgaGFzIGJlZW4gYWRhcHRlZCBoZXJlIGZvciBzdHJpY3RlciBhZGhlcmVuY2UgdG8gUkZDIDM5ODZcbiAgICBpZiAoc3RyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH1cblxuICAgIHZhciBzdHJpbmcgPSBzdHI7XG4gICAgaWYgKHR5cGVvZiBzdHIgPT09ICdzeW1ib2wnKSB7XG4gICAgICAgIHN0cmluZyA9IFN5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzdHIpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgc3RyaW5nID0gU3RyaW5nKHN0cik7XG4gICAgfVxuXG4gICAgaWYgKGNoYXJzZXQgPT09ICdpc28tODg1OS0xJykge1xuICAgICAgICByZXR1cm4gZXNjYXBlKHN0cmluZykucmVwbGFjZSgvJXVbMC05YS1mXXs0fS9naSwgZnVuY3Rpb24gKCQwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyUyNiUyMycgKyBwYXJzZUludCgkMC5zbGljZSgyKSwgMTYpICsgJyUzQic7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBvdXQgPSAnJztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgYyA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGMgPT09IDB4MkQgLy8gLVxuICAgICAgICAgICAgfHwgYyA9PT0gMHgyRSAvLyAuXG4gICAgICAgICAgICB8fCBjID09PSAweDVGIC8vIF9cbiAgICAgICAgICAgIHx8IGMgPT09IDB4N0UgLy8gflxuICAgICAgICAgICAgfHwgKGMgPj0gMHgzMCAmJiBjIDw9IDB4MzkpIC8vIDAtOVxuICAgICAgICAgICAgfHwgKGMgPj0gMHg0MSAmJiBjIDw9IDB4NUEpIC8vIGEtelxuICAgICAgICAgICAgfHwgKGMgPj0gMHg2MSAmJiBjIDw9IDB4N0EpIC8vIEEtWlxuICAgICAgICAgICAgfHwgKGZvcm1hdCA9PT0gZm9ybWF0cy5SRkMxNzM4ICYmIChjID09PSAweDI4IHx8IGMgPT09IDB4MjkpKSAvLyAoIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBvdXQgKz0gc3RyaW5nLmNoYXJBdChpKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGMgPCAweDgwKSB7XG4gICAgICAgICAgICBvdXQgPSBvdXQgKyBoZXhUYWJsZVtjXTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGMgPCAweDgwMCkge1xuICAgICAgICAgICAgb3V0ID0gb3V0ICsgKGhleFRhYmxlWzB4QzAgfCAoYyA+PiA2KV0gKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNGKV0pO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYyA8IDB4RDgwMCB8fCBjID49IDB4RTAwMCkge1xuICAgICAgICAgICAgb3V0ID0gb3V0ICsgKGhleFRhYmxlWzB4RTAgfCAoYyA+PiAxMildICsgaGV4VGFibGVbMHg4MCB8ICgoYyA+PiA2KSAmIDB4M0YpXSArIGhleFRhYmxlWzB4ODAgfCAoYyAmIDB4M0YpXSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgYyA9IDB4MTAwMDAgKyAoKChjICYgMHgzRkYpIDw8IDEwKSB8IChzdHJpbmcuY2hhckNvZGVBdChpKSAmIDB4M0ZGKSk7XG4gICAgICAgIC8qIGVzbGludCBvcGVyYXRvci1saW5lYnJlYWs6IFsyLCBcImJlZm9yZVwiXSAqL1xuICAgICAgICBvdXQgKz0gaGV4VGFibGVbMHhGMCB8IChjID4+IDE4KV1cbiAgICAgICAgICAgICsgaGV4VGFibGVbMHg4MCB8ICgoYyA+PiAxMikgJiAweDNGKV1cbiAgICAgICAgICAgICsgaGV4VGFibGVbMHg4MCB8ICgoYyA+PiA2KSAmIDB4M0YpXVxuICAgICAgICAgICAgKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNGKV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbnZhciBjb21wYWN0ID0gZnVuY3Rpb24gY29tcGFjdCh2YWx1ZSkge1xuICAgIHZhciBxdWV1ZSA9IFt7IG9iajogeyBvOiB2YWx1ZSB9LCBwcm9wOiAnbycgfV07XG4gICAgdmFyIHJlZnMgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBxdWV1ZVtpXTtcbiAgICAgICAgdmFyIG9iaiA9IGl0ZW0ub2JqW2l0ZW0ucHJvcF07XG5cbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGtleXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2pdO1xuICAgICAgICAgICAgdmFyIHZhbCA9IG9ialtrZXldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdvYmplY3QnICYmIHZhbCAhPT0gbnVsbCAmJiByZWZzLmluZGV4T2YodmFsKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZS5wdXNoKHsgb2JqOiBvYmosIHByb3A6IGtleSB9KTtcbiAgICAgICAgICAgICAgICByZWZzLnB1c2godmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXBhY3RRdWV1ZShxdWV1ZSk7XG5cbiAgICByZXR1cm4gdmFsdWU7XG59O1xuXG52YXIgaXNSZWdFeHAgPSBmdW5jdGlvbiBpc1JlZ0V4cChvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufTtcblxudmFyIGlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIob2JqKSB7XG4gICAgaWYgKCFvYmogfHwgdHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiAhIShvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyICYmIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlcihvYmopKTtcbn07XG5cbnZhciBjb21iaW5lID0gZnVuY3Rpb24gY29tYmluZShhLCBiKSB7XG4gICAgcmV0dXJuIFtdLmNvbmNhdChhLCBiKTtcbn07XG5cbnZhciBtYXliZU1hcCA9IGZ1bmN0aW9uIG1heWJlTWFwKHZhbCwgZm4pIHtcbiAgICBpZiAoaXNBcnJheSh2YWwpKSB7XG4gICAgICAgIHZhciBtYXBwZWQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIG1hcHBlZC5wdXNoKGZuKHZhbFtpXSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXBwZWQ7XG4gICAgfVxuICAgIHJldHVybiBmbih2YWwpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYXJyYXlUb09iamVjdDogYXJyYXlUb09iamVjdCxcbiAgICBhc3NpZ246IGFzc2lnbixcbiAgICBjb21iaW5lOiBjb21iaW5lLFxuICAgIGNvbXBhY3Q6IGNvbXBhY3QsXG4gICAgZGVjb2RlOiBkZWNvZGUsXG4gICAgZW5jb2RlOiBlbmNvZGUsXG4gICAgaXNCdWZmZXI6IGlzQnVmZmVyLFxuICAgIGlzUmVnRXhwOiBpc1JlZ0V4cCxcbiAgICBtYXliZU1hcDogbWF5YmVNYXAsXG4gICAgbWVyZ2U6IG1lcmdlXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0U2lkZUNoYW5uZWwgPSByZXF1aXJlKCdzaWRlLWNoYW5uZWwnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJyk7XG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxudmFyIGFycmF5UHJlZml4R2VuZXJhdG9ycyA9IHtcbiAgICBicmFja2V0czogZnVuY3Rpb24gYnJhY2tldHMocHJlZml4KSB7XG4gICAgICAgIHJldHVybiBwcmVmaXggKyAnW10nO1xuICAgIH0sXG4gICAgY29tbWE6ICdjb21tYScsXG4gICAgaW5kaWNlczogZnVuY3Rpb24gaW5kaWNlcyhwcmVmaXgsIGtleSkge1xuICAgICAgICByZXR1cm4gcHJlZml4ICsgJ1snICsga2V5ICsgJ10nO1xuICAgIH0sXG4gICAgcmVwZWF0OiBmdW5jdGlvbiByZXBlYXQocHJlZml4KSB7XG4gICAgICAgIHJldHVybiBwcmVmaXg7XG4gICAgfVxufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xudmFyIHB1c2ggPSBBcnJheS5wcm90b3R5cGUucHVzaDtcbnZhciBwdXNoVG9BcnJheSA9IGZ1bmN0aW9uIChhcnIsIHZhbHVlT3JBcnJheSkge1xuICAgIHB1c2guYXBwbHkoYXJyLCBpc0FycmF5KHZhbHVlT3JBcnJheSkgPyB2YWx1ZU9yQXJyYXkgOiBbdmFsdWVPckFycmF5XSk7XG59O1xuXG52YXIgdG9JU08gPSBEYXRlLnByb3RvdHlwZS50b0lTT1N0cmluZztcblxudmFyIGRlZmF1bHRGb3JtYXQgPSBmb3JtYXRzWydkZWZhdWx0J107XG52YXIgZGVmYXVsdHMgPSB7XG4gICAgYWRkUXVlcnlQcmVmaXg6IGZhbHNlLFxuICAgIGFsbG93RG90czogZmFsc2UsXG4gICAgY2hhcnNldDogJ3V0Zi04JyxcbiAgICBjaGFyc2V0U2VudGluZWw6IGZhbHNlLFxuICAgIGRlbGltaXRlcjogJyYnLFxuICAgIGVuY29kZTogdHJ1ZSxcbiAgICBlbmNvZGVyOiB1dGlscy5lbmNvZGUsXG4gICAgZW5jb2RlVmFsdWVzT25seTogZmFsc2UsXG4gICAgZm9ybWF0OiBkZWZhdWx0Rm9ybWF0LFxuICAgIGZvcm1hdHRlcjogZm9ybWF0cy5mb3JtYXR0ZXJzW2RlZmF1bHRGb3JtYXRdLFxuICAgIC8vIGRlcHJlY2F0ZWRcbiAgICBpbmRpY2VzOiBmYWxzZSxcbiAgICBzZXJpYWxpemVEYXRlOiBmdW5jdGlvbiBzZXJpYWxpemVEYXRlKGRhdGUpIHtcbiAgICAgICAgcmV0dXJuIHRvSVNPLmNhbGwoZGF0ZSk7XG4gICAgfSxcbiAgICBza2lwTnVsbHM6IGZhbHNlLFxuICAgIHN0cmljdE51bGxIYW5kbGluZzogZmFsc2Vcbn07XG5cbnZhciBpc05vbk51bGxpc2hQcmltaXRpdmUgPSBmdW5jdGlvbiBpc05vbk51bGxpc2hQcmltaXRpdmUodikge1xuICAgIHJldHVybiB0eXBlb2YgdiA9PT0gJ3N0cmluZydcbiAgICAgICAgfHwgdHlwZW9mIHYgPT09ICdudW1iZXInXG4gICAgICAgIHx8IHR5cGVvZiB2ID09PSAnYm9vbGVhbidcbiAgICAgICAgfHwgdHlwZW9mIHYgPT09ICdzeW1ib2wnXG4gICAgICAgIHx8IHR5cGVvZiB2ID09PSAnYmlnaW50Jztcbn07XG5cbnZhciBzZW50aW5lbCA9IHt9O1xuXG52YXIgc3RyaW5naWZ5ID0gZnVuY3Rpb24gc3RyaW5naWZ5KFxuICAgIG9iamVjdCxcbiAgICBwcmVmaXgsXG4gICAgZ2VuZXJhdGVBcnJheVByZWZpeCxcbiAgICBjb21tYVJvdW5kVHJpcCxcbiAgICBzdHJpY3ROdWxsSGFuZGxpbmcsXG4gICAgc2tpcE51bGxzLFxuICAgIGVuY29kZXIsXG4gICAgZmlsdGVyLFxuICAgIHNvcnQsXG4gICAgYWxsb3dEb3RzLFxuICAgIHNlcmlhbGl6ZURhdGUsXG4gICAgZm9ybWF0LFxuICAgIGZvcm1hdHRlcixcbiAgICBlbmNvZGVWYWx1ZXNPbmx5LFxuICAgIGNoYXJzZXQsXG4gICAgc2lkZUNoYW5uZWxcbikge1xuICAgIHZhciBvYmogPSBvYmplY3Q7XG5cbiAgICB2YXIgdG1wU2MgPSBzaWRlQ2hhbm5lbDtcbiAgICB2YXIgc3RlcCA9IDA7XG4gICAgdmFyIGZpbmRGbGFnID0gZmFsc2U7XG4gICAgd2hpbGUgKCh0bXBTYyA9IHRtcFNjLmdldChzZW50aW5lbCkpICE9PSB2b2lkIHVuZGVmaW5lZCAmJiAhZmluZEZsYWcpIHtcbiAgICAgICAgLy8gV2hlcmUgb2JqZWN0IGxhc3QgYXBwZWFyZWQgaW4gdGhlIHJlZiB0cmVlXG4gICAgICAgIHZhciBwb3MgPSB0bXBTYy5nZXQob2JqZWN0KTtcbiAgICAgICAgc3RlcCArPSAxO1xuICAgICAgICBpZiAodHlwZW9mIHBvcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmIChwb3MgPT09IHN0ZXApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQ3ljbGljIG9iamVjdCB2YWx1ZScpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmaW5kRmxhZyA9IHRydWU7IC8vIEJyZWFrIHdoaWxlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB0bXBTYy5nZXQoc2VudGluZWwpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgc3RlcCA9IDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmogPSBmaWx0ZXIocHJlZml4LCBvYmopO1xuICAgIH0gZWxzZSBpZiAob2JqIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICBvYmogPSBzZXJpYWxpemVEYXRlKG9iaik7XG4gICAgfSBlbHNlIGlmIChnZW5lcmF0ZUFycmF5UHJlZml4ID09PSAnY29tbWEnICYmIGlzQXJyYXkob2JqKSkge1xuICAgICAgICBvYmogPSB1dGlscy5tYXliZU1hcChvYmosIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemVEYXRlKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG9iaiA9PT0gbnVsbCkge1xuICAgICAgICBpZiAoc3RyaWN0TnVsbEhhbmRsaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlciAmJiAhZW5jb2RlVmFsdWVzT25seSA/IGVuY29kZXIocHJlZml4LCBkZWZhdWx0cy5lbmNvZGVyLCBjaGFyc2V0LCAna2V5JywgZm9ybWF0KSA6IHByZWZpeDtcbiAgICAgICAgfVxuXG4gICAgICAgIG9iaiA9ICcnO1xuICAgIH1cblxuICAgIGlmIChpc05vbk51bGxpc2hQcmltaXRpdmUob2JqKSB8fCB1dGlscy5pc0J1ZmZlcihvYmopKSB7XG4gICAgICAgIGlmIChlbmNvZGVyKSB7XG4gICAgICAgICAgICB2YXIga2V5VmFsdWUgPSBlbmNvZGVWYWx1ZXNPbmx5ID8gcHJlZml4IDogZW5jb2RlcihwcmVmaXgsIGRlZmF1bHRzLmVuY29kZXIsIGNoYXJzZXQsICdrZXknLCBmb3JtYXQpO1xuICAgICAgICAgICAgcmV0dXJuIFtmb3JtYXR0ZXIoa2V5VmFsdWUpICsgJz0nICsgZm9ybWF0dGVyKGVuY29kZXIob2JqLCBkZWZhdWx0cy5lbmNvZGVyLCBjaGFyc2V0LCAndmFsdWUnLCBmb3JtYXQpKV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtmb3JtYXR0ZXIocHJlZml4KSArICc9JyArIGZvcm1hdHRlcihTdHJpbmcob2JqKSldO1xuICAgIH1cblxuICAgIHZhciB2YWx1ZXMgPSBbXTtcblxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH1cblxuICAgIHZhciBvYmpLZXlzO1xuICAgIGlmIChnZW5lcmF0ZUFycmF5UHJlZml4ID09PSAnY29tbWEnICYmIGlzQXJyYXkob2JqKSkge1xuICAgICAgICAvLyB3ZSBuZWVkIHRvIGpvaW4gZWxlbWVudHMgaW5cbiAgICAgICAgaWYgKGVuY29kZVZhbHVlc09ubHkgJiYgZW5jb2Rlcikge1xuICAgICAgICAgICAgb2JqID0gdXRpbHMubWF5YmVNYXAob2JqLCBlbmNvZGVyKTtcbiAgICAgICAgfVxuICAgICAgICBvYmpLZXlzID0gW3sgdmFsdWU6IG9iai5sZW5ndGggPiAwID8gb2JqLmpvaW4oJywnKSB8fCBudWxsIDogdm9pZCB1bmRlZmluZWQgfV07XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KGZpbHRlcikpIHtcbiAgICAgICAgb2JqS2V5cyA9IGZpbHRlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgICAgIG9iaktleXMgPSBzb3J0ID8ga2V5cy5zb3J0KHNvcnQpIDoga2V5cztcbiAgICB9XG5cbiAgICB2YXIgYWRqdXN0ZWRQcmVmaXggPSBjb21tYVJvdW5kVHJpcCAmJiBpc0FycmF5KG9iaikgJiYgb2JqLmxlbmd0aCA9PT0gMSA/IHByZWZpeCArICdbXScgOiBwcmVmaXg7XG5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IG9iaktleXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgdmFyIGtleSA9IG9iaktleXNbal07XG4gICAgICAgIHZhciB2YWx1ZSA9IHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmIHR5cGVvZiBrZXkudmFsdWUgIT09ICd1bmRlZmluZWQnID8ga2V5LnZhbHVlIDogb2JqW2tleV07XG5cbiAgICAgICAgaWYgKHNraXBOdWxscyAmJiB2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIga2V5UHJlZml4ID0gaXNBcnJheShvYmopXG4gICAgICAgICAgICA/IHR5cGVvZiBnZW5lcmF0ZUFycmF5UHJlZml4ID09PSAnZnVuY3Rpb24nID8gZ2VuZXJhdGVBcnJheVByZWZpeChhZGp1c3RlZFByZWZpeCwga2V5KSA6IGFkanVzdGVkUHJlZml4XG4gICAgICAgICAgICA6IGFkanVzdGVkUHJlZml4ICsgKGFsbG93RG90cyA/ICcuJyArIGtleSA6ICdbJyArIGtleSArICddJyk7XG5cbiAgICAgICAgc2lkZUNoYW5uZWwuc2V0KG9iamVjdCwgc3RlcCk7XG4gICAgICAgIHZhciB2YWx1ZVNpZGVDaGFubmVsID0gZ2V0U2lkZUNoYW5uZWwoKTtcbiAgICAgICAgdmFsdWVTaWRlQ2hhbm5lbC5zZXQoc2VudGluZWwsIHNpZGVDaGFubmVsKTtcbiAgICAgICAgcHVzaFRvQXJyYXkodmFsdWVzLCBzdHJpbmdpZnkoXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGtleVByZWZpeCxcbiAgICAgICAgICAgIGdlbmVyYXRlQXJyYXlQcmVmaXgsXG4gICAgICAgICAgICBjb21tYVJvdW5kVHJpcCxcbiAgICAgICAgICAgIHN0cmljdE51bGxIYW5kbGluZyxcbiAgICAgICAgICAgIHNraXBOdWxscyxcbiAgICAgICAgICAgIGdlbmVyYXRlQXJyYXlQcmVmaXggPT09ICdjb21tYScgJiYgZW5jb2RlVmFsdWVzT25seSAmJiBpc0FycmF5KG9iaikgPyBudWxsIDogZW5jb2RlcixcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNvcnQsXG4gICAgICAgICAgICBhbGxvd0RvdHMsXG4gICAgICAgICAgICBzZXJpYWxpemVEYXRlLFxuICAgICAgICAgICAgZm9ybWF0LFxuICAgICAgICAgICAgZm9ybWF0dGVyLFxuICAgICAgICAgICAgZW5jb2RlVmFsdWVzT25seSxcbiAgICAgICAgICAgIGNoYXJzZXQsXG4gICAgICAgICAgICB2YWx1ZVNpZGVDaGFubmVsXG4gICAgICAgICkpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZXM7XG59O1xuXG52YXIgbm9ybWFsaXplU3RyaW5naWZ5T3B0aW9ucyA9IGZ1bmN0aW9uIG5vcm1hbGl6ZVN0cmluZ2lmeU9wdGlvbnMob3B0cykge1xuICAgIGlmICghb3B0cykge1xuICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuZW5jb2RlciAhPT0gbnVsbCAmJiB0eXBlb2Ygb3B0cy5lbmNvZGVyICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygb3B0cy5lbmNvZGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0VuY29kZXIgaGFzIHRvIGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgdmFyIGNoYXJzZXQgPSBvcHRzLmNoYXJzZXQgfHwgZGVmYXVsdHMuY2hhcnNldDtcbiAgICBpZiAodHlwZW9mIG9wdHMuY2hhcnNldCAhPT0gJ3VuZGVmaW5lZCcgJiYgb3B0cy5jaGFyc2V0ICE9PSAndXRmLTgnICYmIG9wdHMuY2hhcnNldCAhPT0gJ2lzby04ODU5LTEnKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBjaGFyc2V0IG9wdGlvbiBtdXN0IGJlIGVpdGhlciB1dGYtOCwgaXNvLTg4NTktMSwgb3IgdW5kZWZpbmVkJyk7XG4gICAgfVxuXG4gICAgdmFyIGZvcm1hdCA9IGZvcm1hdHNbJ2RlZmF1bHQnXTtcbiAgICBpZiAodHlwZW9mIG9wdHMuZm9ybWF0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAoIWhhcy5jYWxsKGZvcm1hdHMuZm9ybWF0dGVycywgb3B0cy5mb3JtYXQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGZvcm1hdCBvcHRpb24gcHJvdmlkZWQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgZm9ybWF0ID0gb3B0cy5mb3JtYXQ7XG4gICAgfVxuICAgIHZhciBmb3JtYXR0ZXIgPSBmb3JtYXRzLmZvcm1hdHRlcnNbZm9ybWF0XTtcblxuICAgIHZhciBmaWx0ZXIgPSBkZWZhdWx0cy5maWx0ZXI7XG4gICAgaWYgKHR5cGVvZiBvcHRzLmZpbHRlciA9PT0gJ2Z1bmN0aW9uJyB8fCBpc0FycmF5KG9wdHMuZmlsdGVyKSkge1xuICAgICAgICBmaWx0ZXIgPSBvcHRzLmZpbHRlcjtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhZGRRdWVyeVByZWZpeDogdHlwZW9mIG9wdHMuYWRkUXVlcnlQcmVmaXggPT09ICdib29sZWFuJyA/IG9wdHMuYWRkUXVlcnlQcmVmaXggOiBkZWZhdWx0cy5hZGRRdWVyeVByZWZpeCxcbiAgICAgICAgYWxsb3dEb3RzOiB0eXBlb2Ygb3B0cy5hbGxvd0RvdHMgPT09ICd1bmRlZmluZWQnID8gZGVmYXVsdHMuYWxsb3dEb3RzIDogISFvcHRzLmFsbG93RG90cyxcbiAgICAgICAgY2hhcnNldDogY2hhcnNldCxcbiAgICAgICAgY2hhcnNldFNlbnRpbmVsOiB0eXBlb2Ygb3B0cy5jaGFyc2V0U2VudGluZWwgPT09ICdib29sZWFuJyA/IG9wdHMuY2hhcnNldFNlbnRpbmVsIDogZGVmYXVsdHMuY2hhcnNldFNlbnRpbmVsLFxuICAgICAgICBkZWxpbWl0ZXI6IHR5cGVvZiBvcHRzLmRlbGltaXRlciA9PT0gJ3VuZGVmaW5lZCcgPyBkZWZhdWx0cy5kZWxpbWl0ZXIgOiBvcHRzLmRlbGltaXRlcixcbiAgICAgICAgZW5jb2RlOiB0eXBlb2Ygb3B0cy5lbmNvZGUgPT09ICdib29sZWFuJyA/IG9wdHMuZW5jb2RlIDogZGVmYXVsdHMuZW5jb2RlLFxuICAgICAgICBlbmNvZGVyOiB0eXBlb2Ygb3B0cy5lbmNvZGVyID09PSAnZnVuY3Rpb24nID8gb3B0cy5lbmNvZGVyIDogZGVmYXVsdHMuZW5jb2RlcixcbiAgICAgICAgZW5jb2RlVmFsdWVzT25seTogdHlwZW9mIG9wdHMuZW5jb2RlVmFsdWVzT25seSA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5lbmNvZGVWYWx1ZXNPbmx5IDogZGVmYXVsdHMuZW5jb2RlVmFsdWVzT25seSxcbiAgICAgICAgZmlsdGVyOiBmaWx0ZXIsXG4gICAgICAgIGZvcm1hdDogZm9ybWF0LFxuICAgICAgICBmb3JtYXR0ZXI6IGZvcm1hdHRlcixcbiAgICAgICAgc2VyaWFsaXplRGF0ZTogdHlwZW9mIG9wdHMuc2VyaWFsaXplRGF0ZSA9PT0gJ2Z1bmN0aW9uJyA/IG9wdHMuc2VyaWFsaXplRGF0ZSA6IGRlZmF1bHRzLnNlcmlhbGl6ZURhdGUsXG4gICAgICAgIHNraXBOdWxsczogdHlwZW9mIG9wdHMuc2tpcE51bGxzID09PSAnYm9vbGVhbicgPyBvcHRzLnNraXBOdWxscyA6IGRlZmF1bHRzLnNraXBOdWxscyxcbiAgICAgICAgc29ydDogdHlwZW9mIG9wdHMuc29ydCA9PT0gJ2Z1bmN0aW9uJyA/IG9wdHMuc29ydCA6IG51bGwsXG4gICAgICAgIHN0cmljdE51bGxIYW5kbGluZzogdHlwZW9mIG9wdHMuc3RyaWN0TnVsbEhhbmRsaW5nID09PSAnYm9vbGVhbicgPyBvcHRzLnN0cmljdE51bGxIYW5kbGluZyA6IGRlZmF1bHRzLnN0cmljdE51bGxIYW5kbGluZ1xuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmplY3QsIG9wdHMpIHtcbiAgICB2YXIgb2JqID0gb2JqZWN0O1xuICAgIHZhciBvcHRpb25zID0gbm9ybWFsaXplU3RyaW5naWZ5T3B0aW9ucyhvcHRzKTtcblxuICAgIHZhciBvYmpLZXlzO1xuICAgIHZhciBmaWx0ZXI7XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuZmlsdGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGZpbHRlciA9IG9wdGlvbnMuZmlsdGVyO1xuICAgICAgICBvYmogPSBmaWx0ZXIoJycsIG9iaik7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KG9wdGlvbnMuZmlsdGVyKSkge1xuICAgICAgICBmaWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcbiAgICAgICAgb2JqS2V5cyA9IGZpbHRlcjtcbiAgICB9XG5cbiAgICB2YXIga2V5cyA9IFtdO1xuXG4gICAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnIHx8IG9iaiA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgdmFyIGFycmF5Rm9ybWF0O1xuICAgIGlmIChvcHRzICYmIG9wdHMuYXJyYXlGb3JtYXQgaW4gYXJyYXlQcmVmaXhHZW5lcmF0b3JzKSB7XG4gICAgICAgIGFycmF5Rm9ybWF0ID0gb3B0cy5hcnJheUZvcm1hdDtcbiAgICB9IGVsc2UgaWYgKG9wdHMgJiYgJ2luZGljZXMnIGluIG9wdHMpIHtcbiAgICAgICAgYXJyYXlGb3JtYXQgPSBvcHRzLmluZGljZXMgPyAnaW5kaWNlcycgOiAncmVwZWF0JztcbiAgICB9IGVsc2Uge1xuICAgICAgICBhcnJheUZvcm1hdCA9ICdpbmRpY2VzJztcbiAgICB9XG5cbiAgICB2YXIgZ2VuZXJhdGVBcnJheVByZWZpeCA9IGFycmF5UHJlZml4R2VuZXJhdG9yc1thcnJheUZvcm1hdF07XG4gICAgaWYgKG9wdHMgJiYgJ2NvbW1hUm91bmRUcmlwJyBpbiBvcHRzICYmIHR5cGVvZiBvcHRzLmNvbW1hUm91bmRUcmlwICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYGNvbW1hUm91bmRUcmlwYCBtdXN0IGJlIGEgYm9vbGVhbiwgb3IgYWJzZW50Jyk7XG4gICAgfVxuICAgIHZhciBjb21tYVJvdW5kVHJpcCA9IGdlbmVyYXRlQXJyYXlQcmVmaXggPT09ICdjb21tYScgJiYgb3B0cyAmJiBvcHRzLmNvbW1hUm91bmRUcmlwO1xuXG4gICAgaWYgKCFvYmpLZXlzKSB7XG4gICAgICAgIG9iaktleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNvcnQpIHtcbiAgICAgICAgb2JqS2V5cy5zb3J0KG9wdGlvbnMuc29ydCk7XG4gICAgfVxuXG4gICAgdmFyIHNpZGVDaGFubmVsID0gZ2V0U2lkZUNoYW5uZWwoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iaktleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGtleSA9IG9iaktleXNbaV07XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuc2tpcE51bGxzICYmIG9ialtrZXldID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBwdXNoVG9BcnJheShrZXlzLCBzdHJpbmdpZnkoXG4gICAgICAgICAgICBvYmpba2V5XSxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIGdlbmVyYXRlQXJyYXlQcmVmaXgsXG4gICAgICAgICAgICBjb21tYVJvdW5kVHJpcCxcbiAgICAgICAgICAgIG9wdGlvbnMuc3RyaWN0TnVsbEhhbmRsaW5nLFxuICAgICAgICAgICAgb3B0aW9ucy5za2lwTnVsbHMsXG4gICAgICAgICAgICBvcHRpb25zLmVuY29kZSA/IG9wdGlvbnMuZW5jb2RlciA6IG51bGwsXG4gICAgICAgICAgICBvcHRpb25zLmZpbHRlcixcbiAgICAgICAgICAgIG9wdGlvbnMuc29ydCxcbiAgICAgICAgICAgIG9wdGlvbnMuYWxsb3dEb3RzLFxuICAgICAgICAgICAgb3B0aW9ucy5zZXJpYWxpemVEYXRlLFxuICAgICAgICAgICAgb3B0aW9ucy5mb3JtYXQsXG4gICAgICAgICAgICBvcHRpb25zLmZvcm1hdHRlcixcbiAgICAgICAgICAgIG9wdGlvbnMuZW5jb2RlVmFsdWVzT25seSxcbiAgICAgICAgICAgIG9wdGlvbnMuY2hhcnNldCxcbiAgICAgICAgICAgIHNpZGVDaGFubmVsXG4gICAgICAgICkpO1xuICAgIH1cblxuICAgIHZhciBqb2luZWQgPSBrZXlzLmpvaW4ob3B0aW9ucy5kZWxpbWl0ZXIpO1xuICAgIHZhciBwcmVmaXggPSBvcHRpb25zLmFkZFF1ZXJ5UHJlZml4ID09PSB0cnVlID8gJz8nIDogJyc7XG5cbiAgICBpZiAob3B0aW9ucy5jaGFyc2V0U2VudGluZWwpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuY2hhcnNldCA9PT0gJ2lzby04ODU5LTEnKSB7XG4gICAgICAgICAgICAvLyBlbmNvZGVVUklDb21wb25lbnQoJyYjMTAwMDM7JyksIHRoZSBcIm51bWVyaWMgZW50aXR5XCIgcmVwcmVzZW50YXRpb24gb2YgYSBjaGVja21hcmtcbiAgICAgICAgICAgIHByZWZpeCArPSAndXRmOD0lMjYlMjMxMDAwMyUzQiYnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZW5jb2RlVVJJQ29tcG9uZW50KCfinJMnKVxuICAgICAgICAgICAgcHJlZml4ICs9ICd1dGY4PSVFMiU5QyU5MyYnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGpvaW5lZC5sZW5ndGggPiAwID8gcHJlZml4ICsgam9pbmVkIDogJyc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgYWxsb3dEb3RzOiBmYWxzZSxcbiAgICBhbGxvd1Byb3RvdHlwZXM6IGZhbHNlLFxuICAgIGFsbG93U3BhcnNlOiBmYWxzZSxcbiAgICBhcnJheUxpbWl0OiAyMCxcbiAgICBjaGFyc2V0OiAndXRmLTgnLFxuICAgIGNoYXJzZXRTZW50aW5lbDogZmFsc2UsXG4gICAgY29tbWE6IGZhbHNlLFxuICAgIGRlY29kZXI6IHV0aWxzLmRlY29kZSxcbiAgICBkZWxpbWl0ZXI6ICcmJyxcbiAgICBkZXB0aDogNSxcbiAgICBpZ25vcmVRdWVyeVByZWZpeDogZmFsc2UsXG4gICAgaW50ZXJwcmV0TnVtZXJpY0VudGl0aWVzOiBmYWxzZSxcbiAgICBwYXJhbWV0ZXJMaW1pdDogMTAwMCxcbiAgICBwYXJzZUFycmF5czogdHJ1ZSxcbiAgICBwbGFpbk9iamVjdHM6IGZhbHNlLFxuICAgIHN0cmljdE51bGxIYW5kbGluZzogZmFsc2Vcbn07XG5cbnZhciBpbnRlcnByZXROdW1lcmljRW50aXRpZXMgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8mIyhcXGQrKTsvZywgZnVuY3Rpb24gKCQwLCBudW1iZXJTdHIpIHtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQobnVtYmVyU3RyLCAxMCkpO1xuICAgIH0pO1xufTtcblxudmFyIHBhcnNlQXJyYXlWYWx1ZSA9IGZ1bmN0aW9uICh2YWwsIG9wdGlvbnMpIHtcbiAgICBpZiAodmFsICYmIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnICYmIG9wdGlvbnMuY29tbWEgJiYgdmFsLmluZGV4T2YoJywnKSA+IC0xKSB7XG4gICAgICAgIHJldHVybiB2YWwuc3BsaXQoJywnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xufTtcblxuLy8gVGhpcyBpcyB3aGF0IGJyb3dzZXJzIHdpbGwgc3VibWl0IHdoZW4gdGhlIOKckyBjaGFyYWN0ZXIgb2NjdXJzIGluIGFuXG4vLyBhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQgYm9keSBhbmQgdGhlIGVuY29kaW5nIG9mIHRoZSBwYWdlIGNvbnRhaW5pbmdcbi8vIHRoZSBmb3JtIGlzIGlzby04ODU5LTEsIG9yIHdoZW4gdGhlIHN1Ym1pdHRlZCBmb3JtIGhhcyBhbiBhY2NlcHQtY2hhcnNldFxuLy8gYXR0cmlidXRlIG9mIGlzby04ODU5LTEuIFByZXN1bWFibHkgYWxzbyB3aXRoIG90aGVyIGNoYXJzZXRzIHRoYXQgZG8gbm90IGNvbnRhaW5cbi8vIHRoZSDinJMgY2hhcmFjdGVyLCBzdWNoIGFzIHVzLWFzY2lpLlxudmFyIGlzb1NlbnRpbmVsID0gJ3V0Zjg9JTI2JTIzMTAwMDMlM0InOyAvLyBlbmNvZGVVUklDb21wb25lbnQoJyYjMTAwMDM7JylcblxuLy8gVGhlc2UgYXJlIHRoZSBwZXJjZW50LWVuY29kZWQgdXRmLTggb2N0ZXRzIHJlcHJlc2VudGluZyBhIGNoZWNrbWFyaywgaW5kaWNhdGluZyB0aGF0IHRoZSByZXF1ZXN0IGFjdHVhbGx5IGlzIHV0Zi04IGVuY29kZWQuXG52YXIgY2hhcnNldFNlbnRpbmVsID0gJ3V0Zjg9JUUyJTlDJTkzJzsgLy8gZW5jb2RlVVJJQ29tcG9uZW50KCfinJMnKVxuXG52YXIgcGFyc2VWYWx1ZXMgPSBmdW5jdGlvbiBwYXJzZVF1ZXJ5U3RyaW5nVmFsdWVzKHN0ciwgb3B0aW9ucykge1xuICAgIHZhciBvYmogPSB7IF9fcHJvdG9fXzogbnVsbCB9O1xuXG4gICAgdmFyIGNsZWFuU3RyID0gb3B0aW9ucy5pZ25vcmVRdWVyeVByZWZpeCA/IHN0ci5yZXBsYWNlKC9eXFw/LywgJycpIDogc3RyO1xuICAgIHZhciBsaW1pdCA9IG9wdGlvbnMucGFyYW1ldGVyTGltaXQgPT09IEluZmluaXR5ID8gdW5kZWZpbmVkIDogb3B0aW9ucy5wYXJhbWV0ZXJMaW1pdDtcbiAgICB2YXIgcGFydHMgPSBjbGVhblN0ci5zcGxpdChvcHRpb25zLmRlbGltaXRlciwgbGltaXQpO1xuICAgIHZhciBza2lwSW5kZXggPSAtMTsgLy8gS2VlcCB0cmFjayBvZiB3aGVyZSB0aGUgdXRmOCBzZW50aW5lbCB3YXMgZm91bmRcbiAgICB2YXIgaTtcblxuICAgIHZhciBjaGFyc2V0ID0gb3B0aW9ucy5jaGFyc2V0O1xuICAgIGlmIChvcHRpb25zLmNoYXJzZXRTZW50aW5lbCkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChwYXJ0c1tpXS5pbmRleE9mKCd1dGY4PScpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnRzW2ldID09PSBjaGFyc2V0U2VudGluZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hhcnNldCA9ICd1dGYtOCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJ0c1tpXSA9PT0gaXNvU2VudGluZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hhcnNldCA9ICdpc28tODg1OS0xJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2tpcEluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICBpID0gcGFydHMubGVuZ3RoOyAvLyBUaGUgZXNsaW50IHNldHRpbmdzIGRvIG5vdCBhbGxvdyBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoaSA9PT0gc2tpcEluZGV4KSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFydCA9IHBhcnRzW2ldO1xuXG4gICAgICAgIHZhciBicmFja2V0RXF1YWxzUG9zID0gcGFydC5pbmRleE9mKCddPScpO1xuICAgICAgICB2YXIgcG9zID0gYnJhY2tldEVxdWFsc1BvcyA9PT0gLTEgPyBwYXJ0LmluZGV4T2YoJz0nKSA6IGJyYWNrZXRFcXVhbHNQb3MgKyAxO1xuXG4gICAgICAgIHZhciBrZXksIHZhbDtcbiAgICAgICAgaWYgKHBvcyA9PT0gLTEpIHtcbiAgICAgICAgICAgIGtleSA9IG9wdGlvbnMuZGVjb2RlcihwYXJ0LCBkZWZhdWx0cy5kZWNvZGVyLCBjaGFyc2V0LCAna2V5Jyk7XG4gICAgICAgICAgICB2YWwgPSBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyA/IG51bGwgOiAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGtleSA9IG9wdGlvbnMuZGVjb2RlcihwYXJ0LnNsaWNlKDAsIHBvcyksIGRlZmF1bHRzLmRlY29kZXIsIGNoYXJzZXQsICdrZXknKTtcbiAgICAgICAgICAgIHZhbCA9IHV0aWxzLm1heWJlTWFwKFxuICAgICAgICAgICAgICAgIHBhcnNlQXJyYXlWYWx1ZShwYXJ0LnNsaWNlKHBvcyArIDEpLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZW5jb2RlZFZhbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5kZWNvZGVyKGVuY29kZWRWYWwsIGRlZmF1bHRzLmRlY29kZXIsIGNoYXJzZXQsICd2YWx1ZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsICYmIG9wdGlvbnMuaW50ZXJwcmV0TnVtZXJpY0VudGl0aWVzICYmIGNoYXJzZXQgPT09ICdpc28tODg1OS0xJykge1xuICAgICAgICAgICAgdmFsID0gaW50ZXJwcmV0TnVtZXJpY0VudGl0aWVzKHZhbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFydC5pbmRleE9mKCdbXT0nKSA+IC0xKSB7XG4gICAgICAgICAgICB2YWwgPSBpc0FycmF5KHZhbCkgPyBbdmFsXSA6IHZhbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXMuY2FsbChvYmosIGtleSkpIHtcbiAgICAgICAgICAgIG9ialtrZXldID0gdXRpbHMuY29tYmluZShvYmpba2V5XSwgdmFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9ialtrZXldID0gdmFsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbnZhciBwYXJzZU9iamVjdCA9IGZ1bmN0aW9uIChjaGFpbiwgdmFsLCBvcHRpb25zLCB2YWx1ZXNQYXJzZWQpIHtcbiAgICB2YXIgbGVhZiA9IHZhbHVlc1BhcnNlZCA/IHZhbCA6IHBhcnNlQXJyYXlWYWx1ZSh2YWwsIG9wdGlvbnMpO1xuXG4gICAgZm9yICh2YXIgaSA9IGNoYWluLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIHZhciBvYmo7XG4gICAgICAgIHZhciByb290ID0gY2hhaW5baV07XG5cbiAgICAgICAgaWYgKHJvb3QgPT09ICdbXScgJiYgb3B0aW9ucy5wYXJzZUFycmF5cykge1xuICAgICAgICAgICAgb2JqID0gW10uY29uY2F0KGxlYWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2JqID0gb3B0aW9ucy5wbGFpbk9iamVjdHMgPyBPYmplY3QuY3JlYXRlKG51bGwpIDoge307XG4gICAgICAgICAgICB2YXIgY2xlYW5Sb290ID0gcm9vdC5jaGFyQXQoMCkgPT09ICdbJyAmJiByb290LmNoYXJBdChyb290Lmxlbmd0aCAtIDEpID09PSAnXScgPyByb290LnNsaWNlKDEsIC0xKSA6IHJvb3Q7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludChjbGVhblJvb3QsIDEwKTtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5wYXJzZUFycmF5cyAmJiBjbGVhblJvb3QgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgb2JqID0geyAwOiBsZWFmIH07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgICFpc05hTihpbmRleClcbiAgICAgICAgICAgICAgICAmJiByb290ICE9PSBjbGVhblJvb3RcbiAgICAgICAgICAgICAgICAmJiBTdHJpbmcoaW5kZXgpID09PSBjbGVhblJvb3RcbiAgICAgICAgICAgICAgICAmJiBpbmRleCA+PSAwXG4gICAgICAgICAgICAgICAgJiYgKG9wdGlvbnMucGFyc2VBcnJheXMgJiYgaW5kZXggPD0gb3B0aW9ucy5hcnJheUxpbWl0KVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgb2JqID0gW107XG4gICAgICAgICAgICAgICAgb2JqW2luZGV4XSA9IGxlYWY7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNsZWFuUm9vdCAhPT0gJ19fcHJvdG9fXycpIHtcbiAgICAgICAgICAgICAgICBvYmpbY2xlYW5Sb290XSA9IGxlYWY7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZWFmID0gb2JqO1xuICAgIH1cblxuICAgIHJldHVybiBsZWFmO1xufTtcblxudmFyIHBhcnNlS2V5cyA9IGZ1bmN0aW9uIHBhcnNlUXVlcnlTdHJpbmdLZXlzKGdpdmVuS2V5LCB2YWwsIG9wdGlvbnMsIHZhbHVlc1BhcnNlZCkge1xuICAgIGlmICghZ2l2ZW5LZXkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRyYW5zZm9ybSBkb3Qgbm90YXRpb24gdG8gYnJhY2tldCBub3RhdGlvblxuICAgIHZhciBrZXkgPSBvcHRpb25zLmFsbG93RG90cyA/IGdpdmVuS2V5LnJlcGxhY2UoL1xcLihbXi5bXSspL2csICdbJDFdJykgOiBnaXZlbktleTtcblxuICAgIC8vIFRoZSByZWdleCBjaHVua3NcblxuICAgIHZhciBicmFja2V0cyA9IC8oXFxbW15bXFxdXSpdKS87XG4gICAgdmFyIGNoaWxkID0gLyhcXFtbXltcXF1dKl0pL2c7XG5cbiAgICAvLyBHZXQgdGhlIHBhcmVudFxuXG4gICAgdmFyIHNlZ21lbnQgPSBvcHRpb25zLmRlcHRoID4gMCAmJiBicmFja2V0cy5leGVjKGtleSk7XG4gICAgdmFyIHBhcmVudCA9IHNlZ21lbnQgPyBrZXkuc2xpY2UoMCwgc2VnbWVudC5pbmRleCkgOiBrZXk7XG5cbiAgICAvLyBTdGFzaCB0aGUgcGFyZW50IGlmIGl0IGV4aXN0c1xuXG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBpZiAocGFyZW50KSB7XG4gICAgICAgIC8vIElmIHdlIGFyZW4ndCB1c2luZyBwbGFpbiBvYmplY3RzLCBvcHRpb25hbGx5IHByZWZpeCBrZXlzIHRoYXQgd291bGQgb3ZlcndyaXRlIG9iamVjdCBwcm90b3R5cGUgcHJvcGVydGllc1xuICAgICAgICBpZiAoIW9wdGlvbnMucGxhaW5PYmplY3RzICYmIGhhcy5jYWxsKE9iamVjdC5wcm90b3R5cGUsIHBhcmVudCkpIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5hbGxvd1Byb3RvdHlwZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBrZXlzLnB1c2gocGFyZW50KTtcbiAgICB9XG5cbiAgICAvLyBMb29wIHRocm91Z2ggY2hpbGRyZW4gYXBwZW5kaW5nIHRvIHRoZSBhcnJheSB1bnRpbCB3ZSBoaXQgZGVwdGhcblxuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAob3B0aW9ucy5kZXB0aCA+IDAgJiYgKHNlZ21lbnQgPSBjaGlsZC5leGVjKGtleSkpICE9PSBudWxsICYmIGkgPCBvcHRpb25zLmRlcHRoKSB7XG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgaWYgKCFvcHRpb25zLnBsYWluT2JqZWN0cyAmJiBoYXMuY2FsbChPYmplY3QucHJvdG90eXBlLCBzZWdtZW50WzFdLnNsaWNlKDEsIC0xKSkpIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5hbGxvd1Byb3RvdHlwZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAga2V5cy5wdXNoKHNlZ21lbnRbMV0pO1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlJ3MgYSByZW1haW5kZXIsIGp1c3QgYWRkIHdoYXRldmVyIGlzIGxlZnRcblxuICAgIGlmIChzZWdtZW50KSB7XG4gICAgICAgIGtleXMucHVzaCgnWycgKyBrZXkuc2xpY2Uoc2VnbWVudC5pbmRleCkgKyAnXScpO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJzZU9iamVjdChrZXlzLCB2YWwsIG9wdGlvbnMsIHZhbHVlc1BhcnNlZCk7XG59O1xuXG52YXIgbm9ybWFsaXplUGFyc2VPcHRpb25zID0gZnVuY3Rpb24gbm9ybWFsaXplUGFyc2VPcHRpb25zKG9wdHMpIHtcbiAgICBpZiAoIW9wdHMpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgIH1cblxuICAgIGlmIChvcHRzLmRlY29kZXIgIT09IG51bGwgJiYgb3B0cy5kZWNvZGVyICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdHMuZGVjb2RlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdEZWNvZGVyIGhhcyB0byBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy5jaGFyc2V0ICE9PSAndW5kZWZpbmVkJyAmJiBvcHRzLmNoYXJzZXQgIT09ICd1dGYtOCcgJiYgb3B0cy5jaGFyc2V0ICE9PSAnaXNvLTg4NTktMScpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIGNoYXJzZXQgb3B0aW9uIG11c3QgYmUgZWl0aGVyIHV0Zi04LCBpc28tODg1OS0xLCBvciB1bmRlZmluZWQnKTtcbiAgICB9XG4gICAgdmFyIGNoYXJzZXQgPSB0eXBlb2Ygb3B0cy5jaGFyc2V0ID09PSAndW5kZWZpbmVkJyA/IGRlZmF1bHRzLmNoYXJzZXQgOiBvcHRzLmNoYXJzZXQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhbGxvd0RvdHM6IHR5cGVvZiBvcHRzLmFsbG93RG90cyA9PT0gJ3VuZGVmaW5lZCcgPyBkZWZhdWx0cy5hbGxvd0RvdHMgOiAhIW9wdHMuYWxsb3dEb3RzLFxuICAgICAgICBhbGxvd1Byb3RvdHlwZXM6IHR5cGVvZiBvcHRzLmFsbG93UHJvdG90eXBlcyA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5hbGxvd1Byb3RvdHlwZXMgOiBkZWZhdWx0cy5hbGxvd1Byb3RvdHlwZXMsXG4gICAgICAgIGFsbG93U3BhcnNlOiB0eXBlb2Ygb3B0cy5hbGxvd1NwYXJzZSA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5hbGxvd1NwYXJzZSA6IGRlZmF1bHRzLmFsbG93U3BhcnNlLFxuICAgICAgICBhcnJheUxpbWl0OiB0eXBlb2Ygb3B0cy5hcnJheUxpbWl0ID09PSAnbnVtYmVyJyA/IG9wdHMuYXJyYXlMaW1pdCA6IGRlZmF1bHRzLmFycmF5TGltaXQsXG4gICAgICAgIGNoYXJzZXQ6IGNoYXJzZXQsXG4gICAgICAgIGNoYXJzZXRTZW50aW5lbDogdHlwZW9mIG9wdHMuY2hhcnNldFNlbnRpbmVsID09PSAnYm9vbGVhbicgPyBvcHRzLmNoYXJzZXRTZW50aW5lbCA6IGRlZmF1bHRzLmNoYXJzZXRTZW50aW5lbCxcbiAgICAgICAgY29tbWE6IHR5cGVvZiBvcHRzLmNvbW1hID09PSAnYm9vbGVhbicgPyBvcHRzLmNvbW1hIDogZGVmYXVsdHMuY29tbWEsXG4gICAgICAgIGRlY29kZXI6IHR5cGVvZiBvcHRzLmRlY29kZXIgPT09ICdmdW5jdGlvbicgPyBvcHRzLmRlY29kZXIgOiBkZWZhdWx0cy5kZWNvZGVyLFxuICAgICAgICBkZWxpbWl0ZXI6IHR5cGVvZiBvcHRzLmRlbGltaXRlciA9PT0gJ3N0cmluZycgfHwgdXRpbHMuaXNSZWdFeHAob3B0cy5kZWxpbWl0ZXIpID8gb3B0cy5kZWxpbWl0ZXIgOiBkZWZhdWx0cy5kZWxpbWl0ZXIsXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1pbXBsaWNpdC1jb2VyY2lvbiwgbm8tZXh0cmEtcGFyZW5zXG4gICAgICAgIGRlcHRoOiAodHlwZW9mIG9wdHMuZGVwdGggPT09ICdudW1iZXInIHx8IG9wdHMuZGVwdGggPT09IGZhbHNlKSA/ICtvcHRzLmRlcHRoIDogZGVmYXVsdHMuZGVwdGgsXG4gICAgICAgIGlnbm9yZVF1ZXJ5UHJlZml4OiBvcHRzLmlnbm9yZVF1ZXJ5UHJlZml4ID09PSB0cnVlLFxuICAgICAgICBpbnRlcnByZXROdW1lcmljRW50aXRpZXM6IHR5cGVvZiBvcHRzLmludGVycHJldE51bWVyaWNFbnRpdGllcyA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5pbnRlcnByZXROdW1lcmljRW50aXRpZXMgOiBkZWZhdWx0cy5pbnRlcnByZXROdW1lcmljRW50aXRpZXMsXG4gICAgICAgIHBhcmFtZXRlckxpbWl0OiB0eXBlb2Ygb3B0cy5wYXJhbWV0ZXJMaW1pdCA9PT0gJ251bWJlcicgPyBvcHRzLnBhcmFtZXRlckxpbWl0IDogZGVmYXVsdHMucGFyYW1ldGVyTGltaXQsXG4gICAgICAgIHBhcnNlQXJyYXlzOiBvcHRzLnBhcnNlQXJyYXlzICE9PSBmYWxzZSxcbiAgICAgICAgcGxhaW5PYmplY3RzOiB0eXBlb2Ygb3B0cy5wbGFpbk9iamVjdHMgPT09ICdib29sZWFuJyA/IG9wdHMucGxhaW5PYmplY3RzIDogZGVmYXVsdHMucGxhaW5PYmplY3RzLFxuICAgICAgICBzdHJpY3ROdWxsSGFuZGxpbmc6IHR5cGVvZiBvcHRzLnN0cmljdE51bGxIYW5kbGluZyA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5zdHJpY3ROdWxsSGFuZGxpbmcgOiBkZWZhdWx0cy5zdHJpY3ROdWxsSGFuZGxpbmdcbiAgICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RyLCBvcHRzKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBub3JtYWxpemVQYXJzZU9wdGlvbnMob3B0cyk7XG5cbiAgICBpZiAoc3RyID09PSAnJyB8fCBzdHIgPT09IG51bGwgfHwgdHlwZW9mIHN0ciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMucGxhaW5PYmplY3RzID8gT2JqZWN0LmNyZWF0ZShudWxsKSA6IHt9O1xuICAgIH1cblxuICAgIHZhciB0ZW1wT2JqID0gdHlwZW9mIHN0ciA9PT0gJ3N0cmluZycgPyBwYXJzZVZhbHVlcyhzdHIsIG9wdGlvbnMpIDogc3RyO1xuICAgIHZhciBvYmogPSBvcHRpb25zLnBsYWluT2JqZWN0cyA/IE9iamVjdC5jcmVhdGUobnVsbCkgOiB7fTtcblxuICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUga2V5cyBhbmQgc2V0dXAgdGhlIG5ldyBvYmplY3RcblxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGVtcE9iaik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICB2YXIgbmV3T2JqID0gcGFyc2VLZXlzKGtleSwgdGVtcE9ialtrZXldLCBvcHRpb25zLCB0eXBlb2Ygc3RyID09PSAnc3RyaW5nJyk7XG4gICAgICAgIG9iaiA9IHV0aWxzLm1lcmdlKG9iaiwgbmV3T2JqLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5hbGxvd1NwYXJzZSA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cblxuICAgIHJldHVybiB1dGlscy5jb21wYWN0KG9iaik7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RyaW5naWZ5ID0gcmVxdWlyZSgnLi9zdHJpbmdpZnknKTtcbnZhciBwYXJzZSA9IHJlcXVpcmUoJy4vcGFyc2UnKTtcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZvcm1hdHM6IGZvcm1hdHMsXG4gICAgcGFyc2U6IHBhcnNlLFxuICAgIHN0cmluZ2lmeTogc3RyaW5naWZ5XG59O1xuIiwiaW1wb3J0IHdpbmRvd0hhbmRsZXIgZnJvbSAnLi4vLi4vc3JjL2hlbHBlci93aW5kb3cnO1xuaW1wb3J0IHFzIGZyb20gJ3FzJztcbmltcG9ydCB1cmxqb2luIGZyb20gJ3VybC1qb2luJztcblxuZnVuY3Rpb24gUG9wdXBIYW5kbGVyKHdlYkF1dGgpIHtcbiAgdGhpcy53ZWJBdXRoID0gd2ViQXV0aDtcbiAgdGhpcy5fY3VycmVudF9wb3B1cCA9IG51bGw7XG4gIHRoaXMub3B0aW9ucyA9IG51bGw7XG59XG5cblBvcHVwSGFuZGxlci5wcm90b3R5cGUucHJlbG9hZCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdmFyIF93aW5kb3cgPSB3aW5kb3dIYW5kbGVyLmdldFdpbmRvdygpO1xuXG4gIHZhciB1cmwgPSBvcHRpb25zLnVybCB8fCAnYWJvdXQ6YmxhbmsnO1xuICB2YXIgcG9wdXBPcHRpb25zID0gb3B0aW9ucy5wb3B1cE9wdGlvbnMgfHwge307XG5cbiAgcG9wdXBPcHRpb25zLmxvY2F0aW9uID0gJ3llcyc7XG4gIGRlbGV0ZSBwb3B1cE9wdGlvbnMud2lkdGg7XG4gIGRlbGV0ZSBwb3B1cE9wdGlvbnMuaGVpZ2h0O1xuXG4gIHZhciB3aW5kb3dGZWF0dXJlcyA9IHFzLnN0cmluZ2lmeShwb3B1cE9wdGlvbnMsIHtcbiAgICBlbmNvZGU6IGZhbHNlLFxuICAgIGRlbGltaXRlcjogJywnXG4gIH0pO1xuXG4gIGlmICh0aGlzLl9jdXJyZW50X3BvcHVwICYmICF0aGlzLl9jdXJyZW50X3BvcHVwLmNsb3NlZCkge1xuICAgIHJldHVybiB0aGlzLl9jdXJyZW50X3BvcHVwO1xuICB9XG5cbiAgdGhpcy5fY3VycmVudF9wb3B1cCA9IF93aW5kb3cub3Blbih1cmwsICdfYmxhbmsnLCB3aW5kb3dGZWF0dXJlcyk7XG5cbiAgdGhpcy5fY3VycmVudF9wb3B1cC5raWxsID0gZnVuY3Rpb24oc3VjY2Vzcykge1xuICAgIF90aGlzLl9jdXJyZW50X3BvcHVwLnN1Y2Nlc3MgPSBzdWNjZXNzO1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgICBfdGhpcy5fY3VycmVudF9wb3B1cCA9IG51bGw7XG4gIH07XG5cbiAgcmV0dXJuIHRoaXMuX2N1cnJlbnRfcG9wdXA7XG59O1xuXG5Qb3B1cEhhbmRsZXIucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbih1cmwsIF8sIG9wdGlvbnMsIGNiKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHRoaXMudXJsID0gdXJsO1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICBpZiAoIXRoaXMuX2N1cnJlbnRfcG9wdXApIHtcbiAgICBvcHRpb25zLnVybCA9IHVybDtcbiAgICB0aGlzLnByZWxvYWQob3B0aW9ucyk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fY3VycmVudF9wb3B1cC5sb2NhdGlvbi5ocmVmID0gdXJsO1xuICB9XG5cbiAgdGhpcy50cmFuc2llbnRFcnJvckhhbmRsZXIgPSBmdW5jdGlvbihldmVudCkge1xuICAgIF90aGlzLmVycm9ySGFuZGxlcihldmVudCwgY2IpO1xuICB9O1xuXG4gIHRoaXMudHJhbnNpZW50U3RhcnRIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBfdGhpcy5zdGFydEhhbmRsZXIoZXZlbnQsIGNiKTtcbiAgfTtcblxuICB0aGlzLnRyYW5zaWVudEV4aXRIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgX3RoaXMuZXhpdEhhbmRsZXIoY2IpO1xuICB9O1xuXG4gIHRoaXMuX2N1cnJlbnRfcG9wdXAuYWRkRXZlbnRMaXN0ZW5lcignbG9hZGVycm9yJywgdGhpcy50cmFuc2llbnRFcnJvckhhbmRsZXIpO1xuICB0aGlzLl9jdXJyZW50X3BvcHVwLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWRzdGFydCcsIHRoaXMudHJhbnNpZW50U3RhcnRIYW5kbGVyKTtcbiAgdGhpcy5fY3VycmVudF9wb3B1cC5hZGRFdmVudExpc3RlbmVyKCdleGl0JywgdGhpcy50cmFuc2llbnRFeGl0SGFuZGxlcik7XG59O1xuXG5Qb3B1cEhhbmRsZXIucHJvdG90eXBlLmVycm9ySGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50LCBjYikge1xuICBpZiAoIXRoaXMuX2N1cnJlbnRfcG9wdXApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLl9jdXJyZW50X3BvcHVwLmtpbGwodHJ1ZSk7XG5cbiAgY2IoeyBlcnJvcjogJ3dpbmRvd19lcnJvcicsIGVycm9yRGVzY3JpcHRpb246IGV2ZW50Lm1lc3NhZ2UgfSk7XG59O1xuXG5Qb3B1cEhhbmRsZXIucHJvdG90eXBlLnVuaG9vayA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9jdXJyZW50X3BvcHVwLnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgJ2xvYWRlcnJvcicsXG4gICAgdGhpcy50cmFuc2llbnRFcnJvckhhbmRsZXJcbiAgKTtcbiAgdGhpcy5fY3VycmVudF9wb3B1cC5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICdsb2Fkc3RhcnQnLFxuICAgIHRoaXMudHJhbnNpZW50U3RhcnRIYW5kbGVyXG4gICk7XG4gIHRoaXMuX2N1cnJlbnRfcG9wdXAucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXhpdCcsIHRoaXMudHJhbnNpZW50RXhpdEhhbmRsZXIpO1xufTtcblxuUG9wdXBIYW5kbGVyLnByb3RvdHlwZS5leGl0SGFuZGxlciA9IGZ1bmN0aW9uKGNiKSB7XG4gIGlmICghdGhpcy5fY3VycmVudF9wb3B1cCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIHdoZW4gdGhlIG1vZGFsIGlzIGNsb3NlZCwgdGhpcyBldmVudCBpcyBjYWxsZWQgd2hpY2ggZW5kcyB1cCByZW1vdmluZyB0aGVcbiAgLy8gZXZlbnQgbGlzdGVuZXJzLiBJZiB5b3UgbW92ZSB0aGlzIGJlZm9yZSBjbG9zaW5nIHRoZSBtb2RhbCwgaXQgd2lsbCBhZGQgfjEgc2VjXG4gIC8vIGRlbGF5IGJldHdlZW4gdGhlIHVzZXIgYmVpbmcgcmVkaXJlY3RlZCB0byB0aGUgY2FsbGJhY2sgYW5kIHRoZSBwb3B1cCBnZXRzIGNsb3NlZC5cbiAgdGhpcy51bmhvb2soKTtcblxuICBpZiAoIXRoaXMuX2N1cnJlbnRfcG9wdXAuc3VjY2Vzcykge1xuICAgIGNiKHsgZXJyb3I6ICd3aW5kb3dfY2xvc2VkJywgZXJyb3JEZXNjcmlwdGlvbjogJ0Jyb3dzZXIgd2luZG93IGNsb3NlZCcgfSk7XG4gIH1cbn07XG5cblBvcHVwSGFuZGxlci5wcm90b3R5cGUuc3RhcnRIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQsIGNiKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgaWYgKCF0aGlzLl9jdXJyZW50X3BvcHVwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGNhbGxiYWNrVXJsID0gdXJsam9pbihcbiAgICAnaHR0cHM6JyxcbiAgICB0aGlzLndlYkF1dGguYmFzZU9wdGlvbnMuZG9tYWluLFxuICAgICcvbW9iaWxlJ1xuICApO1xuXG4gIGlmIChldmVudC51cmwgJiYgIShldmVudC51cmwuaW5kZXhPZihjYWxsYmFja1VybCArICcjJykgPT09IDApKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHBhcnRzID0gZXZlbnQudXJsLnNwbGl0KCcjJyk7XG5cbiAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBvcHRzID0geyBoYXNoOiBwYXJ0cy5wb3AoKSB9O1xuXG4gIGlmICh0aGlzLm9wdGlvbnMubm9uY2UpIHtcbiAgICBvcHRzLm5vbmNlID0gdGhpcy5vcHRpb25zLm5vbmNlO1xuICB9XG5cbiAgdGhpcy53ZWJBdXRoLnBhcnNlSGFzaChvcHRzLCBmdW5jdGlvbihlcnJvciwgcmVzdWx0KSB7XG4gICAgaWYgKGVycm9yIHx8IHJlc3VsdCkge1xuICAgICAgX3RoaXMuX2N1cnJlbnRfcG9wdXAua2lsbCh0cnVlKTtcbiAgICAgIGNiKGVycm9yLCByZXN1bHQpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBQb3B1cEhhbmRsZXI7XG4iLCJpbXBvcnQgdXJsam9pbiBmcm9tICd1cmwtam9pbic7XG5pbXBvcnQgUG9wdXBIYW5kbGVyIGZyb20gJy4vcG9wdXAtaGFuZGxlcic7XG5cbmZ1bmN0aW9uIFBsdWdpbkhhbmRsZXIod2ViQXV0aCkge1xuICB0aGlzLndlYkF1dGggPSB3ZWJBdXRoO1xufVxuXG5QbHVnaW5IYW5kbGVyLnByb3RvdHlwZS5wcm9jZXNzUGFyYW1zID0gZnVuY3Rpb24ocGFyYW1zKSB7XG4gIHBhcmFtcy5yZWRpcmVjdFVyaSA9IHVybGpvaW4oJ2h0dHBzOi8vJyArIHBhcmFtcy5kb21haW4sICdtb2JpbGUnKTtcbiAgZGVsZXRlIHBhcmFtcy5vd3A7XG4gIHJldHVybiBwYXJhbXM7XG59O1xuXG5QbHVnaW5IYW5kbGVyLnByb3RvdHlwZS5nZXRQb3B1cEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBQb3B1cEhhbmRsZXIodGhpcy53ZWJBdXRoKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFBsdWdpbkhhbmRsZXI7XG4iLCJpbXBvcnQgdmVyc2lvbiBmcm9tICcuLi8uLi9zcmMvdmVyc2lvbic7XG5pbXBvcnQgd2luZG93SGFuZGxlciBmcm9tICcuLi8uLi9zcmMvaGVscGVyL3dpbmRvdyc7XG5pbXBvcnQgUGx1Z2luSGFuZGxlciBmcm9tICcuL3BsdWdpbi1oYW5kbGVyJztcblxuZnVuY3Rpb24gQ29yZG92YVBsdWdpbigpIHtcbiAgdGhpcy53ZWJBdXRoID0gbnVsbDtcbiAgdGhpcy52ZXJzaW9uID0gdmVyc2lvbi5yYXc7XG4gIHRoaXMuZXh0ZW5zaWJpbGl0eVBvaW50cyA9IFsncG9wdXAuYXV0aG9yaXplJywgJ3BvcHVwLmdldFBvcHVwSGFuZGxlciddO1xufVxuXG5Db3Jkb3ZhUGx1Z2luLnByb3RvdHlwZS5zZXRXZWJBdXRoID0gZnVuY3Rpb24od2ViQXV0aCkge1xuICB0aGlzLndlYkF1dGggPSB3ZWJBdXRoO1xufTtcblxuQ29yZG92YVBsdWdpbi5wcm90b3R5cGUuc3VwcG9ydHMgPSBmdW5jdGlvbihleHRlbnNpYmlsaXR5UG9pbnQpIHtcbiAgdmFyIF93aW5kb3cgPSB3aW5kb3dIYW5kbGVyLmdldFdpbmRvdygpO1xuICByZXR1cm4gKFxuICAgICghIV93aW5kb3cuY29yZG92YSB8fCAhIV93aW5kb3cuZWxlY3Ryb24pICYmXG4gICAgdGhpcy5leHRlbnNpYmlsaXR5UG9pbnRzLmluZGV4T2YoZXh0ZW5zaWJpbGl0eVBvaW50KSA+IC0xXG4gICk7XG59O1xuXG5Db3Jkb3ZhUGx1Z2luLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgUGx1Z2luSGFuZGxlcih0aGlzLndlYkF1dGgpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgQ29yZG92YVBsdWdpbjtcbiJdLCJuYW1lcyI6WyJ0aGlzIiwiaGFzU3ltYm9sU2hhbSIsImJpbmQiLCJ1bmRlZmluZWQiLCJoYXNTeW1ib2xzIiwicmVxdWlyZSQkMCIsImhhc1Byb3RvIiwicmVxdWlyZSQkMSIsImhhc093biIsIkdldEludHJpbnNpYyIsIiRyZXBsYWNlIiwiJGNvbmNhdCIsImlzQXJyYXkiLCJ0b1N0ciIsIiRUeXBlRXJyb3IiLCJpbnNwZWN0IiwiaGFzIiwibWVyZ2UiLCJpc1JlZ0V4cCIsInNpZGVDaGFubmVsIiwiZ2V0U2lkZUNoYW5uZWwiLCJkZWZhdWx0cyIsInN0cmluZ2lmeSIsInFzIiwidXJsam9pbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztFQUFBLFdBQWMsR0FBRyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUU7O0VDQWxDLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO0FBQ3pDO0VBQ0EsU0FBUyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJ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QUMsQ0FBQyxDQUFDO0VBQzFDLEtBQUs7QUFDTDtFQUNBLElBQUksT0FBTyxHQUFHLENBQUM7RUFDZixDQUFDLENBQUM7QUFDRjtFQUNBLElBQUksT0FBTyxHQUFHLFNBQVMsT0FBTyxDQUFDLEtBQUssRUFBRTtFQUN0QyxJQUFJLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7RUFDbkQsSUFBSSxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7QUFDbEI7RUFDQSxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO0VBQzNDLFFBQVEsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzVCLFFBQVEsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEM7RUFDQSxRQUFRLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDcEMsUUFBUSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtFQUM5QyxZQUFZLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixZQUFZLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUMvQixZQUFZLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLEdBQUcsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtFQUNyRixnQkFBZ0IsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFB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
