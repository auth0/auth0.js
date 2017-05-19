before(function() {
  function atob(str) {
    return new Buffer(str, 'base64').toString('binary');
  }
  function btoa(str) {
    return Buffer.from(str, 'binary').toString('base64');
  }
  var windowOrGlobal = typeof window !== 'undefined' ? window : global;
  windowOrGlobal.atob = atob;
  windowOrGlobal.btoa = btoa;
});
