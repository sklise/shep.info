$(document).ready(function () {
  // APP VIEW
  //___________________________________________________________________________
  var AppView = Backbone.View.extend({
    el: '#wrapper',

    initialize: function (options) {
      var view = this;
      this.nickname = $('body').data().nickname;
      this.collection.bind('change:channel', this.render, this)

      this.subviews = {
        feedback: new app.FeedbackView(),
        channel: new app.ChannelView({collection: this.collection}),
        menu: new app.MenuView({collection: this.collection})
      }
      var socketHost = $('body').data().socketHost;

      window.socket = io.connect(socketHost, {
        "sync disconnect on unload": true
      });

      socket.on('connectionSuccessful', function () {
        socket.emit('setNickname', view.nickname);
      });

      socket.on('nicknameSet', function () {
        view.openSocket(view.nickname);
        view.bindToWindowResize();

        view.collection.forEach(function (channel) {
          channel.set('nickname', view.nickname);
        });

        view.subviews.channel.render().el
        view.subviews.menu.render().el
        app.Helpers.fitHeight();
      });
    },

    events: {

    },

    render: function () {
      return this;
    },

    // Bind window resize event
    bindToWindowResize: function () {
      app.Helpers.fitHeight();
      $(window).bind('resize', function () {
        app.Helpers.fitHeight();
      });
    },

    // openSocket
    // Binds client to socket.io connection
    //
    // nickname - a nickname is required to chat
    openSocket: function (nickname) {
      var channels = this.collection;
      var view = this;

      socket.on('message', function (data) {
        // Get the channel the message is intended for.
        var thisChannel = _.find(channels.models, function (channel) {
          return channel.get('name') === data.channel
        });

        // add the message to the appropriate channel
        thisChannel.get('messages').add(data)
      });

      socket.on('disconnect', function (data) {
        console.log('disconnect', data);
      });

      socket.on('userlist', function (data) {
        view.updateUserlist(data);
      });

      window.onbeforeunload = function () {
        window.socket.disconnect();
      }
    },

    updateUserlist: function (userlist) {
      this.collection.users = userlist
      this.collection.trigger("change:users")
    }
  });

  this.app = window.app != null ? window.app : {}
  this.app.AppView = AppView;
});