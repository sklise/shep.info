(function() {
  var app, ejs, everyone, express, helpers, http, irc, ircConnections, ircHost, ircNick, logMessage, mustache, nowjs, port, querystring, redis;

  http = require('http');

  querystring = require('querystring');

  nowjs = require('now');

  express = require('express');

  irc = require('irc');

  mustache = require('mustache');

  ejs = require('ejs');

  redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379');

  helpers = require('./helpers.js');

  ircConnections = {};

  app = express.createServer(express.logger());

  app.configure(function() {
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    return app.register(".mustache", helpers.mustache_template);
  });

  app.get('/', function(request, response) {
    return response.render('index.ejs');
  });

  app.get('/help', function(request, response) {
    return response.send('Hello World');
  });

  app.post('/feedback/new', function(request, response) {
    logMessage(request.body.name, request.body.message, Date.now(), 'itpirl-feedback');
    return response.send('{sucess:hopefully}');
  });

  everyone = nowjs.initialize(app, {
    socketio: {
      transports: ['xhr-polling', 'jsonp-polling']
    }
  });

  logMessage = function(timestamp, sender, message, destination) {
    if (destination == null) {
      destination = {
        'room': 'itp'
      };
    }
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
  };

  everyone.now.distributeChatMessage = function(sender, message, destination) {
    var timestamp;
    if (destination == null) {
      destination = {
        'room': 'itp'
      };
    }
    ircConnections[this.user.clientId].say("#" + destination.room, message);
    timestamp = helpers.setTimestamp();
    return logMessage(timestamp, sender, message, destination);
  };

  everyone.now.distributeSystemMessage = function(type, message, destination) {
    var timestamp;
    if (destination == null) {
      destination = {
        'room': 'itp'
      };
    }
    timestamp = helpers.setTimestamp();
    logMessage(timestamp, type, message, destination);
    return everyone.now.receiveSystemMessage(timestamp, type, message);
  };

  everyone.now.getUserList = function() {
    everyone.now.userList = [];
    return everyone.getUsers(function(users) {
      var user, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = users.length; _i < _len; _i++) {
        user = users[_i];
        _results.push(nowjs.getClient(user, function() {
          return everyone.now.addUserToList(this.now.name);
        }));
      }
      return _results;
    });
  };

  everyone.now.changeNick = function(oldNick, newNick) {
    var destination, message, timestamp, type;
    destination = {
      'room': 'itp'
    };
    type = 'NICK';
    message = "" + oldNick + " is now known as " + newNick;
    timestamp = helpers.setTimestamp();
    logMessage(timestamp, type, message, destination);
    everyone.now.receiveSystemMessage(timestamp, type, message);
    return ircConnections[this.user.clientId].send("NICK " + newNick);
  };

  nowjs.on('connect', function() {
    var myNow, room, timestamp;
    ircConnections[this.user.clientId] = new irc.Client('irc.freenode.net', this.now.name, {
      channels: ['#itp'],
      port: 6667
    });
    ircConnections[this.user.clientId].connect;
    timestamp = Date.now();
    logMessage(timestamp, 'Join', "" + this.now.name + " has joined the chat.");
    everyone.now.receiveSystemMessage(timestamp, 'Join', "" + this.now.name + " has joined the chat.");
    myNow = this.now;
    room = 'itp';
    return redis.llen('messages:' + room, function(err, length) {
      var end, start;
      start = length - 10;
      end = length - 1;
      return redis.lrange('messages:' + room, start, end, function(err, obj) {
        var m, message, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = obj.length; _i < _len; _i++) {
          message = obj[_i];
          m = JSON.parse(message);
          _results.push(myNow.receivePreviousMessage(m.timestamp, m.sender, m.message));
        }
        return _results;
      });
    });
  });

  nowjs.on('disconnect', function() {
    var timestamp;
    ircConnections[this.user.clientId].disconnect('seeya');
    timestamp = Date.now();
    logMessage(timestamp, 'Leave', "" + this.now.name + " has left the chat.");
    return everyone.now.receiveSystemMessage(timestamp, 'Leave', "" + this.now.name + " has left the chat.");
  });

  ircHost = 'irc.freenode.net';

  ircNick = process.env.ITPIRL_IRC_NICK || 'itpanon';

  everyone.ircClient = new irc.Client(ircHost, ircNick, {
    channels: ['#itp'],
    port: 6667,
    autoConnect: true
  });

  everyone.ircClient.addListener('message#itp', function(from, message) {
    var timestamp;
    timestamp = Date.now();
    logMessage(timestamp, from, message, {
      'room': 'itp'
    });
    return everyone.now.receiveChatMessage(timestamp, from, message, {
      'room': 'itp'
    });
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

}).call(this);
