/*********************
*  EXT-SelfiesSender *
*  Bugsounet         *
**********************/

var log = () => { /* do nothing */ };

var NodeHelper = require("node_helper");
var nodemailer = require("nodemailer");

module.exports = NodeHelper.create({
  start () {
    this.transporter = null;
    this.mailerIsReady = false;
  },

  initialize (payload) {
    console.log("[SELFIES-SENDER] EXT-SelfiesSender Version:", require("./package.json").version, "rev:", require("./package.json").rev);
    this.config = payload;
    if (payload.debug) log = (...args) => { console.log("[SELFIES-SENDER]", ...args); };
    if (this.config.sendMail) this.TestMailConfig();
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        this.initialize(payload);
        break;
      case "MAIL":
        this.sendMail(payload);
        break;
    }
  },

  sendMail (file) {
    if (!this.mailerIsReady) return console.error("[SELFIES-SENDER] sendMailConfig is not ready for send selfies by mail!");
    try {
      var msg = Object.assign({}, this.config.sendMailConfig.message, { attachments: [{ path: file }] });
      this.transporter.sendMail(msg, (err) => {
        if (err) {
          console.error("[SELFIES-SENDER] Error, Failed to send mail." , err);
          this.sendSocketNotification("ERROR", "Failed to send selfies by mail!");
          return;
        }
        log(`Email sent successfully! [${file}]`);
      });
    } catch (e) {
      console.error("[SELFIES-SENDER] Error, Invalid mail account configuration.", e);
      this.sendSocketNotification("ERROR", "Invalid mail account configuration.");
    }
  },

  TestMailConfig () {
    if (!typeof this.config.sendMailConfig === "object") {
      this.sendSocketNotification("ERROR", "SendMailConfig is not configured!");
      return console.error("[SELFIES-SENDER] sendMailConfig is not configured!");
    }
    this.transporter = nodemailer.createTransport(this.config.sendMailConfig.transport);
    this.transporter.verify((error) => {
      if (error) {
        console.error("[SELFIES-SENDER] sendMailConfig", error);
        this.mailerIsReady = false;
        this.sendSocketNotification("ERROR", "SendMailConfig check failed, check backlog for details");
      } else {
        console.log("[SELFIES-SENDER] Yes! We are able to send your selfies by mail.");
        this.mailerIsReady = true;
      }
    });
  }
});
