# REQUIRE MODULES
#-----------------------------------------------------
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
  app.use express.static(__dirname + '/../../public')
  app.use express.bodyParser()
  app.use express.cookieParser()
  app.use express.session({
    secret: "lkashjgfekfleljfkjwjekfwekf",
    store: new RedisStore({port: redisUrl.port, host: redisUrl.hostname, pass:(redisUrl.auth)?.split(":")[1]})
  })

  app.set('views', __dirname + '/../../views')
  app.set('view engine', 'ejs')

  app.register(".mustache", mustache_template)

# Load other app files
require('./authentication/routes')(app)
logging = require('./logging')(app)
require('./helpers')(app)
require('./now-shep')(app, logging)

# ROUTES
#-----------------------------------------------------
app.get '/', (req, res) ->
  res.render 'index.ejs',
    title: "Shep"

app.get '/help', (req, res) ->
  res.render 'index.ejs',
    title: "Shep ☞ Help"

app.get '/channels/:name', (req, res) ->
  res.render 'index.ejs',
    title: "Shep ☞ #{req.params.name}"

# LISTEN ON A PORT
#-----------------------------------------------------
port = process.env.PORT || 3000
app.listen port, ->
  console.log("Listening on " + port)