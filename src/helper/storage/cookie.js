import Cookie from 'js-cookie';
import objectHelper from '../object';
import windowHandler from '../window';

function buildCompatCookieKey(key) {
  return '_' + key + '_compat';
}

function CookieStorage(options) {
  this._options = options || {};
}

CookieStorage.prototype.getItem = function (key) {
  var cookie = Cookie.get(key);

  return cookie || Cookie.get(buildCompatCookieKey(key));
};

CookieStorage.prototype.removeItem = function (key) {
  Cookie.remove(key);
  Cookie.remove(buildCompatCookieKey(key));
};

CookieStorage.prototype.setItem = function (key, value, options) {
  var params = objectHelper.extend(
    {
      expires: 1 // 1 day
    },
    options
  );

  if (windowHandler.getWindow().location.protocol === 'https:') {
    params.secure = true;
    params.sameSite = 'none';

    if (this._options.legacySameSiteCookie) {
      // Save a compatibility cookie without sameSite='none' for browsers that don't support it.
      var legacyOptions = objectHelper.blacklist(params, ['sameSite']);
      Cookie.set(buildCompatCookieKey(key), value, legacyOptions);
    }
  }

  Cookie.set(key, value, params);
};

export default CookieStorage;
