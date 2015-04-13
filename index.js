var amd = require('./lib/amd.js');
var commonJs = require('./lib/commonJs.js');
var rDefine = /\bdefine\b/i;

function findResource(name, path) {
  var extList = ['.js', '.coffee', '.jsx'];
  var info = fis.uri(name, path);

  for (var i = 0, len = extList.length; i < len && !info.file; i++) {
    info = fis.uri(name + extList[i], path);
  }

  return info;
}

module.exports = function init(fis, opts) {
  var mode = opts.type || 'auto';
  var useAMD = mode === 'amd' || mode === 'auto' && (opts.paths || opts.packages || opts.shim || opts.map);

  fis.on('lookup:file', function(info, file) {

    // 已经找到了，不重复找。
    if (info.file) {
      return;
    }

    // 支持没有指定后缀的 require 查找。
    var test = findResource(info.rest, file.dirname);

    if (test.file) {
      info.id = test.file.getId();
      info.file = test.file;
    }
  });

  // wrap with amd
  fis.on('compile:postprocessor', function(file) {
    if (file.isJsLike) {
      var content = file.getContent();
      var type = file.wrap || (file.isMod ? 'amd' : 'closure');

      switch (type) {
        case 'amd':
          if (rDefine.test(content)) {
            return;
          }
          content = 'define(\''+file.id+'\', function(require) {\n'+content+'\n});';
          break;

        case 'closure':
          content = '(function() {\n' + content + '\n})();';
          break;
      }

      file.setContent(content);
    }
  });

  useAMD && amd.init(opts);

  fis.on('standard:js', function(info) {
    var _useAMD = useAMD || mode === 'auto' && amd.test(info);

    if (_useAMD) {
      amd.inited || amd.init(opts);
      amd(info)
    } else {
      commonJs(info);
    }
  });
};
