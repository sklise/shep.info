(function () {
  var Message = Backbone.Model.extend({
    defaults: {
      type: 'Chat',
      is_shep: false,
      is_self: false,
      consecutive: false },

    initialize: function () {
      var lengthOfMessages = this.collection.models.length;

      if (lengthOfMessages >= 1) {
        var previousMessage = this.collection.models[lengthOfMessages - 1]
        if (previousMessage.get('nickname') === this.get('nickname')) {
          this.set('consecutive', true);
        }
      }

      if (this.get('nickname') === "shep") {
        this.set('is_shep', true);
      }

      if (this.get('nickname') === $('body').data().nickname) {
        this.set('is_self', true);
      }
    }
  });

  this.app = window.app != null ? window.app : {};
  this.app.Message = Message;
}).call(this);