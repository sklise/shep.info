$(function () {
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