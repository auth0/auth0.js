/* eslint-disable no-console */

function Warn(options) {
  this.disableWarnings = options.disableWarnings;
}

Warn.prototype.warning = function(message) {
  if (this.disableWarnings) {
    return;
  }

  console.warn(message);
};

export default Warn;
