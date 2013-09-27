var jsdom = require('jsdom');
var fs = require('fs');

before(function (done) {
  var html = fs.readFileSync(__dirname + '/../example/index.html').toString();

  jsdom.env(html, ["http://code.jquery.com/jquery.js"], function (errors, window) {
    global.window = window;
    global.window.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    
    global.document = window.document;
    global.XMLHttpRequest = global.window.XMLHttpRequest;

    done();
  });
});