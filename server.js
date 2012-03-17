(function() {
  var app, everyone, express, irc, mustache, mustache_template, nowjs, port;

  nowjs = require('now');

  express = require('express');

  irc = require('irc');

  mustache = require('mustache');

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

  everyone = nowjs.initialize(app, {
    socketio: {
      transports: ['xhr-polling', 'jsonp-polling']
    }
  });

  everyone.now.distributeMessage = function(message) {
    console.log(message);
    return everyone.now.receiveMessage(this.now.name, message);
  };

  app.get('/', function(request, response) {
    return response.render('index.mustache', {
      layout: false
    });
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

}).call(this);
