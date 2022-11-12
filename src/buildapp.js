import {rollup} from "rollup"
import { join } from "path"
import alias from '@rollup/plugin-alias'
// import nodePolyfills from 'rollup-plugin-node-polyfills'
import globals from "rollup-plugin-node-globals"
import nodeResolve from '@rollup/plugin-node-resolve'   // // 告诉 Rollup 如何查找外部模块
import commonjs from '@rollup/plugin-commonjs'     // 将Commonjs语法的包转为ES6可用
import json from '@rollup/plugin-json'  // 转换json为 es6
import {babel,getBabelOutputPlugin} from "@rollup/plugin-babel"   //es6 to es5
import replace from "@rollup/plugin-replace"
import progress from 'rollup-plugin-progress'
import { terser } from "rollup-plugin-terser" 
import {readFile} from "fs/promises"
import {logger,compilerTemplate,distRootDir,rootPackage} from "./utils.js"
function getInputOption(config,isSsr){
  // vue默认runtime，前端打包的vue源码要用完整版本
  const aliasEntriesSsr = { vue:'vue/dist/vue.esm.js'}
  const aliasEntriesClient = {}
  const plugins = [
    alias({
      entries: isSsr?aliasEntriesSsr:aliasEntriesClient
    }),
    nodeResolve({
      preferBuiltins: true,
      mainFields: ["module",'jsnext:main', 'main'],
      // moduleDirectories:['node_modules'],
      // modulePaths:[join(rootPackage,'node_modules')],
      // rootDir:rootPackage
    }) ,
    commonjs(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': (JSON.stringify(config.isDev?'development':'production')),
    }),
    progress({clearLine: true }),
    json(),
    pluginApp(config,isSsr),
    !isSsr&&globals(),
    // !isSsr&&nodePolyfills(),
    !isSsr&&babel({
      babelHelpers: 'bundled',
      exclude: ['node_modules/**'], // 只编译我们的源代码,排除node_mouldes下的
    }),
    // terser(),
    !config.isDev&&terser()
  ]
  return {
    // 核心参数
    input:config.appSourcePath,
    //不缓存虽然效率略低，但是比较保险，我的代码某个阶段就是不知道哪里被缓存住了，一整天调试不好，后来关了才好。
    cache: false,
    plugins
  }
  
}
function getOutputOption(config,isSsr){
  const outFile = join(distRootDir,isSsr?config.appSSRPath:config.appClientPath)
  const format = isSsr?"esm":"iife"
  return {
    file:outFile,
    format,
    inlineDynamicImports:true,
    plugins: [
      !isSsr && getBabelOutputPlugin({
        presets: ['@babel/preset-env'],
        // configFile: join(process.cwd(), 'babel.config.json'),
        allowAllFormats: true,
      })
    ],
    // chunkFileNames:'[name]-[hash]-[format].js',
    // entryFileNames:'[name]-[hash]-[format].js',
    name:config.appName,
    sourcemap:false,
    banner: isSsr?'':'/* base js for app , by vsfc*/'
  }
}
/**
 * 编译 app.js
 * @export
 * @param {*} config
 * @param {*} ssr     生成ssr端还是client端
 * @returns
 */
export default async function compiler(config,ssr){
  const inputOptions = getInputOption(config,ssr)
  const outputOptions = getOutputOption(config,ssr)
  let external = ssr?['vue','vue-meta','deepmerge']:['vue']
  external = external.concat(config.rollupExternal||[])
  let clientGlobals = {'vue':'Vue'}
  Object.assign(clientGlobals,config.rollupGlobals)

  inputOptions.external = external
  if(!ssr){
    outputOptions.globals = clientGlobals
  }
  const bundle = await rollup(inputOptions).catch(e=>{
    logger.error(e)
    return null
  })
  if(!bundle){
    return false
  }
  await bundle.write(outputOptions)
}
/**
 * app.js 构建方法
 * @param {*} config  配置文件 
 * @param {*} ssr     是否ssr端渲染
 * @returns 
 */
function pluginApp(config,ssr=false){
  return {
    name: 'plugin-app', 
    /**
     * 异步，会阻塞的钩子函数。
     * 如果从入口解析，或者是再次构建一个module、或者一个异步导入的包时，都会调用这里。该hook，用来自定义解析行为。
     * @param {*} id  
     * @param {*} importer 导入这个模块的上级模块
     * @param {*} options 一些参数，比如标记了是否为入口文件。如果是入口文件，则没有importer
     * @return string | false | null | {id: string, external?: boolean | "relative" | "absolute", moduleSideEffects?: boolean | "no-treeshake" | null, syntheticNamedExports?: boolean | string | null, meta?: {[plugin: string]: any} | null}
     *          返回个字符串：一般是包名。作为id，传给load钩子函数,也可以回傳 '\0id',這是 rollup plugin 之間的一個約定，如果是 \0 開頭的 id ，那絕對是特殊的 id ，只要不是自己負責的就絕對不會處理
     *          返回null：不处理
     *          返回false：说明这个包配置了external参数，不进行打包
     */
    resolveId(id,importer,options){
      if(options.isEntry && id== config.appSourcePath){
        return id
      }
      return null
    },
    /**
     * 自定义的加载器。可以将代码生成AST，也可以在返回的配置中，来配置所导入的模块是有副作用等（可以控制是否tree-shaking）。
     * @param {*} id
     * @returns
     *      返回字符串：返回的字符串将作为模块的code（可以用来在构建修改模块的代码）
     *      返回null：什么都不做，延顺给下一步
     *      返回对象：{code，ast，map，...} 等
     */
    async load ( id ) {
      if(id==config.appSourcePath){
        const code = await readFile(config.appSourcePath)
        const moduleLoaderPath = ssr?config.moduleLoaderSSRPath:config.moduleLoaderClientPath
        const options = Object.assign({
                        moduleLoaderPath,
                        ssr,
                      },config)
        return await compilerTemplate(code,options,true)
      }
      return null;
    },
    /**
     * 看起来和load钩子函数没什么区别，就是可以转译单个的模块。可以在这一步生成ast，也可以给正在转译的模块增加一些参数。可以返回promise
     * @param code  load钩子函数返回的值，默认情况下是模块的原始文本
     * @param id
     * @returns
     *      返回字符串：代替code，传递给下一个
     *      返回null：什么都不做，延顺给下一步
     *      返回对象：{code，ast，map，...}
     */
    // async transform (code,id) {
    //   // this.emitFile({
    //   //   type: 'chunk',
    //   //   id: layoutId,
    //   // });
    //   return null
    // },
  }
}