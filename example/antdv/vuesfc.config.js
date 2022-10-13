export default {
  // page源码目录
  source_page:"src/pages",
  // layout源码目录
  source_layout: "src/layouts",
  // 自定义component源码目录
  source_component: "src/components",
  buildModules:{
    "~/modules/antdv.js":{}
  },
  injectStyle:true, 
  injectScript:true,
  // rollup
  rollupExternal:['ant-design-vue'],
}