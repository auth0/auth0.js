/**
 * Expose `JSON.parse` method or fallback if not
 * exists on `window`
 */

module.exports = 'undefined' === typeof window.JSON
  ? require('json-fallback').parse
  : window.JSON.parse;
