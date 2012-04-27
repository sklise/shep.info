(function() {
  var Helpers, _ref;

  jQuery(function() {
    window.windowBlurred = false;
    window.pageIsBlinking = false;
    window.pageTitle = $(document).attr('title');
    window.titleFlash = '';
    $(window).blur(function() {
      return window.windowBlurred = true;
    });
    return $(window).focus(function() {
      return Helpers.unBlinkTitle();
    });
  });

  Helpers = {
    fitHeight: function(windowHeight) {
      var chatInterior, chatWindowHeight, toolbarHeight;
      if (windowHeight == null) windowHeight = $(window).height();
      toolbarHeight = $('#chat-toolbar').height();
      $('#chat-window').css('height', windowHeight + 'px');
      chatWindowHeight = windowHeight - toolbarHeight;
      chatInterior = chatWindowHeight - $('#new-message').height() + 14;
      $('#chat-log-container').height(chatInterior);
      return $('.chat-log').css('min-height', chatInterior);
    },
    unBlinkTitle: function() {
      window.pageIsBlinking = false;
      window.windowBlurred = false;
      clearInterval(window.titleFlash);
      return $(document).attr('title', window.pageTitle);
    },
    blinkTitle: function() {
      var $doc, docTitle;
      $doc = $(document);
      docTitle = $doc.attr('title');
      if (docTitle === pageTitle) {
        $doc.attr('title', "New Message " + pageTitle);
      } else {
        $doc.attr('title', window.pageTitle);
      }
    },
    triggerBlink: function() {
      var _this = this;
      if (!pageIsBlinking) {
        window.pageIsBlinking = true;
        return window.titleFlash = setInterval((function() {
          return _this.blinkTitle();
        }), 1500);
      }
    },
    formatTime: function(timestamp) {
      var hours, marker, minutes, time;
      time = new Date(timestamp);
      hours = time.getHours();
      minutes = time.getMinutes();
      marker = hours >= 12 ? 'P' : 'A';
      minutes = minutes > 9 ? minutes : '0' + minutes;
      hours = hours > 12 ? hours - 12 : hours;
      return "" + hours + ":" + minutes + marker;
    },
    parseMessage: function(message) {
      return message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*{2}([^\*]+)\*{2}/g, function(match) {
        return "<strong>" + match.slice(2, (match.length - 3) + 1 || 9e9) + "</strong>";
      }).replace(/\*{1}([^\*]+)\*{1}/g, function(match) {
        return "<em>" + match.slice(1, (match.length - 2) + 1 || 9e9) + "</em>";
      }).replace(/(http[s]*:\/\/\S+)/g, function(match) {
        return "<a href='" + match + "' target='_blank'>" + match + "</a>";
      });
    }
  };

  this.app = (_ref = window.app) != null ? _ref : {};

  this.app.Helpers = Helpers;

}).call(this);
