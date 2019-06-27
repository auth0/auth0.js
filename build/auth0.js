/**
 * auth0-js v9.11.1
 * Author: Auth0
 * Date: 2019-06-27
 * License: MIT
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.auth0 = {})));
}(this, (function (exports) { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var urlJoin = createCommonjsModule(function (module) {
	(function (name, context, definition) {
	  if (module.exports) module.exports = definition();
	  else if (typeof undefined === 'function' && undefined.amd) undefined(definition);
	  else context[name] = definition();
	})('urljoin', commonjsGlobal, function () {

	  function normalize (strArray) {
	    var resultArray = [];

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

	var has = Object.prototype.hasOwnProperty;
	var isArray = Array.isArray;

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
	    var obj = options && options.plainObjects ? Object.create(null) : {};
	    for (var i = 0; i < source.length; ++i) {
	        if (typeof source[i] !== 'undefined') {
	            obj[i] = source[i];
	        }
	    }

	    return obj;
	};

	var merge = function merge(target, source, options) {
	    if (!source) {
	        return target;
	    }

	    if (typeof source !== 'object') {
	        if (isArray(target)) {
	            target.push(source);
	        } else if (target && typeof target === 'object') {
	            if ((options && (options.plainObjects || options.allowPrototypes)) || !has.call(Object.prototype, source)) {
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

	var encode = function encode(str, defaultEncoder, charset) {
	    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
	    // It has been adapted here for stricter adherence to RFC 3986
	    if (str.length === 0) {
	        return str;
	    }

	    var string = typeof str === 'string' ? str : String(str);

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

	var isRegExp = function isRegExp(obj) {
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

	var utils = {
	    arrayToObject: arrayToObject,
	    assign: assign,
	    combine: combine,
	    compact: compact,
	    decode: decode,
	    encode: encode,
	    isBuffer: isBuffer,
	    isRegExp: isRegExp,
	    merge: merge
	};

	var replace = String.prototype.replace;
	var percentTwenties = /%20/g;

	var formats = {
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

	var has$1 = Object.prototype.hasOwnProperty;

	var arrayPrefixGenerators = {
	    brackets: function brackets(prefix) { // eslint-disable-line func-name-matching
	        return prefix + '[]';
	    },
	    comma: 'comma',
	    indices: function indices(prefix, key) { // eslint-disable-line func-name-matching
	        return prefix + '[' + key + ']';
	    },
	    repeat: function repeat(prefix) { // eslint-disable-line func-name-matching
	        return prefix;
	    }
	};

	var isArray$1 = Array.isArray;
	var push = Array.prototype.push;
	var pushToArray = function (arr, valueOrArray) {
	    push.apply(arr, isArray$1(valueOrArray) ? valueOrArray : [valueOrArray]);
	};

	var toISO = Date.prototype.toISOString;

	var defaults = {
	    addQueryPrefix: false,
	    allowDots: false,
	    charset: 'utf-8',
	    charsetSentinel: false,
	    delimiter: '&',
	    encode: true,
	    encoder: utils.encode,
	    encodeValuesOnly: false,
	    formatter: formats.formatters[formats['default']],
	    // deprecated
	    indices: false,
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
	    encodeValuesOnly,
	    charset
	) {
	    var obj = object;
	    if (typeof filter === 'function') {
	        obj = filter(prefix, obj);
	    } else if (obj instanceof Date) {
	        obj = serializeDate(obj);
	    } else if (generateArrayPrefix === 'comma' && isArray$1(obj)) {
	        obj = obj.join(',');
	    }

	    if (obj === null) {
	        if (strictNullHandling) {
	            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset) : prefix;
	        }

	        obj = '';
	    }

	    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || utils.isBuffer(obj)) {
	        if (encoder) {
	            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset);
	            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset))];
	        }
	        return [formatter(prefix) + '=' + formatter(String(obj))];
	    }

	    var values = [];

	    if (typeof obj === 'undefined') {
	        return values;
	    }

	    var objKeys;
	    if (isArray$1(filter)) {
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

	        if (isArray$1(obj)) {
	            pushToArray(values, stringify(
	                obj[key],
	                typeof generateArrayPrefix === 'function' ? generateArrayPrefix(prefix, key) : prefix,
	                generateArrayPrefix,
	                strictNullHandling,
	                skipNulls,
	                encoder,
	                filter,
	                sort,
	                allowDots,
	                serializeDate,
	                formatter,
	                encodeValuesOnly,
	                charset
	            ));
	        } else {
	            pushToArray(values, stringify(
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
	                encodeValuesOnly,
	                charset
	            ));
	        }
	    }

	    return values;
	};

	var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
	    if (!opts) {
	        return defaults;
	    }

	    if (opts.encoder !== null && opts.encoder !== undefined && typeof opts.encoder !== 'function') {
	        throw new TypeError('Encoder has to be a function.');
	    }

	    var charset = opts.charset || defaults.charset;
	    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
	        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
	    }

	    var format = formats['default'];
	    if (typeof opts.format !== 'undefined') {
	        if (!has$1.call(formats.formatters, opts.format)) {
	            throw new TypeError('Unknown format option provided.');
	        }
	        format = opts.format;
	    }
	    var formatter = formats.formatters[format];

	    var filter = defaults.filter;
	    if (typeof opts.filter === 'function' || isArray$1(opts.filter)) {
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
	    } else if (isArray$1(options.filter)) {
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

	    if (!objKeys) {
	        objKeys = Object.keys(obj);
	    }

	    if (options.sort) {
	        objKeys.sort(options.sort);
	    }

	    for (var i = 0; i < objKeys.length; ++i) {
	        var key = objKeys[i];

	        if (options.skipNulls && obj[key] === null) {
	            continue;
	        }
	        pushToArray(keys, stringify(
	            obj[key],
	            key,
	            generateArrayPrefix,
	            options.strictNullHandling,
	            options.skipNulls,
	            options.encode ? options.encoder : null,
	            options.filter,
	            options.sort,
	            options.allowDots,
	            options.serializeDate,
	            options.formatter,
	            options.encodeValuesOnly,
	            options.charset
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

	var has$2 = Object.prototype.hasOwnProperty;

	var defaults$1 = {
	    allowDots: false,
	    allowPrototypes: false,
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
	            key = options.decoder(part, defaults$1.decoder, charset);
	            val = options.strictNullHandling ? null : '';
	        } else {
	            key = options.decoder(part.slice(0, pos), defaults$1.decoder, charset);
	            val = options.decoder(part.slice(pos + 1), defaults$1.decoder, charset);
	        }

	        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
	            val = interpretNumericEntities(val);
	        }

	        if (val && options.comma && val.indexOf(',') > -1) {
	            val = val.split(',');
	        }

	        if (has$2.call(obj, key)) {
	            obj[key] = utils.combine(obj[key], val);
	        } else {
	            obj[key] = val;
	        }
	    }

	    return obj;
	};

	var parseObject = function (chain, val, options) {
	    var leaf = val;

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
	            } else {
	                obj[cleanRoot] = leaf;
	            }
	        }

	        leaf = obj;
	    }

	    return leaf;
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
	        // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
	        if (!options.plainObjects && has$2.call(Object.prototype, parent)) {
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
	        if (!options.plainObjects && has$2.call(Object.prototype, segment[1].slice(1, -1))) {
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

	var normalizeParseOptions = function normalizeParseOptions(opts) {
	    if (!opts) {
	        return defaults$1;
	    }

	    if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
	        throw new TypeError('Decoder has to be a function.');
	    }

	    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
	        throw new Error('The charset option must be either utf-8, iso-8859-1, or undefined');
	    }
	    var charset = typeof opts.charset === 'undefined' ? defaults$1.charset : opts.charset;

	    return {
	        allowDots: typeof opts.allowDots === 'undefined' ? defaults$1.allowDots : !!opts.allowDots,
	        allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults$1.allowPrototypes,
	        arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults$1.arrayLimit,
	        charset: charset,
	        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults$1.charsetSentinel,
	        comma: typeof opts.comma === 'boolean' ? opts.comma : defaults$1.comma,
	        decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults$1.decoder,
	        delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults$1.delimiter,
	        depth: typeof opts.depth === 'number' ? opts.depth : defaults$1.depth,
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
	        var newObj = parseKeys(key, tempObj[key], options);
	        obj = utils.merge(obj, newObj, options);
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

	var isObject_1 = isObject;

	/**
	 * Module of mixed-in functions shared between node and client code
	 */


	/**
	 * Expose `RequestBase`.
	 */

	var requestBase = RequestBase;

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

	RequestBase.prototype['catch'] = function(cb) {
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
	  if (isObject_1(field)) {
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

	  if (isObject_1(name)) {
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
	  var isObj = isObject_1(data);
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
	  if (isObj && isObject_1(this._data)) {
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
	RequestBase.prototype._appendQueryString = function() {console.trace("Unsupported");};

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

	/**
	 * Return the mime type for the given `str`.
	 *
	 * @param {String} str
	 * @return {String}
	 * @api private
	 */

	var type = function(str){
	  return str.split(/ *; */).shift();
	};

	/**
	 * Return header field parameters.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */

	var params = function(str){
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

	var parseLinks = function(str){
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

	var cleanHeader = function(header, changesOrigin){
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

	var utils$1 = {
		type: type,
		params: params,
		parseLinks: parseLinks,
		cleanHeader: cleanHeader
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

	function ResponseBase(obj) {
	  if (obj) return mixin$1(obj);
	}

	/**
	 * Mixin the prototype properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */

	function mixin$1(obj) {
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
	    this.type = utils$1.type(ct);

	    // params
	    var params = utils$1.params(ct);
	    for (var key in params) this[key] = params[key];

	    this.links = {};

	    // links
	    try {
	        if (header.link) {
	            this.links = utils$1.parseLinks(header.link);
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
	    this.created = 201 == status;
	    this.accepted = 202 == status;
	    this.noContent = 204 == status;
	    this.badRequest = 400 == status;
	    this.unauthorized = 401 == status;
	    this.notAcceptable = 406 == status;
	    this.forbidden = 403 == status;
	    this.notFound = 404 == status;
	    this.unprocessableEntity = 422 == status;
	};

	function Agent() {
	  this._defaults = [];
	}

	["use", "on", "once", "set", "query", "type", "accept", "auth", "withCredentials", "sortQuery", "retry", "ok", "redirects",
	 "timeout", "buffer", "serialize", "parse", "ca", "key", "pfx", "cert"].forEach(function(fn) {
	  /** Default setting for all requests from this agent */
	  Agent.prototype[fn] = function(/*varargs*/) {
	    this._defaults.push({fn:fn, arguments:arguments});
	    return this;
	  };
	});

	Agent.prototype._setDefaults = function(req) {
	    this._defaults.forEach(function(def) {
	      req[def.fn].apply(req, def.arguments);
	    });
	};

	var agentBase = Agent;

	var client = createCommonjsModule(function (module, exports) {
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
	  root = commonjsGlobal;
	}







	/**
	 * Noop.
	 */

	function noop(){}
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
	};

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
	  if (!isObject_1(obj)) return obj;
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
	    } else if (isObject_1(val)) {
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

	responseBase(Response.prototype);

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

	componentEmitter(Request.prototype);
	requestBase(Request.prototype);

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
	    try { status = xhr.status; } catch(e) { status = 0; }

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
	  return new agentBase();
	};

	["GET", "POST", "OPTIONS", "PATCH", "PUT", "DELETE"].forEach(function(method) {
	  agentBase.prototype[method.toLowerCase()] = function(url, fn) {
	    var req = new request.Request(method, url);
	    this._setDefaults(req);
	    if (fn) {
	      req.end(fn);
	    }
	    return req;
	  };
	});

	agentBase.prototype.del = agentBase.prototype['delete'];

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

	  for (var i = 0; i < len; i += 4) {
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
	    parts.push(encodeChunk(
	      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
	    ));
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

	var version = { raw: '9.11.1' };

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
	function isArray$2(array) {
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
	  isArray: isArray$2,
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
	    /^(https?:|file:)\/\/(([^:/?#]*)(?::([0-9]+))?)([/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/
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
	  trimUserDetails: trimUserDetails
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
	  this.request = this.request.end(cb);
	  return new RequestWrapper(this.request);
	};

	// ------------------------------------------------ RequestBuilder

	function RequestBuilder(options) {
	  this._sendTelemetry = options._sendTelemetry === false ? options._sendTelemetry : true;
	  this._telemetryInfo = options._telemetryInfo || null;
	  this._timesToRetryFailedRequests = options._timesToRetryFailedRequests;
	  this.headers = options.headers || {};
	  this._universalLoginPage = options.universalLoginPage;
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
	  return new RequestObj(this.setCommonConfiguration(client.post(url), options));
	};

	RequestBuilder.prototype.patch = function(url, options) {
	  return new RequestObj(this.setCommonConfiguration(client.patch(url), options));
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

	function DummyStorage() {}

	DummyStorage.prototype.getItem = function() {
	  return null;
	};

	DummyStorage.prototype.removeItem = function() {};

	DummyStorage.prototype.setItem = function() {};

	var js_cookie = createCommonjsModule(function (module, exports) {
	(function (factory) {
		var registeredInModuleLoader = false;
		if (typeof undefined === 'function' && undefined.amd) {
			undefined(factory);
			registeredInModuleLoader = true;
		}
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

		function init (converter) {
			function api (key, value, attributes) {
				var result;
				if (typeof document === 'undefined') {
					return;
				}

				// Write

				if (arguments.length > 1) {
					attributes = extend({
						path: '/'
					}, api.defaults, attributes);

					if (typeof attributes.expires === 'number') {
						var expires = new Date();
						expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
						attributes.expires = expires;
					}

					// We're using "expires" because "max-age" is not supported by IE
					attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

					try {
						result = JSON.stringify(value);
						if (/^[\{\[]/.test(result)) {
							value = result;
						}
					} catch (e) {}

					if (!converter.write) {
						value = encodeURIComponent(String(value))
							.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
					} else {
						value = converter.write(value, key);
					}

					key = encodeURIComponent(String(key));
					key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
					key = key.replace(/[\(\)]/g, escape);

					var stringifiedAttributes = '';

					for (var attributeName in attributes) {
						if (!attributes[attributeName]) {
							continue;
						}
						stringifiedAttributes += '; ' + attributeName;
						if (attributes[attributeName] === true) {
							continue;
						}
						stringifiedAttributes += '=' + attributes[attributeName];
					}
					return (document.cookie = key + '=' + value + stringifiedAttributes);
				}

				// Read

				if (!key) {
					result = {};
				}

				// To prevent the for loop in the first place assign an empty array
				// in case there are no cookies at all. Also prevents odd result when
				// calling "get()"
				var cookies = document.cookie ? document.cookie.split('; ') : [];
				var rdecode = /(%[0-9A-Z]{2})+/g;
				var i = 0;

				for (; i < cookies.length; i++) {
					var parts = cookies[i].split('=');
					var cookie = parts.slice(1).join('=');

					if (!this.json && cookie.charAt(0) === '"') {
						cookie = cookie.slice(1, -1);
					}

					try {
						var name = parts[0].replace(rdecode, decodeURIComponent);
						cookie = converter.read ?
							converter.read(cookie, name) : converter(cookie, name) ||
							cookie.replace(rdecode, decodeURIComponent);

						if (this.json) {
							try {
								cookie = JSON.parse(cookie);
							} catch (e) {}
						}

						if (key === name) {
							result = cookie;
							break;
						}

						if (!key) {
							result[name] = cookie;
						}
					} catch (e) {}
				}

				return result;
			}

			api.set = api;
			api.get = function (key) {
				return api.call(api, key);
			};
			api.getJSON = function () {
				return api.apply({
					json: true
				}, [].slice.call(arguments));
			};
			api.defaults = {};

			api.remove = function (key, attributes) {
				api(key, '', extend(attributes, {
					expires: -1
				}));
			};

			api.withConverter = init;

			return api;
		}

		return init(function () {});
	}));
	});

	function CookieStorage() {}

	CookieStorage.prototype.getItem = function(key) {
	  return js_cookie.get(key);
	};

	CookieStorage.prototype.removeItem = function(key) {
	  js_cookie.remove(key);
	};

	CookieStorage.prototype.setItem = function(key, value, options) {
	  var params = objectHelper.extend(
	    {
	      expires: 1 // 1 day
	    },
	    options
	  );
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
	  this.storage = new CookieStorage();
	  if (options.__tryLocalStorageFirst !== true) {
	    return;
	  }
	  try {
	    // some browsers throw an error when trying to access localStorage
	    // when localStorage is disabled.
	    var localStorage = windowHandler.getWindow().localStorage;
	    if (localStorage) {
	      this.storage = localStorage;
	    }
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

	StorageHandler.prototype.setItem = function(key, value, options) {
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

	      errObj.code = err.code || err.error || err.error_code || err.status || null;
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

	    return cb(
	      null,
	      objectHelper.toCamelCase(data.body || data, [], { keepOriginal: options.keepOriginalCasing })
	    );
	  };
	}

	// For future reference:,

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

	var t="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function r(t,r){return t(r={exports:{}},r.exports),r.exports}var i$1=r(function(t,r){var i;t.exports=(i=i||function(t,r){var i=Object.create||function(){function t(){}return function(r){var i;return t.prototype=r,i=new t,t.prototype=null,i}}(),e={},n=e.lib={},o=n.Base={extend:function(t){var r=i(this);return t&&r.mixIn(t),r.hasOwnProperty("init")&&this.init!==r.init||(r.init=function(){r.$super.init.apply(this,arguments);}),r.init.prototype=r,r.$super=this,r},create:function(){var t=this.extend();return t.init.apply(t,arguments),t},init:function(){},mixIn:function(t){for(var r in t)t.hasOwnProperty(r)&&(this[r]=t[r]);t.hasOwnProperty("toString")&&(this.toString=t.toString);},clone:function(){return this.init.prototype.extend(this)}},s=n.WordArray=o.extend({init:function(t,r){t=this.words=t||[],this.sigBytes=null!=r?r:4*t.length;},toString:function(t){return (t||a).stringify(this)},concat:function(t){var r=this.words,i=t.words,e=this.sigBytes,n=t.sigBytes;if(this.clamp(),e%4)for(var o=0;o<n;o++){var s=i[o>>>2]>>>24-o%4*8&255;r[e+o>>>2]|=s<<24-(e+o)%4*8;}else for(var o=0;o<n;o+=4)r[e+o>>>2]=i[o>>>2];return this.sigBytes+=n,this},clamp:function(){var r=this.words,i=this.sigBytes;r[i>>>2]&=4294967295<<32-i%4*8,r.length=t.ceil(i/4);},clone:function(){var t=o.clone.call(this);return t.words=this.words.slice(0),t},random:function(r){for(var i,e=[],n=function(r){var r=r,i=987654321,e=4294967295;return function(){var n=((i=36969*(65535&i)+(i>>16)&e)<<16)+(r=18e3*(65535&r)+(r>>16)&e)&e;return n/=4294967296,(n+=.5)*(t.random()>.5?1:-1)}},o=0;o<r;o+=4){var h=n(4294967296*(i||t.random()));i=987654071*h(),e.push(4294967296*h()|0);}return new s.init(e,r)}}),h=e.enc={},a=h.Hex={stringify:function(t){for(var r=t.words,i=t.sigBytes,e=[],n=0;n<i;n++){var o=r[n>>>2]>>>24-n%4*8&255;e.push((o>>>4).toString(16)),e.push((15&o).toString(16));}return e.join("")},parse:function(t){for(var r=t.length,i=[],e=0;e<r;e+=2)i[e>>>3]|=parseInt(t.substr(e,2),16)<<24-e%8*4;return new s.init(i,r/2)}},u=h.Latin1={stringify:function(t){for(var r=t.words,i=t.sigBytes,e=[],n=0;n<i;n++){var o=r[n>>>2]>>>24-n%4*8&255;e.push(String.fromCharCode(o));}return e.join("")},parse:function(t){for(var r=t.length,i=[],e=0;e<r;e++)i[e>>>2]|=(255&t.charCodeAt(e))<<24-e%4*8;return new s.init(i,r)}},f=h.Utf8={stringify:function(t){try{return decodeURIComponent(escape(u.stringify(t)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function(t){return u.parse(unescape(encodeURIComponent(t)))}},c=n.BufferedBlockAlgorithm=o.extend({reset:function(){this._data=new s.init,this._nDataBytes=0;},_append:function(t){"string"==typeof t&&(t=f.parse(t)),this._data.concat(t),this._nDataBytes+=t.sigBytes;},_process:function(r){var i=this._data,e=i.words,n=i.sigBytes,o=this.blockSize,h=4*o,a=n/h,u=(a=r?t.ceil(a):t.max((0|a)-this._minBufferSize,0))*o,f=t.min(4*u,n);if(u){for(var c=0;c<u;c+=o)this._doProcessBlock(e,c);var p=e.splice(0,u);i.sigBytes-=f;}return new s.init(p,f)},clone:function(){var t=o.clone.call(this);return t._data=this._data.clone(),t},_minBufferSize:0}),p=(n.Hasher=c.extend({cfg:o.extend(),init:function(t){this.cfg=this.cfg.extend(t),this.reset();},reset:function(){c.reset.call(this),this._doReset();},update:function(t){return this._append(t),this._process(),this},finalize:function(t){t&&this._append(t);var r=this._doFinalize();return r},blockSize:16,_createHelper:function(t){return function(r,i){return new t.init(i).finalize(r)}},_createHmacHelper:function(t){return function(r,i){return new p.HMAC.init(t,i).finalize(r)}}}),e.algo={});return e}(Math),i);}),e=r(function(t,r){var e;t.exports=(e=i$1,function(t){var r=e,i=r.lib,n=i.WordArray,o=i.Hasher,s=r.algo,h=[],a=[];!function(){function r(r){for(var i=t.sqrt(r),e=2;e<=i;e++)if(!(r%e))return !1;return !0}function i(t){return 4294967296*(t-(0|t))|0}for(var e=2,n=0;n<64;)r(e)&&(n<8&&(h[n]=i(t.pow(e,.5))),a[n]=i(t.pow(e,1/3)),n++),e++;}();var u=[],f=s.SHA256=o.extend({_doReset:function(){this._hash=new n.init(h.slice(0));},_doProcessBlock:function(t,r){for(var i=this._hash.words,e=i[0],n=i[1],o=i[2],s=i[3],h=i[4],f=i[5],c=i[6],p=i[7],l=0;l<64;l++){if(l<16)u[l]=0|t[r+l];else{var d=u[l-15],v=u[l-2];u[l]=((d<<25|d>>>7)^(d<<14|d>>>18)^d>>>3)+u[l-7]+((v<<15|v>>>17)^(v<<13|v>>>19)^v>>>10)+u[l-16];}var y=e&n^e&o^n&o,m=p+((h<<26|h>>>6)^(h<<21|h>>>11)^(h<<7|h>>>25))+(h&f^~h&c)+a[l]+u[l];p=c,c=f,f=h,h=s+m|0,s=o,o=n,n=e,e=m+(((e<<30|e>>>2)^(e<<19|e>>>13)^(e<<10|e>>>22))+y)|0;}i[0]=i[0]+e|0,i[1]=i[1]+n|0,i[2]=i[2]+o|0,i[3]=i[3]+s|0,i[4]=i[4]+h|0,i[5]=i[5]+f|0,i[6]=i[6]+c|0,i[7]=i[7]+p|0;},_doFinalize:function(){var r=this._data,i=r.words,e=8*this._nDataBytes,n=8*r.sigBytes;return i[n>>>5]|=128<<24-n%32,i[14+(n+64>>>9<<4)]=t.floor(e/4294967296),i[15+(n+64>>>9<<4)]=e,r.sigBytes=4*i.length,this._process(),this._hash},clone:function(){var t=o.clone.call(this);return t._hash=this._hash.clone(),t}});r.SHA256=o._createHelper(f),r.HmacSHA256=o._createHmacHelper(f);}(Math),e.SHA256);}),n=r(function(t,r){var e,n;t.exports=(n=(e=i$1).lib.WordArray,e.enc.Base64={stringify:function(t){var r=t.words,i=t.sigBytes,e=this._map;t.clamp();for(var n=[],o=0;o<i;o+=3)for(var s=(r[o>>>2]>>>24-o%4*8&255)<<16|(r[o+1>>>2]>>>24-(o+1)%4*8&255)<<8|r[o+2>>>2]>>>24-(o+2)%4*8&255,h=0;h<4&&o+.75*h<i;h++)n.push(e.charAt(s>>>6*(3-h)&63));var a=e.charAt(64);if(a)for(;n.length%4;)n.push(a);return n.join("")},parse:function(t){var r=t.length,i=this._map,e=this._reverseMap;if(!e){e=this._reverseMap=[];for(var o=0;o<i.length;o++)e[i.charCodeAt(o)]=o;}var s=i.charAt(64);if(s){var h=t.indexOf(s);-1!==h&&(r=h);}return function(t,r,i){for(var e=[],o=0,s=0;s<r;s++)if(s%4){var h=i[t.charCodeAt(s-1)]<<s%4*2,a=i[t.charCodeAt(s)]>>>6-s%4*2;e[o>>>2]|=(h|a)<<24-o%4*8,o++;}return n.create(e,o)}(t,r,e)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="},e.enc.Base64);}),o=r(function(t,r){t.exports=i$1.enc.Hex;}),s=r(function(r,i){(function(){var t;function i(t,r,i){null!=t&&("number"==typeof t?this.fromNumber(t,r,i):this.fromString(t,null==r&&"string"!=typeof t?256:r));}function e(){return new i(null)}var n="undefined"!=typeof navigator;n&&"Microsoft Internet Explorer"==navigator.appName?(i.prototype.am=function(t,r,i,e,n,o){for(var s=32767&r,h=r>>15;--o>=0;){var a=32767&this[t],u=this[t++]>>15,f=h*a+u*s;n=((a=s*a+((32767&f)<<15)+i[e]+(1073741823&n))>>>30)+(f>>>15)+h*u+(n>>>30),i[e++]=1073741823&a;}return n},t=30):n&&"Netscape"!=navigator.appName?(i.prototype.am=function(t,r,i,e,n,o){for(;--o>=0;){var s=r*this[t++]+i[e]+n;n=Math.floor(s/67108864),i[e++]=67108863&s;}return n},t=26):(i.prototype.am=function(t,r,i,e,n,o){for(var s=16383&r,h=r>>14;--o>=0;){var a=16383&this[t],u=this[t++]>>14,f=h*a+u*s;n=((a=s*a+((16383&f)<<14)+i[e]+n)>>28)+(f>>14)+h*u,i[e++]=268435455&a;}return n},t=28),i.prototype.DB=t,i.prototype.DM=(1<<t)-1,i.prototype.DV=1<<t;i.prototype.FV=Math.pow(2,52),i.prototype.F1=52-t,i.prototype.F2=2*t-52;var o,s,h="0123456789abcdefghijklmnopqrstuvwxyz",a=new Array;for(o="0".charCodeAt(0),s=0;s<=9;++s)a[o++]=s;for(o="a".charCodeAt(0),s=10;s<36;++s)a[o++]=s;for(o="A".charCodeAt(0),s=10;s<36;++s)a[o++]=s;function u(t){return h.charAt(t)}function f(t,r){var i=a[t.charCodeAt(r)];return null==i?-1:i}function c(t){var r=e();return r.fromInt(t),r}function p(t){var r,i=1;return 0!=(r=t>>>16)&&(t=r,i+=16),0!=(r=t>>8)&&(t=r,i+=8),0!=(r=t>>4)&&(t=r,i+=4),0!=(r=t>>2)&&(t=r,i+=2),0!=(r=t>>1)&&(t=r,i+=1),i}function l(t){this.m=t;}function d(t){this.m=t,this.mp=t.invDigit(),this.mpl=32767&this.mp,this.mph=this.mp>>15,this.um=(1<<t.DB-15)-1,this.mt2=2*t.t;}function v(t,r){return t&r}function y(t,r){return t|r}function m(t,r){return t^r}function g(t,r){return t&~r}function w(t){if(0==t)return -1;var r=0;return 0==(65535&t)&&(t>>=16,r+=16),0==(255&t)&&(t>>=8,r+=8),0==(15&t)&&(t>>=4,r+=4),0==(3&t)&&(t>>=2,r+=2),0==(1&t)&&++r,r}function T(t){for(var r=0;0!=t;)t&=t-1,++r;return r}function b(){}function S(t){return t}function B(t){this.r2=e(),this.q3=e(),i.ONE.dlShiftTo(2*t.t,this.r2),this.mu=this.r2.divide(t),this.m=t;}l.prototype.convert=function(t){return t.s<0||t.compareTo(this.m)>=0?t.mod(this.m):t},l.prototype.revert=function(t){return t},l.prototype.reduce=function(t){t.divRemTo(this.m,null,t);},l.prototype.mulTo=function(t,r,i){t.multiplyTo(r,i),this.reduce(i);},l.prototype.sqrTo=function(t,r){t.squareTo(r),this.reduce(r);},d.prototype.convert=function(t){var r=e();return t.abs().dlShiftTo(this.m.t,r),r.divRemTo(this.m,null,r),t.s<0&&r.compareTo(i.ZERO)>0&&this.m.subTo(r,r),r},d.prototype.revert=function(t){var r=e();return t.copyTo(r),this.reduce(r),r},d.prototype.reduce=function(t){for(;t.t<=this.mt2;)t[t.t++]=0;for(var r=0;r<this.m.t;++r){var i=32767&t[r],e=i*this.mpl+((i*this.mph+(t[r]>>15)*this.mpl&this.um)<<15)&t.DM;for(t[i=r+this.m.t]+=this.m.am(0,e,t,r,0,this.m.t);t[i]>=t.DV;)t[i]-=t.DV,t[++i]++;}t.clamp(),t.drShiftTo(this.m.t,t),t.compareTo(this.m)>=0&&t.subTo(this.m,t);},d.prototype.mulTo=function(t,r,i){t.multiplyTo(r,i),this.reduce(i);},d.prototype.sqrTo=function(t,r){t.squareTo(r),this.reduce(r);},i.prototype.copyTo=function(t){for(var r=this.t-1;r>=0;--r)t[r]=this[r];t.t=this.t,t.s=this.s;},i.prototype.fromInt=function(t){this.t=1,this.s=t<0?-1:0,t>0?this[0]=t:t<-1?this[0]=t+this.DV:this.t=0;},i.prototype.fromString=function(t,r){var e;if(16==r)e=4;else if(8==r)e=3;else if(256==r)e=8;else if(2==r)e=1;else if(32==r)e=5;else{if(4!=r)return void this.fromRadix(t,r);e=2;}this.t=0,this.s=0;for(var n=t.length,o=!1,s=0;--n>=0;){var h=8==e?255&t[n]:f(t,n);h<0?"-"==t.charAt(n)&&(o=!0):(o=!1,0==s?this[this.t++]=h:s+e>this.DB?(this[this.t-1]|=(h&(1<<this.DB-s)-1)<<s,this[this.t++]=h>>this.DB-s):this[this.t-1]|=h<<s,(s+=e)>=this.DB&&(s-=this.DB));}8==e&&0!=(128&t[0])&&(this.s=-1,s>0&&(this[this.t-1]|=(1<<this.DB-s)-1<<s)),this.clamp(),o&&i.ZERO.subTo(this,this);},i.prototype.clamp=function(){for(var t=this.s&this.DM;this.t>0&&this[this.t-1]==t;)--this.t;},i.prototype.dlShiftTo=function(t,r){var i;for(i=this.t-1;i>=0;--i)r[i+t]=this[i];for(i=t-1;i>=0;--i)r[i]=0;r.t=this.t+t,r.s=this.s;},i.prototype.drShiftTo=function(t,r){for(var i=t;i<this.t;++i)r[i-t]=this[i];r.t=Math.max(this.t-t,0),r.s=this.s;},i.prototype.lShiftTo=function(t,r){var i,e=t%this.DB,n=this.DB-e,o=(1<<n)-1,s=Math.floor(t/this.DB),h=this.s<<e&this.DM;for(i=this.t-1;i>=0;--i)r[i+s+1]=this[i]>>n|h,h=(this[i]&o)<<e;for(i=s-1;i>=0;--i)r[i]=0;r[s]=h,r.t=this.t+s+1,r.s=this.s,r.clamp();},i.prototype.rShiftTo=function(t,r){r.s=this.s;var i=Math.floor(t/this.DB);if(i>=this.t)r.t=0;else{var e=t%this.DB,n=this.DB-e,o=(1<<e)-1;r[0]=this[i]>>e;for(var s=i+1;s<this.t;++s)r[s-i-1]|=(this[s]&o)<<n,r[s-i]=this[s]>>e;e>0&&(r[this.t-i-1]|=(this.s&o)<<n),r.t=this.t-i,r.clamp();}},i.prototype.subTo=function(t,r){for(var i=0,e=0,n=Math.min(t.t,this.t);i<n;)e+=this[i]-t[i],r[i++]=e&this.DM,e>>=this.DB;if(t.t<this.t){for(e-=t.s;i<this.t;)e+=this[i],r[i++]=e&this.DM,e>>=this.DB;e+=this.s;}else{for(e+=this.s;i<t.t;)e-=t[i],r[i++]=e&this.DM,e>>=this.DB;e-=t.s;}r.s=e<0?-1:0,e<-1?r[i++]=this.DV+e:e>0&&(r[i++]=e),r.t=i,r.clamp();},i.prototype.multiplyTo=function(t,r){var e=this.abs(),n=t.abs(),o=e.t;for(r.t=o+n.t;--o>=0;)r[o]=0;for(o=0;o<n.t;++o)r[o+e.t]=e.am(0,n[o],r,o,0,e.t);r.s=0,r.clamp(),this.s!=t.s&&i.ZERO.subTo(r,r);},i.prototype.squareTo=function(t){for(var r=this.abs(),i=t.t=2*r.t;--i>=0;)t[i]=0;for(i=0;i<r.t-1;++i){var e=r.am(i,r[i],t,2*i,0,1);(t[i+r.t]+=r.am(i+1,2*r[i],t,2*i+1,e,r.t-i-1))>=r.DV&&(t[i+r.t]-=r.DV,t[i+r.t+1]=1);}t.t>0&&(t[t.t-1]+=r.am(i,r[i],t,2*i,0,1)),t.s=0,t.clamp();},i.prototype.divRemTo=function(t,r,n){var o=t.abs();if(!(o.t<=0)){var s=this.abs();if(s.t<o.t)return null!=r&&r.fromInt(0),void(null!=n&&this.copyTo(n));null==n&&(n=e());var h=e(),a=this.s,u=t.s,f=this.DB-p(o[o.t-1]);f>0?(o.lShiftTo(f,h),s.lShiftTo(f,n)):(o.copyTo(h),s.copyTo(n));var c=h.t,l=h[c-1];if(0!=l){var d=l*(1<<this.F1)+(c>1?h[c-2]>>this.F2:0),v=this.FV/d,y=(1<<this.F1)/d,m=1<<this.F2,g=n.t,w=g-c,T=null==r?e():r;for(h.dlShiftTo(w,T),n.compareTo(T)>=0&&(n[n.t++]=1,n.subTo(T,n)),i.ONE.dlShiftTo(c,T),T.subTo(h,h);h.t<c;)h[h.t++]=0;for(;--w>=0;){var b=n[--g]==l?this.DM:Math.floor(n[g]*v+(n[g-1]+m)*y);if((n[g]+=h.am(0,b,n,w,0,c))<b)for(h.dlShiftTo(w,T),n.subTo(T,n);n[g]<--b;)n.subTo(T,n);}null!=r&&(n.drShiftTo(c,r),a!=u&&i.ZERO.subTo(r,r)),n.t=c,n.clamp(),f>0&&n.rShiftTo(f,n),a<0&&i.ZERO.subTo(n,n);}}},i.prototype.invDigit=function(){if(this.t<1)return 0;var t=this[0];if(0==(1&t))return 0;var r=3&t;return (r=(r=(r=(r=r*(2-(15&t)*r)&15)*(2-(255&t)*r)&255)*(2-((65535&t)*r&65535))&65535)*(2-t*r%this.DV)%this.DV)>0?this.DV-r:-r},i.prototype.isEven=function(){return 0==(this.t>0?1&this[0]:this.s)},i.prototype.exp=function(t,r){if(t>4294967295||t<1)return i.ONE;var n=e(),o=e(),s=r.convert(this),h=p(t)-1;for(s.copyTo(n);--h>=0;)if(r.sqrTo(n,o),(t&1<<h)>0)r.mulTo(o,s,n);else{var a=n;n=o,o=a;}return r.revert(n)},i.prototype.toString=function(t){if(this.s<0)return "-"+this.negate().toString(t);var r;if(16==t)r=4;else if(8==t)r=3;else if(2==t)r=1;else if(32==t)r=5;else{if(4!=t)return this.toRadix(t);r=2;}var i,e=(1<<r)-1,n=!1,o="",s=this.t,h=this.DB-s*this.DB%r;if(s-- >0)for(h<this.DB&&(i=this[s]>>h)>0&&(n=!0,o=u(i));s>=0;)h<r?(i=(this[s]&(1<<h)-1)<<r-h,i|=this[--s]>>(h+=this.DB-r)):(i=this[s]>>(h-=r)&e,h<=0&&(h+=this.DB,--s)),i>0&&(n=!0),n&&(o+=u(i));return n?o:"0"},i.prototype.negate=function(){var t=e();return i.ZERO.subTo(this,t),t},i.prototype.abs=function(){return this.s<0?this.negate():this},i.prototype.compareTo=function(t){var r=this.s-t.s;if(0!=r)return r;var i=this.t;if(0!=(r=i-t.t))return this.s<0?-r:r;for(;--i>=0;)if(0!=(r=this[i]-t[i]))return r;return 0},i.prototype.bitLength=function(){return this.t<=0?0:this.DB*(this.t-1)+p(this[this.t-1]^this.s&this.DM)},i.prototype.mod=function(t){var r=e();return this.abs().divRemTo(t,null,r),this.s<0&&r.compareTo(i.ZERO)>0&&t.subTo(r,r),r},i.prototype.modPowInt=function(t,r){var i;return i=t<256||r.isEven()?new l(r):new d(r),this.exp(t,i)},i.ZERO=c(0),i.ONE=c(1),b.prototype.convert=S,b.prototype.revert=S,b.prototype.mulTo=function(t,r,i){t.multiplyTo(r,i);},b.prototype.sqrTo=function(t,r){t.squareTo(r);},B.prototype.convert=function(t){if(t.s<0||t.t>2*this.m.t)return t.mod(this.m);if(t.compareTo(this.m)<0)return t;var r=e();return t.copyTo(r),this.reduce(r),r},B.prototype.revert=function(t){return t},B.prototype.reduce=function(t){for(t.drShiftTo(this.m.t-1,this.r2),t.t>this.m.t+1&&(t.t=this.m.t+1,t.clamp()),this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3),this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);t.compareTo(this.r2)<0;)t.dAddOffset(1,this.m.t+1);for(t.subTo(this.r2,t);t.compareTo(this.m)>=0;)t.subTo(this.m,t);},B.prototype.mulTo=function(t,r,i){t.multiplyTo(r,i),this.reduce(i);},B.prototype.sqrTo=function(t,r){t.squareTo(r),this.reduce(r);};var D,A,x,E=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997],_=(1<<26)/E[E.length-1];function M(){var t;t=(new Date).getTime(),A[x++]^=255&t,A[x++]^=t>>8&255,A[x++]^=t>>16&255,A[x++]^=t>>24&255,x>=P&&(x-=P);}if(i.prototype.chunkSize=function(t){return Math.floor(Math.LN2*this.DB/Math.log(t))},i.prototype.toRadix=function(t){if(null==t&&(t=10),0==this.signum()||t<2||t>36)return "0";var r=this.chunkSize(t),i=Math.pow(t,r),n=c(i),o=e(),s=e(),h="";for(this.divRemTo(n,o,s);o.signum()>0;)h=(i+s.intValue()).toString(t).substr(1)+h,o.divRemTo(n,o,s);return s.intValue().toString(t)+h},i.prototype.fromRadix=function(t,r){this.fromInt(0),null==r&&(r=10);for(var e=this.chunkSize(r),n=Math.pow(r,e),o=!1,s=0,h=0,a=0;a<t.length;++a){var u=f(t,a);u<0?"-"==t.charAt(a)&&0==this.signum()&&(o=!0):(h=r*h+u,++s>=e&&(this.dMultiply(n),this.dAddOffset(h,0),s=0,h=0));}s>0&&(this.dMultiply(Math.pow(r,s)),this.dAddOffset(h,0)),o&&i.ZERO.subTo(this,this);},i.prototype.fromNumber=function(t,r,e){if("number"==typeof r)if(t<2)this.fromInt(1);else for(this.fromNumber(t,e),this.testBit(t-1)||this.bitwiseTo(i.ONE.shiftLeft(t-1),y,this),this.isEven()&&this.dAddOffset(1,0);!this.isProbablePrime(r);)this.dAddOffset(2,0),this.bitLength()>t&&this.subTo(i.ONE.shiftLeft(t-1),this);else{var n=new Array,o=7&t;n.length=1+(t>>3),r.nextBytes(n),o>0?n[0]&=(1<<o)-1:n[0]=0,this.fromString(n,256);}},i.prototype.bitwiseTo=function(t,r,i){var e,n,o=Math.min(t.t,this.t);for(e=0;e<o;++e)i[e]=r(this[e],t[e]);if(t.t<this.t){for(n=t.s&this.DM,e=o;e<this.t;++e)i[e]=r(this[e],n);i.t=this.t;}else{for(n=this.s&this.DM,e=o;e<t.t;++e)i[e]=r(n,t[e]);i.t=t.t;}i.s=r(this.s,t.s),i.clamp();},i.prototype.changeBit=function(t,r){var e=i.ONE.shiftLeft(t);return this.bitwiseTo(e,r,e),e},i.prototype.addTo=function(t,r){for(var i=0,e=0,n=Math.min(t.t,this.t);i<n;)e+=this[i]+t[i],r[i++]=e&this.DM,e>>=this.DB;if(t.t<this.t){for(e+=t.s;i<this.t;)e+=this[i],r[i++]=e&this.DM,e>>=this.DB;e+=this.s;}else{for(e+=this.s;i<t.t;)e+=t[i],r[i++]=e&this.DM,e>>=this.DB;e+=t.s;}r.s=e<0?-1:0,e>0?r[i++]=e:e<-1&&(r[i++]=this.DV+e),r.t=i,r.clamp();},i.prototype.dMultiply=function(t){this[this.t]=this.am(0,t-1,this,0,0,this.t),++this.t,this.clamp();},i.prototype.dAddOffset=function(t,r){if(0!=t){for(;this.t<=r;)this[this.t++]=0;for(this[r]+=t;this[r]>=this.DV;)this[r]-=this.DV,++r>=this.t&&(this[this.t++]=0),++this[r];}},i.prototype.multiplyLowerTo=function(t,r,i){var e,n=Math.min(this.t+t.t,r);for(i.s=0,i.t=n;n>0;)i[--n]=0;for(e=i.t-this.t;n<e;++n)i[n+this.t]=this.am(0,t[n],i,n,0,this.t);for(e=Math.min(t.t,r);n<e;++n)this.am(0,t[n],i,n,0,r-n);i.clamp();},i.prototype.multiplyUpperTo=function(t,r,i){var e=i.t=this.t+t.t- --r;for(i.s=0;--e>=0;)i[e]=0;for(e=Math.max(r-this.t,0);e<t.t;++e)i[this.t+e-r]=this.am(r-e,t[e],i,0,0,this.t+e-r);i.clamp(),i.drShiftTo(1,i);},i.prototype.modInt=function(t){if(t<=0)return 0;var r=this.DV%t,i=this.s<0?t-1:0;if(this.t>0)if(0==r)i=this[0]%t;else for(var e=this.t-1;e>=0;--e)i=(r*i+this[e])%t;return i},i.prototype.millerRabin=function(t){var r=this.subtract(i.ONE),n=r.getLowestSetBit();if(n<=0)return !1;var o=r.shiftRight(n);(t=t+1>>1)>E.length&&(t=E.length);for(var s=e(),h=0;h<t;++h){s.fromInt(E[Math.floor(Math.random()*E.length)]);var a=s.modPow(o,this);if(0!=a.compareTo(i.ONE)&&0!=a.compareTo(r)){for(var u=1;u++<n&&0!=a.compareTo(r);)if(0==(a=a.modPowInt(2,this)).compareTo(i.ONE))return !1;if(0!=a.compareTo(r))return !1}}return !0},i.prototype.clone=function(){var t=e();return this.copyTo(t),t},i.prototype.intValue=function(){if(this.s<0){if(1==this.t)return this[0]-this.DV;if(0==this.t)return -1}else{if(1==this.t)return this[0];if(0==this.t)return 0}return (this[1]&(1<<32-this.DB)-1)<<this.DB|this[0]},i.prototype.byteValue=function(){return 0==this.t?this.s:this[0]<<24>>24},i.prototype.shortValue=function(){return 0==this.t?this.s:this[0]<<16>>16},i.prototype.signum=function(){return this.s<0?-1:this.t<=0||1==this.t&&this[0]<=0?0:1},i.prototype.toByteArray=function(){var t=this.t,r=new Array;r[0]=this.s;var i,e=this.DB-t*this.DB%8,n=0;if(t-- >0)for(e<this.DB&&(i=this[t]>>e)!=(this.s&this.DM)>>e&&(r[n++]=i|this.s<<this.DB-e);t>=0;)e<8?(i=(this[t]&(1<<e)-1)<<8-e,i|=this[--t]>>(e+=this.DB-8)):(i=this[t]>>(e-=8)&255,e<=0&&(e+=this.DB,--t)),0!=(128&i)&&(i|=-256),0==n&&(128&this.s)!=(128&i)&&++n,(n>0||i!=this.s)&&(r[n++]=i);return r},i.prototype.equals=function(t){return 0==this.compareTo(t)},i.prototype.min=function(t){return this.compareTo(t)<0?this:t},i.prototype.max=function(t){return this.compareTo(t)>0?this:t},i.prototype.and=function(t){var r=e();return this.bitwiseTo(t,v,r),r},i.prototype.or=function(t){var r=e();return this.bitwiseTo(t,y,r),r},i.prototype.xor=function(t){var r=e();return this.bitwiseTo(t,m,r),r},i.prototype.andNot=function(t){var r=e();return this.bitwiseTo(t,g,r),r},i.prototype.not=function(){for(var t=e(),r=0;r<this.t;++r)t[r]=this.DM&~this[r];return t.t=this.t,t.s=~this.s,t},i.prototype.shiftLeft=function(t){var r=e();return t<0?this.rShiftTo(-t,r):this.lShiftTo(t,r),r},i.prototype.shiftRight=function(t){var r=e();return t<0?this.lShiftTo(-t,r):this.rShiftTo(t,r),r},i.prototype.getLowestSetBit=function(){for(var t=0;t<this.t;++t)if(0!=this[t])return t*this.DB+w(this[t]);return this.s<0?this.t*this.DB:-1},i.prototype.bitCount=function(){for(var t=0,r=this.s&this.DM,i=0;i<this.t;++i)t+=T(this[i]^r);return t},i.prototype.testBit=function(t){var r=Math.floor(t/this.DB);return r>=this.t?0!=this.s:0!=(this[r]&1<<t%this.DB)},i.prototype.setBit=function(t){return this.changeBit(t,y)},i.prototype.clearBit=function(t){return this.changeBit(t,g)},i.prototype.flipBit=function(t){return this.changeBit(t,m)},i.prototype.add=function(t){var r=e();return this.addTo(t,r),r},i.prototype.subtract=function(t){var r=e();return this.subTo(t,r),r},i.prototype.multiply=function(t){var r=e();return this.multiplyTo(t,r),r},i.prototype.divide=function(t){var r=e();return this.divRemTo(t,r,null),r},i.prototype.remainder=function(t){var r=e();return this.divRemTo(t,null,r),r},i.prototype.divideAndRemainder=function(t){var r=e(),i=e();return this.divRemTo(t,r,i),new Array(r,i)},i.prototype.modPow=function(t,r){var i,n,o=t.bitLength(),s=c(1);if(o<=0)return s;i=o<18?1:o<48?3:o<144?4:o<768?5:6,n=o<8?new l(r):r.isEven()?new B(r):new d(r);var h=new Array,a=3,u=i-1,f=(1<<i)-1;if(h[1]=n.convert(this),i>1){var v=e();for(n.sqrTo(h[1],v);a<=f;)h[a]=e(),n.mulTo(v,h[a-2],h[a]),a+=2;}var y,m,g=t.t-1,w=!0,T=e();for(o=p(t[g])-1;g>=0;){for(o>=u?y=t[g]>>o-u&f:(y=(t[g]&(1<<o+1)-1)<<u-o,g>0&&(y|=t[g-1]>>this.DB+o-u)),a=i;0==(1&y);)y>>=1,--a;if((o-=a)<0&&(o+=this.DB,--g),w)h[y].copyTo(s),w=!1;else{for(;a>1;)n.sqrTo(s,T),n.sqrTo(T,s),a-=2;a>0?n.sqrTo(s,T):(m=s,s=T,T=m),n.mulTo(T,h[y],s);}for(;g>=0&&0==(t[g]&1<<o);)n.sqrTo(s,T),m=s,s=T,T=m,--o<0&&(o=this.DB-1,--g);}return n.revert(s)},i.prototype.modInverse=function(t){var r=t.isEven();if(this.isEven()&&r||0==t.signum())return i.ZERO;for(var e=t.clone(),n=this.clone(),o=c(1),s=c(0),h=c(0),a=c(1);0!=e.signum();){for(;e.isEven();)e.rShiftTo(1,e),r?(o.isEven()&&s.isEven()||(o.addTo(this,o),s.subTo(t,s)),o.rShiftTo(1,o)):s.isEven()||s.subTo(t,s),s.rShiftTo(1,s);for(;n.isEven();)n.rShiftTo(1,n),r?(h.isEven()&&a.isEven()||(h.addTo(this,h),a.subTo(t,a)),h.rShiftTo(1,h)):a.isEven()||a.subTo(t,a),a.rShiftTo(1,a);e.compareTo(n)>=0?(e.subTo(n,e),r&&o.subTo(h,o),s.subTo(a,s)):(n.subTo(e,n),r&&h.subTo(o,h),a.subTo(s,a));}return 0!=n.compareTo(i.ONE)?i.ZERO:a.compareTo(t)>=0?a.subtract(t):a.signum()<0?(a.addTo(t,a),a.signum()<0?a.add(t):a):a},i.prototype.pow=function(t){return this.exp(t,new b)},i.prototype.gcd=function(t){var r=this.s<0?this.negate():this.clone(),i=t.s<0?t.negate():t.clone();if(r.compareTo(i)<0){var e=r;r=i,i=e;}var n=r.getLowestSetBit(),o=i.getLowestSetBit();if(o<0)return r;for(n<o&&(o=n),o>0&&(r.rShiftTo(o,r),i.rShiftTo(o,i));r.signum()>0;)(n=r.getLowestSetBit())>0&&r.rShiftTo(n,r),(n=i.getLowestSetBit())>0&&i.rShiftTo(n,i),r.compareTo(i)>=0?(r.subTo(i,r),r.rShiftTo(1,r)):(i.subTo(r,i),i.rShiftTo(1,i));return o>0&&i.lShiftTo(o,i),i},i.prototype.isProbablePrime=function(t){var r,i=this.abs();if(1==i.t&&i[0]<=E[E.length-1]){for(r=0;r<E.length;++r)if(i[0]==E[r])return !0;return !1}if(i.isEven())return !1;for(r=1;r<E.length;){for(var e=E[r],n=r+1;n<E.length&&e<_;)e*=E[n++];for(e=i.modInt(e);r<n;)if(e%E[r++]==0)return !1}return i.millerRabin(t)},i.prototype.square=function(){var t=e();return this.squareTo(t),t},i.prototype.Barrett=B,null==A){var k;if(A=new Array,x=0,"undefined"!=typeof window&&window.crypto)if(window.crypto.getRandomValues){var C=new Uint8Array(32);for(window.crypto.getRandomValues(C),k=0;k<32;++k)A[x++]=C[k];}else if("Netscape"==navigator.appName&&navigator.appVersion<"5"){var R=window.crypto.random(32);for(k=0;k<R.length;++k)A[x++]=255&R.charCodeAt(k);}for(;x<P;)k=Math.floor(65536*Math.random()),A[x++]=k>>>8,A[x++]=255&k;x=0,M();}function j(){if(null==D){for(M(),(D=new I).init(A),x=0;x<A.length;++x)A[x]=0;x=0;}return D.next()}function O(){}function I(){this.i=0,this.j=0,this.S=new Array;}O.prototype.nextBytes=function(t){var r;for(r=0;r<t.length;++r)t[r]=j();},I.prototype.init=function(t){var r,i,e;for(r=0;r<256;++r)this.S[r]=r;for(i=0,r=0;r<256;++r)e=this.S[r],this.S[r]=this.S[i=i+this.S[r]+t[r%t.length]&255],this.S[i]=e;this.i=0,this.j=0;},I.prototype.next=function(){var t;return this.i=this.i+1&255,this.j=this.j+this.S[this.i]&255,t=this.S[this.i],this.S[this.i]=this.S[this.j],this.S[this.j]=t,this.S[t+this.S[this.i]&255]};var P=256;i.SecureRandom=O,i.BigInteger=i,r.exports=i;}).call(t);}),h={sha1:"3021300906052b0e03021a05000414",sha224:"302d300d06096086480165030402040500041c",sha256:"3031300d060960864801650304020105000420",sha384:"3041300d060960864801650304020205000430",sha512:"3051300d060960864801650304020305000440",md2:"3020300c06082a864886f70d020205000410",md5:"3020300c06082a864886f70d020505000410",ripemd160:"3021300906052b2403020105000414"},a={sha256:e};function u(t,r){if(this.n=null,this.e=0,!(null!=t&&null!=r&&t.length>0&&r.length>0))throw new Error("Invalid key data");this.n=new s(t,16),this.e=parseInt(r,16);}u.prototype.verify=function(t,r){r=r.replace(/[^0-9a-f]|[\s\n]]/gi,"");var i=new s(r,16);if(i.bitLength()>this.n.bitLength())throw new Error("Signature does not match with the key modulus.");var e=function(t){for(var r in h){var i=h[r],e=i.length;if(t.substring(0,e)===i)return {alg:r,hash:t.substring(e)}}return []}(i.modPowInt(this.e,this.n).toString(16).replace(/^1f+00/,""));if(0===e.length)return !1;if(!a.hasOwnProperty(e.alg))throw new Error("Hashing algorithm is not supported.");var n=a[e.alg](t).toString();return e.hash===n};for(var f=function(t){return 3*t.length/4-w(t)},c=function(t){var r,i,e,n,o,s,h=t.length;o=w(t),s=new v(3*h/4-o),e=o>0?h-4:h;var a=0;for(r=0,i=0;r<e;r+=4,i+=3)n=d[t.charCodeAt(r)]<<18|d[t.charCodeAt(r+1)]<<12|d[t.charCodeAt(r+2)]<<6|d[t.charCodeAt(r+3)],s[a++]=n>>16&255,s[a++]=n>>8&255,s[a++]=255&n;2===o?(n=d[t.charCodeAt(r)]<<2|d[t.charCodeAt(r+1)]>>4,s[a++]=255&n):1===o&&(n=d[t.charCodeAt(r)]<<10|d[t.charCodeAt(r+1)]<<4|d[t.charCodeAt(r+2)]>>2,s[a++]=n>>8&255,s[a++]=255&n);return s},p=function(t){for(var r,i=t.length,e=i%3,n="",o=[],s=0,h=i-e;s<h;s+=16383)o.push(T(t,s,s+16383>h?h:s+16383));1===e?(n+=l[(r=t[i-1])>>2],n+=l[r<<4&63],n+="=="):2===e&&(n+=l[(r=(t[i-2]<<8)+t[i-1])>>10],n+=l[r>>4&63],n+=l[r<<2&63],n+="=");return o.push(n),o.join("")},l=[],d=[],v="undefined"!=typeof Uint8Array?Uint8Array:Array,y="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",m=0,g=y.length;m<g;++m)l[m]=y[m],d[y.charCodeAt(m)]=m;function w(t){var r=t.length;if(r%4>0)throw new Error("Invalid string. Length must be a multiple of 4");return "="===t[r-2]?2:"="===t[r-1]?1:0}function T(t,r,i){for(var e,n=[],o=r;o<i;o+=3)n.push(l[(e=(t[o]<<16)+(t[o+1]<<8)+t[o+2])>>18&63]+l[e>>12&63]+l[e>>6&63]+l[63&e]);return n.join("")}d["-".charCodeAt(0)]=62,d["_".charCodeAt(0)]=63;var b={byteLength:f,toByteArray:c,fromByteArray:p};function S(t){var r=t.length%4;return 0===r?t:t+new Array(1+(4-r)).join("=")}function B(t){return t=S(t).replace(/\-/g,"+").replace(/_/g,"/"),decodeURIComponent(function(t){for(var r="",i=0;i<t.length;i++)r+=String.fromCharCode(t[i]);return r}(b.toByteArray(t)).split("").map(function(t){return "%"+("00"+t.charCodeAt(0).toString(16)).slice(-2)}).join(""))}function D(t){return function(t){for(var r="",i=0;i<t.length;i++){var e=t[i].toString(16);r+=2===e.length?e:"0"+e;}return r}(b.toByteArray(S(t)))}var A=r(function(r){var i,e;i=t,e=function(){return function(){var t=arguments;"object"==typeof arguments[0]&&(t=arguments[0]);var r=[].slice.call(t,0).join("/");return r.replace(/:\//g,"://").replace(/([^:\s])\/+/g,"$1/").replace(/\/(\?|&|#[^!])/g,"$1").replace(/(\?.+)\?/g,"$1&")}},r.exports?r.exports=e():i.urljoin=e();});var x,E={default:function(t,r){return r=r||{},new Promise(function(i,e){var n=new XMLHttpRequest,o=[],s=[],h={},a=function(){return {ok:2==(n.status/100|0),statusText:n.statusText,status:n.status,url:n.responseURL,text:function(){return Promise.resolve(n.responseText)},json:function(){return Promise.resolve(JSON.parse(n.responseText))},blob:function(){return Promise.resolve(new Blob([n.response]))},clone:a,headers:{keys:function(){return o},entries:function(){return s},get:function(t){return h[t.toLowerCase()]},has:function(t){return t.toLowerCase()in h}}}};for(var u in n.open(r.method||"get",t,!0),n.onload=function(){n.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm,function(t,r,i){o.push(r=r.toLowerCase()),s.push([r,i]),h[r]=h[r]?h[r]+","+i:i;}),i(a());},n.onerror=e,n.withCredentials="include"==r.credentials,r.headers)n.setRequestHeader(u,r.headers[u]);n.send(r.body||null);})}},_=(x=E)&&x.default||x,M=window.fetch||(window.fetch=_.default||_),k=r(function(r,i){!function(t){var r=t.Promise,e=r&&"resolve"in r&&"reject"in r&&"all"in r&&"race"in r&&function(){var t;return new r(function(r){t=r;}),"function"==typeof t}();i?(i.Promise=e?r:B,i.Polyfill=B):e||(t.Promise=B);var n="pending",o="sealed",s="fulfilled",h="rejected",a=function(){};function u(t){return "[object Array]"===Object.prototype.toString.call(t)}var f,c="undefined"!=typeof setImmediate?setImmediate:setTimeout,p=[];function l(){for(var t=0;t<p.length;t++)p[t][0](p[t][1]);p=[],f=!1;}function d(t,r){p.push([t,r]),f||(f=!0,c(l,0));}function v(t){var r=t.owner,i=r.state_,e=r.data_,n=t[i],o=t.then;if("function"==typeof n){i=s;try{e=n(e);}catch(t){w(o,t);}}y(o,e)||(i===s&&m(o,e),i===h&&w(o,e));}function y(t,r){var i;try{if(t===r)throw new TypeError("A promises callback cannot return that same promise.");if(r&&("function"==typeof r||"object"==typeof r)){var e=r.then;if("function"==typeof e)return e.call(r,function(e){i||(i=!0,r!==e?m(t,e):g(t,e));},function(r){i||(i=!0,w(t,r));}),!0}}catch(r){return i||w(t,r),!0}return !1}function m(t,r){t!==r&&y(t,r)||g(t,r);}function g(t,r){t.state_===n&&(t.state_=o,t.data_=r,d(b,t));}function w(t,r){t.state_===n&&(t.state_=o,t.data_=r,d(S,t));}function T(t){var r=t.then_;t.then_=void 0;for(var i=0;i<r.length;i++)v(r[i]);}function b(t){t.state_=s,T(t);}function S(t){t.state_=h,T(t);}function B(t){if("function"!=typeof t)throw new TypeError("Promise constructor takes a function argument");if(this instanceof B==!1)throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");this.then_=[],function(t,r){function i(t){w(r,t);}try{t(function(t){m(r,t);},i);}catch(t){i(t);}}(t,this);}B.prototype={constructor:B,state_:n,then_:null,data_:void 0,then:function(t,r){var i={owner:this,then:new this.constructor(a),fulfilled:t,rejected:r};return this.state_===s||this.state_===h?d(v,i):this.then_.push(i),i.then},catch:function(t){return this.then(null,t)}},B.all=function(t){if(!u(t))throw new TypeError("You must pass an array to Promise.all().");return new this(function(r,i){var e=[],n=0;function o(t){return n++,function(i){e[t]=i,--n||r(e);}}for(var s,h=0;h<t.length;h++)(s=t[h])&&"function"==typeof s.then?s.then(o(h),i):e[h]=s;n||r(e);})},B.race=function(t){if(!u(t))throw new TypeError("You must pass an array to Promise.race().");return new this(function(r,i){for(var e,n=0;n<t.length;n++)(e=t[n])&&"function"==typeof e.then?e.then(r,i):r(e);})},B.resolve=function(t){return t&&"object"==typeof t&&t.constructor===this?t:new this(function(r){r(t);})},B.reject=function(t){return new this(function(r,i){i(t);})};}("undefined"!=typeof window?window:void 0!==t?t:"undefined"!=typeof self?self:t);}),C=k.Promise;function R(t){if(t.ok)return t.json();var r=new Error(t.statusText);return r.response=t,C.reject(r)}function j(t,r){var i=t.jwksURI||A(t.iss,".well-known","jwks.json");return M(i).then(R).then(function(i){var e,n,o,s=null;for(e=0;e<i.keys.length&&null===s;e++)(n=i.keys[e]).kid===t.kid&&(s=n);return r(null,{modulus:D((o=s).n),exp:D(o.e)})}).catch(function(t){r(t);})}function O(t){this.name="ConfigurationError",this.message=t||"";}function I(t){this.name="TokenValidationError",this.message=t||"";}O.prototype=Error.prototype,I.prototype=Error.prototype;var P=function(){};P.prototype.get=function(){return null},P.prototype.has=function(){return null},P.prototype.set=function(){return null};var N=["RS256"];function V(t){var r=t||{};if(this.jwksCache=r.jwksCache||new P,this.expectedAlg=r.expectedAlg||"RS256",this.issuer=r.issuer,this.audience=r.audience,this.leeway=r.leeway||0,this.__disableExpirationCheck=r.__disableExpirationCheck||!1,this.jwksURI=r.jwksURI,this.leeway<0||this.leeway>300)throw new O("The leeway should be positive and lower than five minutes.");if(-1===N.indexOf(this.expectedAlg))throw new O("Algorithm "+this.expectedAlg+" is not supported. (Expected algs: ["+N.join(",")+"])")}V.prototype.verify=function(t,r,i){var e=this.decode(t);if(e instanceof Error)return i(e,!1);var n=e.encoded.header+"."+e.encoded.payload,o=D(e.encoded.signature),s=e.header.alg,h=e.header.kid,a=e.payload.aud,u=e.payload.iss,f=e.payload.exp,c=e.payload.nbf,p=e.payload.nonce||null;if(this.issuer!==u)return i(new I("Issuer "+u+" is not valid."),!1);if(this.audience!==a)return i(new I("Audience "+a+" is not valid."),!1);if(p!==r)return i(new I("Nonce does not match."),!1);if(this.expectedAlg!==s)return i(new I("Algorithm "+s+" is not supported. (Expected algs: ["+N.join(",")+"])"),!1);var l=this.verifyExpAndNbf(f,c);return l?i(l,!1):this.getRsaVerifier(u,h,function(t,r){return t?i(t):r.verify(n,o)?i(null,e.payload):i(new I("Invalid signature."))})},V.prototype.verifyExpAndNbf=function(t,r){var i=new Date,e=new Date(0),n=new Date(0);return this.__disableExpirationCheck?null:(e.setUTCSeconds(t+this.leeway),i>e?new I("Expired token."):void 0===r?null:(n.setUTCSeconds(r-this.leeway),i<n?new I("The token is not valid until later in the future. Please check your computed clock."):null))},V.prototype.verifyExpAndIat=function(t,r){var i=new Date,e=new Date(0),n=new Date(0);return this.__disableExpirationCheck?null:(e.setUTCSeconds(t+this.leeway),i>e?new I("Expired token."):(n.setUTCSeconds(r-this.leeway),i<n?new I("The token was issued in the future. Please check your computed clock."):null))},V.prototype.getRsaVerifier=function(t,r,i){var e=this,n=t+r;if(this.jwksCache.has(n)){var o=this.jwksCache.get(n);i(null,new u(o.modulus,o.exp));}else j({jwksURI:this.jwksURI,iss:t,kid:r},function(t,r){return t?i(t):(e.jwksCache.set(n,r),i(null,new u(r.modulus,r.exp)))});},V.prototype.decode=function(t){var r,i,e=t.split(".");if(3!==e.length)return new I("Cannot decode a malformed JWT");try{r=JSON.parse(B(e[0])),i=JSON.parse(B(e[1]));}catch(t){return new I("Token header or payload is not valid JSON")}return {header:r,payload:i,encoded:{header:e[0],payload:e[1],signature:e[2]}}},V.prototype.validateAccessToken=function(t,r,i,s){if(this.expectedAlg!==r)return s(new I("Algorithm "+r+" is not supported. (Expected alg: "+this.expectedAlg+")"));var h,a=e(t),u=o.stringify(a),f=u.substring(0,u.length/2),c=o.parse(f),p=n.stringify(c);return s((h={"+":"-","/":"_","=":""},p.replace(/[+\/=]/g,function(t){return h[t]}))!==i?new I("Invalid access_token"):null)};

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
	  var charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';

	  var cryptoObj = windowHandler.getWindow().crypto || windowHandler.getWindow().msCrypto;
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
	  this.storage = new Storage(options);
	  this.options = options;
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
	  var isHostedLoginPage = windowHandler.getWindow().location.host === this.options.domain;
	  if (!isHostedLoginPage) {
	    this.storage.setItem(
	      this.namespace + state,
	      {
	        nonce: nonce,
	        appState: appState,
	        state: state,
	        lastUsedConnection: lastUsedConnection
	      },
	      { expires: MINUTES_30 }
	    );
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
	  var _window = windowHandler.getWindow();

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
	        return (
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

	  var currentOrigin = windowHandler.getOrigin();
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

	  runWebMessageFlow(this.webAuth.client.buildAuthorizeUrl(options), options, function(
	    err,
	    eventData
	  ) {
	    var error = err;
	    if (!err && eventData.event.data.response.error) {
	      error = eventData.event.data.response;
	    }
	    if (!error) {
	      var parsedHash = eventData.event.data.response;
	      return _this.webAuth.validateAuthenticationResponse(options, parsedHash, cb);
	    }
	    if (
	      error.error === 'consent_required' &&
	      windowHandler.getWindow().location.hostname === 'localhost'
	    ) {
	      _this.warn.warning(
	        "Consent Required. Consent can't be skipped on localhost. Read more here: https://auth0.com/docs/api-auth/user-consent#skipping-consent-for-first-party-clients"
	      );
	    }
	    _this.webAuth.transactionManager.clearTransaction(error.state);
	    return cb(objectHelper.pick(error, ['error', 'error_description']));
	  });
	};

	function CrossOriginAuthentication(webAuth, options) {
	  this.webAuth = webAuth;
	  this.baseOptions = options;
	  this.request = new RequestBuilder(options);
	  this.webMessageHandler = new WebMessageHandler(webAuth);
	  this.storage = new Storage(options);
	}

	function getFragment(name) {
	  var theWindow = windowHandler.getWindow();
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
	      var popupMode = options.popup === true;
	      options = objectHelper.blacklist(options, ['password', 'credentialType', 'otp', 'popup']);
	      var authorizeOptions = objectHelper
	        .merge(options)
	        .with({ loginTicket: data.body.login_ticket });
	      var key = createKey(_this.baseOptions.rootUrl, data.body.co_id);
	      _this.storage.setItem(key, data.body.co_verifier, { expires: MINUTES_15 });
	      if (popupMode) {
	        _this.webMessageHandler.run(
	          authorizeOptions,
	          wrapCallback(cb, { forceLegacyError: true })
	        );
	      } else {
	        _this.webAuth.authorize(authorizeOptions);
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
	 */
	CrossOriginAuthentication.prototype.callback = function() {
	  var targetOrigin = decodeURIComponent(getFragment('origin'));
	  var theWindow = windowHandler.getWindow();
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

	if (module.exports) {
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
	  var _window = windowHandler.getWindow();

	  var screenX = typeof _window.screenX !== 'undefined' ? _window.screenX : _window.screenLeft;
	  var screenY = typeof _window.screenY !== 'undefined' ? _window.screenY : _window.screenTop;

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
	  var _window = windowHandler.getWindow();
	  var popupPosition = this.calculatePosition(options.popupOptions || {});
	  var popupOptions = objectHelper.merge(popupPosition).with(options.popupOptions);
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
	  var popupOptions = objectHelper.merge(popupPosition).with(options.popupOptions);

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

	function Popup(webAuth, options) {
	  this.baseOptions = options;
	  this.baseOptions.popupOrigin = options.popupOrigin;
	  this.client = webAuth.client;
	  this.webAuth = webAuth;

	  this.transactionManager = new TransactionManager(this.baseOptions);
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
	  var theWindow = windowHandler.getWindow();
	  options = options || {};
	  var originUrl = options.popupOrigin || this.baseOptions.popupOrigin || windowHandler.getOrigin();

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

	  return popup.load(url, relayUrl, popOpts, wrapCallback(cb, { keepOriginalCasing: true }));
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
	    windowHandler.getWindow().location.origin ||
	    windowHandler.getWindow().location.protocol +
	      '//' +
	      windowHandler.getWindow().location.hostname +
	      (windowHandler.getWindow().location.port ? ':' + windowHandler.getWindow().location.port : '');
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

	  return this.request
	    .post(url)
	    .send(body)
	    .end(wrapCallback(cb));
	};

	UsernamePassword.prototype.callback = function(formHtml) {
	  var div;
	  var form;
	  var _document = windowHandler.getDocument();

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
	 * @param {credentialsCallback} cb
	 */
	HostedPages.prototype.login = function(options, cb) {
	  if (windowHandler.getWindow().location.host !== this.baseOptions.domain) {
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
	 * @param {Array} [options.plugins]
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

	  this.baseOptions._sendTelemetry =
	    this.baseOptions._sendTelemetry === false ? this.baseOptions._sendTelemetry : true;

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

	  this.transactionManager = new TransactionManager(this.baseOptions);

	  this.client = new Authentication(this.baseOptions);
	  this.redirect = new Redirect(this, this.baseOptions);
	  this.popup = new Popup(this, this.baseOptions);
	  this.crossOriginAuthentication = new CrossOriginAuthentication(this, this.baseOptions);
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

	  var _window = windowHandler.getWindow();

	  var hashStr = options.hash === undefined ? _window.location.hash : options.hash;
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
	      _this.ssodataStorage.set(transaction.lastUsedConnection, sub);
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
	      // id_token's generated by non-oidc applications don't have at_hash
	      if (!payload.at_hash) {
	        return callback(null, payload);
	      }
	      // here we're absolutely sure that the id_token's alg is RS256
	      // and that the id_token is valid, so we can check the access_token
	      return new V().validateAccessToken(
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
	    if (
	      validationError.error !== 'invalid_token' ||
	      validationError.errorDescription === 'Nonce does not match.'
	    ) {
	      return callback(validationError);
	    }
	    // if it's an invalid_token error, decode the token
	    var decodedToken = new V().decode(parsedHash.id_token);
	    // if the alg is not HS256, return the raw error
	    if (decodedToken.header.alg !== 'HS256') {
	      return callback(validationError);
	    }
	    if ((decodedToken.payload.nonce || null) !== transactionNonce) {
	      return callback({
	        error: 'invalid_token',
	        errorDescription: 'Nonce does not match.'
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
	    return _this.client.userInfo(parsedHash.access_token, function(errUserInfo, profile) {
	      // if the /userinfo request fails, use the validationError instead
	      if (errUserInfo) {
	        return callback(errUserInfo);
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
	  var verifier = new V({
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
	 */
	WebAuth.prototype.renewAuth = function(options, cb) {
	  var handler;
	  var usePostMessage = !!options.usePostMessage;
	  var postMessageDataType = options.postMessageDataType || false;
	  var postMessageOrigin = options.postMessageOrigin || windowHandler.getWindow().origin;
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
	 * @param {Object} [options]
	 * @param {String} [options.clientID] the Client ID found on your Application settings page
	 * @param {String} [options.responseType] type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
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

	  if (!params.redirectUri) {
	    return cb({ error: 'error', error_description: "redirectUri can't be empty" });
	  }

	  assert.check(params, { type: 'object', message: 'options parameter is not valid' });
	  assert.check(cb, { type: 'function', message: 'cb parameter is not valid' });

	  params = objectHelper.blacklist(params, ['usePostMessage', 'tenant', 'postMessageDataType']);
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
	 * @param {Object} [options]
	 * @param {String} [options.clientID] the Client ID found on your Application settings page
	 * @param {String} options.redirectUri url that the Auth0 will redirect after Auth with the Authorization Response
	 * @param {String} options.responseType type of the response used by OAuth 2.0 flow. It can be any space separated list of the values `code`, `token`, `id_token`. {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html}
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

	  windowHandler.redirect(this.client.buildAuthorizeUrl(params));
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
	 * @param {String} options.password Password
	 * @param {String} [options.realm] Realm used to authenticate the user, it can be a realm name or a database connection name
	 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
	 */
	WebAuth.prototype.login = function(options, cb) {
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
	  params = this.transactionManager.process(params);

	  var isHostedLoginPage = windowHandler.getWindow().location.host === this.baseOptions.domain;
	  if (isHostedLoginPage) {
	    params.connection = params.realm;
	    delete params.realm;
	    this._universalLogin.login(params, cb);
	  } else {
	    this.crossOriginAuthentication.login(params, cb);
	  }
	};

	/**
	 * Logs in the user by verifying the verification code (OTP) using the cross origin authentication (/co/authenticate) flow. You can use either `phoneNumber` or `email` to identify the user.
	 * This only works when 3rd party cookies are enabled in the browser. After the /co/authenticate call, you'll have to use the {@link parseHash} function at the `redirectUri` specified in the constructor.
	 *
	 * @method passwordlessLogin
	 * @param {Object} options options used in the {@link authorize} call after the login_ticket is acquired
	 * @param {String} [options.phoneNumber] Phone Number (mutually exclusive with email)
	 * @param {String} [options.email] Email (mutually exclusive with username)
	 * @param {String} options.verificationCode Verification Code (OTP)
	 * @param {String} options.connection Passwordless connection to use. It can either be 'sms' or 'email'.
	 * @param {crossOriginLoginCallback} cb Callback function called only when an authentication error, like invalid username or password, occurs. For other types of errors, there will be a redirect to the `redirectUri`.
	 */
	WebAuth.prototype.passwordlessLogin = function(options, cb) {
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
	  params = this.transactionManager.process(params);

	  var isHostedLoginPage = windowHandler.getWindow().location.host === this.baseOptions.domain;
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
	      objectHelper.blacklist(params, ['connection', 'email', 'phoneNumber', 'verificationCode'])
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
	 * - If the client_id parameter is included, the returnTo URL must be listed in the Allowed Logout URLs set at the Auth0 Application level (see Setting Allowed Logout URLs at the App Level).
	 * - If the client_id parameter is NOT included, the returnTo URL must be listed in the Allowed Logout URLs set at the account level (see Setting Allowed Logout URLs at the Account Level).
	 *
	 * @method logout
	 * @param {Object} [options]
	 * @param {String} [options.clientID] the Client ID found on your Application settings page
	 * @param {String} [options.returnTo] URL to be redirected after the logout
	 * @param {Boolean} [options.federated] tells Auth0 if it should logout the user also from the IdP.
	 * @see   {@link https://auth0.com/docs/api/authentication#logout}
	 */
	WebAuth.prototype.logout = function(options) {
	  windowHandler.redirect(this.client.buildLogoutUrl(options));
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
	    return windowHandler.redirect(_this.client.passwordless.buildVerifyUrl(params));
	  });
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

	  qString = lib.stringify(params);

	  return urlJoin(this.baseOptions.rootUrl, 'passwordless', 'verify_redirect', '?' + qString);
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

	  url = urlJoin(this.baseOptions.rootUrl, 'passwordless', 'start');

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

	  return this.request
	    .post(url)
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

	  url = urlJoin(this.baseOptions.rootUrl, 'passwordless', 'verify');

	  return this.request
	    .post(url)
	    .send(cleanOption)
	    .end(wrapCallback(cb));
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

	  url = urlJoin(this.baseOptions.rootUrl, 'dbconnections', 'signup');

	  body = objectHelper.merge(this.baseOptions, ['clientID']).with(options);

	  metadata = body.user_metadata || body.userMetadata;

	  body = objectHelper.blacklist(body, ['scope', 'userMetadata', 'user_metadata']);

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

	  url = urlJoin(this.baseOptions.rootUrl, 'dbconnections', 'change_password');

	  body = objectHelper.merge(this.baseOptions, ['clientID']).with(options, ['email', 'connection']);

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
	  this.baseOptions._sendTelemetry =
	    this.baseOptions._sendTelemetry === false ? this.baseOptions._sendTelemetry : true;

	  this.baseOptions.rootUrl = 'https://' + this.baseOptions.domain;

	  this.request = new RequestBuilder(this.baseOptions);

	  this.passwordless = new PasswordlessAuthentication(this.request, this.baseOptions);
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
	 */

	/**
	 * @callback tokenCallback
	 * @param {Error} [err] error returned by Auth0 with the reason of the Auth failure
	 * @param {Object} [result] result of the Auth request
	 * @param {String} result.accessToken token that allows access to the specified resource server (identified by the audience parameter or by default Auth0's /userinfo endpoint)
	 * @param {Number} result.expiresIn number of seconds until the access token expires
	 * @param {String} [result.idToken] token that identifies the user
	 * @param {String} [result.refreshToken] token that can be used to get new access tokens from Auth0. Note that not all Auth0 Applications can request them or the resource server might not allow them.
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

	  url = urlJoin(this.baseOptions.rootUrl, 'oauth', 'token');

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
	 */
	Authentication.prototype.getSSOData = function(withActiveDirectories, cb) {
	  /* istanbul ignore if  */
	  if (!this.auth0) {
	    this.auth0 = new WebAuth(this.baseOptions);
	  }
	  var isHostedLoginPage = windowHandler.getWindow().location.host === this.baseOptions.domain;
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

	  url = urlJoin(this.baseOptions.rootUrl, 'userinfo');

	  return this.request
	    .get(url)
	    .set('Authorization', 'Bearer ' + accessToken)
	    .end(wrapCallback(cb, { ignoreCasing: true }));
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

	  this.baseOptions.headers = { Authorization: 'Bearer ' + this.baseOptions.token };

	  this.request = new RequestBuilder(this.baseOptions);
	  this.baseOptions.rootUrl = urlJoin('https://' + this.baseOptions.domain, 'api', 'v2');
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
	 */
	Management.prototype.patchUserMetadata = function(userId, userMetadata, cb) {
	  var url;

	  assert.check(userId, { type: 'string', message: 'userId parameter is not valid' });
	  assert.check(userMetadata, { type: 'object', message: 'userMetadata parameter is not valid' });
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
	 */
	Management.prototype.patchUserAttributes = function(userId, user, cb) {
	  var url;

	  assert.check(userId, { type: 'string', message: 'userId parameter is not valid' });
	  assert.check(user, { type: 'object', message: 'user parameter is not valid' });
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
	exports.version = version;
	exports.default = index;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
