(function () {
  var User = Backbone.Model.extend({
    urlRoot: '/users'
  });

  this.app = window.app != null ? window.app : {};
  this.app.User = User;
}).call(this);