nowjs = require 'now'
irc = require 'irc'
redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379')

channelName = '#itp'
ircHost = process.env.ITPIRL_IRC_HOST || 'irc.freenode.net'

class ircBridge
  constructor: (@name, callback) ->
    @client = new irc.Client ircHost, @name,
      channels: ["#{channelName}"]
      port: process.env.ITPIRL_IRC_PORT || 6667
      autoConnect: true

    @loggedIn = false

    # Listen for IRC events relating to this user.
    @client.addListener 'pm', (from, message) ->
      console.log "C PM FROM:   #{from}:", message
    @client.addListener 'error', (message) ->
      console.log "C ERROR:     ", message
    @client.addListener 'notice', (nick, to, text, message) ->
      console.log "C NOTICE:    #{nick}: #{to} : #{text} : #{message}"
    @client.addListener 'part', (channel, nick) =>
      # @client.send "NAMES #{channel}"
      # console.log "C LEAVE:     #{channel} #{nick}"
    @client.addListener 'join', (channel, nick) =>
      callback(@client.nick) if not @loggedIn
      @loggedIn = true
      # console.log "C JOIN:      #{channel} #{nick}"
    @client.addListener 'message', (from, channel, message) ->
      # console.log "C MESSAGE:   #{from} #{channel} #{message}"

