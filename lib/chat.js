var redis = require('redis');
var url = require('url');
var S = require('string');
var debug = require('debug')('http');
var request = require('request');

var redisUrl = url.parse(process.env.REDISTOGO_URL || 'redis://localhost:6379');

redisUrl.password = (function () {
  if (redisUrl.auth) {
    return redisUrl.auth.split(':')[1]
  } else
    return null;
  }
)()

var client = redis.createClient(redisUrl.port, redisUrl.hostname);
client.auth(redisUrl.password, function (err, reply) {
  if (err) { console.log("Error connecting to Redis"); }
});

client.del('users');client.sadd('users','shep');

var updateUserList = function (io) {
  client.smembers('users', function (err, reply) {
    if (err) { return }

    io.sockets.emit('userlist', reply)
  })
}

module.exports = function (server) {
  var io = require('socket.io').listen(server)

  if (process.env.NODE_ENV === "production") {
    io.configure(function () {
      io.set("transports", ["xhr-polling"]);
      io.set('log level', 1);
    });
  }

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

    // Send a message to everyone in the main namespace
    // io.sockets.emit('message', {
      // to: 'sockets'
    // });
  });
}