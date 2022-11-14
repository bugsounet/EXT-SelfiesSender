/**************************
*  EXT-SelfiesSender v1.0 *
*  Bugsounet              *
*  11/2022                *
***************************/

var log = () => { /* do nothing */ };

var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start: function() {

  },

  initialize: function(payload) {
    console.log("[SELFIES-SENDER] EXT-SelfiesSender Version:", require('./package.json').version, "rev:", require('./package.json').rev)
    this.config = payload
    if (payload.debug) {
      log = (...args) => { console.log("[SELFIES-SENDER]", ...args) }
    }
    this.sendSocketNotification("INITIALIZED")

  },

  socketNotificationReceived: function(noti, payload) {
    switch (noti) {
      case "INIT":
        this.initialize(payload)
        break
    }
  }
});
