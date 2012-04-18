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

  $('.shep-icon').click ->
    now.joinChannel('appnewtech')

  # Renders feedback form to the page prepopulated with current chat name or if
  # the form is already on the page, removes it.
  #
  # Returns nothing.
  $('#feedback-button').click ->
    event.preventDefault()
    $feedbackForm = $('#feedback-form')
    if($feedbackForm.html().length == 0)
      $feedbackForm.append(Mustache.render($('#feedback-form-template').html(), {name:now.name}))
    else
      $feedbackForm.empty()

  # When the "Send Feedback" button is clicked, save the feedback message to
  # Redis and empty the feedback form.
  #
  # Returns nothing.
  $('#feedback-send').live 'click', ->
    event.preventDefault()
    sender = $('#feedback-name').val()
    message = $('#feedback-message').val()
    now.logFeedback sender, message
    $('#feedback-form').empty()

  # $('#user-toggle').click ->
  #   if $('#user-toggle').find('#user-list').length == 0
  #     now.getUserList()
  #     $userList = $('<div/>').attr('id','user-list')
  #     $('#user-toggle').append($userList)
  #     names= ""
  #     _.each now.userList, (name) ->
  #       names+= '<li>'+name+'</li>'
  #     $userList.html('<ul>'+names+'</ul>').css('width',$('#user-toggle').width());
  #   else
  #     $('#user-list').remove();

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
