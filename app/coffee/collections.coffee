class Events extends Backbone.Collection
  model: app.Event
  url: 'http://128.122.151.157:9292/calendar/week?callback=?'

class Messages extends Backbone.Collection
  model: app.Message

@app = window.app ? {}
@app.Events = new Events
@app.Messages = new Messages