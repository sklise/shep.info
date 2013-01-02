$(document).ready(function () {
  app = window.app != null ? window.app : {}
  app.router = new app.ChannelRouter
  Backbone.history.start({pushState:true})
});