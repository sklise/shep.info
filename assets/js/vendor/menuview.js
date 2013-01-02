$(document).ready(function () {
  var MenuView = Backbone.View.extend({
    el: '#chat-menu',
    templateSource: $('#menu-template').html(),

    initialize: function (options) {
      this.collection.bind('change:channel', this.render, this)
    },

    render: function () {
      var template = Handlebars.compile(this.templateSource);

      this.$el.empty();

      this.$el.html(template({channels:this.collection.toJSON()}));

      return this;
    }
  });

  this.app = window.app != null ? window.app : {}
  this.app.MenuView = MenuView;
});