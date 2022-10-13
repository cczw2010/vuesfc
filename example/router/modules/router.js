import Vue from "vue"
import VueRouter from 'vue-router'
Vue.use(VueRouter)

const AsyncComponent = () => ({
  // 需要加载的组件 (应该是一个 `Promise` 对象)
  component: new Promise((resolve,reject)=>{
    console.log(">>>>>>>>>>>>AsyncComponent")
    setTimeout(function () {
      // 向 `resolve` 回调传递组件定义
      resolve({
        template: `<div>I am async! ${Date.now()}</div>`,
        beforeRouteEnter(to, from, next) {
          console.log(">>>>>>>>>>>>>>beforeRouteEnter:",to)
          // 在渲染该组件的对应路由被 confirm 前调用
          // 不！能！获取组件实例 `this`
          // 因为当守卫执行前，组件实例还没被创建
          next()
        },
        beforeRouteUpdate(to, from, next) {
          console.log(">>>>>>>>>>>>>>beforeRouteUpdate:",to)
          // 在当前路由改变，但是该组件被复用时调用
          // 举例来说，对于一个带有动态参数的路径 /foo/:id，在 /foo/1 和 /foo/2 之间跳转的时候，
          // 由于会渲染同样的 Foo 组件，因此组件实例会被复用。而这个钩子就会在这个情况下被调用。
          // 可以访问组件实例 `this`
          next()
        },
        beforeRouteLeave(to, from, next) {
          console.log(">>>>>>>>>>>>>>beforeRouteLeave:",to)
          next()
          // 导航离开该组件的对应路由时调用
          // 可以访问组件实例 `this`
        }
      })
    }, 1000)
  }),
  // 异步组件加载时使用的组件
  loading: {template:"<div>component loading...</div>"},
  // 加载失败时使用的组件
  error: {template:"<div>component load error</div>"},
  // 展示加载时组件的延时时间。默认值是 200 (毫秒)
  delay: 200,
  // 如果提供了超时时间且组件加载也超时了，
  // 则使用加载失败时使用的组件。默认值是：`Infinity`
  timeout: 3000
})

Vue.component("AsyncComponent",AsyncComponent)
// 模块初始化时调用，注册模块 并更新配置信息，运行于服务启动时
export default function(){
  const router = new VueRouter({
    mode: 'history',
    routes:[{
        path: '*',
        // component:{
        //   template: '',
        // },
         beforeEnter: (to, from, next) => {
          console.log(">>>>>>>>>>>>>>*  beforeEnter:",to)
          // next()
        }
    }]
  })
  return {
    // vue 初始化时，注入vm的对象 ，没有返回空即可
    inject:{
      router
    }
  }
}