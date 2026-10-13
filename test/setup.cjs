const { URL: NodeURL } = require('node:url');

require('jsdom-global/register');

if (typeof globalThis.URL.canParse !== 'function') {
  globalThis.URL.canParse = NodeURL.canParse.bind(NodeURL);
}
