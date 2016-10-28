var IframeHandler = function (options) {
  this.url = options.url;
  this.callback = options.callback;
  this.timeout = options.timeout || 60 * 1000;
  this.timeoutCallback = options.timeoutCallback || null;
  this.useWebMessage = options.useWebMessage || false;
  this.iframe = null;
  this.timeoutHandle = null;
  this._destroyTimeout = null;
}

IframeHandler.prototype.init = function (url) {
  this.iframe = document.createElement('iframe');
  this.iframe.style.display = "none";
  this.iframe.src = this.url;

  this.messageEventListener = this.messageEventListener.bind(this);
  this.loadEventListener = this.loadEventListener.bind(this);
  this.destroy = this.destroy.bind(this);
  this.timeoutHandler = this.timeoutHandler.bind(this);

  if (this.useWebMessage) {
    window.addEventListener("message", this.messageEventListener, false);
  } 
  else {
    this.iframe.addEventListener("load", this.loadEventListener, false);
  }

  document.body.appendChild(this.iframe);

  this.timeoutHandle = setTimeout(this.timeoutHandler, this.timeout);
}

IframeHandler.prototype.messageEventListener = function (e) { 
  this.callbackHandler(e.data);

  this.destroy()
}

IframeHandler.prototype.loadEventListener = function () { 
  var result = auth0.parseHash(this.iframe.contentWindow.location.hash);

  if (!result) return;

  this.callbackHandler(result);
  
  this.destroy();
}

IframeHandler.prototype.callbackHandler = function (result) {
  var error = null;

  if (result.error) {
    error = result;
    result = null;
  }

  this.callback(error, result);
}

IframeHandler.prototype.timeoutHandler = function () {
  if (this.timeoutCallback) {
    this.timeoutCallback();
  }
  this.destroy();
}
IframeHandler.prototype.destroy = function () {
  var _this = this;

  if (this.timeoutHandle) {
    clearTimeout(this.timeoutHandle);
  }

  this._destroyTimeout = setTimeout(function (){
    window.removeEventListener("message", _this.messageEventListener, false);
    _this.iframe.removeEventListener("load", _this.loadEventListener, false);
    document.body.removeChild(_this.iframe)
  }, 0);
} 


module.exports = IframeHandler;