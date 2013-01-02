Handlebars.registerHelper('dateString', function (date) {
  var d = new Date(date)
  return (d.getMonth() + 1) + "/" + pad(d.getDate()) + " " + hours(d.getHours()) + ":" + pad(d.getMinutes())
});

Handlebars.registerHelper('timeString', function (timestamp) {
  var d = new Date(timestamp)
  return hours(d.getHours()) + ":" + pad(d.getMinutes())
})

$(document).ready(function () {
  app = window.app != null ? window.app : {}
  app.router = new app.ChannelRouter
  Backbone.history.start({pushState:true})
});