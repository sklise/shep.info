class Message extends Backbone.Model

class Event extends Backbone.Model  
  initialize: (attributes, options) ->
    @parseTime @get('start'), @get('end')
  toAMPM: (hours, minutes) ->
    minutesOut = (if parseInt(minutes) > 0 then ":" + minutes else "")

    if parseInt(hours) > 12
      parseInt(hours)-12 + minutesOut + "p"
    else
      parseInt(hours) + minutesOut + "a"
  parseTime: (rawStart, rawEnd) ->
    pattern = ///
      ([0-9]{4}-[0-9]{2}-[0-9]{2})      # Title
      T # divider between date and time
      ([0-9]+) # Hours
      :
      ([0-9]+) # Minutes
      :[0-9]+[^-] # Seconds don't matter, everyone will be late anyways.
      # (.*$) # TimeZone
    ///
    startResult = rawStart.match pattern
    console.log startResult
    endResult = rawEnd.match pattern
    if startResult
      @set startDate:startResult[1]
      @set startTime:@toAMPM(startResult[2], startResult[3])
    else
      @set allDay:true

    if endResult
      @set endDate:endResult[1]
      @set endTime:@toAMPM(endResult[2], endResult[3])
    else
      @set allDay:true
@app = window.app ? {}
@app.Event = Event
@app.Message = Message