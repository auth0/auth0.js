import version from '../../src/version';

class MockPlugin {
  constructor (configuration) {
    configuration = configuration || {};

    this.version = configuration.version || version.raw;
    this.handler = configuration.handler || null;
    this.extensibilityPoints = configuration.extensibilityPoints || [];
  }

  supports(extensibilityPoint) {
    return this.extensibilityPoints.indexOf(extensibilityPoint) > -1;
  }

  setWebAuth(webAuth) {
    this.webAuth = webAuth;
  }

  init() {
    return this.handler;
  }
}

module.exports = MockPlugin;
