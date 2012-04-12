(function() {
  var RedisStore, app, ejs, everyone, express, http, irc, ircBridge, ircConnections, ircHost, ircNick, logging, mustache, mustache_template, nowjs, port, querystring, redis, redisUrl;

  require('coffee-script');

  http = require('http');

  querystring = require('querystring');

  nowjs = require('now');

  express = require('express');

  irc = require('irc');

  mustache = require('mustache');

  ejs = require('ejs');

  RedisStore = require('connect-redis')(express);

  redisUrl = require('url').parse(process.env.REDISTOGO_URL || 'redis://localhost:6379');

  redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379');

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

  mustache_template = {
    compile: function(source, options) {
      if (typeof source === 'string') {
        return function(options) {
          options.locals = options.locals || {};
          options.partials = options.partials || {};
          if (options.body) locals.body = options.body;
          return mustache.to_html(source, options.locals, options.partials);
        };
      } else {
        return source;
      }
    },
    render: function(template, options) {
      template = this.compile(template, options);
      return template(options);
    }
  };

  app = express.createServer(express.logger());

  app.configure(function() {
    var _ref;
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
      secret: "lkashjgfekfleljfkjwjekfwekf",
      store: new RedisStore({
        port: redisUrl.port,
        host: redisUrl.hostname,
        pass: (_ref = redisUrl.auth) != null ? _ref.split(":")[1] : void 0
      })
    }));
    app.register(".mustache", mustache_template);
  });

  logging = require('./lib/server/logging')(app);

  require('./lib/server/helpers')(app);

  app.get('/', function(request, response) {
    return response.render('index.ejs');
  });

  app.get('/help', function(request, response) {
    return response.send('Hello World');
  });

  everyone = nowjs.initialize(app, {
    socketio: {
      transports: ['xhr-polling', 'jsonp-polling']
    }
  });

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
    if (destination == null) {
      destination = {
        'room': 'itp'
      };
    }
    logging.logMessage(type, message, destination);
    return everyone.now.receiveSystemMessage(Date.now(), type, message);
  };

  everyone.now.logFeedback = function(sender, message) {
    return logging.logMessage(sender, message, {
      room: 'itpirl-feedback'
    });
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
    logging.logAndForward('Join', "" + this.now.name + " has joined the chat.", {
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
    return logging.logAndForward('Leave', "" + this.now.name + " has left the chat.", {
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
    return logging.logAndForward('NICK', "" + oldnick + " is now known as " + newnick, {
      'room': 'itp'
    }, everyone.now.receiveSystemMessage);
  });

  everyone.ircClient.addListener('notice', function(nick, to, text, message) {
    return console.log("System Notice", "" + nick + ": " + to + " : " + text + " : " + message);
  });

  everyone.ircClient.addListener('message#itp', function(from, message) {
    return logging.logAndForward(from, message, {
      'room': 'itp'
    }, everyone.now.receiveChatMessage);
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

}).call(this);
