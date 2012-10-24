var debug = require('debug')('http')
var http = require('http')
var fs = require('fs')
var filed = require('filed')
var ecstatic = require('ecstatic')(__dirname + '/public')
var ejs = require('ejs')

var publicDir = __dirname + '/public/'
var viewsDir = __dirname + '/views/'
var port = process.env.PORT || 3000

debug('booting shep.info')

var templates = {}

// Load all files from the views path and save them to the templates object
fs.readdir(viewsDir, function (err, files) {
  if (err) {
    return console.log(err)
  }
  files.forEach(loadTemplateFromDisk)
})

var loadTemplateFromDisk = function(file) {
  fs.readFile(viewsDir + file, 'utf8', function (err,data) {
    if (err) {
      return console.log(err)
    }
    fileName = file.split('.')[0]
    templates[fileName] = data
  })
}

// Create server
var server = http.createServer(function (req, res) {
  debug(req.method + ' ' + req.url)

  switch (req.url) {
    case '/':
      res.end(ejs.render(templates['layout'], {title:'',body:ejs.render(templates['index'], {'foo':'bar'})}))
      break
    default:
      ecstatic(req,res)
  }
}).listen(port, function (d,e) {
  debug('listening on port %s', port)
})