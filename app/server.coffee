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

# LOG MESSAGES TO REDIS
#_____________________________________________________
logMessage = (name, message, room='itp') ->
  redis.incr 'nextId', (err,id) ->
    newMessage = {id, name, message, created_at:Date.now()}
    redis.rpush 'messages:'+room, JSON.stringify(newMessage)

# RETRIEVE LAST N MESSAGES
# recentMessages = (num, room="itp") ->
#   redis.llen 'messages:' + room, (err, length) ->
#     start = length - num
#     end = length - 1
#     console.log start,end
#     redis.lrange 'messages:' + room, start, end, (err, obj) ->
#       everyone.now.recentMessages = obj

# MUSTACHE FOR EXPRESS
#_____________________________________________________
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
#_____________________________________________________
app = express.createServer(express.logger())
app.configure ->
  # Setup static file server
  app.use express.static(__dirname + '/public')
  app.use express.bodyParser()
  app.register(".mustache", mustache_template)

# ROUTES
#_____________________________________________________
app.get '/', (request, response) ->
  response.render 'index.ejs'

app.get '/help', (request, response) ->
  response.send 'Hello World'

app.post '/feedback/new', (request, response) ->
  logMessage request.body.name, request.body.message, 'itpirl-feedback'
  response.send '{sucess:hopefully}'

# SETUP NOW.JS
#_____________________________________________________
everyone = nowjs.initialize(app, {socketio: {transports:['xhr-polling','jsonp-polling']}})

# SETUP IRC
#_____________________________________________________
ircHost = process.env.ITPIRL_IRC_HOST || 'irc.freenode.net'
ircNick = process.env.ITPIRL_IRC_NICK || 'itpanon'
everyone.ircClient = new irc.Client(ircHost, ircNick, {
  channels: ['#itp']
  port: process.env.ITPIRL_IRC_PORT || 6667
  # userName: process.env.ITPIRL_IRC_USERNAME || 'itpanon'
  # password: process.env.ITPIRL_IRC_PASSWORD || ''
})

# TELL NOW.JS HOW TO HANDLE MESSAGES
#_____________________________________________________
everyone.now.distributeMessage = (message, name=@now.name) ->
  # Distribute the message to IRC as well as Now
  # so that Shep can hear it.
  logMessage(name, message)
  
  if name == 'Nickname'
    everyone.makeUserList()

  everyone.ircClient.say('#itp', message)
  everyone.now.receiveMessage name, message

# GET THE NAMES OF ALL CURRENT NOW USERS
#_____________________________________________________
everyone.makeUserList = ->
  everyone.now.userList = []
  everyone.getUsers (users) ->
    for user in users
      nowjs.getClient user, ->
        everyone.now.userList.push @now.name

everyone.on 'connect', ->
  everyone.makeUserList()
  from = "Join"
  message = "#{@now.name} has joined the chat."
  logMessage from, message
  everyone.now.receiveMessage from, message

everyone.on 'disconnect', ->
  everyone.makeUserList()
  from = "Leave"
  message = "#{@now.name} has left the chat."
  logMessage from, message
  everyone.now.receiveMessage from, message

everyone.ircClient.addListener 'message#itp', (from, message) ->
  # log the message
  logMessage from, message
  # When Shep, or users in an IRC client send a message
  # Also send it to Now.js
  everyone.now.receiveMessage from, message

# LISTEN ON A PORT
#_____________________________________________________
port = process.env.PORT || 3000
app.listen port, ->
  console.log("Listening on " + port)