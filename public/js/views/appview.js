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

      window.onbeforeunload = function () {
        _.forEach(io.sockets['http://localhost:3001'].namespaces, function (x,v) {
          var s = io.sockets['http://localhost:3001'].namespaces[v];
          s.disconnect();
        });
      }

      socket.on('connectionSuccessful', function () {
        view.collection.forEach(function (channel) {
          channel.set('nickname', view.nickname);

          console.log('join-channel', channel.get('name'));
          socket.emit('join-channel', '/' + channel.get('name'));

          channel.initializeSocket(io, socketHost, function (xo) {
            console.log(xo);
            xo.on('userlist', function (data) {
              view.updateUserlist(data);
            });
          });
        });

        view.bindToWindowResize();
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

    updateUserlist: function (userlist) {
      this.collection.users = userlist
      this.collection.trigger("change:users")
    }
  });

  this.app = window.app != null ? window.app : {}
  this.app.AppView = AppView;
});