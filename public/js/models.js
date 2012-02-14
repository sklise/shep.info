(function() {
  var Event, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Event = (function(_super) {

    __extends(Event, _super);

    function Event() {
      Event.__super__.constructor.apply(this, arguments);
    }

    Event.prototype.initialize = function(attributes, options) {
      return true;
    };

    return Event;

  })(Backbone.Model);

  this.App = (_ref = window.App) != null ? _ref : {};

  this.App.Event = Event;

}).call(this);
