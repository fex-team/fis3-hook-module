var amd = require('./lib/amd.js');
var commonJs = require('./lib/commonJs.js');
var rDefine = /\bdefine\s*\(/i;

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
  var useAMD = !!(mode === 'amd' || mode === 'auto' && (opts.paths || opts.packages || opts.shim || opts.map || opts.baseUrl));

  fis.on('lookup:file', function(info, file) {

    // 已经找到了，不重复找。
    if (info.file) {
      return;
    }

    // 支持没有指定后缀的 require 查找。
    var test = findResource(info.rest, file ? file.dirname : fis.project.getProjectPath());

    if (test.file) {
      info.id = test.file.getId();
      info.file = test.file;
    } else {
      var nsConnector = fis.config.env().get('namespaceConnector', ':');
      var idx = info.rest.indexOf(nsConnector);

      if (~idx) {
        info.isFisId = true;

        var ns = info.rest.substring(0, idx);
        var subpath = info.rest.substring(idx + 1);

        if (ns === fis.config.env().get('namespace')) {
          test = findResource(subpath, fis.project.getProjectPath());
          if (test.file) {
            info.id = test.file.getId();
            info.file = test.file;
          }
        }
      }
    }
  });

  // wrap with amd
  fis.on('compile:postprocessor', function(file) {
    if (file.isJsLike) {
      var content = file.getContent();
      var type = file.wrap || (file.isMod ? 'amd' : '');

      switch (type) {
        case 'amd':
          // 已经包裹过，不重复包裹。
          if (rDefine.test(content)) {
            console.log(file.subpath);
            return;
          }
          content = 'define(\'' + (file.moduleId || file.id) + '\', function(require, exports, module) {\n\n' + content + '\n\n});\n';
          break;

        case 'closure':
          content = '(function() {\n\n' + content + '\n\n})();\n';
          break;
      }

      if (file.isMod && file.moduleId !== file.id) {
        file.extras.moduleId = file.moduleId;
      }

      file.setContent(content);
    }
  });

  useAMD && amd.init(opts);

  fis.on('standard:js', function(info) {
    var _useAMD = useAMD || mode === 'auto' && amd.test(info);

    if (_useAMD) {
      amd.init(opts);
      amd(info, opts);
    } else {
      commonJs(info, opts);
    }
  });
};

module.exports.defaultOptions = {
  globalAsyncAsSync: false,
  forwardDeclaration: true
};
