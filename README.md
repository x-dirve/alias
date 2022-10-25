# NodeJS 模块别名支持模块

NodeJs 应用中的模块引用，很容易会出现多层相对路径引用的情况，如：
```js
import { local } from "../../../../../components/cache";
```
本模块使用了目前很多页端应用其实已广泛的别名机制来解决这个问题。

## 使用
1. 将 `@x-drive/alias` 加入到项目生产依赖
1. 定义项目路径别名
    1. 默认是在根目录的 `package.json` 中的 `aliases` 字段
    1. 用户可通过配置指定符合标准的配置文件
1. 在尽可能开始的地方启用模块

## 配置项
- `cwd` 查找根目录，默认是 process.cwd()
- `modulesDir` 额外的模块目录，默认是 node_modules
- `file` 别名配置文件，默认是根目录下的 package.json