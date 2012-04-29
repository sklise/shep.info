color = require('ansi-color').set
nowjs = require 'now'
irc = require 'irc'
redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379')

channelName = '#itp-test'
ircHost = process.env.ITPIRL_IRC_HOST || 'irc.freenode.net'

objectLength = (object) ->
  keys = for key, value of object
    "#{key}"
  keys.length

logMessage = (type, message) ->
  typeColors = 
    "NOTICE" : "yellow"
    "CLIENT NOTICE" : "magenta"
    "ERROR" : "red"
    "CLIENT ERROR" : "red"
    "NICK" : "blue"
    "JOIN" : "blue"
    "PART" : "blue"
    "QUIT" : "blue"
    "CLIENT" : "green"
  console.log(
    color("[#{type}]", "#{typeColors[type]}+bold"),
    color(message, typeColors[type]))

class ircBridge
  constructor: (@name, @channels, callback) ->
    console.log @channels
    @client = new irc.Client ircHost, @name,
      channels: @channels
      port: process.env.ITPIRL_IRC_PORT || 6667
      autoConnect: true

    # Listen for IRC events relating to this user.
    @client.addListener 'error', (message) =>
      console.log(color("[CLIENT ERROR] [#{@client.nick}]","red"), message)
      # TODO: Respond when nicknames are bad.
      # { prefix: 'zelazny.freenode.net',
      #   server: 'zelazny.freenode.net',
      #   command: 'err_erroneusnickname',
      #   rawCommand: '432',
      #   commandType: 'error',
      #   args: [ 'jkhgkjl', 'jkhgkjl....', 'Erroneous Nickname' ] }
    @client.addListener 'notice', (nick, to, text, message) =>
      logMessage "CLIENT NOTICE", "[#{@client.nick}] #{nick}: #{to} : #{text} : #{message}"
    @client.addListener 'join', (channel, nick) =>
      if nick is @client.nick
        callback(@client.nick)
    @client.addListener 'pm', (from, message) =>
      logMessage "CLIENT", "[#{@client.nick}] PM from #{from} => #{message}"

