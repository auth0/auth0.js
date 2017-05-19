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

module.exports = {
  check: check,
  attribute: attribute,
  variable: variable,
  value: value,
  isArray: isArray,
  supportsIsArray: supportsIsArray
};
