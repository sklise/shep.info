(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  jQuery(function() {
    var EventView, _ref;
    _.templateSettings = {
      interpolate: /\{\{([\s\S]+?)\}\}/g
    };
    EventView = (function(_super) {

      __extends(EventView, _super);

      function EventView() {
        EventView.__super__.constructor.apply(this, arguments);
      }

      EventView.prototype.tagName = 'li';

      EventView.prototype.template = _.template($('#event-template').html());

      EventView.prototype.render = function() {
        var event, _ref, _ref2;
        event = this.model.toJSON();
        event.where = (_ref = event.where) != null ? _ref : "";
        event.link = (_ref2 = event.link) != null ? _ref2 : "";
        $(this.el).html(this.template(event));
        $('#event-window').prepend($(this.el));
        return this;
      };

      return EventView;

    })(Backbone.View);
    this.App = (_ref = window.App) != null ? _ref : {};
    return this.App.EventView = EventView;
  });

}).call(this);
