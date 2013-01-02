$(document).ready(function () {
  var MenuView = Backbone.View.extend({
    el: '#chat-menu',
    templateSource: $('#menu-template').html(),

    initialize: function (options) {
      this.collection.bind('change:channel', this.render, this)
    },

    events: {
      'click .channel' : 'changeChannel'
    },

    render: function () {
      var template = Handlebars.compile(this.templateSource);

      this.$el.empty();

      this.$el.html(template({channels:this.collection.toJSON()}));

      return this;
    },

    changeChannel: function (event) {
      var channelName = $(event.target).data().name
      console.log(channelName)
      this.collection.setChannel(channelName);
    }
  });

  this.app = window.app != null ? window.app : {}
  this.app.MenuView = MenuView;
});