$(document).ready(function () {
  app = window.app != null ? window.app : {}

  var LoginView = Backbone.View.extend({
    events: {
      'click .signup-button' : 'signUp',
      'click .signin-button' : 'signIn'
    },

    signIn: function () {
      return false;
    },

    signUp: function () {
      return false;
    }
  });

  this.app.LoginView = LoginView;

  if (window.location.pathname === '/') {

  } else {
    app.router = new app.ChannelRouter
    Backbone.history.start({pushState:true})
  }
});