(function() {
  var app, ejs, everyone, express, http, irc, ircHost, ircNick, logMessage, mustache, mustache_template, nowjs, port, querystring;

  http = require('http');

  querystring = require('querystring');

  nowjs = require('now');

  express = require('express');

  irc = require('irc');

  mustache = require('mustache');

  ejs = require('ejs');

  logMessage = function(name, message, project) {
    var options, post, post_req, response;
    if (project == null) project = 'itpirl';
    console.log(name, message);
    response = '';
    post = {
      domain: 'www.itpcakemix.com',
      port: 80,
      path: '/add',
      data: querystring.stringify({
        user: 'shep',
        project: project,
        name: name,
        message: message
      })
    };
    options = {
      host: post.domain,
      port: post.port,
      path: post.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': post.data.length
      }
    };
    post_req = http.request(options, function(res) {
      res.setEncoding('utf8');
      return res.on('data', function(chunk) {
        return response += chunk;
      });
    });
    post_req.write(post.data);
    post_req.end();
    return response;
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
    console.log('here');
    return response.send('Hello World');
  });

  app.post('/feedback/new', function(request, response) {
    logMessage(request.body.name, request.body.message, 'itpirl-feedback');
    return response.send('{sucess:hopefully}');
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
    port: process.env.ITPIRL_IRC_PORT || 6667
  });

  everyone.now.distributeMessage = function(message, name) {
    if (name == null) name = this.now.name;
    logMessage(name, message);
    everyone.ircClient.say('#itp', message);
    return everyone.now.receiveMessage(name, message);
  };

  everyone.now.userList = [];

  everyone.makeUserList = function() {
    everyone.now.userList = [];
    return everyone.getUsers(function(users) {
      var user, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = users.length; _i < _len; _i++) {
        user = users[_i];
        _results.push(nowjs.getClient(user, function() {
          console.log(this.now.name);
          return everyone.now.userList.push(this.now.name);
        }));
      }
      return _results;
    });
  };

  everyone.on('connect', function() {
    console.log("" + this.now.name + " connected");
    everyone.makeUserList();
    return everyone.now.receiveMessage('Join ', "" + this.now.name + " has joined the chat.");
  });

  everyone.on('disconnect', function() {
    console.log("" + this.now.name + " disconnected");
    everyone.makeUserList();
    return everyone.now.receiveMessage('Leave ', "" + this.now.name + " has left the chat.");
  });

  everyone.ircClient.addListener('join', function(from, message) {});

  everyone.ircClient.addListener('notice', function(from, message) {
    return console.log("NOTICE: " + from + " : " + message);
  });

  everyone.ircClient.addListener('message#itp', function(from, message) {
    logMessage(from, message);
    return everyone.now.receiveMessage(from, message);
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

}).call(this);
