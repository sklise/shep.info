(function() {
  var classifyName, parseMessage, parseSystemMessage, renderMessage;

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
      time: window.app.Helpers.formatTime(timestamp),
      classes: classes
    }));
    $('#chat-log-container').animate({
      'scrollTop': $('#chat-log').height()
    }, 200);
    return true;
  };

  jQuery(function() {
    var blinkTitle, pageIsBlinking, pageTitle, titleFlash, triggerBlink, unBlinkTitle, windowBlurred;
    windowBlurred = false;
    pageIsBlinking = false;
    pageTitle = $(document).attr('title');
    titleFlash = '';
    triggerBlink = function() {
      if (!pageIsBlinking) {
        pageIsBlinking = true;
        return titleFlash = setInterval((function() {
          return blinkTitle();
        }), 1500);
      }
    };
    $(window).blur(function() {
      return windowBlurred = true;
    });
    $(window).focus(function() {
      return unBlinkTitle();
    });
    unBlinkTitle = function() {
      pageIsBlinking = false;
      windowBlurred = false;
      clearInterval(titleFlash);
      return $(document).attr('title', pageTitle);
    };
    blinkTitle = function() {
      var $doc, docTitle;
      $doc = $(document);
      docTitle = $doc.attr('title');
      if (docTitle === pageTitle) {
        $doc.attr('title', "New Message " + pageTitle);
      } else {
        $doc.attr('title', pageTitle);
      }
    };
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
    now.serverChangedName = function(name) {
      now.name = name;
      return $('.chat-name').val(name);
    };
    now.triggerIRCLogin = function() {
      return app.MessagesView.render().el;
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
      if (windowBlurred) triggerBlink();
      return renderMessage($('#message-template').html(), timestamp, sender, message, classifyName(sender, this.now.name));
    };
  });

}).call(this);
