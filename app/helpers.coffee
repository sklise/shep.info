helpers = (app) ->
  app.dynamicHelpers
    flash: (req, res) ->
      req.flash()

  app.helpers
    setTimestamp: ->
      Date.now()

module.exports = helpers
