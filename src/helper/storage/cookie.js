var Cookie = require('js-cookie');
var objectHelper = require('../object');
function CookieStorage() {}

CookieStorage.prototype.getItem = function(key) {
  return Cookie.get(key);
};

CookieStorage.prototype.removeItem = function(key) {
  Cookie.remove(key);
};

CookieStorage.prototype.setItem = function(key, value, options) {
  var params = objectHelper.extend(
    {
      expires: 1 // 1 day
    },
    options
  );
  Cookie.set(key, value, params);
};

module.exports = CookieStorage;
