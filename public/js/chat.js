(function() {
  var classifyName, formatTime, parseMessage, parseSystemMessage, updateName;

  classifyName = function(senderName, nowName) {
    var classes;
    classes = [];
    if (senderName === nowName) {
      classes.push('self');
    } else if (senderName === 'shep' || senderName === 'shepbot') {
      classes.push('shep');
    }
    if ($('#chat-log li').last().find('.chatter').text() === senderName) {
      classes.push('consecutive');
    }
    return classes.join(' ');
  };

  updateName = function(raw) {
    var oldname;
    if (raw !== now.name) {
      oldname = now.name;
      now.name = raw;
      now.distributeMessage("" + oldname + " is now known as " + now.name, 'Nickname');
      return true;
    } else {
      return false;
    }
  };

  formatTime = function(timestamp) {
    return timestamp;
  };

  parseSystemMessage = function(message) {
    return message;
  };

  parseMessage = function(message) {
    return message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*{2}([^\*]+)\*{2}/g, function(match) {
      return "<strong>" + match.slice(2, (match.length - 3) + 1 || 9e9) + "</strong>";
    }).replace(/\*{1}([^\*]+)\*{1}/g, function(match) {
      return "<em>" + match.slice(1, (match.length - 2) + 1 || 9e9) + "</em>";
    }).replace(/(http[s]*:\/\/\S+)/g, function(match) {
      return "<a href='" + match + "' target='_blank'>" + match + "</a>";
    });
  };

  jQuery(function() {
    now.receiveSystemMessage = function(timestamp, type, message, destination) {
      if (destination == null) destination = 'itp';
      this.template = $('#message-template').html();
      return $('#chat-log').append(Mustache.render(this.template, {
        name: type,
        message: parseSystemMessage(message),
        time: formatTime(timestamp),
        classes: 'system-notice'
      }));
    };
    now.receiveChatMessage = function(timestamp, sender, message, destination) {
      var nowName;
      if (destination == null) destination = 'itp';
      this.template = $('#message-template').html();
      nowName = this.now.name;
      $('#chat-log').append(Mustache.render(this.template, {
        name: sender,
        message: parseMessage(message),
        time: formatTime(timestamp),
        classes: classifyName(sender, nowName)
      }));
      return $('#chat-log-container').animate({
        'scrollTop': $('#chat-log').height()
      }, 200);
    };
    $("#new-message").live('keypress', function(event) {
      var message;
      message = $("#new-message-input").val();
      if (message.length > 80) $('#new-message-input').attr('rows', 2);
      if (event.which === 13) {
        event.preventDefault();
        if (message.length > 0) {
          now.distributeChatMessage(now.name, $("#new-message-input").val());
          return $("#new-message-input").val('').attr('rows', 1);
        }
      }
    });
    while (now.name === void 0 || now.name === "") {
      now.name = prompt("What's your name?", "");
      if (now.name !== void 0 || now.name.length > 0) {
        $('#chat-name').val(now.name);
      }
    }
    return $('#chat-name').focusout(function() {
      return updateName(($(this)).val());
    });
  });

}).call(this);
