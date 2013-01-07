$(document).ready(function () {
  // APP VIEW
  //___________________________________________________________________________
  var AppView = Backbone.View.extend({
    el: '#wrapper',

    initialize: function (options) {
      this.collection.bind('change:channel', this.render, this)

      this.subviews = {
        feedback: new app.FeedbackView(),
        channel: new app.ChannelView({collection: this.collection}),
        // menu: new app.MenuView({collection: this.collection})
      }

      this.bindToWindowResize();
    },

    events: {
      'keypress .nickname-input' : 'nicknameListener',
      'keyup .nickname-input' : 'nicknameListener',
      'click .nickname-submit' : 'saveNickname'
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
      window.socket = io.connect('/');

      var channels = this.collection;
      var logIn = this.saveNickname;
      var context = this;

      socket.emit('requestNickname', nickname);

      socket.on('loggedIn', function () { context.saveNickname() });

      socket.on('invalid-nickname', function (resp) {
        socket.disconnect();
        context.nicknameError(resp);
      });

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
        context.updateUserlist(data);
      })
    },

    // Key listener for nickname input
    nicknameListener: function (event) {
      if (event.keyCode === 32) return false;

      nicknameVal = $(event.target).val();

      if (nicknameVal.length >= 3 && nicknameVal.length <= 15) {
        this.$el.find('.nickname-prompt button').removeAttr('disabled');
        if (event.keyCode === 13) {
          this.requestNickname();
        }
      } else {
        this.$el.find('.nickname-prompt button').attr('disabled', true)
      }

    },

    requestNickname: function () {
      var nickname = this.$el.find('.nickname-prompt input').val()
      this.openSocket(nickname);
    },

    nicknameError: function (resp) {
      this.$el.find('.nickname-prompt input').val('')
      alert('Sorry, the name ' + resp.nickname + ' is already in use, please choose another');
    },

    saveNickname: function () {
      var self = this;
      var nickname = self.$el.find('.nickname-prompt input').val()
      self.collection.forEach(function (channel) {
        channel.set('nickname', nickname);
      });
      self.subviews.channel.render().el
      // self.subviews.menu.render().el
      app.Helpers.fitHeight();
    },

    updateUserlist: function (userlist) {
      this.collection.users = userlist
      this.collection.trigger("change:users")
    }
  });

  this.app = window.app != null ? window.app : {}
  this.app.AppView = AppView;
});