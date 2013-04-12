register = (file) ->
  type = require file
  exports[type.name] = type
  exports[type.uri] = type if type.uri

# Import all the built-in types.
register './simple'

register './text'
register './text-tp2'

register './json0'

