@app = window.app ? {}

jQuery ->
  # @app.router = new app.ChannelRouter
  # Backbone.history.start({pushState:true})

  (new app.AppView).render().el
  