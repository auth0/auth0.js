var objectHelper = require('../helper/object');

var authorize_params = [
// auth0
  'connection',
  'auth0Client',
  'owp',
// oauth2
  'client_id',
  'response_type',
  'response_mode',
  'redirect_uri',
  'audience',
  'scope',
  'state',
  'nonce',
  'display',
  'prompt',
  'max_age',
  'ui_locales',
  'claims_locales',
  'id_token_hint',
  'login_hint',
  'acr_values',
  'claims',
  'registration',
  'request',
  'request_uri',
  'code_challenge',
  'code_challenge_method'
];

function oauthAuthorizeParams(params) {
  return objectHelper.pick(params, authorize_params);
}

module.exports = {
  oauthAuthorizeParams: oauthAuthorizeParams
};
