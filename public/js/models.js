(function() {
  var Message, User, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Message = (function(_super) {

    __extends(Message, _super);

    function Message() {
      Message.__super__.constructor.apply(this, arguments);
    }

    Message.prototype.defaults = {
      type: 'Chat'
    };

    Message.prototype.initialize = function(attributes, options) {};

    return Message;

  })(Backbone.Model);

  User = (function(_super) {

    __extends(User, _super);

    function User() {
      User.__super__.constructor.apply(this, arguments);
    }

    return User;

  })(Backbone.Model);

  this.app = (_ref = window.app) != null ? _ref : {};

  this.app.Message = Message;

  this.app.User = User;

}).call(this);
