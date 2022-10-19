// 如果引入的第三方库太大  不建议使用，合并成一个文件太大了影响速度
import nodePolyfills from 'rollup-plugin-node-polyfills'
import globals from "rollup-plugin-node-globals"
import resolve from '@rollup/plugin-node-resolve'   // // 告诉 Rollup 如何查找外部模块
import commonjs from '@rollup/plugin-commonjs'     // 将Commonjs语法的包转为ES6可用
import json from '@rollup/plugin-json'  // 转换json为 es6
import {babel} from "@rollup/plugin-babel"   //es6 to es5
import replace from "@rollup/plugin-replace"
import progress from 'rollup-plugin-progress'
import autoprefixer from 'autoprefixer';
import Components from 'unplugin-vue-components/rollup'
import vue from 'rollup-plugin-vue'
import postcss from "rollup-plugin-postcss"
import { terser } from "rollup-plugin-terser" 
import Config from "./config.runtime.js"
const outputExternal = ["vue"].concat(Config.rollupExternal||[])
const outputGlobals = Object.assign({"vue":"Vue"},Config.rollupGlobals)
const plugins = [
  resolve({
    preferBuiltins: true,
    mainFields: ["module",'jsnext:main', 'main'],
    // browser: true,
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
  postcss({
    extract: true,
    minimize:true,
    sourceMap:false,
    extensions: ['.css','.scss','.sass','.styl','.less'],
    plugins:[autoprefixer()],
  }),
  vue({
    target:'node',
    css: false,
    template: {
      optimizeSSR: false,
      isProduction: !Config.isDev
    }
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
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**', // 只编译我们的源代码,排除node_mouldes下的
  }),
  !Config.isDev&&terser()
]

const inputOption = {
  // 核心参数
  input:"",
  external:outputExternal,
  cache: false,
  plugins,
}

const outputOption = {
  file:"client.tmp.js",
  format:"iife",
  chunkFileNames:'[name]-[hash]-[format]-client.js',
  entryFileNames:'[name]-[hash]-[format]-client.js',
  globals:outputGlobals,
  name:'default',
  inlineDynamicImports:true,
  sourcemap:false,
}

export {inputOption,outputOption}