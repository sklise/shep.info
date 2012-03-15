(function() {
  var Events, Messages, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Events = (function(_super) {

    __extends(Events, _super);

    function Events() {
      Events.__super__.constructor.apply(this, arguments);
    }

    Events.prototype.model = app.Event;

    Events.prototype.url = 'http://localhost:9393/calendar/week?callback=?';

    return Events;

  })(Backbone.Collection);

  Messages = (function(_super) {

    __extends(Messages, _super);

    function Messages() {
      Messages.__super__.constructor.apply(this, arguments);
    }

    Messages.prototype.model = app.Message;

    return Messages;

  })(Backbone.Collection);

  this.app = (_ref = window.app) != null ? _ref : {};

  this.app.Events = new Events;

  this.app.Messages = new Messages;

}).call(this);
