var amd = require('./lib/amd.js');
var cmd = require('./lib/cmd.js');
var commonJs = require('./lib/commonJs.js');

function findResource(name, path) {
  var extList = ['.js', '.coffee', '.jsx'];
  var info = fis.uri(name, path);

  for (var i = 0, len = extList.length; i < len && !info.file; i++) {
    info = fis.uri(name + extList[i], path);
  }

  return info;
}

module.exports = function init(fis, opts) {
  var mode = opts.mode || 'auto';

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

   // 只是路径查找，commonJs 和 cmd 模式下可以开启。
  amd.init(opts);

  // wrap with amd
  fis.on('compile:postprocessor', function(file) {
    if (file.isJsLike && !file.isPartial) {
      var content = file.getContent();
      var type = file.wrap || (file.isMod ? 'amd' : '');

      switch (type) {
        case 'amd':
          // 已经包裹过，不重复包裹。
          if (amd.hasDefine(content)) {
            return;
          }

          var deps = '';
          if (opts.forwardDeclaration) {
            var reqs = ['\'require\'', '\'exports\'', '\'module\''];
            file.requires.forEach(function(id) {

              /\.js$/i.test(id) && reqs.push('\'' + id.replace(/\.js$/i, '') + '\'');
            });

            deps = '[' + reqs.join(',') + '], ';
          }

          content = 'define(\'' + (file.moduleId || file.id) + '\',' + deps + ' function(require, exports, module) {\n\n' + content + '\n\n});\n';
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



  fis.on('standard:js', function(info) {
    var _useAMD = mode === 'auto' && amd.test(info) || mode === 'amd';
    var file = info.file;

    if (_useAMD && file.isMod) {
      amd(info, opts);
    } else if ( mode === 'cmd' ) {
      cmd(info, opts);
    } else {
      commonJs(info, opts);
    }
  });
};

module.exports.defaultOptions = {
  mode: 'auto',
  globalAsyncAsSync: false,
  forwardDeclaration: false
};
