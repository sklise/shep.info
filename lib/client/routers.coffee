jQuery ->
  class ChannelRouter extends Backbone.Router
    routes:
      '' : 'mainChannel'
      'shep' : 'talkToShep'
      'channels/:channel' : 'show'
    initialize: ->
      @view = new app.AppView collection: app.Chats
    mainChannel: ->
    show: ->
    talkToShep: ->