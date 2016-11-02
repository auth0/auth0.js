var version = require('./version');
var Authentication = require('./authentication');
var Management = require('./management');
var WebAuth = require('./web-auth');

module.exports = {
  version: version,
  Authentication: Authentication,
  Management: Management,
  WebAuth: WebAuth
};
