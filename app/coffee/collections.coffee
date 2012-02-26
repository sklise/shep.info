class Events extends Backbone.Collection
  model: App.Event
  url: 'http://l:9292/calendar/today?callback=?'
  
@App = window.App ? {}
@App.Events = new Events