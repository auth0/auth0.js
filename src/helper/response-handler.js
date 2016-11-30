var error = require('./error');

function wrapCallback(cb) {
  return function (err, data) {
    var errObj;

    if (!err && !data) {
      return cb(error.buildResponse('generic_error', 'Something went wrong'));
    }

    if (err) {
      errObj = {
        original: err
      };

      if (err.response && err.response.statusCode) {
        errObj.status_code = err.response.statusCode;
      }

      if (err.response && err.response.statusText) {
        errObj.status_text = err.response.statusText;
      }

      if (err.response && err.response.body) {
        err = err.response.body;
      }

      if (err.err) {
        err = err.err;
      }

      errObj.code = err.error || err.code || err.error_code || err.status || null;
      errObj.description = err.error_description || err.description || err.error || err.details || err.err || null;

      if (err.name) {
        errObj.name = err.name;
      }

      return cb(errObj);
    }

    return cb(null, data.body || data.text || data);
  };
}

module.exports = wrapCallback;
