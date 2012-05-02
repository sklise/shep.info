class Message extends Backbone.Model
  # Types: Chat, Shep, System, Self, Transcript, Consecutive
  defaults:
    type: 'Chat'
  initialize: (attributes, options) ->

class User extends Backbone.Model

class Channel extends Backbone.Model

@app = window.app ? {}
@app.Message = Message
@app.User = User
@app.Channel = Channel