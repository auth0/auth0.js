import params from '../helper/constants';

const paramsArray = {
  authUrlParams: [
    params.oauth2.cliendID,
    params.oauth2.responseType,
    params.oauth2.responseMode,
    params.oauth2.redirectUri,
    params.oauth2.scope,
    params.oauth2.audience
  ],
  baseParams: [params.oauth2.clientID],
  blacklistAuthParams: [
    params.blacklist.domain,
    params.blacklist.popupOptions,
    params.blacklist.username,
    params.blacklist.tenant,
    params.blacklist.timeout
  ],
  blacklistDBParams: [
    params.blacklist.scope,
    params.blacklist.userMetadata,
    params.blacklist.user_metadata
  ],
  blacklistPopupParams: [params.blacklist.popupHandler],
  blacklistPostMessageParams: [
    params.blacklist.postMessageDataType,
    params.blacklist.tenant,
    params.blacklist.usePostMessage
  ],
  blacklistPostMessageOriginParams: [
    params.blacklist.postMessageDataType,
    params.blacklist.postMessageOrigin,
    params.blacklist.tenant,
    params.blacklist.usePostMessage
  ],
  blacklistUnhostedLoginParams: [
    params.blacklist.connection,
    params.blacklist.email,
    params.blacklist.phoneNumber,
    params.blacklist.verificationCode
  ],
  toSnakeCaseAuthParams: [params.toSnakeCase.auth0Client, params.toSnakeCase.authParams],
  toSnakeCaseBaseParams: [params.toSnakeCase.auth0Client]
};

export default paramsArray;
