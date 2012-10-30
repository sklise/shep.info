var http = require('http')
var fs = require('fs')

var debug = require('debug')('http')
var ecstatic = require('ecstatic')(__dirname + '/public')
var ejs = require('ejs')
var socketio = require('socket.io')

var publicDir = __dirname + '/public/'
var viewsDir = __dirname + '/views/'
var port = process.env.PORT || 3000

debug('booting shep.info')

var templates = {}

var loadTemplates = function() {
  // Load all files from the views path and save them to the templates object
  fs.readdir(viewsDir, function (err, files) {
    if (err) {
      return console.log(err)
    }
    files.forEach(loadTemplateFromDisk)
  })
}

var loadTemplateFromDisk = function(file) {
  fs.readFile(viewsDir + file, 'utf8', function (err,data) {
    if (err) {
      return console.log(err)
    }
    fileName = file.split('.')[0]
    templates[fileName] = data
  })
}

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

var io = socketio.listen(server)

io.sockets.on('connection', function(socket) {
  socket.on('setNickname', function (name) {
    socket.set('nickname', name['nickname'], function () {
      socket.emit('loggedin', {nickname: name['nickname']})
    });
  });

  socket.on('message', function (data) {
    socket.get('nickname', function (err, nickname) {
      if(err) {
        return 'err';
      }

      socket.broadcast.emit('message', {
        message: data['message'],
        sender: nickname,
        date: Date.now()
      });
    });

  });

  socket.on('disconnect', function (data) {
    socket.get('nickname', function(err, res) {
      console.log(err, res)
    });
    console.log('disconnect', data);
  });

  // Send a message to everyone in the main namespace
  io.sockets.emit('message', {
    to: 'sockets'
  });
});

server.listen(port, function (d,e) {
  debug('listening on port %s', port)
  loadTemplates()
})