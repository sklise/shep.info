(function() {
  var _ref;

  this.app = (_ref = window.app) != null ? _ref : {};

  jQuery(function() {
    new app.AppView({
      collection: app.Events
    });
    return app.Events.fetch();
  });

}).call(this);
