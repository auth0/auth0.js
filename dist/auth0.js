/**
 * auth0-js v9.20.2
 * Author: Auth0
 * Date: 2023-02-28
 * License: MIT
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.auth0 = {}));
}(this, (function (exports) { 'use strict';

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

	var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

	var needsEval = {};

	var TypedArray = typeof Uint8Array === 'undefined' ? undefined$1 : getProto(Uint8Array);

	var INTRINSICS = {
		'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
		'%Array%': Array,
		'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
		'%ArrayIteratorPrototype%': hasSymbols$1 ? getProto([][Symbol.iterator]()) : undefined$1,
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
		'%IteratorPrototype%': hasSymbols$1 ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
		'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
		'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
		'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$1 ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
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
		'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$1 ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
		'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
		'%String%': String,
		'%StringIteratorPrototype%': hasSymbols$1 ? getProto(''[Symbol.iterator]()) : undefined$1,
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

	try {
		null.error; // eslint-disable-line no-unused-expressions
	} catch (e) {
		// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
		var errorProto = getProto(getProto(e));
		INTRINSICS['%Error.prototype%'] = errorProto;
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
			if (gen) {
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

	var semver = getCjsExportFromNamespace(_nodeResolve_empty$1);

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


	var inspectCustom = semver.custom;
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
	            return '{ [' + String(obj) + '] ' + $join.call($concat$1.call('[cause]: ' + inspect(obj.cause), parts), ', ') + ' }';
	        }
	        if (parts.length === 0) { return '[' + String(obj) + ']'; }
	        return '{ [' + String(obj) + '] ' + $join.call(parts, ', ') + ' }';
	    }
	    if (typeof obj === 'object' && customInspect) {
	        if (inspectSymbol && typeof obj[inspectSymbol] === 'function' && semver) {
	            return semver(obj, { depth: maxDepth - depth });
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

	function isArray(obj) { return toStr$1(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
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
	var isArray$1 = Array.isArray;

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

	        if (isArray$1(obj)) {
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

	var merge = function merge(target, source, options) {
	    /* eslint no-param-reassign: 0 */
	    if (!source) {
	        return target;
	    }

	    if (typeof source !== 'object') {
	        if (isArray$1(target)) {
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
	    if (isArray$1(target) && !isArray$1(source)) {
	        mergeTarget = arrayToObject(target, options);
	    }

	    if (isArray$1(target) && isArray$1(source)) {
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
	    if (isArray$1(val)) {
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
	    merge: merge
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

	var isArray$2 = Array.isArray;
	var split = String.prototype.split;
	var push = Array.prototype.push;
	var pushToArray = function (arr, valueOrArray) {
	    push.apply(arr, isArray$2(valueOrArray) ? valueOrArray : [valueOrArray]);
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
	    } else if (generateArrayPrefix === 'comma' && isArray$2(obj)) {
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
	            if (generateArrayPrefix === 'comma' && encodeValuesOnly) {
	                var valuesArray = split.call(String(obj), ',');
	                var valuesJoined = '';
	                for (var i = 0; i < valuesArray.length; ++i) {
	                    valuesJoined += (i === 0 ? '' : ',') + formatter(encoder(valuesArray[i], defaults.encoder, charset, 'value', format));
	                }
	                return [formatter(keyValue) + (commaRoundTrip && isArray$2(obj) && valuesArray.length === 1 ? '[]' : '') + '=' + valuesJoined];
	            }
	            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value', format))];
	        }
	        return [formatter(prefix) + '=' + formatter(String(obj))];
	    }

	    var values = [];

	    if (typeof obj === 'undefined') {
	        return values;
	    }

	    var objKeys;
	    if (generateArrayPrefix === 'comma' && isArray$2(obj)) {
	        // we need to join elements in
	        objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : void undefined }];
	    } else if (isArray$2(filter)) {
	        objKeys = filter;
	    } else {
	        var keys = Object.keys(obj);
	        objKeys = sort ? keys.sort(sort) : keys;
	    }

	    var adjustedPrefix = commaRoundTrip && isArray$2(obj) && obj.length === 1 ? prefix + '[]' : prefix;

	    for (var j = 0; j < objKeys.length; ++j) {
	        var key = objKeys[j];
	        var value = typeof key === 'object' && typeof key.value !== 'undefined' ? key.value : obj[key];

	        if (skipNulls && value === null) {
	            continue;
	        }

	        var keyPrefix = isArray$2(obj)
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
	            encoder,
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
	    if (typeof opts.filter === 'function' || isArray$2(opts.filter)) {
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
	    } else if (isArray$2(options.filter)) {
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
	var isArray$3 = Array.isArray;

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
	    var obj = {};
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
	            val = isArray$3(val) ? [val] : val;
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

	var componentEmitter = createCommonjsModule(function (module) {
	/**
	 * Expose `Emitter`.
	 */

	{
	  module.exports = Emitter;
	}

	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */

	function Emitter(obj) {
	  if (obj) return mixin(obj);
	}
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

	  // Remove event specific arrays for event types that no
	  // one is subscribed for to avoid memory leak.
	  if (callbacks.length === 0) {
	    delete this._callbacks['$' + event];
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

	  var args = new Array(arguments.length - 1)
	    , callbacks = this._callbacks['$' + event];

	  for (var i = 1; i < arguments.length; i++) {
	    args[i - 1] = arguments[i];
	  }

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
	});

	var fastSafeStringify = stringify$1;
	stringify$1.default = stringify$1;
	stringify$1.stable = deterministicStringify;
	stringify$1.stableStringify = deterministicStringify;

	var LIMIT_REPLACE_NODE = '[...]';
	var CIRCULAR_REPLACE_NODE = '[Circular]';

	var arr = [];
	var replacerStack = [];

	function defaultOptions () {
	  return {
	    depthLimit: Number.MAX_SAFE_INTEGER,
	    edgesLimit: Number.MAX_SAFE_INTEGER
	  }
	}

	// Regular stringify
	function stringify$1 (obj, replacer, spacer, options) {
	  if (typeof options === 'undefined') {
	    options = defaultOptions();
	  }

	  decirc(obj, '', 0, [], undefined, 0, options);
	  var res;
	  try {
	    if (replacerStack.length === 0) {
	      res = JSON.stringify(obj, replacer, spacer);
	    } else {
	      res = JSON.stringify(obj, replaceGetterValues(replacer), spacer);
	    }
	  } catch (_) {
	    return JSON.stringify('[unable to serialize, circular reference is too complex to analyze]')
	  } finally {
	    while (arr.length !== 0) {
	      var part = arr.pop();
	      if (part.length === 4) {
	        Object.defineProperty(part[0], part[1], part[3]);
	      } else {
	        part[0][part[1]] = part[2];
	      }
	    }
	  }
	  return res
	}

	function setReplace (replace, val, k, parent) {
	  var propertyDescriptor = Object.getOwnPropertyDescriptor(parent, k);
	  if (propertyDescriptor.get !== undefined) {
	    if (propertyDescriptor.configurable) {
	      Object.defineProperty(parent, k, { value: replace });
	      arr.push([parent, k, val, propertyDescriptor]);
	    } else {
	      replacerStack.push([val, k, replace]);
	    }
	  } else {
	    parent[k] = replace;
	    arr.push([parent, k, val]);
	  }
	}

	function decirc (val, k, edgeIndex, stack, parent, depth, options) {
	  depth += 1;
	  var i;
	  if (typeof val === 'object' && val !== null) {
	    for (i = 0; i < stack.length; i++) {
	      if (stack[i] === val) {
	        setReplace(CIRCULAR_REPLACE_NODE, val, k, parent);
	        return
	      }
	    }

	    if (
	      typeof options.depthLimit !== 'undefined' &&
	      depth > options.depthLimit
	    ) {
	      setReplace(LIMIT_REPLACE_NODE, val, k, parent);
	      return
	    }

	    if (
	      typeof options.edgesLimit !== 'undefined' &&
	      edgeIndex + 1 > options.edgesLimit
	    ) {
	      setReplace(LIMIT_REPLACE_NODE, val, k, parent);
	      return
	    }

	    stack.push(val);
	    // Optimize for Arrays. Big arrays could kill the performance otherwise!
	    if (Array.isArray(val)) {
	      for (i = 0; i < val.length; i++) {
	        decirc(val[i], i, i, stack, val, depth, options);
	      }
	    } else {
	      var keys = Object.keys(val);
	      for (i = 0; i < keys.length; i++) {
	        var key = keys[i];
	        decirc(val[key], key, i, stack, val, depth, options);
	      }
	    }
	    stack.pop();
	  }
	}

	// Stable-stringify
	function compareFunction (a, b) {
	  if (a < b) {
	    return -1
	  }
	  if (a > b) {
	    return 1
	  }
	  return 0
	}

	function deterministicStringify (obj, replacer, spacer, options) {
	  if (typeof options === 'undefined') {
	    options = defaultOptions();
	  }

	  var tmp = deterministicDecirc(obj, '', 0, [], undefined, 0, options) || obj;
	  var res;
	  try {
	    if (replacerStack.length === 0) {
	      res = JSON.stringify(tmp, replacer, spacer);
	    } else {
	      res = JSON.stringify(tmp, replaceGetterValues(replacer), spacer);
	    }
	  } catch (_) {
	    return JSON.stringify('[unable to serialize, circular reference is too complex to analyze]')
	  } finally {
	    // Ensure that we restore the object as it was.
	    while (arr.length !== 0) {
	      var part = arr.pop();
	      if (part.length === 4) {
	        Object.defineProperty(part[0], part[1], part[3]);
	      } else {
	        part[0][part[1]] = part[2];
	      }
	    }
	  }
	  return res
	}

	function deterministicDecirc (val, k, edgeIndex, stack, parent, depth, options) {
	  depth += 1;
	  var i;
	  if (typeof val === 'object' && val !== null) {
	    for (i = 0; i < stack.length; i++) {
	      if (stack[i] === val) {
	        setReplace(CIRCULAR_REPLACE_NODE, val, k, parent);
	        return
	      }
	    }
	    try {
	      if (typeof val.toJSON === 'function') {
	        return
	      }
	    } catch (_) {
	      return
	    }

	    if (
	      typeof options.depthLimit !== 'undefined' &&
	      depth > options.depthLimit
	    ) {
	      setReplace(LIMIT_REPLACE_NODE, val, k, parent);
	      return
	    }

	    if (
	      typeof options.edgesLimit !== 'undefined' &&
	      edgeIndex + 1 > options.edgesLimit
	    ) {
	      setReplace(LIMIT_REPLACE_NODE, val, k, parent);
	      return
	    }

	    stack.push(val);
	    // Optimize for Arrays. Big arrays could kill the performance otherwise!
	    if (Array.isArray(val)) {
	      for (i = 0; i < val.length; i++) {
	        deterministicDecirc(val[i], i, i, stack, val, depth, options);
	      }
	    } else {
	      // Create a temporary object in the required way
	      var tmp = {};
	      var keys = Object.keys(val).sort(compareFunction);
	      for (i = 0; i < keys.length; i++) {
	        var key = keys[i];
	        deterministicDecirc(val[key], key, i, stack, val, depth, options);
	        tmp[key] = val[key];
	      }
	      if (typeof parent !== 'undefined') {
	        arr.push([parent, k, val]);
	        parent[k] = tmp;
	      } else {
	        return tmp
	      }
	    }
	    stack.pop();
	  }
	}

	// wraps replacer function to handle values we couldn't replace
	// and mark them as replaced value
	function replaceGetterValues (replacer) {
	  replacer =
	    typeof replacer !== 'undefined'
	      ? replacer
	      : function (k, v) {
	        return v
	      };
	  return function (key, val) {
	    if (replacerStack.length > 0) {
	      for (var i = 0; i < replacerStack.length; i++) {
	        var part = replacerStack[i];
	        if (part[1] === key && part[0] === val) {
	          val = part[2];
	          replacerStack.splice(i, 1);
	          break
	        }
	      }
	    }
	    return replacer.call(this, key, val)
	  }
	}

	var utils$1 = createCommonjsModule(function (module, exports) {

	function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

	function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

	/**
	 * Return the mime type for the given `str`.
	 *
	 * @param {String} str
	 * @return {String}
	 * @api private
	 */
	exports.type = function (string_) {
	  return string_.split(/ *; */).shift();
	};
	/**
	 * Return header field parameters.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */


	exports.params = function (value) {
	  var object = {};

	  var _iterator = _createForOfIteratorHelper(value.split(/ *; */)),
	      _step;

	  try {
	    for (_iterator.s(); !(_step = _iterator.n()).done;) {
	      var string_ = _step.value;
	      var parts = string_.split(/ *= */);
	      var key = parts.shift();

	      var _value = parts.shift();

	      if (key && _value) object[key] = _value;
	    }
	  } catch (err) {
	    _iterator.e(err);
	  } finally {
	    _iterator.f();
	  }

	  return object;
	};
	/**
	 * Parse Link header fields.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */


	exports.parseLinks = function (value) {
	  var object = {};

	  var _iterator2 = _createForOfIteratorHelper(value.split(/ *, */)),
	      _step2;

	  try {
	    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
	      var string_ = _step2.value;
	      var parts = string_.split(/ *; */);
	      var url = parts[0].slice(1, -1);
	      var rel = parts[1].split(/ *= */)[1].slice(1, -1);
	      object[rel] = url;
	    }
	  } catch (err) {
	    _iterator2.e(err);
	  } finally {
	    _iterator2.f();
	  }

	  return object;
	};
	/**
	 * Strip content related fields from `header`.
	 *
	 * @param {Object} header
	 * @return {Object} header
	 * @api private
	 */


	exports.cleanHeader = function (header, changesOrigin) {
	  delete header['content-type'];
	  delete header['content-length'];
	  delete header['transfer-encoding'];
	  delete header.host; // secuirty

	  if (changesOrigin) {
	    delete header.authorization;
	    delete header.cookie;
	  }

	  return header;
	};
	/**
	 * Check if `obj` is an object.
	 *
	 * @param {Object} object
	 * @return {Boolean}
	 * @api private
	 */


	exports.isObject = function (object) {
	  return object !== null && _typeof(object) === 'object';
	};
	/**
	 * Object.hasOwn fallback/polyfill.
	 *
	 * @type {(object: object, property: string) => boolean} object
	 * @api private
	 */


	exports.hasOwn = Object.hasOwn || function (object, property) {
	  if (object == null) {
	    throw new TypeError('Cannot convert undefined or null to object');
	  }

	  return Object.prototype.hasOwnProperty.call(new Object(object), property);
	};

	exports.mixin = function (target, source) {
	  for (var key in source) {
	    if (exports.hasOwn(source, key)) {
	      target[key] = source[key];
	    }
	  }
	};

	});
	var utils_1 = utils$1.type;
	var utils_2 = utils$1.params;
	var utils_3 = utils$1.parseLinks;
	var utils_4 = utils$1.cleanHeader;
	var utils_5 = utils$1.isObject;
	var utils_6 = utils$1.hasOwn;
	var utils_7 = utils$1.mixin;

	function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }


	/**
	 * Module of mixed-in functions shared between node and client code
	 */


	var isObject = utils$1.isObject,
	    hasOwn$1 = utils$1.hasOwn;
	/**
	 * Expose `RequestBase`.
	 */


	var requestBase = RequestBase;
	/**
	 * Initialize a new `RequestBase`.
	 *
	 * @api public
	 */

	function RequestBase() {}
	/**
	 * Clear previous timeout.
	 *
	 * @return {Request} for chaining
	 * @api public
	 */


	RequestBase.prototype.clearTimeout = function () {
	  clearTimeout(this._timer);
	  clearTimeout(this._responseTimeoutTimer);
	  clearTimeout(this._uploadTimeoutTimer);
	  delete this._timer;
	  delete this._responseTimeoutTimer;
	  delete this._uploadTimeoutTimer;
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


	RequestBase.prototype.parse = function (fn) {
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


	RequestBase.prototype.responseType = function (value) {
	  this._responseType = value;
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


	RequestBase.prototype.serialize = function (fn) {
	  this._serializer = fn;
	  return this;
	};
	/**
	 * Set timeouts.
	 *
	 * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
	 * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
	 * - upload is the time  since last bit of data was sent or received. This timeout works only if deadline timeout is off
	 *
	 * Value of 0 or false means no timeout.
	 *
	 * @param {Number|Object} ms or {response, deadline}
	 * @return {Request} for chaining
	 * @api public
	 */


	RequestBase.prototype.timeout = function (options) {
	  if (!options || _typeof(options) !== 'object') {
	    this._timeout = options;
	    this._responseTimeout = 0;
	    this._uploadTimeout = 0;
	    return this;
	  }

	  for (var option in options) {
	    if (hasOwn$1(options, option)) {
	      switch (option) {
	        case 'deadline':
	          this._timeout = options.deadline;
	          break;

	        case 'response':
	          this._responseTimeout = options.response;
	          break;

	        case 'upload':
	          this._uploadTimeout = options.upload;
	          break;

	        default:
	          console.warn('Unknown timeout option', option);
	      }
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


	RequestBase.prototype.retry = function (count, fn) {
	  // Default to 1 if no count passed or true
	  if (arguments.length === 0 || count === true) count = 1;
	  if (count <= 0) count = 0;
	  this._maxRetries = count;
	  this._retries = 0;
	  this._retryCallback = fn;
	  return this;
	}; //
	// NOTE: we do not include ESOCKETTIMEDOUT because that is from `request` package
	//       <https://github.com/sindresorhus/got/pull/537>
	//
	// NOTE: we do not include EADDRINFO because it was removed from libuv in 2014
	//       <https://github.com/libuv/libuv/commit/02e1ebd40b807be5af46343ea873331b2ee4e9c1>
	//       <https://github.com/request/request/search?q=ESOCKETTIMEDOUT&unscoped_q=ESOCKETTIMEDOUT>
	//
	//
	// TODO: expose these as configurable defaults
	//


	var ERROR_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'EADDRINUSE', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND', 'ENETUNREACH', 'EAI_AGAIN']);
	var STATUS_CODES = new Set([408, 413, 429, 500, 502, 503, 504, 521, 522, 524]); // TODO: we would need to make this easily configurable before adding it in (e.g. some might want to add POST)
	// const METHODS = new Set(['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE']);

	/**
	 * Determine if a request should be retried.
	 * (Inspired by https://github.com/sindresorhus/got#retry)
	 *
	 * @param {Error} err an error
	 * @param {Response} [res] response
	 * @returns {Boolean} if segment should be retried
	 */

	RequestBase.prototype._shouldRetry = function (error, res) {
	  if (!this._maxRetries || this._retries++ >= this._maxRetries) {
	    return false;
	  }

	  if (this._retryCallback) {
	    try {
	      var override = this._retryCallback(error, res);

	      if (override === true) return true;
	      if (override === false) return false; // undefined falls back to defaults
	    } catch (err) {
	      console.error(err);
	    }
	  } // TODO: we would need to make this easily configurable before adding it in (e.g. some might want to add POST)

	  /*
	  if (
	    this.req &&
	    this.req.method &&
	    !METHODS.has(this.req.method.toUpperCase())
	  )
	    return false;
	  */


	  if (res && res.status && STATUS_CODES.has(res.status)) return true;

	  if (error) {
	    if (error.code && ERROR_CODES.has(error.code)) return true; // Superagent timeout

	    if (error.timeout && error.code === 'ECONNABORTED') return true;
	    if (error.crossDomain) return true;
	  }

	  return false;
	};
	/**
	 * Retry request
	 *
	 * @return {Request} for chaining
	 * @api private
	 */


	RequestBase.prototype._retry = function () {
	  this.clearTimeout(); // node

	  if (this.req) {
	    this.req = null;
	    this.req = this.request();
	  }

	  this._aborted = false;
	  this.timedout = false;
	  this.timedoutError = null;
	  return this._end();
	};
	/**
	 * Promise support
	 *
	 * @param {Function} resolve
	 * @param {Function} [reject]
	 * @return {Request}
	 */


	RequestBase.prototype.then = function (resolve, reject) {
	  var _this = this;

	  if (!this._fullfilledPromise) {
	    var self = this;

	    if (this._endCalled) {
	      console.warn('Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises');
	    }

	    this._fullfilledPromise = new Promise(function (resolve, reject) {
	      self.on('abort', function () {
	        if (_this._maxRetries && _this._maxRetries > _this._retries) {
	          return;
	        }

	        if (_this.timedout && _this.timedoutError) {
	          reject(_this.timedoutError);
	          return;
	        }

	        var error = new Error('Aborted');
	        error.code = 'ABORTED';
	        error.status = _this.status;
	        error.method = _this.method;
	        error.url = _this.url;
	        reject(error);
	      });
	      self.end(function (error, res) {
	        if (error) reject(error);else resolve(res);
	      });
	    });
	  }

	  return this._fullfilledPromise.then(resolve, reject);
	};

	RequestBase.prototype.catch = function (callback) {
	  return this.then(undefined, callback);
	};
	/**
	 * Allow for extension
	 */


	RequestBase.prototype.use = function (fn) {
	  fn(this);
	  return this;
	};

	RequestBase.prototype.ok = function (callback) {
	  if (typeof callback !== 'function') throw new Error('Callback required');
	  this._okCallback = callback;
	  return this;
	};

	RequestBase.prototype._isResponseOK = function (res) {
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


	RequestBase.prototype.get = function (field) {
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

	RequestBase.prototype.set = function (field, value) {
	  if (isObject(field)) {
	    for (var key in field) {
	      if (hasOwn$1(field, key)) this.set(key, field[key]);
	    }

	    return this;
	  }

	  this._header[field.toLowerCase()] = value;
	  this.header[field] = value;
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
	 * @param {String} field field name
	 */


	RequestBase.prototype.unset = function (field) {
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
	 * @param {String|Object} name name of field
	 * @param {String|Blob|File|Buffer|fs.ReadStream} val value of field
	 * @param {String} options extra options, e.g. 'blob'
	 * @return {Request} for chaining
	 * @api public
	 */


	RequestBase.prototype.field = function (name, value, options) {
	  // name should be either a string or an object.
	  if (name === null || undefined === name) {
	    throw new Error('.field(name, val) name can not be empty');
	  }

	  if (this._data) {
	    throw new Error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
	  }

	  if (isObject(name)) {
	    for (var key in name) {
	      if (hasOwn$1(name, key)) this.field(key, name[key]);
	    }

	    return this;
	  }

	  if (Array.isArray(value)) {
	    for (var i in value) {
	      if (hasOwn$1(value, i)) this.field(name, value[i]);
	    }

	    return this;
	  } // val should be defined now


	  if (value === null || undefined === value) {
	    throw new Error('.field(name, val) val can not be empty');
	  }

	  if (typeof value === 'boolean') {
	    value = String(value);
	  } //fix https://github.com/visionmedia/superagent/issues/1680


	  if (options) this._getFormData().append(name, value, options);else this._getFormData().append(name, value);
	  return this;
	};
	/**
	 * Abort the request, and clear potential timeout.
	 *
	 * @return {Request} request
	 * @api public
	 */


	RequestBase.prototype.abort = function () {
	  if (this._aborted) {
	    return this;
	  }

	  this._aborted = true;
	  if (this.xhr) this.xhr.abort(); // browser

	  if (this.req) {
	    // Node v13 has major differences in `abort()`
	    // https://github.com/nodejs/node/blob/v12.x/lib/internal/streams/end-of-stream.js
	    // https://github.com/nodejs/node/blob/v13.x/lib/internal/streams/end-of-stream.js
	    // https://github.com/nodejs/node/blob/v14.x/lib/internal/streams/end-of-stream.js
	    // (if you run a diff across these you will see the differences)
	    //
	    // References:
	    // <https://github.com/nodejs/node/issues/31630>
	    // <https://github.com/visionmedia/superagent/pull/1084/commits/dc18679a7c5ccfc6046d882015e5126888973bc8>
	    //
	    // Thanks to @shadowgate15 and @niftylettuce
	    if (semver.gte(process.version, 'v13.0.0') && semver.lt(process.version, 'v14.0.0')) {
	      // Note that the reason this doesn't work is because in v13 as compared to v14
	      // there is no `callback = nop` set in end-of-stream.js above
	      throw new Error('Superagent does not work in v13 properly with abort() due to Node.js core changes');
	    } else if (semver.gte(process.version, 'v14.0.0')) {
	      // We have to manually set `destroyed` to `true` in order for this to work
	      // (see core internals of end-of-stream.js above in v14 branch as compared to v12)
	      this.req.destroyed = true;
	    }

	    this.req.abort(); // node
	  }

	  this.clearTimeout();
	  this.emit('abort');
	  return this;
	};

	RequestBase.prototype._auth = function (user, pass, options, base64Encoder) {
	  switch (options.type) {
	    case 'basic':
	      this.set('Authorization', "Basic ".concat(base64Encoder("".concat(user, ":").concat(pass))));
	      break;

	    case 'auto':
	      this.username = user;
	      this.password = pass;
	      break;

	    case 'bearer':
	      // usage would be .auth(accessToken, { type: 'bearer' })
	      this.set('Authorization', "Bearer ".concat(user));
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


	RequestBase.prototype.withCredentials = function (on) {
	  // This is browser-only functionality. Node side is no-op.
	  if (on === undefined) on = true;
	  this._withCredentials = on;
	  return this;
	};
	/**
	 * Set the max redirects to `n`. Does nothing in browser XHR implementation.
	 *
	 * @param {Number} n
	 * @return {Request} for chaining
	 * @api public
	 */


	RequestBase.prototype.redirects = function (n) {
	  this._maxRedirects = n;
	  return this;
	};
	/**
	 * Maximum size of buffered response body, in bytes. Counts uncompressed size.
	 * Default 200MB.
	 *
	 * @param {Number} n number of bytes
	 * @return {Request} for chaining
	 */


	RequestBase.prototype.maxResponseSize = function (n) {
	  if (typeof n !== 'number') {
	    throw new TypeError('Invalid argument');
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


	RequestBase.prototype.toJSON = function () {
	  return {
	    method: this.method,
	    url: this.url,
	    data: this._data,
	    headers: this._header
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
	// eslint-disable-next-line complexity


	RequestBase.prototype.send = function (data) {
	  var isObject_ = isObject(data);
	  var type = this._header['content-type'];

	  if (this._formData) {
	    throw new Error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
	  }

	  if (isObject_ && !this._data) {
	    if (Array.isArray(data)) {
	      this._data = [];
	    } else if (!this._isHost(data)) {
	      this._data = {};
	    }
	  } else if (data && this._data && this._isHost(this._data)) {
	    throw new Error("Can't merge these send calls");
	  } // merge


	  if (isObject_ && isObject(this._data)) {
	    for (var key in data) {
	      if (hasOwn$1(data, key)) this._data[key] = data[key];
	    }
	  } else if (typeof data === 'string') {
	    // default to x-www-form-urlencoded
	    if (!type) this.type('form');
	    type = this._header['content-type'];
	    if (type) type = type.toLowerCase().trim();

	    if (type === 'application/x-www-form-urlencoded') {
	      this._data = this._data ? "".concat(this._data, "&").concat(data) : data;
	    } else {
	      this._data = (this._data || '') + data;
	    }
	  } else {
	    this._data = data;
	  }

	  if (!isObject_ || this._isHost(data)) {
	    return this;
	  } // default to json


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


	RequestBase.prototype.sortQuery = function (sort) {
	  // _sort default to true but otherwise can be a function or boolean
	  this._sort = typeof sort === 'undefined' ? true : sort;
	  return this;
	};
	/**
	 * Compose querystring to append to req.url
	 *
	 * @api private
	 */


	RequestBase.prototype._finalizeQueryString = function () {
	  var query = this._query.join('&');

	  if (query) {
	    this.url += (this.url.includes('?') ? '&' : '?') + query;
	  }

	  this._query.length = 0; // Makes the call idempotent

	  if (this._sort) {
	    var index = this.url.indexOf('?');

	    if (index >= 0) {
	      var queryArray = this.url.slice(index + 1).split('&');

	      if (typeof this._sort === 'function') {
	        queryArray.sort(this._sort);
	      } else {
	        queryArray.sort();
	      }

	      this.url = this.url.slice(0, index) + '?' + queryArray.join('&');
	    }
	  }
	}; // For backwards compat only


	RequestBase.prototype._appendQueryString = function () {
	  console.warn('Unsupported');
	};
	/**
	 * Invoke callback with timeout error.
	 *
	 * @api private
	 */


	RequestBase.prototype._timeoutError = function (reason, timeout, errno) {
	  if (this._aborted) {
	    return;
	  }

	  var error = new Error("".concat(reason + timeout, "ms exceeded"));
	  error.timeout = timeout;
	  error.code = 'ECONNABORTED';
	  error.errno = errno;
	  this.timedout = true;
	  this.timedoutError = error;
	  this.abort();
	  this.callback(error);
	};

	RequestBase.prototype._setTimeouts = function () {
	  var self = this; // deadline

	  if (this._timeout && !this._timer) {
	    this._timer = setTimeout(function () {
	      self._timeoutError('Timeout of ', self._timeout, 'ETIME');
	    }, this._timeout);
	  } // response timeout


	  if (this._responseTimeout && !this._responseTimeoutTimer) {
	    this._responseTimeoutTimer = setTimeout(function () {
	      self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
	    }, this._responseTimeout);
	  }
	};

	/**
	 * Module dependencies.
	 */

	/**
	 * Expose `ResponseBase`.
	 */


	var responseBase = ResponseBase;
	/**
	 * Initialize a new `ResponseBase`.
	 *
	 * @api public
	 */

	function ResponseBase() {}
	/**
	 * Get case-insensitive `field` value.
	 *
	 * @param {String} field
	 * @return {String}
	 * @api public
	 */


	ResponseBase.prototype.get = function (field) {
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


	ResponseBase.prototype._setHeaderProperties = function (header) {
	  // TODO: moar!
	  // TODO: make this a util
	  // content-type
	  var ct = header['content-type'] || '';
	  this.type = utils$1.type(ct); // params

	  var parameters = utils$1.params(ct);

	  for (var key in parameters) {
	    if (Object.prototype.hasOwnProperty.call(parameters, key)) this[key] = parameters[key];
	  }

	  this.links = {}; // links

	  try {
	    if (header.link) {
	      this.links = utils$1.parseLinks(header.link);
	    }
	  } catch (_unused) {// ignore
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


	ResponseBase.prototype._setStatusProperties = function (status) {
	  var type = Math.trunc(status / 100); // status / class

	  this.statusCode = status;
	  this.status = this.statusCode;
	  this.statusType = type; // basics

	  this.info = type === 1;
	  this.ok = type === 2;
	  this.redirect = type === 3;
	  this.clientError = type === 4;
	  this.serverError = type === 5;
	  this.error = type === 4 || type === 5 ? this.toError() : false; // sugar

	  this.created = status === 201;
	  this.accepted = status === 202;
	  this.noContent = status === 204;
	  this.badRequest = status === 400;
	  this.unauthorized = status === 401;
	  this.notAcceptable = status === 406;
	  this.forbidden = status === 403;
	  this.notFound = status === 404;
	  this.unprocessableEntity = status === 422;
	};

	function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

	function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

	function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

	function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

	function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

	function Agent() {
	  this._defaults = [];
	}

	var _loop = function _loop() {
	  var fn = _arr[_i];

	  // Default setting for all requests from this agent
	  Agent.prototype[fn] = function () {
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    this._defaults.push({
	      fn: fn,
	      args: args
	    });

	    return this;
	  };
	};

	for (var _i = 0, _arr = ['use', 'on', 'once', 'set', 'query', 'type', 'accept', 'auth', 'withCredentials', 'sortQuery', 'retry', 'ok', 'redirects', 'timeout', 'buffer', 'serialize', 'parse', 'ca', 'key', 'pfx', 'cert', 'disableTLSCerts']; _i < _arr.length; _i++) {
	  _loop();
	}

	Agent.prototype._setDefaults = function (request) {
	  var _iterator = _createForOfIteratorHelper(this._defaults),
	      _step;

	  try {
	    for (_iterator.s(); !(_step = _iterator.n()).done;) {
	      var def = _step.value;
	      request[def.fn].apply(request, _toConsumableArray(def.args));
	    }
	  } catch (err) {
	    _iterator.e(err);
	  } finally {
	    _iterator.f();
	  }
	};

	var agentBase = Agent;

	var client = createCommonjsModule(function (module, exports) {

	function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

	function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

	/**
	 * Root reference for iframes.
	 */
	var root;

	if (typeof window !== 'undefined') {
	  // Browser window
	  root = window;
	} else if (typeof self === 'undefined') {
	  // Other environments
	  console.warn('Using browser-only version of superagent in non-browser environment');
	  root = void 0;
	} else {
	  // Web Worker
	  root = self;
	}









	var isObject = utils$1.isObject,
	    mixin = utils$1.mixin,
	    hasOwn = utils$1.hasOwn;




	/**
	 * Noop.
	 */


	function noop() {}
	/**
	 * Expose `request`.
	 */


	module.exports = function (method, url) {
	  // callback
	  if (typeof url === 'function') {
	    return new exports.Request('GET', method).end(url);
	  } // url first


	  if (arguments.length === 1) {
	    return new exports.Request('GET', method);
	  }

	  return new exports.Request(method, url);
	};

	exports = module.exports;
	var request = exports;
	exports.Request = Request;
	/**
	 * Determine XHR.
	 */

	request.getXHR = function () {
	  if (root.XMLHttpRequest && (!root.location || root.location.protocol !== 'file:' || !root.ActiveXObject)) {
	    return new XMLHttpRequest();
	  }

	  try {
	    return new ActiveXObject('Microsoft.XMLHTTP');
	  } catch (_unused) {
	    /**/
	  }

	  try {
	    return new ActiveXObject('Msxml2.XMLHTTP.6.0');
	  } catch (_unused2) {
	    /**/
	  }

	  try {
	    return new ActiveXObject('Msxml2.XMLHTTP.3.0');
	  } catch (_unused3) {
	    /**/
	  }

	  try {
	    return new ActiveXObject('Msxml2.XMLHTTP');
	  } catch (_unused4) {
	    /**/
	  }

	  throw new Error('Browser-only version of superagent could not find XHR');
	};
	/**
	 * Removes leading and trailing whitespace, added to support IE.
	 *
	 * @param {String} s
	 * @return {String}
	 * @api private
	 */


	var trim = ''.trim ? function (s) {
	  return s.trim();
	} : function (s) {
	  return s.replace(/(^\s*|\s*$)/g, '');
	};
	/**
	 * Serialize the given `obj`.
	 *
	 * @param {Object} obj
	 * @return {String}
	 * @api private
	 */

	function serialize(object) {
	  if (!isObject(object)) return object;
	  var pairs = [];

	  for (var key in object) {
	    if (hasOwn(object, key)) pushEncodedKeyValuePair(pairs, key, object[key]);
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


	function pushEncodedKeyValuePair(pairs, key, value) {
	  if (value === undefined) return;

	  if (value === null) {
	    pairs.push(encodeURI(key));
	    return;
	  }

	  if (Array.isArray(value)) {
	    var _iterator = _createForOfIteratorHelper(value),
	        _step;

	    try {
	      for (_iterator.s(); !(_step = _iterator.n()).done;) {
	        var v = _step.value;
	        pushEncodedKeyValuePair(pairs, key, v);
	      }
	    } catch (err) {
	      _iterator.e(err);
	    } finally {
	      _iterator.f();
	    }
	  } else if (isObject(value)) {
	    for (var subkey in value) {
	      if (hasOwn(value, subkey)) pushEncodedKeyValuePair(pairs, "".concat(key, "[").concat(subkey, "]"), value[subkey]);
	    }
	  } else {
	    pairs.push(encodeURI(key) + '=' + encodeURIComponent(value));
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

	function parseString(string_) {
	  var object = {};
	  var pairs = string_.split('&');
	  var pair;
	  var pos;

	  for (var i = 0, length_ = pairs.length; i < length_; ++i) {
	    pair = pairs[i];
	    pos = pair.indexOf('=');

	    if (pos === -1) {
	      object[decodeURIComponent(pair)] = '';
	    } else {
	      object[decodeURIComponent(pair.slice(0, pos))] = decodeURIComponent(pair.slice(pos + 1));
	    }
	  }

	  return object;
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
	  form: 'application/x-www-form-urlencoded',
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
	  'application/x-www-form-urlencoded': lib.stringify,
	  'application/json': fastSafeStringify
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

	function parseHeader(string_) {
	  var lines = string_.split(/\r?\n/);
	  var fields = {};
	  var index;
	  var line;
	  var field;
	  var value;

	  for (var i = 0, length_ = lines.length; i < length_; ++i) {
	    line = lines[i];
	    index = line.indexOf(':');

	    if (index === -1) {
	      // could be empty line, just skip it
	      continue;
	    }

	    field = line.slice(0, index).toLowerCase();
	    value = trim(line.slice(index + 1));
	    fields[field] = value;
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
	  return /[/+]json($|[^-\w])/i.test(mime);
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


	function Response(request_) {
	  this.req = request_;
	  this.xhr = this.req.xhr; // responseText is accessible only if responseType is '' or 'text' and on older browsers

	  this.text = this.req.method !== 'HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text') || typeof this.xhr.responseType === 'undefined' ? this.xhr.responseText : null;
	  this.statusText = this.req.xhr.statusText;
	  var status = this.xhr.status; // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request

	  if (status === 1223) {
	    status = 204;
	  }

	  this._setStatusProperties(status);

	  this.headers = parseHeader(this.xhr.getAllResponseHeaders());
	  this.header = this.headers; // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
	  // getResponseHeader still works. so we get content-type even if getting
	  // other headers fails.

	  this.header['content-type'] = this.xhr.getResponseHeader('content-type');

	  this._setHeaderProperties(this.header);

	  if (this.text === null && request_._responseType) {
	    this.body = this.xhr.response;
	  } else {
	    this.body = this.req.method === 'HEAD' ? null : this._parseBody(this.text ? this.text : this.xhr.response);
	  }
	}

	mixin(Response.prototype, responseBase.prototype);
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

	Response.prototype._parseBody = function (string_) {
	  var parse = request.parse[this.type];

	  if (this.req._parser) {
	    return this.req._parser(this, string_);
	  }

	  if (!parse && isJSON(this.type)) {
	    parse = request.parse['application/json'];
	  }

	  return parse && string_ && (string_.length > 0 || string_ instanceof Object) ? parse(string_) : null;
	};
	/**
	 * Return an `Error` representative of this response.
	 *
	 * @return {Error}
	 * @api public
	 */


	Response.prototype.toError = function () {
	  var req = this.req;
	  var method = req.method;
	  var url = req.url;
	  var message = "cannot ".concat(method, " ").concat(url, " (").concat(this.status, ")");
	  var error = new Error(message);
	  error.status = this.status;
	  error.method = method;
	  error.url = url;
	  return error;
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

	  this.on('end', function () {
	    var error = null;
	    var res = null;

	    try {
	      res = new Response(self);
	    } catch (err) {
	      error = new Error('Parser is unable to parse the response');
	      error.parse = true;
	      error.original = err; // issue #675: return the raw response if the response parsing fails

	      if (self.xhr) {
	        // ie9 doesn't have 'response' property
	        error.rawResponse = typeof self.xhr.responseType === 'undefined' ? self.xhr.responseText : self.xhr.response; // issue #876: return the http status code if the response parsing fails

	        error.status = self.xhr.status ? self.xhr.status : null;
	        error.statusCode = error.status; // backwards-compat only
	      } else {
	        error.rawResponse = null;
	        error.status = null;
	      }

	      return self.callback(error);
	    }

	    self.emit('response', res);
	    var new_error;

	    try {
	      if (!self._isResponseOK(res)) {
	        new_error = new Error(res.statusText || res.text || 'Unsuccessful HTTP response');
	      }
	    } catch (err) {
	      new_error = err; // ok() callback can throw
	    } // #1000 don't catch errors from the callback to avoid double calling it


	    if (new_error) {
	      new_error.original = error;
	      new_error.response = res;
	      new_error.status = res.status;
	      self.callback(new_error, res);
	    } else {
	      self.callback(null, res);
	    }
	  });
	}
	/**
	 * Mixin `Emitter` and `RequestBase`.
	 */
	// eslint-disable-next-line new-cap


	componentEmitter(Request.prototype);
	mixin(Request.prototype, requestBase.prototype);
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

	Request.prototype.type = function (type) {
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


	Request.prototype.accept = function (type) {
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


	Request.prototype.auth = function (user, pass, options) {
	  if (arguments.length === 1) pass = '';

	  if (_typeof(pass) === 'object' && pass !== null) {
	    // pass is optional and can be replaced with options
	    options = pass;
	    pass = '';
	  }

	  if (!options) {
	    options = {
	      type: typeof btoa === 'function' ? 'basic' : 'auto'
	    };
	  }

	  var encoder = options.encoder ? options.encoder : function (string) {
	    if (typeof btoa === 'function') {
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


	Request.prototype.query = function (value) {
	  if (typeof value !== 'string') value = serialize(value);
	  if (value) this._query.push(value);
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


	Request.prototype.attach = function (field, file, options) {
	  if (file) {
	    if (this._data) {
	      throw new Error("superagent can't mix .send() and .attach()");
	    }

	    this._getFormData().append(field, file, options || file.name);
	  }

	  return this;
	};

	Request.prototype._getFormData = function () {
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


	Request.prototype.callback = function (error, res) {
	  if (this._shouldRetry(error, res)) {
	    return this._retry();
	  }

	  var fn = this._callback;
	  this.clearTimeout();

	  if (error) {
	    if (this._maxRetries) error.retries = this._retries - 1;
	    this.emit('error', error);
	  }

	  fn(error, res);
	};
	/**
	 * Invoke callback with x-domain error.
	 *
	 * @api private
	 */


	Request.prototype.crossDomainError = function () {
	  var error = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
	  error.crossDomain = true;
	  error.status = this.status;
	  error.method = this.method;
	  error.url = this.url;
	  this.callback(error);
	}; // This only warns, because the request is still likely to work


	Request.prototype.agent = function () {
	  console.warn('This is not supported in browser version of superagent');
	  return this;
	};

	Request.prototype.ca = Request.prototype.agent;
	Request.prototype.buffer = Request.prototype.ca; // This throws, because it can't send/receive data as expected

	Request.prototype.write = function () {
	  throw new Error('Streaming is not supported in browser version of superagent');
	};

	Request.prototype.pipe = Request.prototype.write;
	/**
	 * Check if `obj` is a host object,
	 * we don't want to serialize these :)
	 *
	 * @param {Object} obj host object
	 * @return {Boolean} is a host object
	 * @api private
	 */

	Request.prototype._isHost = function (object) {
	  // Native objects stringify to [object File], [object Blob], [object FormData], etc.
	  return object && _typeof(object) === 'object' && !Array.isArray(object) && Object.prototype.toString.call(object) !== '[object Object]';
	};
	/**
	 * Initiate request, invoking callback `fn(res)`
	 * with an instanceof `Response`.
	 *
	 * @param {Function} fn
	 * @return {Request} for chaining
	 * @api public
	 */


	Request.prototype.end = function (fn) {
	  if (this._endCalled) {
	    console.warn('Warning: .end() was called twice. This is not supported in superagent');
	  }

	  this._endCalled = true; // store callback

	  this._callback = fn || noop; // querystring

	  this._finalizeQueryString();

	  this._end();
	};

	Request.prototype._setUploadTimeout = function () {
	  var self = this; // upload timeout it's wokrs only if deadline timeout is off

	  if (this._uploadTimeout && !this._uploadTimeoutTimer) {
	    this._uploadTimeoutTimer = setTimeout(function () {
	      self._timeoutError('Upload timeout of ', self._uploadTimeout, 'ETIMEDOUT');
	    }, this._uploadTimeout);
	  }
	}; // eslint-disable-next-line complexity


	Request.prototype._end = function () {
	  if (this._aborted) return this.callback(new Error('The request has been aborted even before .end() was called'));
	  var self = this;
	  this.xhr = request.getXHR();
	  var xhr = this.xhr;
	  var data = this._formData || this._data;

	  this._setTimeouts(); // state change


	  xhr.addEventListener('readystatechange', function () {
	    var readyState = xhr.readyState;

	    if (readyState >= 2 && self._responseTimeoutTimer) {
	      clearTimeout(self._responseTimeoutTimer);
	    }

	    if (readyState !== 4) {
	      return;
	    } // In IE9, reads to any property (e.g. status) off of an aborted XHR will
	    // result in the error "Could not complete the operation due to error c00c023f"


	    var status;

	    try {
	      status = xhr.status;
	    } catch (_unused5) {
	      status = 0;
	    }

	    if (!status) {
	      if (self.timedout || self._aborted) return;
	      return self.crossDomainError();
	    }

	    self.emit('end');
	  }); // progress

	  var handleProgress = function handleProgress(direction, e) {
	    if (e.total > 0) {
	      e.percent = e.loaded / e.total * 100;

	      if (e.percent === 100) {
	        clearTimeout(self._uploadTimeoutTimer);
	      }
	    }

	    e.direction = direction;
	    self.emit('progress', e);
	  };

	  if (this.hasListeners('progress')) {
	    try {
	      xhr.addEventListener('progress', handleProgress.bind(null, 'download'));

	      if (xhr.upload) {
	        xhr.upload.addEventListener('progress', handleProgress.bind(null, 'upload'));
	      }
	    } catch (_unused6) {// Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
	      // Reported here:
	      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
	    }
	  }

	  if (xhr.upload) {
	    this._setUploadTimeout();
	  } // initiate request


	  try {
	    if (this.username && this.password) {
	      xhr.open(this.method, this.url, true, this.username, this.password);
	    } else {
	      xhr.open(this.method, this.url, true);
	    }
	  } catch (err) {
	    // see #1149
	    return this.callback(err);
	  } // CORS


	  if (this._withCredentials) xhr.withCredentials = true; // body

	  if (!this._formData && this.method !== 'GET' && this.method !== 'HEAD' && typeof data !== 'string' && !this._isHost(data)) {
	    // serialize stuff
	    var contentType = this._header['content-type'];

	    var _serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];

	    if (!_serialize && isJSON(contentType)) {
	      _serialize = request.serialize['application/json'];
	    }

	    if (_serialize) data = _serialize(data);
	  } // set header fields


	  for (var field in this.header) {
	    if (this.header[field] === null) continue;
	    if (hasOwn(this.header, field)) xhr.setRequestHeader(field, this.header[field]);
	  }

	  if (this._responseType) {
	    xhr.responseType = this._responseType;
	  } // send stuff


	  this.emit('request', this); // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
	  // We need null here if data is undefined

	  xhr.send(typeof data === 'undefined' ? null : data);
	};

	request.agent = function () {
	  return new agentBase();
	};

	var _loop = function _loop() {
	  var method = _arr[_i];

	  agentBase.prototype[method.toLowerCase()] = function (url, fn) {
	    var request_ = new request.Request(method, url);

	    this._setDefaults(request_);

	    if (fn) {
	      request_.end(fn);
	    }

	    return request_;
	  };
	};

	for (var _i = 0, _arr = ['GET', 'POST', 'OPTIONS', 'PATCH', 'PUT', 'DELETE']; _i < _arr.length; _i++) {
	  _loop();
	}

	agentBase.prototype.del = agentBase.prototype.delete;
	/**
	 * GET `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} [data] or fn
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */

	request.get = function (url, data, fn) {
	  var request_ = request('GET', url);

	  if (typeof data === 'function') {
	    fn = data;
	    data = null;
	  }

	  if (data) request_.query(data);
	  if (fn) request_.end(fn);
	  return request_;
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


	request.head = function (url, data, fn) {
	  var request_ = request('HEAD', url);

	  if (typeof data === 'function') {
	    fn = data;
	    data = null;
	  }

	  if (data) request_.query(data);
	  if (fn) request_.end(fn);
	  return request_;
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


	request.options = function (url, data, fn) {
	  var request_ = request('OPTIONS', url);

	  if (typeof data === 'function') {
	    fn = data;
	    data = null;
	  }

	  if (data) request_.send(data);
	  if (fn) request_.end(fn);
	  return request_;
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
	  var request_ = request('DELETE', url);

	  if (typeof data === 'function') {
	    fn = data;
	    data = null;
	  }

	  if (data) request_.send(data);
	  if (fn) request_.end(fn);
	  return request_;
	}

	request.del = del;
	request.delete = del;
	/**
	 * PATCH `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed} [data]
	 * @param {Function} [fn]
	 * @return {Request}
	 * @api public
	 */

	request.patch = function (url, data, fn) {
	  var request_ = request('PATCH', url);

	  if (typeof data === 'function') {
	    fn = data;
	    data = null;
	  }

	  if (data) request_.send(data);
	  if (fn) request_.end(fn);
	  return request_;
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


	request.post = function (url, data, fn) {
	  var request_ = request('POST', url);

	  if (typeof data === 'function') {
	    fn = data;
	    data = null;
	  }

	  if (data) request_.send(data);
	  if (fn) request_.end(fn);
	  return request_;
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


	request.put = function (url, data, fn) {
	  var request_ = request('PUT', url);

	  if (typeof data === 'function') {
	    fn = data;
	    data = null;
	  }

	  if (data) request_.send(data);
	  if (fn) request_.end(fn);
	  return request_;
	};

	});
	var client_1 = client.Request;

	var byteLength_1 = byteLength;
	var toByteArray_1 = toByteArray;
	var fromByteArray_1 = fromByteArray;

	var lookup = [];
	var revLookup = [];
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	for (var i = 0, len = code.length; i < len; ++i) {
	  lookup[i] = code[i];
	  revLookup[code.charCodeAt(i)] = i;
	}

	// Support decoding URL-safe base64 strings, as Node.js does.
	// See: https://en.wikipedia.org/wiki/Base64#URL_applications
	revLookup['-'.charCodeAt(0)] = 62;
	revLookup['_'.charCodeAt(0)] = 63;

	function getLens (b64) {
	  var len = b64.length;

	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // Trim off extra bytes after placeholder bytes are found
	  // See: https://github.com/beatgammit/base64-js/issues/42
	  var validLen = b64.indexOf('=');
	  if (validLen === -1) validLen = len;

	  var placeHoldersLen = validLen === len
	    ? 0
	    : 4 - (validLen % 4);

	  return [validLen, placeHoldersLen]
	}

	// base64 is 4/3 + up to two characters of the original data
	function byteLength (b64) {
	  var lens = getLens(b64);
	  var validLen = lens[0];
	  var placeHoldersLen = lens[1];
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function _byteLength (b64, validLen, placeHoldersLen) {
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function toByteArray (b64) {
	  var tmp;
	  var lens = getLens(b64);
	  var validLen = lens[0];
	  var placeHoldersLen = lens[1];

	  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));

	  var curByte = 0;

	  // if there are placeholders, only get up to the last complete 4 chars
	  var len = placeHoldersLen > 0
	    ? validLen - 4
	    : validLen;

	  var i;
	  for (i = 0; i < len; i += 4) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 18) |
	      (revLookup[b64.charCodeAt(i + 1)] << 12) |
	      (revLookup[b64.charCodeAt(i + 2)] << 6) |
	      revLookup[b64.charCodeAt(i + 3)];
	    arr[curByte++] = (tmp >> 16) & 0xFF;
	    arr[curByte++] = (tmp >> 8) & 0xFF;
	    arr[curByte++] = tmp & 0xFF;
	  }

	  if (placeHoldersLen === 2) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 2) |
	      (revLookup[b64.charCodeAt(i + 1)] >> 4);
	    arr[curByte++] = tmp & 0xFF;
	  }

	  if (placeHoldersLen === 1) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 10) |
	      (revLookup[b64.charCodeAt(i + 1)] << 4) |
	      (revLookup[b64.charCodeAt(i + 2)] >> 2);
	    arr[curByte++] = (tmp >> 8) & 0xFF;
	    arr[curByte++] = tmp & 0xFF;
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] +
	    lookup[num >> 12 & 0x3F] +
	    lookup[num >> 6 & 0x3F] +
	    lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp;
	  var output = [];
	  for (var i = start; i < end; i += 3) {
	    tmp =
	      ((uint8[i] << 16) & 0xFF0000) +
	      ((uint8[i + 1] << 8) & 0xFF00) +
	      (uint8[i + 2] & 0xFF);
	    output.push(tripletToBase64(tmp));
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  var tmp;
	  var len = uint8.length;
	  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
	  var parts = [];
	  var maxChunkLength = 16383; // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1];
	    parts.push(
	      lookup[tmp >> 2] +
	      lookup[(tmp << 4) & 0x3F] +
	      '=='
	    );
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
	    parts.push(
	      lookup[tmp >> 10] +
	      lookup[(tmp >> 4) & 0x3F] +
	      lookup[(tmp << 2) & 0x3F] +
	      '='
	    );
	  }

	  return parts.join('')
	}

	var base64Js = {
		byteLength: byteLength_1,
		toByteArray: toByteArray_1,
		fromByteArray: fromByteArray_1
	};

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

	function encode$1(str) {
	  return base64Js
	    .fromByteArray(stringToByteArray(str))
	    .replace(/\+/g, '-') // Convert '+' to '-'
	    .replace(/\//g, '_'); // Convert '/' to '_'
	}

	function decode$1(str) {
	  str = padding(str)
	    .replace(/-/g, '+') // Convert '-' to '+'
	    .replace(/_/g, '/'); // Convert '_' to '/'

	  return byteArrayToString(base64Js.toByteArray(str));
	}

	var base64Url = {
	  encode: encode$1,
	  decode: decode$1
	};

	var version = { raw: '9.20.2' };

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
	function isArray$4(array) {
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
	  isArray: isArray$4,
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

	function merge$1(object, keys) {
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
	  merge: merge$1,
	  pick: pick,
	  getKeysNotIn: getKeysNotIn,
	  extend: extend,
	  getOriginFromUrl: getOriginFromUrl,
	  getLocationFromUrl: getLocationFromUrl,
	  trimUserDetails: trimUserDetails,
	  updatePropertyOn: updatePropertyOn
	};

	/* eslint-disable no-param-reassign */

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
	  this.request = this.request.send(objectHelper.trimUserDetails(body));
	  return this;
	};

	RequestObj.prototype.withCredentials = function() {
	  this.request = this.request.withCredentials();
	  return this;
	};

	RequestObj.prototype.end = function(cb) {
	  this.request.end(cb);
	  return new RequestWrapper(this.request);
	};

	// ------------------------------------------------ RequestBuilder

	function RequestBuilder(options) {
	  this._sendTelemetry =
	    options._sendTelemetry === false ? options._sendTelemetry : true;
	  this._telemetryInfo = options._telemetryInfo || null;
	  this._timesToRetryFailedRequests = options._timesToRetryFailedRequests;
	  this.headers = options.headers || {};
	  this._universalLoginPage = options.universalLoginPage;
	}

	RequestBuilder.prototype.setCommonConfiguration = function(
	  ongoingRequest,
	  options
	) {
	  options = options || {};

	  if (this._timesToRetryFailedRequests > 0) {
	    ongoingRequest = ongoingRequest.retry(this._timesToRetryFailedRequests);
	  }

	  if (options.noHeaders) {
	    return ongoingRequest;
	  }

	  var headers = this.headers;
	  ongoingRequest = ongoingRequest.set('Content-Type', 'application/json');

	  if (options.xRequestLanguage) {
	    ongoingRequest = ongoingRequest.set(
	      'X-Request-Language',
	      options.xRequestLanguage
	    );
	  }

	  var keys = Object.keys(this.headers);

	  for (var a = 0; a < keys.length; a++) {
	    ongoingRequest = ongoingRequest.set(keys[a], headers[keys[a]]);
	  }

	  if (this._sendTelemetry) {
	    ongoingRequest = ongoingRequest.set(
	      'Auth0-Client',
	      this.getTelemetryData()
	    );
	  }

	  return ongoingRequest;
	};

	RequestBuilder.prototype.getTelemetryData = function() {
	  var telemetryName = this._universalLoginPage ? 'auth0.js-ulp' : 'auth0.js';
	  var clientInfo = { name: telemetryName, version: version.raw };
	  if (this._telemetryInfo) {
	    clientInfo = objectHelper.extend({}, this._telemetryInfo);
	    clientInfo.env = objectHelper.extend({}, this._telemetryInfo.env);
	    clientInfo.env[telemetryName] = version.raw;
	  }
	  var jsonClientInfo = JSON.stringify(clientInfo);
	  return base64Url.encode(jsonClientInfo);
	};

	RequestBuilder.prototype.get = function(url, options) {
	  return new RequestObj(this.setCommonConfiguration(client.get(url), options));
	};

	RequestBuilder.prototype.post = function(url, options) {
	  return new RequestObj(
	    this.setCommonConfiguration(client.post(url), options)
	  );
	};

	RequestBuilder.prototype.patch = function(url, options) {
	  return new RequestObj(
	    this.setCommonConfiguration(client.patch(url), options)
	  );
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

	var windowHelper = {
	  redirect: redirect,
	  getDocument: getDocument,
	  getWindow: getWindow,
	  getOrigin: getOrigin
	};

	function DummyStorage() {}

	DummyStorage.prototype.getItem = function() {
	  return null;
	};

	DummyStorage.prototype.removeItem = function() {};

	DummyStorage.prototype.setItem = function() {};

	var js_cookie = createCommonjsModule(function (module, exports) {
	(function (factory) {
		var registeredInModuleLoader;
		{
			module.exports = factory();
			registeredInModuleLoader = true;
		}
		if (!registeredInModuleLoader) {
			var OldCookies = window.Cookies;
			var api = window.Cookies = factory();
			api.noConflict = function () {
				window.Cookies = OldCookies;
				return api;
			};
		}
	}(function () {
		function extend () {
			var i = 0;
			var result = {};
			for (; i < arguments.length; i++) {
				var attributes = arguments[ i ];
				for (var key in attributes) {
					result[key] = attributes[key];
				}
			}
			return result;
		}

		function decode (s) {
			return s.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
		}

		function init (converter) {
			function api() {}

			function set (key, value, attributes) {
				if (typeof document === 'undefined') {
					return;
				}

				attributes = extend({
					path: '/'
				}, api.defaults, attributes);

				if (typeof attributes.expires === 'number') {
					attributes.expires = new Date(new Date() * 1 + attributes.expires * 864e+5);
				}

				// We're using "expires" because "max-age" is not supported by IE
				attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

				try {
					var result = JSON.stringify(value);
					if (/^[\{\[]/.test(result)) {
						value = result;
					}
				} catch (e) {}

				value = converter.write ?
					converter.write(value, key) :
					encodeURIComponent(String(value))
						.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);

				key = encodeURIComponent(String(key))
					.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent)
					.replace(/[\(\)]/g, escape);

				var stringifiedAttributes = '';
				for (var attributeName in attributes) {
					if (!attributes[attributeName]) {
						continue;
					}
					stringifiedAttributes += '; ' + attributeName;
					if (attributes[attributeName] === true) {
						continue;
					}

					// Considers RFC 6265 section 5.2:
					// ...
					// 3.  If the remaining unparsed-attributes contains a %x3B (";")
					//     character:
					// Consume the characters of the unparsed-attributes up to,
					// not including, the first %x3B (";") character.
					// ...
					stringifiedAttributes += '=' + attributes[attributeName].split(';')[0];
				}

				return (document.cookie = key + '=' + value + stringifiedAttributes);
			}

			function get (key, json) {
				if (typeof document === 'undefined') {
					return;
				}

				var jar = {};
				// To prevent the for loop in the first place assign an empty array
				// in case there are no cookies at all.
				var cookies = document.cookie ? document.cookie.split('; ') : [];
				var i = 0;

				for (; i < cookies.length; i++) {
					var parts = cookies[i].split('=');
					var cookie = parts.slice(1).join('=');

					if (!json && cookie.charAt(0) === '"') {
						cookie = cookie.slice(1, -1);
					}

					try {
						var name = decode(parts[0]);
						cookie = (converter.read || converter)(cookie, name) ||
							decode(cookie);

						if (json) {
							try {
								cookie = JSON.parse(cookie);
							} catch (e) {}
						}

						jar[name] = cookie;

						if (key === name) {
							break;
						}
					} catch (e) {}
				}

				return key ? jar[key] : jar;
			}

			api.set = set;
			api.get = function (key) {
				return get(key, false /* read as raw */);
			};
			api.getJSON = function (key) {
				return get(key, true /* read as json */);
			};
			api.remove = function (key, attributes) {
				set(key, '', extend(attributes, {
					expires: -1
				}));
			};

			api.defaults = {};

			api.withConverter = init;

			return api;
		}

		return init(function () {});
	}));
	});

	function buildCompatCookieKey(key) {
	  return '_' + key + '_compat';
	}

	function CookieStorage(options) {
	  this._options = options || {};
	}

	CookieStorage.prototype.getItem = function (key) {
	  var cookie = js_cookie.get(key);

	  return cookie || js_cookie.get(buildCompatCookieKey(key));
	};

	CookieStorage.prototype.removeItem = function (key) {
	  js_cookie.remove(key);
	  js_cookie.remove(buildCompatCookieKey(key));
	};

	CookieStorage.prototype.setItem = function (key, value, options) {
	  var params = objectHelper.extend(
	    {
	      expires: 1 // 1 day
	    },
	    options
	  );

	  if (windowHelper.getWindow().location.protocol === 'https:') {
	    params.secure = true;
	    params.sameSite = 'none';

	    if (this._options.legacySameSiteCookie) {
	      // Save a compatibility cookie without sameSite='none' for browsers that don't support it.
	      var legacyOptions = objectHelper.blacklist(params, ['sameSite']);
	      js_cookie.set(buildCompatCookieKey(key), value, legacyOptions);
	    }
	  }

	  js_cookie.set(key, value, params);
	};

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

	function StorageHandler(options) {
	  this.warn = new Warn({});
	  this.storage = new CookieStorage(options);

	  if (options.__tryLocalStorageFirst !== true) {
	    return;
	  }

	  try {
	    // some browsers throw an error when trying to access localStorage
	    // when localStorage is disabled.
	    var localStorage = windowHelper.getWindow().localStorage;
	    if (localStorage) {
	      this.storage = localStorage;
	    }
	  } catch (e) {
	    this.warn.warning(e);
	    this.warn.warning("Can't use localStorage. Using CookieStorage instead.");
	  }
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

	StorageHandler.prototype.setItem = function (key, value, options) {
	  try {
	    return this.storage.setItem(key, value, options);
	  } catch (e) {
	    this.warn.warning(e);
	    this.failover();
	    return this.setItem(key, value, options);
	  }
	};

	function Storage(options) {
	  this.handler = new StorageHandler(options);
	}

	Storage.prototype.getItem = function(key) {
	  var value = this.handler.getItem(key);
	  try {
	    return JSON.parse(value);
	  } catch (_) {
	    return value;
	  }
	};
	Storage.prototype.removeItem = function(key) {
	  return this.handler.removeItem(key);
	};
	Storage.prototype.setItem = function(key, value, options) {
	  var json = JSON.stringify(value);
	  return this.handler.setItem(key, json, options);
	};

	function SSODataStorage(options) {
	  this.storage = new Storage(options);
	}

	SSODataStorage.prototype.set = function(connection, sub) {
	  var ssodata = {
	    lastUsedConnection: connection,
	    lastUsedSub: sub
	  };
	  this.storage.setItem('auth0.ssodata', JSON.stringify(ssodata));
	};
	SSODataStorage.prototype.get = function() {
	  var ssodata = this.storage.getItem('auth0.ssodata');
	  if (!ssodata) {
	    return;
	  }
	  return JSON.parse(ssodata);
	};

	function buildResponse(error, description) {
	  return {
	    error: error,
	    errorDescription: description
	  };
	}

	function invalidToken(description) {
	  return buildResponse('invalid_token', description);
	}

	var error = {
	  buildResponse: buildResponse,
	  invalidToken: invalidToken
	};

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

	      objectHelper.updatePropertyOn(
	        errObj,
	        'original.response.req._data.password',
	        '*****'
	      );

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

	      errObj.code =
	        err.code || err.error || err.error_code || err.status || null;

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

	      if (err.error_codes && err.error_details) {
	        errObj.errorDetails = {
	          codes: err.error_codes,
	          details: err.error_details
	        };
	      }

	      if (err.name) {
	        errObj.name = err.name;
	      }

	      if (err.policy) {
	        errObj.policy = err.policy;
	      }

	      return cb(errObj);
	    }

	    if (
	      data.type &&
	      (data.type === 'text/html' || data.type === 'text/plain')
	    ) {
	      return cb(null, data.text);
	    }

	    if (options.ignoreCasing) {
	      return cb(null, data.body || data);
	    }

	    return cb(
	      null,
	      objectHelper.toCamelCase(data.body || data, [], {
	        keepOriginal: options.keepOriginalCasing
	      })
	    );
	  };
	}

	// For future reference:,

	var tokenParams = [
	  // auth0
	  'realm',
	  'audience',
	  'otp',
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
	  'organization',
	  'invitation',

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
	  'screen_hint',
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
	  'code_challenge_method',

	  // ADDITIONAL_PARAMETERS:
	  // https://auth0.com/docs/api/authentication?javascript#social
	  'access_type',
	  'display'
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

	var parametersWhitelist = {
	  oauthTokenParams: oauthTokenParams,
	  oauthAuthorizeParams: oauthAuthorizeParams
	};

	var t="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function e(t){var e={exports:{}};return t(e,e.exports),e.exports}var r=e(function(e,r){e.exports=function(){function e(t){return "function"==typeof t}var r=Array.isArray?Array.isArray:function(t){return "[object Array]"===Object.prototype.toString.call(t)},i=0,n=void 0,o=void 0,s=function(t,e){l[i]=t,l[i+1]=e,2===(i+=2)&&(o?o(d):w());},h="undefined"!=typeof window?window:void 0,u=h||{},a=u.MutationObserver||u.WebKitMutationObserver,f="undefined"==typeof self&&"undefined"!=typeof process&&"[object process]"==={}.toString.call(process),c="undefined"!=typeof Uint8ClampedArray&&"undefined"!=typeof importScripts&&"undefined"!=typeof MessageChannel;function p(){var t=setTimeout;return function(){return t(d,1)}}var l=new Array(1e3);function d(){for(var t=0;t<i;t+=2)(0, l[t])(l[t+1]),l[t]=void 0,l[t+1]=void 0;i=0;}var m,v,y,g,w=void 0;function T(t,e){var r=this,i=new this.constructor(S);void 0===i[_]&&O(i);var n=r._state;if(n){var o=arguments[n-1];s(function(){return C(n,i,o,r._result)});}else I(r,i,t,e);return i}function b(t){if(t&&"object"==typeof t&&t.constructor===this)return t;var e=new this(S);return B(e,t),e}w=f?function(){return process.nextTick(d)}:a?(v=0,y=new a(d),g=document.createTextNode(""),y.observe(g,{characterData:!0}),function(){g.data=v=++v%2;}):c?((m=new MessageChannel).port1.onmessage=d,function(){return m.port2.postMessage(0)}):void 0===h?function(){try{var t=Function("return this")().require("vertx");return void 0!==(n=t.runOnLoop||t.runOnContext)?function(){n(d);}:p()}catch(t){return p()}}():p();var _=Math.random().toString(36).substring(2);function S(){}var A=void 0;function D(t,r,i){r.constructor===t.constructor&&i===T&&r.constructor.resolve===b?function(t,e){1===e._state?E(t,e._result):2===e._state?k(t,e._result):I(e,void 0,function(e){return B(t,e)},function(e){return k(t,e)});}(t,r):void 0===i?E(t,r):e(i)?function(t,e,r){s(function(t){var i=!1,n=function(r,n,o,s){try{r.call(n,function(r){i||(i=!0,e!==r?B(t,r):E(t,r));},function(e){i||(i=!0,k(t,e));});}catch(t){return t}}(r,e);!i&&n&&(i=!0,k(t,n));},t);}(t,r,i):E(t,r);}function B(t,e){if(t===e)k(t,new TypeError("You cannot resolve a promise with itself"));else if(n=typeof(i=e),null===i||"object"!==n&&"function"!==n)E(t,e);else {var r=void 0;try{r=e.then;}catch(e){return void k(t,e)}D(t,e,r);}var i,n;}function x(t){t._onerror&&t._onerror(t._result),M(t);}function E(t,e){t._state===A&&(t._result=e,t._state=1,0!==t._subscribers.length&&s(M,t));}function k(t,e){t._state===A&&(t._state=2,t._result=e,s(x,t));}function I(t,e,r,i){var n=t._subscribers,o=n.length;t._onerror=null,n[o]=e,n[o+1]=r,n[o+2]=i,0===o&&t._state&&s(M,t);}function M(t){var e=t._subscribers,r=t._state;if(0!==e.length){for(var i=void 0,n=void 0,o=t._result,s=0;s<e.length;s+=3)n=e[s+r],(i=e[s])?C(r,i,n,o):n(o);t._subscribers.length=0;}}function C(t,r,i,n){var o=e(i),s=void 0,h=void 0,u=!0;if(o){try{s=i(n);}catch(t){u=!1,h=t;}if(r===s)return void k(r,new TypeError("A promises callback cannot return that same promise."))}else s=n;r._state!==A||(o&&u?B(r,s):!1===u?k(r,h):1===t?E(r,s):2===t&&k(r,s));}var R=0;function O(t){t[_]=R++,t._state=void 0,t._result=void 0,t._subscribers=[];}var j=function(){function t(t,e){this._instanceConstructor=t,this.promise=new t(S),this.promise[_]||O(this.promise),r(e)?(this.length=e.length,this._remaining=e.length,this._result=new Array(this.length),0===this.length?E(this.promise,this._result):(this.length=this.length||0,this._enumerate(e),0===this._remaining&&E(this.promise,this._result))):k(this.promise,new Error("Array Methods must be provided an Array"));}return t.prototype._enumerate=function(t){for(var e=0;this._state===A&&e<t.length;e++)this._eachEntry(t[e],e);},t.prototype._eachEntry=function(t,e){var r=this._instanceConstructor,i=r.resolve;if(i===b){var n=void 0,o=void 0,s=!1;try{n=t.then;}catch(t){s=!0,o=t;}if(n===T&&t._state!==A)this._settledAt(t._state,e,t._result);else if("function"!=typeof n)this._remaining--,this._result[e]=t;else if(r===N){var h=new r(S);s?k(h,o):D(h,t,n),this._willSettleAt(h,e);}else this._willSettleAt(new r(function(e){return e(t)}),e);}else this._willSettleAt(i(t),e);},t.prototype._settledAt=function(t,e,r){var i=this.promise;i._state===A&&(this._remaining--,2===t?k(i,r):this._result[e]=r),0===this._remaining&&E(i,this._result);},t.prototype._willSettleAt=function(t,e){var r=this;I(t,void 0,function(t){return r._settledAt(1,e,t)},function(t){return r._settledAt(2,e,t)});},t}(),N=function(){function t(e){this[_]=R++,this._result=this._state=void 0,this._subscribers=[],S!==e&&("function"!=typeof e&&function(){throw new TypeError("You must pass a resolver function as the first argument to the promise constructor")}(),this instanceof t?function(t,e){try{e(function(e){B(t,e);},function(e){k(t,e);});}catch(e){k(t,e);}}(this,e):function(){throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")}());}return t.prototype.catch=function(t){return this.then(null,t)},t.prototype.finally=function(t){var r=this,i=r.constructor;return e(t)?r.then(function(e){return i.resolve(t()).then(function(){return e})},function(e){return i.resolve(t()).then(function(){throw e})}):r.then(t,t)},t}();return N.prototype.then=T,N.all=function(t){return new j(this,t).promise},N.race=function(t){var e=this;return r(t)?new e(function(r,i){for(var n=t.length,o=0;o<n;o++)e.resolve(t[o]).then(r,i);}):new e(function(t,e){return e(new TypeError("You must pass an array to race."))})},N.resolve=b,N.reject=function(t){var e=new this(S);return k(e,t),e},N._setScheduler=function(t){o=t;},N._setAsap=function(t){s=t;},N._asap=s,N.polyfill=function(){var e=void 0;if(void 0!==t)e=t;else if("undefined"!=typeof self)e=self;else try{e=Function("return this")();}catch(t){throw new Error("polyfill failed because global object is unavailable in this environment")}var r=e.Promise;if(r){var i=null;try{i=Object.prototype.toString.call(r.resolve());}catch(t){}if("[object Promise]"===i&&!r.cast)return}e.Promise=N;},N.Promise=N,N}();}),i$1={__proto__:null,default:{}},n=e(function(e,r){var n;e.exports=(n=n||function(e,r){var n;if("undefined"!=typeof window&&window.crypto&&(n=window.crypto),"undefined"!=typeof self&&self.crypto&&(n=self.crypto),"undefined"!=typeof globalThis&&globalThis.crypto&&(n=globalThis.crypto),!n&&"undefined"!=typeof window&&window.msCrypto&&(n=window.msCrypto),!n&&void 0!==t&&t.crypto&&(n=t.crypto),!n)try{n=i$1;}catch(t){}var o=function(){if(n){if("function"==typeof n.getRandomValues)try{return n.getRandomValues(new Uint32Array(1))[0]}catch(t){}if("function"==typeof n.randomBytes)try{return n.randomBytes(4).readInt32LE()}catch(t){}}throw new Error("Native crypto module could not be used to get secure random number.")},s=Object.create||function(){function t(){}return function(e){var r;return t.prototype=e,r=new t,t.prototype=null,r}}(),h={},u=h.lib={},a=u.Base={extend:function(t){var e=s(this);return t&&e.mixIn(t),e.hasOwnProperty("init")&&this.init!==e.init||(e.init=function(){e.$super.init.apply(this,arguments);}),e.init.prototype=e,e.$super=this,e},create:function(){var t=this.extend();return t.init.apply(t,arguments),t},init:function(){},mixIn:function(t){for(var e in t)t.hasOwnProperty(e)&&(this[e]=t[e]);t.hasOwnProperty("toString")&&(this.toString=t.toString);},clone:function(){return this.init.prototype.extend(this)}},f=u.WordArray=a.extend({init:function(t,e){t=this.words=t||[],this.sigBytes=null!=e?e:4*t.length;},toString:function(t){return (t||p).stringify(this)},concat:function(t){var e=this.words,r=t.words,i=this.sigBytes,n=t.sigBytes;if(this.clamp(),i%4)for(var o=0;o<n;o++)e[i+o>>>2]|=(r[o>>>2]>>>24-o%4*8&255)<<24-(i+o)%4*8;else for(var s=0;s<n;s+=4)e[i+s>>>2]=r[s>>>2];return this.sigBytes+=n,this},clamp:function(){var t=this.words,r=this.sigBytes;t[r>>>2]&=4294967295<<32-r%4*8,t.length=e.ceil(r/4);},clone:function(){var t=a.clone.call(this);return t.words=this.words.slice(0),t},random:function(t){for(var e=[],r=0;r<t;r+=4)e.push(o());return new f.init(e,t)}}),c=h.enc={},p=c.Hex={stringify:function(t){for(var e=t.words,r=t.sigBytes,i=[],n=0;n<r;n++){var o=e[n>>>2]>>>24-n%4*8&255;i.push((o>>>4).toString(16)),i.push((15&o).toString(16));}return i.join("")},parse:function(t){for(var e=t.length,r=[],i=0;i<e;i+=2)r[i>>>3]|=parseInt(t.substr(i,2),16)<<24-i%8*4;return new f.init(r,e/2)}},l=c.Latin1={stringify:function(t){for(var e=t.words,r=t.sigBytes,i=[],n=0;n<r;n++)i.push(String.fromCharCode(e[n>>>2]>>>24-n%4*8&255));return i.join("")},parse:function(t){for(var e=t.length,r=[],i=0;i<e;i++)r[i>>>2]|=(255&t.charCodeAt(i))<<24-i%4*8;return new f.init(r,e)}},d=c.Utf8={stringify:function(t){try{return decodeURIComponent(escape(l.stringify(t)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function(t){return l.parse(unescape(encodeURIComponent(t)))}},m=u.BufferedBlockAlgorithm=a.extend({reset:function(){this._data=new f.init,this._nDataBytes=0;},_append:function(t){"string"==typeof t&&(t=d.parse(t)),this._data.concat(t),this._nDataBytes+=t.sigBytes;},_process:function(t){var r,i=this._data,n=i.words,o=i.sigBytes,s=this.blockSize,h=o/(4*s),u=(h=t?e.ceil(h):e.max((0|h)-this._minBufferSize,0))*s,a=e.min(4*u,o);if(u){for(var c=0;c<u;c+=s)this._doProcessBlock(n,c);r=n.splice(0,u),i.sigBytes-=a;}return new f.init(r,a)},clone:function(){var t=a.clone.call(this);return t._data=this._data.clone(),t},_minBufferSize:0});u.Hasher=m.extend({cfg:a.extend(),init:function(t){this.cfg=this.cfg.extend(t),this.reset();},reset:function(){m.reset.call(this),this._doReset();},update:function(t){return this._append(t),this._process(),this},finalize:function(t){return t&&this._append(t),this._doFinalize()},blockSize:16,_createHelper:function(t){return function(e,r){return new t.init(r).finalize(e)}},_createHmacHelper:function(t){return function(e,r){return new v.HMAC.init(t,r).finalize(e)}}});var v=h.algo={};return h}(Math),n);}),o=e(function(t,e){var r;t.exports=(r=n,function(t){var e=r,i=e.lib,n=i.WordArray,o=i.Hasher,s=e.algo,h=[],u=[];!function(){function e(e){for(var r=t.sqrt(e),i=2;i<=r;i++)if(!(e%i))return !1;return !0}function r(t){return 4294967296*(t-(0|t))|0}for(var i=2,n=0;n<64;)e(i)&&(n<8&&(h[n]=r(t.pow(i,.5))),u[n]=r(t.pow(i,1/3)),n++),i++;}();var a=[],f=s.SHA256=o.extend({_doReset:function(){this._hash=new n.init(h.slice(0));},_doProcessBlock:function(t,e){for(var r=this._hash.words,i=r[0],n=r[1],o=r[2],s=r[3],h=r[4],f=r[5],c=r[6],p=r[7],l=0;l<64;l++){if(l<16)a[l]=0|t[e+l];else {var d=a[l-15],m=a[l-2];a[l]=((d<<25|d>>>7)^(d<<14|d>>>18)^d>>>3)+a[l-7]+((m<<15|m>>>17)^(m<<13|m>>>19)^m>>>10)+a[l-16];}var v=i&n^i&o^n&o,y=p+((h<<26|h>>>6)^(h<<21|h>>>11)^(h<<7|h>>>25))+(h&f^~h&c)+u[l]+a[l];p=c,c=f,f=h,h=s+y|0,s=o,o=n,n=i,i=y+(((i<<30|i>>>2)^(i<<19|i>>>13)^(i<<10|i>>>22))+v)|0;}r[0]=r[0]+i|0,r[1]=r[1]+n|0,r[2]=r[2]+o|0,r[3]=r[3]+s|0,r[4]=r[4]+h|0,r[5]=r[5]+f|0,r[6]=r[6]+c|0,r[7]=r[7]+p|0;},_doFinalize:function(){var e=this._data,r=e.words,i=8*this._nDataBytes,n=8*e.sigBytes;return r[n>>>5]|=128<<24-n%32,r[14+(n+64>>>9<<4)]=t.floor(i/4294967296),r[15+(n+64>>>9<<4)]=i,e.sigBytes=4*r.length,this._process(),this._hash},clone:function(){var t=o.clone.call(this);return t._hash=this._hash.clone(),t}});e.SHA256=o._createHelper(f),e.HmacSHA256=o._createHmacHelper(f);}(Math),r.SHA256);}),s=e(function(t,e){var r,i;t.exports=(i=(r=n).lib.WordArray,r.enc.Base64={stringify:function(t){var e=t.words,r=t.sigBytes,i=this._map;t.clamp();for(var n=[],o=0;o<r;o+=3)for(var s=(e[o>>>2]>>>24-o%4*8&255)<<16|(e[o+1>>>2]>>>24-(o+1)%4*8&255)<<8|e[o+2>>>2]>>>24-(o+2)%4*8&255,h=0;h<4&&o+.75*h<r;h++)n.push(i.charAt(s>>>6*(3-h)&63));var u=i.charAt(64);if(u)for(;n.length%4;)n.push(u);return n.join("")},parse:function(t){var e=t.length,r=this._map,n=this._reverseMap;if(!n){n=this._reverseMap=[];for(var o=0;o<r.length;o++)n[r.charCodeAt(o)]=o;}var s=r.charAt(64);if(s){var h=t.indexOf(s);-1!==h&&(e=h);}return function(t,e,r){for(var n=[],o=0,s=0;s<e;s++)if(s%4){var h=r[t.charCodeAt(s-1)]<<s%4*2,u=r[t.charCodeAt(s)]>>>6-s%4*2;n[o>>>2]|=(h|u)<<24-o%4*8,o++;}return i.create(n,o)}(t,e,n)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="},r.enc.Base64);}),h=e(function(t,e){t.exports=n.enc.Hex;}),u=e(function(e,r){(function(){var t;function r(t,e,r){null!=t&&("number"==typeof t?this.fromNumber(t,e,r):this.fromString(t,null==e&&"string"!=typeof t?256:e));}function i(){return new r(null)}var n="undefined"!=typeof navigator;n&&"Microsoft Internet Explorer"==navigator.appName?(r.prototype.am=function(t,e,r,i,n,o){for(var s=32767&e,h=e>>15;--o>=0;){var u=32767&this[t],a=this[t++]>>15,f=h*u+a*s;n=((u=s*u+((32767&f)<<15)+r[i]+(1073741823&n))>>>30)+(f>>>15)+h*a+(n>>>30),r[i++]=1073741823&u;}return n},t=30):n&&"Netscape"!=navigator.appName?(r.prototype.am=function(t,e,r,i,n,o){for(;--o>=0;){var s=e*this[t++]+r[i]+n;n=Math.floor(s/67108864),r[i++]=67108863&s;}return n},t=26):(r.prototype.am=function(t,e,r,i,n,o){for(var s=16383&e,h=e>>14;--o>=0;){var u=16383&this[t],a=this[t++]>>14,f=h*u+a*s;n=((u=s*u+((16383&f)<<14)+r[i]+n)>>28)+(f>>14)+h*a,r[i++]=268435455&u;}return n},t=28),r.prototype.DB=t,r.prototype.DM=(1<<t)-1,r.prototype.DV=1<<t,r.prototype.FV=Math.pow(2,52),r.prototype.F1=52-t,r.prototype.F2=2*t-52;var o,s,h=new Array;for(o="0".charCodeAt(0),s=0;s<=9;++s)h[o++]=s;for(o="a".charCodeAt(0),s=10;s<36;++s)h[o++]=s;for(o="A".charCodeAt(0),s=10;s<36;++s)h[o++]=s;function u(t){return "0123456789abcdefghijklmnopqrstuvwxyz".charAt(t)}function a(t,e){var r=h[t.charCodeAt(e)];return null==r?-1:r}function f(t){var e=i();return e.fromInt(t),e}function c(t){var e,r=1;return 0!=(e=t>>>16)&&(t=e,r+=16),0!=(e=t>>8)&&(t=e,r+=8),0!=(e=t>>4)&&(t=e,r+=4),0!=(e=t>>2)&&(t=e,r+=2),0!=(e=t>>1)&&(t=e,r+=1),r}function p(t){this.m=t;}function l(t){this.m=t,this.mp=t.invDigit(),this.mpl=32767&this.mp,this.mph=this.mp>>15,this.um=(1<<t.DB-15)-1,this.mt2=2*t.t;}function d(t,e){return t&e}function m(t,e){return t|e}function v(t,e){return t^e}function y(t,e){return t&~e}function g(t){if(0==t)return -1;var e=0;return 0==(65535&t)&&(t>>=16,e+=16),0==(255&t)&&(t>>=8,e+=8),0==(15&t)&&(t>>=4,e+=4),0==(3&t)&&(t>>=2,e+=2),0==(1&t)&&++e,e}function w(t){for(var e=0;0!=t;)t&=t-1,++e;return e}function T(){}function b(t){return t}function _(t){this.r2=i(),this.q3=i(),r.ONE.dlShiftTo(2*t.t,this.r2),this.mu=this.r2.divide(t),this.m=t;}p.prototype.convert=function(t){return t.s<0||t.compareTo(this.m)>=0?t.mod(this.m):t},p.prototype.revert=function(t){return t},p.prototype.reduce=function(t){t.divRemTo(this.m,null,t);},p.prototype.mulTo=function(t,e,r){t.multiplyTo(e,r),this.reduce(r);},p.prototype.sqrTo=function(t,e){t.squareTo(e),this.reduce(e);},l.prototype.convert=function(t){var e=i();return t.abs().dlShiftTo(this.m.t,e),e.divRemTo(this.m,null,e),t.s<0&&e.compareTo(r.ZERO)>0&&this.m.subTo(e,e),e},l.prototype.revert=function(t){var e=i();return t.copyTo(e),this.reduce(e),e},l.prototype.reduce=function(t){for(;t.t<=this.mt2;)t[t.t++]=0;for(var e=0;e<this.m.t;++e){var r=32767&t[e],i=r*this.mpl+((r*this.mph+(t[e]>>15)*this.mpl&this.um)<<15)&t.DM;for(t[r=e+this.m.t]+=this.m.am(0,i,t,e,0,this.m.t);t[r]>=t.DV;)t[r]-=t.DV,t[++r]++;}t.clamp(),t.drShiftTo(this.m.t,t),t.compareTo(this.m)>=0&&t.subTo(this.m,t);},l.prototype.mulTo=function(t,e,r){t.multiplyTo(e,r),this.reduce(r);},l.prototype.sqrTo=function(t,e){t.squareTo(e),this.reduce(e);},r.prototype.copyTo=function(t){for(var e=this.t-1;e>=0;--e)t[e]=this[e];t.t=this.t,t.s=this.s;},r.prototype.fromInt=function(t){this.t=1,this.s=t<0?-1:0,t>0?this[0]=t:t<-1?this[0]=t+this.DV:this.t=0;},r.prototype.fromString=function(t,e){var i;if(16==e)i=4;else if(8==e)i=3;else if(256==e)i=8;else if(2==e)i=1;else if(32==e)i=5;else {if(4!=e)return void this.fromRadix(t,e);i=2;}this.t=0,this.s=0;for(var n=t.length,o=!1,s=0;--n>=0;){var h=8==i?255&t[n]:a(t,n);h<0?"-"==t.charAt(n)&&(o=!0):(o=!1,0==s?this[this.t++]=h:s+i>this.DB?(this[this.t-1]|=(h&(1<<this.DB-s)-1)<<s,this[this.t++]=h>>this.DB-s):this[this.t-1]|=h<<s,(s+=i)>=this.DB&&(s-=this.DB));}8==i&&0!=(128&t[0])&&(this.s=-1,s>0&&(this[this.t-1]|=(1<<this.DB-s)-1<<s)),this.clamp(),o&&r.ZERO.subTo(this,this);},r.prototype.clamp=function(){for(var t=this.s&this.DM;this.t>0&&this[this.t-1]==t;)--this.t;},r.prototype.dlShiftTo=function(t,e){var r;for(r=this.t-1;r>=0;--r)e[r+t]=this[r];for(r=t-1;r>=0;--r)e[r]=0;e.t=this.t+t,e.s=this.s;},r.prototype.drShiftTo=function(t,e){for(var r=t;r<this.t;++r)e[r-t]=this[r];e.t=Math.max(this.t-t,0),e.s=this.s;},r.prototype.lShiftTo=function(t,e){var r,i=t%this.DB,n=this.DB-i,o=(1<<n)-1,s=Math.floor(t/this.DB),h=this.s<<i&this.DM;for(r=this.t-1;r>=0;--r)e[r+s+1]=this[r]>>n|h,h=(this[r]&o)<<i;for(r=s-1;r>=0;--r)e[r]=0;e[s]=h,e.t=this.t+s+1,e.s=this.s,e.clamp();},r.prototype.rShiftTo=function(t,e){e.s=this.s;var r=Math.floor(t/this.DB);if(r>=this.t)e.t=0;else {var i=t%this.DB,n=this.DB-i,o=(1<<i)-1;e[0]=this[r]>>i;for(var s=r+1;s<this.t;++s)e[s-r-1]|=(this[s]&o)<<n,e[s-r]=this[s]>>i;i>0&&(e[this.t-r-1]|=(this.s&o)<<n),e.t=this.t-r,e.clamp();}},r.prototype.subTo=function(t,e){for(var r=0,i=0,n=Math.min(t.t,this.t);r<n;)i+=this[r]-t[r],e[r++]=i&this.DM,i>>=this.DB;if(t.t<this.t){for(i-=t.s;r<this.t;)i+=this[r],e[r++]=i&this.DM,i>>=this.DB;i+=this.s;}else {for(i+=this.s;r<t.t;)i-=t[r],e[r++]=i&this.DM,i>>=this.DB;i-=t.s;}e.s=i<0?-1:0,i<-1?e[r++]=this.DV+i:i>0&&(e[r++]=i),e.t=r,e.clamp();},r.prototype.multiplyTo=function(t,e){var i=this.abs(),n=t.abs(),o=i.t;for(e.t=o+n.t;--o>=0;)e[o]=0;for(o=0;o<n.t;++o)e[o+i.t]=i.am(0,n[o],e,o,0,i.t);e.s=0,e.clamp(),this.s!=t.s&&r.ZERO.subTo(e,e);},r.prototype.squareTo=function(t){for(var e=this.abs(),r=t.t=2*e.t;--r>=0;)t[r]=0;for(r=0;r<e.t-1;++r){var i=e.am(r,e[r],t,2*r,0,1);(t[r+e.t]+=e.am(r+1,2*e[r],t,2*r+1,i,e.t-r-1))>=e.DV&&(t[r+e.t]-=e.DV,t[r+e.t+1]=1);}t.t>0&&(t[t.t-1]+=e.am(r,e[r],t,2*r,0,1)),t.s=0,t.clamp();},r.prototype.divRemTo=function(t,e,n){var o=t.abs();if(!(o.t<=0)){var s=this.abs();if(s.t<o.t)return null!=e&&e.fromInt(0),void(null!=n&&this.copyTo(n));null==n&&(n=i());var h=i(),u=this.s,a=t.s,f=this.DB-c(o[o.t-1]);f>0?(o.lShiftTo(f,h),s.lShiftTo(f,n)):(o.copyTo(h),s.copyTo(n));var p=h.t,l=h[p-1];if(0!=l){var d=l*(1<<this.F1)+(p>1?h[p-2]>>this.F2:0),m=this.FV/d,v=(1<<this.F1)/d,y=1<<this.F2,g=n.t,w=g-p,T=null==e?i():e;for(h.dlShiftTo(w,T),n.compareTo(T)>=0&&(n[n.t++]=1,n.subTo(T,n)),r.ONE.dlShiftTo(p,T),T.subTo(h,h);h.t<p;)h[h.t++]=0;for(;--w>=0;){var b=n[--g]==l?this.DM:Math.floor(n[g]*m+(n[g-1]+y)*v);if((n[g]+=h.am(0,b,n,w,0,p))<b)for(h.dlShiftTo(w,T),n.subTo(T,n);n[g]<--b;)n.subTo(T,n);}null!=e&&(n.drShiftTo(p,e),u!=a&&r.ZERO.subTo(e,e)),n.t=p,n.clamp(),f>0&&n.rShiftTo(f,n),u<0&&r.ZERO.subTo(n,n);}}},r.prototype.invDigit=function(){if(this.t<1)return 0;var t=this[0];if(0==(1&t))return 0;var e=3&t;return (e=(e=(e=(e=e*(2-(15&t)*e)&15)*(2-(255&t)*e)&255)*(2-((65535&t)*e&65535))&65535)*(2-t*e%this.DV)%this.DV)>0?this.DV-e:-e},r.prototype.isEven=function(){return 0==(this.t>0?1&this[0]:this.s)},r.prototype.exp=function(t,e){if(t>4294967295||t<1)return r.ONE;var n=i(),o=i(),s=e.convert(this),h=c(t)-1;for(s.copyTo(n);--h>=0;)if(e.sqrTo(n,o),(t&1<<h)>0)e.mulTo(o,s,n);else {var u=n;n=o,o=u;}return e.revert(n)},r.prototype.toString=function(t){if(this.s<0)return "-"+this.negate().toString(t);var e;if(16==t)e=4;else if(8==t)e=3;else if(2==t)e=1;else if(32==t)e=5;else {if(4!=t)return this.toRadix(t);e=2;}var r,i=(1<<e)-1,n=!1,o="",s=this.t,h=this.DB-s*this.DB%e;if(s-- >0)for(h<this.DB&&(r=this[s]>>h)>0&&(n=!0,o=u(r));s>=0;)h<e?(r=(this[s]&(1<<h)-1)<<e-h,r|=this[--s]>>(h+=this.DB-e)):(r=this[s]>>(h-=e)&i,h<=0&&(h+=this.DB,--s)),r>0&&(n=!0),n&&(o+=u(r));return n?o:"0"},r.prototype.negate=function(){var t=i();return r.ZERO.subTo(this,t),t},r.prototype.abs=function(){return this.s<0?this.negate():this},r.prototype.compareTo=function(t){var e=this.s-t.s;if(0!=e)return e;var r=this.t;if(0!=(e=r-t.t))return this.s<0?-e:e;for(;--r>=0;)if(0!=(e=this[r]-t[r]))return e;return 0},r.prototype.bitLength=function(){return this.t<=0?0:this.DB*(this.t-1)+c(this[this.t-1]^this.s&this.DM)},r.prototype.mod=function(t){var e=i();return this.abs().divRemTo(t,null,e),this.s<0&&e.compareTo(r.ZERO)>0&&t.subTo(e,e),e},r.prototype.modPowInt=function(t,e){var r;return r=t<256||e.isEven()?new p(e):new l(e),this.exp(t,r)},r.ZERO=f(0),r.ONE=f(1),T.prototype.convert=b,T.prototype.revert=b,T.prototype.mulTo=function(t,e,r){t.multiplyTo(e,r);},T.prototype.sqrTo=function(t,e){t.squareTo(e);},_.prototype.convert=function(t){if(t.s<0||t.t>2*this.m.t)return t.mod(this.m);if(t.compareTo(this.m)<0)return t;var e=i();return t.copyTo(e),this.reduce(e),e},_.prototype.revert=function(t){return t},_.prototype.reduce=function(t){for(t.drShiftTo(this.m.t-1,this.r2),t.t>this.m.t+1&&(t.t=this.m.t+1,t.clamp()),this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3),this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);t.compareTo(this.r2)<0;)t.dAddOffset(1,this.m.t+1);for(t.subTo(this.r2,t);t.compareTo(this.m)>=0;)t.subTo(this.m,t);},_.prototype.mulTo=function(t,e,r){t.multiplyTo(e,r),this.reduce(r);},_.prototype.sqrTo=function(t,e){t.squareTo(e),this.reduce(e);};var S,A,D,B=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997],x=(1<<26)/B[B.length-1];function E(){var t;t=(new Date).getTime(),A[D++]^=255&t,A[D++]^=t>>8&255,A[D++]^=t>>16&255,A[D++]^=t>>24&255,D>=j&&(D-=j);}if(r.prototype.chunkSize=function(t){return Math.floor(Math.LN2*this.DB/Math.log(t))},r.prototype.toRadix=function(t){if(null==t&&(t=10),0==this.signum()||t<2||t>36)return "0";var e=this.chunkSize(t),r=Math.pow(t,e),n=f(r),o=i(),s=i(),h="";for(this.divRemTo(n,o,s);o.signum()>0;)h=(r+s.intValue()).toString(t).substr(1)+h,o.divRemTo(n,o,s);return s.intValue().toString(t)+h},r.prototype.fromRadix=function(t,e){this.fromInt(0),null==e&&(e=10);for(var i=this.chunkSize(e),n=Math.pow(e,i),o=!1,s=0,h=0,u=0;u<t.length;++u){var f=a(t,u);f<0?"-"==t.charAt(u)&&0==this.signum()&&(o=!0):(h=e*h+f,++s>=i&&(this.dMultiply(n),this.dAddOffset(h,0),s=0,h=0));}s>0&&(this.dMultiply(Math.pow(e,s)),this.dAddOffset(h,0)),o&&r.ZERO.subTo(this,this);},r.prototype.fromNumber=function(t,e,i){if("number"==typeof e)if(t<2)this.fromInt(1);else for(this.fromNumber(t,i),this.testBit(t-1)||this.bitwiseTo(r.ONE.shiftLeft(t-1),m,this),this.isEven()&&this.dAddOffset(1,0);!this.isProbablePrime(e);)this.dAddOffset(2,0),this.bitLength()>t&&this.subTo(r.ONE.shiftLeft(t-1),this);else {var n=new Array,o=7&t;n.length=1+(t>>3),e.nextBytes(n),o>0?n[0]&=(1<<o)-1:n[0]=0,this.fromString(n,256);}},r.prototype.bitwiseTo=function(t,e,r){var i,n,o=Math.min(t.t,this.t);for(i=0;i<o;++i)r[i]=e(this[i],t[i]);if(t.t<this.t){for(n=t.s&this.DM,i=o;i<this.t;++i)r[i]=e(this[i],n);r.t=this.t;}else {for(n=this.s&this.DM,i=o;i<t.t;++i)r[i]=e(n,t[i]);r.t=t.t;}r.s=e(this.s,t.s),r.clamp();},r.prototype.changeBit=function(t,e){var i=r.ONE.shiftLeft(t);return this.bitwiseTo(i,e,i),i},r.prototype.addTo=function(t,e){for(var r=0,i=0,n=Math.min(t.t,this.t);r<n;)i+=this[r]+t[r],e[r++]=i&this.DM,i>>=this.DB;if(t.t<this.t){for(i+=t.s;r<this.t;)i+=this[r],e[r++]=i&this.DM,i>>=this.DB;i+=this.s;}else {for(i+=this.s;r<t.t;)i+=t[r],e[r++]=i&this.DM,i>>=this.DB;i+=t.s;}e.s=i<0?-1:0,i>0?e[r++]=i:i<-1&&(e[r++]=this.DV+i),e.t=r,e.clamp();},r.prototype.dMultiply=function(t){this[this.t]=this.am(0,t-1,this,0,0,this.t),++this.t,this.clamp();},r.prototype.dAddOffset=function(t,e){if(0!=t){for(;this.t<=e;)this[this.t++]=0;for(this[e]+=t;this[e]>=this.DV;)this[e]-=this.DV,++e>=this.t&&(this[this.t++]=0),++this[e];}},r.prototype.multiplyLowerTo=function(t,e,r){var i,n=Math.min(this.t+t.t,e);for(r.s=0,r.t=n;n>0;)r[--n]=0;for(i=r.t-this.t;n<i;++n)r[n+this.t]=this.am(0,t[n],r,n,0,this.t);for(i=Math.min(t.t,e);n<i;++n)this.am(0,t[n],r,n,0,e-n);r.clamp();},r.prototype.multiplyUpperTo=function(t,e,r){--e;var i=r.t=this.t+t.t-e;for(r.s=0;--i>=0;)r[i]=0;for(i=Math.max(e-this.t,0);i<t.t;++i)r[this.t+i-e]=this.am(e-i,t[i],r,0,0,this.t+i-e);r.clamp(),r.drShiftTo(1,r);},r.prototype.modInt=function(t){if(t<=0)return 0;var e=this.DV%t,r=this.s<0?t-1:0;if(this.t>0)if(0==e)r=this[0]%t;else for(var i=this.t-1;i>=0;--i)r=(e*r+this[i])%t;return r},r.prototype.millerRabin=function(t){var e=this.subtract(r.ONE),n=e.getLowestSetBit();if(n<=0)return !1;var o=e.shiftRight(n);(t=t+1>>1)>B.length&&(t=B.length);for(var s=i(),h=0;h<t;++h){s.fromInt(B[Math.floor(Math.random()*B.length)]);var u=s.modPow(o,this);if(0!=u.compareTo(r.ONE)&&0!=u.compareTo(e)){for(var a=1;a++<n&&0!=u.compareTo(e);)if(0==(u=u.modPowInt(2,this)).compareTo(r.ONE))return !1;if(0!=u.compareTo(e))return !1}}return !0},r.prototype.clone=function(){var t=i();return this.copyTo(t),t},r.prototype.intValue=function(){if(this.s<0){if(1==this.t)return this[0]-this.DV;if(0==this.t)return -1}else {if(1==this.t)return this[0];if(0==this.t)return 0}return (this[1]&(1<<32-this.DB)-1)<<this.DB|this[0]},r.prototype.byteValue=function(){return 0==this.t?this.s:this[0]<<24>>24},r.prototype.shortValue=function(){return 0==this.t?this.s:this[0]<<16>>16},r.prototype.signum=function(){return this.s<0?-1:this.t<=0||1==this.t&&this[0]<=0?0:1},r.prototype.toByteArray=function(){var t=this.t,e=new Array;e[0]=this.s;var r,i=this.DB-t*this.DB%8,n=0;if(t-- >0)for(i<this.DB&&(r=this[t]>>i)!=(this.s&this.DM)>>i&&(e[n++]=r|this.s<<this.DB-i);t>=0;)i<8?(r=(this[t]&(1<<i)-1)<<8-i,r|=this[--t]>>(i+=this.DB-8)):(r=this[t]>>(i-=8)&255,i<=0&&(i+=this.DB,--t)),0!=(128&r)&&(r|=-256),0==n&&(128&this.s)!=(128&r)&&++n,(n>0||r!=this.s)&&(e[n++]=r);return e},r.prototype.equals=function(t){return 0==this.compareTo(t)},r.prototype.min=function(t){return this.compareTo(t)<0?this:t},r.prototype.max=function(t){return this.compareTo(t)>0?this:t},r.prototype.and=function(t){var e=i();return this.bitwiseTo(t,d,e),e},r.prototype.or=function(t){var e=i();return this.bitwiseTo(t,m,e),e},r.prototype.xor=function(t){var e=i();return this.bitwiseTo(t,v,e),e},r.prototype.andNot=function(t){var e=i();return this.bitwiseTo(t,y,e),e},r.prototype.not=function(){for(var t=i(),e=0;e<this.t;++e)t[e]=this.DM&~this[e];return t.t=this.t,t.s=~this.s,t},r.prototype.shiftLeft=function(t){var e=i();return t<0?this.rShiftTo(-t,e):this.lShiftTo(t,e),e},r.prototype.shiftRight=function(t){var e=i();return t<0?this.lShiftTo(-t,e):this.rShiftTo(t,e),e},r.prototype.getLowestSetBit=function(){for(var t=0;t<this.t;++t)if(0!=this[t])return t*this.DB+g(this[t]);return this.s<0?this.t*this.DB:-1},r.prototype.bitCount=function(){for(var t=0,e=this.s&this.DM,r=0;r<this.t;++r)t+=w(this[r]^e);return t},r.prototype.testBit=function(t){var e=Math.floor(t/this.DB);return e>=this.t?0!=this.s:0!=(this[e]&1<<t%this.DB)},r.prototype.setBit=function(t){return this.changeBit(t,m)},r.prototype.clearBit=function(t){return this.changeBit(t,y)},r.prototype.flipBit=function(t){return this.changeBit(t,v)},r.prototype.add=function(t){var e=i();return this.addTo(t,e),e},r.prototype.subtract=function(t){var e=i();return this.subTo(t,e),e},r.prototype.multiply=function(t){var e=i();return this.multiplyTo(t,e),e},r.prototype.divide=function(t){var e=i();return this.divRemTo(t,e,null),e},r.prototype.remainder=function(t){var e=i();return this.divRemTo(t,null,e),e},r.prototype.divideAndRemainder=function(t){var e=i(),r=i();return this.divRemTo(t,e,r),new Array(e,r)},r.prototype.modPow=function(t,e){var r,n,o=t.bitLength(),s=f(1);if(o<=0)return s;r=o<18?1:o<48?3:o<144?4:o<768?5:6,n=o<8?new p(e):e.isEven()?new _(e):new l(e);var h=new Array,u=3,a=r-1,d=(1<<r)-1;if(h[1]=n.convert(this),r>1){var m=i();for(n.sqrTo(h[1],m);u<=d;)h[u]=i(),n.mulTo(m,h[u-2],h[u]),u+=2;}var v,y,g=t.t-1,w=!0,T=i();for(o=c(t[g])-1;g>=0;){for(o>=a?v=t[g]>>o-a&d:(v=(t[g]&(1<<o+1)-1)<<a-o,g>0&&(v|=t[g-1]>>this.DB+o-a)),u=r;0==(1&v);)v>>=1,--u;if((o-=u)<0&&(o+=this.DB,--g),w)h[v].copyTo(s),w=!1;else {for(;u>1;)n.sqrTo(s,T),n.sqrTo(T,s),u-=2;u>0?n.sqrTo(s,T):(y=s,s=T,T=y),n.mulTo(T,h[v],s);}for(;g>=0&&0==(t[g]&1<<o);)n.sqrTo(s,T),y=s,s=T,T=y,--o<0&&(o=this.DB-1,--g);}return n.revert(s)},r.prototype.modInverse=function(t){var e=t.isEven();if(this.isEven()&&e||0==t.signum())return r.ZERO;for(var i=t.clone(),n=this.clone(),o=f(1),s=f(0),h=f(0),u=f(1);0!=i.signum();){for(;i.isEven();)i.rShiftTo(1,i),e?(o.isEven()&&s.isEven()||(o.addTo(this,o),s.subTo(t,s)),o.rShiftTo(1,o)):s.isEven()||s.subTo(t,s),s.rShiftTo(1,s);for(;n.isEven();)n.rShiftTo(1,n),e?(h.isEven()&&u.isEven()||(h.addTo(this,h),u.subTo(t,u)),h.rShiftTo(1,h)):u.isEven()||u.subTo(t,u),u.rShiftTo(1,u);i.compareTo(n)>=0?(i.subTo(n,i),e&&o.subTo(h,o),s.subTo(u,s)):(n.subTo(i,n),e&&h.subTo(o,h),u.subTo(s,u));}return 0!=n.compareTo(r.ONE)?r.ZERO:u.compareTo(t)>=0?u.subtract(t):u.signum()<0?(u.addTo(t,u),u.signum()<0?u.add(t):u):u},r.prototype.pow=function(t){return this.exp(t,new T)},r.prototype.gcd=function(t){var e=this.s<0?this.negate():this.clone(),r=t.s<0?t.negate():t.clone();if(e.compareTo(r)<0){var i=e;e=r,r=i;}var n=e.getLowestSetBit(),o=r.getLowestSetBit();if(o<0)return e;for(n<o&&(o=n),o>0&&(e.rShiftTo(o,e),r.rShiftTo(o,r));e.signum()>0;)(n=e.getLowestSetBit())>0&&e.rShiftTo(n,e),(n=r.getLowestSetBit())>0&&r.rShiftTo(n,r),e.compareTo(r)>=0?(e.subTo(r,e),e.rShiftTo(1,e)):(r.subTo(e,r),r.rShiftTo(1,r));return o>0&&r.lShiftTo(o,r),r},r.prototype.isProbablePrime=function(t){var e,r=this.abs();if(1==r.t&&r[0]<=B[B.length-1]){for(e=0;e<B.length;++e)if(r[0]==B[e])return !0;return !1}if(r.isEven())return !1;for(e=1;e<B.length;){for(var i=B[e],n=e+1;n<B.length&&i<x;)i*=B[n++];for(i=r.modInt(i);e<n;)if(i%B[e++]==0)return !1}return r.millerRabin(t)},r.prototype.square=function(){var t=i();return this.squareTo(t),t},r.prototype.Barrett=_,null==A){var k;if(A=new Array,D=0,"undefined"!=typeof window&&window.crypto)if(window.crypto.getRandomValues){var I=new Uint8Array(32);for(window.crypto.getRandomValues(I),k=0;k<32;++k)A[D++]=I[k];}else if("Netscape"==navigator.appName&&navigator.appVersion<"5"){var M=window.crypto.random(32);for(k=0;k<M.length;++k)A[D++]=255&M.charCodeAt(k);}for(;D<j;)k=Math.floor(65536*Math.random()),A[D++]=k>>>8,A[D++]=255&k;D=0,E();}function C(){if(null==S){for(E(),(S=new O).init(A),D=0;D<A.length;++D)A[D]=0;D=0;}return S.next()}function R(){}function O(){this.i=0,this.j=0,this.S=new Array;}R.prototype.nextBytes=function(t){var e;for(e=0;e<t.length;++e)t[e]=C();},O.prototype.init=function(t){var e,r,i;for(e=0;e<256;++e)this.S[e]=e;for(r=0,e=0;e<256;++e)i=this.S[e],this.S[e]=this.S[r=r+this.S[e]+t[e%t.length]&255],this.S[r]=i;this.i=0,this.j=0;},O.prototype.next=function(){var t;return this.i=this.i+1&255,this.j=this.j+this.S[this.i]&255,t=this.S[this.i],this.S[this.i]=this.S[this.j],this.S[this.j]=t,this.S[t+this.S[this.i]&255]};var j=256;e.exports={default:r,BigInteger:r,SecureRandom:R};}).call(t);}),a={sha1:"3021300906052b0e03021a05000414",sha224:"302d300d06096086480165030402040500041c",sha256:"3031300d060960864801650304020105000420",sha384:"3041300d060960864801650304020205000430",sha512:"3051300d060960864801650304020305000440",md2:"3020300c06082a864886f70d020205000410",md5:"3020300c06082a864886f70d020505000410",ripemd160:"3021300906052b2403020105000414"},f={sha256:o};function c(t,e){if(this.n=null,this.e=0,!(null!=t&&null!=e&&t.length>0&&e.length>0))throw new Error("Invalid key data");this.n=new u.BigInteger(t,16),this.e=parseInt(e,16);}c.prototype.verify=function(t,e){e=e.replace(/[^0-9a-f]|[\s\n]]/gi,"");var r=new u.BigInteger(e,16);if(r.bitLength()>this.n.bitLength())throw new Error("Signature does not match with the key modulus.");var i=function(t){for(var e in a){var r=a[e],i=r.length;if(t.substring(0,i)===r)return {alg:e,hash:t.substring(i)}}return []}(r.modPowInt(this.e,this.n).toString(16).replace(/^1f+00/,""));if(0===i.length)return !1;if(!f.hasOwnProperty(i.alg))throw new Error("Hashing algorithm is not supported.");var n=f[i.alg](t).toString();return i.hash===n};for(var p=[],l=[],d="undefined"!=typeof Uint8Array?Uint8Array:Array,m="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",v=0,y=m.length;v<y;++v)p[v]=m[v],l[m.charCodeAt(v)]=v;l["-".charCodeAt(0)]=62,l["_".charCodeAt(0)]=63;var g=function(t){var e,r,i=function(t){var e=t.length;if(e%4>0)throw new Error("Invalid string. Length must be a multiple of 4");var r=t.indexOf("=");return -1===r&&(r=e),[r,r===e?0:4-r%4]}(t),n=i[0],o=i[1],s=new d(function(t,e,r){return 3*(e+r)/4-r}(0,n,o)),h=0,u=o>0?n-4:n;for(r=0;r<u;r+=4)e=l[t.charCodeAt(r)]<<18|l[t.charCodeAt(r+1)]<<12|l[t.charCodeAt(r+2)]<<6|l[t.charCodeAt(r+3)],s[h++]=e>>16&255,s[h++]=e>>8&255,s[h++]=255&e;return 2===o&&(e=l[t.charCodeAt(r)]<<2|l[t.charCodeAt(r+1)]>>4,s[h++]=255&e),1===o&&(e=l[t.charCodeAt(r)]<<10|l[t.charCodeAt(r+1)]<<4|l[t.charCodeAt(r+2)]>>2,s[h++]=e>>8&255,s[h++]=255&e),s};function w(t){var e=t.length%4;return 0===e?t:t+new Array(4-e+1).join("=")}function T(t){return t=w(t).replace(/\-/g,"+").replace(/_/g,"/"),decodeURIComponent(function(t){for(var e="",r=0;r<t.length;r++)e+=String.fromCharCode(t[r]);return e}(g(t)).split("").map(function(t){return "%"+("00"+t.charCodeAt(0).toString(16)).slice(-2)}).join(""))}function b(t){return function(t){for(var e="",r=0;r<t.length;r++){var i=t[r].toString(16);e+=2===i.length?i:"0"+i;}return e}(g(w(t)))}var _=e(function(e){var r,i;r=t,i=function(){function t(t){var e=[];if(0===t.length)return "";if("string"!=typeof t[0])throw new TypeError("Url must be a string. Received "+t[0]);if(t[0].match(/^[^/:]+:\/*$/)&&t.length>1){var r=t.shift();t[0]=r+t[0];}t[0]=t[0].match(/^file:\/\/\//)?t[0].replace(/^([^/:]+):\/*/,"$1:///"):t[0].replace(/^([^/:]+):\/*/,"$1://");for(var i=0;i<t.length;i++){var n=t[i];if("string"!=typeof n)throw new TypeError("Url must be a string. Received "+n);""!==n&&(i>0&&(n=n.replace(/^[\/]+/,"")),n=n.replace(/[\/]+$/,i<t.length-1?"":"/"),e.push(n));}var o=e.join("/"),s=(o=o.replace(/\/(\?|&|#[^!])/g,"$1")).split("?");return s.shift()+(s.length>0?"?":"")+s.join("&")}return function(){return t("object"==typeof arguments[0]?arguments[0]:[].slice.call(arguments))}},e.exports?e.exports=i():r.urljoin=i();});function S(t,e){return e=e||{},new Promise(function(r,i){var n=new XMLHttpRequest,o=[],s=[],h={},u=function(){return {ok:2==(n.status/100|0),statusText:n.statusText,status:n.status,url:n.responseURL,text:function(){return Promise.resolve(n.responseText)},json:function(){return Promise.resolve(n.responseText).then(JSON.parse)},blob:function(){return Promise.resolve(new Blob([n.response]))},clone:u,headers:{keys:function(){return o},entries:function(){return s},get:function(t){return h[t.toLowerCase()]},has:function(t){return t.toLowerCase()in h}}}};for(var a in n.open(e.method||"get",t,!0),n.onload=function(){n.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm,function(t,e,r){o.push(e=e.toLowerCase()),s.push([e,r]),h[e]=h[e]?h[e]+","+r:r;}),r(u());},n.onerror=i,n.withCredentials="include"==e.credentials,e.headers)n.setRequestHeader(a,e.headers[a]);n.send(e.body||null);})}function A(t){if(t.ok)return t.json();var e=new Error(t.statusText);return e.response=t,Promise.reject(e)}function D(t){this.name="ConfigurationError",this.message=t||"";}function B(t){this.name="TokenValidationError",this.message=t||"";}D.prototype=Error.prototype,B.prototype=Error.prototype;var x=function(){function t(){}var e=t.prototype;return e.get=function(){return null},e.has=function(){return null},e.set=function(){return null},t}();r.polyfill();var E="RS256",k=function(t){return "number"==typeof t},I=function(){return new Date};function M(t){var e=t||{};if(this.jwksCache=e.jwksCache||new x,this.expectedAlg=e.expectedAlg||"RS256",this.issuer=e.issuer,this.audience=e.audience,this.leeway=0===e.leeway?0:e.leeway||60,this.jwksURI=e.jwksURI,this.maxAge=e.maxAge,this.__clock="function"==typeof e.__clock?e.__clock:I,this.leeway<0||this.leeway>300)throw new D("The leeway should be positive and lower than five minutes.");if(E!==this.expectedAlg)throw new D('Signature algorithm of "'+this.expectedAlg+'" is not supported. Expected the ID token to be signed with "'+E+'".')}M.prototype.verify=function(t,e,r){if(!r&&e&&"function"==typeof e&&(r=e,e=void 0),!t)return r(new B("ID token is required but missing"),null);var i=this.decode(t);if(i instanceof Error)return r(new B("ID token could not be decoded"),null);var n=i.encoded.header+"."+i.encoded.payload,o=b(i.encoded.signature),s=i.header.alg,h=i.header.kid,u=i.payload.aud,a=i.payload.sub,f=i.payload.iss,c=i.payload.exp,p=i.payload.nbf,l=i.payload.iat,d=i.payload.azp,m=i.payload.auth_time,v=i.payload.nonce,y=this.__clock(),g=this;if(g.expectedAlg!==s)return r(new B('Signature algorithm of "'+s+'" is not supported. Expected the ID token to be signed with "'+E+'".'),null);this.getRsaVerifier(f,h,function(t,s){if(t)return r(t,null);if(!s.verify(n,o))return r(new B("Invalid ID token signature."),null);if(!f||"string"!=typeof f)return r(new B("Issuer (iss) claim must be a string present in the ID token"),null);if(g.issuer!==f)return r(new B('Issuer (iss) claim mismatch in the ID token, expected "'+g.issuer+'", found "'+f+'"'),null);if(!a||"string"!=typeof a)return r(new B("Subject (sub) claim must be a string present in the ID token"),null);if(!u||"string"!=typeof u&&!Array.isArray(u))return r(new B("Audience (aud) claim must be a string or array of strings present in the ID token"),null);if(Array.isArray(u)&&!u.includes(g.audience))return r(new B('Audience (aud) claim mismatch in the ID token; expected "'+g.audience+'" but was not one of "'+u.join(", ")+'"'),null);if("string"==typeof u&&g.audience!==u)return r(new B('Audience (aud) claim mismatch in the ID token; expected "'+g.audience+'" but found "'+u+'"'),null);if(e){if(!v||"string"!=typeof v)return r(new B("Nonce (nonce) claim must be a string present in the ID token"),null);if(v!==e)return r(new B('Nonce (nonce) claim value mismatch in the ID token; expected "'+e+'", found "'+v+'"'),null)}if(Array.isArray(u)&&u.length>1){if(!d||"string"!=typeof d)return r(new B("Authorized Party (azp) claim must be a string present in the ID token when Audience (aud) claim has multiple values"),null);if(d!==g.audience)return r(new B('Authorized Party (azp) claim mismatch in the ID token; expected "'+g.audience+'", found "'+d+'"'),null)}if(!c||!k(c))return r(new B("Expiration Time (exp) claim must be a number present in the ID token"),null);if(!l||!k(l))return r(new B("Issued At (iat) claim must be a number present in the ID token"),null);var h=c+g.leeway,w=new Date(0);if(w.setUTCSeconds(h),y>w)return r(new B('Expiration Time (exp) claim error in the ID token; current time "'+y+'" is after expiration time "'+w+'"'),null);if(p&&k(p)){var T=p-g.leeway,b=new Date(0);if(b.setUTCSeconds(T),y<b)return r(new B('Not Before Time (nbf) claim error in the ID token; current time "'+y+'" is before the not before time "'+b+'"'),null)}if(g.maxAge){if(!m||!k(m))return r(new B("Authentication Time (auth_time) claim must be a number present in the ID token when Max Age (max_age) is specified"),null);var _=m+g.maxAge+g.leeway,S=new Date(0);if(S.setUTCSeconds(_),y>S)return r(new B('Authentication Time (auth_time) claim in the ID token indicates that too much time has passed since the last end-user authentication. Current time "'+y+'" is after last auth time at "'+S+'"'),null)}return r(null,i.payload)});},M.prototype.getRsaVerifier=function(t,e,r){var i=this,n=t+e;Promise.resolve(this.jwksCache.has(n)).then(function(r){return r?i.jwksCache.get(n):(o={jwksURI:i.jwksURI,iss:t,kid:e},("undefined"==typeof fetch?S:fetch)(o.jwksURI||_(o.iss,".well-known","jwks.json")).then(A).then(function(t){var e,r,i,n=null;for(e=0;e<t.keys.length&&null===n;e++)(r=t.keys[e]).kid===o.kid&&(n=r);if(!n)throw new Error('Could not find a public key for Key ID (kid) "'+o.kid+'"');return {modulus:b((i=n).n),exp:b(i.e)}}).catch(function(t){throw t}));var o;}).then(function(t){if(!t||!t.modulus||!t.exp)throw new Error("Empty keyInfo in response");return Promise.resolve(i.jwksCache.set(n,t)).then(function(){r&&r(null,new c(t.modulus,t.exp));})}).catch(function(t){r&&r(t);});},M.prototype.decode=function(t){var e,r,i=t.split(".");if(3!==i.length)return new B("Cannot decode a malformed JWT");try{e=JSON.parse(T(i[0])),r=JSON.parse(T(i[1]));}catch(t){return new B("Token header or payload is not valid JSON")}return {header:e,payload:r,encoded:{header:i[0],payload:i[1],signature:i[2]}}},M.prototype.validateAccessToken=function(t,e,r,i){if(this.expectedAlg!==e)return i(new B('Signature algorithm of "'+e+'" is not supported. Expected "'+this.expectedAlg+'"'));var n,u=o(t),a=h.stringify(u),f=a.substring(0,a.length/2),c=h.parse(f),p=s.stringify(c);return i((n={"+":"-","/":"_","=":""},p.replace(/[+/=]/g,function(t){return n[t]})!==r?new B("Invalid access_token"):null))};

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

	function randomString(length) {
	  // eslint-disable-next-line
	  var bytes = new Uint8Array(length);
	  var result = [];
	  var charset =
	    '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';

	  var cryptoObj =
	    windowHelper.getWindow().crypto || windowHelper.getWindow().msCrypto;
	  if (!cryptoObj) {
	    return null;
	  }

	  var random = cryptoObj.getRandomValues(bytes);

	  for (var a = 0; a < random.length; a++) {
	    result.push(charset[random[a] % charset.length]);
	  }

	  return result.join('');
	}

	var random = {
	  randomString: randomString
	};

	var MINUTES_15 = 1 / 96;
	var MINUTES_30 = 1 / 48;

	var DEFAULT_NAMESPACE = 'com.auth0.auth.';

	function TransactionManager(options) {
	  var transaction = options.transaction || {};
	  this.namespace = transaction.namespace || DEFAULT_NAMESPACE;
	  this.keyLength = transaction.keyLength || 32;
	  // Passed option is in minutes, convert to days
	  this.stateExpiration = options.stateExpiration ? (options.stateExpiration / 60 / 24) : MINUTES_30;
	  this.storage = new Storage(options);
	  this.options = options;
	}

	TransactionManager.prototype.process = function(options) {
	  if (!options.responseType) {
	    throw new Error('responseType is required');
	  }
	  var lastUsedConnection = options.realm || options.connection;
	  var responseTypeIncludesIdToken =
	    options.responseType.indexOf('id_token') !== -1;

	  var transaction = this.generateTransaction(
	    options.appState,
	    options.state,
	    options.nonce,
	    lastUsedConnection,
	    responseTypeIncludesIdToken,
	    options.organization
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
	  generateNonce,
	  organization
	) {
	  state = state || random.randomString(this.keyLength);
	  nonce = nonce || (generateNonce ? random.randomString(this.keyLength) : null);

	  var isHostedLoginPage =
	    windowHelper.getWindow().location.host === this.options.domain;

	  if (!isHostedLoginPage) {
	    var transactionPayload = {
	      nonce: nonce,
	      appState: appState,
	      state: state,
	      lastUsedConnection: lastUsedConnection
	    };

	    if (organization) {
	      transactionPayload.organization = organization;
	    }

	    this.storage.setItem(this.namespace + state, transactionPayload, {
	      expires: this.stateExpiration
	    });
	  }

	  return {
	    state: state,
	    nonce: nonce
	  };
	};

	TransactionManager.prototype.getStoredTransaction = function(state) {
	  var transactionData;

	  transactionData = this.storage.getItem(this.namespace + state);
	  this.clearTransaction(state);
	  return transactionData;
	};

	TransactionManager.prototype.clearTransaction = function(state) {
	  this.storage.removeItem(this.namespace + state);
	};

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
	      throw new Error(
	        'Unsupported event listener type: ' + this.eventListenerType
	      );
	  }

	  this.eventSourceObject.addEventListener(
	    this.eventListenerType,
	    this.proxyEventListener,
	    false
	  );

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

	  clearTimeout(this.timeoutHandle);

	  this._destroyTimeout = setTimeout(function() {
	    _this.eventSourceObject.removeEventListener(
	      _this.eventListenerType,
	      _this.proxyEventListener,
	      false
	    );

	    if (_this.iframe.parentNode) {
	      _this.iframe.parentNode.removeChild(_this.iframe);
	    }
	  }, 0);
	};

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
	        return !!(
	          eventData.event.data &&
	          eventData.event.data.type === 'authorization_response' &&
	          options.state === eventData.event.data.response.state
	        );
	      }
	    },
	    timeoutCallback: function() {
	      callback({
	        error: 'timeout',
	        error_description: 'Timeout during executing web_message communication',
	        state: options.state
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
	      error_description:
	        "The redirectUri's origin (" +
	        redirectUriOrigin +
	        ") should match the window's origin (" +
	        currentOrigin +
	        ').'
	    });
	  }

	  runWebMessageFlow(
	    this.webAuth.client.buildAuthorizeUrl(options),
	    options,
	    function(err, eventData) {
	      var error = err;
	      if (!err && eventData.event.data.response.error) {
	        error = eventData.event.data.response;
	      }
	      if (!error) {
	        var parsedHash = eventData.event.data.response;
	        return _this.webAuth.validateAuthenticationResponse(
	          options,
	          parsedHash,
	          cb
	        );
	      }
	      if (
	        error.error === 'consent_required' &&
	        windowHelper.getWindow().location.hostname === 'localhost'
	      ) {
	        _this.warn.warning(
	          "Consent Required. Consent can't be skipped on localhost. Read more here: https://auth0.com/docs/api-auth/user-consent#skipping-consent-for-first-party-clients"
	        );
	      }
	      _this.webAuth.transactionManager.clearTransaction(error.state);
	      return cb(objectHelper.pick(error, ['error', 'error_description']));
	    }
	  );
	};

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
	  var url = urlJoin(this.baseOptions.rootUrl, '/co/authenticate');

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

	        return wrapCallback(cb, { forceLegacyError: true })(errorObject);
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
	          expires: MINUTES_15
	        });

	        if (popupMode) {
	          _this.webMessageHandler.run(
	            authorizeOptions,
	            wrapCallback(cb, { forceLegacyError: true })
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

	/**
	 * @class
	 * @classdesc This class cannot be instantiated directly. Instead, use WebAuth.redirect
	 * @hideconstructor
	 */
	function Redirect(auth0, options) {
	  this.webAuth = auth0;
	  this.baseOptions = options;
	  this.crossOriginAuthentication = new CrossOriginAuthentication(
	    auth0,
	    this.baseOptions
	  );

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
	 * @memberof Redirect.prototype
	 * @memberof Redirect.prototype
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
	 * @memberof Redirect.prototype
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

	var winchan = createCommonjsModule(function (module) {
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
	              return cb(err);
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
	          originalPopup: w,
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

	if ( module.exports) {
	  module.exports = WinChan;
	}
	});

	// given a URL, extract the origin. Taken from: https://github.com/firebase/firebase-simple-login/blob/d2cb95b9f812d8488bdbfba51c3a7c153ba1a074/js/src/simple-login/transports/WinChan.js#L25-L30
	function extractOrigin(url) {
	  if (!/^https?:\/\//.test(url)) url = window.location.href;
	  var m = /^(https?:\/\/[-_a-zA-Z.0-9:]+)/.exec(url);
	  if (m) return m[1];
	  return url;
	}

	var urlHelper = {
	  extractOrigin: extractOrigin
	};

	/* eslint-disable no-restricted-syntax */

	function PopupHandler() {
	  this._current_popup = null;
	}

	PopupHandler.prototype.calculatePosition = function(options) {
	  var width = options.width || 500;
	  var height = options.height || 600;
	  var _window = windowHelper.getWindow();

	  var screenX =
	    typeof _window.screenX !== 'undefined'
	      ? _window.screenX
	      : _window.screenLeft;
	  var screenY =
	    typeof _window.screenY !== 'undefined'
	      ? _window.screenY
	      : _window.screenTop;

	  var outerWidth =
	    typeof _window.outerWidth !== 'undefined'
	      ? _window.outerWidth
	      : _window.document.body.clientWidth;

	  var outerHeight =
	    typeof _window.outerHeight !== 'undefined'
	      ? _window.outerHeight
	      : _window.document.body.clientHeight;

	  var left = options.left || screenX + (outerWidth - width) / 2;
	  var top = options.top || screenY + (outerHeight - height) / 2;

	  return { width: width, height: height, left: left, top: top };
	};

	PopupHandler.prototype.preload = function(options) {
	  var _this = this;
	  var _window = windowHelper.getWindow();
	  var popupPosition = this.calculatePosition(options.popupOptions || {});
	  var popupOptions = objectHelper
	    .merge(popupPosition)
	    .with(options.popupOptions);
	  var url = options.url || 'about:blank';
	  var windowFeatures = lib.stringify(popupOptions, {
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
	  var popupOptions = objectHelper
	    .merge(popupPosition)
	    .with(options.popupOptions);

	  var winchanOptions = objectHelper
	    .merge({
	      url: url,
	      relay_url: relayUrl,
	      window_features: lib.stringify(popupOptions, {
	        delimiter: ',',
	        encode: false
	      }),
	      popup: this._current_popup
	    })
	    .with(options);

	  var popup = winchan.open(winchanOptions, function(err, data) {
	    // Ignores messages sent by browser extensions.
	    if (err && err.name === 'SyntaxError') {
	      return;
	    }
	    _this._current_popup = null;
	    return cb(err, data);
	  });

	  popup.focus();

	  return popup;
	};

	/**
	 * @class
	 * @classdesc This class cannot be instantiated directly. Instead, use WebAuth.popup
	 * @hideconstructor
	 */
	function Popup(webAuth, options) {
	  this.baseOptions = options;
	  this.baseOptions.popupOrigin = options.popupOrigin;
	  this.client = webAuth.client;
	  this.webAuth = webAuth;

	  this.transactionManager = new TransactionManager(this.baseOptions);
	  this.crossOriginAuthentication = new CrossOriginAuthentication(
	    webAuth,
	    this.baseOptions
	  );
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
	 * @memberof Popup.prototype
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
	 * @memberof Popup.prototype
	 */
	Popup.prototype.callback = function(options) {
	  var _this = this;
	  var theWindow = windowHelper.getWindow();
	  options = options || {};
	  var originUrl =
	    options.popupOrigin ||
	    this.baseOptions.popupOrigin ||
	    windowHelper.getOrigin();

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

	  winchan.onOpen(function(popupOrigin, r, cb) {
	    if (popupOrigin !== originUrl) {
	      return cb({
	        error: 'origin_mismatch',
	        error_description:
	          "The popup's origin (" +
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
	 * @param {String} [options.clientID] the Client ID found on your Application settings page
	 * @param {String} options.redirectUri url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} options.responseType type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
	 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
	 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
	 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @param {String} [options.organization] the Id of an organization to log in to
	 * @param {String} [options.invitation] the ID of an invitation to accept. This is available from the user invitation URL that is given when participating in a user invitation flow
	 * @param {Boolean} [options.owp] determines if Auth0 should render the relay page or not and the caller is responsible of handling the response.
	 * @param {authorizeCallback} cb
	 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
	 * @memberof Popup.prototype
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
	      'nonce',
	      'organization',
	      'invitation'
	    ])
	    .with(objectHelper.blacklist(options, ['popupHandler']));

	  assert.check(
	    params,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      responseType: {
	        type: 'string',
	        message: 'responseType option is required'
	      }
	    }
	  );

	  // the relay page should not be necessary as long it happens in the same domain
	  // (a redirectUri shoul be provided). It is necessary when using OWP
	  relayUrl = urlJoin(this.baseOptions.rootUrl, 'relay.html');

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
	    popOpts.popupOptions = objectHelper.pick(options.popupOptions, [
	      'width',
	      'height',
	      'top',
	      'left'
	    ]);
	  }

	  if (pluginHandler) {
	    params = pluginHandler.processParams(params);
	  }

	  params = this.transactionManager.process(params);
	  params.scope = params.scope || 'openid profile email';
	  delete params.domain;

	  url = this.client.buildAuthorizeUrl(params);

	  popup = this.getPopupHandler(options);

	  return popup.load(
	    url,
	    relayUrl,
	    popOpts,
	    wrapCallback(cb, { keepOriginalCasing: true })
	  );
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
	 * @memberof Popup.prototype
	 */
	Popup.prototype.loginWithCredentials = function (options, cb) {
	  options.realm = options.realm || options.connection;
	  options.popup = true;
	  options = objectHelper
	    .merge(this.baseOptions, [
	      'redirectUri',
	      'responseType',
	      'state',
	      'nonce',
	      'timeout'
	    ])
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
	 * @memberof Popup.prototype
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
	 * @memberof Popup.prototype
	 */
	Popup.prototype.signupAndLogin = function(options, cb) {
	  var _this = this;

	  return this.client.dbConnection.signup(options, function(err) {
	    if (err) {
	      return cb(err);
	    }
	    _this.loginWithCredentials(options, cb);
	  });
	};

	function SilentAuthenticationHandler(options) {
	  this.authenticationUrl = options.authenticationUrl;
	  this.timeout = options.timeout || 60 * 1000;
	  this.handler = null;
	  this.postMessageDataType = options.postMessageDataType || false;

	  // prefer origin from options, fallback to origin from browser, and some browsers (for example MS Edge) don't support origin; fallback to construct origin manually
	  this.postMessageOrigin =
	    options.postMessageOrigin ||
	    windowHelper.getWindow().location.origin ||
	    windowHelper.getWindow().location.protocol +
	      '//' +
	      windowHelper.getWindow().location.hostname +
	      (windowHelper.getWindow().location.port
	        ? ':' + windowHelper.getWindow().location.port
	        : '');
	}

	SilentAuthenticationHandler.create = function(options) {
	  return new SilentAuthenticationHandler(options);
	};

	SilentAuthenticationHandler.prototype.login = function(
	  usePostMessage,
	  callback
	) {
	  this.handler = new IframeHandler({
	    auth0: this.auth0,
	    url: this.authenticationUrl,
	    eventListenerType: usePostMessage ? 'message' : 'load',
	    callback: this.getCallbackHandler(callback, usePostMessage),
	    timeout: this.timeout,
	    eventValidator: this.getEventValidator(),
	    timeoutCallback: function() {
	      callback(
	        null,
	        '#error=timeout&error_description=Timeout+during+authentication+renew.'
	      );
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
	            eventData.event.data.type &&
	            eventData.event.data.type === _this.postMessageDataType
	          );

	        case 'load':
	          if (
	            eventData.sourceObject.contentWindow.location.protocol === 'about:'
	          ) {
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

	SilentAuthenticationHandler.prototype.getCallbackHandler = function(
	  callback,
	  usePostMessage
	) {
	  return function(eventData) {
	    var callbackValue;
	    if (!usePostMessage) {
	      callbackValue = eventData.sourceObject.contentWindow.location.hash;
	    } else if (
	      typeof eventData.event.data === 'object' &&
	      eventData.event.data.hash
	    ) {
	      callbackValue = eventData.event.data.hash;
	    } else {
	      callbackValue = eventData.event.data;
	    }
	    callback(null, callbackValue);
	  };
	};

	function UsernamePassword(options) {
	  this.baseOptions = options;
	  this.request = new RequestBuilder(options);
	  this.transactionManager = new TransactionManager(this.baseOptions);
	}

	UsernamePassword.prototype.login = function(options, cb) {
	  var url;
	  var body;

	  url = urlJoin(this.baseOptions.rootUrl, 'usernamepassword', 'login');

	  options.username = options.username || options.email; // eslint-disable-line

	  options = objectHelper.blacklist(options, ['email', 'onRedirecting']); // eslint-disable-line

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

	  return this.request
	    .post(url)
	    .send(body)
	    .end(wrapCallback(cb));
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

	function HostedPages(client, options) {
	  this.baseOptions = options;
	  this.client = client;
	  this.baseOptions.universalLoginPage = true;
	  this.request = new RequestBuilder(this.baseOptions);

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
	 * @param {String} [result.refreshToken] token that can be used to get new access tokens from Auth0. Note that not all Auth0 Applications can request them or the resource server might not allow them.
	 * @ignore
	 */

	/**
	 * @callback onRedirectingCallback
	 * @param {function} done Must be called when finished so that authentication can be resumed
	 * @ignore
	 */

	/**
	 * Performs authentication with username/email and password with a database connection
	 *
	 * This method is not compatible with API Auth so if you need to fetch API tokens with audience
	 * you should use {@link authorize} or {@link login}.
	 *
	 * @method login
	 * @param {Object} options
	 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} [options.responseType] type of the response used. It can be any of the values `code` and `token`
	 * @param {String} [options.responseMode] how the AuthN response is encoded and redirected back to the client. Supported values are `query` and `fragment`
	 * @param {String} [options.scope] scopes to be requested during AuthN. e.g. `openid email`
	 * @param {onRedirectingCallback} [options.onRedirecting] Hook function that is called before redirecting to /authorize, allowing you to handle custom code. You must call the `done` function to resume authentication.
	 * @param {credentialsCallback} cb
	 * @ignore
	 */
	HostedPages.prototype.login = function(options, cb) {
	  if (windowHelper.getWindow().location.host !== this.baseOptions.domain) {
	    throw new Error(
	      'This method is meant to be used only inside the Universal Login Page.'
	    );
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
	      responseType: {
	        type: 'string',
	        message: 'responseType option is required'
	      }
	    }
	  );

	  usernamePassword = new UsernamePassword(this.baseOptions);

	  return usernamePassword.login(params, function(err, data) {
	    if (err) {
	      return cb(err);
	    }

	    function doAuth() {
	      usernamePassword.callback(data);
	    }

	    if (typeof options.onRedirecting === 'function') {
	      return options.onRedirecting(function() {
	        doAuth();
	      });
	    }

	    doAuth();
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
	 * @ignore
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

	HostedPages.prototype.getSSOData = function(withActiveDirectories, cb) {
	  var url;
	  var params = '';

	  if (typeof withActiveDirectories === 'function') {
	    cb = withActiveDirectories;
	    withActiveDirectories = false;
	  }

	  assert.check(withActiveDirectories, {
	    type: 'boolean',
	    message: 'withActiveDirectories parameter is not valid'
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  if (withActiveDirectories) {
	    params =
	      '?' +
	      lib.stringify({
	        ldaps: 1,
	        client_id: this.baseOptions.clientID
	      });
	  }

	  url = urlJoin(this.baseOptions.rootUrl, 'user', 'ssodata', params);

	  return this.request
	    .get(url, { noHeaders: true })
	    .withCredentials()
	    .end(wrapCallback(cb));
	};

	// eslint-disable-next-line no-unused-vars

	var noop = function() {};

	var RECAPTCHA_V2_PROVIDER = 'recaptcha_v2';
	var RECAPTCHA_ENTERPRISE_PROVIDER = 'recaptcha_enterprise';
	var AUTH0_PROVIDER = 'auth0';

	var defaults$2 = {
	  lang: 'en',
	  templates: {
	    auth0: function(challenge) {
	      var message =
	        challenge.type === 'code'
	          ? 'Enter the code shown above'
	          : 'Solve the formula shown above';
	      return (
	        '<div class="captcha-challenge">\n' +
	        '  <img src="' +
	        challenge.image +
	        '" />\n' +
	        '  <button type="button" class="captcha-reload">↺</button>\n' +
	        '</div>\n' +
	        '<input type="text" name="captcha"\n' +
	        '  class="form-control captcha-control"\n' +
	        '  placeholder="' +
	        message +
	        '" />'
	      );
	    },
	    recaptcha_v2: function() {
	      return '<div class="recaptcha" ></div><input type="hidden" name="captcha" />';
	    },
	    recaptcha_enterprise: function() {
	      return '<div class="recaptcha" ></div><input type="hidden" name="captcha" />';
	    },
	    error: function() {
	      return '<div class="error" style="color: red;">Error getting the bot detection challenge. Please contact the system administrator.</div>';
	    }
	  }
	};

	function handleAuth0Provider(element, options, challenge, load) {
	  element.innerHTML = options.templates[challenge.provider](challenge);
	  element
	    .querySelector('.captcha-reload')
	    .addEventListener('click', function(e) {
	      e.preventDefault();
	      load();
	    });
	}

	function globalForRecaptchaProvider(provider) {
	  switch (provider) {
	    case RECAPTCHA_V2_PROVIDER:
	      return window.grecaptcha;
	    case RECAPTCHA_ENTERPRISE_PROVIDER:
	      return window.grecaptcha.enterprise;
	    /* istanbul ignore next */

	    default:
	      throw new Error('Unknown captcha provider');
	  }
	}

	function scriptForRecaptchaProvider(provider, lang, callback) {
	  switch (provider) {
	    case RECAPTCHA_V2_PROVIDER:
	      return (
	        'https://www.recaptcha.net/recaptcha/api.js?hl=' +
	        lang +
	        '&onload=' +
	        callback
	      );
	    case RECAPTCHA_ENTERPRISE_PROVIDER:
	      return (
	        'https://www.recaptcha.net/recaptcha/enterprise.js?render=explicit&hl=' +
	        lang +
	        '&onload=' +
	        callback
	      );
	    /* istanbul ignore next */
	    default:
	      throw new Error('Unknown captcha provider');
	  }
	}

	function injectRecaptchaScript(element, opts, callback) {
	  var callbackName = 'recaptchaCallback_' + Math.floor(Math.random() * 1000001);
	  window[callbackName] = function() {
	    delete window[callbackName];
	    callback();
	  };
	  var script = window.document.createElement('script');
	  script.src = scriptForRecaptchaProvider(
	    opts.provider,
	    opts.lang,
	    callbackName
	  );
	  script.async = true;
	  window.document.body.appendChild(script);
	}

	function handleRecaptchaProvider(element, options, challenge) {
	  var widgetId =
	    element.hasAttribute('data-wid') && element.getAttribute('data-wid');

	  function setValue(value) {
	    var input = element.querySelector('input[name="captcha"]');
	    input.value = value || '';
	  }

	  if (widgetId) {
	    setValue();
	    globalForRecaptchaProvider(challenge.provider).reset(widgetId);
	    return;
	  }

	  element.innerHTML = options.templates[challenge.provider](challenge);

	  var recaptchaDiv = element.querySelector('.recaptcha');

	  injectRecaptchaScript(
	    element,
	    { lang: options.lang, provider: challenge.provider },
	    function() {
	      var global = globalForRecaptchaProvider(challenge.provider);
	      widgetId = global.render(recaptchaDiv, {
	        callback: setValue,
	        'expired-callback': function() {
	          setValue();
	        },
	        'error-callback': function() {
	          setValue();
	        },
	        sitekey: challenge.siteKey
	      });
	      element.setAttribute('data-wid', widgetId);
	    }
	  );
	}

	/**
	 *
	 * Renders the captcha challenge in the provided element.
	 *
	 * @param {Authentication} auth0Client The challenge response from the authentication server
	 * @param {HTMLElement} element The element where the captcha needs to be rendered
	 * @param {Object} options The configuration options for the captcha
	 * @param {Object} [options.templates] An object containaing templates for each captcha provider
	 * @param {Function} [options.templates.auth0] template function receiving the challenge and returning a string
	 * @param {Function} [options.templates.recaptcha_v2] template function receiving the challenge and returning a string
	 * @param {Function} [options.templates.recaptcha_enterprise] template function receiving the challenge and returning a string
	 * @param {Function} [options.templates.error] template function returning a custom error message when the challenge could not be fetched, receives the error as first argument
	 * @param {String} [options.lang=en] the ISO code of the language for recaptcha
	 * @param {Function} [callback] an optional callback function
	 * @ignore
	 */
	function render(auth0Client, element, options, callback) {
	  options = objectHelper.merge(defaults$2).with(options || {});

	  function load(done) {
	    done = done || noop;
	    auth0Client.getChallenge(function(err, challenge) {
	      if (err) {
	        element.innerHTML = options.templates.error(err);
	        return done(err);
	      }
	      if (!challenge.required) {
	        element.style.display = 'none';
	        element.innerHTML = '';
	        return;
	      }
	      element.style.display = '';
	      if (challenge.provider === AUTH0_PROVIDER) {
	        handleAuth0Provider(element, options, challenge, load);
	      } else if (
	        challenge.provider === RECAPTCHA_V2_PROVIDER ||
	        challenge.provider === RECAPTCHA_ENTERPRISE_PROVIDER
	      ) {
	        handleRecaptchaProvider(element, options, challenge);
	      }
	      done();
	    });
	  }

	  function getValue() {
	    var captchaInput = element.querySelector('input[name="captcha"]');
	    if (!captchaInput) {
	      return;
	    }
	    return captchaInput.value;
	  }

	  load(callback);

	  return {
	    reload: load,
	    getValue: getValue
	  };
	}

	/**
	 *
	 * Renders the passwordless captcha challenge in the provided element.
	 *
	 * @param {Authentication} auth0Client The challenge response from the authentication server
	 * @param {HTMLElement} element The element where the captcha needs to be rendered
	 * @param {Object} options The configuration options for the captcha
	 * @param {Object} [options.templates] An object containaing templates for each captcha provider
	 * @param {Function} [options.templates.auth0] template function receiving the challenge and returning a string
	 * @param {Function} [options.templates.recaptcha_v2] template function receiving the challenge and returning a string
	 * @param {Function} [options.templates.recaptcha_enterprise] template function receiving the challenge and returning a string
	 * @param {Function} [options.templates.error] template function returning a custom error message when the challenge could not be fetched, receives the error as first argument
	 * @param {String} [options.lang=en] the ISO code of the language for recaptcha
	 * @param {Function} [callback] an optional callback function
	 * @ignore
	 */
	function renderPasswordless(auth0Client, element, options, callback) {
	  options = objectHelper.merge(defaults$2).with(options || {});

	  function load(done) {
	    done = done || noop;
	    auth0Client.passwordless.getChallenge(function(err, challenge) {
	      if (err) {
	        element.innerHTML = options.templates.error(err);
	        return done(err);
	      }
	      if (!challenge.required) {
	        element.style.display = 'none';
	        element.innerHTML = '';
	        return;
	      }
	      element.style.display = '';
	      if (challenge.provider === AUTH0_PROVIDER) {
	        handleAuth0Provider(element, options, challenge, load);
	      } else if (
	        challenge.provider === RECAPTCHA_V2_PROVIDER ||
	        challenge.provider === RECAPTCHA_ENTERPRISE_PROVIDER
	      ) {
	        handleRecaptchaProvider(element, options, challenge);
	      }
	      done();
	    });
	  }

	  function getValue() {
	    var captchaInput = element.querySelector('input[name="captcha"]');
	    if (!captchaInput) {
	      return;
	    }
	    return captchaInput.value;
	  }

	  load(callback);

	  return {
	    reload: load,
	    getValue: getValue,
	  };
	}

	var captcha = { render: render, renderPasswordless: renderPasswordless };

	function defaultClock() {
	  return new Date();
	}

	/**
	 * Handles all the browser's AuthN/AuthZ flows
	 * @constructor
	 * @param {Object} options
	 * @param {String} options.domain your Auth0 domain
	 * @param {String} options.clientID the Client ID found on your Application settings page
	 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
	 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @param {Number} [options.leeway] number of seconds to account for clock skew when validating time-based claims in ID tokens. Defaults to 60 seconds.
	 * @param {Number} [options.maxAge] maximum elapsed time in seconds since the last time the user was actively authenticated by the authorization server.
	 * @param {Number} [options.stateExpiration] number of minutes for the stored state to be kept. Defaults to 30 minutes.
	 * @param {String} [options.organization] the Id of an organization to log in to
	 * @param {String} [options.invitation] the ID of an invitation to accept. This is available from the user invitation URL that is given when participating in a user invitation flow
	 * @param {Array} [options.plugins]
	 * @param {Boolean} [options.legacySameSiteCookie] set this to `false` to disable the legacy compatibility cookie that is created for older browsers that don't support the SameSite attribute (defaults to `true`)
	 * @param {Number} [options._timesToRetryFailedRequests] Number of times to retry a failed request, according to {@link https://github.com/visionmedia/superagent/blob/master/lib/request-base.js}
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
	      responseType: {
	        optional: true,
	        type: 'string',
	        message: 'responseType is not valid'
	      },
	      responseMode: {
	        optional: true,
	        type: 'string',
	        message: 'responseMode is not valid'
	      },
	      redirectUri: {
	        optional: true,
	        type: 'string',
	        message: 'redirectUri is not valid'
	      },
	      scope: { optional: true, type: 'string', message: 'scope is not valid' },
	      audience: {
	        optional: true,
	        type: 'string',
	        message: 'audience is not valid'
	      },
	      popupOrigin: {
	        optional: true,
	        type: 'string',
	        message: 'popupOrigin is not valid'
	      },
	      leeway: {
	        optional: true,
	        type: 'number',
	        message: 'leeway is not valid'
	      },
	      plugins: {
	        optional: true,
	        type: 'array',
	        message: 'plugins is not valid'
	      },
	      maxAge: {
	        optional: true,
	        type: 'number',
	        message: 'maxAge is not valid'
	      },
	      stateExpiration: {
	        optional: true,
	        type: 'number',
	        message: 'stateExpiration is not valid'
	      },
	      legacySameSiteCookie: {
	        optional: true,
	        type: 'boolean',
	        message: 'legacySameSiteCookie option is not valid'
	      },
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
	        __tenant: {
	          optional: true,
	          type: 'string',
	          message: '__tenant option is required'
	        },
	        __token_issuer: {
	          optional: true,
	          type: 'string',
	          message: '__token_issuer option is required'
	        },
	        __jwks_uri: {
	          optional: true,
	          type: 'string',
	          message: '__jwks_uri is required'
	        }
	      }
	    );
	  }
	  /* eslint-enable */

	  this.baseOptions = options;
	  this.baseOptions.plugins = new PluginHandler(
	    this,
	    this.baseOptions.plugins || []
	  );

	  this.baseOptions._sendTelemetry =
	    this.baseOptions._sendTelemetry === false
	      ? this.baseOptions._sendTelemetry
	      : true;

	  this.baseOptions._timesToRetryFailedRequests =
	    options._timesToRetryFailedRequests
	      ? parseInt(options._timesToRetryFailedRequests)
	      : 0;

	  this.baseOptions.tenant =
	    (this.baseOptions.overrides && this.baseOptions.overrides.__tenant) ||
	    this.baseOptions.domain.split('.')[0];

	  this.baseOptions.token_issuer =
	    (this.baseOptions.overrides && this.baseOptions.overrides.__token_issuer) ||
	    'https://' + this.baseOptions.domain + '/';

	  this.baseOptions.jwksURI =
	    this.baseOptions.overrides && this.baseOptions.overrides.__jwks_uri;

	  if (options.legacySameSiteCookie !== false) {
	    this.baseOptions.legacySameSiteCookie = true;
	  }

	  this.transactionManager = new TransactionManager(this.baseOptions);

	  this.client = new Authentication(this.baseOptions);

	  /** @member {Redirect} */
	  this.redirect = new Redirect(this, this.baseOptions);

	  /** @member {Popup} */
	  this.popup = new Popup(this, this.baseOptions);

	  this.crossOriginAuthentication = new CrossOriginAuthentication(
	    this,
	    this.baseOptions
	  );

	  this.webMessageHandler = new WebMessageHandler(this);
	  this._universalLogin = new HostedPages(this, this.baseOptions);
	  this.ssodataStorage = new SSODataStorage(this.baseOptions);
	}

	/**
	 * Parse the url hash and extract the Auth response from a Auth flow started with {@link authorize}
	 *
	 * Only validates id_tokens signed by Auth0 using the RS256 algorithm using the public key exposed
	 * by the `/.well-known/jwks.json` endpoint of your account.
	 * Tokens signed with the HS256 algorithm cannot be properly validated.
	 * Instead, a call to {@link userInfo} will be made with the parsed `access_token`.
	 * If the {@link userInfo} call fails, the {@link userInfo} error will be passed to the callback.
	 * Tokens signed with other algorithms will not be accepted.
	 *
	 * @example
	 * auth0.parseHash({ hash: window.location.hash }, function(err, authResult) {
	 *   if (err) {
	 *     return console.log(err);
	 *   }

	 *   // The contents of authResult depend on which authentication parameters were used.
	 *   // It can include the following:
	 *   // authResult.accessToken - access token for the API specified by `audience`
	 *   // authResult.expiresIn - string with the access token's expiration time in seconds
	 *   // authResult.idToken - ID token JWT containing user profile information

	 *   auth0.client.userInfo(authResult.accessToken, function(err, user) {
	 *     // Now you have the user's information
	 *   });
	 *});
	 * @method parseHash
	 * @param {Object} options
	 * @param {String} options.hash the url hash. If not provided it will extract from window.location.hash
	 * @param {String} [options.state] value originally sent in `state` parameter to {@link authorize} to mitigate XSRF
	 * @param {String} [options.nonce] value originally sent in `nonce` parameter to {@link authorize} to prevent replay attacks
	 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `token`, `id_token`. For this specific method, we'll only use this value to check if the hash contains the tokens requested in the responseType.
	 * @param {authorizeCallback} cb
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.parseHash = function (options, cb) {
	  var parsedQs;
	  var err;

	  if (!cb && typeof options === 'function') {
	    cb = options;
	    options = {};
	  } else {
	    options = options || {};
	  }

	  var hashStr =
	    options.hash === undefined
	      ? windowHelper.getWindow().location.hash
	      : options.hash;
	  hashStr = hashStr.replace(/^#?\/?/, '');

	  parsedQs = lib.parse(hashStr);

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
	  var responseTypes = (
	    this.baseOptions.responseType ||
	    options.responseType ||
	    ''
	  ).split(' ');
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
	 * Tokens signed with the HS256 algorithm cannot be properly validated.
	 * Instead, a call to {@link userInfo} will be made with the parsed `access_token`.
	 * If the {@link userInfo} call fails, the {@link userInfo} error will be passed to the callback.
	 * Tokens signed with other algorithms will not be accepted.
	 *
	 * @method validateAuthenticationResponse
	 * @param {Object} options
	 * @param {String} options.hash the url hash. If not provided it will extract from window.location.hash
	 * @param {String} [options.state] value originally sent in `state` parameter to {@link authorize} to mitigate XSRF
	 * @param {String} [options.nonce] value originally sent in `nonce` parameter to {@link authorize} to prevent replay attacks
	 * @param {Object} parsedHash an object that represents the parsed hash
	 * @param {authorizeCallback} cb
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.validateAuthenticationResponse = function (
	  options,
	  parsedHash,
	  cb
	) {
	  var _this = this;

	  options.__enableIdPInitiatedLogin =
	    options.__enableIdPInitiatedLogin || options.__enableImpersonation;

	  var state = parsedHash.state;
	  var transaction = this.transactionManager.getStoredTransaction(state);

	  var transactionState =
	    options.state || (transaction && transaction.state) || null;

	  var transactionStateMatchesState = transactionState === state;

	  var shouldBypassStateChecking =
	    !state && !transactionState && options.__enableIdPInitiatedLogin;

	  if (!shouldBypassStateChecking && !transactionStateMatchesState) {
	    return cb({
	      error: 'invalid_token',
	      errorDescription: '`state` does not match.'
	    });
	  }

	  var transactionNonce =
	    options.nonce || (transaction && transaction.nonce) || null;

	  var transactionOrganization = transaction && transaction.organization;
	  var appState = options.state || (transaction && transaction.appState) || null;

	  var callback = function (err, payload) {
	    if (err) {
	      return cb(err);
	    }

	    if (transaction && transaction.lastUsedConnection) {
	      var sub;

	      if (payload) {
	        sub = payload.sub;
	      }

	      _this.ssodataStorage.set(transaction.lastUsedConnection, sub);
	    }

	    return cb(null, buildParseHashResponse(parsedHash, appState, payload));
	  };

	  if (!parsedHash.id_token) {
	    return callback(null, null);
	  }

	  return this.validateToken(
	    parsedHash.id_token,
	    transactionNonce,
	    function (validationError, payload) {
	      if (!validationError) {
	        // Verify the organization
	        if (transactionOrganization) {
	          if (!payload.org_id) {
	            return callback(
	              error.invalidToken(
	                'Organization Id (org_id) claim must be a string present in the ID token'
	              )
	            );
	          }

	          if (payload.org_id !== transactionOrganization) {
	            return callback(
	              error.invalidToken(
	                'Organization Id (org_id) claim value mismatch in the ID token; expected "' +
	                  transactionOrganization +
	                  '", found "' +
	                  payload.org_id +
	                  '"'
	              )
	            );
	          }
	        }

	        if (!parsedHash.access_token) {
	          return callback(null, payload);
	        }

	        // id_token's generated by non-oidc applications don't have at_hash
	        if (!payload.at_hash) {
	          return callback(null, payload);
	        }

	        // here we're absolutely sure that the id_token's alg is RS256
	        // and that the id_token is valid, so we can check the access_token
	        return new M().validateAccessToken(
	          parsedHash.access_token,
	          'RS256',
	          payload.at_hash,
	          function (err) {
	            if (err) {
	              return callback(error.invalidToken(err.message));
	            }
	            return callback(null, payload);
	          }
	        );
	      }

	      if (
	        validationError.error !== 'invalid_token' ||
	        (validationError.errorDescription &&
	          validationError.errorDescription.indexOf(
	            'Nonce (nonce) claim value mismatch in the ID token'
	          ) > -1)
	      ) {
	        return callback(validationError);
	      }

	      // if it's an invalid_token error, decode the token
	      var decodedToken = new M().decode(parsedHash.id_token);

	      // if the alg is not HS256, return the raw error
	      if (decodedToken.header.alg !== 'HS256') {
	        return callback(validationError);
	      }

	      if ((decodedToken.payload.nonce || null) !== transactionNonce) {
	        return callback({
	          error: 'invalid_token',
	          errorDescription:
	            'Nonce (nonce) claim value mismatch in the ID token; expected "' +
	            transactionNonce +
	            '", found "' +
	            decodedToken.payload.nonce +
	            '"'
	        });
	      }

	      if (!parsedHash.access_token) {
	        var noAccessTokenError = {
	          error: 'invalid_token',
	          description:
	            'The id_token cannot be validated because it was signed with the HS256 algorithm and public clients (like a browser) can’t store secrets. Please read the associated doc for possible ways to fix this. Read more: https://auth0.com/docs/errors/libraries/auth0-js/invalid-token#parsing-an-hs256-signed-id-token-without-an-access-token'
	        };
	        return callback(noAccessTokenError);
	      }

	      // if the alg is HS256, use the /userinfo endpoint to build the payload
	      return _this.client.userInfo(
	        parsedHash.access_token,
	        function (errUserInfo, profile) {
	          // if the /userinfo request fails, use the validationError instead
	          if (errUserInfo) {
	            return callback(errUserInfo);
	          }
	          return callback(null, profile);
	        }
	      );
	    }
	  );
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
	WebAuth.prototype.validateToken = function (token, nonce, cb) {
	  var verifier = new M({
	    issuer: this.baseOptions.token_issuer,
	    jwksURI: this.baseOptions.jwksURI,
	    audience: this.baseOptions.clientID,
	    leeway: this.baseOptions.leeway || 60,
	    maxAge: this.baseOptions.maxAge,
	    __clock: this.baseOptions.__clock || defaultClock
	  });

	  verifier.verify(token, nonce, function (err, payload) {
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
	 * @param {Object} [options]
	 * @param {String} [options.clientID] the Client ID found on your Application settings page
	 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
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
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.renewAuth = function (options, cb) {
	  var handler;
	  var usePostMessage = !!options.usePostMessage;
	  var postMessageDataType = options.postMessageDataType || false;
	  var postMessageOrigin =
	    options.postMessageOrigin || windowHelper.getWindow().origin;
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

	  assert.check(params, {
	    type: 'object',
	    message: 'options parameter is not valid'
	  });
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

	  handler.login(usePostMessage, function (err, hash) {
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
	 * Allows you to acquire a new token from Auth0 for a user who already
	 * has an SSO session established against Auth0 for your domain. 
	 * If the user is not authenticated, the authentication result will be empty 
	 * and you'll receive an error like this: `{error: 'login_required'}`.
	 * The method accepts any valid OAuth2 parameters that would normally be sent to `/authorize`.
	 * 
	 * Everything happens inside an iframe, so it will not reload your application or redirect away from it.
	 * 
	 * **Important:** If you're not using the hosted login page to do social logins, 
	 * you have to use your own [social connection keys](https://manage.auth0.com/#/connections/social). 
	 * If you use Auth0's dev keys, you'll always get `login_required` as an error when calling `checkSession`.
	 *
	 * **Important:** Because there is no redirect in this method, `responseType: 'code'` is not supported and will throw an error.

	 * Remember to add the URL where the authorization request originates from to the Allowed Web Origins list of your Auth0 Application in the [Dashboard](https://manage.auth0.com/) under your Applications's **Settings**.
	 * @example
	 * auth0.checkSession({
	 *   audience: 'https://mystore.com/api/v2',
	 *   scope: 'read:order write:order'
	 * },
	 * function(err, authResult) {
	 *   // Authentication tokens or error
	 * });
	 * 
	 * @method checkSession
	 * @param {Object} [options]
	 * @param {String} [options.clientID] the Client ID found on your Application settings page
	 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
	 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
	 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @param {String} [options.timeout] value in milliseconds used to timeout when the `/authorize` call is failing as part of the silent authentication with postmessage enabled due to a configuration.
	 * @param {checkSessionCallback} cb
	 * @see {@link https://auth0.com/docs/libraries/auth0js/v9#using-checksession-to-acquire-new-tokens}
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.checkSession = function (options, cb) {
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
	    return cb({
	      error: 'error',
	      error_description: "responseType can't be `code`"
	    });
	  }

	  if (!options.nonce) {
	    params = this.transactionManager.process(params);
	  }

	  if (!params.redirectUri) {
	    return cb({
	      error: 'error',
	      error_description: "redirectUri can't be empty"
	    });
	  }

	  assert.check(params, {
	    type: 'object',
	    message: 'options parameter is not valid'
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  params = objectHelper.blacklist(params, [
	    'usePostMessage',
	    'tenant',
	    'postMessageDataType'
	  ]);
	  this.webMessageHandler.run(
	    params,
	    wrapCallback(cb, { forceLegacyError: true, ignoreCasing: true })
	  );
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
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.changePassword = function (options, cb) {
	  return this.client.dbConnection.changePassword(options, cb);
	};

	/**
	 * Starts a passwordless authentication transaction.
	 *
	 * @method passwordlessStart
	 * @param {Object} options
	 * @param {String} options.send what will be sent via email which could be `link` or `code`. For SMS `code` is the only one valid
	 * @param {String} [options.phoneNumber] phone number where to send the `code`. This parameter is mutually exclusive with `email`
	 * @param {String} [options.email] email where to send the `code` or `link`. This parameter is mutually exclusive with `phoneNumber`
	 * @param {String} [options.captcha] the attempted solution for the captcha, if one was presented
	 * @param {String} options.connection name of the passwordless connection
	 * @param {Object} [options.authParams] additional Auth parameters when using `link`
	 * @param {Object} [options.xRequestLanguage] value for the X-Request-Language header. If not set, the language is detected using the client browser.
	 * @param {Function} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#passwordless}
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.passwordlessStart = function (options, cb) {
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
	 * @param {String} [options.given_name] The user's given name(s).
	 * @param {String} [options.family_name] The user's family name(s).
	 * @param {String} [options.name] The user's full name.
	 * @param {String} [options.nickname] The user's nickname.
	 * @param {String} [options.picture] A URI pointing to the user's picture.
	 * @param {signUpCallback} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#signup}
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.signup = function (options, cb) {
	  return this.client.dbConnection.signup(options, cb);
	};

	/**
	 * Redirects to the hosted login page (`/authorize`) in order to start a new authN/authZ transaction.
	 * After that, you'll have to use the {@link parseHash} function at the specified `redirectUri`.
	 *
	 * @example
	 * auth0.authorize({
	 *   audience: 'https://mystore.com/api/v2',
	 *   scope: 'read:order write:order',
	 *   responseType: 'token',
	 *   redirectUri: 'https://example.com/auth/callback'
	 *});
	 * @method authorize
	 * @param {Object} [options]
	 * @param {String} [options.clientID] the Client ID found on your Application settings page
	 * @param {String} options.redirectUri url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} options.responseType type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
	 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. The `query` value is only supported when `responseType` is `code`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
	 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
	 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`. Defaults to `openid profile email`.
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @param {String} [options.organization] the Id of an organization to log in to
	 * @param {String} [options.invitation] the ID of an invitation to accept. This is available from the user invitation URL that is given when participating in a user invitation flow
	 * @param {Object} [options.appState] any values that you want back on the authentication response
	 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.authorize = function (options) {
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
	      'nonce',
	      'organization',
	      'invitation'
	    ])
	    .with(options);

	  assert.check(
	    params,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      responseType: {
	        type: 'string',
	        message: 'responseType option is required'
	      }
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
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.signupAndAuthorize = function (options, cb) {
	  var _this = this;

	  return this.client.dbConnection.signup(
	    objectHelper.blacklist(options, ['popupHandler']),
	    function (err) {
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
	 * @callback onRedirectingCallback
	 * @param {function} done Must be called when finished so that authentication can be resumed
	 */

	/**
	 * Logs the user in with username and password using the correct flow based on where it's called from:
	 * - If you're calling this method from the Universal Login Page, it will use the usernamepassword/login endpoint
	 * - If you're calling this method outside the Universal Login Page, it will use the cross origin authentication (/co/authenticate) flow
	 * You can use either `username` or `email` to identify the user, but `username` will take precedence over `email`.
	 * After the redirect to `redirectUri`, use {@link parseHash} to retrieve the authentication data.
	 * **Notice that when using the cross origin authentication flow, some browsers might not be able to successfully authenticate if 3rd party cookies are disabled. [See here for more information.]{@link https://auth0.com/docs/cross-origin-authentication}.**
	 *
	 * @method login
	 * @see Requires [`Implicit` grant]{@link https://auth0.com/docs/api-auth/grant/implicit}. For more information, read {@link https://auth0.com/docs/clients/client-grant-types}.
	 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
	 * @param {String} [options.username] Username (mutually exclusive with email)
	 * @param {String} [options.email] Email (mutually exclusive with username)
	 * @param {String} [options.password] Password
	 * @param {String} [options.realm] Realm used to authenticate the user, it can be a realm name or a database connection name
	 * @param {onRedirectingCallback} [options.onRedirecting] Hook function that is called before redirecting to /authorize, allowing you to handle custom code. You must call the `done` function to resume authentication.
	 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.login = function (options, cb) {
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
	      'nonce',
	      'onRedirecting',
	      'organization',
	      'invitation'
	    ])
	    .with(options);

	  params = this.transactionManager.process(params);

	  var isHostedLoginPage =
	    windowHelper.getWindow().location.host === this.baseOptions.domain;

	  if (isHostedLoginPage) {
	    params.connection = params.realm;
	    delete params.realm;
	    this._universalLogin.login(params, cb);
	  } else {
	    this.crossOriginAuthentication.login(params, cb);
	  }
	};

	/**
	 * @callback onRedirectingCallback
	 * @param {function} done Must be called when finished so that authentication can be resumed
	 */

	/**
	 * Logs in the user by verifying the verification code (OTP) using the cross origin authentication (/co/authenticate) flow. You can use either `phoneNumber` or `email` to identify the user.
	 * This only works when 3rd party cookies are enabled in the browser. After the /co/authenticate call, you'll have to use the {@link parseHash} function at the `redirectUri` specified in the constructor.
	 *
	 * @method passwordlessLogin
	 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
	 * @param {String} options.phoneNumber Phone Number (mutually exclusive with email)
	 * @param {String} options.email Email (mutually exclusive with username)
	 * @param {String} options.verificationCode Verification Code (OTP)
	 * @param {String} options.connection Passwordless connection to use. It can either be 'sms' or 'email'.
	 * @param {onRedirectingCallback} options.onRedirecting Hook function that is called before redirecting to /authorize, allowing you to handle custom code. You must call the `done` function to resume authentication.
	 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.passwordlessLogin = function (options, cb) {
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
	      'nonce',
	      'onRedirecting'
	    ])
	    .with(options);

	  params = this.transactionManager.process(params);

	  var isHostedLoginPage =
	    windowHelper.getWindow().location.host === this.baseOptions.domain;

	  if (isHostedLoginPage) {
	    this.passwordlessVerify(params, cb);
	  } else {
	    var crossOriginOptions = objectHelper.extend(
	      {
	        credentialType: 'http://auth0.com/oauth/grant-type/passwordless/otp',
	        realm: params.connection,
	        username: params.email || params.phoneNumber,
	        otp: params.verificationCode
	      },
	      objectHelper.blacklist(params, [
	        'connection',
	        'email',
	        'phoneNumber',
	        'verificationCode'
	      ])
	    );

	    this.crossOriginAuthentication.login(crossOriginOptions, cb);
	  }
	};

	/**
	 * Runs the callback code for the cross origin authentication call. This method is meant to be called by the cross origin authentication callback url.
	 *
	 * @method crossOriginAuthenticationCallback
	 * @deprecated Use {@link crossOriginVerification} instead.
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.crossOriginAuthenticationCallback = function () {
	  this.crossOriginVerification();
	};

	/**
	 * Runs the callback code for the cross origin authentication call. This method is meant to be called by the cross origin authentication callback url.
	 *
	 * @method crossOriginVerification
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.crossOriginVerification = function () {
	  this.crossOriginAuthentication.callback();
	};

	/**
	 * Redirects to the auth0 logout endpoint
	 *
	 * If you want to navigate the user to a specific URL after the logout, set that URL at the returnTo parameter. The URL should be included in any the appropriate Allowed Logout URLs list:
	 *
	 * - If the client_id parameter is included, the returnTo URL must be listed in the Allowed Logout URLs set at the Auth0 Application level (see Setting Allowed Logout URLs at the App Level).
	 * - If the client_id parameter is NOT included, the returnTo URL must be listed in the Allowed Logout URLs set at the account level (see Setting Allowed Logout URLs at the Account Level).
	 *
	 * @method logout
	 * @param {Object} [options]
	 * @param {String} [options.clientID] the Client ID found on your Application settings page
	 * @param {String} [options.returnTo] URL to be redirected after the logout
	 * @param {Boolean} [options.federated] tells Auth0 if it should logout the user also from the IdP.
	 * @see   {@link https://auth0.com/docs/api/authentication#logout}
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.logout = function (options) {
	  windowHelper.redirect(this.client.buildLogoutUrl(options));
	};

	/**
	 * @callback onRedirectingCallback
	 * @param {function} done Must be called when finished so that authentication can be resumed
	 */

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
	 * @param {String} options.clientID the client ID
	 * @param {onRedirectingCallback} options.onRedirecting Hook function that is called before redirecting to /authorize, allowing you to handle custom code. You must call the `done` function to resume authentication.
	 * @param {Function} cb
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.passwordlessVerify = function (options, cb) {
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
	      'nonce',
	      'onRedirecting'
	    ])
	    .with(options);

	  assert.check(
	    params,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      responseType: {
	        type: 'string',
	        message: 'responseType option is required'
	      }
	    }
	  );

	  params = this.transactionManager.process(params);

	  return this.client.passwordless.verify(params, function (err) {
	    if (err) {
	      return cb(err);
	    }

	    function doAuth() {
	      windowHelper.redirect(_this.client.passwordless.buildVerifyUrl(params));
	    }

	    if (typeof options.onRedirecting === 'function') {
	      return options.onRedirecting(function () {
	        doAuth();
	      });
	    }

	    doAuth();
	  });
	};

	/**
	 *
	 * Renders the captcha challenge in the provided element.
	 * This function can only be used in the context of a Classic Universal Login Page.
	 *
	 * @method renderCaptcha
	 * @param {HTMLElement} element The element where the captcha needs to be rendered
	 * @param {Object} options The configuration options for the captcha
	 * @param {Object} [options.templates] An object containaing templates for each captcha provider
	 * @param {Function} [options.templates.auth0] template function receiving the challenge and returning a string
	 * @param {Function} [options.templates.recaptcha_v2] template function receiving the challenge and returning a string
	 * @param {Function} [options.templates.recaptcha_enterprise] template function receiving the challenge and returning a string
	 * @param {Function} [options.templates.error] template function returning a custom error message when the challenge could not be fetched, receives the error as first argument
	 * @param {String} [options.lang=en] the ISO code of the language for recaptcha
	 * @param {Function} [callback] An optional completion callback
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.renderCaptcha = function (element, options, callback) {
	  return captcha.render(this.client, element, options, callback);
	};

	/**
	 *
	 * Renders the passwordless captcha challenge in the provided element.
	 * This function can only be used in the context of a Classic Universal Login Page.
	 *
	 * @method renderPasswordlessCaptcha
	 * @param {HTMLElement} element The element where the captcha needs to be rendered
	 * @param {Object} options The configuration options for the captcha
	 * @param {Object} [options.templates] An object containaing templates for each captcha provider
	 * @param {Function} [options.templates.auth0] template function receiving the challenge and returning a string
	 * @param {Function} [options.templates.recaptcha_v2] template function receiving the challenge and returning a string
	 * @param {Function} [options.templates.recaptcha_enterprise] template function receiving the challenge and returning a string
	 * @param {Function} [options.templates.error] template function returning a custom error message when the challenge could not be fetched, receives the error as first argument
	 * @param {String} [options.lang=en] the ISO code of the language for recaptcha
	 * @param {Function} [callback] An optional completion callback
	 * @memberof WebAuth.prototype
	 */
	WebAuth.prototype.renderPasswordlessCaptcha = function (element, options, callback) {
	  return captcha.renderPasswordless(this.client, element, options, callback);
	};

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
	      verificationCode: {
	        type: 'string',
	        message: 'verificationCode option is required'
	      },
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

	  qString = lib.stringify(params);

	  return urlJoin(
	    this.baseOptions.rootUrl,
	    'passwordless',
	    'verify_redirect',
	    '?' + qString
	  );
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
	      authParams: {
	        optional: true,
	        type: 'object',
	        message: 'authParams option is required'
	      }
	    }
	  );
	  /* eslint-enable */

	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  url = urlJoin(this.baseOptions.rootUrl, 'passwordless', 'start');

	  var xRequestLanguage = options.xRequestLanguage;
	  delete options.xRequestLanguage;

	  body = objectHelper
	    .merge(this.baseOptions, [
	      'clientID',
	      'responseType',
	      'redirectUri',
	      'scope'
	    ])
	    .with(options);

	  if (body.scope) {
	    body.authParams = body.authParams || {};
	    body.authParams.scope = body.authParams.scope || body.scope;
	  }

	  if (body.redirectUri) {
	    body.authParams = body.authParams || {};
	    body.authParams.redirect_uri =
	      body.authParams.redirectUri || body.redirectUri;
	  }

	  if (body.responseType) {
	    body.authParams = body.authParams || {};
	    body.authParams.response_type =
	      body.authParams.responseType || body.responseType;
	  }

	  delete body.redirectUri;
	  delete body.responseType;
	  delete body.scope;

	  body = objectHelper.toSnakeCase(body, ['auth0Client', 'authParams']);

	  var postOptions = xRequestLanguage
	    ? { xRequestLanguage: xRequestLanguage }
	    : undefined;

	  return this.request
	    .post(url, postOptions)
	    .send(body)
	    .end(wrapCallback(cb));
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
	      verificationCode: {
	        type: 'string',
	        message: 'verificationCode option is required'
	      },
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
	    'auth0Client',
	    'clientID'
	  ]);
	  cleanOption = objectHelper.toSnakeCase(cleanOption, ['auth0Client']);

	  url = urlJoin(this.baseOptions.rootUrl, 'passwordless', 'verify');

	  return this.request
	    .post(url)
	    .send(cleanOption)
	    .end(wrapCallback(cb));
	};

	/**
	 * Makes a call to the `/passwordless/challenge` endpoint
	 * and returns the challenge (captcha) if necessary.
	 *
	 * @method getChallenge
	 * @param {callback} cb
	 * @memberof PasswordlessAuthentication.prototype
	 */
	PasswordlessAuthentication.prototype.getChallenge = function(cb) {
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  if (!this.baseOptions.state) {
	    return cb();
	  }

	  var url = urlJoin(this.baseOptions.rootUrl, 'passwordless', 'challenge');

	  return this.request
	    .post(url)
	    .send({ state: this.baseOptions.state })
	    .end(wrapCallback(cb, { ignoreCasing: true }));
	};

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
	 * @ignore
	 */

	/**
	 * Creates a new user in a Auth0 Database connection
	 *
	 * @method signup
	 * @param {Object} options
	 * @param {String} options.email user email address
	 * @param {String} options.password user password
	 * @param {String} [options.username] user desired username. Required if you use a database connection and you have enabled `Requires Username`
	 * @param {String} [options.given_name] The user's given name(s).
	 * @param {String} [options.family_name] The user's family name(s).
	 * @param {String} [options.name] The user's full name.
	 * @param {String} [options.nickname] The user's nickname.
	 * @param {String} [options.picture] A URI pointing to the user's picture.
	 * @param {String} options.connection name of the connection where the user will be created
	 * @param {Object} [options.user_metadata] additional signup attributes used for creating the user. Will be stored in `user_metadata`
	 * @param {signUpCallback} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#signup}
	 * @ignore
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

	  url = urlJoin(this.baseOptions.rootUrl, 'dbconnections', 'signup');

	  body = objectHelper
	    .merge(this.baseOptions, ['clientID', 'state'])
	    .with(options);

	  metadata = body.user_metadata || body.userMetadata;

	  body = objectHelper.blacklist(body, [
	    'scope',
	    'userMetadata',
	    'user_metadata'
	  ]);

	  body = objectHelper.toSnakeCase(body, ['auth0Client']);

	  if (metadata) {
	    body.user_metadata = metadata;
	  }

	  return this.request
	    .post(url)
	    .send(body)
	    .end(wrapCallback(cb));
	};

	/**
	 * @callback changePasswordCallback
	 * @param {Error} [err] error returned by Auth0 with the reason why the request failed
	 * @ignore
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
	 * @ignore
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

	  url = urlJoin(this.baseOptions.rootUrl, 'dbconnections', 'change_password');

	  body = objectHelper
	    .merge(this.baseOptions, ['clientID'])
	    .with(options, ['email', 'connection']);

	  body = objectHelper.toSnakeCase(body, ['auth0Client']);

	  return this.request
	    .post(url)
	    .send(body)
	    .end(wrapCallback(cb));
	};

	/**
	 * Creates a new Auth0 Authentication API client
	 * @constructor
	 * @param {Object} options
	 * @param {String} options.domain your Auth0 domain
	 * @param {String} options.clientID the Client ID found on your Application settings page
	 * @param {String} [options.redirectUri] url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
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
	      responseType: {
	        optional: true,
	        type: 'string',
	        message: 'responseType is not valid'
	      },
	      responseMode: {
	        optional: true,
	        type: 'string',
	        message: 'responseMode is not valid'
	      },
	      redirectUri: {
	        optional: true,
	        type: 'string',
	        message: 'redirectUri is not valid'
	      },
	      scope: { optional: true, type: 'string', message: 'scope is not valid' },
	      audience: {
	        optional: true,
	        type: 'string',
	        message: 'audience is not valid'
	      },
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
	  this.baseOptions._sendTelemetry =
	    this.baseOptions._sendTelemetry === false
	      ? this.baseOptions._sendTelemetry
	      : true;

	  this.baseOptions.rootUrl =
	    this.baseOptions.domain &&
	    this.baseOptions.domain.toLowerCase().indexOf('http') === 0
	      ? this.baseOptions.domain
	      : 'https://' + this.baseOptions.domain;

	  this.request = new RequestBuilder(this.baseOptions);

	  this.passwordless = new PasswordlessAuthentication(
	    this.request,
	    this.baseOptions
	  );
	  this.dbConnection = new DBConnection(this.request, this.baseOptions);

	  this.warn = new Warn({
	    disableWarnings: !!options._disableDeprecationWarnings
	  });
	  this.ssodataStorage = new SSODataStorage(this.baseOptions);
	}

	/**
	 * Builds and returns the `/authorize` url in order to initialize a new authN/authZ transaction
	 *
	 * @method buildAuthorizeUrl
	 * @param {Object} options
	 * @param {String} [options.clientID] the Client ID found on your Application settings page
	 * @param {String} options.redirectUri url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} options.responseType type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
	 * @param {String} [options.responseMode] how the Auth response is encoded and redirected back to the client. Supported values are `query`, `fragment` and `form_post`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes}
	 * @param {String} [options.state] value used to mitigate XSRF attacks. {@link https://auth0.com/docs/protocols/oauth2/oauth-state}
	 * @param {String} [options.nonce] value used to mitigate replay attacks when using Implicit Grant. {@link https://auth0.com/docs/api-auth/tutorials/nonce}
	 * @param {String} [options.scope] scopes to be requested during Auth. e.g. `openid email`
	 * @param {String} [options.audience] identifier of the resource server who will consume the access token issued after Auth
	 * @see {@link https://auth0.com/docs/api/authentication#authorize-client}
	 * @see {@link https://auth0.com/docs/api/authentication#social}
	 * @memberof Authentication.prototype
	 */
	Authentication.prototype.buildAuthorizeUrl = function(options) {
	  var params;
	  var qString;

	  assert.check(options, {
	    type: 'object',
	    message: 'options parameter is not valid'
	  });

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
	      redirectUri: {
	        optional: true,
	        type: 'string',
	        message: 'redirectUri option is required'
	      },
	      responseType: {
	        type: 'string',
	        message: 'responseType option is required'
	      },
	      nonce: {
	        type: 'string',
	        message: 'nonce option is required',
	        condition: function(o) {
	          return (
	            o.responseType.indexOf('code') === -1 &&
	            o.responseType.indexOf('id_token') !== -1
	          );
	        }
	      },
	      scope: {
	        optional: true,
	        type: 'string',
	        message: 'scope option is required'
	      },
	      audience: {
	        optional: true,
	        type: 'string',
	        message: 'audience option is required'
	      }
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
	    'timeout',
	    'appState'
	  ]);
	  params = objectHelper.toSnakeCase(params, ['auth0Client']);
	  params = parametersWhitelist.oauthAuthorizeParams(this.warn, params);

	  qString = lib.stringify(params);

	  return urlJoin(this.baseOptions.rootUrl, 'authorize', '?' + qString);
	};

	/**
	 * Builds and returns the Logout url in order to initialize a new authN/authZ transaction
	 *
	 * If you want to navigate the user to a specific URL after the logout, set that URL at the returnTo parameter. The URL should be included in any the appropriate Allowed Logout URLs list:
	 *
	 * - If the client_id parameter is included, the returnTo URL must be listed in the Allowed Logout URLs set at the Auth0 Application level (see Setting Allowed Logout URLs at the App Level).
	 * - If the client_id parameter is NOT included, the returnTo URL must be listed in the Allowed Logout URLs set at the account level (see Setting Allowed Logout URLs at the Account Level).
	 * @method buildLogoutUrl
	 * @param {Object} options
	 * @param {String} [options.clientID] the Client ID found on your Application settings page
	 * @param {String} [options.returnTo] URL to be redirected after the logout
	 * @param {Boolean} [options.federated] tells Auth0 if it should logout the user also from the IdP.
	 * @see {@link https://auth0.com/docs/api/authentication#logout}
	 * @memberof Authentication.prototype
	 */
	Authentication.prototype.buildLogoutUrl = function(options) {
	  var params;
	  var qString;

	  assert.check(options, {
	    optional: true,
	    type: 'object',
	    message: 'options parameter is not valid'
	  });

	  params = objectHelper
	    .merge(this.baseOptions, ['clientID'])
	    .with(options || {});

	  // eslint-disable-next-line
	  if (this.baseOptions._sendTelemetry) {
	    params.auth0Client = this.request.getTelemetryData();
	  }

	  params = objectHelper.toSnakeCase(params, ['auth0Client', 'returnTo']);

	  qString = lib.stringify(objectHelper.blacklist(params, ['federated']));
	  if (
	    options &&
	    options.federated !== undefined &&
	    options.federated !== false &&
	    options.federated !== 'false'
	  ) {
	    qString += '&federated';
	  }

	  return urlJoin(this.baseOptions.rootUrl, 'v2', 'logout', '?' + qString);
	};

	/**
	 * @callback authorizeCallback
	 * @param {Error} [err] error returned by Auth0 with the reason of the Auth failure
	 * @param {Object} [result] result of the Auth request. If there is no token available, this value will be null.
	 * @param {String} [result.accessToken] token that allows access to the specified resource server (identified by the audience parameter or by default Auth0's /userinfo endpoint)
	 * @param {Number} [result.expiresIn] number of seconds until the access token expires
	 * @param {String} [result.idToken] token that identifies the user
	 * @param {String} [result.refreshToken] token that can be used to get new access tokens from Auth0. Note that not all Auth0 Applications can request them or the resource server might not allow them.
	 * @param {Object} [result.appState] values that you receive back on the authentication response
	 * @memberof Authentication.prototype
	 */

	/**
	 * @callback tokenCallback
	 * @param {Error} [err] error returned by Auth0 with the reason of the Auth failure
	 * @param {Object} [result] result of the Auth request
	 * @param {String} result.accessToken token that allows access to the specified resource server (identified by the audience parameter or by default Auth0's /userinfo endpoint)
	 * @param {Number} result.expiresIn number of seconds until the access token expires
	 * @param {String} [result.idToken] token that identifies the user
	 * @param {String} [result.refreshToken] token that can be used to get new access tokens from Auth0. Note that not all Auth0 Applications can request them or the resource server might not allow them.
	 * @memberof Authentication.prototype
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
	 * @memberof Authentication.prototype
	 */
	Authentication.prototype.loginWithDefaultDirectory = function(options, cb) {
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      username: { type: 'string', message: 'username option is required' },
	      password: { type: 'string', message: 'password option is required' },
	      scope: {
	        optional: true,
	        type: 'string',
	        message: 'scope option is required'
	      },
	      audience: {
	        optional: true,
	        type: 'string',
	        message: 'audience option is required'
	      }
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
	 * @param {String} options.realm the HRD domain or the connection name where the user belongs to. e.g. `Username-Password-Authentication`
	 * @param {tokenCallback} cb function called with the result of the request
	 * @see Requires [`http://auth0.com/oauth/grant-type/password-realm` grant]{@link https://auth0.com/docs/api-auth/grant/password#realm-support}. For more information, read {@link https://auth0.com/docs/clients/client-grant-types}.
	 * @memberof Authentication.prototype
	 */
	Authentication.prototype.login = function(options, cb) {
	  assert.check(
	    options,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      username: { type: 'string', message: 'username option is required' },
	      password: { type: 'string', message: 'password option is required' },
	      realm: { type: 'string', message: 'realm option is required' },
	      scope: {
	        optional: true,
	        type: 'string',
	        message: 'scope option is required'
	      },
	      audience: {
	        optional: true,
	        type: 'string',
	        message: 'audience option is required'
	      }
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

	  assert.check(options, {
	    type: 'object',
	    message: 'options parameter is not valid'
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  url = urlJoin(this.baseOptions.rootUrl, 'oauth', 'token');

	  body = objectHelper
	    .merge(this.baseOptions, ['clientID', 'scope', 'audience'])
	    .with(options);

	  assert.check(
	    body,
	    { type: 'object', message: 'options parameter is not valid' },
	    {
	      clientID: { type: 'string', message: 'clientID option is required' },
	      grantType: { type: 'string', message: 'grantType option is required' },
	      scope: {
	        optional: true,
	        type: 'string',
	        message: 'scope option is required'
	      },
	      audience: {
	        optional: true,
	        type: 'string',
	        message: 'audience option is required'
	      }
	    }
	  );

	  body = objectHelper.toSnakeCase(body, ['auth0Client']);
	  body = parametersWhitelist.oauthTokenParams(this.warn, body);

	  return this.request
	    .post(url)
	    .send(body)
	    .end(wrapCallback(cb));
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
	 * @memberof Authentication.prototype
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
	      scope: {
	        optional: true,
	        type: 'string',
	        message: 'scope option is required'
	      }
	    }
	  );
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  url = urlJoin(this.baseOptions.rootUrl, 'oauth', 'ro');

	  body = objectHelper
	    .merge(this.baseOptions, ['clientID', 'scope'])
	    .with(options, ['username', 'password', 'scope', 'connection', 'device']);

	  body = objectHelper.toSnakeCase(body, ['auth0Client']);

	  body.grant_type = body.grant_type || 'password';

	  return this.request
	    .post(url)
	    .send(body)
	    .end(wrapCallback(cb));
	};

	/**
	 * Uses {@link checkSession} and localStorage to return data from the last successful authentication request.
	 *
	 * @method getSSOData
	 * @param {Boolean} withActiveDirectories this parameter is not used anymore. It's here to be backward compatible
	 * @param {Function} cb
	 * @memberof Authentication.prototype
	 */
	Authentication.prototype.getSSOData = function(withActiveDirectories, cb) {
	  /* istanbul ignore if  */
	  if (!this.auth0) {
	    this.auth0 = new WebAuth(this.baseOptions);
	  }
	  var isHostedLoginPage =
	    windowHelper.getWindow().location.host === this.baseOptions.domain;
	  if (isHostedLoginPage) {
	    return this.auth0._universalLogin.getSSOData(withActiveDirectories, cb);
	  }
	  if (typeof withActiveDirectories === 'function') {
	    cb = withActiveDirectories;
	  }
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	  var clientId = this.baseOptions.clientID;
	  var ssodataInformation = this.ssodataStorage.get() || {};

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
	        lastUsedUsername:
	          result.idTokenPayload.email || result.idTokenPayload.name,
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
	 * @memberof Authentication.prototype
	 */

	/**
	 * Makes a call to the `/userinfo` endpoint and returns the user profile
	 *
	 * @method userInfo
	 * @param {String} accessToken token issued to a user after Auth
	 * @param {userInfoCallback} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#get-user-info}
	 * @memberof Authentication.prototype
	 */
	Authentication.prototype.userInfo = function(accessToken, cb) {
	  var url;

	  assert.check(accessToken, {
	    type: 'string',
	    message: 'accessToken parameter is not valid'
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  url = urlJoin(this.baseOptions.rootUrl, 'userinfo');

	  return this.request
	    .get(url)
	    .set('Authorization', 'Bearer ' + accessToken)
	    .end(wrapCallback(cb, { ignoreCasing: true }));
	};

	/**
	 * Makes a call to the `/usernamepassword/challenge` endpoint
	 * and returns the challenge (captcha) if necessary.
	 *
	 * @method getChallenge
	 * @param {callback} cb
	 * @memberof Authentication.prototype
	 */
	Authentication.prototype.getChallenge = function(cb) {
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  if (!this.baseOptions.state) {
	    return cb();
	  }

	  var url = urlJoin(this.baseOptions.rootUrl, 'usernamepassword', 'challenge');

	  return this.request
	    .post(url)
	    .send({ state: this.baseOptions.state })
	    .end(wrapCallback(cb, { ignoreCasing: true }));
	};

	/**
	 * @callback delegationCallback
	 * @param {Error} [err] error returned by Auth0 with the reason why the delegation failed
	 * @param {Object} [result] result of the delegation request. The payload depends on what ai type was used
	 * @memberof Authentication.prototype
	 */

	/**
	 * Makes a call to the `/delegation` endpoint with either an `id_token` or `refresh_token`
	 *
	 * @method delegation
	 * @param {Object} options
	 * @param {String} [options.clientID] the Client ID found on your Application settings page
	 * @param {String} options.grantType  grant type used for delegation. The only valid value is `urn:ietf:params:oauth:grant-type:jwt-bearer`
	 * @param {String} [options.idToken] valid token of the user issued after Auth. If no `refresh_token` is provided this parameter is required
	 * @param {String} [options.refreshToken] valid refresh token of the user issued after Auth. If no `id_token` is provided this parameter is required
	 * @param {String} [options.target] the target ClientID of the delegation
	 * @param {String} [options.scope] either `openid` or `openid profile email`
	 * @param {String} [options.apiType] the api to be called
	 * @param {delegationCallback} cb
	 * @see   {@link https://auth0.com/docs/api/authentication#delegation}
	 * @see Requires [http://auth0.com/oauth/grant-type/password-realm]{@link https://auth0.com/docs/api-auth/grant/password#realm-support}. For more information, read {@link https://auth0.com/docs/clients/client-grant-types}.
	 * @memberof Authentication.prototype
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

	  url = urlJoin(this.baseOptions.rootUrl, 'delegation');

	  body = objectHelper.merge(this.baseOptions, ['clientID']).with(options);

	  body = objectHelper.toSnakeCase(body, ['auth0Client']);

	  return this.request
	    .post(url)
	    .send(body)
	    .end(wrapCallback(cb));
	};

	/**
	 * Fetches the user country based on the ip.
	 *
	 * @method getUserCountry
	 * @private
	 * @param {Function} cb
	 * @memberof Authentication.prototype
	 */
	Authentication.prototype.getUserCountry = function(cb) {
	  var url;

	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  url = urlJoin(this.baseOptions.rootUrl, 'user', 'geoloc', 'country');

	  return this.request.get(url).end(wrapCallback(cb));
	};

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

	  this.baseOptions.headers = {
	    Authorization: 'Bearer ' + this.baseOptions.token
	  };

	  this.request = new RequestBuilder(this.baseOptions);
	  this.baseOptions.rootUrl = urlJoin(
	    'https://' + this.baseOptions.domain,
	    'api',
	    'v2'
	  );
	}

	/**
	 * @callback userCallback
	 * @param {Error} [err] failure reason for the failed request to Management API
	 * @param {Object} [result] user profile
	 * @memberof Management.prototype
	 */

	/**
	 * Returns the user profile
	 *
	 * @method getUser
	 * @param {String} userId identifier of the user to retrieve
	 * @param {userCallback} cb
	 * @see https://auth0.com/docs/api/management/v2#!/Users/get_users_by_id
	 * @memberof Management.prototype
	 */
	Management.prototype.getUser = function(userId, cb) {
	  var url;

	  assert.check(userId, {
	    type: 'string',
	    message: 'userId parameter is not valid'
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  url = urlJoin(this.baseOptions.rootUrl, 'users', userId);

	  return this.request.get(url).end(wrapCallback(cb, { ignoreCasing: true }));
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
	 * @memberof Management.prototype
	 */
	Management.prototype.patchUserMetadata = function(userId, userMetadata, cb) {
	  var url;

	  assert.check(userId, {
	    type: 'string',
	    message: 'userId parameter is not valid'
	  });
	  assert.check(userMetadata, {
	    type: 'object',
	    message: 'userMetadata parameter is not valid'
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  url = urlJoin(this.baseOptions.rootUrl, 'users', userId);

	  return this.request
	    .patch(url)
	    .send({ user_metadata: userMetadata })
	    .end(wrapCallback(cb, { ignoreCasing: true }));
	};

	/**
	 * Updates the user attributes. It will patch the user attributes that the server allows it.
	 *
	 * @method patchUserAttributes
	 * @param {String} userId
	 * @param {Object} user
	 * @param {userCallback} cb
	 * @see   {@link https://auth0.com/docs/api/management/v2#!/Users/patch_users_by_id}
	 * @memberof Management.prototype
	 */
	Management.prototype.patchUserAttributes = function(userId, user, cb) {
	  var url;

	  assert.check(userId, {
	    type: 'string',
	    message: 'userId parameter is not valid'
	  });
	  assert.check(user, {
	    type: 'object',
	    message: 'user parameter is not valid'
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  url = urlJoin(this.baseOptions.rootUrl, 'users', userId);

	  return this.request
	    .patch(url)
	    .send(user)
	    .end(wrapCallback(cb, { ignoreCasing: true }));
	};

	/**
	 * Link two users
	 *
	 * @method linkUser
	 * @param {String} userId
	 * @param {String} secondaryUserToken
	 * @param {userCallback} cb
	 * @see   {@link https://auth0.com/docs/api/management/v2#!/Users/post_identities}
	 * @memberof Management.prototype
	 */
	Management.prototype.linkUser = function(userId, secondaryUserToken, cb) {
	  var url;
	  /* eslint-disable */
	  assert.check(userId, {
	    type: 'string',
	    message: 'userId parameter is not valid'
	  });
	  assert.check(secondaryUserToken, {
	    type: 'string',
	    message: 'secondaryUserToken parameter is not valid'
	  });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });
	  /* eslint-enable */

	  url = urlJoin(this.baseOptions.rootUrl, 'users', userId, 'identities');

	  return this.request
	    .post(url)
	    .send({ link_with: secondaryUserToken })
	    .end(wrapCallback(cb, { ignoreCasing: true }));
	};

	var index = {
	  Authentication: Authentication,
	  Management: Management,
	  WebAuth: WebAuth,
	  version: version
	};

	exports.Authentication = Authentication;
	exports.Management = Management;
	exports.WebAuth = WebAuth;
	exports.default = index;
	exports.version = version;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
