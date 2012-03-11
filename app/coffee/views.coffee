jQuery ->
  _.templateSettings = {
      interpolate : /\{\{([\s\S]+?)\}\}/g
  }
  
  class AppView extends Backbone.View
    el: '#content'
    initialize: (options) ->
      @collection.bind 'reset', @render, @
      @eventview = new EventsView collection: @collection
    render: ->
      $(@el).find('#event-window').append @eventview.render().el
  
  class EventsView extends Backbone.View
    id: 'event-feed'
    tagName: 'ul'
    template: ($('#events-template').html())
    render: ->
      $(@el).empty()
      for event in @collection.models
        eventView = new EventView model: event
        $(@el).append(eventView.render().el)
      @

  class EventView extends Backbone.View
    className: 'event'
    tagName: 'li'
    template: $('#event-template').html()
    events:
      'click' : 'toggleExpanded'
    render: ->
      console.log @model.toJSON()
      
      $(@el).html Mustache.render(@template, @model.toJSON())
      @
    toggleExpanded: ->
      @$('.details').toggle()

  @app = window.app ? {}
  @app.AppView = AppView