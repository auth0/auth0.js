/* eslint-disable class-methods-use-this */

import Cookie from 'js-cookie';
import objectHelper from '../object';
import windowHandler from '../window';

class CookieStorage {
  getItem(key) {
    return Cookie.get(key);
  }

  removeItem(key) {
    Cookie.remove(key);
  }

  setItem(key, value, options) {
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
  }
}

export default CookieStorage;
