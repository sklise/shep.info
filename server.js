(function() {
  var app, everyone, express, nowjs, port;

  nowjs = require('now');

  express = require('express');

  app = express.createServer(express.logger());

  app.configure(function() {
    return app.use(express.static(__dirname + '/public'));
  });

  everyone = nowjs.initialize(app);

  everyone.now.distributeMessage = function(message) {
    everyone.now.receiveMessage(this.now.name, message);
    return false;
  };

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Listening on " + port);
  });

}).call(this);
