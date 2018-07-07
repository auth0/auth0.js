// For future reference:,
// The only parameters that should be whitelisted are parameters
// defined by the specification, or existing parameters that we
// need for compatibility

import objectHelper from './object';
import constants from './constants';

var tokenParams = [
  // auth0
  constants.params.auth0.realm,
  constants.params.auth0.audience,
  // oauth2
  constants.params.oauth2.client_id,
  constants.params.oauth2.client_secret,
  constants.params.oauth2.redirect_uri,
  constants.params.oauth2.scope,
  constants.params.oauth2.code,
  constants.params.oauth2.grant_type,
  constants.params.oauth2.username,
  constants.params.oauth2.password,
  constants.params.oauth2.refresh_token,
  constants.params.oauth2.assertion,
  constants.params.oauth2.client_assertion,
  constants.params.oauth2.client_assertion_type,
  constants.params.oauth2.code_verifier
];

var authorizeParams = [
  // auth0
  constants.params.auth0.connection,
  constants.params.auth0.connection_scope,
  constants.params.auth0.auth0Client,
  constants.params.auth0.owp,
  constants.params.auth0.device,
  constants.params.auth0.realm,

  constants.params.auth0.protocol,
  constants.params.auth0._csrf,
  constants.params.auth0._intstate,
  constants.params.auth0.login_ticket,

  // oauth2
  constants.params.oauth2.client_id,
  constants.params.oauth2.response_type,
  constants.params.oauth2.response_mode,
  constants.params.oauth2.redirect_uri,
  constants.params.oauth2.audience,
  constants.params.oauth2.scope,
  constants.params.oauth2.state,
  constants.params.oauth2.nonce,
  constants.params.oauth2.display,
  constants.params.oauth2.prompt,
  constants.params.oauth2.max_age,
  constants.params.oauth2.ui_locales,
  constants.params.oauth2.claims_locales,
  constants.params.oauth2.id_token_hint,
  constants.params.oauth2.login_hint,
  constants.params.oauth2.acr_values,
  constants.params.oauth2.claims,
  constants.params.oauth2.registration,
  constants.params.oauth2.request,
  constants.params.oauth2.request_uri,
  constants.params.oauth2.code_challenge,
  constants.params.oauth2.code_challenge_method,

  // ADDITIONAL_PARAMETERS:
  // https://auth0.com/docs/api/authentication?javascript#social
  constants.params.additional.access_type,
  constants.params.additional.display
];

function oauthAuthorizeParams(warn, params) {
  var notAllowed = objectHelper.getKeysNotIn(params, authorizeParams);

  if (notAllowed.length > 0) {
    warn.warning(
      'Following parameters are not allowed on the `/authorize` endpoint: [' +
        notAllowed.join(',') +
        ']'
    );
  }

  return params;
}

function oauthTokenParams(warn, params) {
  return objectHelper.pick(params, tokenParams);
}

export default {
  oauthTokenParams: oauthTokenParams,
  oauthAuthorizeParams: oauthAuthorizeParams
};
