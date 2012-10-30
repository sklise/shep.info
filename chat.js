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
}