(function () {
  var Event = Backbone.Model.extend({});

  var Events = Backbone.Collection.extend({
    model: Event
  });
}).call(this);

insertAgenda = function (data) {
  window.entries = data['feed']['entry'];
}

var insertCalendar = function () {
  var templateSource = $('#calendar-event-template').html();
  var template = Handlebars.compile(templateSource);
  window.entries.forEach(function (entry) {
    var event = {
      link: entry['link'][0]['href'],
      start: entry['gd$when'][0]['startTime'],
      end: entry['gd$when'][0]['endTime'],
      title: entry['title']['$t'].trim()
    }
    $('#calendar ul').append(template(event));
  });
}

var pad = function (number) {
  return (number < 10) ? '0' + number : number
}

var hours = function (hour) {
  return (hour <= 12) ? hour : hour - 12
}

jQuery(function () {
  insertCalendar()
});