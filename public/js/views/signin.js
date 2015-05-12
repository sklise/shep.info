$(document).ready(function () {
  var SignInView = Backbone.View.extend({
    el: '#login-panel',

    initialize: function () {
      this.render().el
    },

    render: function () {
      var view = this
      var template = Handlebars.compile($('#sign-in-template').html())

      this.$el.empty()

      this.$el.html(template())
      $('.signin-link').addClass('current-login-choice')
      $('.signup-link').removeClass('current-login-choice')

      return this
    }
  })

  this.app = window.app != null ? window.app : {}
  this.app.SignInView = SignInView
})
