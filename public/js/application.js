Handlebars.registerHelper('dateString', function (date) {
  var d = new Date(date)
  return d.getMonth() + "/" + pad(d.getDate()) + " " + hours(d.getHours()) + ":" + pad(d.getMinutes())
});


var chat = {
  openSocket: function (nickname) {
    window.socket = io.connect('/')
    socket.emit('setNickname', {nickname: nickname});

    socket.on('message', function (data) {
      console.log('message', data)
    });

    socket.on('disconnect', function (data) {
      console.log('disconnect', data);
    });
  }
}

window.chat = chat;

$(document).ready(function () {
  app = window.app != null ? window.app : {}
  app.router = new app.ChannelRouter
  Backbone.history.start({pushState:true})
});