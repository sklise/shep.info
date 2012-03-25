(function() {
  var app, ejs, everyone, express, http, irc, ircHost, ircNick, logMessage, mustache, mustache_template, nowjs, port, querystring, redis, _;

  http = require('http');

  querystring = require('querystring');

  nowjs = require('now');

  express = require('express');

  irc = require('irc');

  mustache = require('mustache');

  ejs = require('ejs');

  redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379');

  _ = require('underscore');

  logMessage = function(name, message, room) {
    if (room == null) room = 'itp';
    return redis.incr('nextId', function(err, id) {
      var newMessage;
      newMessage = {
        id: id,
        name: name,
        message: message,
        created_at: Date.now()
      };
      return redis.rpush('messages:' + room, JSON.stringify(newMessage));
    });
  };

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
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
    return app.register(".mustache", mustache_template);
  });

  app.get('/', function(request, response) {
    return response.render('index.ejs');
  });

  app.get('/help', function(request, response) {
    return response.send('Hello World');
  });

  app.post('/feedback/new', function(request, response) {
    logMessage(request.body.name, request.body.message, 'itpirl-feedback');
    return response.send('{sucess:hopefully}');
  });

  app.get('/messages/recent', function(request, response) {
    //var recentMessages;
    //recentMessages = function(num, room) {
      var num, room;
      if (num == null) num = 10;
      if (room == null) room = "itp";
      
      console.log('here');
      //return redis.llen('messages:' + room, function(err, length) {
        var end, start;
        var length = 100;
        start = length - num;
        end = length - 1;
        redis.lrange('messages:' + room, start, end, function(err, obj) {
          var message, messages, _i, _len;
          messages = [];
          for (_i = 0, _len = obj.length; _i < _len; _i++) {
            message = obj[_i];
            console.log('idiot',message);
            messages.push(JSON.stringify(message));
          }
          console.log('hi', messages);
          return response.send("hi");
        });
        
        
        
        //});
    //};
    
  });

  everyone = nowjs.initialize(app, {
    socketio: {
      transports: ['xhr-polling', 'jsonp-polling']
    }
  });

  ircHost = process.env.ITPIRL_IRC_HOST || 'irc.freenode.net';

  ircNick = process.env.ITPIRL_IRC_NICK || 'itpanon';

  everyone.ircClient = new irc.Client(ircHost, ircNick, {
    channels: ['#itp'],
    port: process.env.ITPIRL_IRC_PORT || 6667,
    userName: process.env.ITPIRL_IRC_USERNAME || 'itpanon',
    password: process.env.ITPIRL_IRC_PASSWORD || ''
  });

  everyone.now.distributeMessage = function(message, name) {
    if (name == null) name = this.now.name;
    logMessage(name, message);
    if (name === 'Nickname') everyone.makeUserList();
    everyone.ircClient.say('#itp', message);
    return everyone.now.receiveMessage(name, message);
  };

  everyone.makeUserList = function() {
    everyone.now.userList = [];
    return everyone.getUsers(function(users) {
      var user, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = users.length; _i < _len; _i++) {
        user = users[_i];
        _results.push(nowjs.getClient(user, function() {
          return everyone.now.userList.push(this.now.name);
        }));
      }
      return _results;
    });
  };

  everyone.on('connect', function() {
    var from, message;
    everyone.makeUserList();
    from = "Join";
    message = "" + this.now.name + " has joined the chat.";
    logMessage(from, message);
    return everyone.now.receiveMessage(from + ' ', message);
  });

  everyone.on('disconnect', function() {
    var from, message;
    everyone.makeUserList();
    from = "Leave";
    message = "" + this.now.name + " has left the chat.";
    logMessage(from, message);
    return everyone.now.receiveMessage(from, message);
  });

  everyone.ircClient.addListener('message#itp', function(from, message) {
    logMessage(from, message);
    return everyone.now.receiveMessage(from + ' ', message);
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

}).call(this);
