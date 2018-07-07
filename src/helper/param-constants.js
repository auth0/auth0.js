import params from '../helper/constants';

const paramsArray = {
  blacklist: {
    popup: {
      handler: {
        base: [params.blacklist.popupHandler],
        connection: [params.blacklist.popupHandler, params.blacklist.connection]
      },
      auth: [
        params.blacklist.domain,
        params.blacklist.popupOptions,
        params.blacklist.username,
        params.blacklist.tenant,
        params.blacklist.timeout
      ],
      crossOrigin: [
        params.blacklist.password,
        params.blacklist.credentialType,
        params.blacklist.otp,
        params.blacklist.popup
      ]
    },
    post: {
      base: [
        params.blacklist.postMessageDataType,
        params.blacklist.tenant,
        params.blacklist.usePostMessage
      ],
      origin: [
        params.blacklist.postMessageDataType,
        params.blacklist.postMessageOrigin,
        params.blacklist.tenant,
        params.blacklist.usePostMessage
      ]
    },
    metadata: [
      params.blacklist.scope,
      params.blacklist.userMetadata,
      params.blacklist.user_metadata
    ],
    login: [
      params.blacklist.connection,
      params.blacklist.email,
      params.blacklist.phoneNumber,
      params.blacklist.verificationCode
    ]
  },
  snakeCase: {
    base: [params.toSnakeCase.auth0Client],
    auth: [params.toSnakeCase.auth0Client, params.toSnakeCase.authParams]
  },
  resourceOwnerloginParams: [params.oauth2.clientID, params.oauth2.scope],
  passwordlessAuthParams: [
    params.oauth2.clientID,
    params.oauth2.responseType,
    params.oauth2.responseMode,
    params.oauth2.redirectUri,
    params.oauth2.scope,
    params.oauth2.audience,
    params.auth0._csrf,
    params.oauth2.state,
    params.auth0._intstate,
    params.auth0.protocol,
    params.oauth2.nonce
  ],
  usernamePasswordLogin: [
    params.oauth2.clientID,
    params.oauth2.redirectUri,
    params.oauth2.tenant,
    params.oauth2.responseType,
    params.oauth2.responseMode,
    params.oauth2.scope,
    params.oauth2.audience
  ],
  pluginParams: [
    params.oauth2.clientID,
    params.oauth2.scope,
    params.oauth2.domain,
    params.oauth2.audience,
    params.oauth2.tenant,
    params.oauth2.responseType,
    params.oauth2.redirectUri,
    params.auth0._csrf,
    params.oauth2.state,
    params.auth0._intstate,
    params.oauth2.nonce
  ],
  loginWithCredentialsParams: [
    params.oauth2.responseType,
    params.oauth2.redirectUri,
    params.oauth2.state,
    params.oauth2.nonce
  ],
  hostedAuthParams: [
    params.oauth2.clientID,
    params.oauth2.responseType,
    params.oauth2.responseMode,
    params.oauth2.redirectUri,
    params.oauth2.scope,
    params.oauth2.audience,
    params.auth0._csrf,
    params.oauth2.state,
    params.auth0._intstate,
    params.oauth2.tenant,
    params.oauth2.nonce
  ],
  passwordlessVerifyParams: [
    params.oauth2.clientID,
    params.oauth2.responseType,
    params.oauth2.responseMode,
    params.oauth2.redirectUri,
    params.oauth2.scope,
    params.oauth2.audience,
    params.auth0._csrf,
    params.oauth2.state,
    params.auth0._intstate,
    params.oauth2.nonce
  ],
  passwordlessStartParams: [
    params.oauth2.responseType,
    params.oauth2.responseMode,
    params.oauth2.redirectUri,
    params.oauth2.scope,
    params.oauth2.audience,
    params.auth0._csrf,
    params.oauth2.state,
    params.auth0._intstate,
    params.oauth2.nonce
  ],
  authorizeParams: [
    params.oauth2.responseType,
    params.oauth2.responseMode,
    params.oauth2.redirectUri,
    params.oauth2.scope,
    params.oauth2.audience,
    params.auth0._csrf,
    params.oauth2.state,
    params.auth0._intstate,
    params.oauth2.nonce
  ],
  renewAuthParams: [
    params.oauth2.clientID,
    params.oauth2.responseType,
    params.oauth2.redirectUri,
    params.oauth2.scope,
    params.oauth2.audience,
    params.auth0._csrf,
    params.oauth2.state,
    params.auth0._intstate,
    params.oauth2.nonce
  ],
  resourceOwnerOptionsParams: [
    params.oauth2.username,
    params.oauth2.password,
    params.oauth2.scope,
    params.auth0.connection,
    params.auth0.device
  ],
  passwordlessAuthUrlBaseParams: [
    params.oauth2.clientID,
    params.oauth2.responseType,
    params.oauth2.redirectUri,
    params.oauth2.scope
  ],
  authUrlParams: [
    params.oauth2.clientID,
    params.oauth2.responseType,
    params.oauth2.responseMode,
    params.oauth2.redirectUri,
    params.oauth2.scope,
    params.oauth2.audience
  ],
  oauthUrlParams: [params.oauth2.clientID, params.oauth2.scope, params.oauth2.audience],
  baseParams: [params.oauth2.clientID]
};

export default paramsArray;
