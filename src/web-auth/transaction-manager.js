var random = require('../helper/random');
var storage = require('../helper/storage');

var DEFAULT_NAMESPACE = 'com.auth0.auth.';

function TransactionManager(options) {
  options = options || {};
  this.namespace = options.namespace || DEFAULT_NAMESPACE;
  this.keyLength = options.keyLength || 32;
}

TransactionManager.prototype.process = function(options) {
  if (!options.responseType) {
    throw new Error('responseType is required');
  }
  var responseTypeIncludesIdToken = options.responseType.indexOf('id_token') !== -1;

  var transaction = this.generateTransaction(
    options.appState,
    options.state,
    options.nonce,
    responseTypeIncludesIdToken
  );
  if (!options.state) {
    options.state = transaction.state;
  }

  if (responseTypeIncludesIdToken && !options.nonce) {
    options.nonce = transaction.nonce;
  }

  return options;
};

TransactionManager.prototype.generateTransaction = function(appState, state, nonce, generateNonce) {
  state = state || random.randomString(this.keyLength);
  nonce = nonce || (generateNonce ? random.randomString(this.keyLength) : null);

  storage.setItem(this.namespace + state, {
    nonce: nonce,
    appState: appState,
    state: state
  });

  return {
    state: state,
    nonce: nonce
  };
};

TransactionManager.prototype.getStoredTransaction = function(state) {
  var transactionData;

  transactionData = storage.getItem(this.namespace + state);
  storage.removeItem(this.namespace + state);
  return transactionData;
};

module.exports = TransactionManager;
