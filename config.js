export default {
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
  // 是否开启服务端渲染,关闭的话，在渲染时只在前端进行vue相关组件渲染
  serverRender:true,
  // 组件js&css文件注入页面的url前缀,eg:'/static'. 页面上资源实际地址为：${injectPath}/page[layout]-hash-bundle.[js|css]
  // 如果设置为false，代码将直接注入页面
  injectUrl:false, 
  // 注入页面的vuejs地址
  vueUrl:'https://cdn.jsdelivr.net/npm/vue@2.7.10',
  vueUrlDev:'https://cdn.jsdelivr.net/npm/vue@2.7.10/dist/vue.js',
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
    ssrAttribute:'data-vmssr',
    attribute:'data-vm'
  },
  // 需要参与编译渲染的第三方的module配置
  buildModules:{
  },
  //rollup 相关 ，可扩展以下两个属性，配合自定义modules
  rollupExternal:[],
  rollupGlobals:{}
}