class Messages extends Backbone.Collection
  model: app.Message
  initialize: (options) ->
    @channel = 'itp'
  setChannel: (channelName) ->
    @channel = channelName
    @trigger 'change:channel'
  thisChannel: ->
    messages = @filter (message) =>
      message.get('channel') is @channel
    _.sortBy messages, (message) =>
      message.get('time')

class Users extends Backbone.Collection
  model: app.User

class Channels extends Backbone.Collection
  models: app.Channel

@app = window.app ? {}
@app.Messages = new Messages
@app.Users = new Users
@app.Channels = new Channels