var env = require('./.env');

Object.keys(env).forEach(function (k) {
  process.env[k] = env[k];
});

var connect = require('connect')
var redis = require('connect-redis')(connect)
var render = require('connect-render')
var debug = require('debug')('http')
var ecstatic = require('ecstatic')(__dirname + '/public')
var ejs = require('ejs')
var url = require('url')

var publicDir = __dirname + '/public/'
var port = process.env.PORT || 3000
var redisUrl = url.parse(process.env.REDISTOGO_URL || 'redis://localhost:6379')

debug('booting shep.info')

var matchRoutes = function (req, res) {
  console.log(req.method + ' ' + req.url)

  switch (true) {
    case /^\/$/.test(req.url):
      res.render('index.ejs', {'foo':'bar', 'title':'shep.info'})
      break
    case /^\/channels\/([^\/])*$/.test(req.url):
      res.render('index.ejs', {'foo':'bar', title: 'shep.info'})
      break
    default:
      ecstatic(req,res)
  }
}

// Create app, attach routes and sessions
var app = connect(
    render({
      root: __dirname + '/views',
      layout: 'layout.ejs',
      cache: false, // `false` for debug
      helpers: { sitename: 'Shep.info' }
    })
  )
  .use(require('connect-assets')({build: true}))
  .use(connect.logger())
  .use(function (req, res) {
    matchRoutes(req, res)
  })
  .use(connect.session({
    store: new redis({
      port: redisUrl.port,
      host: redisUrl.hostname,
      pass: (redisUrl.auth || "").split(":")[1]
    }),
    secret: process.env.SESSION_SECRET || 'woof woof'
  }));

// Create server
var server = app.listen(port, function (d,e) {
  debug('listening on port %s', port)
})

// Attach sockets to Connect server
var chat = require('./lib/chat')(server)