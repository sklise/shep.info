$(document).ready(function () {
  var LoginView = Backbone.View.extend({
    el: '#channel-viewport',

    initialize: function () {
      this.signUp();
    },

    events: {
      'click .signin-link' : 'signIn',
      'click .signup-link' : 'signUp'
    },

    signIn: function () {
      this.subview = new app.SignInView();
      return false;
    },

    signUp: function () {
      this.subview = new app.SignUpView();
      return false;
    }
  });

  this.app = window.app != null ? window.app : {}
  this.app.LoginView = LoginView;
});