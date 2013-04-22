var http = require('http'),
  url = require('url'),
  express = require('express'),
  app = express(),
  redis = require('redis'),
  RedisStore = require('connect-redis')(express),
  request = require('request'),
  S = require('string'),
  redisUrl = url.parse(process.env.REDISTOGO_URL || 'redis://localhost:6379'),
  emoji = require('emoji-images');


var port = process.env.SOCKET_PORT || 3000;
var sessionStore = new RedisStore({port: redisUrl.port, host: redisUrl.hostname, pass: redisUrl.password});
var cookieParser = express.cookieParser('secert');

redisUrl.password = (function () {
  if (redisUrl.auth) {
    return redisUrl.auth.split(':')[1]
  } else
    return null;
  }
)()

console.log('\033[34mbooting shep.info\033[0m')

///////////////////////////////////////////////////////////////////////////////
//   CREATE AND CONFIGURE APP                                                //
///////////////////////////////////////////////////////////////////////////////

app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.logger());
  app.use(express.directory('public'));
  app.use(express.static('public'));
  app.use(cookieParser);
  app.use(express.session({ store: sessionStore, secret: 'keyboard' }));
});

// Create server
var server = http.createServer(app).listen(port);

var client = redis.createClient(redisUrl.port, redisUrl.hostname);
client.auth(redisUrl.password, function (err, reply) {
  if (err) { console.log("Error connecting to Redis"); }
});

// On server start, erase all users and quickly add Shep back.
client.del('users');
client.sadd('users','shep');

var updateUserList = function (io) {
  client.smembers('users', function (err, reply) {
    if (err) { return }
    io.sockets.emit('userlist', reply);
  });
}

var preprocessMessage = function(m) {
  return S(m).escapeHTML().s
    .replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/, "<a target='_blank' href='$1'>$1</a>")
    .replace(/\*([^\*]*)\*/g, "<strong>$1</strong>")
    .replace(/\b_([^_]*)_\b/gi, "<em>$1</em>")
    .replace(/\b~([^~]*)~\b/gi, "<span class='comic'>$1</span>")
    .replace(/(\W|^)\-([^\-]*)\-(\W|$)/gi, "$1<del>$2</del>$3");
}

var setupChat = function (io, channelName) {
  var plainName = S(channelName).replace('/','').s;

  var updateUserList = function (channel, channelName) {
    client.smembers(plainName, function (err, reply) {
      if (err) { return }
      channel.emit('userlist', reply);
    });
  }

  var channel = io.of(channelName)
    .on('connection', function (socket) {
      console.log("[" + plainName + "] => joined");

      socket.on('setChannelNickname', function (nickname) {
        socket.set('nickname', nickname, function () {
          socket.emit('nicknameSet', {nickname: nickname});
          client.sismember(plainName, nickname, function (err, reply) {
            if (reply !== 1) {
              client.sadd(plainName, nickname);
              updateUserList(channel, channelName);
            } else {
              updateUserList(channel, channelName);
            }
          });
        });
      });

      socket.on('disconnect', function (data) {
        socket.get('nickname', function(err, nickname) {
          console.log("[" + plainName + "] (" + nickname + ") => disconnected");
          client.srem(plainName, nickname, function (err, reply) {
            updateUserList(channel, channelName);
          });
        });
      });

      socket.on('message', function (data) {
        var emojified = emoji(data.content, "http://shep.info/emojis", 18);

        var msg = {
          content: preprocessMessage(emojified),
          channel: data.channel,
          nickname: data.nickname,
          timestamp: Date.now()
        }

        // Forward the message to Shep
        request.post(process.env.HUBOT_DOMAIN + '/receive/'+msg.channel, {
          'form': {
            from: msg.nickname,
            message: data.content
          }}, function (err, res, body) {
            if (err) {
              console.log('ERROR TALKING TO SHEP');
              channel.emit('message', {
                timestamp: Date.now(),
                nickname: "SYSTEM",
                channel: data.channel,
                content: "There was an error talking to Shep."
              });
            }
          });

        channel.emit('message', msg);
      });
    });

  return channel;
}

var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {

  socket.emit('connectionSuccessful', {hey: "buddy"});

  socket.on('join-channel', function (channel) {
    setupChat(io, channel);
    socket.emit('joined', {channelName: channel})
  });

  socket.on('disconnect', function (data) {
    socket.get('nickname', function(err, nickname) {
      client.srem('users', nickname, function (err, reply) {
        updateUserList(io);
      });
    });
  });
});

app.post('/responses/:channel', function (req, res) {
  console.log("[[FROM SHEP]] ", req.params['channel'], req.params, req.body);
  var jBody = req.body;
  var m = {
    'channel': req.params.channel,
    'content': req.body.message.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/, "<a target='_blank' href='$1'>$1</a>"),
    'nickname': 'shep',
    'timestamp': Date.now()
  }

  io.of('/' + req.params.channel).emit('message', m);

  res.end('hi');
});