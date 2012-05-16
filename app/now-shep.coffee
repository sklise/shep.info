color = require('ansi-color').set
nowjs = require('now')
irc = require('irc')
redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379')

defaultChannels = ['#itp']
ircHost = process.env.ITPIRL_IRC_HOST || 'irc.freenode.net'

defaultValues = (session) ->
  session.loggedIn ?= false
  session.returningUser ?= false
  session.channels ?= defaultChannels
  session.name ?= "itp" + "#{("abcdefghijklmnopqrstuvwkyz".split(''))[Math.floor(Math.random() * 26)]}#{Math.floor(Math.random()*10)}" + "#{Date.now()}"[8..] 
  session

objectLength = (object) ->
  keys = for key, value of object
    "#{key}"
  keys.length

# Server: helper method to add color to terminal logging.
logMessage = (type, message) ->
  typeColors = {
    "NOTICE" : "yellow",
    "CLIENT NOTICE" : "magenta",
    "ERROR" : "red",
    "CLIENT ERROR" : "red",
    "NICK" : "blue",
    "JOIN" : "blue",
    "PART" : "blue",
    "QUIT" : "blue",
    "CLIENT" : "green"
    }
  console.log(
    color("[#{type}]", "#{typeColors[type]}+bold"),
    color(message, typeColors[type]))

class ircBridge
  constructor: (@name, channels, badNickname, fromShep, callback) ->
    @talkingToShep = false
    @client = new irc.Client ircHost, @name,
      channels: channels
      port: process.env.ITPIRL_IRC_PORT || 6667
      autoConnect: true

    # Listen for IRC events relating to this user.
    @client.addListener 'error', (message) =>
      console.log(color("[CLIENT ERROR] [#{@client.nick}]","red"), message)
      if message.command is 'err_erroneusnickname'
        badNickname(message.args)
        @client.nick = message.args[0]
    @client.addListener 'notice', (nick, to, text, message) =>
      logMessage "CLIENT NOTICE", "[#{@client.nick}] #{nick}: #{to} : #{text} : #{message}"
    @client.addListener 'join', (channel, nick) =>
      if nick is @client.nick
        callback(@client.nick)
    @client.addListener 'pm', (from, message) =>
      logMessage "CLIENT", "[#{@client.nick}] PM from #{from} => #{message}"
      if from is 'shepbot'
        fromShep(Date.now(), 'shep', message, 'shep')

