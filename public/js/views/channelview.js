$(document).ready(function () {
  // ChannelView
  // View for chat window encompassing NewMessageView, MessagesView, UsersView
  var ChannelView = Backbone.View.extend({
    el: '#channel-viewport',
    templateSource: $('#channel-template').html(),

    initialize: function (options) {
      this.collection.bind('change:channel', this.render, this);
      this.collection.bind('change:users', this.refreshUserList, this);
    },

    refreshUserList: function () {
      console.log('refresh userlist')
      var userList = this.$el.find('#user-list');
      var alphabetizedList = _.sortBy(this.collection.users, function (u) {return u})
      $(userList).empty();
      _.each(alphabetizedList, function (username) {
        $(userList).append('<li>'+username+'</li>')
      })
    },

    render: function () {
      template = Handlebars.compile(this.templateSource);
      var currentChannel = this.collection.getChannel();

      this.$el.empty();

      this.$el.html(template(currentChannel.toJSON()))

      var newMessageView = new NewMessageView({model: currentChannel});
      var messagesView = new MessagesView({model: currentChannel});
      app.Helpers.fitHeight()

      messagesView.scrollToBottom();

      return this;
    }
  });

  // MESSAGE VIEW
  //___________________________________________________________________________
  // Individual message view. Sets the template based on the value of model.type
  var MessageView = Backbone.View.extend({
    tagName: 'li',
    className: 'message',
    templateSource: $('#message-template').html(),

    render: function () {
      var template = Handlebars.compile(this.templateSource);
      var message = this.model.toJSON()

      this.$el.html(template(message));

      if (this.model.get('consecutive')) {
        this.$el.addClass('consecutive')
      };

      if (this.model.get('is_shep')) {
        this.$el.addClass('shep');
      }

      if (this.model.get('is_self')) {
        this.$el.addClass('self');
      }

      return this;
    }
  });

  // MESSAGE LIST VIEW
  //___________________________________________________________________________
  // Message list view gets recreated when a the channel is changed.

  var MessagesView = Backbone.View.extend({
    el: '#chat-log',

    initialize: function (options) {
      this.render().el
      this.model.get('messages').bind('add', this.appendLast, this)
    },

    appendLast: function () {
      var message = this.model.get('messages').last();
      var messageView = new MessageView({model: message});

      this.$el.append(messageView.render().el);
      this.scrollToBottom();
      return this;
    },

    render: function () {
      var self = this;
      this.$el.empty()

      this.model.get('messages').forEach(function (message) {
        var messageView = new MessageView({model: message});
        self.$el.append(messageView.render().el)
      });
      return this;
    },

    scrollToBottom: function (force) {
      var lastMessageHeight = this.$el.find('li').last().height() || 30;
      var scrollPosition = $('#chat-log-container').scrollTop();
      var containerHeight = $('#chat-log-container').height();
      var chatHeight = this.$el.outerHeight();
      var logOverflow = chatHeight - containerHeight;

      if (scrollPosition - logOverflow + lastMessageHeight <= 0 || force === true) {
        $('#chat-log-container').scrollTop(chatHeight);
      }

    }
  })

  // New Message View
  //___________________________________________________________________________
  var NewMessageView = Backbone.View.extend({
    el: '#new-message',
    templateSource: $('#new-message-template').html(),
    events: {
      'keypress .new-message-input' : 'keyListener'
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
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.find('.new-message-input textarea').focus()
      return this;
    },

    emptyInput: function () {
      this.$el.find('textarea').val('')
    },

    keyListener: function (event) {
      var messageContent = this.$el.find('textarea').val();
      if (event.which === 13) {
        // halt if field is empty.
        if (messageContent.length === 0) {return false;}

        this.emptyInput()
        // send message
        this.model.sendMessage(messageContent)

        return false;
      }
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

  this.app = window.app != null ? window.app : {}
  this.app.ChannelView = ChannelView;
});