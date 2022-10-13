// 不在打包进页面及layout组件里，组件里直接使用，全局引入，会还存进内存而且只有一份。 打包进每个页面反而加载的时候增加内存,这个待验证
// 另外 rollup下的vuetify的treeshake 各种方案试了也不好用，基本都要全部引入，造成每个页面都很大，暂不考虑这种方案了
import Vue from "vue"
import Vuetify from "vuetify"
// import 'vuetify/dist/vuetify.min.css'
Vue.use(Vuetify)

<%
// metas
const defMeta = options.ssr?{
  script:[
    { src: 'https://cdn.jsdelivr.net/npm/vuetify@2.x/dist/vuetify.js'}
  ],
  link:[
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900' },
    { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@mdi/font@6.x/css/materialdesignicons.min.css' },
    { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/vuetify@2.x/dist/vuetify.min.css' },
  ]
}:{}
const meta = Object.assign(defMeta,options.meta)
const option = Object.assign({},options.option)
%>
// 模块初始化时调用，注册模块 并更新配置信息，运行于服务启动时
export default function(){
  return {
    // meta信息
    meta:<%=JSON.stringify(meta)%>,
    // vue 初始化时，注入vm的对象 ，没有返回空即可
    inject:{
      vuetify:new Vuetify(<%=JSON.stringify(option)%>)
    }
  }
}