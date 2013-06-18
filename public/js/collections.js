(function () {
  var Messages = Backbone.Collection.extend({ model: app.Message });
  var Users = Backbone.Collection.extend({ model: app.User });

  var Channels = Backbone.Collection.extend({
    model: app.Channel,

    initialize: function (options) {
      options[0].isCurrent = true;
      this.setChannel(options[0].name);
    },

    setChannel: function (channelName) {
      this.currentChannelName = channelName;

      this.models.forEach(function (channel) {
        if (channel.get('name') === channelName) {
          channel.set('isCurrent', true)
        } else {
          channel.set('isCurrent', false)
        }
      });

      this.trigger('change:channel');
    },

    addChannel: function (channelName) {
      window.selected_channel = this.findWhere({'name': channelName});

      var collection = this;
      this.on('add', function (channel) {
        collection.setChannel(channelName);
      });

      this.add(new app.Channel({name: channelName, isCurrent: true}));
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