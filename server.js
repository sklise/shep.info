(function() {
  var app, ejs, everyone, express, irc, ircHost, ircNick, mustache, mustache_template, nowjs, port, redis;

  nowjs = require('now');

  express = require('express');

  irc = require('irc');

  mustache = require('mustache');

  ejs = require('ejs');

  redis = require('redis-url').connect(process.env.REDISTOGO_URL || 'redis://localhost:6379');

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
    return app.register(".mustache", mustache_template);
  });

  app.get('/', function(request, response) {
    return response.render('index.ejs');
  });

  app.get('/help', function(request, response) {
    console.log('here');
    return response.send('Hello World');
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
    userName: process.env.ITP_IRL_USERNAME || 'itpanon',
    password: process.env.ITPIRL_IRC_PASSWORD || ''
  });

  everyone.now.distributeMessage = function(message) {
    everyone.ircClient.say('#itp', message);
    return everyone.now.receiveMessage(this.now.name, message);
  };

  everyone.ircClient.addListener('message#itp', function(from, message) {
    console.log("" + from + ":" + message);
    return everyone.now.receiveMessage(from, message);
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

}).call(this);
