var connect = require('connect')
var debug = require('debug')('http')
var ecstatic = require('ecstatic')(__dirname + '/public')
var ejs = require('ejs')

var publicDir = __dirname + '/public/'
var viewsDir = __dirname + '/views/'
var port = process.env.PORT || 3000

debug('booting shep.info')

var matchRoutes = function (req, res) {
  debug(req.method + ' ' + req.url)

  switch (true) {
    case /^\/$/.test(req.url):
      console.log('root')
      res.end(ejs.render(templates['layout'], {title:'',body:ejs.render(templates['index'], {'foo':'bar'})}))
      break
    case /^\/channel\/([^\/])*$/.test(req.url):
      console.log('channel')
      res.end('hi')
      break
    default:
      console.log('ecstatic')
      ecstatic(req,res)
  }
}

// Create app
var app = connect()
  .use(function (req, res) {
    matchRoutes(req, res)
  });

var templates = require('./templates')(viewsDir)
// Create server
var server = app.listen(port, function (d,e) {
  debug('listening on port %s', port)
})
var chat = require('./chat')(server)