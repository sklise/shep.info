routes = (app) ->
  # ROUTES
  #-----------------------------------------------------
  app.get '/', (req, res) ->
    req.session.httpOnly=false
    res.render 'index.ejs',
      title: "Shep"

  app.get '/help', (req, res) ->
    res.render 'index.ejs',
      title: "Shep ☞ Help"

  app.get '/channels/:name', (req, res) ->
    res.render 'index.ejs',
      title: "Shep ☞ #{req.params.name}"

module.exports = routes