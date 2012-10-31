insertAgenda = function (data) {
  window.entries = data['feed']['entry'];
}

var insertCalendar = function () {
  var templateSource = $('#calendar-event-template').html();
  var template = Handlebars.compile(templateSource);
  entries.forEach(function (entry) {
    var event = {
      link: entry['link'][0]['href'],
      start: entry['gd$when'][0]['startTime'],
      end: entry['gd$when'][0]['endTime'],
      title: entry['title']['$t'].trim()
    }
    $('#calendar ul').append(template(event));
  });
}

var pad = function (number) {
  return (number < 10) ? '0' + number : number
}

var hours = function (hour) {
  return (hour <= 12) ? hour : hour - 12
}

Handlebars.registerHelper('dateString', function (date) {
  var d = new Date(date)
  return d.getMonth() + "/" + pad(d.getDate()) + " " + hours(d.getHours()) + ":" + pad(d.getMinutes())
});

var openSocket = function (nickname) {
  window.socket = io.connect('/')
  socket.emit('setNickname', {nickname: nickname});

  socket.on('message', function (data) {
    console.log('message', data)
  });

  socket.on('disconnect', function (data) {
    console.log('disconnect', data);
  });
}

$(document).ready(function () {
  var nicknamePrompt = new ui.Confirmation({
    title: "Please enter a nickname",
    message: $('<p>No spaces, names must be between<br>4 and 15 characters. </p><input tabindex="1" type="text" id="nickname-form">')})
    .modal()
    .show(function (response) {
      if (response) {
        var nickname = $('#nickname-form').val();
        openSocket(nickname);
      }
  });

  insertCalendar()


  app = window.app != null ? window.app : {}
  app.router = new app.ChannelRouter
  Backbone.history.start({pushState:true})
});