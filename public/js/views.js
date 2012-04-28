(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  jQuery(function() {
    var AppView, ChannelView, ChannelsView, ChatWindowView, FeedbackView, MessageView, MessagesView, NewMessageView, UserListView, _ref;
    AppView = (function(_super) {

      __extends(AppView, _super);

      function AppView() {
        AppView.__super__.constructor.apply(this, arguments);
      }

      AppView.prototype.el = '#content';

      AppView.prototype.initialize = function(options) {
        this.feedbackview = new FeedbackView;
        return this.chatwindowview = new ChatWindowView;
      };

      AppView.prototype.render = function() {
        this.feedbackview.render().el;
        return this;
      };

      AppView.prototype.linkToNow = function() {
        var _this = this;
        now.updateUserList = function(channel, nicks) {};
        now.receivePreviousMessage = function(timestamp, sender, message, destination) {
          if (destination == null) destination = 'itp';
        };
        now.receiveSystemMessage = function(timestamp, type, message, destination) {
          if (destination == null) destination = 'itp';
        };
        return now.receiveChatMessage = function(timestamp, sender, message, destination) {
          if (destination == null) destination = 'itp';
        };
      };

      return AppView;

    })(Backbone.View);
    FeedbackView = (function(_super) {

      __extends(FeedbackView, _super);

      function FeedbackView() {
        FeedbackView.__super__.constructor.apply(this, arguments);
      }

      FeedbackView.prototype.events = {
        'click .feedback-button': 'toggleForm',
        'click .feedback-send': 'sendFeedback'
      };

      FeedbackView.prototype.initialize = function(options) {};

      FeedbackView.prototype.template = $('#feedback-template').html();

      FeedbackView.prototype.render = function() {
        $('.introduction').append(Mustache.render(this.template, {}));
        return this;
      };

      FeedbackView.prototype.toggleForm = function(e) {
        var $feedbackForm;
        $feedbackForm = $('#feedback-form');
        if ($feedbackForm.html().length === 0) {
          $feedbackForm.append(Mustache.render($('#feedback-form-template').html(), {
            name: now.name
          }));
        } else {
          $feedbackForm.empty();
        }
        return false;
      };

      FeedbackView.prototype.sendFeedback = function(e) {
        var message, sender;
        sender = $('#feedback-name').val();
        message = $('#feedback-message').val();
        now.logFeedback(sender, message);
        $('#feedback-form').empty();
        return false;
      };

      return FeedbackView;

    })(Backbone.View);
    ChatWindowView = (function(_super) {

      __extends(ChatWindowView, _super);

      function ChatWindowView() {
        ChatWindowView.__super__.constructor.apply(this, arguments);
      }

      ChatWindowView.prototype.el = '#chat-window';

      ChatWindowView.prototype.template = $('#chat-window-template').html();

      ChatWindowView.prototype.events = {
        'click .channel-menu-button': 'toggleMenu'
      };

      ChatWindowView.prototype.initialize = function(options) {
        this.setupNow();
        this.attachMenu();
        return this.bindToWindowResize();
      };

      ChatWindowView.prototype.render = function() {
        $(this.el).html(Mustache.render(this.template));
        app.Helpers.fitHeight();
        return this;
      };

      ChatWindowView.prototype.attachMenu = function() {
        return this.menu = ui.menu().add('Add Channel...');
      };

      ChatWindowView.prototype.toggleMenu = function(e) {
        var $menuButton, menuButtonDim, padding;
        $menuButton = $('.channel-menu-button');
        menuButtonDim = {
          width: $menuButton.width(),
          height: $menuButton.outerHeight()
        };
        if (e.target.className === "room-menu-icon pictos") {
          padding = ($menuButton.outerWidth() - $menuButton.width()) / 2;
          this.menu.moveTo(e.pageX - e.offsetX - padding, menuButtonDim.height);
        } else {
          this.menu.moveTo(e.pageX - e.offsetX, menuButtonDim.height);
        }
        this.menu.show();
        return false;
      };

      ChatWindowView.prototype.bindToWindowResize = function() {
        return $(window).bind('resize', function() {
          return app.Helpers.fitHeight($(this).height());
        });
      };

      ChatWindowView.prototype.promptUserName = function() {
        var $input, namePrompt,
          _this = this;
        namePrompt = new ui.Confirmation({
          title: "Please enter a name.",
          message: $('<p>No spaces, names must be between<br>4 and 20 characters. </p><input tabindex="1" type="text">')
        }).modal().show(function(ok) {
          var name;
          if (ok) {
            _this.render().el;
            _this.userListView = new UserListView({
              collection: app.Users
            });
            _this.messagesview = new MessagesView({
              collection: app.Messages
            });
            _this.newmessageview = new NewMessageView;
            now.name = name = $('#dialog').find('input').val().trim();
            $('.chat-name').val(name);
            return now.changeName(name);
          }
        });
        namePrompt.el.find('.ok').attr('disabled', 'true').end().find('.cancel').remove();
        $input = $(namePrompt.el).find('input');
        $input.focus();
        $input.keydown(function(event) {
          if (event.keyCode === 32) return false;
        });
        return $input.keypress(function(event) {
          var origVal;
          origVal = $input.val().trim();
          if (origVal.length >= 20) return false;
          if (origVal.length > 3) {
            if (event.keyCode === 13) {
              namePrompt.emit('ok');
              namePrompt.callback(true);
              namePrompt.hide();
            }
            return namePrompt.el.find('.ok').removeAttr('disabled');
          } else {
            return namePrompt.el.find('.ok').attr('disabled', 'disabled');
          }
        });
      };

      ChatWindowView.prototype.setupNow = function() {
        var _this = this;
        return now.triggerIRCLogin = function() {
          return _this.promptUserName();
        };
      };

      return ChatWindowView;

    })(Backbone.View);
    UserListView = (function(_super) {

      __extends(UserListView, _super);

      function UserListView() {
        UserListView.__super__.constructor.apply(this, arguments);
      }

      UserListView.prototype.el = '#user-list';

      UserListView.prototype.initialize = function(options) {
        this.linkToNow();
        return this.collection.bind('add', this.render, this);
      };

      UserListView.prototype.render = function() {
        var user, _i, _len, _ref;
        $(this.el).empty();
        _ref = this.collection.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          user = _ref[_i];
          $(this.el).append("<li>" + (user.get('name')) + "</li>");
        }
        return this;
      };

      UserListView.prototype.linkToNow = function() {
        var _this = this;
        return now.updateUserList = function(channel, nicks) {
          var nick, value;
          _this.collection.reset();
          for (nick in nicks) {
            value = nicks[nick];
            _this.collection.add({
              name: nick
            });
          }
        };
      };

      return UserListView;

    })(Backbone.View);
    MessageView = (function(_super) {

      __extends(MessageView, _super);

      function MessageView() {
        MessageView.__super__.constructor.apply(this, arguments);
      }

      MessageView.prototype.tagName = 'li';

      MessageView.prototype.template = $('#message-template').html();

      MessageView.prototype.render = function() {
        var message;
        this.template = $("#" + (this.model.get('type')) + "-message-template").html();
        message = this.model.toJSON();
        message.time = app.Helpers.formatTime(this.model.get('time'));
        if (this.model.get('consecutive')) $(this.el).addClass('consecutive');
        $(this.el).addClass(this.model.get('classes')).html(Mustache.render(this.template, message));
        return this;
      };

      return MessageView;

    })(Backbone.View);
    MessagesView = (function(_super) {

      __extends(MessagesView, _super);

      function MessagesView() {
        MessagesView.__super__.constructor.apply(this, arguments);
      }

      MessagesView.prototype.el = '#chat-log-container';

      MessagesView.prototype.template = $('#messages-template').html();

      MessagesView.prototype.initialize = function(options) {
        this.render().el;
        this.collection.bind('add', this.render, this);
        return this.linkToNow();
      };

      MessagesView.prototype.linkToNow = function() {
        var _this = this;
        now.receivePreviousMessage = function(timestamp, sender, message, destination) {
          if (destination == null) destination = 'itp';
          return console.log("crap");
        };
        now.receiveSystemMessage = function(timestamp, type, message, destination) {
          if (destination == null) destination = 'itp';
          return _this.collection.add(new app.Message({
            channel: destination,
            message: message,
            time: timestamp,
            classes: 'system-notice',
            type: 'system'
          }));
        };
        return now.receiveChatMessage = function(timestamp, sender, message, destination) {
          if (destination == null) destination = 'itp';
          if (window.windowBlurred) app.Helpers.triggerBlink();
          return _this.collection.add(new app.Message({
            channel: destination,
            name: sender,
            message: app.Helpers.parseMessage(message),
            time: timestamp,
            classes: "" + (_this.classifyName(sender, now.name)),
            type: 'chat',
            consecutive: _this.isConsecutive(sender)
          }));
        };
      };

      MessagesView.prototype.classifyName = function(senderName, nowName) {
        var classes;
        classes = [];
        if (senderName === nowName) {
          classes.push('self');
        } else if (senderName === 'shep' || senderName === 'shepbot') {
          classes.push('shep');
        }
        return classes.join(' ');
      };

      MessagesView.prototype.isConsecutive = function(sender) {
        if ($('.chat-log li').last().find('.chatter').text() === sender) {
          return true;
        } else {
          return false;
        }
      };

      MessagesView.prototype.render = function() {
        var message, messageView, _i, _len, _ref;
        $(this.el).html(Mustache.render(this.template));
        _ref = this.collection.thisChannel();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          message = _ref[_i];
          messageView = new MessageView({
            model: message
          });
          this.$('.chat-log').append(messageView.render().el);
        }
        app.Helpers.fitHeight();
        return this;
      };

      return MessagesView;

    })(Backbone.View);
    NewMessageView = (function(_super) {

      __extends(NewMessageView, _super);

      function NewMessageView() {
        NewMessageView.__super__.constructor.apply(this, arguments);
      }

      NewMessageView.prototype.el = '#new-message';

      NewMessageView.prototype.template = $('#new-message-template').html();

      NewMessageView.prototype.events = {
        'blur .chat-name': 'updateName',
        'keypress .chat-name': 'ignoreKeys',
        'keyup .new-message-input': 'resizeInput',
        'paste .new-message-input': 'resizeInput',
        'cut .new-message-input': 'resizeInput',
        'keypress .new-message-input': 'sendMessage'
      };

      NewMessageView.prototype.initialize = function(options) {
        this.linkToNow();
        return this.render().el;
      };

      NewMessageView.prototype.linkToNow = function() {
        return now.serverChangedName = function(name) {
          now.name = name;
          return $('.chat-name').val(name);
        };
      };

      NewMessageView.prototype.render = function() {
        $(this.el).html(Mustache.render(this.template, {
          name: now.name
        }));
        return this;
      };

      NewMessageView.prototype.ignoreKeys = function(e) {
        if (e.keyCode === 13 || e.keyCode === 32) {
          return false;
        } else if ($(e.target).val().length >= 20) {
          return false;
        } else {
          return true;
        }
      };

      NewMessageView.prototype.resizeInput = function(e) {
        var message, messageDec, rows;
        message = $(e.target).val();
        messageDec = function(ml) {
          if (ml <= 78) {
            return 1;
          } else {
            return ml / 78;
          }
        };
        rows = Math.min(5, Math.ceil(messageDec(message.length)));
        return $(e.target).attr('rows', rows);
      };

      NewMessageView.prototype.sendMessage = function(e) {
        var message;
        message = $(e.target).val().trim();
        if (e.which === 13) {
          if (message.length === 0) return false;
          now.distributeChatMessage(now.name, message);
          $(e.target).val('').attr('rows', 1);
          return false;
        }
      };

      NewMessageView.prototype.updateName = function(e) {
        var raw;
        raw = $(e.target).val();
        if (raw !== now.name) {
          now.changeName(now.name = raw);
          return true;
        } else {
          return false;
        }
      };

      return NewMessageView;

    })(Backbone.View);
    ChannelsView = (function(_super) {

      __extends(ChannelsView, _super);

      function ChannelsView() {
        ChannelsView.__super__.constructor.apply(this, arguments);
      }

      ChannelsView.prototype.el = '#chat-toolbar';

      ChannelsView.prototype.template = $('#channels-template').html();

      ChannelsView.prototype.initialize = function(options) {
        return this.render().el;
      };

      ChannelsView.prototype.render = function() {
        var channel, channelView, _i, _len, _ref;
        $(this.el).html(Mustache.render(this.template));
        _ref = this.collection.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          channel = _ref[_i];
          channelView = new ChannelView({
            model: channel
          });
          this.$('.chat-room-list').append(channelView.render().el);
        }
        return this;
      };

      return ChannelsView;

    })(Backbone.View);
    ChannelView = (function(_super) {

      __extends(ChannelView, _super);

      function ChannelView() {
        ChannelView.__super__.constructor.apply(this, arguments);
      }

      ChannelView.prototype.tagName = 'li';

      ChannelView.prototype.template = $('#channel-template').html();

      ChannelView.prototype.events = {
        'click': 'goToChannel',
        'mouseenter .exitable-room': 'showX',
        'mouseleave .exitable-room': 'hideX'
      };

      ChannelView.prototype.initialize = function(options) {
        return this.render().el;
      };

      ChannelView.prototype.render = function() {
        $(this.el).html(Mustache.render(this.template, this.model.toJSON()));
        return this;
      };

      ChannelView.prototype.goToChannel = function() {
        return app.Messages.setChannel(this.model.get('name'));
      };

      ChannelView.prototype.showX = function(e) {
        return $(e.target).text('*');
      };

      ChannelView.prototype.hideX = function(e) {
        return $(e.target).text('q');
      };

      return ChannelView;

    })(Backbone.View);
    this.app = (_ref = window.app) != null ? _ref : {};
    this.app.AppView = AppView;
    this.app.ChatWindowView = ChatWindowView;
    this.app.ChannelView = ChannelView;
    return this.app.ChannelsView = ChannelsView;
  });

}).call(this);
