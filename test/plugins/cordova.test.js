var expect = require('expect.js');
var stub = require('sinon').stub;

var CordovaPlugin = require('../../src/plugins/cordova')
var PluginHandler = require('../../src/plugins/cordova/plugin-handler')
var PopupHandler = require('../../src/plugins/cordova/mobile-popup-handler')

describe('auth0.plugins.cordova', function () {
  context('platform support cordova', function () {
    before(function(){
      this.plugin = new CordovaPlugin();
      global.window = {
        cordova: true
      }
    });
    after(function(){
      delete global.window;
    });

    it('should validate the extencibility points', function() {
      expect(this.plugin.supports('popup.authorize'))
        .to.be.ok();
      expect(this.plugin.supports('popup.getPopupHandler'))
        .to.be.ok();
      expect(this.plugin.supports('not.existent'))
        .to.not.be.ok();
    })
  });

  context('platform support electron', function () {
    before(function(){
      this.plugin = new CordovaPlugin();
      global.window = {
        electron: true
      }
    });
    after(function(){
      delete global.window;
    });

    it('should validate the extencibility points', function() {
      expect(this.plugin.supports('popup.authorize'))
        .to.be.ok();
      expect(this.plugin.supports('popup.getPopupHandler'))
        .to.be.ok();
      expect(this.plugin.supports('not.existent'))
        .to.not.be.ok();
    })
  });

  context('platform support', function () {
    before(function(){
      this.plugin = new CordovaPlugin();
      global.window = {
      }
    });
    after(function(){
      delete global.window;
    });

    it('should ignore if it is not electron or cordova', function() {
      expect(this.plugin.supports('popup.authorize'))
        .to.not.be.ok();
      expect(this.plugin.supports('popup.getPopupHandler'))
        .to.not.be.ok();
      expect(this.plugin.supports('not.existent'))
        .to.not.be.ok();
    })
  });

  context('handler', function() {
    before(function(){
      this.handler = (new CordovaPlugin()).init();
    });

    it('should return a PluginHandler', function() {
      expect(this.handler).to.be.a(PluginHandler);
    })

    it('should return a PopupHandler', function() {
      expect(this.handler.getPopupHandler()).to.be.a(PopupHandler);
    })

    it('should return a change the authorize params', function() {
      expect(this.handler.processParams({
        domain: 'test.auth0.com',
        redirectUri: 'https://callback.com',
        owp: true,
        otherParam: 'something'
      })).to.eql({
        domain: 'test.auth0.com',
        redirectUri: 'https://test.auth0.com/mobile',
        otherParam: 'something'
      });
    })
  });
});