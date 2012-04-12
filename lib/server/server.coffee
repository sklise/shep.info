# REQUIRE MODULES
#-----------------------------------------------------
require('coffee-script')
http = require 'http'
querystring = require 'querystring'
nowjs = require 'now'
express = require 'express'
irc = require 'irc'
mustache = require 'mustache'
ejs = require 'ejs'

RedisStore = require('connect-redis')(express)
redisUrl = require('url').parse(process.env.REDISTOGO_URL || 'redis://localhost:6379')
redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379')

ircConnections = {}
ircHost = process.env.ITPIRL_IRC_HOST || 'irc.freenode.net'

class ircBridge
  constructor: (@name, callback) ->
    @client = new irc.Client ircHost, @name,
      channels: ['#itp']
      port: process.env.ITPIRL_IRC_PORT || 6667
      autoConnect: true

    # Listen for IRC events relating to this user.
    @client.addListener 'pm', (from, message) ->
      console.log "PRIVATE MESSAGE FROM: #{from}:", message
    @client.addListener 'error', (message) ->
      console.log "ERROR:", message
    @client.addListener 'notice', (nick, to, text, message) ->
      console.log "NOTICE: #{nick}: #{to} : #{text} : #{message}"
    @client.addListener 'names', (channel, nicks) =>
      # Tell Now.js what your actual name is.
      callback(@client.nick)

# MUSTACHE FOR EXPRESS
#-----------------------------------------------------
# Adapted to coffeescript from:
# http://bitdrift.com/post/2376383378/using-mustache-templates-in-express
mustache_template =
  compile: (source, options) ->
    if (typeof source == 'string')
      (options) ->
        options.locals = options.locals || {}
        options.partials = options.partials || {}
        if (options.body) # for express.js > v1.0
          locals.body = options.body
        mustache.to_html(source, options.locals, options.partials)
    else
      source
  render: (template, options) ->
    template = this.compile(template, options)
    template(options)

# SETUP EXPRESS APP
#-----------------------------------------------------
app = express.createServer(express.logger())

app.configure ->
  # Setup static file server
  app.use express.static(__dirname + '/public')
  app.use express.bodyParser()
  app.use express.cookieParser()
  app.use express.session({
    secret: "lkashjgfekfleljfkjwjekfwekf",
    store: new RedisStore({port: redisUrl.port, host: redisUrl.hostname, pass:(redisUrl.auth)?.split(":")[1]})
  })
  app.register(".mustache", mustache_template)
  return

# Load other app files
logging = require('./lib/server/logging')(app)
require('./lib/server/helpers')(app)

# ROUTES
#-----------------------------------------------------
app.get '/', (request, response) ->
  response.render 'index.ejs'

app.get '/help', (request, response) ->
  response.send 'Hello World'

app.post '/feedback/new', (request, response) ->
  logging.logMessage request.body.name, request.body.message, Date.now(), 'itpirl-feedback'
  response.send '{sucess:hopefully}'

# SETUP NOW.JS
#-----------------------------------------------------
everyone = nowjs.initialize(app, {socketio: {transports:['xhr-polling','jsonp-polling']}})

# NOW CHAT
#-----------------------------------------------------

#### Chat Messages

# A Chat message is initiated by textual input from a client. This includes
# all humans and bots. Chat messages are simple, they have a sender name,
# a content and an optional destination. The default destination is the main
# room #itp. The value of the destination is based on the current state of the
# client. Chat messages are assigned timestamps by the server to avoid any
# problems with clients' clocks or system lag.

# Triggered when a Now.js client sends a message. Simply forwards the message
# to IRC. Currently no method for sending direct messages. And that's ok...for
# now. At least until I get ircClients happening per client.
everyone.now.distributeChatMessage = (sender, message, destination={'room':'itp'}) ->
  ircConnections[@user.clientId].client.say("##{destination.room}", message)
  # Check to see
  @now.serverChangedName ircConnections[@user.clientId].client.nick

#### System Messages

# A System message is initiated by the server. Client actions can trigger a
# System message but cannot initiate their own system message... I think.
# Timestamps are set by this method.

