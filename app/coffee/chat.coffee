jQuery ->
  now.receiveMessage = (name, message) ->
    time = new Date
    @template = ($ '#message-template').html()
    $('#chat-log').append Mustache.render(@template, {name:name, message:message, time:(time.getHours() + ":" + time.getMinutes())})
    $('#chat-log-container').animate({scrollTop: $('#chat-log').height()}, 600)

  $("#new-message").live 'keypress', (event) ->
    message = $("#new-message-input").val()
    if(message.length > 80)
      $('#new-message-input').attr('rows',2)
    if(event.which == 13)
      event.preventDefault()
      if(message.length > 0)
        now.distributeMessage($("#new-message-input").val())
        $("#new-message-input").val('').attr('rows',1)
    
  now.name = prompt("What's your name?", "")
