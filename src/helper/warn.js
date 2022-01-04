/* eslint-disable no-console */

class Warn {
  constructor (options) {
    this.disableWarnings = options.disableWarnings;
  }

  warning(message) {
    if (this.disableWarnings) {
      return;
    }

    console.warn(message);
  }
}


export default Warn;
