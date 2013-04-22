(function () {
  var Channel = Backbone.Model.extend({
    // Create users and messages collections
    initialize: function (options) {
      console.log("new channel");
      this.set('users', options.users || new app.Users);
      this.set('messages', options.messages || new app.Messages);
    },

    sendMessage: function (message) {
      var channelName = this.get('name');
      var nickname = this.collection.nickname;

      window.socket.emit('newmessage', {
        nickname: nickname,
        content: message,
        channel: channelName
      });
    }
  });

  this.app = window.app != null ? window.app : {};
  this.app.Channel = Channel;
}).call(this);