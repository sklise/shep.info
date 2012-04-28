(function() {

  jQuery(function() {
    var _ref;
    this.app = (_ref = window.app) != null ? _ref : {};
    this.app.router = new app.ChannelRouter;
    return Backbone.history.start({
      pushState: true
    });
  });

}).call(this);
