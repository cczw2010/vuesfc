// 不在打包进页面及layout组件里，组件里直接使用，全局引入，会还存进内存而且只有一份。 打包进每个页面反而加载的时候增加内存,这个待验证
import Vue from "vue"
import ElementUI from 'element-ui/lib/index.js'

<%
const defOption = {'locale':"zh-CN"}
const defMeta = options.ssr?{
  script:[{ src: 'https://unpkg.com/element-ui/lib/index.js'}],
  link:[ { rel: 'stylesheet', href: 'https://unpkg.com/element-ui/lib/theme-chalk/index.css' }]
}:{}
const meta = Object.assign(defMeta,options.meta)
const option = Object.assign({},defOption,options.option)
const lang = option.locale!=defOption.locale?option.locale:null   //只有非中文需要设置，默认就是中文
if(lang){ 
%>
  import locale from "element-ui/lib/locale/lang/<%=option.locale%>.js"
  if(globalThis.process && !globalThis.window){
    Vue.use(ElementUI,{locale})
  }else{
    ElementUI.locale(locale)
  }
<%}else{%>
  if(globalThis.process && !globalThis.window){
    Vue.use(ElementUI)
  }
<%}%>

// 模块初始化时调用，注册模块 并更新配置信息，运行于服务启动时
export default function(){
  return {
    // meta信息
    meta:<%=JSON.stringify(meta)%>,
    // vue 初始化时，注入vm的对象 ，没有返回空即可
    inject:null
  }
}