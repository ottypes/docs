// This is included after the JS for each type when we build for the web.

  var _types = window.ottypes = window.ottypes || {};
  var _t = module.exports;
  _types[_t.name] = _t;

  if (exports.uri) _types[exports.uri] = _t;
})();

