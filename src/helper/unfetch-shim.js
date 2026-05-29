// unfetch shim — delegates to native fetch. Used by idtoken-verifier's
// JWKS fetcher once the idtoken-verifier alias redirects to its source.
export default function unfetch(url, options) {
  // eslint-disable-next-line no-undef, compat/compat 
  return globalThis.fetch(url, options);
}
