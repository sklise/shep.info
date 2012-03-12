# Require libs.
nowjs = require 'now'
express = require 'express'
io.configure ->
  io.set("transports", ["xhr-polling"])
  io.set("polling duration", 10)
app = express.createServer(express.logger())

app.configure ->
  # Setup static file server
  app.use express.static(__dirname + '/public')

# global messages
everyone = nowjs.initialize app

everyone.now.distributeMessage = (message) ->
  everyone.now.receiveMessage @now.name, message
  false

# ROUTES
# app.get '/', (request, response) ->
  # response.send 'Hello World'
  
# Set port for both development and production
port = process.env.PORT || 3000
app.listen port, ->
  console.log("Listening on " + port)
