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

function toSnakeCase(object, exceptions) {
  exceptions = exceptions || [];

  return Object.keys(object).reduce(function (p, key) {
    var newKey = exceptions.indexOf(key) === -1 ? camelToSnake(key) : key;
    p[newKey] = object[key];
    return p;
  }, {});
}

module.exports = {
  toSnakeCase: toSnakeCase,
  blacklist: blacklist,
  merge: merge,
  pick: pick,
  extend: extend
};
