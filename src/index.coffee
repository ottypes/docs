
register = (type) ->
  exports[type.name] = type
  exports[type.uri] = type if type.uri

# Import all the built-in types. Requiring directly for browserify.
register require './simple'

register require './text'
register require './text-tp2'

register require './json0'

