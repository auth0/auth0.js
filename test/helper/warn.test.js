import expect from 'expect.js';

import { stub } from 'sinon';

import Warn from '../../src/helper/warn';

describe('helpers warn', function() {
  afterEach(function() {
    console.warn.restore();
  });

  it('should show a warning in the console', function() {
    stub(console, 'warn', function(message) {
      expect(message).to.be('the message');
    });

    var warn = new Warn({});
    warn.warning('the message');
  });

  it('should not show a warning in the console', function() {
    stub(console, 'warn', function(message) {
      throw Error('warn was called');
    });

    var warn = new Warn({ disableWarnings: true });
    warn.warning('the message');
  });
});
