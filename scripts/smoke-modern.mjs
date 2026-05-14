/* eslint-disable no-console, import/no-extraneous-dependencies */
// Headless Chrome smoke test for the modern build flavor. Drives the OIDC
// implicit (id_token) flow against the bundled oidc-provider and asserts that
// auth0.parseHash returns a valid id_token. Run via `npm run smoke:modern`.
//
// Requires:
//   - A running dev server on http://localhost:3000 serving example/ and dist/
//     (the npm script wraps `npm start` so this is handled automatically).
//   - A chromedriver matching the installed Chrome major version. If you see
//     "session not created", install one matching: `npm i -D chromedriver@<major>`.
import webdriver from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const { By, until } = webdriver;
const TIMEOUT = 15000;

function log(msg) { console.log('[smoke:modern] ' + msg); }
function fail(msg) {
  console.error('[smoke:modern] FAIL: ' + msg);
  process.exitCode = 1;
}

const builder = new webdriver.Builder().forBrowser('chrome');
const opts = new chrome.Options().addArguments('--headless=new', '--no-sandbox');
opts.setLoggingPrefs({ browser: 'ALL' });
builder.setChromeOptions(opts);

const driver = await builder.build();

async function dumpConsole(label) {
  try {
    const logs = await driver.manage().logs().get('browser');
    if (logs.length) {
      log('---' + label + ' console logs (' + logs.length + ') ---');
      logs.forEach(function (e) {
        log('[' + e.level.name + '] ' + e.message);
      });
    }
  } catch (_) {}
}

try {
  log('Navigating to /test-modern.html');
  await driver.get('http://127.0.0.1:3000/test-modern.html');

  log('Waiting for #loaded');
  await driver.wait(until.elementLocated(By.id('loaded')), TIMEOUT);

  log('Checking window.auth0.WebAuth is exposed by modern UMD');
  const hasWebAuth = await driver.executeScript(
    'return typeof window.auth0 === "object" && typeof window.auth0.WebAuth === "function";'
  );
  if (!hasWebAuth) {
    throw new Error('window.auth0.WebAuth not exposed by modern UMD bundle');
  }
  log('window.auth0.WebAuth present ✓');

  log('Driving redirect + id_token flow');
  await driver.findElement(By.id('login-response-type')).sendKeys('id_token');
  await driver.findElement(By.className('login-redirect-authorize')).click();

  log('Submitting login');
  await driver.wait(until.elementLocated(By.className('login-card')), TIMEOUT);
  await driver.findElement(By.name('login')).sendKeys('test');
  await driver.findElement(By.name('password')).sendKeys('test');
  await driver.findElement(By.className('login-submit')).click();

  log('Submitting consent');
  await driver.wait(until.elementLocated(By.className('login-card')), TIMEOUT);
  await driver.findElement(By.className('login-submit')).click();

  log('Waiting for parseHash to fire (#parsed)');
  await driver.wait(until.elementLocated(By.id('parsed')), TIMEOUT);

  const errText = await driver.findElement(By.id('err')).getText();
  const resultText = await driver.findElement(By.id('result')).getText();

  if (errText) {
    throw new Error('parseHash err: ' + errText);
  }
  log('parseHash err empty ✓');

  if (!resultText) {
    throw new Error('result element empty');
  }
  const parsed = JSON.parse(resultText);
  if (!parsed.idToken) {
    throw new Error('parseHash result missing idToken: ' + resultText);
  }
  log('idToken present ✓');
  log('Modern bundle e2e: PASS');
} catch (e) {
  fail(e && e.stack ? e.stack : String(e));
  try {
    const url = await driver.getCurrentUrl();
    log('URL at failure: ' + url);
  } catch (_) {}
  await dumpConsole('on failure');
} finally {
  await driver.quit();
}
