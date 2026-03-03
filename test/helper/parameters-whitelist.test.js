import expect from 'expect.js';

import parametersWhitelist from '../../src/helper/parameters-whitelist';

var noopWarn = { warning: function() {} };

describe('parameters-whitelist', function() {
  describe('oauthTokenParams', function() {
    it('should keep known params and strip unknown params for non-CTE grant types', function() {
      var result = parametersWhitelist.oauthTokenParams(noopWarn, {
        client_id: 'test-client',
        grant_type: 'password',
        subject_token: 'abc',
        subject_token_type: 'urn:acme:token',
        organization: 'org_123',
        custom_param: 'should-be-stripped'
      });

      expect(result.client_id).to.be('test-client');
      expect(result.grant_type).to.be('password');
      expect(result.subject_token).to.be('abc');
      expect(result.subject_token_type).to.be('urn:acme:token');
      expect(result.organization).to.be('org_123');
      expect(result).to.not.have.property('custom_param');
    });

    it('should bypass whitelist and return all params for CTE grant type', function() {
      var input = {
        client_id: 'test-client',
        grant_type:
          'urn:ietf:params:oauth:grant-type:token-exchange',
        subject_token: 'ext-token',
        subject_token_type: 'urn:acme:legacy',
        custom_param: 'custom_value',
        device_fingerprint: 'fp123'
      };

      var result = parametersWhitelist.oauthTokenParams(
        noopWarn,
        input
      );

      expect(result).to.be(input);
      expect(result).to.eql(input);
      expect(result).to.have.property('custom_param');
      expect(result).to.have.property('device_fingerprint');
    });
  });
});
