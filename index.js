var assert_required   = require('./lib/assert_required');
var base64_url_decode = require('./lib/base64_url_decode');
var qs                = require('qs');
var reqwest           = require('reqwest');

var use_jsonp         = require('./lib/use_jsonp');
var LoginError        = require('./lib/LoginError');
var json_parse        = require('./lib/json_parse');

function Auth0 (options) {
  if (!(this instanceof Auth0)) {
    return new Auth0(options);
  }

  assert_required(options, 'clientID');
  assert_required(options, 'callbackURL');
  assert_required(options, 'domain');

  this._clientID = options.clientID;
  this._callbackURL = options.callbackURL;
  this._domain = options.domain;

  if (options.success && window.location.hash.match(/access_token/)) {
    var hash = window.location.hash.substr(1);
    var parsed_qs = qs.parse(hash);
    var id_token = parsed_qs.id_token;
    var encoded = id_token.split('.')[1];
    var prof = json_parse(base64_url_decode(encoded));
    options.success(prof, id_token, parsed_qs.access_token, parsed_qs.state);
  }
  this._failure = options.failure;
}

Auth0.prototype._redirect = function (url) {
  global.window.location = url;
};

Auth0.prototype._renderAndSubmitWSFedForm = function (formHtml) {
  var div = document.createElement('div');
  div.innerHTML = formHtml;
  var form = document.body.appendChild(div).children[0];
  form.submit();
};

Auth0.prototype.signup = function (options, callback) {
  var self = this;
  
  var query = {
    response_type: 'token',
    client_id:     this._clientID,
    connection:    options.connection,
    redirect_uri:  this._callbackURL,
    scope:         'openid profile'
  };

  if (options.state) {
    query.state = options.state;
  }

  query.email = options.username || options.email;
  query.password = options.password;
  
  query.tenant = this._domain.split('.')[0];

  function success () {
    if ('auto_login' in options && !options.auto_login) {
      if (callback) callback();
      return;
    }
    self.login(options, callback);
  }

  function fail (status, resp) {
    var error = new LoginError(status, resp);
    if (callback)      return callback(error);
    if (self._failure) return self._failure(error); 
  }

  if (use_jsonp()) {
    return reqwest({
      url:     'https://' + this._domain + '/dbconnections/signup',
      type:    'jsonp',
      data:    query,
      jsonpCallback: 'cbx',
      success: function (resp) {
        return resp.status == 200 ? 
                success() :
                fail(resp.status, resp.err);
      }
    });
  }

  reqwest({
    url:     'https://' + this._domain + '/dbconnections/signup',
    method:  'post',
    type:    'html',
    data:    query,
    success: success
  }).fail(function (err) {
    fail(err.status, err.responseText);
  });
};

Auth0.prototype.login = function (options, callback) {
  var self = this;
  
  var query = {
    response_type: 'token',
    client_id:     this._clientID,
    connection:    options.connection,
    redirect_uri:  this._callbackURL,
    scope:         'openid profile'
  };

  if (options.state) {
    query.state = options.state;
  }

  function return_error (error) {
    if (callback)      return callback(error);
    if (self._failure) return self._failure(error); 
  }

  if ('username' in options && 'password' in options) {
    query.username = options.username || options.email;
    query.password = options.password;
    
    query.tenant = this._domain.split('.')[0];

    if (use_jsonp()) {
      return reqwest({
        url:     'https://' + this._domain + '/dbconnections/login',
        type:    'jsonp',
        data:    query,
        jsonpCallback: 'cbx',
        success: function (resp) {
          if('error' in resp) {
            var error = new LoginError(resp.status, resp.error);
            return return_error(error);
          }
          self._renderAndSubmitWSFedForm(resp.form);
        }
      });
    }

    reqwest({
      url:     'https://' + this._domain + '/dbconnections/login',
      method:  'post',
      type:    'html',
      data:    query,
      success: function (resp) {
        self._renderAndSubmitWSFedForm(resp);
      }
    }).fail(function (err) {
      var error = new LoginError(err.status, err.responseText);
      return return_error(error);
    });

  } else {
    this._redirect('https://' + this._domain + '/authorize?' + qs.stringify(query));
  }
};

if (global.window) {
  global.window.Auth0 = Auth0;
}
module.exports = Auth0;