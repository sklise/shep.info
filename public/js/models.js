(function () {
  //
  // name     - the name of a channel, no spaces
  // messages - an instance of app.Messages containing all messages for this
  //            channel
  // users    - an instance of app.Users containing all the users subscribed to
  //            this channel
  var Channel = Backbone.Model.extend({
    // Create users and messages collections
    initialize: function (options) {
      this.set('users', options.users || new app.Users);
      this.set('messages', options.messages || new app.Messages);
    },

    sendMessage: function (message) {
      var channelName = this.get('name')
      var nickname = this.get('nickname')
      socket.emit('message', {
        from: nickname,
        content: message,
        channel: channelName
      });
    }
  });


  // Public: A Message belongs to a Channel.
  //
  // type       -
  // from       -
  // content    -
  // timestamp  -
  //
  var Message = Backbone.Model.extend({
    defaults: {
      type: 'Chat',
      is_shep: false,
      is_self: false },

    initialize: function () {
      if (this.get('from') === "shep") {
        this.set('is_shep', true);
      }

      if (this.get('from') === $('body').data().nickname) {
        this.set('is_self', true);
      }
    }
  });

  var User = Backbone.Model.extend({
    urlRoot: '/users'
  });

  this.app = window.app != null ? window.app : {};
  this.app.Message = Message;
  this.app.User = User;
  this.app.Channel = Channel;
}).call(this);