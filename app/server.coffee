# REQUIRE MODULES
#_____________________________________________________
nowjs = require 'now'
express = require 'express'
irc = require 'irc'
mustache = require 'mustache'
ejs = require 'ejs'
redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379')

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
  app.register(".mustache", mustache_template)

# CONNECT TO REDIS
#_____________________________________________________
# redis.set('foo', 'har')
# redis.get 'foo', (err, value) ->
#   console.log "foo is #{value}"

# ROUTES
#_____________________________________________________
app.get '/', (request, response) ->
  response.render 'index.ejs'

app.get '/help', (request, response) ->
  console.log 'here'
  response.send 'Hello World'

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
everyone.now.distributeMessage = (message) ->
  # Distribute the message to IRC as well as Now
  # so that Shep can hear it.

  # everyone.getUsers (users) ->
  #   for user in users
  #     nowjs.getClient user, ->
  #       console.log @now.name

  everyone.ircClient.say('#itp', message)
  everyone.now.receiveMessage @now.name, message

everyone.ircClient.addListener 'message#itp', (from, message) ->
  console.log "#{from}:#{message}"
  # When Shep, or users in an IRC client send a message
  # Also send it to Now.js
  everyone.now.receiveMessage from, message

# LISTEN ON A PORT
#_____________________________________________________
port = process.env.PORT || 3000
app.listen port, ->
  console.log("Listening on " + port)