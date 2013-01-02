//= require vendor/jquery.min
//= require vendor/underscore
//= require vendor/backbone
//= require vendor/handlebars
//= require helpers
//= require models
//= require collections
//= require routers
//= require_tree ./views
//= require_tree .
//= require calendar

$(document).ready(function () {
  app = window.app != null ? window.app : {}
  app.router = new app.ChannelRouter
  Backbone.history.start({pushState:true})
});