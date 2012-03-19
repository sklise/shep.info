jQuery ->
  _.templateSettings = {
      interpolate : /\{\{([\s\S]+?)\}\}/g
  }
  
  class AppView extends Backbone.View
    el: '#content'
    initialize: (options) ->
      @collection.bind 'reset', @render, @
      @messagesview = new MessagesView collection: @collection
      @eventsview = new EventsView collection: @collection
    render: ->
      $(@el).find('#event-window').append @eventsview.render().el
      @messagesview.render().el
  
  # Chat Message
  #___________________________________________________
  class MessageView extends Backbone.View
    className: 'message'
    tagName: 'li'
    template: ($('#message-template').html())
    render: ->
      $(@el).html Mustache.render(@template, @model.toJSON())
      @
  
  # Chat Window
  #___________________________________________________
  class MessagesView extends Backbone.View
    el: '#chat-window'
    template: ($('#messages-template').html())
    render: ->
      $(@el).append Mustache.render(@template)
      windowHeight = $(window).height()
      headerHeight = $('#header-container').height()
      $(@el).css('height', windowHeight - headerHeight)
      chatWindowHeight = windowHeight - headerHeight
      chatInterior = chatWindowHeight - $('#new-message').height()
      $('#chat-log-container').height(chatInterior)
      $('#chat-log').css('min-height', chatInterior)
      @
  
  # Events Roll
  #___________________________________________________
  class EventsView extends Backbone.View
    id: 'event-feed'
    tagName: 'ul'
    template: ($ '#events-template').html()
    render: ->
      $(@el).empty()
      for event in @collection.models
        eventView = new EventView model: event
        $(@el).append(eventView.render().el)
      windowHeight = $(window).height()
      headerHeight = $('#header-container').height()
      $(@el).css('height', windowHeight - headerHeight)
      eventWindow = windowHeight - headerHeight
      $('#event-window').height(eventWindow)
      @

  # Event Date
  #___________________________________________________
  class EventDateView extends Backbone.View
    tagName: 'li'
    className: 'event-date'
    template: ($ '#event-date').html()
    render: ->
      $(@el).html Mustache.render(@template, @model.toJSON())
      @


  # Event View
  #___________________________________________________
  class EventView extends Backbone.View
    className: 'event'
    tagName: 'li'
    template: ($ '#event-template').html()
    events:
      'click' : 'toggleExpanded'
    render: ->
      $(@el).html Mustache.render(@template, @model.toJSON())
      @
    toggleExpanded: ->
      # I don't like how this is working currently. When you click on the link
      # for Google Calendar it toggles. Also clicking this one doesn't close
      # the rest.
      @$('.details').toggle()

  @app = window.app ? {}
  @app.AppView = AppView