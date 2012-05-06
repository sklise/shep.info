# Empty now functions to be overwritten when other views are initiated.
now.badNickname = () -> return
now.updateUserList = () -> return
now.receiveChannels = () -> console.log("receiveChannels")
now.receivePreviousMessage = () -> return
now.receiveSystemMessage = () -> return
now.receiveChatMessage = () -> return

jQuery ->
  class AppView extends Backbone.View
    el: '#content'
    initialize: (options) ->
      # @collection.bind 'reset', @render, @
      @feedbackview = new FeedbackView
      @chatwindowview = new ChatWindowView
    render: ->
      @feedbackview.render().el
      @

  # Feedback Form
  #---------------------------------------------------
  class FeedbackView extends Backbone.View
    el: '#feedback-box'
    events:
      'click .feedback-button' : 'toggleForm'
      'click .feedback-send' : 'sendFeedback'
    initialize: (options) ->
      return
    template: $('#feedback-template').html()
    render: ->
      $(@el).append Mustache.render(@template, {})
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
    el: '#chat-window'
    template: $('#chat-window-template').html()
    initialize: (options) ->
      @initializeSubViews()
      @linkToNow()
      @bindToWindowResize()
    render: ->
      $(@el).html(Mustache.render(@template))
      app.Helpers.fitHeight()
      @
    initializeSubViews: ->
      @newmessageview = new NewMessageView
      @channelsview = new ChannelsView collection: app.Channels
      @userListView = new UserListView collection: app.Users
      @messagesview = new MessagesView collection: app.Messages
    # Bind window resize event 
    bindToWindowResize: ->
      $(window).bind 'resize', -> app.Helpers.fitHeight($(this).height())

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
            @initializeSubViews()
            @saveNameFromPrompt()
      # Disable OK button and remove the cancel button
      namePrompt.el.find('.ok')
        .attr('disabled','disabled').end()
        .find('.cancel').remove()

      $input = $(namePrompt.el).find('input')
      # Focus the cursor on the text input.
      $input.focus()
      $input.keydown (event) =>
        # Prevent names longer than 20 characters and prohibit spaces
        @origVal = $input.val().trim()
        if event.keyCode is 32 || @origVal.length >= 20
          return false
        # Handle keyboard events for the chat name input.
        # Require names to be at least 4 characters
        if @origVal.length > 3
          namePrompt.el.find('.ok').removeAttr('disabled')
          if event.keyCode is 13
            namePrompt.emit('ok')
            namePrompt.hide()
            namePrompt.callback(true)
        else
          namePrompt.el.find('.ok').attr('disabled','disabled')
    saveNameFromPrompt: ->
      $('.chat-name').val(@origVal)
      now.changeName @origVal
      now.name = @origVal
    linkToNow: ->

      # Server: Called from the server in the context of the user when login to
      # IRC is complete. Renders prompt to set @now.name
      now.triggerIRCLogin = (returningUser) =>
        if returningUser
          @render().el
          @initializeSubViews()
        else
          @promptUserName()

  # USER LIST VIEW
  #---------------------------------------------------
  class UserListView extends Backbone.View
    el: '#user-list'
    initialize: (options) ->
      @linkToNow()
      @collection.bind 'add', @render, @
      app.Messages.bind 'change:channel', @render, @
    render: ->
      $(@el).empty()
      for user in @collection.thisChannel()
        $(@el).append("<li>#{user.get('name')}</li>")
      @
    resetChannel: (channel, callback) ->
      for user in @collection.thatChannel(channel)
        if user? and user.get('channel') is channel
          @collection.remove(user)
      callback()
    linkToNow: ->
      # This is called from the server on nick changes and part/leave events.
      # The user list is cleared and re-rendered with an updated list.
      now.updateUserList = (channel, nicks) =>
        @resetChannel channel, =>
          for nick, value of nicks
            @collection.add(new app.User({name:nick, channel:channel}))
          return

  # MESSAGE VIEW
  #---------------------------------------------------
  # Individual message view. Sets the template based on the value of model.type
  class MessageView extends Backbone.View
    tagName: 'li'
    template: $('#message-template').html()
    render: ->
      @template = $("##{@model.get('type')}-message-template").html()
      message = @model.toJSON()
      message.time = app.Helpers.formatTime(@model.get('time'))
      $(@el).addClass('consecutive') if @model.get('consecutive')
      $(@el).addClass(@model.get('classes')).html Mustache.render(@template, message)
      @

  # CHAT LOG VIEW
  #---------------------------------------------------
  class MessagesView extends Backbone.View
    el: '#chat-log-container'
    template: $('#messages-template').html()
    initialize: (options) ->
      @linkToNow()
      @render().el
      @collection.bind 'add', @renderLast, @
      @collection.bind 'add', @scrollToBottom, @
      @collection.bind 'change:channel', @render, @

    linkToNow: ->
      # TODO: IS THIS WORKING? I DON'T BELIEVE SO
      now.receivePreviousMessage = (timestamp, sender, message, destination='itp') ->
        console.log "crap"
        # if sender in ['Join', 'Leave']
          # renderMessage $('#system-message-template').html(), timestamp, sender, message, 'system-notice previous-message'
        # else
          # renderMessage $('#message-template').html(), timestamp, sender, message, "#{classifyName(sender, @now.name)} previous-message"
        # @collection.add new app.Message
          # message: message
          # name: sender
          # time: app.Helpers.formatTime(timestamp)
          # classes: classes
          # type: 'previous'
      # Server: Called from server and defined on client. Receives a system
      # message most likely from IRC and adds to the collection.
      now.receiveSystemMessage = (timestamp, type, message, destination='itp') =>
        @collection.add new app.Message
          channel: destination
          message: message
          time: timestamp
          classes:'system-notice'
          type:'system'
      # Server: Called from server and defined on client. Receivees a message
      # from IRC and adds a new Message to this view's collection.
      now.receiveChatMessage = (timestamp, sender, message, destination='itp') =>
        # TODO $('#chat-log-container').animate {'scrollTop' : $('.chat-log').height()}, 200
        app.Helpers.triggerBlink() if window.windowBlurred
        @collection.add new app.Message
          channel: destination
          name: sender
          message: app.Helpers.parseMessage(message)
          time: timestamp
          classes: "#{@classifyName(sender, now.name)}"
          type:'chat'
          consecutive: @isConsecutive(sender)

    # Input name of the sender of a message and the value of now.name
    # Returns a string of classes to change styling of the message.
    classifyName: (senderName, nowName) ->
      classes = []
      if senderName == nowName
        classes.push 'self'
      else if senderName == 'shep' || senderName == 'shepbot'
        classes.push 'shep'
      classes.join(' ')

    isConsecutive: (sender) ->
      messages = ""
      if @collection.thisChannel().length > 0
        messages = @collection.thisChannel()
        if messages[messages.length-1].get('name') == sender
          return true
        else
          return false
      else
        return false

    scrollToBottom: (isOverride) ->
      lastMessage = ($('.chat-log li').last().height() || 30) + 4
      if $('#chat-log-container').scrollTop() + $('#chat-log-container').height() - $('.chat-log').height() > -lastMessage || isOverride is true
        $('#chat-log-container').scrollTop $('.chat-log').height()

    renderLast: (message) ->
      if message.get('channel') is app.Messages.channel
        messageView = new MessageView model: message
        @$('.chat-log').append messageView.render().el

    render: ->
      $(@el).html(Mustache.render(@template))
      for message in @collection.thisChannel()
        @renderLast message
      app.Helpers.fitHeight()
      @scrollToBottom(true)
      @

  # NEW MESSAGE VIEW
  #---------------------------------------------------
  class NewMessageView extends Backbone.View
    el: '#new-message'
    template: $('#new-message-template').html()
    events:
      'blur .chat-name' : 'updateName'
      'keypress .chat-name' : 'ignoreKeys'
      'keyup .new-message-input' : 'resizeInput'
      'paste .new-message-input' : 'resizeInput'
      'cut .new-message-input' : 'resizeInput'
      'keypress .new-message-input' : 'sendMessage'
    initialize: (options) ->
      @linkToNow()
      @render().el
    linkToNow: ->
      # Called from the server in the context of the userwhen IRC forces a nickname
      # change. Updates now.name and renders the new name in the chat.
      now.serverChangedName = (name) ->
        now.name = name
        $('.chat-name').val(name)
      now.badNickname = (args) ->
        $('.chat-name').val(args[0])
        now.name = args[0]
        new ui.Dialog({ title: 'Bad Nickname', message: "The chat server doesn't like your new nickname." })
                .show()
                .hide(2000);
    render: ->
      $(@el).html Mustache.render(@template, {name : now.name})
      @
    ignoreKeys: (e) ->
      if e.keyCode is 13 or e.keyCode is 32
        return false
      else if $(e.target).val().length >= 20
        return false
      else
        return true

    resizeInput: (e) ->
      message = $(e.target).val()
      messageDec = (ml) ->
        if ml <= 78
          return 1
        else
          return (ml / 78)
      rows = Math.min(5, Math.ceil(messageDec(message.length)))
      $(e.target).attr('rows', rows)

    sendMessage: (e) ->
      message = $(e.target).val().trim()
      if e.which is 13
        return false if message.length is 0
        now.distributeChatMessage(now.name, app.Messages.channel, message)
        $(e.target).val('').attr('rows', 1)
        return false

    # Change the value of now.name and send a message to all other clients
    # notifying of name change.
    updateName: (e) ->
      raw = $(e.target).val()
      if raw != now.name
        now.changeName(now.name = raw)
        true
      else
        false

  # CHANNELS VIEW
  #---------------------------------------------------
  # Toolbar of current channels as well as menu to create and join more.
  class ChannelsView extends Backbone.View
    el: '#chat-toolbar'
    template: $('#channels-template').html()
    events:
      'click .channel-menu-button' : 'toggleMenu'
    initialize: (options) ->
      @render().el
      # @attachMenu()

      now.receiveChannels = (channels) =>
        @collection.reset()
        @collection.add(new app.Channel({name:'Shep', isShep:true}))
        for name, channel of channels
          console.log name
          channel.name = name[1..]
          @collection.add(new app.Channel(channel))

      app.Channels.bind 'change:channel', @render, @
      app.Channels.bind 'add', @render, @
      app.Channels.bind 'remove', @render, @

    render: ->
      $(@el).html Mustache.render(@template)
      for channel in @collection.models
        channelView = new ChannelView model: channel
        @$('.chat-room-list').prepend channelView.render().el
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

  class ChannelView extends Backbone.View
    tagName: 'li'
    template: $('#channel-template').html()
    events:
      'click' : 'goToChannel'
      # 'mouseenter' : 'showX'
      # 'mouseleave' : 'hideX'
      # 'click .exitable-room' : 'leaveChannel'
    initialize: (options) ->
      @model.bind 'change', @render, @
      app.Messages.bind 'change:channel', @render, @
      @render().el
    render: ->
      if @model.get('name') is app.Messages.channel
        $(@el).addClass('current-channel')
      else
        $(@el).removeClass('current-channel')
      $(@el).html Mustache.render(@template, @model.toJSON())
      @
    leaveChannel: ->
      # Send a request to leave the channel
      now.leaveChannel(@model.get('name'))
      console.log "remove"
      # Navigate to another channel if this is the active channel
      if app.Messages.channel is @model.get('name')
        app.Messages.setChannel('itp')
      @remove()
    goToChannel: ->
      now.getChannel(@model.get('name'))
      for channel in app.Channels.models
        channel.set 'currentChannel', (if @model.get('name') is channel.get('name') then true else false)
      app.Messages.setChannel @model.get('name')
    # showX: -> @$('.room-status-icon').text('*') if @model.get('exitable')
    # hideX: -> @$('.room-status-icon').html('<img src="http://shep.info.s3.amazonaws.com/236.png">')

    # When a room-status-icon is clicked call a function on the server to leave
    # the channel on IRC.
    # leaveChannel: ->
    #   channelName = $(this).closest('li').data('channel-name')
    #   new ui.Confirmation({ title: "Leave #{channelName} channel", message: 'are you sure?' })
    #     .show (ok) =>
    #       if ok
    #         $(@).closest('li').remove()
    #         ui.dialog('Seeya!').show().hide(1500)
    #   return
    # Change the icon when rolling over exitable channels

  @app = window.app ? {}
  @app.AppView = AppView
  @app.ChatWindowView = ChatWindowView
  @app.ChannelView = ChannelView
  @app.ChannelsView = ChannelsView