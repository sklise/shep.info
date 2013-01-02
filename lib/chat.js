module.exports = function (server) {
  var io = require('socket.io').listen(server)

  io.sockets.on('connection', function(socket) {
    socket.on('setNickname', function (name) {
      socket.set('nickname', name['nickname'], function () {
        socket.emit('loggedin', {nickname: name['nickname']})
      });
    });

    socket.on('message', function (data) {
      socket.get('nickname', function (err, nickname) {
        console.log("message received", err, nickname)
        if(err) {
          return 'err';
        }

        socket.emit('message', {
          content: data.content,
          channel: data.channel,
          from: data.from,
          timestamp: Date.now()
        })

        socket.broadcast.emit('message', {
          content: data.content,
          channel: data.channel,
          from: data.from,
          timestamp: Date.now()
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
    // io.sockets.emit('message', {
      // to: 'sockets'
    // });
  });
}