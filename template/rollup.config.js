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
import Components from 'vue-components-self/rollup'
// import {AntDesignVueResolver} from "unplugin-vue-components/resolvers"
import vue from 'rollup-plugin-vue'
import postcss from "rollup-plugin-postcss"
import { terser } from "rollup-plugin-terser" 

const Config = <%=JSON.stringify(options)%>
// const outputExternal = ["vue"].concat(Config.rollupExternal||[])
// const outputGlobals = Object.assign({"vue":"Vue"},Config.rollupGlobals)
const outputExternal = Config.rollupExternal||[]
const outputGlobals = Config.rollupGlobals||{}

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
  Components({
    // 配置文件生成位置
    // dts: 'components.d.ts',
    dirs: [Config.source_component],
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

const pluginClient = plugins.slice()
pluginClient.splice(4,0,
  postcss({
    extract: true,
    minimize:true,
    sourceMap:false,
    extensions: ['.css','.scss','.sass','.styl','.less'],
    plugins:[autoprefixer()],
    // use : [
    //   'sass',
    //   'stylus',
    //   ['less', { javascriptEnabled: true}]
    // ]
  }),
  vue({
    target:'node',
    css: false,
    template: {
      optimizeSSR: false,
      isProduction: !Config.isDev
    }
  }),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**', // 只编译我们的源代码,排除node_mouldes下的
  }))
pluginClient.splice(0,0,globals(),nodePolyfills())

const pluginSsr = plugins.slice()
pluginSsr.splice(4,0,
  //postcss的inject 客户端有效，服务端无效，不如关了， 组件内的style也好，import的也好都交由render统一管理注入
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
  })
)

const optionsSsr = {
  // 核心参数
  input:"",
  external: outputExternal,
  //不缓存虽然效率略低，但是比较保险，我的代码某个阶段就是不知道哪里被缓存住了，一整天调试不好，后来关了才好。
  cache: false,
  plugins:pluginSsr,
  output:{
    file:"ssr.tmp.js",
    format:"esm",
    chunkFileNames:'[name]-[hash]-[format]-ssr.js',
    entryFileNames:'[name]-[hash]-[format]-ssr.js',
    name:'default',
    inlineDynamicImports:true,
    sourcemap:false,
  }
}
const optionsClient = {
  // 核心参数
  input:"",
  external:outputExternal,
  cache: false,
  plugins:pluginClient,
  output:{
    file:"client.tmp.js",
    format:"iife",
    chunkFileNames:'[name]-[hash]-[format]-client.js',
    entryFileNames:'[name]-[hash]-[format]-client.js',
    globals:outputGlobals,
    name:'default',
    inlineDynamicImports:true,
    sourcemap:false,
  }
}

export default [optionsSsr,optionsClient]