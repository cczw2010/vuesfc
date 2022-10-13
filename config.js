// 默认参数，路径相对于项目根目录
export default {
  isDev:true,
  // ============================================================ render相关,不建议修改
  // 应用名称
  appName:"App",
  // page组件的组件名
  pageComponentName:"customPage",
  // window下当前layout和page组件名称对应的变量名
  layoutNameKey:"__layoutName",
  pageNameKey:"__pageName",
  // 前端state数据的windowskey
  stateWindowKey:'__INITIAL_STATE__',
  // meta数据windowskey
  metaWindowKey:'__INITIAL_META__',
  //是否将页面相关源码内的样式和客户端js直接注入到页面上,两种方式：
  //1 boolean  是否直接入注入页面
  //2 string 一个router作为路由前缀，作为外联注入页面，实际地址为：${router}/fileRelativePathtoDstRoot
  injectStyle:true, 
  injectScript:true,
  // ============================================================= complier 编译相关
  // sfc源文件后缀
  source_ext:'.vue',
  // page源码目录
  source_page:"pages",
  // layout源码目录
  source_layout: "layouts",
  // 自定义component源码目录
  source_component: "components",
  // vue-meta设置
  vuemeta:{
    keyName:'head',
    tagIDKeyName:'vmid',
    ssrAppId:'app',
    ssrAttribute:'data-vm-ssr',
    attribute:'data-vm'
  },
  // 需要参与编译渲染的第三方的module配置
  buildModules:{
  },
  //rollup 相关 ，可扩展以下两个属性，配合自定义modules
  rollupExternal:[],
  rollupGlobals:{}
}