(function() {
  var Messages, Users, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Messages = (function(_super) {

    __extends(Messages, _super);

    function Messages() {
      Messages.__super__.constructor.apply(this, arguments);
    }

    Messages.prototype.model = app.Message;

    Messages.prototype.channel = function(channelName) {
      var messages;
      messages = this.filter(function(message) {
        return message.get('channel') === channelName;
      });
      return _.sortBy(messages, function(message) {
        return message.get('time');
      });
    };

    return Messages;

  })(Backbone.Collection);

  Users = (function(_super) {

    __extends(Users, _super);

    function Users() {
      Users.__super__.constructor.apply(this, arguments);
    }

    Users.prototype.model = app.User;

    return Users;

  })(Backbone.Collection);

  this.app = (_ref = window.app) != null ? _ref : {};

  this.app.Messages = new Messages;

  this.app.Users = new Users;

}).call(this);
