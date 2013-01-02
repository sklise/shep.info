$(document).ready(function () {
  // APP VIEW
  //___________________________________________________________________________
  var AppView = Backbone.View.extend({
    el: '#wrapper',

    initialize: function (options) {
      this.collection.bind('change:channel', this.render, this)

      this.subviews = {
        feedback: new FeedbackView(),
        channel: new app.ChannelView({collection: this.collection})
        //menu: new MenuView({collection: this.collection}),
      }

      this.bindToWindowResize();
    },

    events: {
      'keypress .nickname-input' : 'nicknameListener',
      'click .nickname-submit' : 'saveNickname'
    },

    render: function () {
      return this;
    },

    // Bind window resize event
    bindToWindowResize: function () {
      app.Helpers.fitHeight($(window).height());
      $(window).bind('resize', function () {
        app.Helpers.fitHeight($(this).height());
      });
    },

    openSocket: function (nickname) {
      window.socket = io.connect('/');

      var channels = this.collection

      socket.emit('setNickname', {nickname: nickname});

      socket.on('message', function (data) {
        console.log('message', data)
        var thisChannel = _.find(channels.models, function (channel) {
          console.log(channel.get('name'), data.channel, channel.get('name') === data.channel)
          return channel.get('name') === data.channel
        })

        thisChannel.get('messages').add(data)
      });

      socket.on('disconnect', function (data) {
        console.log('disconnect', data);
      });
    },

    nicknameListener: function (event) {
      nicknameVal = $(event.target).val()
      if (nicknameVal.length >= 3 && nicknameVal.length <= 10) {
        if (event.keyCode === 13) {
          this.saveNickname()
        }
        app.Helpers.ignoreKeys(event, [32], 10);
      }
    },

    saveNickname: function () {
      var nickname = this.$el.find('.nickname-input').val()
      this.openSocket(nickname);
      this.collection.forEach(function (channel) {
        channel.set('nickname', nickname);
      });
      this.subviews.channel.render().el
    }
  });

  // Feedback Form
  //___________________________________________________________________________
  var FeedbackView = Backbone.View.extend({
    el: '#feedback-box',

    events: {
      'click .feedback-button': 'toggleForm',
      'click .feedback-send': 'sendFeedback'
    },

    initialize: function (options) {
      this.render().el;
    },

    templateSource: $('#feedback-template').html(),

    render: function () {
      this.template = Handlebars.compile(this.templateSource);
      $(this.el).append(this.template());
      return this;
    },

    // Renders feedback form to the page prepopulated with urrent chat name or if the form is already on the page, removes it.
    toggleForm: function (event) {
      var $feedbackForm = $('#feedback-form');
      if ($feedbackForm.html().length === 0) {
        $feedbackForm.append(Mustache.render($('#feedback-form-template').html(), {
          name: now.name
        }));
      } else {
        $feedbackForm.empty();
      }
      return false;
    },

    // When the "Send Feedback" button is clicked, save the feedback message to
    // Redis and empty the feedback form.
    sendFeedback: function (event) {
      var sender = $('#feedback-name').val();
      var message = $('#feedback-message').val();
      now.logFeedback(sender, message);
      $('#feedback-form').empty();
      return false;
    }
  });

  this.app = window.app != null ? window.app : {}
  this.app.AppView = AppView;
})
