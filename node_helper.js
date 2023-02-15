/**************************
*  EXT-SelfiesSender v1.0 *
*  Bugsounet              *
*  11/2022                *
***************************/

var log = () => { /* do nothing */ };

var NodeHelper = require("node_helper");
var nodemailer = require("nodemailer");
var lp = require("node-lp");

module.exports = NodeHelper.create({
  start: function() {
    this.transporter = null
    this.printer = null
    this.mailerIsReady = false
    this.printerIsReady = false
  },

  initialize: function(payload) {
    console.log("[SELFIES-SENDER] EXT-SelfiesSender Version:", require('./package.json').version, "rev:", require('./package.json').rev)
    this.config = payload
    if (payload.debug) {
      log = (...args) => { console.log("[SELFIES-SENDER]", ...args) }
    }
    log("Config:", this.config)
    if (this.config.sendMail) this.TestMailConfig()
    if (this.config.sendToPrinter) this.InitPrinter()
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
    if (typeof this.config.sendMailConfig != "object") {
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

  InitPrinter: function() {
    if (typeof this.config.printerOptions != "object") {
      this.printerIsReady = false
      return console.error("[SELFIES-SENDER] printer is not configured!")
    }
    this.printer = new lp(this.config.printerOptions)
    this.printerIsReady = true
    console.log("[SELFIES-SENDER] Yes! We are able to print your selfies.")
  },
    
  sendToPrint: function(payload) {
    if (!this.printerIsReady) return console.error("[SELFIES-SENDER] Printer is not ready")
    this.printer.queue (payload,err => {
    if (err) return console.error("[SELFIES-SENDER] Print Error:", error)
    log("Print successfull! [" + payload + "]")
   })
  }
})
