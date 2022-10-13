// 会打包进代码中
import Vue from "vue"
import Notifications from 'vue-notification/src/index.js'

Vue.use(Notifications)
// Vue.use(Notifications,<%=JSON.stringify(options)%> )

// 必须导出默认函数
export default function(){
  return {}
}