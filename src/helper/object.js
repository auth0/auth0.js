/* eslint-disable no-param-reassign */

var assert = require('./assert');
var objectAssign = require('./object-assign');

function pick(object, keys) {
  return keys.reduce(function (prev, key) {
    if (object[key]) {
      prev[key] = object[key];
    }
    return prev;
  }, {});
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
  if (typeof(object) !== 'object' || assert.isArray(object) || !object === null) {
    return object;
  }

  exceptions = exceptions || [];

  return Object.keys(object).reduce(function (p, key) {
    var newKey = exceptions.indexOf(key) === -1 ? camelToSnake(key) : key;
    p[newKey] = toSnakeCase(object[key]);
    return p;
  }, {});
}

function toCamelCase(object, exceptions) {

  if (typeof(object) !== 'object' || assert.isArray(object) || !object === null) {
    return object;
  }

  exceptions = exceptions || [];

  return Object.keys(object).reduce(function (p, key) {
    var newKey = exceptions.indexOf(key) === -1 ? snakeToCamel(key) : key;
    p[newKey] = toCamelCase(object[key]);
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
