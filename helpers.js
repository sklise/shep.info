(function() {

  exports.setTimestamp = function() {
    return Date.now();
  };

  exports.mustache_template = {
    compile: function(source, options) {
      if (typeof source === 'string') {
        return function(options) {
          options.locals = options.locals || {};
          options.partials = options.partials || {};
          if (options.body) locals.body = options.body;
          return mustache.to_html(source, options.locals, options.partials);
        };
      } else {
        return source;
      }
    },
    render: function(template, options) {
      template = this.compile(template, options);
      return template(options);
    }
  };

}).call(this);
