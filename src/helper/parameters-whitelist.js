// For future reference:,
// The only parameters that should be whitelisted are parameters
// defined by the specification, or existing parameters that we
// need for compatibility

import objectHelper from './object';
import constants from './constants';

var tokenParams = [
  // auth0
  constants.auth0.realm,
  constants.auth0.audience,
  // oauth2
  constants.oauth2.client_id,
  constants.oauth2.client_secret,
  constants.oauth2.redirect_uri,
  constants.oauth2.scope,
  constants.oauth2.code,
  constants.oauth2.grant_type,
  constants.oauth2.username,
  constants.oauth2.password,
  constants.oauth2.refresh_token,
  constants.oauth2.assertion,
  constants.oauth2.client_assertion,
  constants.oauth2.client_assertion_type,
  constants.oauth2.code_verifier
];

var authorizeParams = [
  // auth0
  constants.auth0.connection,
  constants.auth0.connection_scope,
  constants.auth0.auth0Client,
  constants.auth0.owp,
  constants.auth0.device,
  constants.auth0.realm,

  constants.auth0.protocol,
  constants.auth0._csrf,
  constants.auth0._intstate,
  constants.auth0.login_ticket,

  // oauth2
  constants.oauth2.client_id,
  constants.oauth2.response_type,
  constants.oauth2.response_mode,
  constants.oauth2.redirect_uri,
  constants.oauth2.audience,
  constants.oauth2.scope,
  constants.oauth2.state,
  constants.oauth2.nonce,
  constants.oauth2.display,
  constants.oauth2.prompt,
  constants.oauth2.max_age,
  constants.oauth2.ui_locales,
  constants.oauth2.claims_locales,
  constants.oauth2.id_token_hint,
  constants.oauth2.login_hint,
  constants.oauth2.acr_values,
  constants.oauth2.claims,
  constants.oauth2.registration,
  constants.oauth2.request,
  constants.oauth2.request_uri,
  constants.oauth2.code_challenge,
  constants.oauth2.code_challenge_method,

  // ADDITIONAL_PARAMETERS:
  // https://auth0.com/docs/api/authentication?javascript#social
  constants.additional.access_type,
  constants.additional.display
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
