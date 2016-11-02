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

module.exports = {
  blacklist: blacklist,
  merge: merge,
  pick: pick,
  extend: extend
};
