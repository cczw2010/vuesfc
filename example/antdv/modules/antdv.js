import Vue from "vue"
import antd from "ant-design-vue"
Vue.use(antd)
Vue.config.productionTip = false;

<%
// metas
const defMeta = options.ssr?{
  script:[
    { src: 'https://cdn.jsdelivr.net/npm/ant-design-vue@1.7.8/dist/antd.min.js'}
  ],
  link:[
    { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/ant-design-vue@1.7.8/dist/antd.min.css'}
  ]
}:{}
const meta = Object.assign(defMeta,options.meta)
%>
// 模块初始化时调用，注册模块 并更新配置信息，运行于服务启动时
export default function(){
  return {
    meta:<%=JSON.stringify(meta)%>,
  }
}