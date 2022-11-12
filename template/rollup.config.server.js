import {join} from "path"
import resolve from '@rollup/plugin-node-resolve'   // // 告诉 Rollup 如何查找外部模块
import commonjs from '@rollup/plugin-commonjs'     // 将Commonjs语法的包转为ES6可用
import json from '@rollup/plugin-json'  // 转换json为 es6
import replace from "@rollup/plugin-replace"
import progress from 'rollup-plugin-progress'
import Components from 'unplugin-vue-components/rollup'
import vue from 'rollup-plugin-vue'
import postcss from "rollup-plugin-postcss"
import { terser } from "rollup-plugin-terser" 
import {rootPackage} from "../../src/utils.js"
import Config from "./config.runtime.js"
const outputExternal = ["vue"].concat(Config.rollupExternal||[])
const plugins = [
  resolve({
    preferBuiltins: true,
    mainFields: ["module",'jsnext:main', 'main'],
    modulePaths:[join(rootPackage,'node_modules')],
    // modulesOnly:true,
  }) ,
  commonjs(),
  replace({
    preventAssignment: true,
    'process.env.NODE_ENV': JSON.stringify(Config.isDev?'development':'production'),
  }),
  progress({
    clearLine: true // default: true
  }),
  //服务端postcss 不输出,但是必须有
  postcss({
    extract: false,
    inject:false,
    sourceMap:false,
  }),
  vue({
    css: false,  //这里为true的话，vue插件也只处理style块的，import的不处理，那不如都交给postcss处理
    template: {
      optimizeSSR: true,
      isProduction: !Config.isDev
    },
  }),
  Components({
    // 配置文件生成位置
    // dts: 'components.d.ts',
    dirs: Config.source_components,
    deep: true,
    transformer:'vue2',
    // ui库解析器
    resolvers:[
      // (componentName) => {
      //   // where `componentName` is always CapitalCase
      //   console.log("componentName:",componentName)
      // },
      // AntDesignVueResolver()
      // VuetifyResolver()
    ],  //,不解析第三方UI，否则可能造成生成的编译包巨大，在执行期间会自动解析
    extensions: [Config.source_ext.replace(/^./ig,'')],
    directives: true,   //@babel/parser needed for vue2
  }),
  json(),
  !Config.isDev&&terser()
]

const inputOption = {
  // 核心参数
  input:"",
  external: outputExternal,
  //不缓存虽然效率略低，但是比较保险，我的代码某个阶段就是不知道哪里被缓存住了，一整天调试不好，后来关了才好。
  cache: false,
  plugins,
}
const outputOption = {
  file:"sfc.ssr.js",
  format:"esm",
  chunkFileNames:'[name]-[hash]-[format]-ssr.js',
  entryFileNames:'[name]-[hash]-[format]-ssr.js',
  name:'default',
  inlineDynamicImports:true,
  sourcemap:false,
}
export {inputOption,outputOption}