function qsBuild(params) {
  return Object.keys(params).reduce(function (arr, key) {
    if (typeof params[key] !== 'undefined') {
      arr.push(key + '=' + params[key]);
    }
    return arr;
  }, []).join('&');
}

module.exports = qsBuild;
