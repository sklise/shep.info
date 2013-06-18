$(document).ready(function () {
  var MenuView = Backbone.View.extend({
    el: '#chat-menu',
    templateSource: $('#menu-template').html(),

    events: {
      'click .add-channel' : 'addChannel',
      'click .help-button' : 'showHelp'
    },

    initialize: function (options) {
      this.collection.bind('change:channel', this.render, this);
    },

    addChannel: function () {
      this.render().el;
      var newChannel = new NewChannelView({collection: this.collection});
      this.$el.append(newChannel.render().el);
    },

    change: function (e) {
      console.log(e)
    },

    showHelp: function () {
      this.collection.trigger('show:help');
    },

    render: function () {
      var template = Handlebars.compile(this.templateSource);

      this.$el.empty();

      this.$el.html(template({channels: this.collection.toJSON()}));

      this.collection.forEach(function (channel) {
        var channelTabView = new ChannelTabView({model: channel});
        this.$el.find('.chat-room-list').append(channelTabView.render().el)
      }, this);

      this.$el.find('.chat-room-list').append('<li class="add-channel"><span class="channel-menu-button"><div class="channel-icon glyphicons circle_plus"><i></i></div></span></li><li class="help-button">Help</li>');
      return this;
    }
  });

  var NewChannelView = Backbone.View.extend({
    initialize: function () {
      // this.render().el;
    },

    events: {
      'click .create-channel': 'createChannel',
      'change .channel-list-select' : 'selectChannel'
    },

    selectChannel: function () {
      var channel_name = this.$el.find('.channel-list-select').val();
      this.collection.addChannel(channel_name);
    },

    createChannel: function () {
      var channel_name = this.$el.find('.new-channel-input').val();
      this.collection.addChannel(channel_name);
    },

    render: function () {
      var template = Handlebars.compile($('#channel-chooser-template').html());
      var view = this;

      $.getJSON('/api/channels').done(function(data) {

        var my_channels = _.pluck(view.collection.toJSON(), 'name');

        var new_channels = _.reject(data, function(channel) {
          console.log(_.contains(my_channels, channel.name), channel.name, my_channels)
          return _.contains(my_channels, channel.name);
        });

        console.log(new_channels);

        view.$el.html(template({channels: new_channels}));
        // $('.chzn-select').chosen();
      });
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