#= require jquery.min
#= require underscore-min
#= require backbone-min
#= require ui
#= require mustache
#= require helpers
#= require models
#= require collections
#= require views
#= require routers

jQuery ->
  @app = window.app ? {}
  @app.router = new app.ChannelRouter
  Backbone.history.start({pushState:true})