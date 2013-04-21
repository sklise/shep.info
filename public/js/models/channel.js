(function () {
  var Channel = Backbone.Model.extend({
    // Create users and messages collections
    initialize: function (options) {
      this.set('users', options.users || new app.Users);
      this.set('messages', options.messages || new app.Messages);
    },

    sendMessage: function (message) {
      var channelName = this.get('name');
      var nickname = this.get('nickname');

      var model = this;

      console.log('sendMessage', this.channelSocket);

      this.channelSocket.emit('message', {
        nickname: nickname,
        content: message,
        channel: channelName
      });
    },

    initializeSocket: function (io, socketHost, callback) {
      var channelName = this.get('name');
      var nickname = this.get('nickname');
      var messages = this.get('messages');
      // Connect to namespace

      this.channelSocket = io.connect(socketHost + "/" + channelName, {
        "sync disconnect on unload": true
      });

      var channelSocket = this.channelSocket;

      channelSocket.on('joinedSuccessful', function () {
        console.log('joined ' + channelName);
        channelSocket.emit('setChannelNickname', nickname);

        channelSocket.on('nicknameSet', function () {
          callback(channelSocket);
        });

        channelSocket.on('message', function (data){
          console.log(data);
          messages.add(data);
        });
      });
    }
  });

  this.app = window.app != null ? window.app : {};
  this.app.Channel = Channel;
}).call(this);