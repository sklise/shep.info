$(document).ready(function () {
  app = window.app != null ? window.app : {}

  if (window.location.pathname === '/' || window.location.pathname === "/auth/login") {
    var lv = new app.LoginView();
  } else {
    app.router = new app.ChannelRouter
    Backbone.history.start({pushState:true})
  }
});