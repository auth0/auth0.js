function build(params, glue, uriEncodedValues) {
  glue = glue || '&';
  uriEncodedValues = uriEncodedValues !== false;

  return Object.keys(params).reduce(function (arr, key) {
    if (typeof params[key] !== 'undefined') {
      arr.push(key + '=' + (uriEncodedValues ? encodeURIComponent(params[key]) : params[key]));
    }
    return arr;
  }, []).join(glue);
}

function parse(qs) {
  return qs.split('&').reduce(function (prev, curr) {
    var param = curr.split('=');
    prev[param[0]] = param[1];
    return prev;
  }, {});
}

module.exports = {
  build: build,
  parse: parse
};
