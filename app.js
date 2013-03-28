if (process.env.NODE_ENV !== 'production') {
  var env = require('./.env');

  Object.keys(env).forEach(function (k) {
    process.env[k] = env[k];
  });
}

var http = require('http'),
  url = require('url');
var debug = require('debug')('http');
var express = require('express');
var app = express();
var redis = require('redis');
var RedisStore = require('connect-redis')(express);
var request = require('request');
var S = require('string');
var redisUrl = url.parse(process.env.REDISTOGO_URL || 'redis://localhost:6379');

var port = process.env.PORT || 3000;
var sessionStore = new RedisStore({port: redisUrl.port, host: redisUrl.hostname, pass: redisUrl.password});
var cookieParser = express.cookieParser('secert');

redisUrl.password = (function () {
  if (redisUrl.auth) {
    return redisUrl.auth.split(':')[1]
  } else
    return null;
  }
)()

console.log('\033[34mbooting shep.info\033[0m')

///////////////////////////////////////////////////////////////////////////////
//   CREATE AND CONFIGURE APP                                                //
///////////////////////////////////////////////////////////////////////////////
app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.logger());
  app.use(express.directory('public'));
  app.use(express.static('public'));
  app.use(cookieParser);
  app.use(express.session({ store: sessionStore, secret: 'keyboard' }));
});

// Create server
var server = http.createServer(app).listen(port);

var client = redis.createClient(redisUrl.port, redisUrl.hostname);
client.auth(redisUrl.password, function (err, reply) {
  if (err) { console.log("Error connecting to Redis"); }
});

// On server start, erase all users and quickly add Shep back.
client.del('users');
client.sadd('users','shep');

var updateUserList = function (io) {
  client.smembers('users', function (err, reply) {
    if (err) { return }
    io.sockets.emit('userlist', reply);
  });
}

var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {
  socket.emit('connectionSuccessful', {hey: "buddy"});
  socket.on('setNickname', function (nickname) {
    client.sismember('users', nickname, function (err, reply) {
      if (reply !== 1) {
        client.sadd('users', nickname);
        updateUserList(io);
      }
    });

    socket.set('nickname', nickname, function () {
      socket.emit('nicknameSet', {nickname: nickname});
    });
  })

  socket.on('message', function (data) {
    socket.get('nickname', function (err, nickname) {
      if(err) {
        return 'err';
      }

      var msg = {
        content: data.content,
        channel: data.channel,
        from: nickname,
        timestamp: Date.now()
      }

      // Forward the message to Shep
      request.post('http://localhost:8080/receive/'+msg.channel).form({
        from: msg.from,
        message: msg.content
      });

      io.sockets.emit('message', msg);
    });

  });

  socket.on('disconnect', function (data) {
    socket.get('nickname', function(err, nickname) {
      debug(">>>> DISCONNECT: " + nickname)
      client.srem('users', nickname, function (err, reply) {
        updateUserList(io);
      });
    });
  });
});

app.post('/responses/:channel', function (req, res) {
  console.log(req.params['channel'], req.params, req.body);
  var jBody = req.body;
  var m = {
    'channel': req.params.channel,
    'content': req.body.message,
    'from': 'shep',
    'timestamp': Date.now()
  }
  io.sockets.emit('message', m);
  res.end('hi')
});