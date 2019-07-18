import expect from "expect.js";
import sinon from "sinon";
import WinChan from "winchan";

import PopupHandler from "../../src/helper/popup-handler";

describe("helpers popupHandler", function() {
  beforeEach(() => {
    global.window = {
      screenX: 500,
      screenY: 500,
      outerWidth: 2000,
      outerHeight: 2000,
      screenLeft: 500,
      screenTop: 500,
      document: {
        body: {
          clientHeight: 2000,
          clientWidth: 2000
        }
      }
    };
  });

  afterEach(() => {
    delete global.window;
    if (WinChan.open.restore) {
      WinChan.open.restore();
    }
  });
  describe("calculates the window position", function() {
    it("should use default values", function() {
      var handler = new PopupHandler();
      var position = handler.calculatePosition({});
      expect(position).to.eql({
        width: 500,
        height: 600,
        left: 1250,
        top: 1200
      });
    });

    it("should use the size from the parameters", function() {
      var handler = new PopupHandler();
      var position = handler.calculatePosition({ width: 200, height: 300 });
      expect(position).to.eql({
        width: 200,
        height: 300,
        left: 1400,
        top: 1350
      });
    });
  });

  describe("calculates the window position w screen left/top and body client size", function() {
    it("should use default values", function() {
      var handler = new PopupHandler();
      var position = handler.calculatePosition({});
      expect(position).to.eql({
        width: 500,
        height: 600,
        left: 1250,
        top: 1200
      });
    });

    it("should use the size from the parameters", function() {
      var handler = new PopupHandler();
      var position = handler.calculatePosition({ width: 200, height: 300 });
      expect(position).to.eql({
        width: 200,
        height: 300,
        left: 1400,
        top: 1350
      });
    });
  });

  describe("should open the popup", function() {
    it("with the correct parametrs", function(done) {
      sinon.stub(WinChan, "open").callsFake(function(options, cb) {
        expect(options).to.eql({
          url: "url",
          relay_url: "relayUrl",
          window_features: "width=500,height=600,left=1250,top=1200",
          popup: null,
          params: { opt: "value" }
        });

        cb(null, { data2: "value2" });

        return {
          focus: function() {
            done();
          }
        };
      });

      var handler = new PopupHandler();

      handler.load("url", "relayUrl", { params: { opt: "value" } }, function(
        err,
        data
      ) {
        expect(err).to.be(null);
        expect(data).to.eql({ data2: "value2" });
      });
    });
  });

  describe("preload should open the popup", function() {
    it("should open the window", function(done) {
      global.window.open = function(url, name, windowFeatures) {
        expect(url).to.eql("about:blank");
        expect(name).to.eql("auth0_signup_popup");
        expect(windowFeatures).to.eql(
          "width=500,height=600,left=1250,top=1200"
        );

        return {
          close: function() {
            done();
          }
        };
      };

      var handler = new PopupHandler();

      var popup = handler.preload({});

      popup.kill();
    });

    it("should open the window once and return the same instance", function(done) {
      var counter = 0;
      global.window.open = function(url, name, windowFeatures) {
        counter++;
        expect(url).to.eql("about:blank");
        expect(counter).to.eql(1);
        expect(name).to.eql("auth0_signup_popup");
        expect(windowFeatures).to.eql(
          "width=500,height=600,left=1250,top=1200"
        );

        return {
          close: function() {
            done();
          }
        };
      };

      var handler = new PopupHandler();
      var popup = handler.preload({});
      var popup2 = handler.preload({});

      expect(popup).to.be(popup2);

      popup.kill();
    });
  });

  describe("load", () => {
    it("ignores `SyntaxError` errors", done => {
      const url = "https://test.popup.com";
      const relayUrl = "https://relay.test.popup.com";
      const options = {};
      const callback = (err, data) => {
        expect(err).to.be(null);
        done();
      };

      sinon.stub(WinChan, "open").callsFake(function(_, cb) {
        const err = new Error("An error");
        err.name = "SyntaxError";
        cb(err, null);
        setTimeout(() => {
          cb(null, { data: "now it works" });
        }, 100);
        return {
          focus: function() {}
        };
      });

      new PopupHandler().load(url, relayUrl, options, callback);
    });
  });
});
