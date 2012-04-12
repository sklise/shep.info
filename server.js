(function() {
  var RedisStore, app, ejs, express, http, logging, mustache, mustache_template, port, querystring, redisUrl;

  require('coffee-script');

  http = require('http');

  querystring = require('querystring');

  express = require('express');

  mustache = require('mustache');

  ejs = require('ejs');

  RedisStore = require('connect-redis')(express);

  redisUrl = require('url').parse(process.env.REDISTOGO_URL || 'redis://localhost:6379');

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

  require('./lib/server/now-shep')(app, logging);

  app.get('/', function(request, response) {
    return response.render('index.ejs');
  });

  app.get('/help', function(request, response) {
    return response.send('Hello World');
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

}).call(this);
