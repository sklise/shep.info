var http = require('http')
var fs = require('fs')

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

// Create server
var server = http.createServer(function (req, res) {
  matchRoutes(req, res)
});

var templates = require('./templates')(viewsDir)
var chat = require('./chat')(server)

server.listen(port, function (d,e) {
  debug('listening on port %s', port)
})