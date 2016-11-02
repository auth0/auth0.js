module.exports = function(o) {
  return Object.keys(o).map(function(qs, k){
    return k + "=" + o[k];
  }).join("&");
}