(function() {

  jQuery(function() {
    now.receiveMessage = function(name, message) {
      var time;
      time = new Date;
      this.template = ($('#message-template')).html();
      $('#chat-log').append(Mustache.render(this.template, {
        name: name,
        message: message,
        time: time.getHours() + ":" + time.getMinutes()
      }));
      return $('#chat-log-container').animate({
        scrollTop: $('#chat-log').height()
      }, 600);
    };
    $("#new-message").live('keypress', function(event) {
      var message;
      message = $("#new-message-input").val();
      if (message.length > 80) $('#new-message-input').attr('rows', 2);
      if (event.which === 13) {
        event.preventDefault();
        if (message.length > 0) {
          now.distributeMessage($("#new-message-input").val());
          return $("#new-message-input").val('').attr('rows', 1);
        }
      }
    });
    return now.name = prompt("What's your name?", "");
  });

}).call(this);
