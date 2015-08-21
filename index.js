var amd = require('./lib/amd.js');
var cmd = require('./lib/cmd.js');
var commonJs = require('./lib/commonJs.js');
var helper = require('./lib/helper.js');

module.exports = function init(fis, opts) {
  var mode = opts.mode || 'auto';

  fis.on('lookup:file', function(info, file) {

    // 已经找到了，不重复找。
    if (info.file) {
      return;
    }

    // 支持没有指定后缀的 require 查找。
    var test = helper.findResource(info.rest, file ? file.dirname : fis.project.getProjectPath(), opts.extList);

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

        if (ns === fis.media().get('namespace')) {
          test = helper.findResource(subpath, fis.project.getProjectPath(), opts.extList);
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
  var extReg;
  fis.on('compile:postprocessor', function(file) {
    if (file.isJsLike && !file.isPartial) {
      var content = file.getContent();
      var type = typeof file.wrap === 'undefined' ? (file.isMod && !amd.hasDefine(content) ? 'amd' : '') : file.wrap;
      
      switch (type) {
        case 'amd':
          var deps = '';
          if (opts.forwardDeclaration) {
            var reqs = ['\'require\'', '\'exports\'', '\'module\''];

            if (opts.skipBuiltinModules) {
              reqs = [];
            }

            file.requires.forEach(function(id) {
              var dep = fis.uri(id, file.dirname);

              if (dep.file) {
                if (dep.file.isJsLike) {
                  reqs.push('\'' + (dep.file.moduleId || dep.file.id) + '\'');
                }
              } else {
                /(\..+)$/.test(id) ? (~opts.extList.indexOf(RegExp.$1) ? reqs.push('\'' + id.replace(/\.js$/i, '') + '\'') : '') : reqs.push('\'' + id + '\'');
              }
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

    if (_useAMD) {
      if (file.isMod) {
        try { 
          amd(info, opts);
        } catch (e) {
          fis.log.warn('Got Error: %s while parse [%s].', e.message, file.subpath);
          fis.log.debug(e.stack);
        }
      } else {
        
        // 先尝试 amd 解析，失败则走 commonJs
        // 非模块化的js 一般都只有 require 的用法。
        try {
          amd(info, opts);
        } catch (e) {
          commonJs(info, opts);
        }
      }
      
    } else if ( mode === 'cmd' ) {
      cmd(info, opts);
    } else {
      commonJs(info, opts);
    }
  });

  // 当使用 amd 模式时，解析 data-main
  if (mode === 'amd' || mode === 'auto') {
    var rScript = /<!--([\s\S]*?)(?:-->|$)|(<script[^>]*>[\s\S]*?<\/script>)/ig;
    var rDataMain = /\bdata-main=('|")(.*?)\1/;
    var lang = fis.compile.lang;

    // 解析 data-main
    fis.on('standard:html', function(info) {
      info.content = info.content.replace(rScript, function(all, comment, script) {
        if (!comment && script) {
          all = all.replace(rDataMain, function(_, quote, value) {
            return lang.info.wrap(lang.jsRequire.wrap(quote + value + quote));
          });
        }

        return all;
      });
    });
  }
};

module.exports.defaultOptions = {
  mode: 'auto',
  globalAsyncAsSync: false, // 只有 amd 方案时才有效！
  forwardDeclaration: false,
  skipBuiltinModules: false,
  extList: ['.js', '.coffee', '.jsx', '.es6']
};
