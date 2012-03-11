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
      return this.parseTime(this.get('start'), this.get('end'));
    };

    Event.prototype.toAMPM = function(hours, minutes) {
      if (parseInt(hours) > 12) {
        return parseInt(hours) - 12 + ":" + minutes + "p";
      } else {
        return parseInt(hours) + ":" + minutes + "a";
      }
    };

    Event.prototype.parseTime = function(rawStart, rawEnd) {
      var endResult, pattern, startResult;
      pattern = /([0-9]{4}-[0-9]{2}-[0-9]{2})T([0-9]+):([0-9]+):[0-9]+[^-]/;
      startResult = rawStart.match(pattern);
      console.log(startResult);
      endResult = rawEnd.match(pattern);
      if (startResult) {
        this.set({
          startDate: startResult[1]
        });
        this.set({
          startTime: this.toAMPM(startResult[2], startResult[3])
        });
      } else {
        this.set;
      }
      if (endResult) {
        this.set({
          endDate: endResult[1]
        });
        return this.set({
          endTime: this.toAMPM(endResult[2], endResult[3])
        });
      }
    };

    return Event;

  })(Backbone.Model);

  this.app = (_ref = window.app) != null ? _ref : {};

  this.app.Event = Event;

}).call(this);
