# fis3-hook-module

fis3 已经默认不自带模块化开发支持，需要此插件来完成模块化开发的支持。

1. 针对 `isMod` 为 `true` 的 js 文件自动 amd 包裹。
2. 针对所有 js 文件或 js 片段，检测 require 语法，自动标记依赖（包括异步依赖），并写入  map.json。
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

fis-conf.js

```javascript

fis.hook('module', {

    // 分为两种：
    //
    // `commonJs` 选用此方案，性能最好，规则更简单
    // `amd` 需要词法分析，时间略长。
    //  当设置为 auto 的时候，程序自动判断。
    mode: 'auto',

    // 配置 baseUrl https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#baseurl-
    // baseUrl: '.',

    // 后续补充
    // 届时，请参考。https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#paths-
    // paths: [],

    // 后续补充
    // 届时，请参考。https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#packages-
    // packages: [],
    
    // 是否依赖前置
    // 即 是否将 factory 中的 require 对象，前置放在 define 的第二个参数中。
    // 对于 amd loader 来说可以免去解析 factory 的操作。推荐给用  amd loader。
    // !!! 用  mod.js 作为 loader 时，勿用!!!!
    forwardDeclaration: false,

    // 当 mod 为 amd 时，以下配置才有效。
    // 届时，请参考。https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#shim-
    shim: null,
    
    // 是否将全局的 require(['jquery']) 异步用法当成同步？
    // 当成同步，js 加载不再走 loader 而是，直接页面源码中输出 <script> 标签到页面，用 <script> 来加载。
    globalAsyncAsSync: false,
    
});
```
