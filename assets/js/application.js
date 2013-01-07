//= require vendor/jquery.min
//= require vendor/underscore
//= require vendor/backbone
//= require vendor/handlebars
//= require helpers
//= require models
//= require collections
//= require views/appview.js
//= require views/channelview.js
//= require views/menuview.js
//= require views/feedbackview.js
//= require routers
//= require calendar

$(document).ready(function () {
  app = window.app != null ? window.app : {}
  app.router = new app.ChannelRouter
  Backbone.history.start({pushState:true})
});