# System Message Types:
# - Join
# - Leave
# - NickChange
# - Bulletin

# I NEED TO BE SURE THIS METHOD IS PRIVATE

#      { type:MESSAGE_TYPE,
#        message: MESSAGE_BODY,
#        destination: {
#          room:____
#          XOR
#          name:____ <- is this better to be a name or a clientID?
#        }
#      }
everyone.now.distributeSystemMessage = (type, message, destination={'room':'itp'})  ->
  timestamp = setTimestamp()
  logMessage timestamp, type, message, destination
  everyone.now.receiveSystemMessage timestamp, type, message

# Get the names of all connected Now.js clientss
everyone.now.getUserList = ->
  everyone.now.userList = []
  everyone.getUsers (users) ->
    for user in users
      nowjs.getClient user, ->
        everyone.now.addUserToList @now.name

# Propogate name change to IRC and send out a message.
everyone.now.changeNick = (oldNick, newNick) ->
  ircConnections[@user.clientId].client.nick = newNick
  ircConnections[@user.clientId].client.send "NICK #{newNick}"

#### Connecting to Now.js
# On the connect event create an `ircBridge` for the new user with `@now.name`
# and log to Redis that a new user has joined.
nowjs.on 'connect', ->
  # Create an ircBridge object for the new user. And tell everyone there is a
  # new user.
  myNow = @now
  ircConnections[@user.clientId] = new ircBridge @now.name, (name) ->
    myNow.name = name
    myNow.serverChangedName name
  logging.logAndForward 'Join', "#{@now.name} has joined the chat.", {'room':'itp'}, everyone.now.receiveSystemMessage

  # Get recent messages from Redis and send them only to this user.
  myNow = @now
  room = 'itp'

  redis.llen 'messages:' + room, (err, length) ->
    start = length - 10
    end = length - 1

    redis.lrange 'messages:' + room, start, end, (err, obj) ->
      for message in obj
        # Redis returns the object as a string, turn it back to an object
        m = JSON.parse(message)
        # Send these previous messages to the client
        myNow.receivePreviousMessage(m.timestamp, m.sender, m.message)

nowjs.on 'disconnect', ->
  # Disconnect that user from IRC.
  # I PROBABLY NEED TO DESTROY THIS OBJECT?
  ircConnections[@user.clientId].client.disconnect('seeya')
  logging.logAndForward 'Leave', "#{@now.name} has left the chat.", {'room':'itp'}, everyone.now.receiveSystemMessage

# SETUP IRC ON NODE.JS SERVER
#-----------------------------------------------------
# Create an IRC client for the server. Though many clients can speak to IRC
# I only want one client listening for non-system messages to prevent sending
# and logging messages multiple times.

ircNick = process.env.ITPIRL_IRC_NICK || 'itpirl_server'
everyone.ircClient = new irc.Client ircHost, ircNick,
  channels: ['#itp']
  port: process.env.ITPIRL_IRC_PORT || 6667
  autoConnect: true
  # userName: process.env.ITPIRL_IRC_USERNAME || ''
  # password: process.env.ITPIRL_IRC_PASSWORD || ''

# Nick change notifications go to everyone and since some people may sign in
# with IRC directly and not via itpirl.com if each client listens for nick
# changes the log will just get super huge. Let's only listen for these on the
# server account.
everyone.ircClient.addListener 'nick', (oldnick, newnick, channels, message) ->
  logging.logAndForward 'NICK', "#{oldnick} is now known as #{newnick}", {'room':'itp'}, everyone.now.receiveSystemMessage
# everyone.ircClient.addListener 'names', (channel, nicks) ->
#   console.log channel, nicks
everyone.ircClient.addListener 'notice', (nick, to, text, message) ->
  console.log "System Notice", "#{nick}: #{to} : #{text} : #{message}"

# Listen for messages to the ITP room and send them to Now.
everyone.ircClient.addListener 'message#itp', (from, message) ->
  logging.logAndForward from, message, {'room':'itp'}, everyone.now.receiveChatMessage

# LISTEN ON A PORT
#-----------------------------------------------------
port = process.env.PORT || 3000
app.listen port, ->
  console.log("Listening on " + port)