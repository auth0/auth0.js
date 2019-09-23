import error from './error';
import responseHandler from './response-handler';

function wrapCallback(cb, options) {
  var handler = responseHandler(cb, options);
  return function (err, data) {
    if (!err && !data) {
      return cb(error.buildResponse('generic_error', 'Something went wrong'));
    }

    if (err) {
      return handler.catch(err);
    }
    return handler.then(data);
  }
}

export default wrapCallback;
