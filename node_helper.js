/**************************
*  EXT-SelfiesSender v1.1 *
*  Bugsounet              *
*  03/2023                *
***************************/

var log = () => { /* do nothing */ };

var NodeHelper = require("node_helper");
var nodemailer = require("nodemailer");
var fs = require("fs");
var lp = require("node-lp");

module.exports = NodeHelper.create({
  start: function() {
    this.transporter = null
    this.mailerIsReady = false
  },

  initialize: function(payload) {
    console.log("[SELFIES-SENDER] EXT-SelfiesSender Version:", require('./package.json').version, "rev:", require('./package.json').rev)
    this.config = payload
    if (payload.debug) log = (...args) => { console.log("[SELFIES-SENDER]", ...args) }
    if (this.config.sendMail) this.TestMailConfig()
  },

  socketNotificationReceived: function(noti, payload) {
    switch (noti) {
      case "INIT":
        this.initialize(payload)
        break
      case "MAIL":
        this.sendMail(payload)
        break
      case "PRINT":
        this.sendToPrinter(payload)
        break
    }
  },

  sendMail: function(file) {
    if (!this.mailerIsReady) return console.error("[SELFIES-SENDER] sendMailConfig is not ready for send selfies by mail!")
    try {
      var msg = Object.assign({}, this.config.sendMailConfig.message, {attachments: [{path: file}]})
      this.transporter.sendMail(msg, err => {
        if (err) {
          console.error("[SELFIES-SENDER] Error, Failed to send mail." , err)
          this.sendSocketNotification("ERROR", "Failed to send selfies by mail!")
          return
        }
        log("Email sent successfully! [" + file + "]")
      })
    } catch (e) {
      console.error("[SELFIES-SENDER] Error, Invalid mail account configuration.", e)
      this.sendSocketNotification("ERROR", "Invalid mail account configuration.")
      return
    }
  },

  TestMailConfig: function() {
    if (!typeof this.config.sendMailConfig == "object") {
      this.sendSocketNotification("ERROR", "SendMailConfig is not configured!")
      return console.error("[SELFIES-SENDER] sendMailConfig is not configured!")
    }
    this.transporter = nodemailer.createTransport(this.config.sendMailConfig.transport)
    this.transporter.verify(error => {
      if (error) {
        console.error("[SELFIES-SENDER] sendMailConfig", error)
        this.mailerIsReady = false
        this.sendSocketNotification("ERROR", "SendMailConfig check failed, check backlog for details")
      } else {
        console.log("[SELFIES-SENDER] Yes! We are able to send your selfies by mail.")
        this.mailerIsReady = true
      }
    })
  },
  
  sendToPrinter: function(payload, data) {
    if (payload.path) {
      fs.writeFile(payload.path, 
        err => {
          if (err) {
            this.sendSocketNotification("ERROR", "Error when sended to printer last shoot!") // will inform user with EXT-Alert 
            return console.log("[SELFIES] Sended to printer Error:", err)
          }
          log("File printed:", payload.uri)
        }
    )}
  
    if (Buffer.isBuffer(data)) {
      spawn.withData(data, payload);
    } else {
      spawn.withFile(data, payload);
    }
  }
});
