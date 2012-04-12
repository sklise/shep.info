logging = (app) ->

  redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379')

  ##### LogMessage
  logMessage: (sender, message, destination={'room':'itp'}) ->
    timestamp = Date.now()
    redis.incr 'nextId', (err,id) ->
      newMessage = { id, sender, message, destination, timestamp }
      redis.rpush 'messages:'+destination.room, JSON.stringify(newMessage)
  ##### Log and Forward
  # Log a message and send it out via a Now.js function. I found myself writing
  # these three lines often and got tired of it.
  logAndForward: (sender, message, destination={'room':'itp'}, callback) ->
    timestamp = Date.now()
    @logMessage timestamp, sender, message
    callback(timestamp, sender, message)

module.exports = logging