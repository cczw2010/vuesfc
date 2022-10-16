export default {
  // page源码目录
  source_page:"src/pages",
  // layout源码目录
  source_layout: "src/layouts",
  // 自定义component源码目录
  source_component: "src/components",
  buildModules:{
    '~/modules/elementui.js':{
      option:{locale:"en"}
    }
  },
  rollupExternal:['element-ui','element-ui/lib/index.js'],
  rollupGlobals:{"element-ui/lib/index.js":"ELEMENT"}
  // rollupGlobals:{"element-ui":"ELEMENT"}
}