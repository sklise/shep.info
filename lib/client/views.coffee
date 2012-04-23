jQuery ->
  class AppView extends Backbone.View
    el: '#content'
    initialize: (options) ->
      # @collection.bind 'reset', @render, @
      @feedbackview = new FeedbackView
      @messagesview = new MessagesView collection: app.Messages
    render: ->
      @feedbackview.render().el
      @

  # Feedback Form
  #---------------------------------------------------
  class FeedbackView extends Backbone.View
    events:
      'click .feedback-button' : 'toggleForm'
      'click .feedback-send' : 'sendFeedback'

    initialize: (options) ->
      return
    template: $('#feedback-template').html()
    render: ->
      $('.introduction').append Mustache.render(@template, {})
      @

    # Renders feedback form to the page prepopulated with current chat name or if
    # the form is already on the page, removes it.
    toggleForm: (e) ->
      $feedbackForm = $('#feedback-form')
      if($feedbackForm.html().length == 0)
        $feedbackForm.append(Mustache.render($('#feedback-form-template').html(), {name:now.name}))
      else
        $feedbackForm.empty()
      return false

    # When the "Send Feedback" button is clicked, save the feedback message to
    # Redis and empty the feedback form.
    sendFeedback: (e) ->
      sender = $('#feedback-name').val()
      message = $('#feedback-message').val()
      now.logFeedback sender, message
      $('#feedback-form').empty()
      return false

  # Chat Window
  #---------------------------------------------------
  # This view holds chat toolbar, chat log, user list and new message
  # views. Call routing functions on this view and have the events 
  # propagate through.
  class ChatWindowView extends Backbone.View
    

  # Channels View
  #---------------------------------------------------
  # Toolbar of current channels as well as menu to create and join more.
  class ChannelsView extends Backbone.View
    template: $('#channels-template').html()
    events:
      'click .channel-tab' : 'goToChannel'
    goToChannel: ->
      return

  class ChannelView extends Backbone.View
    template: $('#channel-template').html()

  # Message
  #---------------------------------------------------
  # Individual message view. Sets the template based on the value of model.type
  class MessageView extends Backbone.View
    className: 'message'
    tagName: 'li'
    template: $('#message-template').html()
    render: ->
      @template = ($("##{@model.get(type)}-message-template").html())
      $(@el).html Mustache.render(@template, @model.toJSON())
      @

  # Chat Log
  #---------------------------------------------------
  class MessagesView extends Backbone.View
    el: '#chat-window'
    template: $('#chat-window-template').html()
    events:
      # Only works with classes it seems.
      'click .exitable-room' : 'leaveChannel'
      'mouseenter .exitable-room' : 'showX'
      'mouseleave .exitable-room' : 'hideX'
      'blur .chat-name' : 'updateName'
      'keyup .new-message-input' : 'resizeInput'
      'paste .new-message-input' : 'resizeInput'
      'cut .new-message-input' : 'resizeInput'
      'keypress .new-message-input' : 'sendMessage'
      'click .channel-menu-button' : 'toggleMenu'
    initialize: (options) ->
      # Bind the window reaize event to call fitHeight.
      view = @
      $(window).bind 'resize', -> view.fitHeight($(this).height())
      @attachMenu();
    render: ->
      $(@el).empty().html(Mustache.render(@template), {name: now.name})
      @fitHeight $(window).height()
      @
    attachMenu: ->
      @menu = ui.menu()
        .add('Add Channel...')
    toggleMenu: (e) ->
      $menuButton = $('.channel-menu-button')
      menuButtonDim = {width: $menuButton.width(), height: $menuButton.outerHeight()}
      if e.target.className is "room-menu-icon pictos"
        padding = ($menuButton.outerWidth() - $menuButton.width()) / 2
        @menu.moveTo(e.pageX - e.offsetX - padding, menuButtonDim.height)
      else
        @menu.moveTo(e.pageX - e.offsetX, menuButtonDim.height)
      @menu.show()
      return false
    # Stretch the chat window to fill the height of the window.
    fitHeight: (windowHeight) ->
      toolbarHeight = $('#chat-toolbar').height()
      $('#chat-window').css('height', (windowHeight) + 'px')
      chatWindowHeight = windowHeight - toolbarHeight
      chatInterior = chatWindowHeight - @$('#new-message').height() + 14
      @$('#chat-log-container').height(chatInterior)
      @$('#chat-log').css('min-height', chatInterior)

    # Displays a modal dialog asking for a chat name. Requires minimum length
    # of four characters and maximum of 20. Sets submitted value to now.name.
    promptUserName: ->
      # Create a new ui.Confirmation
      namePrompt = new ui.Confirmation(
        title: "Please enter a name."
        message: $('<p>No spaces, names must be between<br>4 and 20 characters. </p><input tabindex="1" type="text">'))
        .modal()
        .show (ok) =>
          if ok
            @render().el
            name = $('#dialog').find('input').val().trim()
            $('.chat-name').val(name)
            now.changeName name
      # Disable OK button and remove the cancel button
      namePrompt.el.find('.ok').attr('disabled','true').end().find('.cancel').remove()

      $input = $(namePrompt.el).find('input')
      # Focus the cursor on the text input.
      $input.focus()
      # No spaces in the name.
      $input.keydown (event) ->
        if event.keyCode is 32
          return false
      # Handle keyboard events for the chat name input.
      $input.keypress (event) =>
        origVal = $input.val().trim()
        # Prevent names longer than 20 characters
        if origVal.length >= 20
          return false
        # Require names to be at least 3 characters
        if origVal.length > 3
          if event.keyCode is 13
            namePrompt.emit('ok')
            namePrompt.callback(true)
            namePrompt.hide()
          namePrompt.el.find('.ok').removeAttr('disabled')
        else
          namePrompt.el.find('.ok').attr('disabled','disabled')
      #     $('#chat-name').val(now.name)

    # NEW MESSAGE
    #-------------------------------------------------

    resizeInput: (e) ->
      message = $(e.target).val()
      if message.length > 80
        $(e.target).attr('rows', 2)
      else
        $(e.target).attr('rows', 1)

    sendMessage: (e) ->
      message = $(e.target).val().trim()
      if e.which is 13
        return false if message.length is 0
        now.distributeChatMessage(now.name, message)
        $(e.target).val('').attr('rows', 1)
        return false

    # Change the value of now.name and send a message to all other clients
    # notifying of name change.
    updateName: (e) ->
      raw = $(e.target).val()
      if raw != now.name
        oldname = now.name
        now.name = raw
        now.changeNick oldname, now.name
        true
      else
        false

    # MOVE THE FOLLOWING TO THE TOOLBAR VIEW WHEN I MAKE IT
    #-------------------------------------------------

    # Change the icon when rolling over exitable channels
    showX: (e) -> $(e.target).text('*')
    hideX: (e) -> $(e.target).text('q')

    # When a room-status-icon is clicked call a function on the server to leave
    # the channel on IRC.
    leaveChannel: ->
      channelName = $(this).closest('li').data('channel-name')
      new ui.Confirmation({ title: "Leave #{channelName} channel", message: 'are you sure?' })
        .show (ok) =>
          if ok
            $(@).closest('li').remove()
            ui.dialog('Seeya!').show().hide(1500)

  @app = window.app ? {}
  @app.AppView = AppView
  @app.MessagesView = new MessagesView