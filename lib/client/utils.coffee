Helpers =
  # Convert a timestamp into a readable time.
  formatTime: (timestamp) ->
    time = new Date(timestamp)
    hours = time.getHours()
    minutes = time.getMinutes()
    marker = if hours >= 12 then 'P' else 'A'
    minutes = if minutes > 9 then minutes else '0' + minutes
    hours = if hours > 12 then hours - 12 else hours
    "#{hours}:#{minutes}#{marker}"

@app = window.app ? {}
@app.Helpers = Helpers
