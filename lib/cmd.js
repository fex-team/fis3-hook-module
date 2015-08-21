var amd = require('./amd.js');
var lang = fis.compile.lang;
var rRequire = /"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(\/\/[^\r\n\f]+|\/\*[\s\S]+?(?:\*\/|$))|\b(require\.async|seajs\.use)\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|\[[\s\S]*?\])\s*/g;


var cmd = module.exports = function(info, conf) {
  var file = info.file;

  conf.skipBuiltinModoules = true;
  
  // 先进行 amd 解析，基本上一致的，除了 seajs.use 和 require.async
  try {
    amd.apply(amd, arguments);
  } catch (e) {
    fis.log.warn('Got Error: %s while parse [%s].', e.message, file.subpath);
    fis.log.debug(e.stack);
  }

  var content = info.content;
  

  info.content = content.replace(rRequire, function(m, comment, type, params) {
    if (type) {
      switch (type) {
        case 'require.async':
          var info = parseParams(params);

          m = 'require.async([' + info.params.map(function(v) {
            var type = lang.jsAsync;
            return type.ld + v + type.rd;
          }).join(',') + ']';
          break;

        case 'seajs.use':
          var info = parseParams(params);
          var hasBrackets = info.hasBrackets;

          m = 'seajs.use(' + (hasBrackets ? '[' : '') + info.params.map(function(v) {
            var type = lang.jsAsync;
            return type.ld + v + type.rd;
          }).join(',') + (hasBrackets ? ']' : '');
          break;
      }
    }

    return m;
  });
};

function parseParams(value) {
  var hasBrackets = false;
  var params = [];

  value = value.trim().replace(/(^\[|\]$)/g, function(m, v) {
    if (v) {
      hasBrackets = true;
    }
    return '';
  });
  params = value.split(/\s*,\s*/);

  return {
    params: params,
    hasBrackets: hasBrackets
  };
}
