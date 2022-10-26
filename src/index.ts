import colors from "colors/safe";
import Module from "module";
import path from "path";

declare module "module" {
    /**获取模块解析路径 */
    var _nodeModulePaths: (from: string) => string[];

    /**解析文件实际地址配置项 */
    type ResolveFilenameOptions = {
        paths?: []
    }

    /**解析文件实际地址 */
    var _resolveFilename: (request: string, parent: Module, isMain: boolean, options?: ResolveFilenameOptions) => string;
}

/**模块配置 */
type AliasOptions = {
    /**查找根目录，默认是 process.cwd() */
    cwd?: string;

    /**额外的模块目录，默认是 node_modules */
    modulesDir?: string[];

    /**别名配置文件，默认是根目录下的 package.json */
    file?: string;
}

/**别名配置 */
type AliasConfig = {
    /**别名设置 */
    aliases: {
        /**具体别名设置 */
        [aliase: string]: string;
    }
}

/**原始 nodeModulePaths 函数 */
const OriginModulePaths = Module._nodeModulePaths;

/**原始 resolveFilename 函数 */
const OriginModuleResolveFilename = Module._resolveFilename;
/**模块查询目录 */
const internalModulePaths: string[] = [];
/**模块别名 */
const internalModuleAliases: Record<string, string> = {};
/**别名列表 */
const moduleAliasNames: string[] = [];
/**已解析的模块别名, node 本身已经有缓存，这里就没必要再做一次了，后续有特殊情况再考虑 */
// const internalModuleFilenameCache = new Map<string, string>();

/**执行目录 */
var cwd: string = process.cwd();

/**是否匹配到别名 */
function ifMatchedBy(request: string, aliase: string) {
    var re: boolean = false;
    if (request.startsWith(aliase)) {
        return true;
    }
    return re;
}

Module._nodeModulePaths = function (from: string) {
    var paths: string[] = OriginModulePaths.call(this, from);
    if (from.indexOf("node_modules") === -1) {
        paths = internalModulePaths.concat(paths);
    }
    return paths;
}

Module._resolveFilename = function (request, parent, isMain, options) {
    var realRequest: string;
    for (let i = 0; i < moduleAliasNames.length; i++) {
        const aliase = moduleAliasNames[i];
        if (ifMatchedBy(request, aliase)) {
            realRequest = path.join(
                internalModuleAliases[aliase]
                , request.substring(aliase.length)
            );
            break;
        }
    }
    if (realRequest === undefined) {
        realRequest = request;
    }
    return OriginModuleResolveFilename.call(this, realRequest, parent, isMain, options);
}

/**是否是带有元素的数组 */
function isArrayHasElement(arr: Array<unknown>) {
    return Array.isArray(arr) && arr.length > 0;
}

/**添加查询目录到子模块的查询列表中 */
function addPathToChid(childrens: Module[], aliasPath: string) {
    if (Array.isArray(childrens) && childrens.length) {
        let i = 0;
        let child = childrens[i];
        while (child) {
            if (child.paths && child.paths.indexOf(aliasPath) === -1) {
                child.paths.unshift(aliasPath);
            }
            if (isArrayHasElement(child.children)) {
                addPathToChid(child.children, aliasPath);
            }
            child = childrens[++i];
        }
    }
}

/**添加查询目录到模块查询列表中 */
function addPath(str: string) {
    const aliasPath = path.normalize(str);
    if (internalModulePaths.indexOf(aliasPath)) {
        internalModulePaths.push(aliasPath);
        let main = require.main;
        if (main && main.paths && main.paths.indexOf(aliasPath) === -1) {
            main.paths.unshift(aliasPath);
        }
        if (isArrayHasElement(main.children)) {
            addPathToChid(main.children, aliasPath);
        }
    }
}

/**别名支持 */
function alias(options?: AliasOptions) {
    options = options || {};
    if (options?.cwd) {
        cwd = options.cwd;
    }

    options.file = options.file ? options.file : "package.json";
    if (options.file) {
        let setting: AliasConfig;
        try {
            setting = require(
                path.join(
                    cwd
                    , options.file
                )
            );
        } catch (e) {
            if (e.code === "MODULE_NOT_FOUND") {
                console.log(
                    "🙃"
                    , colors.yellow(`Unable to find ${options.file}`)
                );
            }
        }
        if (setting && setting.aliases) {
            for (let name in setting.aliases) {
                const item = setting.aliases[name];
                if (name === "@") {
                    // 现在很多机构包都是 @xxx/yyy 这样的结构，
                    // 单独的一个 @ 会导致在后面替换的时候出现错误
                    name = name + "/";
                }
                moduleAliasNames.push(name);
                if (item.startsWith("/")) {
                    internalModuleAliases[name] = item;
                    continue;
                }
                internalModuleAliases[name] = path.join(
                    cwd
                    , item
                );
            }
            moduleAliasNames.sort();

        }
    }

    if (options?.modulesDir && isArrayHasElement(options.modulesDir)) {
        for (let i = 0; i < options.modulesDir.length; i++) {
            const dir = options.modulesDir[i];
            if (dir === "node_modules") {
                continue;
            }
            addPath(
                path.join(
                    cwd
                    , dir
                )
            );
        }
    }
}

export { alias };