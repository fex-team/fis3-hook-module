var amd = module.exports = function() {

};

amd.inited = false;

amd.init = function(opts) {
  amd.inited = true;

  // normailize shim.
};

// 判断是否是 amd
amd.test = function(info) {
  var file = info.file;

  return false;
};
