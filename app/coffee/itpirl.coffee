@app = window.app ? {}

jQuery ->
  new app.AppView collection: app.Events
  app.Events.fetch()