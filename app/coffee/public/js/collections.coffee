class Events extends Backbone.Collection
  model: App.Event
  url: 'http://ilc.itpirl.com/calendar/student'
  
@App = window.App ? {}
@App.Events = new Events