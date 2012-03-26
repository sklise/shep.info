(function() {
  var classifyName, formatTime, parseMessage, parseSystemMessage, renderMessage, updateName;

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
    var hours, marker, minutes, time;
    time = new Date(timestamp);
    hours = time.getHours();
    minutes = time.getMinutes();
    marker = hours > 12 ? 'P' : 'A';
    minutes = minutes > 9 ? minutes : '0' + minutes;
    hours = hours > 12 ? hours - 12 : hours;
    return "" + hours + ":" + minutes + marker;
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

  renderMessage = function(template, timestamp, sender, message, classes) {
    if (classes == null) classes = '';
    this.template = template;
    $('#chat-log').append(Mustache.render(this.template, {
      name: sender,
      message: parseMessage(message),
      time: formatTime(timestamp),
      classes: classes
    }));
    $('#chat-log-container').animate({
      'scrollTop': $('#chat-log').height()
    }, 200);
    return true;
  };

  jQuery(function() {
    while (now.name === void 0 || now.name === "") {
      now.name = prompt("What's your name?", "");
      if (now.name !== void 0 || now.name.length > 0) {
        $('#chat-name').val(now.name);
      }
    }
    $('#chat-name').focusout(function() {
      return updateName(($(this)).val());
    });
    now.receivePreviousMessage = function(timestamp, sender, message, destination) {
      if (destination == null) destination = 'itp';
      return renderMessage($('#message-template').html(), timestamp, sender, message, "" + (classifyName(sender, this.now.name)) + " system-notice");
    };
    $('#user-toggle').click(function() {
      var $userList, names;
      if ($('#user-toggle').find('#user-list').length === 0) {
        now.getUserList();
        $userList = $('<div/>').attr('id', 'user-list');
        $('#user-toggle').append($userList);
        names = "";
        _.each(now.userList, function(name) {
          return names += '<li>' + name + '</li>';
        });
        return $userList.html('<ul>' + names + '</ul>').css('width', $('#user-toggle').width());
      } else {
        return $('#user-list').remove();
      }
    });
    return now.ready(function() {
      now.addUserToList = function(name) {
        return now.userList.push(name);
      };
      now.receiveSystemMessage = function(timestamp, type, message, destination) {
        if (destination == null) destination = 'itp';
        return renderMessage($('#system-message-template').html(), timestamp, type, message, 'system-notice');
      };
      now.receiveChatMessage = function(timestamp, sender, message, destination) {
        if (destination == null) destination = 'itp';
        return renderMessage($('#message-template').html(), timestamp, sender, message, classifyName(sender, this.now.name));
      };
      return $("#new-message").live('keypress', function(event) {
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
    });
  });

}).call(this);
