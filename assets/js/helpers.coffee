jQuery ->
  window.windowBlurred = false
  window.pageIsBlinking = false
  window.pageTitle = $(document).attr('title')
  window.titleFlash = ''

  $(window).blur ->
    window.windowBlurred = true

  $(window).focus -> Helpers.unBlinkTitle()

Helpers =

  ignoreKeys: (event, keys, max) ->
    if event.keyCode in keys
      return false
    else if max? and  $(event.target).val().length >= max
      return false
    else
      return true

  # Stretch the chat window to fill the height of the window.
  fitHeight: (windowHeight=$(window).height()) ->
    toolbarHeight = $('#chat-toolbar').height()
    $('#chat-window').css('height', windowHeight + 'px')
    $('#menu-window').css('height', windowHeight + 'px')
    chatWindowHeight = windowHeight - toolbarHeight
    chatInterior = chatWindowHeight - $('#new-message').height() + 14
    $('#chat-log-container').height(chatInterior)
    $('.chat-log').css('min-height', chatInterior)

  unBlinkTitle: ->
    window.pageIsBlinking = false
    window.windowBlurred = false
    clearInterval(window.titleFlash)
    $(document).attr('title', window.pageTitle)

  blinkTitle: ->
    $doc = $(document)
    docTitle = $doc.attr('title')
    if docTitle == pageTitle
      $doc.attr('title', "New Message #{pageTitle}")
    else
      $doc.attr('title', window.pageTitle)
    return

  triggerBlink: ->
    if not pageIsBlinking
      window.pageIsBlinking = true
      window.titleFlash = setInterval (=> @blinkTitle()), 1500

  # Convert a timestamp into a readable time.
  formatTime: (timestamp) ->
    time = new Date(timestamp)
    hours = time.getHours()
    minutes = time.getMinutes()
    marker = if hours >= 12 then 'P' else 'A'
    minutes = if minutes > 9 then minutes else '0' + minutes
    hours = if hours > 12 then hours - 12 else hours
    "#{hours}:#{minutes}#{marker}"

  # Clean message content to make it safe and wrap links in anchor tags.
  parseMessage: (message) ->
    message
      # Escape html tags
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
      # Bold text wrapped in double asterisks
      .replace /~([^~]+)~/g, (match) ->
        "<span style='font-family:\"Comic Sans\",\"Marker Felt\";'>#{match[1..match.length-2]}</span>"
      .replace /\*{2}([^\*]+)\*{2}/g, (match) ->
        "<strong>#{match[2..(match.length-3)]}</strong>"
      # Italicize text wrapped in asterisks
      .replace /\*{1}([^\*]+)\*{1}/g, (match) ->
        "<em>#{match[1..(match.length-2)]}</em>"
      # Find any http(s) strings and wrap them with <a> tags.
      .replace /(http[s]*:\/\/\S+)/g, (match) ->
        "<a href='#{match}' target='_blank'>#{match}</a>"

@app = window.app ? {}
@app.Helpers = Helpers