nowShep = (app, logging, sessionStore) ->
  chatters = {}
  ircs = {}

  quitAndStuff = (sid) ->
    console.log('disconnect event')
    ircs[sid].client.disconnect('seeya')

    # Save session to Redis and then destroy the cache.
    sessionStore.set sid, chatters[sid], ->
      delete chatters[sid]

      sessionStore.get sid, (err, sess) ->
        sess.loggedIn = false
        sess.channels = for own chan, val of ircs[sid].client.chans
          "#{chan}"
        sess.returningUser = true
        sess.name = ircs[sid].client.nick
        sessionStore.set sid, sess
    

  # SETUP NOW.JS
  #-----------------------------------------------------
  everyone = nowjs.initialize(app, {socketio:{ transports:['xhr-polling','jsonp-polling'] }})

  nowjs.on 'connect', ->
    # Get the id of the user's cookie.
    sid = decodeURIComponent(this.user.cookie['connect.sid'])

    sessionStore.get sid, (err, sess) =>
      chatters[sid] = defaultValues(sess)

      ircs[sid] = new ircBridge (@now.name = chatters[sid].name), chatters[sid].channels, @now.badNickname, @now.receiveChatMessage, (nick) =>
        # Get the client's channel list on every join.
        @now.receiveChannels(ircs[sid].client.chans)
        if not chatters[sid].loggedIn
          chatters[sid].loggedIn = true
          @now.triggerIRCLogin(chatters[sid].returningUser)
          # Get recent messages from Redis and send them only to this user.
          # @now.recentMessages 'itp'

  nowjs.on 'disconnect', ->
    console.log "now disconnect"
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    ircs[sid].client.disconnect('seeya')
    quitAndStuff(sid)

  # CHAT
  #-----------------------------------------------------

  # Client: Send a message from a client to IRC.
  everyone.now.distributeChatMessage = (sender, channel, message) ->
    sid = decodeURIComponent(this.user.cookie['connect.sid'])
    if ircs[sid].talkingToShep || channel is 'shep'
      ircs[sid].talkingToShep = true
      @now.receiveChatMessage(Date.now(), sender, message, channel)
      ircs[sid].client.say('shepbot', "shep "+message)
    else if message.match(/\/me (.*)/)
      ircs[sid].client.action("##{channel}", message.replace(/\/me /,''))
    else
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
    sid = decodeURIComponent(this.user.cookie['connect.sid'])
    ircs[sid].client.nick = newNick
    ircs[sid].client.send "NICK #{newNick}"

  everyone.now.getChannels = ->
    sid = decodeURIComponent(this.user.cookie['connect.sid'])
    @now.receiveChannels ircs[sid].client.chans

  # Client -> Server: Ensures that the client is on the channel and sends a
  # /JOIN message if not.
  #
  # channel - The name of a channel without the # sign in front.
  everyone.now.goToChannel = (channel) ->
    sid = decodeURIComponent(this.user.cookie['connect.sid'])

    if channel is 'shep'
      ircs[sid].talkingToShep = true
    else
      ircs[sid].talkingToShep = false
      inChannel = true for chan, details of ircs[sid].client.chans when chan is "##{channel}"

      if inChannel.length is 1 and inChannel[0] is true
        return true
      else
        ircs[sid].client.send "JOIN ##{channel}"

  # Client -> Server: Log client out of IRC and set & save session. Called at
  # onbeforeunload client event.
  everyone.now.signOut = ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    quitAndStuff(sid)

  # Client -> Server
  everyone.now.leaveChannel = (channel) ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
    ircs[sid].client.send "LEAVE ##{channel}"

  # Client -> Server: Sets @now.name to the value of newName and changes the
  # user's irc nickname. Saves the names to the session.
  everyone.now.changeName = (newName) ->
    sid=decodeURIComponent(this.user.cookie['connect.sid'])
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
    channels: defaultChannels
    port: process.env.ITPIRL_IRC_PORT || 6667
    autoConnect: true
    userName: process.env.ITPIRL_IRC_USERNAME || ''
    password: process.env.ITPIRL_IRC_PASSWORD || ''

  # IRC EVENT LISTENERS
  # Trigger events for everyone.now when nowjs.users is not empty.

  everyone.ircClient.addListener 'notice', (nick, to, text, message) ->
    logMessage "NOTICE", "#{nick}: #{to} : #{text} : #{message}"

  everyone.ircClient.addListener 'error', (message) ->
    console.log(color("[ERROR]","red"), message)

  everyone.ircClient.addListener 'nick', (oldnick, newnick, channels, message) ->
    logMessage "NICK", "#{oldnick} => #{newnick}"
    if objectLength(nowjs.users) isnt 0
      for channel in channels
        everyone.ircClient.send "NAMES #{channel}"
        logging.logAndForward 'NICK', "#{oldnick} is now known as #{newnick}", {room:"#{channel[1..]}"}, everyone.now.receiveSystemMessage

  everyone.ircClient.addListener "message", (from, channel, message) ->
    if objectLength(nowjs.users) isnt 0
      logging.logAndForward from, message, {room:"#{channel[1..]}"}, everyone.now.receiveChatMessage

  everyone.ircClient.addListener "join", (channel, nick) =>
    if objectLength(nowjs.users) isnt 0
      logMessage "JOIN","#{nick} => #{channel}"
      logging.logAndForward 'Join', "#{nick} has joined the chat.", {room:"#{channel[1..]}"}, everyone.now.receiveSystemMessage
      everyone.ircClient.send "NAMES #{channel}"

  everyone.ircClient.addListener 'quit', (message, nick) =>
    logMessage "QUIT", "#{message} #{nick}"
    everyone.ircClient.send "NAMES #{channel}"

  everyone.ircClient.addListener 'part', (channel, nick) =>
    if objectLength(nowjs.users) isnt 0
      logMessage "PART", "#{nick} => #{channel}"
      logging.logAndForward 'Leave', "#{nick} has left the chat.", {room:"#{channel[1..]}"}, everyone.now.receiveSystemMessage
      everyone.ircClient.send "NAMES #{channel}"

  everyone.ircClient.addListener "names", (channel, nicks) =>
    if objectLength(nowjs.users) isnt 0
      everyone.now.updateUserList("#{channel[1..]}", nicks)

module.exports = nowShep