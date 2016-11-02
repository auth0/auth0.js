var pick = function(ks, o) {
  return ks.reduce(function(p, k){
    p[k] = o[k];
    return p;
  }, {});
}

var extend = function() {
  var params = Array.from(arguments);
  params.unshift({});
  return Object.assign.apply(undefined, params);
}

module.exports = {
  pick: pick,
  extend: extend
}