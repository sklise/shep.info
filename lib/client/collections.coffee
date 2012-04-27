class Messages extends Backbone.Collection
  model: app.Message

class Users extends Backbone.Collection
  model: app.User

@app = window.app ? {}
@app.Messages = new Messages
@app.Users = new Users