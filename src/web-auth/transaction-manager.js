var random = require('../helper/random');
var storage = require('../helper/storage');

var DEFAULT_NAMESPACE = 'com.auth0.auth.';

function TransactionManager(options) {
  options = options || {};
  this.namespace = options.namespace || DEFAULT_NAMESPACE;
  this.keyLength = options.keyLength || 32;
}

TransactionManager.prototype.process = function (options) {
  var transaction;

  if (options.responseType.indexOf('code') !== -1) {
    return options;
  }

  if (options.responseType.indexOf('id_token') !== -1 && !!options.nonce) {
    return options;
  }

  transaction = this.generateTransaction(options.appState, options.state, options.nonce);

  options.state = transaction.state;

  if (options.responseType.indexOf('id_token') !== -1) {
    options.nonce = transaction.nonce;
  }

  return options;
};

TransactionManager.prototype.generateTransaction = function (appState, state, nonce) {
  var transaction = state || random.randomString(this.keyLength);
  nonce = nonce || random.randomString(this.keyLength);

  storage.setItem(this.namespace + transaction, {
    nonce: nonce,
    appState: appState
  });

  return {
    state: transaction,
    nonce: nonce
  };
};

TransactionManager.prototype.getStoredTransaction = function (transaction) {
  var transactionData;

  transactionData = storage.getItem(this.namespace + transaction);
  storage.removeItem(this.namespace + transaction);
  return transactionData;
};

module.exports = TransactionManager;
