(function() {
  var Helpers, _ref;

  Helpers = {
    formatTime: function(timestamp) {
      var hours, marker, minutes, time;
      time = new Date(timestamp);
      hours = time.getHours();
      minutes = time.getMinutes();
      marker = hours >= 12 ? 'P' : 'A';
      minutes = minutes > 9 ? minutes : '0' + minutes;
      hours = hours > 12 ? hours - 12 : hours;
      return "" + hours + ":" + minutes + marker;
    }
  };

  this.app = (_ref = window.app) != null ? _ref : {};

  this.app.Helpers = Helpers;

}).call(this);
