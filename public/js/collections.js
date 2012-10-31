(function () {
  var Messages = Backbone.Collection.extend({
    model: app.Message,

    initialize: function (options) {
      this.channel = 'itp'
    },

    setChannel: function (channelName) {
      this.channel = channelName;
      this.trigger('change:channel');
    },

    thisChannel: function () {
      var self = this;
      messages = this.filter(function (message) {
        return message.get('channel') === self.channel
      });
      return _.sortBy(messages, function (message) {
        return message.get('time');
      });
    }
  });

  var Users = Backbone.Collection.extend({
    model: app.User,

    thatChannel: function (channel) {
      var users;
      return users = this.filter(function (user) {
        return user.get('channel') === channel;
      });
    },

    thisChannel: function () {
      users = this.filter(function (user) {
        return user.get('channel') === app.Messages.channel;
      });
      return _.sortBy(users, function (user) {
        return message.get('time');
      });
    }
  });

  var Channels = Backbone.Collection.extend({
    models: app.Channel
  });

  this.app = window.app != null ? window.app : {};
  this.app.Messages = new Messages;
  this.app.Users = new Users;
  this.app.Channels = new Channels;
}).call(this);