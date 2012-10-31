(function () {
  var Message = Backbone.Model.extend({
    defaults: { type: 'Chat' },
  });

  var User = Backbone.Model.extend({})
  var Channel = Backbone.Model.extend({})

  this.app = window.app != null ? window.app : {};
  this.app.Message = Message;
  this.app.User = User;
  this.app.Channel = Channel;
}).call(this);