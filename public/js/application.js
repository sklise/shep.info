$(document).ready(function () {
  app = window.app != null ? window.app : {}

  var SignUpView = Backbone.View.extend({
    el: '#login-panel',

    events: {
      'click .signup-button' : 'signUp',
      'blur .signup-nickname-input' : 'checkNickname'
    },

    initialize: function () {
      this.render().el;
    },

    checkNickname: function () {
      var view = this;

      var nickname = $('.signup-nickname-input').val();

      if (nickname.length === 0) {
        return false;
      } else if (nickname.length < 3 || nickname.length > 32) {
        view.$el.find('.nickname-status').html("<span class='error'>nickname must be between 3 and 32 characters</span>");
        view.$el.find('button').prop('disabled',true);
        console.log("oyea")
        return false;
      } else if (S(nickname).contains(' ')) {
        view.$el.find('.nickname-status').html("<span class='error'>No spaces please.</span>");
        view.$el.find('button').prop('disabled',true);
        return false;
      }


      $.ajax({
        url: '/nicknames/check',
        type: 'post',
        data: {'nickname': nickname},
        dataType: 'json'
      }).done(function (data) {
        view.$el.find('.nickname-status').html("<span class='success'>nickname is available</span>");
        view.$el.find('button').prop('disabled',false);
      }).fail(function (data) {
        view.$el.find('.nickname-status').html("<span class='error'>nickname is already in use</span>");
        view.$el.find('button').prop('disabled',true);
      })
    },

    render: function () {
      var view = this;
      var template = Handlebars.compile($('#sign-up-template').html());

      this.$el.empty();

      this.$el.html(template());
      $('.signin-link').removeClass('current-login-choice');
      $('.signup-link').addClass('current-login-choice');

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

    initialize: function () {
      this.render().el;
    },

    render: function () {
      var view = this;
      var template = Handlebars.compile($('#sign-in-template').html());

      this.$el.empty();

      this.$el.html(template());
      $('.signin-link').addClass('current-login-choice');
      $('.signup-link').removeClass('current-login-choice');

      return this;
    }
  });

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
      this.subview = new SignInView();
      return false;
    },

    signUp: function () {
      this.subview = new SignUpView();
      return false;
    }
  });

  this.app.LoginView = LoginView;

  if (window.location.pathname === '/' || window.location.pathname === "/auth/login") {
    var lv = new LoginView();
  } else {
    app.router = new app.ChannelRouter
    Backbone.history.start({pushState:true})
  }
});