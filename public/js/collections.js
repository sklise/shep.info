(function() {
  var Channels, Messages, Users, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Messages = (function(_super) {

    __extends(Messages, _super);

    function Messages() {
      Messages.__super__.constructor.apply(this, arguments);
    }

    Messages.prototype.model = app.Message;

    Messages.prototype.initialize = function(options) {
      return this.channel = 'itp';
    };

    Messages.prototype.setChannel = function(channelName) {
      this.channel = channelName;
      return this.trigger('change:channel');
    };

    Messages.prototype.thisChannel = function() {
      var messages,
        _this = this;
      messages = this.filter(function(message) {
        return message.get('channel') === _this.channel;
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

    Users.prototype.thatChannel = function(channel) {
      var users;
      return users = this.filter(function(user) {
        return user.get('channel') === channel;
      });
    };

    Users.prototype.thisChannel = function() {
      var users,
        _this = this;
      users = this.filter(function(user) {
        return user.get('channel') === app.Messages.channel;
      });
      return _.sortBy(users, function(user) {
        return user.get('name');
      });
    };

    return Users;

  })(Backbone.Collection);

  Channels = (function(_super) {

    __extends(Channels, _super);

    function Channels() {
      Channels.__super__.constructor.apply(this, arguments);
    }

    Channels.prototype.models = app.Channel;

    return Channels;

  })(Backbone.Collection);

  this.app = (_ref = window.app) != null ? _ref : {};

  this.app.Messages = new Messages;

  this.app.Users = new Users;

  this.app.Channels = new Channels;

}).call(this);
