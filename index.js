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
      var type = typeof file.wrap === 'undefined' ? (file.isMod ? 'amd' : '') : file.wrap;

      switch (type) {
        case 'amd':
          // 已经包裹过，不重复包裹。
          if (amd.hasDefine(content)) {
            return;
          }

          var deps = '';
          if (opts.forwardDeclaration) {
            var reqs = ['\'require\'', '\'exports\'', '\'module\''];

            if (opts.skipBuiltinModoules) {
              reqs = [];
            }

            file.requires.forEach(function(id) {
              var dep = fis.uri(id);

              if (dep.file) {
                if (dep.file.isJsLike) {
                  reqs.push('\'' + (dep.file.moduleId || dep.file.id) + '\'');
                }
              } else {
                extReg = extReg || new RegExp('(' + (opts.extList || []).map(function(ext) {
                  return fis.util.escapeReg(ext);
                }).join('|') + ')$', 'i');

                // 只有 js 依赖才加入，且 id 只去除 .js 后缀。
                extReg.test(id) && reqs.push('\'' + id.replace(/\.js$/i, '') + '\'');
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

    if (_useAMD && file.isMod) {
      amd(info, opts);
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
  globalAsyncAsSync: false,
  forwardDeclaration: false,
  skipBuiltinModoules: false,
  extList: ['.js', '.coffee', '.jsx', '.es6']
};
