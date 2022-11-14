/**************************
*  EXT-SelfiesSender v1.0 *
*  Bugsounet              *
*  11/2022                *
***************************/

Module.register("EXT-SelfiesSender", {
  defaults: {
    debug: false,
  },

  start: function() {

  },

  getDom: function() {
    var wrapper = document.createElement("div")
    wrapper.style.display = 'none'
    return wrapper
  },

  notificationReceived: function(noti, payload, sender) {
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.sendSocketNotification("INIT", this.config)
        break
      case "GAv4_READY": // send HELLO to Gateway ... (mark plugin as present in GW db)
        if (sender.name == "MMM-GoogleAssistant") this.sendNotification("EXT_HELLO", this.name)
        break
    }
  },

  socketNotificationReceived: function(noti, payload) {
    switch(noti) {
      //do something
    }
  }
});
