# Input name of the sender of a message and the value of now.name
# Returns a string of classes to change styling of the message.
classifyName = (senderName, nowName) ->
  classes = []
  if senderName == nowName
    classes.push 'self'
  else if senderName == 'shep' || senderName == 'shepbot'
    classes.push 'shep'
  if $('#chat-log li').last().find('.chatter').text() == senderName
    classes.push 'consecutive'
  classes.join(' ')

# System messages are nicer than chat messages
parseSystemMessage = (message) ->
  message

# Clean message content to make it safe and wrap links in anchor tags.
parseMessage = (message) ->
  message
    # Escape html tags
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    # Bold text wrapped in double asterisks
    .replace /\*{2}([^\*]+)\*{2}/g, (match) ->
      "<strong>#{match[2..(match.length-3)]}</strong>"
    # Italicize text wrapped in asterisks
    .replace /\*{1}([^\*]+)\*{1}/g, (match) ->
      "<em>#{match[1..(match.length-2)]}</em>"
    # Find any http(s) strings and wrap them with <a> tags.
    .replace /(http[s]*:\/\/\S+)/g, (match) ->
      "<a href='#{match}' target='_blank'>#{match}</a>"

renderMessage = (template, timestamp, sender, message, classes='') ->
  @template = template
  # Render the chat to the browser
  $('#chat-log').append Mustache.render @template,
    name:sender
    message:parseMessage(message)
    time:window.app.Helpers.formatTime(timestamp)
    classes:classes
  # Scroll the chat log with a slight animation.
  $('#chat-log-container').animate {'scrollTop' : $('#chat-log').height()}, 200
  true

jQuery ->
  windowBlurred = false
  pageIsBlinking = false
  pageTitle = $(document).attr('title')
  titleFlash = ''

  triggerBlink= ->
    if not pageIsBlinking
      pageIsBlinking = true
      titleFlash = setInterval (-> blinkTitle()), 1500

  $(window).blur ->
    windowBlurred = true

  $(window).focus -> unBlinkTitle()

  unBlinkTitle = ->
    pageIsBlinking = false
    windowBlurred = false
    clearInterval(titleFlash)
    $(document).attr('title', pageTitle)

  blinkTitle = ->
    $doc = $(document)
    docTitle = $doc.attr('title')
    if docTitle == pageTitle
      $doc.attr('title', "New Message #{pageTitle}")
    else
      $doc.attr('title', pageTitle)
    return

  # This is called from the server on nick changes and part/leave events.
  # The user list is cleared and re-rendered with an updated list.
  now.updateUserList = (channel, nicks) ->
    $('#user-list').empty()
    for name, value of nicks
      $('#user-list').append("<li>#{name}</li>")
      true

  # Called from the server in the context of the userwhen IRC forces a nickname
  # change. Updates now.name and renders the new name in the chat.
  now.serverChangedName = (name) ->
    now.name = name
    $('.chat-name').val(name)

  # Called from the server in the context of the user when login to IRC is
  # complete. Renders the messages view.
  now.triggerIRCLogin = ->
    app.MessagesView.promptUserName()

  now.receivePreviousMessage = (timestamp, sender, message, destination='itp') ->
    if sender in ['Join', 'Leave']
      renderMessage $('#system-message-template').html(), timestamp, sender, message, 'system-notice previous-message'
    else
      renderMessage $('#message-template').html(), timestamp, sender, message, "#{classifyName(sender, @now.name)} previous-message"

  now.receiveSystemMessage = (timestamp, type, message, destination='itp') ->
    renderMessage $('#system-message-template').html(), timestamp, type, message, 'system-notice'

  now.receiveChatMessage = (timestamp, sender, message, destination='itp') ->
    triggerBlink() if windowBlurred
    renderMessage $('#message-template').html(), timestamp, sender, message, classifyName(sender, @now.name)
