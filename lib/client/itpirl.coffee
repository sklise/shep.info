jQuery ->
  @app = window.app ? {}
  # @app.router = new app.ChannelRouter
  # Backbone.history.start({pushState:true})

  @app.router = new app.ChannelRouter
  Backbone.history.start({pushState:true})

  # (new app.AppView).render().el
  