/* eslint-disable no-console */
import { execSync } from 'child_process';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const library = require('../package.json');

if (process.platform === 'win32') {
  console.error('Must be run on a Unix OS');
  process.exit(1);
}

execSync('npm run jsdocs', { stdio: 'inherit' });
if (fs.existsSync('docs')) {
  execSync('rm -r docs', { stdio: 'inherit' });
}
execSync(`mv out/auth0-js/${library.version}/ docs`, { stdio: 'inherit' });
execSync('git add docs');
