if (process.platform === 'win32') {
  console.error('Must be run on a Unix OS');
  process.exit(1);
}

var library = require('../package.json');
var execSync = require('child_process').execSync;
var fs = require('fs');

execSync('npm run jsdocs', { stdio: 'inherit' });
if (fs.existsSync('docs')) {
  execSync('rm -r docs', { stdio: 'inherit' });
}
execSync(`mv out/auth0-js/${library.version}/ docs`, { stdio: 'inherit' });
execSync('git add docs');
