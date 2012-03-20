(function() {

  jQuery(function() {
    var updateName;
    now.receiveMessage = function(name, message) {
      var classifyName, time;
      time = new Date;
      time = time.getHours() + ":" + time.getMinutes();
      this.template = $('#message-template').html();
      message = message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*{2}([^\*]+)\*{2}/g, function(match) {
        return "<strong>" + match.slice(2, (match.length - 3) + 1 || 9e9) + "</strong>";
      }).replace(/\*{1}([^\*]+)\*{1}/g, function(match) {
        return "<em>" + match.slice(1, (match.length - 2) + 1 || 9e9) + "</em>";
      }).replace(/(http[s]*:\/\/\S+)/g, function(match) {
        return "<a href='" + match + "' target='_blank'>" + match + "</a>";
      });
      classifyName = function(senderName, nowName) {
        var classes;
        classes = [];
        if (senderName === nowName) {
          classes.push('self');
        } else if (senderName === 'shep' || senderName === 'shepbot') {
          classes.push('shep');
        } else if (senderName === 'Nickname' || senderName === 'Join ' || senderName === 'Leave ') {
          classes.push('system-notice');
        }
        if ($('#chat-log li').last().find('.chatter').text() === senderName) {
          classes.push('consecutive');
        }
        return classes.join(' ');
      };
      $('#chat-log').append(Mustache.render(this.template, {
        name: name,
        message: message,
        time: time,
        classes: classifyName(name, now.name)
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
          now.distributeMessage($("#new-message-input").val());
          return $("#new-message-input").val('').attr('rows', 1);
        }
      }
    });
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
    while (now.name === void 0 || now.name === "") {
      now.name = prompt("What's your name?", "");
      $('#chat-name').val(now.name);
    }
    return $('#chat-name').focusout(function() {
      return updateName(($(this)).val());
    });
  });

}).call(this);
