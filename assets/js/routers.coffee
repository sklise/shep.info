jQuery ->
  class ChannelRouter extends Backbone.Router
    routes:
      '' : 'mainChannel'
      'shep' : 'talkToShep'
      'channels/:channel' : 'show'
    initialize: ->
      (@view = new app.AppView).render().el
      app.Helpers.fitHeight()
      app.Messages.bind 'change:channel', @changeChannel, @
    changeChannel: ->
      Backbone.history.navigate "channels/#{app.Messages.channel}"
    mainChannel: ->
      app.Messages.setChannel('itp')
      Backbone.history.navigate "channels/itp", true
    show: (channel)->
      app.Messages.setChannel(channel)

  @app = window.app ? {}
  @app.ChannelRouter = ChannelRouter