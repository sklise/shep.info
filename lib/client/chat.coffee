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

# Change the value of now.name and send a message to all other clients
# notifying of name change.
updateName = (raw) ->
  if raw != now.name
    oldname = now.name
    now.name = raw
    now.distributeMessage("#{oldname} is now known as #{now.name}",'Nickname')
    true
  else
    false

# Convert a timestamp into a readable time.
formatTime = (timestamp) ->
  timestamp

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

jQuery ->
  # timestamp, sender, message, destination
  now.receiveSystemMessage = (timestamp, type, message, destination='itp') ->
    @template = $('#message-template').html()
    $('#chat-log').append Mustache.render @template,
      name:type
      message:parseSystemMessage(message)
      time:formatTime(timestamp)
      classes:'system-notice'
  now.receiveChatMessage = (timestamp, sender, message, destination='itp') ->
    @template = $('#message-template').html()
    nowName = @now.name
    # {name, message, time, classes:classifyName(name, now.name)}
    # Render the chat to the browser
    $('#chat-log').append Mustache.render @template,
      name:sender
      message:parseMessage(message)
      time:formatTime(timestamp)
      classes:classifyName(sender, nowName)
    # Scroll the chat log with a slight animation.
    $('#chat-log-container').animate {'scrollTop' : $('#chat-log').height()}, 200

  # Send a new message
  $("#new-message").live 'keypress', (event) ->
    message = $("#new-message-input").val()
    if(message.length > 80)
      $('#new-message-input').attr('rows',2)
    if(event.which == 13)
      event.preventDefault()
      if(message.length > 0)
        now.distributeChatMessage(now.name, $("#new-message-input").val())
        $("#new-message-input").val('').attr('rows',1)

  while now.name == undefined || now.name == ""
    now.name = prompt("What's your name?", "")
    if now.name != undefined || now.name.length > 0
      $('#chat-name').val(now.name)

  $('#chat-name').focusout ->
    updateName ($ this).val()

