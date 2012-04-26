(function() {
  var classifyName, renderMessage;

  classifyName = function(senderName, nowName) {
    var classes;
    classes = [];
    if (senderName === nowName) {
      classes.push('self');
    } else if (senderName === 'shep' || senderName === 'shepbot') {
      classes.push('shep');
    }
    if ($('.chat-log li').last().find('.chatter').text() === senderName) {
      classes.push('consecutive');
    }
    return classes.join(' ');
  };

  renderMessage = function(template, timestamp, sender, message, classes) {
    if (classes == null) classes = '';
    this.template = template;
    $('.chat-log').append(Mustache.render(this.template, {
      name: sender,
      message: window.app.Helpers.parseMessage(message),
      time: window.app.Helpers.formatTime(timestamp),
      classes: classes
    }));
    $('.chat-log-container').animate({
      'scrollTop': $('.chat-log').height()
    }, 200);
    return true;
  };

  jQuery(function() {
    now.updateUserList = function(channel, nicks) {
      var name, value, _results;
      $('#user-list').empty();
      _results = [];
      for (name in nicks) {
        value = nicks[name];
        $('#user-list').append("<li>" + name + "</li>");
        _results.push(true);
      }
      return _results;
    };
    now.receivePreviousMessage = function(timestamp, sender, message, destination) {
      if (destination == null) destination = 'itp';
      if (sender === 'Join' || sender === 'Leave') {
        return renderMessage($('#system-message-template').html(), timestamp, sender, message, 'system-notice previous-message');
      } else {
        return renderMessage($('#message-template').html(), timestamp, sender, message, "" + (classifyName(sender, this.now.name)) + " previous-message");
      }
    };
    now.receiveSystemMessage = function(timestamp, type, message, destination) {
      if (destination == null) destination = 'itp';
      return renderMessage($('#system-message-template').html(), timestamp, type, message, 'system-notice');
    };
    return now.receiveChatMessage = function(timestamp, sender, message, destination) {
      if (destination == null) destination = 'itp';
      if (windowBlurred) return triggerBlink();
    };
  });

}).call(this);
