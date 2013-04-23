$(document).ready(function () {
  var MenuView = Backbone.View.extend({
    el: '#chat-menu',
    templateSource: $('#menu-template').html(),

    events: {
      'click .add-channel' : 'addChannel'
    },

    initialize: function (options) {
      this.collection.bind('change:channel', this.render, this);
    },

    addChannel: function () {

    },

    change: function (e) {
      console.log(e)
    },

    render: function () {
      var template = Handlebars.compile(this.templateSource);

      this.$el.empty();

      this.$el.html(template({channels:this.collection.toJSON()}));

      this.collection.forEach(function (channel) {
        var channelTabView = new ChannelTabView({model: channel});
        this.$el.find('.chat-room-list').append(channelTabView.render().el)
      },this);

      return this;
    }
  });

  var ChannelTabView = Backbone.View.extend({
    tagName: 'li',
    templateSource: $('#channel-tab-template').html(),

    events: {
      'click' : 'changeChannel'
    },

    render: function () {
      var template = Handlebars.compile(this.templateSource);

      this.$el.html(template(this.model.toJSON()))

      if (this.model.get('isCurrent') === true) {
        this.$el.addClass('current-channel')
      }

      return this;
    },

    changeChannel: function (event) {
      this.model.collection.setChannel(this.model.get('name'));
      window.socket.emit('changeChannel', this.model.get('name'));
    }
  });

  this.app = window.app != null ? window.app : {}
  this.app.MenuView = MenuView;
});