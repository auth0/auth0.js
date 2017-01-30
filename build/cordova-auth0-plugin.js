(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("cordova-auth0-plugin", [], factory);
	else if(typeof exports === 'object')
		exports["cordova-auth0-plugin"] = factory();
	else
		root["CordovaAuth0Plugin"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(33);


/***/ },

/***/ 2:
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {function redirect(url) {
	  global.window.location = url;
	}
	
	function getDocument() {
	  return global.window.document;
	}
	
	function getWindow() {
	  return global.window;
	}
	
	module.exports = {
	  redirect: redirect,
	  getDocument: getDocument,
	  getWindow: getWindow
	};
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },

/***/ 3:
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (name, context, definition) {
	  if (typeof module !== 'undefined' && module.exports) module.exports = definition();
	  else if (true) !(__WEBPACK_AMD_DEFINE_FACTORY__ = (definition), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  else context[name] = definition();
	})('urljoin', this, function () {
	
	  function normalize (str, options) {
	
	    // make sure protocol is followed by two slashes
	    str = str.replace(/:\//g, '://');
	
	    // remove consecutive slashes
	    str = str.replace(/([^:\s])\/+/g, '$1/');
	
	    // remove trailing slash before parameters or hash
	    str = str.replace(/\/(\?|&|#[^!])/g, '$1');
	
	    // replace ? in parameters with &
	    str = str.replace(/(\?.+)\?/g, '$1&');
	
	    return str;
	  }
	
	  return function () {
	    var input = arguments;
	    var options = {};
	
	    if (typeof arguments[0] === 'object') {
	      // new syntax with array and options
	      input = arguments[0];
	      options = arguments[1] || {};
	    }
	
	    var joined = [].slice.call(input, 0).join('/');
	    return normalize(joined, options);
	  };
	
	});


/***/ },

/***/ 5:
/***/ function(module, exports) {

	function build(params, glue, uriEncodedValues) {
	  glue = glue || '&';
	  uriEncodedValues = uriEncodedValues !== false;
	
	  return Object.keys(params).reduce(function (arr, key) {
	    if (typeof params[key] !== 'undefined') {
	      arr.push(key + '=' + (uriEncodedValues ? encodeURIComponent(params[key]) : params[key]));
	    }
	    return arr;
	  }, []).join(glue);
	}
	
	function parse(qs) {
	  return qs.split('&').reduce(function (prev, curr) {
	    var param = curr.split('=');
	    prev[param[0]] = param[1];
	    return prev;
	  }, {});
	}
	
	module.exports = {
	  build: build,
	  parse: parse
	};


/***/ },

/***/ 7:
/***/ function(module, exports) {

	module.exports = { raw: '8.2.0' };


/***/ },

/***/ 33:
/***/ function(module, exports, __webpack_require__) {

	var version = __webpack_require__(7);
	var windowHandler = __webpack_require__(2);
	var PluginHandler = __webpack_require__(34);
	
	function CordovaPlugin() {
	  this.webAuth = null;
	  this.version = version.raw;
	  this.extensibilityPoints = [
	    'popup.authorize',
	    'popup.getPopupHandler'
	  ];
	}
	
	CordovaPlugin.prototype.setWebAuth = function (webAuth) {
	  this.webAuth = webAuth;
	};
	
	CordovaPlugin.prototype.supports = function (extensibilityPoint) {
	  var _window = windowHandler.getWindow();
	  return (!!_window.cordova || !!_window.electron) &&
	          this.extensibilityPoints.indexOf(extensibilityPoint) > -1;
	};
	
	CordovaPlugin.prototype.init = function () {
	  return new PluginHandler(this.webAuth);
	};
	
	module.exports = CordovaPlugin;


/***/ },

/***/ 34:
/***/ function(module, exports, __webpack_require__) {

	var urljoin = __webpack_require__(3);
	var PopupHandler = __webpack_require__(35);
	
	function PluginHandler(webAuth) {
	  this.webAuth = webAuth;
	}
	
	PluginHandler.prototype.processParams = function (params) {
	  params.redirectUri = urljoin('https://' + params.domain, 'mobile');
	  delete params.owp;
	  return params;
	};
	
	PluginHandler.prototype.getPopupHandler = function () {
	  return new PopupHandler(this.webAuth);
	};
	
	module.exports = PluginHandler;


/***/ },

/***/ 35:
/***/ function(module, exports, __webpack_require__) {

	var windowHandler = __webpack_require__(2);
	var qs = __webpack_require__(5);
	
	function PopupHandler(webAuth) {
	  this.webAuth = webAuth;
	  this._current_popup = null;
	  this.options = null;
	}
	
	PopupHandler.prototype.preload = function (options) {
	  var _this = this;
	  var _window = windowHandler.getWindow();
	
	  var url = options.url || 'about:blank';
	  var popupOptions = options.popupOptions || {};
	
	  popupOptions.location = 'yes';
	  delete popupOptions.width;
	  delete popupOptions.height;
	
	  var windowFeatures = qs.build(popupOptions, ',', false);
	
	  if (this._current_popup && !this._current_popup.closed) {
	    return this._current_popup;
	  }
	
	  this._current_popup = _window.open(url, '_blank', windowFeatures);
	
	  this._current_popup.kill = function (success) {
	    _this._current_popup.success = success;
	    this.close();
	    _this._current_popup = null;
	  };
	
	  return this._current_popup;
	};
	
	PopupHandler.prototype.load = function (url, _, options, cb) {
	  var _this = this;
	  this.url = url;
	  this.options = options;
	  if (!this._current_popup) {
	    options.url = url;
	    this.preload(options);
	  } else {
	    this._current_popup.location.href = url;
	  }
	
	  this.transientErrorHandler = function (event) {
	    _this.errorHandler(event, cb);
	  };
	
	  this.transientStartHandler = function (event) {
	    _this.startHandler(event, cb);
	  };
	
	  this.transientExitHandler = function () {
	    _this.exitHandler(cb);
	  };
	
	  this._current_popup.addEventListener('loaderror', this.transientErrorHandler);
	  this._current_popup.addEventListener('loadstart', this.transientStartHandler);
	  this._current_popup.addEventListener('exit', this.transientExitHandler);
	};
	
	PopupHandler.prototype.errorHandler = function (event, cb) {
	  if (!this._current_popup) {
	    return;
	  }
	
	  this._current_popup.kill(true);
	
	  cb({ error: 'window_error', errorDescription: event.message });
	};
	
	PopupHandler.prototype.unhook = function () {
	  this._current_popup.removeEventListener('loaderror', this.transientErrorHandler);
	  this._current_popup.removeEventListener('loadstart', this.transientStartHandler);
	  this._current_popup.removeEventListener('exit', this.transientExitHandler);
	};
	
	PopupHandler.prototype.exitHandler = function (cb) {
	  if (!this._current_popup) {
	    return;
	  }
	
	  // when the modal is closed, this event is called which ends up removing the
	  // event listeners. If you move this before closing the modal, it will add ~1 sec
	  // delay between the user being redirected to the callback and the popup gets closed.
	  this.unhook();
	
	  if (!this._current_popup.success) {
	    cb({ error: 'window_closed', errorDescription: 'Browser window closed' });
	  }
	};
	
	PopupHandler.prototype.startHandler = function (event, cb) {
	  var _this = this;
	
	  if (!this._current_popup) {
	    return;
	  }
	  var parts = event.url.split('#');
	
	  if (parts.length === 1) {
	    return;
	  }
	
	  var opts = { hash: parts.pop() };
	
	  if (this.options.nonce) {
	    opts.nonce = this.options.nonce;
	  }
	
	  _this._current_popup.kill(true);
	
	  this.webAuth.parseHash(
	    opts,
	    function (error, result) {
	      if (error || result) {
	        cb(error, result);
	      }
	    }
	  );
	};
	
	module.exports = PopupHandler;


/***/ }

/******/ })
});
;