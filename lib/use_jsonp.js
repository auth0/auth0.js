module.exports = function () {
  return 'XDomainRequest' in window && window.location.protocol === 'http:';
};