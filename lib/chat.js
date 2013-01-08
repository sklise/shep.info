var redis = require('redis');
var url = require('url');
var S = require('string');
var debug = require('debug')('http');

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
    socket.on('requestNickname', function (nickname) {
      client.sismember('users', nickname, function (err, reply) {

        if (reply === 1) {
          socket.emit('invalid-nickname', {nickname: nickname});

          debug(client.smembers('users', function (err, reply) { console.log(reply)}))
        } else {
          client.sadd('users', nickname)
          socket.set('nickname', nickname, function () {
            socket.emit('loggedIn', {nickname: nickname});
          });

          updateUserList(io);
        }
      })
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

        io.sockets.emit('message', msg);
      });

    });

    socket.on('disconnect', function (data) {
      socket.get('nickname', function(err, nickname) {
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