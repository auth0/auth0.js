var base64Url = require('./base64_url');

function getPayload(jwt) {
  var encoded = jwt && jwt.split('.')[1];
  return JSON.parse(base64Url.decode(encoded));
}

module.exports = {
  getPayload: getPayload
};
