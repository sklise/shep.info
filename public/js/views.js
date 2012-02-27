(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  jQuery(function() {
    var AppView, EventView, EventsView, _ref;
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
        return this.eventview = new EventsView({
          collection: this.collection
        });
      };

      AppView.prototype.render = function() {
        return $(this.el).find('#event-window').append(this.eventview.render().el);
      };

      return AppView;

    })(Backbone.View);
    EventsView = (function(_super) {

      __extends(EventsView, _super);

      function EventsView() {
        EventsView.__super__.constructor.apply(this, arguments);
      }

      EventsView.prototype.id = 'event-feed';

      EventsView.prototype.tagName = 'ul';

      EventsView.prototype.template = $('#events-template').html();

      EventsView.prototype.render = function() {
        var event, eventView, _i, _len, _ref;
        $(this.el).empty();
        _ref = this.collection.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          event = _ref[_i];
          eventView = new EventView({
            model: event
          });
          $(this.el).append(eventView.render().el);
        }
        return this;
      };

      return EventsView;

    })(Backbone.View);
    EventView = (function(_super) {

      __extends(EventView, _super);

      function EventView() {
        EventView.__super__.constructor.apply(this, arguments);
      }

      EventView.prototype.className = 'event';

      EventView.prototype.tagName = 'li';

      EventView.prototype.template = $('#event-template').html();

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
