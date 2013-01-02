(function() {
  Handlebars.registerHelper('dateString', function (date) {
    var d = new Date(date)
    return (d.getMonth() + 1) + "/" + pad(d.getDate()) + " " + hours(d.getHours()) + ":" + pad(d.getMinutes())
  });

  Handlebars.registerHelper('timeString', function (timestamp) {
    var d = new Date(timestamp)
    return hours(d.getHours()) + ":" + pad(d.getMinutes())
  })

  $(document).ready(function () {
    window.windowBlurred = false
    window.pageIsBlinking = false
    window.pageTitle = $(document).attr('title')
    window.titleFlash = ''

    $(window).blur(function () { return window.windowBlurred = true; });
    $(window).focus(function () { return Helpers.unBlinkTitle(); });
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
      var windowHeight = $(window).height();

      var menuHeight = $('#chat-menu').height();
      $('#chat-window').css('height', windowHeight + 'px')
      $('#menu-window').css('height', windowHeight + 'px')
      var chatWindowHeight = windowHeight - menuHeight;
      var chatInterior = chatWindowHeight - $('#new-message').outerHeight();
      $('#channel-viewport').height(chatWindowHeight+'px');
      $('#chat-log-container').height(chatInterior+'px')
      // $('#chat-log').css('min-height', chatInterior+'px')
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

    padMinutes: function (rawMinutes) {
      return (number < 10) ? '0' + number : number
    },

    padHours: function (rawHours) {
      return (hour <= 12) ? hour : hour - 12
    },

    formatDate: function (datetime) {

    },

    formatTime: function (timestamp) {
      var time = new Date(timestamp)
      var rawHours = time.getHours()
      var hours = this.padHours(rawHours);
      var minutes = this.padMinutes(time.getMinutes());
      var marker = rawHours >= 12 ? 'P' : 'A'
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
  this.app.Helpers.fitHeight();
}).call(this);
