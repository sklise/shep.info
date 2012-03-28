exports.setTimestamp = ->
  Date.now()

# MUSTACHE FOR EXPRESS
#-----------------------------------------------------
# Adapted to coffeescript from:
# http://bitdrift.com/post/2376383378/using-mustache-templates-in-express
exports.mustache_template =
  compile: (source, options) ->
    if (typeof source == 'string')
      (options) ->
        options.locals = options.locals || {}
        options.partials = options.partials || {}
        if (options.body) # for express.js > v1.0
          locals.body = options.body
        mustache.to_html(source, options.locals, options.partials)
    else
      source
  render: (template, options) ->
    template = this.compile(template, options)
    template(options)
