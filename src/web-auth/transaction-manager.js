import random from '../helper/random';
import Storage from '../helper/storage';
import * as times from '../helper/times';

var DEFAULT_NAMESPACE = 'com.auth0.auth.';

function TransactionManager(options) {
  var transaction = options.transaction || {};
  this.namespace = transaction.namespace || DEFAULT_NAMESPACE;
  this.keyLength = transaction.keyLength || 32;
  this.storage = new Storage(options);
}

TransactionManager.prototype.process = function(options) {
  if (!options.responseType) {
    throw new Error('responseType is required');
  }
  var lastUsedConnection = options.realm || options.connection;
  var responseTypeIncludesIdToken = options.responseType.indexOf('id_token') !== -1;

  var transaction = this.generateTransaction(
    options.appState,
    options.state,
    options.nonce,
    lastUsedConnection,
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

TransactionManager.prototype.generateTransaction = function(
  appState,
  state,
  nonce,
  lastUsedConnection,
  generateNonce
) {
  state = state || random.randomString(this.keyLength);
  nonce = nonce || (generateNonce ? random.randomString(this.keyLength) : null);

  this.storage.setItem(
    this.namespace + state,
    {
      nonce: nonce,
      appState: appState,
      state: state,
      lastUsedConnection: lastUsedConnection
    },
    { expires: times.MINUTES_30 }
  );
  return {
    state: state,
    nonce: nonce
  };
};

TransactionManager.prototype.getStoredTransaction = function(state) {
  var transactionData;

  transactionData = this.storage.getItem(this.namespace + state);
  this.clearTransaction(state);
  return transactionData;
};

TransactionManager.prototype.clearTransaction = function(state) {
  this.storage.removeItem(this.namespace + state);
};

export default TransactionManager;
