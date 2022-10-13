// 会打包进代码中
import Vue from "vue"
<%if(options.ssr){%>
import Notifications from 'vue-notification/dist/ssr.js'
<%}else{%>
import Notifications from 'vue-notification'
<%}%>
Vue.use(Notifications)
// 必须导出默认函数
export default function(){
  return {}
}