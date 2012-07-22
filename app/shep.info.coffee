# REQUIRE MODULES
#-----------------------------------------------------
http = require('http')
querystring = require('querystring')
express = require('express')
ejs = require('ejs')
RedisStore = require('connect-redis')(express)
url = require('url')

# SETUP EXPRESS APP
#-----------------------------------------------------
app = express.createServer(express.logger())

root = __dirname + "/../"
redisUrl = url.parse(process.env.REDISTOGO_URL || 'redis://localhost:6379')

app.configure ->
  # Setup static file server
  app.use express.static(root + 'public')
  app.use express.bodyParser()
  app.use express.cookieParser()
  app.use express.session({
    secret: "lkashjgfekfleljfkjwjekfwekf",
    store: new RedisStore({port: redisUrl.port, host: redisUrl.hostname, pass:(redisUrl.auth)?.split(":")[1]})
  })
  app.use require('connect-assets')()

  app.set('views', root + 'views')
  app.set('view engine', 'ejs')

# LOAD OTHER FILES
#-----------------------------------------------------
logging = require('./logging')(app)
require('./helpers')(app)
require('./routes')(app)
require('./now-shep')(app, logging, new RedisStore({port: redisUrl.port, host: redisUrl.hostname, pass:(redisUrl.auth)?.split(":")[1]}))

# LISTEN ON A PORT
#-----------------------------------------------------
port = process.env.PORT || 3000
app.listen port, ->
  console.log("Listening on " + port)
