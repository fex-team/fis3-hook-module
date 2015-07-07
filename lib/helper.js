// 当 require 没有指定后缀时，用来根据后缀查找模块定义。
function findResource(name, path, extList) {
  var info = fis.uri(name, path);

  for (var i = 0, len = extList.length; i < len && !info.file; i++) {
    info = fis.uri(name + extList[i], path);
  }

  return info;
}

exports.findResource = findResource;
