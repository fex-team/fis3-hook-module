# fis3-hook-module

fis3 已经默认不自带模块化开发支持，需要此插件来完成模块化开发的支持。

1. 针对 `isMod` 为 `true` 的 js 文件自动 amd 包裹。
2. 针对所有 js 文件和 js 片段，检测 require 语法，自动标记依赖（包括异步依赖）。
3. 扩展 require 路径支持。支持无后缀写法。如：`require('./xxx')` 等价于 `require('./xxx.js')`.
4. 扩展 require 路径支持。支持 baseUrl、paths 和 packages 配置。详情看配置说明。
5. 针对 `mode` 设置成 `'amd'` 的情况下，进行 shim 包裹。 详情看配置说明。

## 安装

全局安装或者本地安装都可以。

```bash
npm install fis3-hook-module
```

## 启用

在 fis-conf.js 中加入以下代码。

```javascript
fis.hook('module');
```

## 注意

此插件已经集成对模块化资源进行 amd 包裹，无需 [jswrapper](https://github.com/fex-team/fis-postprocessor-jswrapper)

通过配置标记哪些 js `isMod` 为 `true` 即可.

```javascript
// 标记 /libs 当前目录下面的 js 文件为模块化 js.
fis.match('/libs/*.js', {
  isMod: true
});
```

## 配置说明

```javascript
fis.hook('module', {

  // 可以通过设置此值来给 js 文件进行包裹。
  // 
  // 可选值：
  // - `amd` 即 amd 包裹
  // - `closure` 即闭包包裹。
  // - 留空时不进行处理，isMod 为 true 的文件除外。isMod 为 true 的文件，会进行 amd 方式包裹。
  wrap: '',

  // 分为两种：
  //
  // `commonJs` 选用此方案，性能最好，规则更简单
  // `amd` 需要词法分析，时间略长。
  //  当设置为 auto 的时候，程序自动判断。
  mode: 'auto',

  // 配置 baseUrl, 配置，页面中的 require 路径都是基于此路径查找的。
  // https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#baseurl-
  // baseUrl: '.',

  // 可以给项目中的路径或者文件建立别名。
  // 
  // {
  //   libs: '/static/libs',
  //   jquery: '/static/libs/jquery'
  // }
  // 
  // 那么:
  // 
  // require('libs/alert'); 就等价于 require('/static/libs/alert');
  // requrire('jquery');  等价于： require('/static/libs/jquery');

  // 更多信息请参考。https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#paths-
  // paths: {},

  // 后续补充
  // 届时，请参考。https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#packages-
  // packages: [],
  
  // 是否依赖前置
  // 即 是否将 factory 中的 require 对象，前置放在 define 的第二个参数中。
  // 对于 amd loader 来说可以免去解析 factory 的操作。推荐给用  amd loader。
  // !!! 用  mod.js 作为 loader 时，勿用!!!!
  forwardDeclaration: false,

  // 当开启依赖前置后有效，用来控制 amd 的内建模块是否需要保留在 deps 第二个参数中。
  // 如: require, exports, module
  // 像 cmd 是不需要的，所以模式是 cmd 时，自动会开启。
  skipBuiltinModules: false,

  // 当 mod 为 amd 时，以下配置才有效。
  
  // 届时，请参考。https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#shim-
  // shim: null,
  
  // 是否将全局的 require(['jquery']) 异步用法当成同步？
  // 当成同步，js 加载不再走 loader 而是，直接页面源码中输出 <script> 标签到页面，用 <script> 来加载。
  globalAsyncAsSync: false,

  // 用来设置无后缀引用模块时，对模块的定义的文件查找顺序。
  // 如： require('./main')
  // 查找顺序为：require('./main.js') require('./main.coffee') require('./main.jsx')
  // extList: ['.js', '.coffee', '.jsx']
});
```


* `wrap` 默认 `undefined`.
  
  当文件 `isMod` 为 true 时，会对文件以 `amd` 的方式包裹。

  可选值:
  
  - `amd` 即 amd 包裹
  - `closure` 即闭包包裹。
  - `false` 或者 `null` 或者留空时不进行包裹
* `mode` 默认 `auto` 根据文件内容自动判断是 `commonJs` 还是 `amd`。不准确，建议设置其中一种。
  
  分为两种：
  
  - `commonJs` 选用此方案，性能最好，规则更简单
  - `amd` 需要词法分析，时间略长。
* `baseUrl` 默认为 `.`。配置 baseUrl, 配置，页面中的 require 路径都是基于此路径查找的。详情见：https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#baseurl-
* `paths` 设置引用别名。如：
  
  ```
  fis.hook('module', {
    paths: {
      libs: '/static/libs',
      jquery: '/static/libs/jquery'
    }
  });
  ```
  那么：
  
  - `require('libs/alert');` 就等价于 `require('/static/libs/alert');`
  - `requrire('jquery');`  等价于： `require('/static/libs/jquery');`
  - 更多配置请参考：https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#packages-
* `packages` 用来配置包信息。
* `forwardDeclaration` 默认为 `false`, 是否依赖前置, 即 是否将 factory 中的 require 对象，前置放在 define 的第二个参数中。**用  mod.js 作为 loader 时，勿用**
* `skipBuiltinModules` 默认 `false`, 当开启依赖前置后有效，用来控制 amd 的内建模块是否需要保留在 deps 第二个参数中。如: require, exports, module。像 cmd 是不需要的，所以模式是 cmd 时，自动会开启。
* `shim` 届时，请参考。https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#shim-
* `globalAsyncAsSync` 默认 `false`, 是否将全局的 require(['jquery']) 异步用法当成同步？当成同步，js 加载不再走 loader 而是，直接页面源码中输出 <script> 标签到页面，用 <script> 来加载。
* `extList` 默认值为 `['.js', '.coffee', '.jsx', '.es6']`, 用来设置无后缀引用模块时，对模块的定义的文件查找顺序，如： `require('./main')`, 查找顺序为：`require('./main.js') require('./main.coffee') require('./main.jsx')`
