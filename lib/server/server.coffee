# REQUIRE MODULES
#_____________________________________________________
http = require 'http' # posting to cakemix
querystring = require 'querystring' # stringifying posts to cakemix
nowjs = require 'now'
express = require 'express'
irc = require 'irc' # irc client for node.js
mustache = require 'mustache' # templating
ejs = require 'ejs' # templating
redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379')

helpers = require './helpers.js'

# SETUP EXPRESS APP
#_____________________________________________________
app = express.createServer(express.logger())
app.configure ->
  # Setup static file server
  app.use express.static(__dirname + '/public')
  app.use express.bodyParser()
  app.register(".mustache", helpers.mustache_template)

# ROUTES
#_____________________________________________________
app.get '/', (request, response) ->
  response.render 'index.ejs'

app.get '/help', (request, response) ->
  response.send 'Hello World'

app.post '/feedback/new', (request, response) ->
  logMessage request.body.name, request.body.message, Date.now(), 'itpirl-feedback'
  response.send '{sucess:hopefully}'

# SETUP NOW.JS
#_____________________________________________________
everyone = nowjs.initialize(app, {socketio: {transports:['xhr-polling','jsonp-polling']}})

# LOG MESSAGES TO REDIS
#_____________________________________________________
# This function is only to be called within distribute message functions.
# Saves messages to Redis
logMessage = (timestamp, sender, message, destination={'room':'itp'}) ->
  redis.incr 'nextId', (err,id) ->
    newMessage = { id, sender, message, destination, timestamp }
    redis.rpush 'messages:'+destination.room, JSON.stringify(newMessage)

# NOW CHAT
#_____________________________________________________

## Messages are of two types: Chat and System.

## Chat Messages

# A Chat message is initiated by textual input from a client. This includes
# all humans and bots. Chat messages are simple, they have a sender name,
# a content and an optional destination. The default destination is the main
# room #itp. The value of the destination is based on the current state of the
# client. Chat messages are assigned timestamps by the server to avoid any
# problems with clients' clocks or system lag.

# Send a chat message, => {sender, message, destination}
# Timestamps are set by this method
everyone.now.distributeChatMessage = (sender, message, destination={'room':'itp'}) ->
  timestamp = helpers.setTimestamp()
  logMessage timestamp, sender, message, destination

  if destination.room != undefined
    everyone.ircClient.say("##{destination.room}", message)
  # Currently no method for sending direct messages. And that's ok...for now.
  # At least until I get ircClients happening per client.

  # Destination will come in to play in who receive the message.
  everyone.now.receiveChatMessage timestamp, sender, message, destination

## System Messages

# A System message is initiated by the server. Client actions can trigger a
# System message but cannot initiate their own system message... I think.
# Timestamps are set by this method.

# System Message Types:
# - Join
# - Leave
# - NickChange
# - Bulletin

# I NEED TO BE SURE THIS METHOD IS PRIVATE

# { type:MESSAGE_TYPE,
#   message: MESSAGE_BODY,
#   destination: {
#     room:____
#     XOR
#     name:____ <- is this better to be a name or a clientID?
#   }
# }
everyone.now.distributeSystemMessage = (type, message, destination={'room':'itp'})  ->
  timestamp = helpers.setTimestamp()
  logMessage timestamp, type, message, destination
  everyone.now.receiveSystemMessage timestamp, type, message

# Get the names of all connected Now.js clientss
everyone.now.getUserList = ->
  everyone.now.userList = []
  everyone.getUsers (users) ->
    for user in users
      nowjs.getClient user, ->
        everyone.now.addUserToList @now.name

nowjs.on 'connect', ->
  # Create an irc client for the new user.
  ircConnections[@user.clientId] = new irc.Client ircHost, @now.name,
    channels: ['#itp']
    port: process.env.ITPIRL_IRC_PORT || 6667
  timestamp = Date.now()
  logMessage timestamp, 'Join', "#{@now.name} has joined the chat."
  everyone.now.receiveSystemMessage timestamp, 'Join', "#{@now.name} has joined the chat."

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
  timestamp = Date.now()
  logMessage timestamp, 'Leave', "#{@now.name} has joined the chat."
  everyone.now.receiveSystemMessage timestamp, 'Leave', "#{@now.name} has left the chat."

# SETUP IRC
#_____________________________________________________
ircHost = process.env.ITPIRL_IRC_HOST || 'irc.freenode.net'
ircNick = process.env.ITPIRL_IRC_NICK || 'itpanon'
everyone.ircClient = new irc.Client ircHost, ircNick,
  channels: ['#itp']
  port: process.env.ITPIRL_IRC_PORT || 6667
  userName: process.env.ITPIRL_IRC_USERNAME || ''
  password: process.env.ITPIRL_IRC_PASSWORD || ''

# Listen for messages to the ITP room and send them to Now.
everyone.ircClient.addListener 'message#itp', (from, message) ->
  timestamp = Date.now()
  logMessage timestamp, from, message, {'room':'itp'}
  everyone.now.receiveChatMessage timestamp, from, message, {'room':'itp'}

# LISTEN ON A PORT
#_____________________________________________________
port = process.env.PORT || 3000
app.listen port, ->
  console.log("Listening on " + port)