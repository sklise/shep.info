$(document).ready(function () {
  var ChannelRouter = Backbone.Router.extend({
    routes: {
      '' : 'mainChannel',
      'shep' : 'talkToShep',
      'channels/:channel' : 'show'
    },

    initialize: function () {
      this.view = new app.AppView;
      this.view.render().el;
      app.Helpers.fitHeight();
      app.Messages.bind('change:channel', this.changeChannel, this);
    },

    changeChannel: function () {
      Backbone.history.navigate("channels/" + app.Messages.channel);
    },

    mainChannel: function () {
      app.Messages.setChannel('itp');
      Backbone.history.navigate('channels/itp', true)
    },

    show: function (channel) {
      app.Messages.setChannel(channel);
    }
  });

  this.app = window.app != null ? window.app : {};
  this.app.ChannelRouter = ChannelRouter;
});