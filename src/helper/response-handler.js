function wrapCallback(cb) {
  return function (err, data) {
    if (err) {
      return cb(err);
    }

    return cb(null, data.body);
  };
}

module.exports = wrapCallback;
