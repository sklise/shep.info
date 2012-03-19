jQuery ->
  now.receiveMessage = (name, message) ->
    time = new Date
    time = time.getHours() + ":" + time.getMinutes()
    @template = $('#message-template').html()

    # TODO: Improve bold/italic, complex nestings break.
    message = message
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
    # Set the whois attribute based on self or shep.
    classifyName = (senderName, nowName) ->
      classes = []
      if senderName == nowName
        classes.push 'self'
      else if senderName == 'shep' || senderName == 'shepbot'
        classes.push 'shep'
      if $('#chat-log li').last().find('.chatter').text() == senderName
        classes.push 'consecutive'
      classes.join(' ')
    # Render the chat to the browser
    $('#chat-log').append Mustache.render @template, {name, message, time, classes:classifyName(name, now.name)}
    # Scroll the chat log with a slight animation.
    $('#chat-log-container').animate {'scrollTop' : $('#chat-log').height()}, 200

  $("#new-message").live 'keypress', (event) ->
    message = $("#new-message-input").val()
    if(message.length > 80)
      $('#new-message-input').attr('rows',2)
    if(event.which == 13)
      event.preventDefault()
      if(message.length > 0)
        now.distributeMessage($("#new-message-input").val())
        $("#new-message-input").val('').attr('rows',1)
    
  while now.name == undefined || now.name == ""
    now.name = prompt("What's your name?", "")
