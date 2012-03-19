(function() {
  var app, ejs, everyone, express, http, irc, ircHost, ircNick, logMessage, mustache, mustache_template, nowjs, port, querystring, redis;

  http = require('http');

  querystring = require('querystring');

  nowjs = require('now');

  express = require('express');

  irc = require('irc');

  mustache = require('mustache');

  ejs = require('ejs');

  redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379');

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
    return response.send('hi');
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

  everyone.now.distributeMessage = function(message) {
    var clientId;
    clientId = '';
    everyone.getUsers(function(users) {});
    console.log(logMessage(this.now.name, message));
    everyone.ircClient.say('#itp', message);
    return everyone.now.receiveMessage(this.now.name, message);
  };

  everyone.ircClient.addListener('message#itp', function(from, message) {
    logMessage(from, message);
    return everyone.now.receiveMessage(from, message);
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

}).call(this);
