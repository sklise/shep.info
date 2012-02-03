var express = require('express');

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
  response.send('Welcome. This is the internet. This is ITPIRL.')
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});