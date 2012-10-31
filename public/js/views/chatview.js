jQuery(function () {
  // Chat Window
  //___________________________________________________________________________
  // This view holds chat toolbar, chat log, user list and new message views.
  // Call routing functions on this view and have the events propagate through.
  var ChatWindowView = Backbone.View.extend({
    el: '#chat-window',
    templateSource: $('#chat-window-template').html(),

    initialize: function (options) {
      this.initializeSubViews();
      this.bindToWindowResize();
      this.promptUserName();
    },

    render: function () {
      this.template = Handlebars.compile(this.templateSource)
      $(this.el).html(this.template());
      app.Helpers.fitHeight();
      this.initializeSubViews()
      return this;
    },

    initializeSubViews: function () {
      this.newMessageView = new NewMessageView;
      // this.channelsView = new ChannelsView({collection: app.Channels});
      // this.userListView = new UserListView({collection: app.Users});
      // this.messagesView = new MessagesView({collection: app.Messages});
    },

    // Bind window resize event
    bindToWindowResize: function () {
      $(window).bind('resize', function () {
        app.Helpers.fitHeight($(this).height());
      });
    },

    // Displays a modal dialog asking for a chat name. Requires minimum and
    // maximum length for names.
    promptUserName: function () {
      var self = this;
      var nicknamePrompt = new ui.Confirmation({
        title: "Please enter a nickname",
        message: $('<p>No spaces, names must be between<br>3 and 10 characters. </p><input tabindex="1" type="text" id="nickname-form">')
        })
        .modal()
        .show(function (response) {
          if (response) {
            var nickname = $('#nickname-form').val();
            self.render().el
            self.initializeSubViews()
            self.saveNickname(nickname);
          }
        });

      // Disable OK buttona and remove cancel.
      nicknamePrompt.el.find('ok')
        .attr('disabled', 'disabled').end()
        .find('.cancel').remove()

      var $input = $(nicknamePrompt.el).find('input');
      // Focus the cursor on the text input
      $input.focus();
      return $input.keypress(function (event) {
        nicknameVal = $(event.target).val()
        if (nicknameVal.length >= 3 && nicknameVal.length <= 10) {
          nicknamePrompt.el.find('.ok').removeAttr('disabled');
          if (event.keyCode === 13) {
            nicknamePrompt.emit('ok')
              .hide()
              .callback(true)
          } else {
            nicknamePrompt.el.find('.ok').attr('disabled', 'disabled')
          }
          app.Helpers.ignoreKeys(event, [32], 10);
        }
      })
    },

    saveNickname: function (nickname) {
      chat.openSocket(nickname);
      $('.chat-name').val(nickname);
    }
  });

  var NewMessageView = Backbone.View.extend({
    el: '#new-message',
    templateSource: $('#new-message-template').html(),
    events: {
      // 'blur .chat-name'             : 'updateName',
      'keypress .chat-name'         : 'ignoreKeys',
      // 'keypress .new-message-input' : 'sendMessage'
    },

    initialize: function (options) {
      this.render().el
      areas = document.querySelectorAll('.new-message-input')
      l = areas.length
      while (l--) {
        this.makeExpandingArea(areas[l])
      }
    },

    render: function () {
      this.template = Handlebars.compile(this.templateSource)
      $(this.el).html(this.template({name: 'hi'}))
      return this;
    },

    ignoreKeys: function (event) {
      app.Helpers.ignoreKeys(event, [13, 32], 10);
    },

    makeExpandingArea: function (container) {
      // http://www.alistapart.com/articles/expanding-text-areas-made-elegant/
      var area = container.querySelector('textarea');
      var span = container.querySelector('span');

      if (area.addEventListener) {
        area.addEventListener('input', function () {
          span.textContent = area.value
        }, false)
        span.textContent = area.value
      } else if (area.attachEvent) {
        // IE8 compatability
        area.attachEvent('onpropertychange', function () {
          span.innerText = area.value
        })
        span.innerText = area.value
      }
      container.className += ' active'
    }

  });

  this.chat = window.chat != null ? window.chat : {}
  this.app = window.app != null ? window.app : {}
  this.app.ChatWindowView = ChatWindowView;
});
