class Messages extends Backbone.Collection
  model: app.Message
  channel: (channelName) ->
    messages = @filter (message) ->
      message.get('channel') is channelName
    _.sortBy messages, (message) ->
      message.get('time')

class Users extends Backbone.Collection
  model: app.User

@app = window.app ? {}
@app.Messages = new Messages
@app.Users = new Users