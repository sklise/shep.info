$(document).ready(function () {
  var ChannelRouter = Backbone.Router.extend({
    routes: {
      '' : 'mainChannel',
      'shep' : 'talkToShep',
      'channels/:channel' : 'show'
    },

    initialize: function () {
      this.view = new app.AppView({
        collection: new app.Channels(
          [{name: 'itp'}]
        )
      });
      this.view.render().el;
      app.Helpers.fitHeight();

      this.view.collection.bind('change:channel', this.changeChannel, this);
    },

    changeChannel: function () {
      Backbone.history.navigate("channels/" + this.view.collection.getChannel().get('name'));
    },

    mainChannel: function () {
      Backbone.history.navigate('channels/itp', true)
    },

    show: function (channel) {
      // this.view.collection.setChannel(channel);
    }
  });

  this.app = window.app != null ? window.app : {};
  this.app.ChannelRouter = ChannelRouter;
});