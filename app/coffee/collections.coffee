class Events extends Backbone.Collection
  model: app.Event
  url: 'http://l:9292/calendar/week?callback=?'
  
@app = window.app ? {}
@app.Events = new Events