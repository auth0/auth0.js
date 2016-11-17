function wrapCallback(cb) {
  return function (err, data) {

    if (err) {
      var data = {
        original: err
      };

      if (err.response && err.response.statusCode) {
        data.status_code = err.response.statusCode;
      }

      if (err.response && err.response.statusText) {
        data.status_text = err.response.statusText;
      }

      if (err.response && err.response.body) {
        err = err.response.body;
      }

      data.code = err.error || err.code || err.error_code || null;
      data.description = err.error_description || err.description || err.error || null;
      data.name = err.name || null;

      return cb(data);
    }

    return cb(null, data.body || data.text);
  };
}

module.exports = wrapCallback;
