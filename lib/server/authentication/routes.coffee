routes = (app) ->

  app.get '/login', (req, res) ->
    res.render "authentication/login.ejs",
      title: 'Login'

  app.post '/sessions', (req, res) ->
    if 'shep' is req.body.user and '12345' is req.body.password
      req.session.currentUser = req.body.user
      req.flash 'info', "You are logged in as #{req.session.currentUser}"
      res.redirect '/login'
      return
    req.flash 'error', 'Those credentials are incorrect'
    res.redirect '/login'

  app.del '/sessions', (req, res) ->
    req.session.regenerate (err) ->
      req.flash 'info', 'You have been logged out.'
      res.redirect '/login'

module.exports = routes