nowShep = (app, logging, sessionStore) ->

  # SETUP NOW.JS
  #-----------------------------------------------------
  everyone = nowjs.initialize(app, {socketio: {transports:['xhr-polling','jsonp-polling']}})

  #### Connecting to Now.js
  # On the connect event create an `ircBridge` for the new user with `@now.name`
  # and log to Redis that a new user has joined.

  chatters ?= {}
  ircs = {}


  nowjs.on 'connect', ->
    # Get the id of the user's cookie.
    sid=decodeURIComponent(this.user.cookie['connect.sid'])

    console.log sid, chatters

    sessionStore.get sid, (err, sess) =>
      chatters[sid] = sess
      console.log "session", sess
      # Fallback value for name
      @now.name = chatters[sid].name ?= "itp#{Date.now()}"

      ircs[sid] = new ircBridge (@now.name), (nick) =>
        console.log "and?"
        @now.triggerIRCLogin()
        # Get recent messages from Redis and send them only to this user.
        @now.recentMessages 'itp'

  nowjs.on 'disconnect', ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    ircs[sid].client.disconnect('seeya')
    ircs[sid].loggedIn = false
    # Save session to Redis and then destroy the cache.
    sessionStore.set sid, chatters[sid], ->
      console.log "Saving on disconnect"
      delete chatters[sid]
    # Ask IRC for the list of names.
    everyone.ircClient.send "NAMES #{channelName}"

  # NOW CHAT
  #-----------------------------------------------------

  everyone.now.recentMessages = (room) ->
    redis.llen 'messages:' + room, (err, length) =>
      start = length - 10
      end = length - 1

      redis.lrange 'messages:' + room, start, end, (err, obj) =>
        for message in obj
          # Redis returns the object as a string, turn it back to an object
          m = JSON.parse(message)
          # Send these previous messages to the client
          @now.receivePreviousMessage(m.timestamp, m.sender, m.message)

  # Propogate name change to IRC and send out a message.
  everyone.now.changeNick = (oldNick, newNick) ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    ircs[sid].client.nick = newNick
    ircs[sid].client.send "NICK #{newNick}"
    sessionStore.set sid, chatters[sid], (err, res) ->
      console.log err, res

  # Sets @now.name to the value of newName and changes the user's irc nickname.
  # Saves the names to the session.
  everyone.now.changeName = (newName) ->
    console.log "CHANGE NAME\n"
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    chatters[sid].name = newName
    @now.name = newName
    @now.changeNick('something', newName)
    sessionStore.set sid, chatters[sid], (err, res) ->
      console.log err, res

  everyone.now.savePair = (key, value) ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    console.log chatters[sid][key] = value
    sessionStore.set sid, chatters[sid], (err, res) ->
      console.log err, res

  everyone.now.inspectSession = ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    console.log "AWW YEA", chatters[sid]

  #### Chat Messages
  # A Chat message is initiated by textual input from a client. This includes
  # all humans and bots. Chat messages are simple, they have a sender name,
  # a content and an optional destination. The default destination is the main
  # room #itp. The value of the destination is based on the current state of the
  # client. Chat messages are assigned timestamps by the server to avoid any
  # problems with clients' clocks or system lag.

  # Triggered when a Now.js client sends a message. Simply forwards the message
  # to IRC. Currently no method for sending direct messages. And that's ok...for
  # now.
  everyone.now.distributeChatMessage = (sender, message, destination={'room':channelName}) ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    ircs[sid].client.say("#{destination.room}", message)

  #### System Messages

  # A System message is initiated by the server. Client actions can trigger a
  # System message but cannot initiate their own system message... I think.
  # Timestamps are set by this method.
  everyone.now.distributeSystemMessage = (type, message, destination={'room':'itp'})  ->
    logging.logMessage type, message, destination
    everyone.now.receiveSystemMessage Date.now(), type, message

  everyone.now.logFeedback = (sender, message) ->
    logging.logMessage sender, message, {room:'itpirl-feedback'}

  everyone.now.joinChannel = (channelName) ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    ircs[sid].client.send "JOIN ##{channelName}"

  # SETUP IRC ON NODE.JS SERVER
  #-----------------------------------------------------
  # Create an IRC client for the server. Though many clients can speak to IRC
  # I only want one client listening for non-system messages to prevent sending
  # and logging messages multiple times.
  ircNick = process.env.ITPIRL_IRC_NICK || 'itpirl_server'
  everyone.ircClient = new irc.Client ircHost, ircNick,
    channels: ["#{channelName}"]
    port: process.env.ITPIRL_IRC_PORT || 6667
    autoConnect: true
    userName: process.env.ITPIRL_IRC_USERNAME || ''
    password: process.env.ITPIRL_IRC_PASSWORD || ''


  objectLength = (object) ->
    keys = for key, value of object
      "#{key}"
    keys.length

  # Nick change notifications go to everyone and since some people may sign in
  # with IRC directly and not via itpirl.com if each client listens for nick
  # changes the log will just get super huge. Let's only listen for these on the
  # server account.
  everyone.ircClient.addListener 'nick', (oldnick, newnick, channels, message) ->
    for channel in channels
      everyone.ircClient.send "NAMES #{channel}"
    if objectLength(nowjs.users) isnt 0
      console.log "NICK LISTENER"
      logging.logAndForward 'NICK', "#{oldnick} is now known as #{newnick}", {'room':'itp'}, everyone.now.receiveSystemMessage
  everyone.ircClient.addListener 'notice', (nick, to, text, message) ->
    console.log("S NOTICE:   ", "#{nick}: #{to} : #{text} : #{message}")
  everyone.ircClient.addListener "message#{channelName}", (from, message) ->
    if objectLength(nowjs.users) isnt 0
      console.log "MESSAGE LISTENER"
      logging.logAndForward from, message, {'room':"#{channelName[1..channelName.length]}"}, everyone.now.receiveChatMessage
  everyone.ircClient.addListener "join", (channel, nick) =>
    if objectLength(nowjs.users) isnt 0
      console.log "S NOTICE:   JOIN"
      logging.logAndForward 'Join', "#{nick} has joined the chat.", {'room':'itp'}, everyone.now.receiveSystemMessage
      everyone.ircClient.send "NAMES #{channel}"
  everyone.ircClient.addListener 'part', (channel, nick) =>
    if objectLength(nowjs.users) isnt 0
      console.log(color("PART #{nick}", "yellow"))
      logging.logAndForward 'Leave', "#{nick} has left the chat.", {'room':'itp'}, everyone.now.receiveSystemMessage
      everyone.ircClient.send "NAMES #{channel}"
  everyone.ircClient.addListener "names", (channel, nicks) =>
    if objectLength(nowjs.users) isnt 0
      console.log "S NOTICE:"
      everyone.now.updateUserList(channel, nicks)

module.exports = nowShep