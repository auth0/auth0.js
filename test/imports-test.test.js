import expect from 'expect.js';

import * as auth0 from '../src/index';
import auth0Default from '../src/index';

describe('Exports the correct objects', () => {
  it('should export raw objects', () => {
    expect(Object.keys(auth0)).to.be.eql([
      'Authentication',
      'Management',
      'WebAuth',
      'version',
      'default'
    ]);
  });
  it('should export default object', () => {
    expect(Object.keys(auth0Default)).to.be.eql([
      'Authentication',
      'Management',
      'WebAuth',
      'version'
    ]);
  });
});
