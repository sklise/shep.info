(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  jQuery(function() {
    var ChannelRouter, _ref;
    ChannelRouter = (function(_super) {

      __extends(ChannelRouter, _super);

      function ChannelRouter() {
        ChannelRouter.__super__.constructor.apply(this, arguments);
      }

      ChannelRouter.prototype.routes = {
        '': 'mainChannel',
        'shep': 'talkToShep',
        'channels/:channel': 'show'
      };

      ChannelRouter.prototype.initialize = function() {
        return this.view = new app.AppView({
          collection: app.Chats
        });
      };

      ChannelRouter.prototype.mainChannel = function() {};

      ChannelRouter.prototype.show = function() {};

      ChannelRouter.prototype.talkToShep = function() {};

      return ChannelRouter;

    })(Backbone.Router);
    this.app = (_ref = window.app) != null ? _ref : {};
    return this.app.ChannelRouter = ChannelRouter;
  });

}).call(this);
