(function() {
  var helpers = function(app) {
    app.dynamicHelpers({
      flash: function(req, res) {
        return req.flash();
      }
    });

    app.helpers({
      setTimestamp: function() {
        return Date.now();
      }
    });
  };

  module.exports = helpers;
}).call(this);
