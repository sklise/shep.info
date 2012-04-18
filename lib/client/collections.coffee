class Messages extends Backbone.Collection
  model: app.Message

@app = window.app ? {}
@app.Messages = new Messages