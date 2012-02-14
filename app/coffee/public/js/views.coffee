jQuery ->
  _.templateSettings = {
      interpolate : /\{\{([\s\S]+?)\}\}/g
  }


  class EventView extends Backbone.View
    tagName: 'li'
    template: _.template($('#event-template').html())
    render: ->
      event = @model.toJSON()
      event.where = event.where ? ""
      event.link = event.link ? ""
      $(@el).html @template(event)
      $('#event-window').prepend $(@el)
      @
  
  @App = window.App ? {}
  @App.EventView = EventView