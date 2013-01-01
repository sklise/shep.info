(function() {
  var logging = function(app) {
    var redis;
    redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379');
    return {
      logMessage: function(sender, message, destination) {
        var timestamp;
        if (destination == null) {
          destination = {
            'room': 'itp'
          };
        }
        timestamp = Date.now();
        return redis.incr('nextId', function(err, id) {
          var newMessage;
          newMessage = {
            id: id,
            sender: sender,
            message: message,
            destination: destination,
            timestamp: timestamp
          };
          return redis.rpush('messages:' + destination.room, JSON.stringify(newMessage));
        });
      },

      logAndForward: function(sender, message, destination, callback) {
        var timestamp;
        if (destination == null) {
          destination = {
            'room': 'itp'
          };
        }
        timestamp = Date.now();
        this.logMessage(sender, message, destination);
        return callback(timestamp, sender, message, destination.room);
      }
    };
  };

  module.exports = logging;

}).call(this);
