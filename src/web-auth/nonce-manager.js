var random = require('../helper/random');
var storage = require('../helper/storage');
var NONCE_KEY = 'current_transaction_nonce';

function generateNonce(options) {
  var nonce = random.randomString(length.length || 32);
  storage.setItem(options.namespace + NONCE_KEY, nonce);
  return nonce;
}

function getStoredNonce(options) {
  var nonce = storage.setItem(options.namespace + NONCE_KEY);
  storage.removeItem(options.namespace + NONCE_KEY);
  return nonce;
}

module.exports = {
  generateNonce: generateNonce,
  getStoredNonce: getStoredNonce
};
