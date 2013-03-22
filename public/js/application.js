$(document).ready(function () {
  app = window.app != null ? window.app : {}

  var LoginView = Backbone.View.extend({
    el: '#login-panel',

    initialize: function () {
    },

    events: {
      'click .signup-button' : 'signUp',
      'click .signin-button' : 'signIn',
      'blur .nickname-input' : 'checkNickname'
    },

    checkNickname: function () {
      var view = this;

      $.ajax({
        url: '/nicknames/check',
        type: 'post',
        data: {'nickname': $('.nickname-input').val()},
        dataType: 'json'
      }).done(function (data) {
        view.$el.find('.nickname-status').html("nickname is available");
      }).fail(function (data) {
        view.$el.find('.nickname-status').html("nickname is already in use");
      })
    },

    signIn: function () {
      return false;
    },

    signUp: function () {
      var view = this;
      var password = this.$el.find('#password-input').val();
      var passwordConfirm = this.$el.find('#password-confirm').val();

      if (password === passwordConfirm) {
        var u = new app.User()
        u.set({
          'nickname': this.$el.find('.nickname-input').val(),
          'password': this.$el.find('#password-input').val()
        });
        u.save(u.attributes, {
          success: function () {
            window.location.pathname = "/channels/itp"
          },
          error: function () {
            view.$el.prepend('Uhoh, something went wrong')
          }
        })
      } else {
        this.$el.find('.password-status').html('Your passwords do not match');
      }

      return false;
    }
  });

  this.app.LoginView = LoginView;

  if (window.location.pathname === '/') {
    var lv = new LoginView();
  } else {
    app.router = new app.ChannelRouter
    Backbone.history.start({pushState:true})
  }
});