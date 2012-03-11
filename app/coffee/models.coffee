class Event extends Backbone.Model  
  initialize: (attributes, options) ->
    @parseTime @get('start'), @get('end')
  toAMPM: (hours, minutes) ->
    if parseInt(hours) > 12
      parseInt(hours)-12 + ":" + minutes + "p"
    else
      parseInt(hours) + ":" + minutes + "a"
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
      @set
    if endResult
      @set endDate:endResult[1]
      @set endTime:@toAMPM(endResult[2], endResult[3])
@app = window.app ? {}
@app.Event = Event