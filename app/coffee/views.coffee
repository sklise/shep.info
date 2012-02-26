jQuery ->
  class EventView extends Backbone.View
    tagName: 'li'
    template: Mustache.template($('#event-template').html())
    render: ->
      event = @model.toJSON()
      event.where = event.where ? ""
      event.link = event.link ? ""
      $(@el).html @template(event)
      $('#event-window').prepend $(@el)
      @
  
  @App = window.App ? {}
  @App.EventView = EventView