class Message extends Backbone.Model
  # Types: Chat, Shep, System, Self, Transcript, Consecutive
  defaults:
    type: 'Chat'
  initialize: (attributes, options) ->

@app = window.app ? {}
@app.Message = Message