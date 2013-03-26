$(document).ready(function () {
  app = window.app != null ? window.app : {}

  var SignUpView = Backbone.View.extend({
    el: '#login-panel',

    events: {
      'click .signup-button' : 'signUp',
      'blur .nickname-input' : 'checkNickname'
    },

    initialize: function () {
      console.log("sign up!")
      this.render().el;
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

    render: function () {
      var view = this;
      var template = Handlebars.compile($('#sign-up-template').html());

      this.$el.empty();

      this.$el.html(template());

      return this;
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

  var SignInView = Backbone.View.extend({
    el: '#login-panel',

    events: {
      'click .signin-button' : 'signIn'
    },

    initialize: function () {
      this.render().el;
    },

    render: function () {
      var view = this;
      var template = Handlebars.compile($('#sign-in-template').html());

      this.$el.empty();

      this.$el.html(template());

      return this;
    },

    signIn: function () {
      console.log('sign in');
    }
  });

  var LoginView = Backbone.View.extend({
    el: '#channel-viewport',

    initialize: function () {
      this.signIn();
    },

    events: {
      'click .signin-link' : 'signIn',
      'click .signup-link' : 'signUp'
    },

    signIn: function () {
      console.log("hi!")
      this.subview = new SignInView();
      return false;
    },

    signUp: function () {
      this.subview = new SignUpView();
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