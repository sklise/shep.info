(function() {
  var app, ejs, everyone, express, helpers, http, irc, ircBridge, ircConnections, ircHost, ircNick, logAndForward, logMessage, mustache, nowjs, port, querystring, redis;

  require('coffee-script');

  http = require('http');

  querystring = require('querystring');

  nowjs = require('now');

  express = require('express');

  irc = require('irc');

  mustache = require('mustache');

  ejs = require('ejs');

  redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379');

  helpers = require('./lib/server/helpers');

  ircConnections = {};

  ircHost = process.env.ITPIRL_IRC_HOST || 'irc.freenode.net';

  ircBridge = (function() {

    function ircBridge(name, callback) {
      var _this = this;
      this.name = name;
      this.client = new irc.Client(ircHost, this.name, {
        channels: ['#itp'],
        port: process.env.ITPIRL_IRC_PORT || 6667,
        autoConnect: true
      });
      this.client.addListener('pm', function(from, message) {
        return console.log("PRIVATE MESSAGE FROM: " + from + ":", message);
      });
      this.client.addListener('error', function(message) {
        return console.log("ERROR:", message);
      });
      this.client.addListener('notice', function(nick, to, text, message) {
        return console.log("NOTICE: " + nick + ": " + to + " : " + text + " : " + message);
      });
      this.client.addListener('names', function(channel, nicks) {
        return callback(_this.client.nick);
      });
    }

    return ircBridge;

  })();

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

  logAndForward = function(sender, message, destination, callback) {
    var timestamp;
    if (destination == null) {
      destination = {
        'room': 'itp'
      };
    }
    timestamp = Date.now();
    logMessage(timestamp, sender, message);
    return callback(timestamp, sender, message);
  };

  everyone.now.distributeChatMessage = function(sender, message, destination) {
    if (destination == null) {
      destination = {
        'room': 'itp'
      };
    }
    ircConnections[this.user.clientId].client.say("#" + destination.room, message);
    return this.now.serverChangedName(ircConnections[this.user.clientId].client.nick);
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
    ircConnections[this.user.clientId].client.nick = newNick;
    return ircConnections[this.user.clientId].client.send("NICK " + newNick);
  };

  nowjs.on('connect', function() {
    var myNow, room;
    myNow = this.now;
    ircConnections[this.user.clientId] = new ircBridge(this.now.name, function(name) {
      myNow.name = name;
      return myNow.serverChangedName(name);
    });
    logAndForward('Join', "" + this.now.name + " has joined the chat.", {
      'room': 'itp'
    }, everyone.now.receiveSystemMessage);
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
    ircConnections[this.user.clientId].client.disconnect('seeya');
    return logAndForward('Leave', "" + this.now.name + " has left the chat.", {
      'room': 'itp'
    }, everyone.now.receiveSystemMessage);
  });

  ircNick = process.env.ITPIRL_IRC_NICK || 'itpirl_server';

  everyone.ircClient = new irc.Client(ircHost, ircNick, {
    channels: ['#itp'],
    port: process.env.ITPIRL_IRC_PORT || 6667,
    autoConnect: true
  });

  everyone.ircClient.addListener('nick', function(oldnick, newnick, channels, message) {
    return logAndForward('NICK', "" + oldnick + " is now known as " + newnick, {
      'room': 'itp'
    }, everyone.now.receiveSystemMessage);
  });

  everyone.ircClient.addListener('notice', function(nick, to, text, message) {
    return console.log("System Notice", "" + nick + ": " + to + " : " + text + " : " + message);
  });

  everyone.ircClient.addListener('message#itp', function(from, message) {
    return logAndForward(from, message, {
      'room': 'itp'
    }, everyone.now.receiveChatMessage);
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

}).call(this);
