/**************************
*  EXT-SelfiesSender v1.0 *
*  Bugsounet              *
*  11/2022                *
***************************/

Module.register("EXT-SelfiesSender", {
  defaults: {
    debug: false,
    sendTelegramBot: true,
    sendGooglePhotos: true,
    sendMail: true,
    sendMailConfig: {
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: "youremail@gmail.com",
          pass: "your gmail password"
        }
      },
      message: {
        from: "youremail@gmail.com",
        to: "who@where.com",
        subject: "EXT-SelfieSender -- This is your new selfie.",
        text: "New selfie.",
      }
    }
  },

  start: function() {
    this.IsShooting = false
    this.lastPhoto = null
    this.session = {}
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
      case "GAv4_READY":
        if (sender.name == "MMM-GoogleAssistant") this.sendNotification("EXT_HELLO", this.name)
        break
      case "EXT_SELFIES-RESULT":
        if (!payload) return // prevent crash
        this.lastPhoto = payload
        this.sendSelfie(payload)
        break
      case "EXT_SELFIES-CLEAN_STORE": // all is clean so reset all
        this.lastPhoto = null
        this.session = {}
        break
    }
  },

  socketNotificationReceived: function(noti, payload) {
    switch(noti) {
      //do something
    }
  },

 /** TelegramBot function **/
   getCommands: function(commander) {
    commander.add({
      command: 'selfie',
      callback: 'cmdSelfie',
      description: "Take a selfie.",
    })

    commander.add({
      command: 'emptyselfie',
      callback: 'cmdEmptySelfie',
      description: "Remove all selfie photos."
    })

    commander.add({
      command: 'lastselfie',
      callback: 'cmdLastSelfie',
      description: 'Display the last selfie shot taken.'
    })
  },

  cmdSelfie: function(command, handler) {
    if (this.IsShooting) return handler.reply("TEXT", "Not available actually.")
    let key = Date.now()
    this.session[key] = handler
    this.sendNotification("EXT_SELFIES-SHOOT", {TBkey:key})
  },

  cmdLastSelfie: function(command, handler) {
    if (this.IsShooting) return handler.reply("TEXT", "Not available actually.")
    if (this.lastPhoto) {
      handler.reply("PHOTO_PATH", this.lastPhoto.path)
    } else {
      handler.reply("TEXT", "Couldn't find the last selfie.")
    }
  },

  cmdEmptySelfie: function(command, handler) {
    if (this.IsShooting) return handler.reply("TEXT", "Not available actually.")
    this.sendNotification("EXT_SELFIES-EMPTY_STORE")
    this.lastPhoto = null
    this.session = {}
    handler.reply("TEXT", "done.")
  },

  sendSelfie: function(result) {
    // send to the user with TBkey
    let sendTBAdmin = true
    if (result.options.TBkey && this.session[result.options.TBkey]) {
      sendTBAdmin= false
      var handler = this.session[result.options.TBkey]
      handler.reply("PHOTO_PATH", result.path)
      this.session[result.options.TBkey] = null
      delete this.session[result.options.TBkey]
    }

    if (result.options.useTBKeyOnly) return // cas d'utilisation de sauvegarde locale uniquement (ignore le reste)

    if (this.config.sendGooglePhotos) this.sendNotification("EXT_GPHOTOPHOTOS-UPLOAD", result.path)

    // send to admins
    if (this.config.sendTelegramBot && sendTBAdmin) {
      this.sendNotification("TELBOT_TELL_ADMIN", "New Selfie")
      this.sendNotification("TELBOT_TELL_ADMIN", {
        type: "PHOTO_PATH",
        path: result.path
      })
    }

    if (this.config.sendMail) this.sendSocketNotification("MAIL", result.path)
  }
});
