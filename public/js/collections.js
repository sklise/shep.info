(function() {
  var Events, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Events = (function(_super) {

    __extends(Events, _super);

    function Events() {
      Events.__super__.constructor.apply(this, arguments);
    }

    Events.prototype.model = App.Event;

    Events.prototype.url = 'http://ilc.itpirl.com/calendar/student';

    return Events;

  })(Backbone.Collection);

  this.App = (_ref = window.App) != null ? _ref : {};

  this.App.Events = new Events;

}).call(this);