nowShep = (app, logging, sessionStore) ->

  chatters ?= {}
  ircs = {}

  # SETUP NOW.JS
  #-----------------------------------------------------
  everyone = nowjs.initialize(app, {socketio:{ transports:['xhr-polling','jsonp-polling'] }})

  nowjs.on 'connect', ->
    # Get the id of the user's cookie.
    sid=decodeURIComponent(this.user.cookie['connect.sid'])

    sessionStore.get sid, (err, sess) =>
      chatters[sid] = sess
      chatters[sid].loggedIn ?= false
      chatters[sid].returningUser ?= false
      chatters[sid].channels ?= ['#itp-test', '#itp']
      # Fallback value for name

      @now.name = chatters[sid].name ?= "itp#{Date.now()}"

      ircs[sid] = new ircBridge @now.name, chatters[sid].channels, (nick) =>
        if not chatters[sid].loggedIn
          chatters[sid].loggedIn = true
          chatters[sid].returningUser = true
          @now.triggerIRCLogin(chatters[sid].returningUser)
          # Get recent messages from Redis and send them only to this user.
          # @now.recentMessages 'itp'

  nowjs.on 'disconnect', ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    ircs[sid].client.disconnect('seeya')
    chatters[sid].loggedIn = false
    chatters[sid].channels = chan for chan, details of ircs[sid].client.chans
    # Save session to Redis and then destroy the cache.
    sessionStore.set sid, chatters[sid], ->
      console.log "Saving on disconnect"
      delete chatters[sid]
    # Ask IRC for the list of names.
    everyone.ircClient.send "NAMES #{channelName}"

  # CHAT
  #-----------------------------------------------------

  # Client: Send a message from a client to IRC.
  everyone.now.distributeChatMessage = (sender, channel, message) ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    ircs[sid].client.say("##{channel}", message)

  # Server: Pull the last 10 messages from the specified channel from Redis.
  # Send these messages only to the nowjs client who called this method.
  #
  # channel - the name of a channel without the pound sign
  everyone.now.recentMessages = (channel) ->
    redis.llen 'messages:' + channel, (err, length) =>
      start = length - 10
      end = length - 1

      redis.lrange 'messages:' + channel, start, end, (err, obj) =>
        for message in obj
          # Redis returns the object as a string, turn it back to an object
          m = JSON.parse(message)
          # Send these previous messages to the client
          @now.receivePreviousMessage(m.timestamp, m.sender, m.message)

  # Server -> Server: Propogate name change to IRC and send out a message.
  everyone.now.changeNick = (newNick) ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    ircs[sid].client.nick = newNick
    ircs[sid].client.send "NICK #{newNick}"

  # Client -> Server: Provides public access to request /NAMES for the
  # channel. The response from this IRC message will trigger the NAMES
  # listener.
  #
  # channel - The name of a channel without the # sign in front.
  everyone.now.getNames = (channel) ->
    everyone.ircClient.send "NAMES ##{channel}"

  # Client -> Server: Ensures that the client is on the channel and sends a
  # /JOIN message if not.
  #
  # channel - The name of a channel without the # sign in front.
  everyone.now.getChannel = (channel) ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    inChannel = true for chan, details of ircs[sid].client.chans when chan is "##{channel}"

    if inChannel.length is 1 and inChannel[0] is true
      return true
    else
      ircs[sid].client.send "JOIN ##{channel}"

  # Client -> Server: Sets @now.name to the value of newName and changes the
  # user's irc nickname. Saves the names to the session.
  everyone.now.changeName = (newName) ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    chatters[sid].name = newName
    @now.name = newName
    @now.changeNick(newName)
    sessionStore.set sid, chatters[sid], (err, res) ->
      if err? then false else true

  # Client -> Server: Accepts a feedback message and sender name and saves to
  # Redis.
  #
  # sender - A users's name.
  # message - A string message.
  everyone.now.logFeedback = (sender, message) ->
    logging.logMessage sender, message, {room:'itpirl-feedback'}

  # SETUP IRC ON NODE.JS SERVER
  #-----------------------------------------------------
  # Create an IRC client for the server. This is the main listener for IRC
  # events. The clients speak to IRC but only the server (this) listens.
  ircNick = process.env.ITPIRL_IRC_NICK || 'itpirl_server'
  everyone.ircClient = new irc.Client ircHost, ircNick,
    channels: ["#{channelName}", "#itp"]
    port: process.env.ITPIRL_IRC_PORT || 6667
    autoConnect: true
    userName: process.env.ITPIRL_IRC_USERNAME || ''
    password: process.env.ITPIRL_IRC_PASSWORD || ''

  # IRC EVENT LISTENERS
  #---------------------------------------------------
  # Trigger events for everyone.now when nowjs.users is not empty.
  everyone.ircClient.addListener 'notice', (nick, to, text, message) ->
    logMessage "NOTICE", "#{nick}: #{to} : #{text} : #{message}"

  everyone.ircClient.addListener 'error', (message) ->
    logMessage "ERROR", message

  everyone.ircClient.addListener 'nick', (oldnick, newnick, channels, message) ->
    logMessage "NICK", "#{oldnick} => #{newnick}"
    if objectLength(nowjs.users) isnt 0
      for channel in channels
        everyone.ircClient.send "NAMES #{channel}"
        logging.logAndForward 'NICK', "#{oldnick} is now known as #{newnick}", {room:"#{channel[1..channel.length]}"}, everyone.now.receiveSystemMessage

  everyone.ircClient.addListener "message", (from, channel, message) ->
    if objectLength(nowjs.users) isnt 0
      logging.logAndForward from, message, {room:"#{channel[1..channel.length]}"}, everyone.now.receiveChatMessage

  everyone.ircClient.addListener "join", (channel, nick) =>
    if objectLength(nowjs.users) isnt 0
      logMessage "JOIN","#{nick} => #{channel}"
      logging.logAndForward 'Join', "#{nick} has joined the chat.", {room:"#{channel[1..channel.length]}"}, everyone.now.receiveSystemMessage
      everyone.ircClient.send "NAMES #{channel}"

  everyone.ircClient.addListener 'quit', (message, nick) =>
    logMessage "QUIT", "#{message} #{nick}"

  everyone.ircClient.addListener 'part', (channel, nick) =>
    if objectLength(nowjs.users) isnt 0
      logMessage "PART", "#{nick} => #{channel}"
      logging.logAndForward 'Leave', "#{nick} has left the chat.", {room:"#{channel[1..channel.length]}"}, everyone.now.receiveSystemMessage
      everyone.ircClient.send "NAMES #{channel}"

  everyone.ircClient.addListener "names", (channel, nicks) =>
    if objectLength(nowjs.users) isnt 0
      everyone.now.updateUserList("#{channel[1..channel.length]}", nicks)

module.exports = nowShep