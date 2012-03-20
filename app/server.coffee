# REQUIRE MODULES
#_____________________________________________________
http = require 'http' # posting to cakemix
querystring = require 'querystring' # stringifying posts to cakemix
nowjs = require 'now'
express = require 'express'
irc = require 'irc'
mustache = require 'mustache'
ejs = require 'ejs'
# redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379')

# SAVING MESSAGES TO CAKEMIX FOR NOW
#_____________________________________________________
logMessage = (name, message, project='itpirl') ->
  # Adapted from http://www.theroamingcoder.com/node/111
  console.log(name, message)
  response = ''

  post =
    domain: 'www.itpcakemix.com'
    port: 80
    path: '/add'
    data: querystring.stringify
      user: 'shep'
      project: project
      name: name
      message: message
  
  options =
    host: post.domain,  
    port: post.port,  
    path: post.path,  
    method: 'POST',  
    headers: 
      'Content-Type': 'application/x-www-form-urlencoded'
      'Content-Length': post.data.length

  post_req = http.request options, (res) ->
    res.setEncoding('utf8')
    res.on 'data', (chunk) ->
      response += chunk
  post_req.write(post.data)
  post_req.end()
  response

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

  # everyone.getUsers (users) ->
  #   for user in users
  #     nowjs.getClient user, ->
  #       console.log @now.name
  logMessage(name, message)
  everyone.ircClient.say('#itp', message)
  everyone.now.receiveMessage name, message

everyone.on 'connect', ->
  console.log "#{@now.name}"
  everyone.now.receiveMessage('Join ', "#{@now.name} has joined the chat.")

everyone.on 'disconnect', ->
  everyone.now.receiveMessage('Leave ', "#{@now.name} has left the chat.")

# This will be useless until IRCClients are initiated per-user.
everyone.ircClient.addListener 'join', (from, message) ->
  # everyone.now.event('Join', "#{message} has joined #{from}")

everyone.ircClient.addListener 'notice', (from, message) ->
  console.log "NOTICE: #{from} : #{message}"

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