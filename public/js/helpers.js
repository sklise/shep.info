(function() {
  $(document).ready(function () {
    window.windowBlurred = false
    window.pageIsBlinking = false
    window.pageTitle = $(document).attr('title')
    window.titleFlash = ''

    $(window).blur(function () {
      return window.windowBlurred = true;
    });

    $(window).focus(function () {
      return Helpers.unBlinkTitle();
    });
  });

  var Helpers = {
    ignoreKeys: function (event, keys, max) {
      if (_.indexOf(keys, event.keyCode) >= 0) {
        return false
      } else if (max != null && $(event.target).val().length >= max) {
        return false
      } else {
        return true
      }
    },

    fitHeight: function (windowHeight) {
      if (windowHeight == null) {
        windowHeight = $(window).height();
      }

      var toolbarHeight = $('#chat-toolbar').height();
      $('#chat-window').css('height', windowHeight + 'px')
      $('#menu-window').css('height', windowHeight + 'px')
      var chatWindowHeight = windowHeight - toolbarHeight;
      var chatInterior = chatWindowHeight - $('#new-message').height() + 14;
      $('#chat-log-container').height(chatInterior)
      $('.chat-log').css('min-height', chatInterior)
    },

    unBlinkTitle: function () {
      window.pageIsBlinking = false;
      window.windowBlurred = false;
      clearInterval(window.titleFlash);
      $(document).attr('title', window.pageTitle);
    },

    blinkTitle: function () {
      var $doc = $(document);
      var docTitle = $doc.attr('title');
      if (docTitle === pageTitle) {
        $doc.attr('title', 'New Message ' + pageTitle);
      } else {
        $doc.attr('title', window.pageTitle)
      }
    },

    triggerBlink: function () {
      if (!pageIsBlinking) {
        var self = this;
        window.pageIsBlinking = true;
        window.titleFlash = setInterval(function () {
          self.blinkTitle()
        }, 1500);
      }
    },

    formatTime: function (timestamp) {
      var time = new Date(timestamp)
      var rawHours = time.getHours()
      var hours = rawHours <= 12 ? rawHours : rawHours - 12
      var rawMinutes = time.getMinutes()
      var minutes = rawMinutes <= 10 ? '0' + rawMinutes : rawMinutes
      var marker = hours >= 12 ? 'P' : 'A'
      return '' + hours + ':' + minutes + marker
    },

    parseMessage: function (message) {
      return message
        .replace(/^\u0001ACTION /, '')
        // Escape html tags
        .replace(/</g, '&lt;').replace(/>/g, '&gt;')
        // Bold text wrapped in double asterisks
        .replace(/~([^~]+)~/g, function (match) {
          return "<span style='font-family:\"Comic Sans\",\"Comic Sans MS\",\"Marker Felt\";'>" + match.slice(1, (match.length - 2) + 1 || 9e9) + "</span>"
        })
        .replace(/\*{2}([^\*]+)\*{2}/g, function (match) {
          return "<strong>" + match.slice(2, (match.length - 3) + 1 || 9e9) + "</strong>";
        })
        .replace(/\*{1}([^\*]+)\*{1}/g, function (match) {
          return "<em>" + match.slice(1, (match.length - 2) + 1 || 9e9) + "</em>";
        })
        .replace(/(http[s]*:\/\/\S+)/g, function (match) {
          return "<a href='" + match + "' target='_blank'>" + match + "</a>";
        });
    }
  }

  this.app = window.app != null ? window.app : {};
  this.app.Helpers = Helpers;
}).call(this);
