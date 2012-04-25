# REQUIRE MODULES
#-----------------------------------------------------
http = require('http')
querystring = require('querystring')
express = require('express')
connect = require('connect')
ejs = require('ejs')
assetManager = require('connect-assetmanager')

RedisStore = require('connect-redis')(express)
redisUrl = require('url').parse(process.env.REDISTOGO_URL || 'redis://localhost:6379')

# SETUP EXPRESS APP
#-----------------------------------------------------
app = express.createServer(express.logger())

root = __dirname + "/../../"

assetManagerGroups =
  'js' :
    route: /\/assets\/js\/application\.js/
    path: root + 'public/js/'
    dataType: 'javascript'
    files: [
      'jquery.min.js'
      'underscore-min.js'
      'backbone-min.js'
      'ui.js'
      'mustache.js'
      'helpers.js'
      'models.js'
      'collections.js'
      'views.js'
      'chat.js'
      'routers.js'
      'itpirl.js'
      ]

assetsManagerMiddleware = assetManager(assetManagerGroups)

app.configure ->
  # Setup static file server
  app.use express.static(root + 'public')
  app.use express.bodyParser()
  app.use express.cookieParser()
  app.use express.session({
    secret: "lkashjgfekfleljfkjwjekfwekf",
    store: new RedisStore({port: redisUrl.port, host: redisUrl.hostname, pass:(redisUrl.auth)?.split(":")[1]})
  })
  app.use assetsManagerMiddleware

  app.set('views', root + 'views')
  app.set('view engine', 'ejs')

# LOAD OTHER FILES
#-----------------------------------------------------
require('./authentication/routes')(app)
logging = require('./logging')(app)
require('./helpers')(app)

require('./now-shep')(app, logging, new RedisStore({port: redisUrl.port, host: redisUrl.hostname, pass:(redisUrl.auth)?.split(":")[1]}))

# ROUTES
#-----------------------------------------------------
app.get '/', (req, res) ->
  req.session.httpOnly=false
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