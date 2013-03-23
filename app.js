if (process.env.NODE_ENV !== 'production') {
  var env = require('./.env');

  Object.keys(env).forEach(function (k) {
    process.env[k] = env[k];
  });
}

var express = require('express');
var RedisStore = require('connect-redis')(express)
var debug = require('debug')('http')
var url = require('url')

var port = process.env.PORT || 3000

var redisUrl = url.parse(process.env.REDISTOGO_URL || 'redis://localhost:6379');

redisUrl.password = (function () {
  if (redisUrl.auth) {
    return redisUrl.auth.split(':')[1]
  } else
    return null;
  }
)()

debug('booting shep.info')

// Create app, attach routes and sessions
var app = express()

app.configure(function () {
  app.use(express.bodyParser())
  app.use(express.logger())
  app.use(express.directory('public'))
  app.use(express.static('public'))
  app.use(express.cookieParser())
  app.use(express.session({
    secret: "lkashjgfekfleljfkjwjekfwekf",
    store: new RedisStore({port: redisUrl.port, host: redisUrl.hostname, pass: redisUrl.password})
  }));
});

app.post('/responses/:channel', function (req, res) {
  console.log(req.params['channel'], req.params, req.body)
  res.end('hi')
});

// Create server
var server = app.listen(port, function (d,e) {
  debug('listening on port %s', port)
})

// Attach sockets to Connect server
var chat = require('./chat')(server)