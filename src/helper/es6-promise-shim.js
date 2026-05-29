// es6-promise no-op shim. Reached only via idtoken-verifier's `p.polyfill()`
// call after the idtoken-verifier alias redirects to its source.
function polyfill() {}

// eslint-disable-next-line no-undef, compat/compat 
export default { polyfill, Promise: globalThis.Promise };
export { polyfill };
