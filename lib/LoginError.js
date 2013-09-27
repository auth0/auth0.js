function LoginError(status, details) {
  var obj = JSON.parse(details);
  var err = Error.call(this, obj.description);
  
  err.status = status;
  err.name = obj.code;
  err.code = obj.code;
  err.details = obj;
  
  return err;
}

LoginError.prototype = Object.create(Error.prototype, { 
  constructor: { value: LoginError } 
});

module.exports = LoginError;