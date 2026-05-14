## Development

Run `npm install` to set up the environment.

Run `npm start` to point your browser to [`https://localhost:3000/`](https://localhost:3000/) to verify the example page works.

Run `npm test` to run the test suite.

Run `npm run ci:test` to run the tests that ci runs.

Run `npm run test:watch` to run the test suite while you work.

Run `npm run test:coverage` to run the test suite with coverage report.

Run `npm run lint` to run the linter and check code styles.

Run `npm install && npm run build && npm run test:es-check:es5 && npm run test:es-check:es2015:module` to check for JS incompatibility.

Run `npm run smoke:modern` to validate the modern bundle (`dist/auth0.modern.js`) end-to-end. The script starts the dev server, drives a headless Chrome through the OIDC implicit (id_token) flow against the bundled oidc-provider, and asserts that `parseHash` returns a valid id_token. Useful before publishing changes to the modern build flavor or any of its shims (`src/helper/*-shim.js`). Requires a chromedriver matching your installed Chrome major version — install with `npm i -D chromedriver@<major>` if you see "session not created".

See [.circleci/config.yml](.circleci/config.yml) for additional checks that might be run as part of
[circleci integration tests](https://circleci.com/).
