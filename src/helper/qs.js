function build(params) {
  return Object.keys(params).reduce(function (arr, key) {
    if (typeof params[key] !== 'undefined') {
      arr.push(key + '=' + encodeURIComponent(params[key]));
    }
    return arr;
  }, []).join('&');
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
