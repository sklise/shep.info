$(document).ready(function () {
  var SignUpView = Backbone.View.extend({
    el: '#login-panel',

    events: {
      'click .signup-button': 'signUp',
      'blur .signup-nickname-input': 'checkNickname'
    },

    initialize: function () {
      this.render().el
    },

    checkNickname: function () {
      var view = this

      var nickname = $('.signup-nickname-input').val()

      var slugified = S(nickname).slugify().s

      if (nickname.length === 0) {
        return false
      } else if (nickname !== slugified) {
        view.$el.find('.signup-nickname-input').val(slugified)
        view.$el.find('.nickname-status').html("<span class='error'>Your nickname has been changed to remove punctuation and spaces. Please check to make sure this is how you want your nickname to appear.</span>")
        return false
      } else if (nickname.length < 3 || nickname.length > 32) {
        view.$el.find('.nickname-status').html("<span class='error'>nickname must be between 3 and 32 characters</span>")
        view.$el.find('button').prop('disabled', true)
        return false
      }

      $.ajax({
        url: '/nicknames/check',
        type: 'post',
        data: {'nickname': nickname},
        dataType: 'json'
      }).done(function (data) {
        view.$el.find('.nickname-status').html("<span class='success'>nickname is available</span>")
        view.$el.find('button').prop('disabled', false)
      }).fail(function (data) {
        view.$el.find('.nickname-status').html("<span class='error'>nickname is already in use</span>")
        view.$el.find('button').prop('disabled', true)
      })
    },

    render: function () {
      var view = this
      var template = Handlebars.compile($('#sign-up-template').html())

      this.$el.empty()

      this.$el.html(template())
      $('.signin-link').removeClass('current-login-choice')
      $('.signup-link').addClass('current-login-choice')

      return this
    },

    signUp: function () {
      var view = this
      var password = this.$el.find('#password-input').val()
      var passwordConfirm = this.$el.find('#password-confirm').val()

      if (password === passwordConfirm) {
        var u = new app.User()
        u.set({
          'nickname': this.$el.find('.signup-nickname-input').val(),
          'password': this.$el.find('#password-input').val()
        })
        u.save(u.attributes, {
          success: function () {
            window.location.pathname = '/channels/itp'
          },
          error: function () {
            view.$el.prepend('Uhoh, something went wrong')
          }
        })
      } else {
        this.$el.find('.password-status').html('Your passwords do not match')
      }

      return false
    }
  })

  this.app = window.app != null ? window.app : {}
  this.app.SignUpView = SignUpView
})
