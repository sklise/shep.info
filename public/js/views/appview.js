$(document).ready(function () {
  // APP VIEW
  // ___________________________________________________________________________
  var AppView = Backbone.View.extend({
    el: '#wrapper',

    initialize: function (options) {
      var view = this
      view.nickname = $('body').data().nickname
      view.collection.bind('change:channel', this.render, this)

      this.subviews = {
        channel: new app.ChannelView({collection: this.collection}),
        menu: new app.MenuView({collection: this.collection})
      }
      var socketHost = $('body').data().socketHost

      window.socket = io.connect(socketHost, {
        'sync disconnect on unload': true
      })

      socket.on('connect', function () {
        socket.emit('join', {
          nickname: view.nickname,
          rooms: _.map(view.collection.models, function (channel) {
            return channel.get('name')
          }),
          currentRoom: 'itp'
        })

        view.collection.nickname = view.nickname
        view.bindToWindowResize()
        view.subviews.channel.render().el
        view.subviews.menu.render().el
        app.Helpers.fitHeight()
      })

      socket.on('message', function (d) {
        var room = view.collection.find(function (channel) {
          return channel.get('name') === d.channel
        })

        room.get('messages').add(d)
      })

      socket.on('userlist', function (userlist) {
        view.updateUserList(userlist)
      })
    },

    render: function () {
      return this
    },

    // Bind window resize event
    bindToWindowResize: function () {
      app.Helpers.fitHeight()
      $(window).bind('resize', function () {
        app.Helpers.fitHeight()
      })
    },

    updateUserList: function (userlist) {
      this.collection.users = userlist
      this.collection.trigger('change:users')
    }
  })

  this.app = window.app != null ? window.app : {}
  this.app.AppView = AppView
})
