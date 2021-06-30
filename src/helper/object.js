/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */

import assert from './assert';
import objectAssign from './object-assign';

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

export default {
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
