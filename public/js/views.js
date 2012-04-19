(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  jQuery(function() {
    var AppView, EventsView, FeedbackView, MessageView, MessagesView, _ref;
    AppView = (function(_super) {

      __extends(AppView, _super);

      function AppView() {
        AppView.__super__.constructor.apply(this, arguments);
      }

      AppView.prototype.el = '#content';

      AppView.prototype.initialize = function(options) {
        this.feedbackview = new FeedbackView;
        return this.messagesview = new MessagesView({
          collection: app.Messages
        });
      };

      AppView.prototype.render = function() {
        this.feedbackview.render().el;
        return this;
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
    MessageView = (function(_super) {

      __extends(MessageView, _super);

      function MessageView() {
        MessageView.__super__.constructor.apply(this, arguments);
      }

      MessageView.prototype.className = 'message';

      MessageView.prototype.tagName = 'li';

      MessageView.prototype.template = $('#message-template').html();

      MessageView.prototype.render = function() {
        this.template = $("#" + (this.model.get(type)) + "-message-template").html();
        $(this.el).html(Mustache.render(this.template, this.model.toJSON()));
        return this;
      };

      return MessageView;

    })(Backbone.View);
    MessagesView = (function(_super) {

      __extends(MessagesView, _super);

      function MessagesView() {
        MessagesView.__super__.constructor.apply(this, arguments);
      }

      MessagesView.prototype.el = '#chat-window';

      MessagesView.prototype.template = $('#chat-window-template').html();

      MessagesView.prototype.events = {
        'click .exitable-room': 'leaveChannel',
        'mouseenter .exitable-room': 'showX',
        'mouseleave .exitable-room': 'hideX',
        'blur .chat-name': 'updateName',
        'keyup .new-message-input': 'resizeInput',
        'paste .new-message-input': 'resizeInput',
        'cut .new-message-input': 'resizeInput',
        'keypress .new-message-input': 'sendMessage',
        'click .channel-menu-button': 'toggleMenu'
      };

      MessagesView.prototype.initialize = function(options) {
        var _this = this;
        $(window).bind('resize', function() {
          return _this.fitHeight($(_this).height());
        });
        return this.attachMenu();
      };

      MessagesView.prototype.attachMenu = function() {
        return this.menu = ui.menu().add('Add Channel...');
      };

      MessagesView.prototype.toggleMenu = function(e) {
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

      MessagesView.prototype.fitHeight = function(windowHeight) {
        var chatInterior, chatWindowHeight, toolbarHeight;
        toolbarHeight = $('#chat-toolbar').height();
        $('#chat-window').css('height', windowHeight + 'px');
        chatWindowHeight = windowHeight - toolbarHeight;
        chatInterior = chatWindowHeight - this.$('#new-message').height() + 14;
        this.$('#chat-log-container').height(chatInterior);
        return this.$('#chat-log').css('min-height', chatInterior);
      };

      MessagesView.prototype.promptUserName = function() {
        var $input, namePrompt,
          _this = this;
        namePrompt = new ui.Confirmation({
          title: "Please enter a name.",
          message: $('<p>No spaces, names must be between<br>4 and 20 characters. </p><input tabindex="1" type="text">')
        }).modal().show(function(ok) {
          var name;
          if (ok) {
            name = $(this.el).find('input').val().trim();
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

      MessagesView.prototype.render = function() {
        $(this.el).empty().html(Mustache.render(this.template));
        this.fitHeight($(window).height());
        return this;
      };

      MessagesView.prototype.resizeInput = function(e) {
        var message;
        message = $(e.target).val();
        if (message.length > 80) {
          return $(e.target).attr('rows', 2);
        } else {
          return $(e.target).attr('rows', 1);
        }
      };

      MessagesView.prototype.sendMessage = function(e) {
        var message;
        message = $(e.target).val().trim();
        if (e.which === 13) {
          if (message.length === 0) return false;
          now.distributeChatMessage(now.name, message);
          $(e.target).val('').attr('rows', 1);
          return false;
        }
      };

      MessagesView.prototype.updateName = function(e) {
        var oldname, raw;
        raw = $(e.target).val();
        if (raw !== now.name) {
          oldname = now.name;
          now.name = raw;
          now.changeNick(oldname, now.name);
          return true;
        } else {
          return false;
        }
      };

      MessagesView.prototype.showX = function(e) {
        return $(e.target).text('*');
      };

      MessagesView.prototype.hideX = function(e) {
        return $(e.target).text('q');
      };

      MessagesView.prototype.leaveChannel = function() {
        var channelName,
          _this = this;
        channelName = $(this).closest('li').data('channel-name');
        return new ui.Confirmation({
          title: "Leave " + channelName + " channel",
          message: 'are you sure?'
        }).show(function(ok) {
          if (ok) {
            $(_this).closest('li').remove();
            return ui.dialog('Seeya!').show().hide(1500);
          }
        });
      };

      return MessagesView;

    })(Backbone.View);
    this.app = (_ref = window.app) != null ? _ref : {};
    this.app.AppView = AppView;
    return this.app.MessagesView = new MessagesView;
  });

}).call(this);
