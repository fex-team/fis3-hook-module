# fis3-plugin-module

fis3 模块化开发支持！

fis-conf.js

```javascript

fis.hook('module', {

    // 是否将全局的 require(['jquery']) 异步用法当成同步？
    globalAsyncAsSync: false,

    // 是否依赖前置
    // 即 是否将 factory 中的 require 对象，前置放在 define 的第二个参数中。
    // 对于 amd loader 来说可以免去解析 factory 的操作。
    forwardDeclaration: true,

    // 分为两种：
    //
    // `commonJs` 选用此方案，性能最好，规则更简单
    // `amd` 需要词法分析，时间略长。
    //  当设置为 auto 的时候，程序自动判断。
    mode: 'auto',

    // 当 mod 为 amd 时，以下配置才有效。

    // 配置 baseUrl https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#baseurl-
    // baseUrl: '.',

    // 后续补充
    // 届时，请参考。https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#paths-
    // paths: [],

    // 后续补充
    // 届时，请参考。https://github.com/amdjs/amdjs-api/blob/master/CommonConfig.md#packages-
    // packages: []
});

```
