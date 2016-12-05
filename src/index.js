var Authentication = require('./authentication');
var Management = require('./management');
var WebAuth = require('./web-auth');
var version = require('./version');

module.exports = {
  Authentication: Authentication,
  Management: Management,
  WebAuth: WebAuth,
  version: version.raw
};
