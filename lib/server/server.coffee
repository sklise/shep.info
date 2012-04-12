# REQUIRE MODULES
#-----------------------------------------------------
require('coffee-script')
http = require 'http'
querystring = require 'querystring'
express = require 'express'
mustache = require 'mustache'
ejs = require 'ejs'

RedisStore = require('connect-redis')(express)
redisUrl = require('url').parse(process.env.REDISTOGO_URL || 'redis://localhost:6379')

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
require('./lib/server/now-shep')(app, logging)

# ROUTES
#-----------------------------------------------------
app.get '/', (request, response) ->
  response.render 'index.ejs'

app.get '/help', (request, response) ->
  response.send 'Hello World'

# LISTEN ON A PORT
#-----------------------------------------------------
port = process.env.PORT || 3000
app.listen port, ->
  console.log("Listening on " + port)