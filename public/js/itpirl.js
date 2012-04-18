(function() {
  var _ref;

  this.app = (_ref = window.app) != null ? _ref : {};

  jQuery(function() {
    return (new app.AppView).render().el;
  });

}).call(this);
