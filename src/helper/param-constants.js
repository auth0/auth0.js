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
  clientID: {
    base: [params.oauth2.clientID],
    scope: {
      base: [params.oauth2.clientID, params.oauth2.scope],
      audience: [params.oauth2.clientID, params.oauth2.scope, params.oauth2.audience],
      response: {
        base: [
          params.oauth2.clientID,
          params.oauth2.responseType,
          params.oauth2.redirectUri,
          params.oauth2.scope
        ],
        audience: [
          params.oauth2.clientID,
          params.oauth2.responseType,
          params.oauth2.responseMode,
          params.oauth2.redirectUri,
          params.oauth2.scope,
          params.oauth2.audience
        ],
        nonce: {
          base: [
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
          responseMode: [
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
          domain: [
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
          protocol: [
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
          tenant: {
            base: [
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
            ]
          }
        },
        tenant: [
          params.oauth2.clientID,
          params.oauth2.redirectUri,
          params.oauth2.tenant,
          params.oauth2.responseType,
          params.oauth2.responseMode,
          params.oauth2.scope,
          params.oauth2.audience
        ]
      }
    }
  },
  noClientID: {
    base: [
      params.oauth2.responseType,
      params.oauth2.redirectUri,
      params.oauth2.state,
      params.oauth2.nonce
    ],
    responseMode: [
      params.oauth2.responseType,
      params.oauth2.responseMode,
      params.oauth2.redirectUri,
      params.oauth2.scope,
      params.oauth2.audience,
      params.auth0._csrf,
      params.oauth2.state,
      params.auth0._intstate,
      params.oauth2.nonce
    ]
  },

  resourceOptions: [
    params.oauth2.username,
    params.oauth2.password,
    params.oauth2.scope,
    params.auth0.connection,
    params.auth0.device
  ]
};

export default paramsArray;
