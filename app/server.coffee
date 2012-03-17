# Require libs.
nowjs = require 'now'
express = require 'express'
irc = require 'irc'
mustache = require 'mustache'

# MUSTACHE FOR EXPRESS
#_____________________________________________________

# Adapted to coffeescript 
# from http://bitdrift.com/post/2376383378/using-mustache-templates-in-express
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

# SETUP NOW.JS
#_____________________________________________________
everyone = nowjs.initialize(app, {socketio: {transports:['xhr-polling','jsonp-polling']}})

everyone.now.distributeMessage = (message) ->
  console.log message
  everyone.now.receiveMessage @now.name, message

# ROUTES
#_____________________________________________________
app.get '/', (request, response) ->
  response.render 'index.mustache', {layout: false}

# LISTEN ON A PORT
#_____________________________________________________
port = process.env.PORT || 3000
app.listen port, ->
  console.log("Listening on " + port)
