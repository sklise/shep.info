(function () {
  var Messages = Backbone.Collection.extend({ model: app.Message });
  var Users = Backbone.Collection.extend({ model: app.User });

  var Channels = Backbone.Collection.extend({
    model: app.Channel,

    initialize: function (options) {
      this.setChannel(options.name);
    },

    setChannel: function (channelName) {
      this.currentChannelName = channelName;
      this.trigger('change:channel')
    },

    getChannel: function () {
      return _.find(this.models, function (channel) {
        return channel.get('name') === this.currentChannelName;
      }, this);
    }
  });

  this.app = window.app != null ? window.app : {};
  this.app.Messages = Messages;
  this.app.Users = Users;
  this.app.Channels = Channels;
}).call(this);