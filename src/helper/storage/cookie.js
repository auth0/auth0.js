import Cookie from 'js-cookie';
import objectHelper from '../object';
import windowHandler from '../window';
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

  if (windowHandler.getWindow().location.protocol === 'https:') {
    params.secure = true;
  }

  Cookie.set(key, value, params);
};

export default CookieStorage;
