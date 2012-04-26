# Input name of the sender of a message and the value of now.name
# Returns a string of classes to change styling of the message.
classifyName = (senderName, nowName) ->
  classes = []
  if senderName == nowName
    classes.push 'self'
  else if senderName == 'shep' || senderName == 'shepbot'
    classes.push 'shep'
  if $('.chat-log li').last().find('.chatter').text() == senderName
    classes.push 'consecutive'
  classes.join(' ')

renderMessage = (template, timestamp, sender, message, classes='') ->
  @template = template
  # Render the chat to the browser
  $('.chat-log').append Mustache.render @template,
    name:sender
    message:window.app.Helpers.parseMessage(message)
    time:window.app.Helpers.formatTime(timestamp)
    classes:classes
  # Scroll the chat log with a slight animation.
  $('.chat-log-container').animate {'scrollTop' : $('.chat-log').height()}, 200
  true

jQuery ->
  # This is called from the server on nick changes and part/leave events.
  # The user list is cleared and re-rendered with an updated list.
  now.updateUserList = (channel, nicks) ->
    $('#user-list').empty()
    for name, value of nicks
      $('#user-list').append("<li>#{name}</li>")
      true

  now.receivePreviousMessage = (timestamp, sender, message, destination='itp') ->
    if sender in ['Join', 'Leave']
      renderMessage $('#system-message-template').html(), timestamp, sender, message, 'system-notice previous-message'
    else
      renderMessage $('#message-template').html(), timestamp, sender, message, "#{classifyName(sender, @now.name)} previous-message"

  now.receiveSystemMessage = (timestamp, type, message, destination='itp') ->
    renderMessage $('#system-message-template').html(), timestamp, type, message, 'system-notice'

  now.receiveChatMessage = (timestamp, sender, message, destination='itp') ->
    triggerBlink() if windowBlurred
