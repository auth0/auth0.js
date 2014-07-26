/**
 * Module dependencies.
 */

var toString = Object.prototype.toString;

/**
 * Expose `is_array`
 */

module.exports = is_array;

/**
 * Wrap `Array.isArray` Polyfill for IE9
 * source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
 *
 * @param {Array} array
 * @public
 */

function is_array (array) {
  return toString.call(array) === '[object Array]';
};
