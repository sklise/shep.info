(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  jQuery(function() {
    var AppView, EventDateView, EventView, EventsView, MessageView, MessagesView, _ref;
    _.templateSettings = {
      interpolate: /\{\{([\s\S]+?)\}\}/g
    };
    AppView = (function(_super) {

      __extends(AppView, _super);

      function AppView() {
        AppView.__super__.constructor.apply(this, arguments);
      }

      AppView.prototype.el = '#content';

      AppView.prototype.initialize = function(options) {
        this.collection.bind('reset', this.render, this);
        this.messagesview = new MessagesView({
          collection: this.collection
        });
        return this.eventsview = new EventsView({
          collection: this.collection
        });
      };

      AppView.prototype.render = function() {
        $(this.el).find('#event-window').append(this.eventsview.render().el);
        return this.messagesview.render().el;
      };

      return AppView;

    })(Backbone.View);
    MessageView = (function(_super) {

      __extends(MessageView, _super);

      function MessageView() {
        MessageView.__super__.constructor.apply(this, arguments);
      }

      MessageView.prototype.className = 'message';

      MessageView.prototype.tagName = 'li';

      MessageView.prototype.template = $('#message-template').html();

      MessageView.prototype.render = function() {
        $(this.el).html(Mustache.render(this.template, this.model.toJSON()));
        return this;
      };

      return MessageView;

    })(Backbone.View);
    MessagesView = (function(_super) {

      __extends(MessagesView, _super);

      function MessagesView() {
        MessagesView.__super__.constructor.apply(this, arguments);
      }

      MessagesView.prototype.el = '#chat-window';

      MessagesView.prototype.template = $('#messages-template').html();

      MessagesView.prototype.render = function() {
        var chatInterior, chatWindowHeight, headerHeight, windowHeight;
        $(this.el).append(Mustache.render(this.template));
        windowHeight = $(window).height();
        headerHeight = $('#header-container').height();
        $(this.el).css('height', windowHeight - headerHeight);
        chatWindowHeight = windowHeight - headerHeight;
        chatInterior = chatWindowHeight - $('#new-message').height();
        $('#chat-log-container').height(chatInterior);
        $('#chat-log').css('min-height', chatInterior);
        return this;
      };

      return MessagesView;

    })(Backbone.View);
    EventsView = (function(_super) {

      __extends(EventsView, _super);

      function EventsView() {
        EventsView.__super__.constructor.apply(this, arguments);
      }

      EventsView.prototype.id = 'event-feed';

      EventsView.prototype.tagName = 'ul';

      EventsView.prototype.template = ($('#events-template')).html();

      EventsView.prototype.render = function() {
        var event, eventView, eventWindow, headerHeight, windowHeight, _i, _len, _ref;
        $(this.el).empty();
        _ref = this.collection.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          event = _ref[_i];
          eventView = new EventView({
            model: event
          });
          $(this.el).append(eventView.render().el);
        }
        windowHeight = $(window).height();
        headerHeight = $('#header-container').height();
        $(this.el).css('height', windowHeight - headerHeight);
        eventWindow = windowHeight - headerHeight;
        $('#event-window').height(eventWindow);
        return this;
      };

      return EventsView;

    })(Backbone.View);
    EventDateView = (function(_super) {

      __extends(EventDateView, _super);

      function EventDateView() {
        EventDateView.__super__.constructor.apply(this, arguments);
      }

      EventDateView.prototype.tagName = 'li';

      EventDateView.prototype.className = 'event-date';

      EventDateView.prototype.template = ($('#event-date')).html();

      EventDateView.prototype.render = function() {
        $(this.el).html(Mustache.render(this.template, this.model.toJSON()));
        return this;
      };

      return EventDateView;

    })(Backbone.View);
    EventView = (function(_super) {

      __extends(EventView, _super);

      function EventView() {
        EventView.__super__.constructor.apply(this, arguments);
      }

      EventView.prototype.className = 'event';

      EventView.prototype.tagName = 'li';

      EventView.prototype.template = ($('#event-template')).html();

      EventView.prototype.events = {
        'click': 'toggleExpanded'
      };

      EventView.prototype.render = function() {
        $(this.el).html(Mustache.render(this.template, this.model.toJSON()));
        return this;
      };

      EventView.prototype.toggleExpanded = function() {
        return this.$('.details').toggle();
      };

      return EventView;

    })(Backbone.View);
    this.app = (_ref = window.app) != null ? _ref : {};
    return this.app.AppView = AppView;
  });

}).call(this);
