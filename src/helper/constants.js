const constants = {
  // alphabetical order
  params: {
    additional: {
      access_type: 'access_type',
      display: 'display'
    },
    auth0: {
      audience: 'audience',
      auth0Client: 'auth0Client',
      connection: 'connection',
      connection_scope: 'connection_scope',
      _csrf: '_csrf',
      device: 'device',
      _intstate: '_intstate',
      login_ticket: 'login_ticket',
      owp: 'owp',
      protocol: 'protocol',
      realm: 'realm'
    },
    blacklist: {
      connection: 'connection',
      domain: 'domain',
      email: 'email',
      federated: 'federated',
      phoneNumber: 'phoneNumber',
      popupOptions: 'popupOptions',
      postMessageDataType: 'postMessageDataType',
      postMessageOrigin: 'postMessageOrigin',
      tenant: 'tenant',
      timeout: 'timeout',
      usePostMessage: 'usePostMessage',
      userMetadata: 'userMetadata',
      username: 'username',
      verificationCode: 'verificationCode'
    },
    oauth2: {
      acr_values: 'acr_values',
      assertion: 'assertion',
      claims: 'claims',
      claims_locales: 'claims_locales',
      client_assertion: 'client_assertion',
      client_assertion_type: 'client_assertion_type',
      client_id: 'client_id',
      client_secret: 'client_secret',
      code: 'code',
      code_challenge: 'code_challenge',
      code_challenge_method: 'code_challenge_method',
      code_verifier: 'code_verifier',
      display: 'display',
      grant_type: 'grant_type',
      id_token_hint: 'id_token_hint',
      login_hint: 'login_hint',
      max_age: 'max_age',
      nonce: 'nonce',
      password: 'password',
      prompt: 'prompt',
      redirect_uri: 'redirect_uri',
      registration: 'registration',
      refresh_token: 'refresh_token',
      request: 'request',
      request_uri: 'request_uri',
      response_mode: 'response_mode',
      response_type: 'response_type',
      scope: 'scope',
      state: 'state',
      tenant: 'tenant',
      ui_locales: 'ui_locales',
      username: 'username'
    },
    toSnakeCase: {
      auth0Client: 'auth0Client'
    }
  }
};

const paramArrays = {
  toSnakeCaseBaseParams: [constants.params.toSnakeCase.auth0Client]
};
export default {
  constants: constants,
  paramArrays: paramArrays
};
