import error from './error';
import objectHelper from './object';

function wrapCallback(cb, options) {
  options = options || {};
  options.ignoreCasing = options.ignoreCasing ? options.ignoreCasing : false;

  return {
    then: function(data) {
      if (!data) {
        return cb(error.buildResponse('generic_error', 'Something went wrong'));
      }
      if (
        data.type &&
        (data.type === 'text/html' || data.type === 'text/plain')
      ) {
        return cb(null, data.text);
      }

      if (options.ignoreCasing) {
        return cb(null, data.body || data);
      }

      return cb(
        null,
        objectHelper.toCamelCase(data.body || data, [], {
          keepOriginal: options.keepOriginalCasing
        })
      );
    },
    catch: function (err) {
      if (!err) {
        return cb(error.buildResponse('generic_error', 'Something went wrong'));
      }
      var errObj = {
        original: err
      };

      if (err.response && err.response.statusCode) {
        errObj.statusCode = err.response.statusCode;
      }

      if (err.response && err.response.statusText) {
        errObj.statusText = err.response.statusText;
      }

      if (err.response && err.response.body) {
        err = err.response.body;
      }

      if (err.err) {
        err = err.err;
      }

      errObj.code =
        err.code || err.error || err.error_code || err.status || null;
      errObj.description =
        err.errorDescription ||
        err.error_description ||
        err.description ||
        err.error ||
        err.details ||
        err.err ||
        null;
      if (options.forceLegacyError) {
        errObj.error = errObj.code;
        errObj.error_description = errObj.description;
      }

      if (err.name) {
        errObj.name = err.name;
      }

      if (err.policy) {
        errObj.policy = err.policy;
      }

      return cb(errObj);
    }
  };
}

export default wrapCallback;
